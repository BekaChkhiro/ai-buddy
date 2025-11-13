/**
 * API Route: Extract tasks from conversation
 * POST /api/tasks/extract
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  extractTasksFromConversation,
  extractTasksFromMessage,
  ChatMessageForExtraction,
  ExtractionOptions,
} from "@/lib/claude/task-extraction";
import { z } from "zod";

// Request validation schema
const extractRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
        createdAt: z.string(),
      })
    )
    .optional(),
  singleMessage: z.string().optional(),
  projectId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
  options: z
    .object({
      useFastModel: z.boolean().optional(),
      minConfidence: z.number().min(0).max(1).optional(),
      maxTasks: z.number().min(1).max(50).optional(),
      includeTechnicalRequirements: z.boolean().optional(),
      includeTimeEstimates: z.boolean().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = extractRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { messages, singleMessage, projectId, options } =
      validationResult.data;

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name, tech_stack, description")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Get recent tasks for context
    const { data: recentTasks } = await supabase
      .from("tasks")
      .select("title, status")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(5);

    // Build extraction options with project context
    const extractionOptions: ExtractionOptions = {
      ...options,
      projectContext: {
        projectName: project.name,
        techStack: project.tech_stack || [],
        recentTasks: recentTasks || [],
      },
    };

    let result;

    // Extract from single message or conversation
    if (singleMessage) {
      result = await extractTasksFromMessage(singleMessage, extractionOptions);
    } else if (messages && messages.length > 0) {
      // Convert messages to the format expected by extraction function
      const chatMessages: ChatMessageForExtraction[] = messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: new Date(msg.createdAt),
      }));

      result = await extractTasksFromConversation(
        chatMessages,
        extractionOptions
      );
    } else {
      return NextResponse.json(
        { success: false, error: "No messages provided for extraction" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error extracting tasks:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to extract tasks",
      },
      { status: 500 }
    );
  }
}
