/**
 * Projects API Routes
 * GET /api/projects - List all projects for current user
 * POST /api/projects - Create a new project
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getProjects, createProject } from "@/lib/supabase/queries";
import { CreateProjectForm } from "@/types";

/**
 * GET /api/projects
 * Get all projects for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { message: "Unauthorized" }, success: false },
        { status: 401 }
      );
    }

    // Get query parameters for sorting
    const searchParams = request.nextUrl.searchParams;
    const sortField = searchParams.get("sortField") || "created_at";
    const sortDirection = (searchParams.get("sortDirection") || "desc") as "asc" | "desc";

    const projects = await getProjects(supabase, {
      sort: { field: sortField, direction: sortDirection },
    });

    return NextResponse.json({ data: projects, success: true }, { status: 200 });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      {
        error: {
          message: "Failed to fetch projects",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        success: false,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { message: "Unauthorized" }, success: false },
        { status: 401 }
      );
    }

    // Parse request body
    const body: CreateProjectForm = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim() === "") {
      return NextResponse.json(
        { error: { message: "Project name is required" }, success: false },
        { status: 400 }
      );
    }

    // Create project
    const project = await createProject(supabase, {
      name: body.name.trim(),
      description: body.description?.trim() || null,
      folder_path: body.folderPath?.trim() || null,
      tech_stack: body.techStack || [],
    });

    if (!project) {
      return NextResponse.json(
        { error: { message: "Failed to create project" }, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: project, success: true }, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      {
        error: {
          message: "Failed to create project",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        success: false,
      },
      { status: 500 }
    );
  }
}
