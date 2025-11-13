"use client";

import { useState } from "react";
import { ExtractedTask } from "@/lib/claude/task-extraction";
import { Task } from "@/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkTaskCreateProps {
  tasks: ExtractedTask[];
  projectId: string;
  conversationId?: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (createdTasks: Task[]) => void;
  onError: (error: string) => void;
}

interface TaskCreationStatus {
  task: ExtractedTask;
  status: "pending" | "creating" | "success" | "error";
  error?: string;
  createdTask?: Task;
}

export function BulkTaskCreate({
  tasks,
  projectId,
  conversationId,
  isOpen,
  onClose,
  onComplete,
  onError,
}: BulkTaskCreateProps) {
  const [taskStatuses, setTaskStatuses] = useState<TaskCreationStatus[]>(
    tasks.map((task) => ({ task, status: "pending" }))
  );
  const [isCreating, setIsCreating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const successCount = taskStatuses.filter((s) => s.status === "success").length;
  const errorCount = taskStatuses.filter((s) => s.status === "error").length;
  const progress = (currentIndex / tasks.length) * 100;
  const isComplete = currentIndex >= tasks.length;

  const createTask = async (
    task: ExtractedTask,
    index: number
  ): Promise<void> => {
    // Update status to creating
    setTaskStatuses((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: "creating" };
      return updated;
    });

    try {
      // Create task via API
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title: task.title,
          description: task.description,
          priority: task.priority,
          labels: task.suggestedLabels,
          estimatedHours: task.estimatedHours,
          status: "pending",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create task");
      }

      const createdTask = await response.json();

      // If we have a conversation ID, create task-message link
      if (conversationId) {
        try {
          await fetch("/api/tasks/links", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              taskId: createdTask.id,
              conversationId,
              linkType: "extracted_from",
            }),
          });
        } catch (linkError) {
          console.error("Failed to create task-message link:", linkError);
          // Don't fail the task creation if link fails
        }
      }

      // Update status to success
      setTaskStatuses((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status: "success",
          createdTask,
        };
        return updated;
      });
    } catch (error) {
      // Update status to error
      setTaskStatuses((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        };
        return updated;
      });
    }
  };

  const handleCreateAll = async () => {
    setIsCreating(true);

    // Create tasks sequentially to avoid overwhelming the API
    for (let i = 0; i < tasks.length; i++) {
      setCurrentIndex(i);
      await createTask(tasks[i], i);

      // Small delay between creations
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setCurrentIndex(tasks.length);
    setIsCreating(false);

    // Collect all successfully created tasks
    const createdTasks = taskStatuses
      .filter((s) => s.status === "success" && s.createdTask)
      .map((s) => s.createdTask!);

    if (createdTasks.length > 0) {
      onComplete(createdTasks);
    } else {
      onError("No tasks were created successfully");
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isComplete
              ? "Task Creation Complete"
              : isCreating
                ? "Creating Tasks..."
                : "Ready to Create Tasks"}
          </DialogTitle>
          <DialogDescription>
            {isComplete
              ? `Successfully created ${successCount} of ${tasks.length} tasks`
              : isCreating
                ? `Creating task ${currentIndex + 1} of ${tasks.length}`
                : `${tasks.length} tasks ready to be created`}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        {isCreating && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}

        {/* Task Status List */}
        <div className="max-h-[400px] overflow-y-auto space-y-2 py-2">
          {taskStatuses.map((taskStatus, index) => (
            <div
              key={index}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border",
                taskStatus.status === "success" &&
                  "bg-green-500/5 border-green-500/20",
                taskStatus.status === "error" &&
                  "bg-red-500/5 border-red-500/20",
                taskStatus.status === "creating" &&
                  "bg-blue-500/5 border-blue-500/20",
                taskStatus.status === "pending" &&
                  "bg-gray-500/5 border-gray-200 dark:border-gray-700"
              )}
            >
              <div className="mt-0.5">
                {taskStatus.status === "success" && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                {taskStatus.status === "error" && (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                {taskStatus.status === "creating" && (
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                )}
                {taskStatus.status === "pending" && (
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm leading-tight">
                  {taskStatus.task.title}
                </h4>
                {taskStatus.task.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {taskStatus.task.description}
                  </p>
                )}
                {taskStatus.error && (
                  <p className="text-xs text-red-600 mt-1">
                    Error: {taskStatus.error}
                  </p>
                )}
              </div>

              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {taskStatus.task.estimatedHours &&
                  `${taskStatus.task.estimatedHours}h`}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {isComplete && (
          <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {successCount}
              </div>
              <div className="text-xs text-muted-foreground">Successful</div>
            </div>
            {errorCount > 0 && (
              <>
                <div className="h-8 w-px bg-gray-300 dark:bg-gray-700" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {errorCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {!isCreating && !isComplete && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateAll}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Create All Tasks
              </Button>
            </>
          )}
          {isComplete && (
            <Button onClick={handleClose}>
              {successCount > 0 ? "Done" : "Close"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
