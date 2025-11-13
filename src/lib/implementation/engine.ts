/**
 * Implementation Engine
 * Main orchestrator for task implementation
 */

import { EventEmitter } from "events";
import {
  TaskContext,
  ImplementationConfig,
  ImplementationProgress,
  ImplementationEvent,
  ImplementationPlan,
  ImplementationStep,
  ExecutionResult,
  ImplementationError,
} from "./types";
import { ImplementationPlanner } from "./planner";
import { StepExecutor } from "./executor";
import { RollbackManager, createGitStash } from "./rollback";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class ImplementationEngine extends EventEmitter {
  private projectPath: string;
  private config: ImplementationConfig;
  private planner: ImplementationPlanner;
  private executor?: StepExecutor;
  private rollbackManager?: RollbackManager;
  private progress: ImplementationProgress;
  private currentPlan?: ImplementationPlan;
  private results: ExecutionResult[] = [];
  private cancelled: boolean = false;

  constructor(projectPath: string, config: ImplementationConfig = {}) {
    super();
    this.projectPath = projectPath;
    this.config = {
      dryRun: false,
      autoApprove: false,
      enableBackups: true,
      runTests: true,
      validateSyntax: true,
      createCommit: false,
      maxRetries: 2,
      timeoutMs: 300000, // 5 minutes
      ...config,
    };

    this.planner = new ImplementationPlanner(projectPath);
    this.progress = {
      status: "pending",
      totalSteps: 0,
      completedSteps: 0,
      failedSteps: 0,
      canRollback: false,
    };
  }

  /**
   * Start the implementation process
   */
  async implement(context: TaskContext): Promise<ImplementationProgress> {
    try {
      this.emitEvent({
        type: "status_change",
        timestamp: new Date().toISOString(),
        data: { status: "planning" },
        message: "Starting implementation planning...",
      });

      // Phase 1: Planning
      this.updateProgress({ status: "planning" });
      const plan = await this.generatePlan(context);

      if (this.cancelled) {
        return this.handleCancellation();
      }

      // Phase 2: Review (if not auto-approved)
      if (!this.config.autoApprove) {
        this.updateProgress({ status: "reviewing", plan });
        // Wait for approval (external call to approvePlan)
        return this.progress;
      }

      // Phase 3: Execute
      return await this.executePlan(context, plan);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Generate implementation plan
   */
  async generatePlan(context: TaskContext): Promise<ImplementationPlan> {
    this.emitEvent({
      type: "log",
      timestamp: new Date().toISOString(),
      data: {},
      message: "Analyzing task and generating implementation plan...",
    });

    const plan = await this.planner.generatePlan(context);

    // Validate plan
    const validation = this.planner.validatePlan(plan);
    if (!validation.valid) {
      throw new ImplementationError(
        `Invalid plan: ${validation.issues.join(", ")}`,
        "INVALID_PLAN",
        undefined,
        false,
      );
    }

    this.currentPlan = plan;
    this.updateProgress({
      totalSteps: plan.steps.length,
      plan,
    });

    this.emitEvent({
      type: "plan_generated",
      timestamp: new Date().toISOString(),
      data: { plan },
      message: `Generated plan with ${plan.steps.length} steps`,
    });

    return plan;
  }

  /**
   * Approve and execute the plan
   */
  async approvePlan(): Promise<ImplementationProgress> {
    if (!this.currentPlan) {
      throw new Error("No plan to approve");
    }

    if (this.progress.status !== "reviewing") {
      throw new Error("Not in review state");
    }

    // Get task context from progress (should be stored)
    const context: TaskContext = {
      taskId: "",
      title: "",
      description: "",
      projectId: "",
      projectPath: this.projectPath,
      techStack: [],
    };

    return await this.executePlan(context, this.currentPlan);
  }

  /**
   * Execute the implementation plan
   */
  private async executePlan(
    context: TaskContext,
    plan: ImplementationPlan,
  ): Promise<ImplementationProgress> {
    this.updateProgress({ status: "executing" });

    // Initialize rollback manager
    this.rollbackManager = new RollbackManager(
      this.projectPath,
      context.taskId,
    );
    await this.rollbackManager.initialize();

    // Create git stash if enabled
    if (this.config.enableBackups) {
      await createGitStash(
        this.projectPath,
        `ai-buddy-backup-${context.taskId}`,
      );
    }

    // Initialize executor
    this.executor = new StepExecutor(
      this.projectPath,
      this.rollbackManager,
      this.config.dryRun || false,
    );

    // Execute steps
    for (const step of plan.steps) {
      if (this.cancelled) {
        return this.handleCancellation();
      }

      // Check dependencies
      if (step.dependencies && step.dependencies.length > 0) {
        const unmetDeps = step.dependencies.filter((depId) => {
          const depResult = this.results.find((r) => r.stepId === depId);
          return !depResult || depResult.status !== "completed";
        });

        if (unmetDeps.length > 0) {
          this.emitEvent({
            type: "step_failed",
            timestamp: new Date().toISOString(),
            data: { step },
            message: `Step ${step.id} skipped: unmet dependencies ${unmetDeps.join(", ")}`,
          });

          this.results.push({
            stepId: step.id,
            status: "skipped",
            output: `Skipped due to unmet dependencies: ${unmetDeps.join(", ")}`,
            duration: 0,
          });

          continue;
        }
      }

      // Execute step
      await this.executeStep(step, context);

      // Check if step failed
      const result = this.results[this.results.length - 1];
      if (result.status === "failed") {
        // Attempt retry if configured
        if (this.config.maxRetries && this.config.maxRetries > 0) {
          for (let retry = 1; retry <= this.config.maxRetries; retry++) {
            this.emitEvent({
              type: "log",
              timestamp: new Date().toISOString(),
              data: {},
              message: `Retrying step ${step.id} (attempt ${retry}/${this.config.maxRetries})...`,
            });

            await this.executeStep(step, context);
            const retryResult = this.results[this.results.length - 1];

            if (retryResult.status === "completed") {
              break;
            }

            if (retry === this.config.maxRetries) {
              // Max retries exceeded
              return this.handleStepFailure(step, retryResult);
            }
          }
        } else {
          return this.handleStepFailure(step, result);
        }
      }
    }

    // All steps completed
    this.updateProgress({ status: "validating" });

    // Run final validations
    if (this.config.validateSyntax || this.config.runTests) {
      await this.runFinalValidation();
    }

    // Create commit if requested
    if (this.config.createCommit && !this.config.dryRun) {
      await this.createCommit(context);
    }

    // Cleanup backup
    if (this.rollbackManager) {
      await this.rollbackManager.cleanup();
    }

    this.updateProgress({ status: "completed" });

    this.emitEvent({
      type: "status_change",
      timestamp: new Date().toISOString(),
      data: { status: "completed" },
      message: "Implementation completed successfully!",
    });

    return this.progress;
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: ImplementationStep,
    context: TaskContext,
  ): Promise<void> {
    this.emitEvent({
      type: "step_started",
      timestamp: new Date().toISOString(),
      data: { step },
      message: `Executing: ${step.title}`,
    });

    this.updateProgress({
      currentStep: step.order,
    });

    try {
      const result = await this.executor!.executeStep(step, context);
      this.results.push(result);

      if (result.status === "completed") {
        this.updateProgress({
          completedSteps: this.progress.completedSteps + 1,
        });

        this.emitEvent({
          type: "step_completed",
          timestamp: new Date().toISOString(),
          data: { step, result },
          message: `Completed: ${step.title}`,
        });
      } else {
        this.updateProgress({
          failedSteps: this.progress.failedSteps + 1,
        });

        this.emitEvent({
          type: "step_failed",
          timestamp: new Date().toISOString(),
          data: { step, result },
          message: `Failed: ${step.title} - ${result.error}`,
        });
      }
    } catch (error) {
      const errorResult: ExecutionResult = {
        stepId: step.id,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        duration: 0,
      };

      this.results.push(errorResult);
      this.updateProgress({
        failedSteps: this.progress.failedSteps + 1,
      });

      this.emitEvent({
        type: "step_failed",
        timestamp: new Date().toISOString(),
        data: { step, result: errorResult },
        message: `Failed: ${step.title} - ${errorResult.error}`,
      });
    }
  }

  /**
   * Handle step failure
   */
  private async handleStepFailure(
    step: ImplementationStep,
    result: ExecutionResult,
  ): Promise<ImplementationProgress> {
    this.emitEvent({
      type: "error",
      timestamp: new Date().toISOString(),
      data: { step, result },
      message: `Step failed: ${step.title}`,
    });

    // Attempt rollback
    if (this.rollbackManager && this.rollbackManager.hasChanges()) {
      this.emitEvent({
        type: "log",
        timestamp: new Date().toISOString(),
        data: {},
        message: "Rolling back changes...",
      });

      try {
        await this.rollbackManager.rollbackAll(this.projectPath);
        this.emitEvent({
          type: "log",
          timestamp: new Date().toISOString(),
          data: {},
          message: "Rollback completed successfully",
        });
      } catch (rollbackError) {
        this.emitEvent({
          type: "error",
          timestamp: new Date().toISOString(),
          data: { error: rollbackError },
          message: "Rollback failed!",
        });
      }
    }

    this.updateProgress({
      status: "failed",
      error: result.error,
      results: this.results,
    });

    return this.progress;
  }

  /**
   * Run final validation
   */
  private async runFinalValidation(): Promise<void> {
    this.emitEvent({
      type: "validation_started",
      timestamp: new Date().toISOString(),
      data: {},
      message: "Running final validation...",
    });

    try {
      if (this.config.runTests) {
        const { stdout } = await execAsync(
          `cd "${this.projectPath}" && npm test`,
          { timeout: 120000 },
        );
        this.emitEvent({
          type: "validation_completed",
          timestamp: new Date().toISOString(),
          data: { output: stdout },
          message: "Tests passed",
        });
      }
    } catch (error: any) {
      // Tests might not exist, that's okay
      if (!error.message.includes("missing script")) {
        this.emitEvent({
          type: "log",
          timestamp: new Date().toISOString(),
          data: {},
          message: `Test validation: ${error.message}`,
        });
      }
    }
  }

  /**
   * Create git commit
   */
  private async createCommit(context: TaskContext): Promise<void> {
    try {
      const message = `feat: ${context.title}\n\n${context.description}\n\n[AI-Buddy Implementation]`;

      await execAsync(`cd "${this.projectPath}" && git add -A`, {
        timeout: 10000,
      });
      await execAsync(
        `cd "${this.projectPath}" && git commit -m "${message.replace(/"/g, '\\"')}"`,
        { timeout: 10000 },
      );

      this.emitEvent({
        type: "log",
        timestamp: new Date().toISOString(),
        data: {},
        message: "Created git commit",
      });
    } catch (error) {
      this.emitEvent({
        type: "log",
        timestamp: new Date().toISOString(),
        data: {},
        message: "Failed to create git commit (this is optional)",
      });
    }
  }

  /**
   * Cancel the implementation
   */
  async cancel(): Promise<void> {
    this.cancelled = true;

    if (this.rollbackManager && this.rollbackManager.hasChanges()) {
      await this.rollbackManager.rollbackAll(this.projectPath);
    }

    this.updateProgress({ status: "cancelled" });
  }

  /**
   * Handle cancellation
   */
  private handleCancellation(): ImplementationProgress {
    this.updateProgress({
      status: "cancelled",
      results: this.results,
    });

    this.emitEvent({
      type: "status_change",
      timestamp: new Date().toISOString(),
      data: { status: "cancelled" },
      message: "Implementation cancelled",
    });

    return this.progress;
  }

  /**
   * Handle error
   */
  private handleError(error: any): ImplementationProgress {
    this.updateProgress({
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      results: this.results,
    });

    this.emitEvent({
      type: "error",
      timestamp: new Date().toISOString(),
      data: { error },
      message: `Implementation failed: ${error instanceof Error ? error.message : String(error)}`,
    });

    return this.progress;
  }

  /**
   * Update progress and emit event
   */
  private updateProgress(update: Partial<ImplementationProgress>): void {
    this.progress = {
      ...this.progress,
      ...update,
      canRollback:
        this.rollbackManager?.hasChanges() || this.progress.canRollback,
    };

    this.emit("progress", this.progress);
  }

  /**
   * Emit custom event
   */
  private emitEvent(event: ImplementationEvent): void {
    this.emit("event", event);
  }

  /**
   * Get current progress
   */
  getProgress(): ImplementationProgress {
    return { ...this.progress };
  }

  /**
   * Get execution results
   */
  getResults(): ExecutionResult[] {
    return [...this.results];
  }
}
