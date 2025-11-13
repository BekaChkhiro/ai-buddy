/**
 * API Route: /api/tasks
 * Handles task CRUD operations
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/database";
import { TaskInsert, toTask } from "@/types";

/**
 * GET /api/tasks
 * Get all tasks for a project with optional filters
 */
export async function GET(request: NextRequest) {
  try {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("project_id");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
    const labels = searchParams.get("labels");

    // Build query
    let query = supabase
      .from("tasks")
      .select(
        `
        *,
        assignee:profiles!tasks_assignee_id_fkey(id, email, full_name, avatar_url)
      `,
      )
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    // Apply filters
    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    if (status) {
      const statuses = status.split(",");
      query = query.in("status", statuses);
    }

    if (priority) {
      const priorities = priority.split(",");
      query = query.in("priority", priorities);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (labels) {
      const labelList = labels.split(",");
      query = query.overlaps("labels", labelList);
    }

    const { data: tasks, error: tasksError } = await query;

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      return NextResponse.json(
        { error: "Failed to fetch tasks" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: tasks?.map((task) => toTask(task)) || [],
    });
  } catch (error) {
    console.error("Error in GET /api/tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/tasks
 * Create a new task
 */
export async function POST(request: NextRequest) {
  try {
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

    // Validate required fields
    if (!body.project_id || !body.title) {
      return NextResponse.json(
        { error: "Missing required fields: project_id, title" },
        { status: 400 },
      );
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", body.project_id)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 },
      );
    }

    // Create task
    const taskData: TaskInsert = {
      project_id: body.project_id,
      title: body.title,
      description: body.description || null,
      status: body.status || "pending",
      priority: body.priority || "medium",
      implementation_details: body.implementation_details || null,
      due_date: body.due_date || null,
      assignee_id: body.assignee_id || null,
      labels: body.labels || [],
      estimated_hours: body.estimated_hours || null,
      sort_order: body.sort_order || 0,
    };

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert(taskData)
      .select()
      .single();

    if (taskError) {
      console.error("Error creating task:", taskError);
      return NextResponse.json(
        { error: "Failed to create task" },
        { status: 500 },
      );
    }

    // Create history entry
    await supabase.from("task_history").insert({
      task_id: task.id,
      user_id: user.id,
      action: "created",
    });

    return NextResponse.json({
      success: true,
      data: toTask(task),
    });
  } catch (error) {
    console.error("Error in POST /api/tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
