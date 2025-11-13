/**
 * API Route: /api/tasks/[id]/implement
 * Trigger task implementation with SSE support
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/database";
import {
  ImplementationEngine,
  TaskContext,
  ImplementationConfig,
} from "@/lib/implementation";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Store active implementations
const activeImplementations = new Map<string, ImplementationEngine>();

/**
 * POST /api/tasks/[id]/implement
 * Start task implementation
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const config: ImplementationConfig = body.config || {};

    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      },
    );

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get task with project details
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select(
        `
        *,
        projects (
          id,
          name,
          description,
          folder_path,
          tech_stack
        )
      `,
      )
      .eq("id", id)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if already implementing
    if (activeImplementations.has(id)) {
      return NextResponse.json(
        { error: "Task is already being implemented" },
        { status: 409 },
      );
    }

    // Create execution record
    const { data: execution, error: executionError } = await supabase
      .from("task_executions")
      .insert({
        task_id: id,
        status: "running",
        executed_by: user.id,
      })
      .select()
      .single();

    if (executionError) {
      console.error("Error creating execution:", executionError);
      return NextResponse.json(
        { error: "Failed to create execution" },
        { status: 500 },
      );
    }

    // Update task status to implementing
    await supabase
      .from("tasks")
      .update({
        status: "implementing",
        started_at: task.started_at || new Date().toISOString(),
      })
      .eq("id", id);

    // Create history entry
    await supabase.from("task_history").insert({
      task_id: id,
      user_id: user.id,
      action: "implementation_started",
    });

    // Prepare task context
    const context: TaskContext = {
      taskId: id,
      title: task.title,
      description: task.description || "",
      acceptance_criteria: task.acceptance_criteria || undefined,
      projectId: task.project_id,
      projectPath: (task.projects as any)?.folder_path || "",
      techStack: (task.projects as any)?.tech_stack || [],
    };

    // Create implementation engine
    const engine = new ImplementationEngine(context.projectPath, config);
    activeImplementations.set(id, engine);

    // Start implementation (async)
    engine
      .implement(context)
      .then(async (progress) => {
        // Update task status based on result
        const newStatus =
          progress.status === "completed"
            ? "completed"
            : progress.status === "cancelled"
              ? "cancelled"
              : "failed";

        await supabase
          .from("tasks")
          .update({
            status: newStatus,
            completed_at:
              newStatus === "completed" ? new Date().toISOString() : undefined,
          })
          .eq("id", id);

        // Update execution record
        await supabase
          .from("task_executions")
          .update({
            status: newStatus === "completed" ? "success" : "failed",
            error: progress.error,
            completed_at: new Date().toISOString(),
          })
          .eq("id", execution.id);

        // Create history entry
        await supabase.from("task_history").insert({
          task_id: id,
          user_id: user.id,
          action: `implementation_${newStatus}`,
        });

        // Cleanup
        activeImplementations.delete(id);
      })
      .catch(async (error) => {
        console.error("Implementation error:", error);

        await supabase
          .from("tasks")
          .update({ status: "failed" })
          .eq("id", id);

        await supabase
          .from("task_executions")
          .update({
            status: "failed",
            error: error.message,
            completed_at: new Date().toISOString(),
          })
          .eq("id", execution.id);

        activeImplementations.delete(id);
      });

    return NextResponse.json({
      success: true,
      data: {
        execution_id: execution.id,
        message: "Task implementation started",
      },
    });
  } catch (error) {
    console.error("Error in POST /api/tasks/[id]/implement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/tasks/[id]/implement
 * SSE endpoint for implementation progress
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // Check if implementation is active
  const engine = activeImplementations.get(id);
  if (!engine) {
    return NextResponse.json(
      { error: "No active implementation" },
      { status: 404 },
    );
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial progress
      const initialProgress = engine.getProgress();
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(initialProgress)}\n\n`),
      );

      // Listen for progress updates
      const progressHandler = (progress: any) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(progress)}\n\n`),
          );
        } catch (error) {
          console.error("Error sending SSE:", error);
        }
      };

      const eventHandler = (event: any) => {
        try {
          controller.enqueue(
            encoder.encode(
              `event: implementation\ndata: ${JSON.stringify(event)}\n\n`,
            ),
          );
        } catch (error) {
          console.error("Error sending SSE:", error);
        }
      };

      engine.on("progress", progressHandler);
      engine.on("event", eventHandler);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        engine.off("progress", progressHandler);
        engine.off("event", eventHandler);
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

/**
 * DELETE /api/tasks/[id]/implement
 * Cancel active implementation
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      },
    );

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if implementation is active
    const engine = activeImplementations.get(id);
    if (!engine) {
      return NextResponse.json(
        { error: "No active implementation" },
        { status: 404 },
      );
    }

    // Cancel implementation
    await engine.cancel();

    // Update task status
    await supabase
      .from("tasks")
      .update({ status: "cancelled" })
      .eq("id", id);

    // Create history entry
    await supabase.from("task_history").insert({
      task_id: id,
      user_id: user.id,
      action: "implementation_cancelled",
    });

    return NextResponse.json({
      success: true,
      message: "Implementation cancelled",
    });
  } catch (error) {
    console.error("Error cancelling implementation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/tasks/[id]/implement
 * Approve implementation plan
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action !== "approve") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Check if implementation is active
    const engine = activeImplementations.get(id);
    if (!engine) {
      return NextResponse.json(
        { error: "No active implementation" },
        { status: 404 },
      );
    }

    // Approve plan
    await engine.approvePlan();

    return NextResponse.json({
      success: true,
      message: "Plan approved, continuing implementation",
    });
  } catch (error) {
    console.error("Error approving plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
