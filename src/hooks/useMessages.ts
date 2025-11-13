/**
 * useMessages Hook
 * Fetch and manage conversation messages
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database";

export interface Message {
  id: string;
  conversation_id: string;
  parent_id: string | null;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

interface UseMessagesOptions {
  conversationId?: string;
  limit?: number;
  autoFetch?: boolean;
}

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  fetchMessages: () => Promise<void>;
  loadMore: () => Promise<void>;
  addMessage: (
    message: Omit<Message, "id" | "created_at" | "updated_at">
  ) => Promise<Message | null>;
  updateMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useMessages(options: UseMessagesOptions = {}): UseMessagesReturn {
  const { conversationId, limit = 50, autoFetch = true } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const supabase = createBrowserClient();

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .range(0, limit - 1);

      if (fetchError) throw fetchError;

      setMessages(data || []);
      setHasMore((data?.length || 0) >= limit);
      setOffset(limit);
    } catch (err: any) {
      console.error("Error fetching messages:", err);
      setError(err.message || "Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  }, [conversationId, limit, supabase]);

  const loadMore = useCallback(async () => {
    if (!conversationId || !hasMore || loading) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .range(offset, offset + limit - 1);

      if (fetchError) throw fetchError;

      setMessages((prev) => [...prev, ...(data || [])]);
      setHasMore((data?.length || 0) >= limit);
      setOffset((prev) => prev + limit);
    } catch (err: any) {
      console.error("Error loading more messages:", err);
      setError(err.message || "Failed to load more messages");
    } finally {
      setLoading(false);
    }
  }, [conversationId, hasMore, loading, offset, limit, supabase]);

  const addMessage = useCallback(
    async (message: Omit<Message, "id" | "created_at" | "updated_at">): Promise<Message | null> => {
      if (!conversationId) return null;

      try {
        const { data, error: insertError } = await supabase
          .from("messages")
          .insert({
            conversation_id: message.conversation_id,
            parent_id: message.parent_id,
            role: message.role,
            content: message.content,
            metadata: message.metadata || {},
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Add message to state
        setMessages((prev) => [...prev, data]);

        return data;
      } catch (err: any) {
        console.error("Error adding message:", err);
        setError(err.message || "Failed to add message");
        return null;
      }
    },
    [conversationId, supabase]
  );

  const updateMessage = useCallback(
    async (messageId: string, content: string) => {
      try {
        const { error: updateError } = await supabase
          .from("messages")
          .update({ content, updated_at: new Date().toISOString() })
          .eq("id", messageId);

        if (updateError) throw updateError;

        // Update message in state
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, content } : msg))
        );
      } catch (err: any) {
        console.error("Error updating message:", err);
        setError(err.message || "Failed to update message");
      }
    },
    [supabase]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        const { error: deleteError } = await supabase.from("messages").delete().eq("id", messageId);

        if (deleteError) throw deleteError;

        // Remove message from state
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      } catch (err: any) {
        console.error("Error deleting message:", err);
        setError(err.message || "Failed to delete message");
      }
    },
    [supabase]
  );

  const refresh = useCallback(async () => {
    setOffset(0);
    await fetchMessages();
  }, [fetchMessages]);

  // Auto-fetch on mount and when conversationId changes
  useEffect(() => {
    if (autoFetch && conversationId) {
      fetchMessages();
    }
  }, [autoFetch, conversationId, fetchMessages]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((msg) => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const deletedMessage = payload.old as Message;
          setMessages((prev) => prev.filter((msg) => msg.id !== deletedMessage.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  return {
    messages,
    loading,
    error,
    hasMore,
    fetchMessages,
    loadMore,
    addMessage,
    updateMessage,
    deleteMessage,
    refresh,
  };
}
