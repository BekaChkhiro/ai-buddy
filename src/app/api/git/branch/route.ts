/**
 * Git Branch API Route
 * GET /api/git/branch - Get list of branches
 * POST /api/git/branch - Create, switch, or delete branches
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import {
  getBranches,
  getCurrentBranch,
  createBranch,
  switchBranch,
  deleteBranch,
  renameBranch,
  getBranchTracking,
  getMergedBranches,
  getUnmergedBranches,
} from "@/lib/git/branch";

/**
 * GET /api/git/branch
 * Get list of branches or specific branch information
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
        { error: "Unauthorized", success: false },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const projectPath = searchParams.get("projectPath");
    const includeRemote = searchParams.get("includeRemote") === "true";
    const action = searchParams.get("action");
    const targetBranch = searchParams.get("targetBranch") || undefined;

    if (!projectPath) {
      return NextResponse.json(
        { error: "projectPath is required", success: false },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "current":
        result = await getCurrentBranch(projectPath);
        break;

      case "tracking":
        result = await getBranchTracking(projectPath);
        break;

      case "merged":
        result = await getMergedBranches(projectPath, targetBranch);
        break;

      case "unmerged":
        result = await getUnmergedBranches(projectPath, targetBranch);
        break;

      default:
        result = await getBranches(projectPath, includeRemote);
        break;
    }

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Failed to get branches",
          message: result.message,
          success: false,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        branches: result.data,
        message: result.message,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting branches:", error);
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

/**
 * POST /api/git/branch
 * Perform branch operations
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
    const { projectPath, action, branchName, startPoint, force, track, remote, newName } = body;

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
      case "create":
        if (!branchName) {
          return NextResponse.json(
            { error: "branchName is required for create action", success: false },
            { status: 400 }
          );
        }

        result = await createBranch(projectPath, {
          name: branchName,
          startPoint,
          force,
          track,
          remote,
        });
        break;

      case "switch":
        if (!branchName) {
          return NextResponse.json(
            { error: "branchName is required for switch action", success: false },
            { status: 400 }
          );
        }

        result = await switchBranch(projectPath, branchName);
        break;

      case "delete":
        if (!branchName) {
          return NextResponse.json(
            { error: "branchName is required for delete action", success: false },
            { status: 400 }
          );
        }

        result = await deleteBranch(projectPath, branchName, force);
        break;

      case "rename":
        if (!newName) {
          return NextResponse.json(
            { error: "newName is required for rename action", success: false },
            { status: 400 }
          );
        }

        result = await renameBranch(projectPath, newName);
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
          error: result.error || `Failed to ${action} branch`,
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
    console.error("Error in branch operation:", error);
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
