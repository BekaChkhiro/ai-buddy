/**
 * File System Structure API
 * GET /api/filesystem/structure - Get directory structure
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getProjectById } from "@/lib/supabase/queries";
import { getDirectoryStructure, getDirectoryStats } from "@/lib/filesystem/structure";

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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");
    const path = searchParams.get("path") || "";
    const depth = searchParams.get("depth") ? parseInt(searchParams.get("depth")!) : undefined;
    const includeHidden = searchParams.get("includeHidden") === "true";
    const respectGitignore = searchParams.get("respectGitignore") !== "false";

    if (!projectId) {
      return NextResponse.json(
        { error: { message: "Project ID is required" }, success: false },
        { status: 400 }
      );
    }

    // Get project and verify ownership
    const project = await getProjectById(supabase, projectId);
    if (!project) {
      return NextResponse.json(
        { error: { message: "Project not found" }, success: false },
        { status: 404 }
      );
    }

    if (project.userId !== user.id) {
      return NextResponse.json(
        { error: { message: "Forbidden" }, success: false },
        { status: 403 }
      );
    }

    if (!project.folderPath) {
      return NextResponse.json(
        { error: { message: "Project has no folder path" }, success: false },
        { status: 400 }
      );
    }

    // Get directory structure
    const tree = await getDirectoryStructure(project.folderPath, path, {
      depth,
      includeHidden,
      respectGitignore,
      includeStats: true,
    });

    // Get directory stats
    const stats = await getDirectoryStats(project.folderPath, path, {
      includeHidden,
      respectGitignore,
    });

    return NextResponse.json(
      {
        tree,
        stats,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting directory structure:", error);
    return NextResponse.json(
      {
        error: {
          message: "Failed to get directory structure",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        success: false,
      },
      { status: 500 }
    );
  }
}
