/**
 * API Route: /api/tasks/[id]
 * Handles individual task operations
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/database";
import { TaskUpdate, toTask } from "@/types";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/tasks/[id]
 * Get a single task with all details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Get task with all related data
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select(
        `
        *,
        assignee:profiles!tasks_assignee_id_fkey(id, email, full_name, avatar_url),
        dependencies:task_dependencies!task_dependencies_task_id_fkey(
          id,
          depends_on_task_id,
          dependency_type,
          created_at,
          depends_on:tasks!task_dependencies_depends_on_task_id_fkey(id, title, status)
        ),
        dependents:task_dependencies!task_dependencies_depends_on_task_id_fkey(
          id,
          task_id,
          dependency_type,
          created_at,
          task:tasks!task_dependencies_task_id_fkey(id, title, status)
        ),
        comments:task_comments(
          id,
          task_id,
          user_id,
          content,
          created_at,
          updated_at,
          user:profiles(id, email, full_name, avatar_url)
        ),
        history:task_history(
          id,
          task_id,
          user_id,
          action,
          field_name,
          old_value,
          new_value,
          created_at,
          user:profiles(id, email, full_name, avatar_url)
        ),
        executions:task_executions(
          id,
          task_id,
          status,
          changes,
          error_log,
          executed_at,
          executed_by
        )
      `,
      )
      .eq("id", id)
      .single();

    if (taskError) {
      console.error("Error fetching task:", taskError);
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Error in GET /api/tasks/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/tasks/[id]
 * Update a task
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

    // Get current task for history tracking
    const { data: currentTask, error: currentError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (currentError || !currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Build update data
    const updateData: TaskUpdate = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === "in_progress" && !currentTask.started_at) {
        updateData.started_at = new Date().toISOString();
      }
      if (body.status === "completed" && !currentTask.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }
    }
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.implementation_details !== undefined)
      updateData.implementation_details = body.implementation_details;
    if (body.implementation_log !== undefined)
      updateData.implementation_log = body.implementation_log;
    if (body.due_date !== undefined) updateData.due_date = body.due_date;
    if (body.assignee_id !== undefined)
      updateData.assignee_id = body.assignee_id;
    if (body.labels !== undefined) updateData.labels = body.labels;
    if (body.estimated_hours !== undefined)
      updateData.estimated_hours = body.estimated_hours;
    if (body.actual_hours !== undefined)
      updateData.actual_hours = body.actual_hours;
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;

    // Update task
    const { data: updatedTask, error: updateError } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating task:", updateError);
      return NextResponse.json(
        { error: "Failed to update task" },
        { status: 500 },
      );
    }

    // Create history entries for changed fields
    const historyEntries = [];
    for (const [key, newValue] of Object.entries(updateData)) {
      const oldValue = currentTask[key as keyof typeof currentTask];
      if (oldValue !== newValue) {
        historyEntries.push({
          task_id: id,
          user_id: user.id,
          action: "updated",
          field_name: key,
          old_value: String(oldValue),
          new_value: String(newValue),
        });
      }
    }

    if (historyEntries.length > 0) {
      await supabase.from("task_history").insert(historyEntries);
    }

    return NextResponse.json({
      success: true,
      data: toTask(updatedTask),
    });
  } catch (error) {
    console.error("Error in PATCH /api/tasks/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/tasks/[id]
 * Delete a task
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

    // Delete task (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting task:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete task" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/tasks/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
