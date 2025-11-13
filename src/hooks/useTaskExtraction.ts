/**
 * Hook for AI-powered task extraction from conversations
 */

import { useState, useCallback } from "react";
import { ExtractedTask, TaskExtractionOptions } from "@/lib/claude/task-extraction";

export interface TaskExtractionResult {
  tasks: ExtractedTask[];
  summary: string;
  conversationContext: string;
  totalEstimatedHours: number;
  suggestedTaskOrder: string[];
  extractedTaskIds?: string[];
}

export function useTaskExtraction() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] =
    useState<TaskExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Extract tasks from a conversation
   */
  const extractFromConversation = useCallback(
    async (
      conversationId: string,
      options?: TaskExtractionOptions
    ): Promise<TaskExtractionResult | null> => {
      setIsExtracting(true);
      setError(null);

      try {
        const response = await fetch("/api/tasks/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            options,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to extract tasks");
        }

        const result: TaskExtractionResult = await response.json();
        setExtractionResult(result);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return null;
      } finally {
        setIsExtracting(false);
      }
    },
    []
  );

  /**
   * Extract tasks from a single message
   */
  const extractFromMessage = useCallback(
    async (
      message: string,
      options?: TaskExtractionOptions
    ): Promise<TaskExtractionResult | null> => {
      setIsExtracting(true);
      setError(null);

      try {
        const response = await fetch("/api/tasks/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            singleMessage: message,
            options,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to extract tasks");
        }

        const result: TaskExtractionResult = await response.json();
        setExtractionResult(result);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return null;
      } finally {
        setIsExtracting(false);
      }
    },
    []
  );

  /**
   * Extract tasks from an array of messages
   */
  const extractFromMessages = useCallback(
    async (
      messages: Array<{ role: "user" | "assistant"; content: string }>,
      options?: TaskExtractionOptions
    ): Promise<TaskExtractionResult | null> => {
      setIsExtracting(true);
      setError(null);

      try {
        const response = await fetch("/api/tasks/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages,
            options,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to extract tasks");
        }

        const result: TaskExtractionResult = await response.json();
        setExtractionResult(result);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return null;
      } finally {
        setIsExtracting(false);
      }
    },
    []
  );

  /**
   * Break down a complex task into subtasks
   */
  const breakDownTask = useCallback(
    async (
      extractedTaskId: string
    ): Promise<TaskExtractionResult | null> => {
      setIsExtracting(true);
      setError(null);

      try {
        const response = await fetch("/api/tasks/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            breakdownTaskId: extractedTaskId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to break down task");
        }

        const result: TaskExtractionResult = await response.json();
        setExtractionResult(result);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return null;
      } finally {
        setIsExtracting(false);
      }
    },
    []
  );

  /**
   * Get previously extracted tasks for a conversation
   */
  const getPreviousExtractions = useCallback(
    async (conversationId: string) => {
      try {
        const response = await fetch(
          `/api/tasks/extract?conversationId=${conversationId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch previous extractions");
        }

        const data = await response.json();
        return data.tasks || [];
      } catch (err) {
        console.error("Error fetching previous extractions:", err);
        return [];
      }
    },
    []
  );

  /**
   * Clear the current extraction result
   */
  const clearResult = useCallback(() => {
    setExtractionResult(null);
    setError(null);
  }, []);

  /**
   * Detect if a message likely contains tasks
   */
  const detectTaskContent = useCallback((message: string): boolean => {
    const taskIndicators = [
      // Action verbs
      /\b(implement|create|add|build|fix|update|refactor|test|deploy|setup|configure|install)\b/i,
      // Task-related keywords
      /\b(task|todo|feature|bug|issue|requirement|should|need to|must)\b/i,
      // Lists
      /^\d+\./m, // Numbered lists
      /^[-*]\s/m, // Bullet points
      // Time-related
      /\b(deadline|due|priority|urgent|asap)\b/i,
    ];

    return taskIndicators.some((pattern) => pattern.test(message));
  }, []);

  /**
   * Auto-detect if extraction should be suggested based on conversation
   */
  const shouldSuggestExtraction = useCallback(
    (messages: Array<{ role: string; content: string }>): boolean => {
      if (messages.length < 3) return false;

      // Get last few messages
      const recentMessages = messages.slice(-5);

      // Count task-like content in recent messages
      const taskLikeCount = recentMessages.filter((msg) =>
        detectTaskContent(msg.content)
      ).length;

      // Suggest if 60% or more of recent messages contain task-like content
      return taskLikeCount / recentMessages.length >= 0.6;
    },
    [detectTaskContent]
  );

  return {
    // State
    isExtracting,
    extractionResult,
    error,

    // Actions
    extractFromConversation,
    extractFromMessage,
    extractFromMessages,
    breakDownTask,
    getPreviousExtractions,
    clearResult,

    // Utilities
    detectTaskContent,
    shouldSuggestExtraction,
  };
}
