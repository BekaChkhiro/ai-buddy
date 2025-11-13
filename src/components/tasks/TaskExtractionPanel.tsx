"use client";

import { useState } from "react";
import { ExtractedTask } from "@/lib/claude/task-extraction";
import { TaskSuggestions } from "./TaskSuggestions";
import { TaskReview } from "./TaskReview";
import { BulkTaskCreate } from "./BulkTaskCreate";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
}

interface TaskExtractionPanelProps {
  projectId: string;
  conversationId?: string;
  extractionResult: any;
  onTasksCreated?: (count: number) => void;
  onClose?: () => void;
}

export function TaskExtractionPanel({
  projectId,
  conversationId,
  extractionResult,
  onTasksCreated,
  onClose,
}: TaskExtractionPanelProps) {
  const [stage, setStage] = useState<"suggestions" | "review" | "create">("suggestions");
  const [selectedTasks, setSelectedTasks] = useState<ExtractedTask[]>([]);
  const { toast } = useToast();

  const handleAccept = (tasks: ExtractedTask[]) => {
    setSelectedTasks(tasks);
    setStage("create");
  };

  const handleReview = (tasks: ExtractedTask[]) => {
    setSelectedTasks(tasks);
    setStage("review");
  };

  const handleReviewSave = (tasks: ExtractedTask[]) => {
    setSelectedTasks(tasks);
    setStage("create");
  };

  const handleComplete = (result: { success: boolean; createdCount: number; errors: string[] }) => {
    if (result.success) {
      toast({
        title: "Tasks created successfully",
        description: `Created ${result.createdCount} task${result.createdCount !== 1 ? "s" : ""}`,
      });
      onTasksCreated?.(result.createdCount);
      onClose?.();
    } else {
      toast({
        title: "Some tasks failed to create",
        description: `Created ${result.createdCount} task${result.createdCount !== 1 ? "s" : ""}, ${result.errors.length} failed`,
        variant: "destructive",
      });
    }
  };

  if (!extractionResult) {
    return null;
  }

  return (
    <>
      {stage === "suggestions" && (
        <TaskSuggestions
          extractionResult={extractionResult}
          onAccept={handleAccept}
          onReject={() => onClose?.()}
          onReview={handleReview}
        />
      )}

      {stage === "review" && (
        <TaskReview
          tasks={selectedTasks}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setStage("suggestions");
            }
          }}
          onSave={handleReviewSave}
        />
      )}

      {stage === "create" && (
        <BulkTaskCreate
          tasks={selectedTasks}
          projectId={projectId}
          conversationId={conversationId}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              onClose?.();
            }
          }}
          onComplete={handleComplete}
        />
      )}
    </>
  );
}

// Export a standalone extraction trigger
export function useTaskExtractionTrigger(projectId: string, conversationId?: string) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const { toast } = useToast();

  const extractFromMessages = async (messages: Message[]) => {
    setIsExtracting(true);
    try {
      const response = await fetch("/api/tasks/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            createdAt: msg.createdAt.toISOString(),
          })),
          projectId,
          conversationId,
          options: {
            includeTechnicalRequirements: true,
            includeTimeEstimates: true,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setExtractionResult(data.data);
        return data.data;
      } else {
        toast({
          title: "Extraction failed",
          description: data.error,
          variant: "destructive",
        });
        return null;
      }
    } catch (error) {
      toast({
        title: "Extraction failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsExtracting(false);
    }
  };

  const extractFromSingleMessage = async (message: string) => {
    setIsExtracting(true);
    try {
      const response = await fetch("/api/tasks/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          singleMessage: message,
          projectId,
          conversationId,
          options: {
            useFastModel: true,
            includeTechnicalRequirements: true,
            includeTimeEstimates: true,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setExtractionResult(data.data);
        return data.data;
      } else {
        toast({
          title: "Extraction failed",
          description: data.error,
          variant: "destructive",
        });
        return null;
      }
    } catch (error) {
      toast({
        title: "Extraction failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsExtracting(false);
    }
  };

  const clearExtraction = () => {
    setExtractionResult(null);
  };

  return {
    isExtracting,
    extractionResult,
    extractFromMessages,
    extractFromSingleMessage,
    clearExtraction,
  };
}
