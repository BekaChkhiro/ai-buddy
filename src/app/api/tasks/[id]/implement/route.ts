/**
 * API Route: /api/tasks/[id]/implement
 * Trigger task implementation
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/database";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/tasks/[id]/implement
 * Trigger implementation of a task
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Get task
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
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

    // TODO: Here you would trigger your actual implementation logic
    // For now, we just return the execution ID

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
