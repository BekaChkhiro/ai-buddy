/**
 * Code Validator
 * Validates generated code for syntax, types, and quality
 */

import { promises as fs } from "fs";
import { join } from "path";
import { ValidationRule, ValidationResult, ValidationError } from "./types";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class CodeValidator {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Validate a step's changes
   */
  async validate(
    stepId: string,
    rules: ValidationRule[],
    filePath?: string,
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const rule of rules) {
      try {
        const result = await this.validateRule(rule, filePath);
        results.push(result);
      } catch (error) {
        results.push({
          rule,
          passed: false,
          message: `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    // Check if any validation failed
    const failed = results.filter((r) => !r.passed);
    if (failed.length > 0) {
      throw new ValidationError(
        `${failed.length} validation(s) failed`,
        results,
        stepId,
      );
    }

    return results;
  }

  /**
   * Validate a single rule
   */
  private async validateRule(
    rule: ValidationRule,
    filePath?: string,
  ): Promise<ValidationResult> {
    switch (rule.type) {
      case "syntax":
        return await this.validateSyntax(rule, filePath);

      case "type_check":
        return await this.validateTypes(rule);

      case "lint":
        return await this.validateLint(rule, filePath);

      case "test":
        return await this.validateTests(rule);

      case "custom":
        return await this.validateCustom(rule);

      default:
        return {
          rule,
          passed: false,
          message: `Unknown validation type: ${rule.type}`,
        };
    }
  }

  /**
   * Validate syntax of a file
   */
  private async validateSyntax(
    rule: ValidationRule,
    filePath?: string,
  ): Promise<ValidationResult> {
    if (!filePath) {
      return {
        rule,
        passed: false,
        message: "No file path provided for syntax validation",
      };
    }

    const ext = filePath.split(".").pop()?.toLowerCase();

    try {
      // Read file content
      const content = await fs.readFile(
        join(this.projectPath, filePath),
        "utf-8",
      );

      // Basic syntax checks based on file type
      switch (ext) {
        case "ts":
        case "tsx":
        case "js":
        case "jsx":
          return await this.validateJavaScriptSyntax(rule, filePath, content);

        case "json":
          return await this.validateJsonSyntax(rule, content);

        case "py":
          return await this.validatePythonSyntax(rule, filePath);

        default:
          return {
            rule,
            passed: true,
            message: `No syntax validator for .${ext} files`,
          };
      }
    } catch (error) {
      return {
        rule,
        passed: false,
        message: `Syntax validation error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Validate JavaScript/TypeScript syntax
   */
  private async validateJavaScriptSyntax(
    rule: ValidationRule,
    filePath: string,
    content: string,
  ): Promise<ValidationResult> {
    try {
      // Check for basic syntax issues
      const issues: string[] = [];

      // Check for unclosed brackets/braces/parens
      const opens = (content.match(/[{[(]/g) || []).length;
      const closes = (content.match(/[}\])]/g) || []).length;
      if (opens !== closes) {
        issues.push("Mismatched brackets, braces, or parentheses");
      }

      // Check for unclosed strings
      const singleQuotes = (content.match(/(?<!\\)'/g) || []).length;
      const doubleQuotes = (content.match(/(?<!\\)"/g) || []).length;
      const backticks = (content.match(/(?<!\\)`/g) || []).length;

      if (singleQuotes % 2 !== 0) issues.push("Unclosed single quote");
      if (doubleQuotes % 2 !== 0) issues.push("Unclosed double quote");
      if (backticks % 2 !== 0) issues.push("Unclosed template literal");

      if (issues.length > 0) {
        return {
          rule,
          passed: false,
          message: `Syntax issues found: ${issues.join(", ")}`,
        };
      }

      // Try to use TypeScript compiler if available
      if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
        try {
          const { stdout, stderr } = await execAsync(
            `cd "${this.projectPath}" && npx tsc --noEmit "${filePath}"`,
            { timeout: 10000 },
          );

          if (stderr && !stderr.includes("error TS")) {
            return {
              rule,
              passed: true,
              message: "Syntax is valid",
              output: stdout,
            };
          }

          return {
            rule,
            passed: false,
            message: "TypeScript syntax errors found",
            output: stderr,
          };
        } catch (error: any) {
          if (error.stderr && error.stderr.includes("error TS")) {
            return {
              rule,
              passed: false,
              message: "TypeScript syntax errors found",
              output: error.stderr,
            };
          }
          // If tsc is not available, fall back to basic checks
        }
      }

      return {
        rule,
        passed: true,
        message: "Basic syntax validation passed",
      };
    } catch (error) {
      return {
        rule,
        passed: false,
        message: `Syntax validation failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Validate JSON syntax
   */
  private async validateJsonSyntax(
    rule: ValidationRule,
    content: string,
  ): Promise<ValidationResult> {
    try {
      JSON.parse(content);
      return {
        rule,
        passed: true,
        message: "Valid JSON syntax",
      };
    } catch (error) {
      return {
        rule,
        passed: false,
        message: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Validate Python syntax
   */
  private async validatePythonSyntax(
    rule: ValidationRule,
    filePath: string,
  ): Promise<ValidationResult> {
    try {
      const { stdout, stderr } = await execAsync(
        `python3 -m py_compile "${join(this.projectPath, filePath)}"`,
        { timeout: 10000 },
      );

      return {
        rule,
        passed: !stderr,
        message: stderr ? "Python syntax errors found" : "Valid Python syntax",
        output: stderr || stdout,
      };
    } catch (error: any) {
      return {
        rule,
        passed: false,
        message: `Python syntax validation failed: ${error.message}`,
        output: error.stderr,
      };
    }
  }

  /**
   * Validate TypeScript types
   */
  private async validateTypes(
    rule: ValidationRule,
  ): Promise<ValidationResult> {
    try {
      const { stdout, stderr } = await execAsync(
        `cd "${this.projectPath}" && npm run type-check`,
        { timeout: 30000 },
      );

      const hasErrors = stderr.includes("error TS") || stdout.includes("error TS");

      return {
        rule,
        passed: !hasErrors,
        message: hasErrors ? "Type errors found" : "Type checking passed",
        output: stderr || stdout,
      };
    } catch (error: any) {
      // Check if it's because type-check script doesn't exist
      if (error.message.includes("missing script")) {
        return {
          rule,
          passed: true,
          message: "Type checking skipped (no type-check script)",
        };
      }

      return {
        rule,
        passed: false,
        message: "Type checking failed",
        output: error.stderr || error.stdout,
      };
    }
  }

  /**
   * Validate with linter
   */
  private async validateLint(
    rule: ValidationRule,
    filePath?: string,
  ): Promise<ValidationResult> {
    try {
      const target = filePath || ".";
      const { stdout, stderr } = await execAsync(
        `cd "${this.projectPath}" && npm run lint "${target}"`,
        { timeout: 30000 },
      );

      const hasErrors =
        stderr.includes("error") ||
        stdout.includes("✖") ||
        stdout.includes("error");

      return {
        rule,
        passed: !hasErrors,
        message: hasErrors ? "Linting errors found" : "Linting passed",
        output: stderr || stdout,
      };
    } catch (error: any) {
      // Check if it's because lint script doesn't exist
      if (error.message.includes("missing script")) {
        return {
          rule,
          passed: true,
          message: "Linting skipped (no lint script)",
        };
      }

      return {
        rule,
        passed: false,
        message: "Linting failed",
        output: error.stderr || error.stdout,
      };
    }
  }

  /**
   * Validate by running tests
   */
  private async validateTests(rule: ValidationRule): Promise<ValidationResult> {
    try {
      const { stdout, stderr } = await execAsync(
        `cd "${this.projectPath}" && npm test`,
        { timeout: 60000 },
      );

      const hasFailed =
        stderr.includes("FAIL") ||
        stdout.includes("FAIL") ||
        stdout.includes("failed");

      return {
        rule,
        passed: !hasFailed,
        message: hasFailed ? "Tests failed" : "Tests passed",
        output: stderr || stdout,
      };
    } catch (error: any) {
      // Check if it's because test script doesn't exist
      if (error.message.includes("missing script")) {
        return {
          rule,
          passed: true,
          message: "Tests skipped (no test script)",
        };
      }

      return {
        rule,
        passed: false,
        message: "Test execution failed",
        output: error.stderr || error.stdout,
      };
    }
  }

  /**
   * Validate with custom command
   */
  private async validateCustom(
    rule: ValidationRule,
  ): Promise<ValidationResult> {
    if (!rule.command) {
      return {
        rule,
        passed: false,
        message: "No command provided for custom validation",
      };
    }

    try {
      const { stdout, stderr } = await execAsync(
        `cd "${this.projectPath}" && ${rule.command}`,
        { timeout: 30000 },
      );

      let passed = true;

      // Check error pattern
      if (rule.errorPattern) {
        const errorRegex = new RegExp(rule.errorPattern);
        if (errorRegex.test(stdout) || errorRegex.test(stderr)) {
          passed = false;
        }
      }

      // Check success pattern
      if (rule.successPattern) {
        const successRegex = new RegExp(rule.successPattern);
        if (!successRegex.test(stdout) && !successRegex.test(stderr)) {
          passed = false;
        }
      }

      return {
        rule,
        passed,
        message: passed
          ? "Custom validation passed"
          : "Custom validation failed",
        output: stderr || stdout,
      };
    } catch (error: any) {
      return {
        rule,
        passed: false,
        message: `Custom validation failed: ${error.message}`,
        output: error.stderr || error.stdout,
      };
    }
  }

  /**
   * Detect and suggest tests for a file
   */
  async detectTests(filePath: string): Promise<string[]> {
    const testPatterns = [
      filePath.replace(/\.(ts|js|tsx|jsx)$/, ".test.$1"),
      filePath.replace(/\.(ts|js|tsx|jsx)$/, ".spec.$1"),
      filePath.replace("/src/", "/tests/"),
      filePath.replace("/lib/", "/__tests__/"),
    ];

    const existingTests: string[] = [];

    for (const pattern of testPatterns) {
      try {
        await fs.access(join(this.projectPath, pattern));
        existingTests.push(pattern);
      } catch {
        // Test file doesn't exist
      }
    }

    return existingTests;
  }
}

/**
 * Quick syntax check for code string
 */
export function quickSyntaxCheck(code: string, language: string): boolean {
  try {
    switch (language) {
      case "json":
        JSON.parse(code);
        return true;

      case "javascript":
      case "typescript":
        // Basic bracket matching
        const opens = (code.match(/[{[(]/g) || []).length;
        const closes = (code.match(/[}\])]/g) || []).length;
        return opens === closes;

      default:
        return true; // Can't validate, assume valid
    }
  } catch {
    return false;
  }
}
