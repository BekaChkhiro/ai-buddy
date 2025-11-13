/**
 * Git History API Route
 * GET /api/git/history - Get commit history
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getHistory, getCommit, searchCommits } from "@/lib/git/history";

/**
 * GET /api/git/history
 * Get commit history for a project
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
    const maxCount = parseInt(searchParams.get("maxCount") || "20");
    const skip = parseInt(searchParams.get("skip") || "0");
    const branch = searchParams.get("branch") || undefined;
    const file = searchParams.get("file") || undefined;
    const author = searchParams.get("author") || undefined;
    const since = searchParams.get("since") || undefined;
    const until = searchParams.get("until") || undefined;
    const query = searchParams.get("query") || undefined;
    const hash = searchParams.get("hash") || undefined;

    if (!projectPath) {
      return NextResponse.json(
        { error: "projectPath is required", success: false },
        { status: 400 }
      );
    }

    let result;

    // If hash is provided, get a specific commit
    if (hash) {
      result = await getCommit(projectPath, hash);
    }
    // If query is provided, search commits
    else if (query) {
      result = await searchCommits(projectPath, query, maxCount);
    }
    // Otherwise, get commit history
    else {
      result = await getHistory(projectPath, {
        maxCount,
        skip,
        branch,
        file,
        author,
        since,
        until,
      });
    }

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Failed to get commit history",
          message: result.message,
          success: false,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        commits: result.data,
        message: result.message,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting commit history:", error);
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
