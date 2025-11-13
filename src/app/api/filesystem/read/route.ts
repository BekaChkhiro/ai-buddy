/**
 * File System Read API
 * GET /api/filesystem/read - Read file contents
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getProjectById } from "@/lib/supabase/queries";
import { readFile, getFileInfo } from "@/lib/filesystem/reader";

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
    const filePath = searchParams.get("filePath");
    const encoding = (searchParams.get("encoding") || "utf-8") as BufferEncoding;

    if (!projectId || !filePath) {
      return NextResponse.json(
        { error: { message: "Project ID and file path are required" }, success: false },
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

    // Get file info
    const fileInfo = await getFileInfo(project.folderPath, filePath);

    // Read file content
    const content = await readFile(project.folderPath, filePath, { encoding });

    return NextResponse.json(
      {
        content,
        size: fileInfo.size,
        encoding,
        isBinary: fileInfo.isBinary,
        mimeType: fileInfo.mimeType,
        modifiedAt: fileInfo.modifiedAt,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error reading file:", error);
    return NextResponse.json(
      {
        error: {
          message: "Failed to read file",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        success: false,
      },
      { status: 500 }
    );
  }
}
