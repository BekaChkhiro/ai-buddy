/**
 * File System Validation API
 * POST /api/filesystem/validate - Validate folder path
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getProjectById } from "@/lib/supabase/queries";
import { validateProjectFolder } from "@/lib/filesystem/validator";
import { validatePathSchema } from "@/lib/filesystem/validation";

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
    const validatedData = validatePathSchema.parse(body);

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

    // Validate folder path
    const result = await validateProjectFolder(validatedData.folderPath);

    if (!result.valid) {
      return NextResponse.json(
        {
          valid: false,
          error: result.error,
          reason: result.reason,
          success: false,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        valid: true,
        normalizedPath: result.normalizedPath,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error validating path:", error);
    return NextResponse.json(
      {
        error: {
          message: "Failed to validate path",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        success: false,
      },
      { status: 500 }
    );
  }
}
