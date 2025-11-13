"use client";

import { useState } from "react";
import { ExtractedTask } from "@/lib/claude/task-extraction";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkTaskCreateProps {
  tasks: ExtractedTask[];
  projectId: string;
  conversationId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (result: { success: boolean; createdCount: number; errors: string[] }) => void;
}

interface TaskCreationStatus {
  task: ExtractedTask;
  status: "pending" | "creating" | "success" | "error";
  error?: string;
  taskId?: string;
}

export function BulkTaskCreate({
  tasks,
  projectId,
  conversationId,
  open,
  onOpenChange,
  onComplete,
}: BulkTaskCreateProps) {
  const [statuses, setStatuses] = useState<TaskCreationStatus[]>(
    tasks.map((task) => ({ task, status: "pending" }))
  );
  const [isCreating, setIsCreating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const createdCount = statuses.filter((s) => s.status === "success").length;
  const errorCount = statuses.filter((s) => s.status === "error").length;
  const progress = (currentIndex / tasks.length) * 100;

  const createTasks = async () => {
    setIsCreating(true);
    const errors: string[] = [];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      if (!task) continue;

      setCurrentIndex(i);

      // Update status to creating
      setStatuses((prev) =>
        prev.map((s, idx) =>
          idx === i ? { ...s, status: "creating" } : s
        )
      );

      try {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            title: task.title,
            description: task.description,
            priority: task.priority,
            status: "pending",
            estimatedHours: task.estimatedHours,
            labels: [
              ...(task.tags || []),
              `extracted-${new Date().toISOString().split("T")[0]}`,
              `confidence-${Math.round(task.confidenceScore * 100)}`,
            ],
            implementationDetails: {
              complexity: task.complexity,
              technicalRequirements: task.technicalRequirements,
              confidenceScore: task.confidenceScore,
              extractedFrom: conversationId,
              sourceMessageIds: task.sourceMessageIds,
              suggestedOrder: task.suggestedOrder,
            },
          }),
        });

        const data = await response.json();

        if (data.success) {
          setStatuses((prev) =>
            prev.map((s, idx) =>
              idx === i
                ? { ...s, status: "success", taskId: data.data?.id }
                : s
            )
          );
        } else {
          const error = `Failed to create "${task.title}": ${data.error}`;
          errors.push(error);
          setStatuses((prev) =>
            prev.map((s, idx) =>
              idx === i ? { ...s, status: "error", error: data.error } : s
            )
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errors.push(`Failed to create "${task.title}": ${errorMessage}`);
        setStatuses((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: "error", error: errorMessage } : s
          )
        );
      }

      // Small delay between requests to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setCurrentIndex(tasks.length);
    setIsCreating(false);

    onComplete({
      success: errors.length === 0,
      createdCount: tasks.length - errors.length,
      errors,
    });
  };

  const handleClose = () => {
    if (!isCreating) {
      onOpenChange(false);
    }
  };

  const getStatusIcon = (status: TaskCreationStatus["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case "creating":
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const allCompleted = currentIndex === tasks.length && !isCreating;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isCreating
              ? "Creating Tasks..."
              : allCompleted
                ? "Task Creation Complete"
                : "Ready to Create Tasks"}
          </DialogTitle>
          <DialogDescription>
            {isCreating
              ? `Creating ${currentIndex} of ${tasks.length} tasks...`
              : allCompleted
                ? `Successfully created ${createdCount} of ${tasks.length} tasks`
                : `Create ${tasks.length} task${tasks.length !== 1 ? "s" : ""} in your project`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress */}
          {(isCreating || allCompleted) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {currentIndex} / {tasks.length}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Statistics */}
          {allCompleted && (
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                <div className="p-2 rounded-full bg-background">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium">{createdCount}</div>
                  <div className="text-xs text-muted-foreground">Created</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                <div className="p-2 rounded-full bg-background">
                  <XCircle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <div className="text-sm font-medium">{errorCount}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                <div className="p-2 rounded-full bg-background">
                  <AlertCircle className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">{tasks.length}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            </div>
          )}

          {/* Task List */}
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2 pr-4">
              {statuses.map((status, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                    status.status === "success" && "bg-green-50 border-green-200 dark:bg-green-950/20",
                    status.status === "error" && "bg-destructive/5 border-destructive/20",
                    status.status === "creating" && "bg-primary/5 border-primary/20"
                  )}
                >
                  <div className="mt-0.5">
                    {getStatusIcon(status.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">
                          {status.task.title}
                        </h4>
                        {status.task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {status.task.description}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          status.status === "success"
                            ? "default"
                            : status.status === "error"
                              ? "destructive"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {status.status}
                      </Badge>
                    </div>
                    {status.error && (
                      <p className="text-xs text-destructive mt-1">
                        {status.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex justify-end gap-2">
          {!isCreating && !allCompleted ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={createTasks}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Create All Tasks
              </Button>
            </>
          ) : allCompleted ? (
            <Button onClick={handleClose}>
              Close
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
