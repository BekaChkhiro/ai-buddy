/**
 * Bulk Operations for Tasks
 * Utility functions for performing operations on multiple tasks
 */

import { Task, TaskStatus, TaskPriority } from "@/types";

export interface BulkUpdateOptions {
  status?: TaskStatus;
  priority?: TaskPriority;
  labels?: string[];
  assigneeId?: string | null;
  dueDate?: string | null;
}

export interface BulkDeleteOptions {
  confirmMessage?: string;
}

export interface BulkOperationResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors: Array<{ taskId: string; error: string }>;
}

/**
 * Update multiple tasks with the same changes
 */
export async function bulkUpdateTasks(
  taskIds: string[],
  updates: BulkUpdateOptions,
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    success: true,
    successCount: 0,
    failureCount: 0,
    errors: [],
  };

  for (const taskId of taskIds) {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success) {
        result.successCount++;
      } else {
        result.failureCount++;
        result.errors.push({ taskId, error: data.error });
      }
    } catch (error) {
      result.failureCount++;
      result.errors.push({
        taskId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  result.success = result.failureCount === 0;
  return result;
}

/**
 * Delete multiple tasks
 */
export async function bulkDeleteTasks(
  taskIds: string[],
  options?: BulkDeleteOptions,
): Promise<BulkOperationResult> {
  const confirmMessage =
    options?.confirmMessage ||
    `Are you sure you want to delete ${taskIds.length} task(s)?`;

  if (!confirm(confirmMessage)) {
    return {
      success: false,
      successCount: 0,
      failureCount: 0,
      errors: [{ taskId: "all", error: "Operation cancelled" }],
    };
  }

  const result: BulkOperationResult = {
    success: true,
    successCount: 0,
    failureCount: 0,
    errors: [],
  };

  for (const taskId of taskIds) {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        result.successCount++;
      } else {
        result.failureCount++;
        result.errors.push({ taskId, error: data.error });
      }
    } catch (error) {
      result.failureCount++;
      result.errors.push({
        taskId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  result.success = result.failureCount === 0;
  return result;
}

/**
 * Change status for multiple tasks
 */
export async function bulkChangeStatus(
  taskIds: string[],
  status: TaskStatus,
): Promise<BulkOperationResult> {
  return bulkUpdateTasks(taskIds, { status });
}

/**
 * Change priority for multiple tasks
 */
export async function bulkChangePriority(
  taskIds: string[],
  priority: TaskPriority,
): Promise<BulkOperationResult> {
  return bulkUpdateTasks(taskIds, { priority });
}

/**
 * Add labels to multiple tasks
 */
export async function bulkAddLabels(
  tasks: Task[],
  newLabels: string[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    success: true,
    successCount: 0,
    failureCount: 0,
    errors: [],
  };

  for (const task of tasks) {
    const updatedLabels = Array.from(
      new Set([...task.labels, ...newLabels]),
    );

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labels: updatedLabels }),
      });

      const data = await response.json();

      if (data.success) {
        result.successCount++;
      } else {
        result.failureCount++;
        result.errors.push({ taskId: task.id, error: data.error });
      }
    } catch (error) {
      result.failureCount++;
      result.errors.push({
        taskId: task.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  result.success = result.failureCount === 0;
  return result;
}

/**
 * Remove labels from multiple tasks
 */
export async function bulkRemoveLabels(
  tasks: Task[],
  labelsToRemove: string[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    success: true,
    successCount: 0,
    failureCount: 0,
    errors: [],
  };

  for (const task of tasks) {
    const updatedLabels = task.labels.filter(
      (label) => !labelsToRemove.includes(label),
    );

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labels: updatedLabels }),
      });

      const data = await response.json();

      if (data.success) {
        result.successCount++;
      } else {
        result.failureCount++;
        result.errors.push({ taskId: task.id, error: data.error });
      }
    } catch (error) {
      result.failureCount++;
      result.errors.push({
        taskId: task.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  result.success = result.failureCount === 0;
  return result;
}

/**
 * Export tasks to JSON
 */
export function exportTasksToJSON(tasks: Task[]): string {
  return JSON.stringify(
    tasks.map((task) => ({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      labels: task.labels,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
    })),
    null,
    2,
  );
}

/**
 * Export tasks to CSV
 */
export function exportTasksToCSV(tasks: Task[]): string {
  const headers = [
    "Title",
    "Description",
    "Status",
    "Priority",
    "Due Date",
    "Labels",
    "Estimated Hours",
    "Actual Hours",
  ];

  const rows = tasks.map((task) => [
    task.title,
    task.description || "",
    task.status,
    task.priority,
    task.dueDate || "",
    task.labels.join("; "),
    task.estimatedHours?.toString() || "",
    task.actualHours?.toString() || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","),
    ),
  ].join("\n");

  return csvContent;
}

/**
 * Download tasks as file
 */
export function downloadTasks(tasks: Task[], format: "json" | "csv"): void {
  const content =
    format === "json"
      ? exportTasksToJSON(tasks)
      : exportTasksToCSV(tasks);

  const blob = new Blob([content], {
    type: format === "json" ? "application/json" : "text/csv",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tasks-export-${new Date().toISOString().split("T")[0]}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Filter tasks by status
 */
export function filterByStatus(tasks: Task[], status: TaskStatus): Task[] {
  return tasks.filter((task) => task.status === status);
}

/**
 * Filter tasks by priority
 */
export function filterByPriority(
  tasks: Task[],
  priority: TaskPriority,
): Task[] {
  return tasks.filter((task) => task.priority === priority);
}

/**
 * Filter overdue tasks
 */
export function filterOverdueTasks(tasks: Task[]): Task[] {
  const now = new Date();
  return tasks.filter(
    (task) =>
      task.dueDate &&
      new Date(task.dueDate) < now &&
      task.status !== "completed",
  );
}

/**
 * Get task statistics
 */
export function getTaskStatistics(tasks: Task[]) {
  const total = tasks.length;
  const byStatus = tasks.reduce(
    (acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    },
    {} as Record<TaskStatus, number>,
  );

  const byPriority = tasks.reduce(
    (acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    },
    {} as Record<TaskPriority, number>,
  );

  const overdue = filterOverdueTasks(tasks).length;

  const totalEstimatedHours = tasks.reduce(
    (sum, task) => sum + (task.estimatedHours || 0),
    0,
  );

  const totalActualHours = tasks.reduce(
    (sum, task) => sum + (task.actualHours || 0),
    0,
  );

  return {
    total,
    byStatus,
    byPriority,
    overdue,
    totalEstimatedHours,
    totalActualHours,
    completionRate:
      total > 0
        ? ((byStatus.completed || 0) / total) * 100
        : 0,
  };
}
