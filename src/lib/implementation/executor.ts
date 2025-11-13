/**
 * Implementation Executor
 * Executes implementation steps with Claude's help
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClaudeClient } from "../claude/client";
import { promises as fs } from "fs";
import { join, dirname } from "path";
import { exec } from "child_process";
import { promisify } from "util";
import {
  ImplementationStep,
  ExecutionResult,
  FileChange,
  TaskContext,
  ImplementationError,
} from "./types";
import { CodeValidator } from "./validator";
import { RollbackManager } from "./rollback";

const execAsync = promisify(exec);

export class StepExecutor {
  private client: Anthropic;
  private projectPath: string;
  private validator: CodeValidator;
  private rollbackManager: RollbackManager;
  private dryRun: boolean;

  constructor(
    projectPath: string,
    rollbackManager: RollbackManager,
    dryRun: boolean = false,
  ) {
    this.client = createClaudeClient();
    this.projectPath = projectPath;
    this.validator = new CodeValidator(projectPath);
    this.rollbackManager = rollbackManager;
    this.dryRun = dryRun;
  }

  /**
   * Execute a single step
   */
  async executeStep(
    step: ImplementationStep,
    context: TaskContext,
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      let result: ExecutionResult;

      switch (step.type) {
        case "create_file":
          result = await this.executeCreateFile(step, context);
          break;

        case "modify_file":
          result = await this.executeModifyFile(step, context);
          break;

        case "delete_file":
          result = await this.executeDeleteFile(step);
          break;

        case "run_command":
          result = await this.executeCommand(step);
          break;

        case "test":
          result = await this.executeTest(step);
          break;

        default:
          throw new ImplementationError(
            `Unknown step type: ${step.type}`,
            "UNKNOWN_STEP_TYPE",
            step.id,
            false,
          );
      }

      // Run validations if step completed successfully
      if (result.status === "completed" && step.validation) {
        const validationResults = await this.validator.validate(
          step.id,
          step.validation,
          step.target,
        );
        result.validationResults = validationResults;
      }

      result.duration = Date.now() - startTime;
      return result;
    } catch (error) {
      return {
        stepId: step.id,
        status: "failed",
        error:
          error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute create file step
   */
  private async executeCreateFile(
    step: ImplementationStep,
    context: TaskContext,
  ): Promise<ExecutionResult> {
    if (!step.target) {
      throw new ImplementationError(
        "No target file specified for create_file step",
        "MISSING_TARGET",
        step.id,
      );
    }

    const filePath = join(this.projectPath, step.target);

    // Check if file already exists
    try {
      await fs.access(filePath);
      throw new ImplementationError(
        `File ${step.target} already exists`,
        "FILE_EXISTS",
        step.id,
      );
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }

    // Generate file content if not provided
    let content = step.content;
    if (!content) {
      content = await this.generateFileContent(step, context);
    }

    if (!this.dryRun) {
      // Ensure directory exists
      const dir = dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      // Write file
      await fs.writeFile(filePath, content, "utf-8");

      // Record change for rollback
      await this.rollbackManager.recordChange({
        path: step.target,
        changeType: "create",
        newContent: content,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      stepId: step.id,
      status: "completed",
      output: `Created file: ${step.target}`,
      changes: [
        {
          path: step.target,
          changeType: "create",
          newContent: content,
          timestamp: new Date().toISOString(),
        },
      ],
      duration: 0,
    };
  }

  /**
   * Execute modify file step
   */
  private async executeModifyFile(
    step: ImplementationStep,
    context: TaskContext,
  ): Promise<ExecutionResult> {
    if (!step.target) {
      throw new ImplementationError(
        "No target file specified for modify_file step",
        "MISSING_TARGET",
        step.id,
      );
    }

    const filePath = join(this.projectPath, step.target);

    // Read current content
    let originalContent: string;
    try {
      originalContent = await fs.readFile(filePath, "utf-8");
    } catch (error: any) {
      if (error.code === "ENOENT") {
        throw new ImplementationError(
          `File ${step.target} does not exist`,
          "FILE_NOT_FOUND",
          step.id,
        );
      }
      throw error;
    }

    // Generate new content
    let newContent: string;
    if (step.content) {
      newContent = step.content;
    } else {
      newContent = await this.generateModifiedContent(
        step,
        context,
        originalContent,
      );
    }

    if (!this.dryRun) {
      // Write updated content
      await fs.writeFile(filePath, newContent, "utf-8");

      // Record change for rollback
      await this.rollbackManager.recordChange({
        path: step.target,
        changeType: "modify",
        originalContent,
        newContent,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      stepId: step.id,
      status: "completed",
      output: `Modified file: ${step.target}`,
      changes: [
        {
          path: step.target,
          changeType: "modify",
          originalContent,
          newContent,
          timestamp: new Date().toISOString(),
        },
      ],
      duration: 0,
    };
  }

  /**
   * Execute delete file step
   */
  private async executeDeleteFile(
    step: ImplementationStep,
  ): Promise<ExecutionResult> {
    if (!step.target) {
      throw new ImplementationError(
        "No target file specified for delete_file step",
        "MISSING_TARGET",
        step.id,
      );
    }

    const filePath = join(this.projectPath, step.target);

    // Read content before deletion for rollback
    let originalContent: string;
    try {
      originalContent = await fs.readFile(filePath, "utf-8");
    } catch (error: any) {
      if (error.code === "ENOENT") {
        // File doesn't exist, consider step completed
        return {
          stepId: step.id,
          status: "completed",
          output: `File ${step.target} already deleted`,
          duration: 0,
        };
      }
      throw error;
    }

    if (!this.dryRun) {
      // Delete file
      await fs.unlink(filePath);

      // Record change for rollback
      await this.rollbackManager.recordChange({
        path: step.target,
        changeType: "delete",
        originalContent,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      stepId: step.id,
      status: "completed",
      output: `Deleted file: ${step.target}`,
      changes: [
        {
          path: step.target,
          changeType: "delete",
          originalContent,
          timestamp: new Date().toISOString(),
        },
      ],
      duration: 0,
    };
  }

  /**
   * Execute command step
   */
  private async executeCommand(
    step: ImplementationStep,
  ): Promise<ExecutionResult> {
    if (!step.target) {
      throw new ImplementationError(
        "No command specified for run_command step",
        "MISSING_TARGET",
        step.id,
      );
    }

    if (this.dryRun) {
      return {
        stepId: step.id,
        status: "completed",
        output: `[DRY RUN] Would execute: ${step.target}`,
        duration: 0,
      };
    }

    try {
      const { stdout, stderr } = await execAsync(
        `cd "${this.projectPath}" && ${step.target}`,
        { timeout: 60000 },
      );

      return {
        stepId: step.id,
        status: "completed",
        output: stdout + (stderr ? `\nSTDERR:\n${stderr}` : ""),
        duration: 0,
      };
    } catch (error: any) {
      throw new ImplementationError(
        `Command failed: ${error.message}`,
        "COMMAND_FAILED",
        step.id,
        true,
        error.stderr || error.stdout,
      );
    }
  }

  /**
   * Execute test step
   */
  private async executeTest(step: ImplementationStep): Promise<ExecutionResult> {
    const testCommand = step.target || "npm test";

    if (this.dryRun) {
      return {
        stepId: step.id,
        status: "completed",
        output: `[DRY RUN] Would run tests: ${testCommand}`,
        duration: 0,
      };
    }

    try {
      const { stdout, stderr } = await execAsync(
        `cd "${this.projectPath}" && ${testCommand}`,
        { timeout: 120000 }, // 2 minutes for tests
      );

      const hasFailed =
        stderr.includes("FAIL") ||
        stdout.includes("FAIL") ||
        stdout.includes("failed");

      return {
        stepId: step.id,
        status: hasFailed ? "failed" : "completed",
        output: stdout + (stderr ? `\nSTDERR:\n${stderr}` : ""),
        error: hasFailed ? "Tests failed" : undefined,
        duration: 0,
      };
    } catch (error: any) {
      return {
        stepId: step.id,
        status: "failed",
        output: error.stdout,
        error: `Tests failed: ${error.message}\n${error.stderr}`,
        duration: 0,
      };
    }
  }

  /**
   * Generate content for a new file using Claude
   */
  private async generateFileContent(
    step: ImplementationStep,
    context: TaskContext,
  ): Promise<string> {
    const prompt = `Generate the complete content for a new file.

## File Information
**Path:** ${step.target}
**Purpose:** ${step.description}

## Task Context
**Task:** ${context.title}
**Description:** ${context.description}
**Tech Stack:** ${context.techStack.join(", ")}

## Instructions
Generate the complete, production-ready content for this file. Include:
- Proper imports and dependencies
- Clear documentation/comments
- Error handling where appropriate
- Type safety (if TypeScript)
- Follow best practices for the tech stack

Provide ONLY the file content, no additional explanation or markdown code blocks.`;

    try {
      const response = await this.client.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type from Claude");
      }

      return content.text.trim();
    } catch (error) {
      throw new ImplementationError(
        `Failed to generate file content: ${error instanceof Error ? error.message : String(error)}`,
        "GENERATION_FAILED",
        step.id,
      );
    }
  }

  /**
   * Generate modified content for an existing file using Claude
   */
  private async generateModifiedContent(
    step: ImplementationStep,
    context: TaskContext,
    originalContent: string,
  ): Promise<string> {
    const prompt = `Modify an existing file according to the requirements.

## File Information
**Path:** ${step.target}
**Modification Required:** ${step.description}

## Current Content
\`\`\`
${originalContent}
\`\`\`

## Task Context
**Task:** ${context.title}
**Description:** ${context.description}

## Instructions
Provide the complete modified content for this file. Make sure to:
- Preserve existing functionality unless explicitly changing it
- Maintain code style and patterns
- Add proper error handling
- Include necessary imports
- Keep or improve documentation

Provide ONLY the complete modified file content, no additional explanation or markdown code blocks.`;

    try {
      const response = await this.client.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 8192,
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type from Claude");
      }

      return content.text.trim();
    } catch (error) {
      throw new ImplementationError(
        `Failed to generate modified content: ${error instanceof Error ? error.message : String(error)}`,
        "GENERATION_FAILED",
        step.id,
      );
    }
  }
}
