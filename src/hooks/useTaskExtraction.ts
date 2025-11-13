/**
 * Hook for managing AI-powered task extraction from chat
 */

import { useState, useCallback } from "react";
import {
  extractTasksFromConversation,
  extractTasksFromMessage,
  detectTaskLikeContent,
  breakDownComplexTask,
  ExtractedTask,
  TaskExtractionResult,
  ExtractionOptions,
  ChatMessageForExtraction,
} from "@/lib/claude/task-extraction";
import { useToast } from "@/hooks/use-toast";

export interface UseTaskExtractionOptions {
  projectId: string;
  conversationId?: string;
}

export function useTaskExtraction({
  projectId,
}: UseTaskExtractionOptions) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<TaskExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Extract tasks from a list of messages
   */
  const extractFromMessages = useCallback(
    async (
      messages: ChatMessageForExtraction[],
      options?: ExtractionOptions
    ): Promise<TaskExtractionResult | null> => {
      setIsExtracting(true);
      setError(null);

      try {
        const result = await extractTasksFromConversation(messages, {
          ...options,
          projectContext: {
            // Add project context if needed
          },
        });

        setExtractionResult(result);

        if (result.tasks.length === 0) {
          toast({
            title: "No tasks found",
            description: "Could not extract any actionable tasks from the conversation.",
            variant: "default",
          });
        } else {
          toast({
            title: "Tasks extracted",
            description: `Found ${result.tasks.length} actionable task${result.tasks.length !== 1 ? "s" : ""} (${Math.round(result.totalConfidence * 100)}% confidence)`,
          });
        }

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to extract tasks";
        setError(errorMessage);
        toast({
          title: "Extraction failed",
          description: errorMessage,
          variant: "destructive",
        });
        return null;
      } finally {
        setIsExtracting(false);
      }
    },
    [toast]
  );

  /**
   * Extract tasks from a single message
   */
  const extractFromSingleMessage = useCallback(
    async (
      message: string,
      options?: ExtractionOptions
    ): Promise<TaskExtractionResult | null> => {
      setIsExtracting(true);
      setError(null);

      try {
        const result = await extractTasksFromMessage(message, {
          ...options,
          useFastModel: true,
        });

        setExtractionResult(result);

        if (result.tasks.length > 0) {
          toast({
            title: "Tasks extracted",
            description: `Found ${result.tasks.length} task${result.tasks.length !== 1 ? "s" : ""} in your message`,
          });
        }

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to extract tasks";
        setError(errorMessage);
        toast({
          title: "Extraction failed",
          description: errorMessage,
          variant: "destructive",
        });
        return null;
      } finally {
        setIsExtracting(false);
      }
    },
    [toast]
  );

  /**
   * Break down a complex task into subtasks
   */
  const breakDownTask = useCallback(
    async (
      taskTitle: string,
      taskDescription: string,
      options?: ExtractionOptions
    ): Promise<ExtractedTask[] | null> => {
      setIsExtracting(true);
      setError(null);

      try {
        const subtasks = await breakDownComplexTask(
          taskTitle,
          taskDescription,
          options
        );

        toast({
          title: "Task broken down",
          description: `Created ${subtasks.length} subtasks`,
        });

        return subtasks;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to break down task";
        setError(errorMessage);
        toast({
          title: "Breakdown failed",
          description: errorMessage,
          variant: "destructive",
        });
        return null;
      } finally {
        setIsExtracting(false);
      }
    },
    [toast]
  );

  /**
   * Check if a message contains task-like content
   */
  const hasTaskContent = useCallback((message: string): boolean => {
    return detectTaskLikeContent(message);
  }, []);

  /**
   * Clear the current extraction result
   */
  const clearExtraction = useCallback(() => {
    setExtractionResult(null);
    setError(null);
  }, []);

  return {
    // State
    isExtracting,
    extractionResult,
    error,

    // Actions
    extractFromMessages,
    extractFromSingleMessage,
    breakDownTask,
    hasTaskContent,
    clearExtraction,
  };
}
