/**
 * Single Project API Routes
 * GET /api/projects/[id] - Get single project
 * PATCH /api/projects/[id] - Update project
 * DELETE /api/projects/[id] - Delete project
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getProjectById, updateProject, deleteProject } from "@/lib/supabase/queries";
import { UpdateProjectForm } from "@/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/projects/[id]
 * Get a single project by ID
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
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

    // Get project
    const project = await getProjectById(supabase, id);

    if (!project) {
      return NextResponse.json(
        { error: { message: "Project not found" }, success: false },
        { status: 404 }
      );
    }

    // Verify ownership
    if (project.userId !== user.id) {
      return NextResponse.json(
        { error: { message: "Forbidden" }, success: false },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: project, success: true }, { status: 200 });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      {
        error: {
          message: "Failed to fetch project",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        success: false,
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[id]
 * Update a project
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
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

    // Get existing project
    const existingProject = await getProjectById(supabase, id);
    if (!existingProject) {
      return NextResponse.json(
        { error: { message: "Project not found" }, success: false },
        { status: 404 }
      );
    }

    // Verify ownership
    if (existingProject.userId !== user.id) {
      return NextResponse.json(
        { error: { message: "Forbidden" }, success: false },
        { status: 403 }
      );
    }

    // Parse request body
    const body: UpdateProjectForm = await request.json();

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) {
      if (body.name.trim() === "") {
        return NextResponse.json(
          { error: { message: "Project name cannot be empty" }, success: false },
          { status: 400 }
        );
      }
      updates.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description?.trim() || null;
    }

    if (body.folderPath !== undefined) {
      updates.folder_path = body.folderPath?.trim() || null;
    }

    if (body.techStack !== undefined) {
      updates.tech_stack = body.techStack;
    }

    // Update project
    const project = await updateProject(supabase, id, updates);

    if (!project) {
      return NextResponse.json(
        { error: { message: "Failed to update project" }, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: project, success: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      {
        error: {
          message: "Failed to update project",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        success: false,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a project
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
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

    // Get existing project
    const existingProject = await getProjectById(supabase, id);
    if (!existingProject) {
      return NextResponse.json(
        { error: { message: "Project not found" }, success: false },
        { status: 404 }
      );
    }

    // Verify ownership
    if (existingProject.userId !== user.id) {
      return NextResponse.json(
        { error: { message: "Forbidden" }, success: false },
        { status: 403 }
      );
    }

    // Delete project
    const success = await deleteProject(supabase, id);

    if (!success) {
      return NextResponse.json(
        { error: { message: "Failed to delete project" }, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { id }, success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      {
        error: {
          message: "Failed to delete project",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        success: false,
      },
      { status: 500 }
    );
  }
}
