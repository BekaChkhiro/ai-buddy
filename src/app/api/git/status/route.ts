/**
 * Git Status API Route
 * POST /api/git/status - Get Git repository status
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getStatus } from "@/lib/git/operations";

/**
 * POST /api/git/status
 * Get the current Git status for a project
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
        { error: "Unauthorized", success: false },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { projectPath } = body;

    if (!projectPath) {
      return NextResponse.json(
        { error: "projectPath is required", success: false },
        { status: 400 }
      );
    }

    // Get Git status
    const result = await getStatus(projectPath);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Failed to get Git status",
          message: result.message,
          success: false,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        status: result.data,
        message: result.message,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting Git status:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 }
    );
  }
}
