/**
 * Implementation Planner
 * Uses Claude to break down tasks into executable steps
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClaudeClient } from "../claude/client";
import { TaskContext, ImplementationPlan, ImplementationStep } from "./types";
import { promises as fs } from "fs";
import { join } from "path";

export class ImplementationPlanner {
  private client: Anthropic;
  private projectPath: string;

  constructor(projectPath: string) {
    this.client = createClaudeClient();
    this.projectPath = projectPath;
  }

  /**
   * Generate an implementation plan for a task
   */
  async generatePlan(context: TaskContext): Promise<ImplementationPlan> {
    try {
      // Gather project context
      const projectContext = await this.gatherProjectContext(context);

      // Create prompt for Claude
      const prompt = this.buildPlanningPrompt(context, projectContext);

      // Call Claude to generate plan
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

      // Parse response
      const content = response.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type from Claude");
      }

      // Extract and parse the implementation plan
      const plan = this.parsePlanResponse(content.text);

      return plan;
    } catch (error) {
      console.error("Error generating implementation plan:", error);
      throw new Error(
        `Failed to generate plan: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Gather project context from files and structure
   */
  private async gatherProjectContext(
    context: TaskContext,
  ): Promise<string> {
    const contextParts: string[] = [];

    // Add related files content
    if (context.relatedFiles && context.relatedFiles.length > 0) {
      contextParts.push("## Related Files\n");
      for (const file of context.relatedFiles.slice(0, 5)) {
        // Limit to 5 files
        contextParts.push(`### ${file.path}\n\`\`\`${file.language || ""}\n${file.content}\n\`\`\`\n`);
      }
    }

    // Add existing files list
    if (context.existingFiles && context.existingFiles.length > 0) {
      contextParts.push("\n## Project Structure\n");
      contextParts.push(context.existingFiles.slice(0, 50).join("\n")); // Limit to 50 files
    }

    // Try to read package.json for dependencies
    try {
      const packageJson = await fs.readFile(
        join(this.projectPath, "package.json"),
        "utf-8",
      );
      const pkg = JSON.parse(packageJson);
      contextParts.push("\n## Dependencies\n");
      if (pkg.dependencies) {
        contextParts.push(
          "Dependencies: " + Object.keys(pkg.dependencies).join(", "),
        );
      }
      if (pkg.devDependencies) {
        contextParts.push(
          "DevDependencies: " + Object.keys(pkg.devDependencies).join(", "),
        );
      }
    } catch {
      // package.json not found or not readable
    }

    return contextParts.join("\n");
  }

  /**
   * Build the planning prompt for Claude
   */
  private buildPlanningPrompt(
    context: TaskContext,
    projectContext: string,
  ): string {
    return `You are an expert software engineer creating a detailed implementation plan.

## Task Information
**Title:** ${context.title}
**Description:** ${context.description}
${context.acceptance_criteria ? `**Acceptance Criteria:**\n${context.acceptance_criteria}` : ""}

## Tech Stack
${context.techStack.join(", ")}

${projectContext}

## Instructions
Create a detailed, step-by-step implementation plan for this task. Each step should be:
1. Specific and actionable
2. Ordered logically with dependencies considered
3. Include validation requirements
4. Specify the type of operation (create_file, modify_file, delete_file, run_command, test)

Format your response as a JSON object with this structure:
\`\`\`json
{
  "steps": [
    {
      "id": "step-1",
      "title": "Brief step title",
      "description": "Detailed description of what to do",
      "type": "create_file|modify_file|delete_file|run_command|test",
      "target": "file/path/or/command",
      "order": 1,
      "dependencies": [],
      "validation": [
        {
          "type": "syntax|type_check|lint|test",
          "command": "optional command to run"
        }
      ]
    }
  ],
  "estimatedDuration": 15,
  "risks": ["potential risk 1", "potential risk 2"],
  "dependencies": ["required package 1", "required package 2"]
}
\`\`\`

Important guidelines:
- Break complex changes into smaller, testable steps
- Include validation after each significant change
- Consider existing code and avoid breaking changes
- Specify exact file paths when possible
- For modifications, clearly describe what changes to make
- Include test steps if applicable
- Consider error handling and edge cases

Provide ONLY the JSON response, no additional text.`;
  }

  /**
   * Parse Claude's response into an implementation plan
   */
  private parsePlanResponse(response: string): ImplementationPlan {
    try {
      // Extract JSON from response (handle code blocks)
      let jsonStr = response.trim();

      // Remove markdown code blocks if present
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```\s*$/g, "");
      }

      const parsed = JSON.parse(jsonStr);

      // Validate and transform steps
      const steps: ImplementationStep[] = parsed.steps.map(
        (step: any, index: number) => ({
          id: step.id || `step-${index + 1}`,
          title: step.title,
          description: step.description,
          type: step.type,
          target: step.target,
          content: step.content,
          order: step.order || index + 1,
          status: "pending" as const,
          dependencies: step.dependencies || [],
          validation: step.validation || [],
        }),
      );

      return {
        steps,
        estimatedDuration: parsed.estimatedDuration,
        risks: parsed.risks || [],
        dependencies: parsed.dependencies || [],
      };
    } catch (error) {
      console.error("Failed to parse plan response:", error);
      console.error("Response was:", response);

      // Fallback: create a simple single-step plan
      return {
        steps: [
          {
            id: "step-1",
            title: "Implement task",
            description: "Implement the task as described",
            type: "modify_file",
            order: 1,
            status: "pending",
            dependencies: [],
            validation: [
              {
                type: "syntax",
              },
            ],
          },
        ],
        estimatedDuration: 10,
        risks: ["Unable to generate detailed plan"],
        dependencies: [],
      };
    }
  }

  /**
   * Refine a plan based on feedback
   */
  async refinePlan(
    originalPlan: ImplementationPlan,
    feedback: string,
    context: TaskContext,
  ): Promise<ImplementationPlan> {
    const prompt = `You are refining an implementation plan based on user feedback.

## Original Plan
${JSON.stringify(originalPlan, null, 2)}

## User Feedback
${feedback}

## Task Context
**Title:** ${context.title}
**Description:** ${context.description}

Please provide an updated implementation plan that addresses the feedback while maintaining the same JSON structure as the original plan.

Provide ONLY the JSON response, no additional text.`;

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

      return this.parsePlanResponse(content.text);
    } catch (error) {
      console.error("Error refining plan:", error);
      // Return original plan if refinement fails
      return originalPlan;
    }
  }

  /**
   * Validate a plan for completeness and feasibility
   */
  validatePlan(plan: ImplementationPlan): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check if plan has steps
    if (!plan.steps || plan.steps.length === 0) {
      issues.push("Plan has no steps");
      return { valid: false, issues };
    }

    // Check each step
    for (const step of plan.steps) {
      if (!step.id) {
        issues.push(`Step ${step.order} is missing an ID`);
      }

      if (!step.title) {
        issues.push(`Step ${step.order} is missing a title`);
      }

      if (!step.type) {
        issues.push(`Step ${step.order} is missing a type`);
      }

      // Check for circular dependencies
      if (step.dependencies && step.dependencies.includes(step.id)) {
        issues.push(`Step ${step.id} has a circular dependency`);
      }
    }

    // Check for orphaned dependencies
    const stepIds = new Set(plan.steps.map((s) => s.id));
    for (const step of plan.steps) {
      if (step.dependencies) {
        for (const depId of step.dependencies) {
          if (!stepIds.has(depId)) {
            issues.push(
              `Step ${step.id} depends on non-existent step ${depId}`,
            );
          }
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
