# Implementation Engine Examples

Practical examples of using the Implementation Engine in various scenarios.

## Table of Contents

1. [Basic Implementation](#basic-implementation)
2. [Dry Run Mode](#dry-run-mode)
3. [Custom Configuration](#custom-configuration)
4. [Event Handling](#event-handling)
5. [Plan Review Workflow](#plan-review-workflow)
6. [Error Handling](#error-handling)
7. [React Component Integration](#react-component-integration)
8. [API Integration](#api-integration)

## Basic Implementation

Simple implementation with default settings:

```typescript
import { ImplementationEngine, TaskContext } from "@/lib/implementation";

async function implementTask(taskId: string) {
  const engine = new ImplementationEngine("/path/to/project");

  const context: TaskContext = {
    taskId,
    title: "Add user profile page",
    description: "Create a user profile page with edit functionality",
    projectId: "proj-123",
    projectPath: "/path/to/project",
    techStack: ["Next.js", "TypeScript", "TailwindCSS"],
  };

  const result = await engine.implement(context);

  if (result.status === "completed") {
    console.log("✅ Implementation successful!");
    console.log(`Completed ${result.completedSteps}/${result.totalSteps} steps`);
  } else {
    console.error("❌ Implementation failed:", result.error);
  }
}
```

## Dry Run Mode

Test implementation without making actual changes:

```typescript
import { ImplementationEngine } from "@/lib/implementation";

async function previewImplementation(context: TaskContext) {
  const engine = new ImplementationEngine(context.projectPath, {
    dryRun: true,
    validateSyntax: false,
    runTests: false,
  });

  // Listen to events to see what would happen
  engine.on("event", (event) => {
    if (event.type === "step_started") {
      console.log(`[DRY RUN] Would execute: ${event.data.step.title}`);
    }
  });

  const result = await engine.implement(context);

  console.log("\nPlan Preview:");
  result.plan?.steps.forEach((step, index) => {
    console.log(`${index + 1}. [${step.type}] ${step.title}`);
    if (step.target) console.log(`   Target: ${step.target}`);
  });

  return result;
}
```

## Custom Configuration

Implementation with custom validation and git commit:

```typescript
async function implementWithCommit(context: TaskContext) {
  const engine = new ImplementationEngine(context.projectPath, {
    dryRun: false,
    enableBackups: true,
    validateSyntax: true,
    runTests: true,
    createCommit: true, // Automatically create git commit
    maxRetries: 3, // Retry failed steps up to 3 times
    timeoutMs: 600000, // 10 minutes timeout
  });

  engine.on("event", (event) => {
    if (event.type === "step_completed") {
      console.log(`✅ ${event.data.step.title}`);
    } else if (event.type === "step_failed") {
      console.log(`❌ ${event.data.step.title}`);
      console.log(`   Error: ${event.data.result.error}`);
    }
  });

  const result = await engine.implement(context);

  if (result.status === "completed") {
    console.log("\n🎉 Implementation completed and committed to git!");
  }

  return result;
}
```

## Event Handling

Comprehensive event monitoring:

```typescript
import { ImplementationEngine, ImplementationEvent } from "@/lib/implementation";

function createEngineWithLogging(projectPath: string) {
  const engine = new ImplementationEngine(projectPath);

  // Progress updates
  engine.on("progress", (progress) => {
    console.log(`\n[${progress.status.toUpperCase()}]`);
    console.log(
      `Progress: ${progress.completedSteps}/${progress.totalSteps} steps`
    );
    if (progress.currentStep) {
      console.log(`Current: Step ${progress.currentStep}`);
    }
  });

  // Detailed event logging
  engine.on("event", (event: ImplementationEvent) => {
    const timestamp = new Date(event.timestamp).toLocaleTimeString();

    switch (event.type) {
      case "plan_generated":
        console.log(`[${timestamp}] 📋 Plan generated with ${event.data.plan.steps.length} steps`);
        break;

      case "step_started":
        console.log(`[${timestamp}] ▶️  ${event.message}`);
        break;

      case "step_completed":
        const duration = event.data.result.duration;
        console.log(`[${timestamp}] ✅ ${event.message} (${duration}ms)`);
        break;

      case "step_failed":
        console.log(`[${timestamp}] ❌ ${event.message}`);
        if (event.data.result.error) {
          console.log(`   Error: ${event.data.result.error}`);
        }
        break;

      case "validation_started":
        console.log(`[${timestamp}] 🔍 ${event.message}`);
        break;

      case "validation_completed":
        console.log(`[${timestamp}] ✓ ${event.message}`);
        break;

      case "error":
        console.error(`[${timestamp}] 💥 ${event.message}`);
        break;

      default:
        console.log(`[${timestamp}] ${event.message}`);
    }
  });

  return engine;
}

// Usage
async function runWithLogging(context: TaskContext) {
  const engine = createEngineWithLogging(context.projectPath);
  return await engine.implement(context);
}
```

## Plan Review Workflow

Implementation with manual plan approval:

```typescript
async function implementWithReview(context: TaskContext) {
  const engine = new ImplementationEngine(context.projectPath, {
    autoApprove: false, // Require manual approval
  });

  // Start implementation (stops at review phase)
  const result = await engine.implement(context);

  if (result.status === "reviewing") {
    console.log("\n📋 Implementation Plan:");
    console.log("=".repeat(50));

    result.plan?.steps.forEach((step, index) => {
      console.log(`\n${index + 1}. ${step.title}`);
      console.log(`   Type: ${step.type}`);
      console.log(`   Description: ${step.description}`);
      if (step.target) {
        console.log(`   Target: ${step.target}`);
      }
      if (step.validation && step.validation.length > 0) {
        console.log(
          `   Validation: ${step.validation.map((v) => v.type).join(", ")}`
        );
      }
    });

    if (result.plan?.risks && result.plan.risks.length > 0) {
      console.log("\n⚠️  Risks:");
      result.plan.risks.forEach((risk) => console.log(`   - ${risk}`));
    }

    if (result.plan?.dependencies && result.plan.dependencies.length > 0) {
      console.log("\n📦 Required Dependencies:");
      result.plan.dependencies.forEach((dep) => console.log(`   - ${dep}`));
    }

    console.log("\n" + "=".repeat(50));

    // Get user approval (example with readline)
    const readline = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      readline.question("\nApprove this plan? (yes/no): ", async (answer) => {
        readline.close();

        if (answer.toLowerCase() === "yes" || answer.toLowerCase() === "y") {
          console.log("\n✅ Plan approved! Continuing implementation...");
          const finalResult = await engine.approvePlan();
          resolve(finalResult);
        } else {
          console.log("\n❌ Plan rejected. Implementation cancelled.");
          await engine.cancel();
          resolve(result);
        }
      });
    });
  }

  return result;
}
```

## Error Handling

Robust error handling and recovery:

```typescript
import {
  ImplementationEngine,
  ImplementationError,
  ValidationError,
  RollbackError,
} from "@/lib/implementation";

async function implementWithErrorHandling(context: TaskContext) {
  const engine = new ImplementationEngine(context.projectPath, {
    enableBackups: true,
    maxRetries: 2,
  });

  try {
    const result = await engine.implement(context);

    if (result.status === "failed") {
      console.error("Implementation failed:", result.error);

      // Check if we can retry
      if (result.canRollback) {
        console.log("Changes have been rolled back");
      }

      // Analyze failures
      const failedSteps = result.results?.filter((r) => r.status === "failed");
      if (failedSteps) {
        console.log(`\n${failedSteps.length} step(s) failed:`);
        failedSteps.forEach((step) => {
          console.log(`- ${step.stepId}: ${step.error}`);
        });
      }

      return { success: false, result };
    }

    return { success: true, result };
  } catch (error) {
    console.error("Unexpected error:", error);

    if (error instanceof ValidationError) {
      console.error("Validation failed:");
      error.validationResults.forEach((result) => {
        if (!result.passed) {
          console.error(`  - ${result.rule.type}: ${result.message}`);
        }
      });
    } else if (error instanceof RollbackError) {
      console.error("Rollback failed! Manual intervention required.");
      console.error("Failed changes:", error.failedChanges);
    } else if (error instanceof ImplementationError) {
      console.error(`Implementation error [${error.code}]:`, error.message);
      if (error.recoverable) {
        console.log("This error may be recoverable. Try again.");
      }
    }

    return { success: false, error };
  }
}
```

## React Component Integration

Using the implementation engine in a React component:

```typescript
"use client";

import { useState, useEffect } from "react";
import { ImplementationEngine, ImplementationProgress } from "@/lib/implementation";

export function TaskImplementor({ task, projectPath }: Props) {
  const [progress, setProgress] = useState<ImplementationProgress | null>(null);
  const [isImplementing, setIsImplementing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const startImplementation = async () => {
    setIsImplementing(true);
    setLogs([]);

    try {
      // Make API call to start implementation
      const response = await fetch(`/api/tasks/${task.id}/implement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            dryRun: false,
            enableBackups: true,
            runTests: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start implementation");
      }

      // Connect to SSE for progress updates
      const eventSource = new EventSource(`/api/tasks/${task.id}/implement`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setProgress(data);
      };

      eventSource.addEventListener("implementation", (event) => {
        const data = JSON.parse(event.data);
        setLogs((prev) => [...prev, `[${data.type}] ${data.message}`]);
      });

      eventSource.onerror = () => {
        eventSource.close();
        setIsImplementing(false);
      };
    } catch (error) {
      console.error("Error starting implementation:", error);
      setIsImplementing(false);
    }
  };

  const cancelImplementation = async () => {
    try {
      await fetch(`/api/tasks/${task.id}/implement`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error cancelling implementation:", error);
    }
  };

  return (
    <div>
      <button
        onClick={startImplementation}
        disabled={isImplementing}
      >
        {isImplementing ? "Implementing..." : "Start Implementation"}
      </button>

      {isImplementing && (
        <button onClick={cancelImplementation}>Cancel</button>
      )}

      {progress && (
        <div>
          <div>Status: {progress.status}</div>
          <div>
            Progress: {progress.completedSteps}/{progress.totalSteps}
          </div>
          {progress.error && <div>Error: {progress.error}</div>}
        </div>
      )}

      <div>
        {logs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
      </div>
    </div>
  );
}
```

## API Integration

Server-side implementation with API endpoints:

```typescript
// app/api/tasks/[id]/implement/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ImplementationEngine, TaskContext } from "@/lib/implementation";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Get task from database
    const task = await getTask(id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Get project details
    const project = await getProject(task.project_id);

    // Create context
    const context: TaskContext = {
      taskId: id,
      title: task.title,
      description: task.description,
      projectId: project.id,
      projectPath: project.folder_path,
      techStack: project.tech_stack,
    };

    // Create engine
    const engine = new ImplementationEngine(
      context.projectPath,
      body.config || {}
    );

    // Store active engine
    activeImplementations.set(id, engine);

    // Start implementation (async)
    engine
      .implement(context)
      .then(async (result) => {
        // Update task status
        await updateTaskStatus(id, result.status);

        // Cleanup
        activeImplementations.delete(id);
      })
      .catch(async (error) => {
        // Handle error
        await updateTaskStatus(id, "failed");
        activeImplementations.delete(id);
      });

    return NextResponse.json({
      success: true,
      message: "Implementation started",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// SSE endpoint for progress
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const engine = activeImplementations.get(id);

  if (!engine) {
    return NextResponse.json(
      { error: "No active implementation" },
      { status: 404 }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial progress
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify(engine.getProgress())}\n\n`
        )
      );

      // Listen for updates
      const progressHandler = (progress: any) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(progress)}\n\n`)
        );
      };

      engine.on("progress", progressHandler);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        engine.off("progress", progressHandler);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

## Advanced: Custom Step Executor

Creating a custom step executor for specialized operations:

```typescript
import { StepExecutor } from "@/lib/implementation";

class CustomExecutor extends StepExecutor {
  async executeCustomStep(step: ImplementationStep): Promise<ExecutionResult> {
    // Custom implementation logic
    if (step.type === "database_migration") {
      return await this.executeDatabaseMigration(step);
    }

    // Fall back to default executor
    return await super.executeStep(step);
  }

  private async executeDatabaseMigration(
    step: ImplementationStep
  ): Promise<ExecutionResult> {
    // Custom database migration logic
    const startTime = Date.now();

    try {
      // Execute migration
      await runMigration(step.target);

      return {
        stepId: step.id,
        status: "completed",
        output: "Migration completed successfully",
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        stepId: step.id,
        status: "failed",
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }
}
```

## Tips and Best Practices

1. **Always use dry run first** for new task types
2. **Enable backups** for production implementations
3. **Monitor events** for debugging and analytics
4. **Handle errors gracefully** with proper recovery
5. **Test validation rules** before deployment
6. **Set appropriate timeouts** for large tasks
7. **Use plan review** for critical changes
8. **Keep context concise** for better results
9. **Track execution metrics** for optimization
10. **Document custom configurations** for team use

## Common Patterns

### Batch Implementation
```typescript
async function implementMultipleTasks(tasks: Task[]) {
  const results = await Promise.allSettled(
    tasks.map((task) => implementTask(task))
  );

  const successful = results.filter((r) => r.status === "fulfilled");
  const failed = results.filter((r) => r.status === "rejected");

  console.log(`✅ ${successful.length} tasks completed`);
  console.log(`❌ ${failed.length} tasks failed`);

  return { successful, failed };
}
```

### Progress Tracking
```typescript
function trackProgress(engine: ImplementationEngine) {
  const startTime = Date.now();
  let lastProgress = 0;

  engine.on("progress", (progress) => {
    const percentage =
      (progress.completedSteps / progress.totalSteps) * 100;
    const elapsed = Date.now() - startTime;
    const avgTimePerStep = elapsed / progress.completedSteps;
    const estimatedTotal = avgTimePerStep * progress.totalSteps;
    const remaining = estimatedTotal - elapsed;

    console.log(`Progress: ${percentage.toFixed(1)}%`);
    console.log(`Estimated time remaining: ${(remaining / 1000).toFixed(0)}s`);
  });
}
```

### Conditional Implementation
```typescript
async function smartImplement(context: TaskContext) {
  // First, try with dry run
  const preview = await previewImplementation(context);

  // Check complexity
  const complexity = calculateComplexity(preview.plan);

  if (complexity === "low") {
    // Auto-approve simple changes
    return await implementWithCommit(context);
  } else {
    // Require review for complex changes
    return await implementWithReview(context);
  }
}

function calculateComplexity(plan: ImplementationPlan): "low" | "medium" | "high" {
  const stepCount = plan.steps.length;
  const hasRisks = (plan.risks?.length || 0) > 0;
  const hasTests = plan.steps.some((s) => s.type === "test");

  if (stepCount > 10 || hasRisks) return "high";
  if (stepCount > 5 || !hasTests) return "medium";
  return "low";
}
```
