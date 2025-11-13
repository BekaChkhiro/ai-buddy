/**
 * API endpoint for AI-powered task extraction from conversations
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import {
  extractTasksFromConversation,
  extractTasksFromMessage,
  breakDownComplexTask,
  TaskExtractionOptions,
} from "@/lib/claude/task-extraction";

/**
 * POST /api/tasks/extract
 * Extract tasks from conversation messages
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      conversationId,
      messages,
      singleMessage,
      options,
      breakdownTaskId,
    } = body;

    // Validate input
    if (!conversationId && !messages && !singleMessage && !breakdownTaskId) {
      return NextResponse.json(
        {
          error:
            "Either conversationId, messages, singleMessage, or breakdownTaskId must be provided",
        },
        { status: 400 }
      );
    }

    const extractionOptions: TaskExtractionOptions = {
      maxTasks: options?.maxTasks || 10,
      minConfidence: options?.minConfidence || 60,
      focusArea: options?.focusArea || "all",
      detectDependencies: options?.detectDependencies !== false,
      includeTimeEstimates: options?.includeTimeEstimates !== false,
    };

    // Handle task breakdown
    if (breakdownTaskId) {
      const { data: extractedTask, error: taskError } = await supabase
        .from("extracted_tasks")
        .select("*")
        .eq("id", breakdownTaskId)
        .single();

      if (taskError || !extractedTask) {
        return NextResponse.json(
          { error: "Task not found" },
          { status: 404 }
        );
      }

      const subtasks = await breakDownComplexTask({
        title: extractedTask.title,
        description: extractedTask.description || "",
        priority: extractedTask.priority,
        complexity: extractedTask.complexity,
        estimatedHours: extractedTask.estimated_hours,
        confidence: extractedTask.confidence,
        suggestedLabels: extractedTask.suggested_labels || [],
        technicalRequirements: extractedTask.technical_requirements || [],
        dependencies: extractedTask.dependencies || [],
        reasoning: extractedTask.reasoning || "",
      });

      return NextResponse.json({
        tasks: subtasks,
        summary: `Broke down "${extractedTask.title}" into ${subtasks.length} subtasks`,
        conversationContext: "",
        totalEstimatedHours: subtasks.reduce(
          (sum, t) => sum + (t.estimatedHours || 0),
          0
        ),
        suggestedTaskOrder: subtasks.map((t) => t.title),
      });
    }

    // Handle single message extraction
    if (singleMessage) {
      const result = await extractTasksFromMessage(
        singleMessage,
        extractionOptions
      );

      return NextResponse.json(result);
    }

    // Handle direct messages array
    if (messages && Array.isArray(messages)) {
      const result = await extractTasksFromConversation(
        messages,
        extractionOptions
      );

      return NextResponse.json(result);
    }

    // Handle conversation ID - fetch messages from database
    if (conversationId) {
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

      if (convError || !conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      // Verify user has access to this conversation
      if (conversation.user_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Fetch messages for this conversation
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (messagesError) {
        throw messagesError;
      }

      if (!messagesData || messagesData.length === 0) {
        return NextResponse.json(
          { error: "No messages found in conversation" },
          { status: 400 }
        );
      }

      // Extract tasks from the conversation
      const formattedMessages = messagesData.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      const result = await extractTasksFromConversation(
        formattedMessages,
        extractionOptions
      );

      // Store extracted tasks in database for review
      const extractedTasksToInsert = result.tasks.map((task) => ({
        conversation_id: conversationId,
        user_id: user.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        complexity: task.complexity,
        estimated_hours: task.estimatedHours,
        confidence: task.confidence,
        suggested_labels: task.suggestedLabels,
        technical_requirements: task.technicalRequirements,
        dependencies: task.dependencies,
        reasoning: task.reasoning,
        status: "pending_review" as const,
      }));

      const { data: insertedTasks, error: insertError } = await supabase
        .from("extracted_tasks")
        .insert(extractedTasksToInsert)
        .select();

      if (insertError) {
        console.error("Error storing extracted tasks:", insertError);
        // Continue anyway, returning the extracted tasks
      }

      return NextResponse.json({
        ...result,
        extractedTaskIds: insertedTasks?.map((t) => t.id) || [],
      });
    }

    return NextResponse.json(
      { error: "Invalid request parameters" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Task extraction error:", error);
    return NextResponse.json(
      {
        error: "Task extraction failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tasks/extract?conversationId=xxx
 * Get previously extracted tasks for a conversation
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    // Fetch extracted tasks for this conversation
    const { data: extractedTasks, error: tasksError } = await supabase
      .from("extracted_tasks")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (tasksError) {
      throw tasksError;
    }

    return NextResponse.json({ tasks: extractedTasks || [] });
  } catch (error) {
    console.error("Error fetching extracted tasks:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch extracted tasks",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
