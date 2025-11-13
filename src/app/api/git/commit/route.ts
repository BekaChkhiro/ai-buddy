/**
 * Git Commit API Route
 * POST /api/git/commit - Create a commit, stage files, or push changes
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import {
  commit,
  stageFiles,
  unstageFiles,
  push,
  discardChanges,
} from "@/lib/git/operations";

/**
 * POST /api/git/commit
 * Perform Git commit operations
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
    const { projectPath, action, message, files, all, amend, author, coAuthors, remote, branch, force, setUpstream } = body;

    if (!projectPath) {
      return NextResponse.json(
        { error: "projectPath is required", success: false },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: "action is required", success: false },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "stage":
        result = await stageFiles(projectPath, files || []);
        break;

      case "unstage":
        result = await unstageFiles(projectPath, files || []);
        break;

      case "commit":
        if (!message) {
          return NextResponse.json(
            { error: "message is required for commit action", success: false },
            { status: 400 }
          );
        }

        result = await commit(projectPath, {
          message,
          files,
          all,
          amend,
          author,
          coAuthors,
        });
        break;

      case "push":
        result = await push(projectPath, {
          remote,
          branch,
          force,
          setUpstream,
        });
        break;

      case "discard":
        result = await discardChanges(projectPath, files || []);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}`, success: false },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || `Failed to ${action}`,
          message: result.message,
          success: false,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: result.data,
        message: result.message,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in Git commit operation:", error);
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
