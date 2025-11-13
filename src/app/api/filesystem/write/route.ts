/**
 * File System Write API
 * POST /api/filesystem/write - Write file contents
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getProjectById } from "@/lib/supabase/queries";
import { writeFile } from "@/lib/filesystem/writer";
import { writeFileSchema } from "@/lib/filesystem/validation";

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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = writeFileSchema.parse(body);

    // Get project and verify ownership
    const project = await getProjectById(supabase, validatedData.projectId);
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

    // Write file
    const result = await writeFile(
      project.folderPath,
      validatedData.filePath,
      validatedData.content,
      {
        createBackup: validatedData.createBackup ?? true,
        createDirectories: validatedData.createDirectories ?? true,
      }
    );

    return NextResponse.json(
      {
        success: result.success,
        backupPath: result.backupPath,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error writing file:", error);
    return NextResponse.json(
      {
        error: {
          message: "Failed to write file",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        success: false,
      },
      { status: 500 }
    );
  }
}
