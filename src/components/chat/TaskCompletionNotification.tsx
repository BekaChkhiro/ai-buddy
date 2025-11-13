"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X } from "lucide-react";

interface CompletedTask {
  id: string;
  title: string;
  completedAt: Date;
}

interface TaskCompletionNotificationProps {
  completedTasks: CompletedTask[];
  onDismiss: (taskId: string) => void;
  onViewTask?: (taskId: string) => void;
}

export function TaskCompletionNotification({
  completedTasks,
  onDismiss,
  onViewTask,
}: TaskCompletionNotificationProps) {
  const [visible, setVisible] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Show new tasks
    completedTasks.forEach((task) => {
      setVisible((prev) => new Set(prev).add(task.id));

      // Auto-dismiss after 10 seconds
      setTimeout(() => {
        handleDismiss(task.id);
      }, 10000);
    });
  }, [completedTasks]);

  const handleDismiss = (taskId: string) => {
    setVisible((prev) => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });

    // Call parent immediately
    onDismiss(taskId);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
      {completedTasks
        .filter((task) => visible.has(task.id))
        .map((task) => (
          <div
            key={task.id}
            className="animate-in slide-in-from-bottom-5 fade-in duration-200"
          >
            <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-green-500/10">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-green-900 dark:text-green-100">
                      Task Completed
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-200 mt-0.5 line-clamp-2">
                      {task.title}
                    </p>
                    {onViewTask && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => onViewTask(task.id)}
                        className="h-auto p-0 mt-1 text-green-700 dark:text-green-300"
                      >
                        View task
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(task.id)}
                    className="h-6 w-6 p-0 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
    </div>
  );
}

/**
 * Hook to track task completions and show notifications
 */
export function useTaskCompletionNotifications() {
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);

  const addCompletedTask = (task: CompletedTask) => {
    setCompletedTasks((prev) => [...prev, task]);
  };

  const dismissTask = (taskId: string) => {
    setCompletedTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const clearAll = () => {
    setCompletedTasks([]);
  };

  return {
    completedTasks,
    addCompletedTask,
    dismissTask,
    clearAll,
  };
}
