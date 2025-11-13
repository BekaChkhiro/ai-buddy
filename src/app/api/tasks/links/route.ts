/**
 * API endpoint for task-message links
 * Links tasks to chat messages for context tracking
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/tasks/links
 * Create a link between a task and a message
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
    const { taskId, messageId, conversationId, linkType, context } = body;

    // Validate required fields
    if (!taskId || !conversationId) {
      return NextResponse.json(
        { error: "taskId and conversationId are required" },
        { status: 400 }
      );
    }

    // Verify task exists and user has access
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*, projects!inner(user_id)")
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.projects.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If messageId is provided, verify it exists
    if (messageId) {
      const { data: message, error: messageError } = await supabase
        .from("messages")
        .select("id")
        .eq("id", messageId)
        .single();

      if (messageError || !message) {
        return NextResponse.json(
          { error: "Message not found" },
          { status: 404 }
        );
      }
    } else {
      // If no messageId, get the most recent message from the conversation
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (messagesError || !messages || messages.length === 0) {
        return NextResponse.json(
          { error: "No messages found in conversation" },
          { status: 400 }
        );
      }

      // Use the most recent message
      const recentMessageId = messages[0].id;

      // Create the link
      const { data: link, error: linkError } = await supabase
        .from("task_message_links")
        .insert({
          task_id: taskId,
          message_id: recentMessageId,
          conversation_id: conversationId,
          link_type: linkType || "extracted_from",
          context: context || null,
        })
        .select()
        .single();

      if (linkError) {
        // Check for unique constraint violation
        if (linkError.code === "23505") {
          return NextResponse.json(
            { error: "Link already exists" },
            { status: 409 }
          );
        }
        throw linkError;
      }

      return NextResponse.json(link);
    }

    // Create the link with provided messageId
    const { data: link, error: linkError } = await supabase
      .from("task_message_links")
      .insert({
        task_id: taskId,
        message_id: messageId,
        conversation_id: conversationId,
        link_type: linkType || "extracted_from",
        context: context || null,
      })
      .select()
      .single();

    if (linkError) {
      // Check for unique constraint violation
      if (linkError.code === "23505") {
        return NextResponse.json(
          { error: "Link already exists" },
          { status: 409 }
        );
      }
      throw linkError;
    }

    return NextResponse.json(link);
  } catch (error) {
    console.error("Task link creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create task link",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tasks/links?taskId=xxx
 * Get all message links for a task
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
    const taskId = searchParams.get("taskId");
    const conversationId = searchParams.get("conversationId");

    if (!taskId && !conversationId) {
      return NextResponse.json(
        { error: "Either taskId or conversationId is required" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("task_message_links")
      .select(
        `
        *,
        tasks!inner(
          id,
          title,
          status,
          priority,
          projects!inner(user_id)
        ),
        messages(
          id,
          content,
          role,
          created_at
        )
      `
      );

    if (taskId) {
      query = query.eq("task_id", taskId);
    }

    if (conversationId) {
      query = query.eq("conversation_id", conversationId);
    }

    const { data: links, error: linksError } = await query;

    if (linksError) {
      throw linksError;
    }

    // Filter to only user's tasks
    const userLinks = links?.filter(
      (link: any) => link.tasks.projects.user_id === user.id
    );

    return NextResponse.json({ links: userLinks || [] });
  } catch (error) {
    console.error("Error fetching task links:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch task links",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/links?linkId=xxx
 * Delete a task-message link
 */
export async function DELETE(request: NextRequest) {
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
    const linkId = searchParams.get("linkId");

    if (!linkId) {
      return NextResponse.json(
        { error: "linkId is required" },
        { status: 400 }
      );
    }

    // Verify user owns the task
    const { data: link, error: linkError } = await supabase
      .from("task_message_links")
      .select(
        `
        *,
        tasks!inner(
          projects!inner(user_id)
        )
      `
      )
      .eq("id", linkId)
      .single();

    if (linkError || !link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    if ((link as any).tasks.projects.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete the link
    const { error: deleteError } = await supabase
      .from("task_message_links")
      .delete()
      .eq("id", linkId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task link:", error);
    return NextResponse.json(
      {
        error: "Failed to delete task link",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
