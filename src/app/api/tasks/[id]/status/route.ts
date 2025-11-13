/**
 * API Route: /api/tasks/[id]/status
 * Update task status
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/database";
import { toTask } from "@/types";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH /api/tasks/[id]/status
 * Update task status with automatic timestamp tracking
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Missing required field: status" },
        { status: 400 },
      );
    }

    // Get current task
    const { data: currentTask, error: currentError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (currentError || !currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Build update data based on status
    const updateData: any = { status };

    // Set timestamps based on status transitions
    if (status === "in_progress" && !currentTask.started_at) {
      updateData.started_at = new Date().toISOString();
    }

    if (status === "implementing" && !currentTask.started_at) {
      updateData.started_at = new Date().toISOString();
    }

    if (status === "completed") {
      if (!currentTask.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }
      if (!currentTask.implemented_at) {
        updateData.implemented_at = new Date().toISOString();
      }
    }

    // Update task
    const { data: updatedTask, error: updateError } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating task status:", updateError);
      return NextResponse.json(
        { error: "Failed to update task status" },
        { status: 500 },
      );
    }

    // Create history entry
    await supabase.from("task_history").insert({
      task_id: id,
      user_id: user.id,
      action: "status_changed",
      field_name: "status",
      old_value: currentTask.status,
      new_value: status,
    });

    return NextResponse.json({
      success: true,
      data: toTask(updatedTask),
    });
  } catch (error) {
    console.error("Error in PATCH /api/tasks/[id]/status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
