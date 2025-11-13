"use client";

import { useState, useEffect, use } from "react";
import { Task, TaskStatus, TaskWithDetails } from "@/types";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskForm, TaskFormData } from "@/components/tasks/TaskForm";
import { TaskDetail } from "@/components/tasks/TaskDetail";
import { Button } from "@/components/ui/button";
import { Plus, List } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function TasksKanbanPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(
    null,
  );
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?project_id=${projectId}`);
      const data = await response.json();

      if (data.success) {
        setTasks(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  // Create or update task
  const handleSubmitTask = async (data: TaskFormData) => {
    try {
      const url = editingTask
        ? `/api/tasks/${editingTask.id}`
        : "/api/tasks";
      const method = editingTask ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          project_id: projectId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: editingTask
            ? "Task updated successfully"
            : "Task created successfully",
        });
        fetchTasks();
        setIsFormOpen(false);
        setEditingTask(null);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error saving task:", error);
      toast({
        title: "Error",
        description: "Failed to save task",
        variant: "destructive",
      });
    }
  };

  // Update task (for drag and drop)
  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (result.success) {
        // Optimistically update local state
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, ...updates } : task,
          ),
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
      // Refresh to revert optimistic update
      fetchTasks();
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Task deleted successfully",
        });
        fetchTasks();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  // View task details
  const handleViewTask = async (task: Task) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`);
      const result = await response.json();

      if (result.success) {
        setSelectedTask(result.data);
        setIsDetailOpen(true);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error fetching task details:", error);
      toast({
        title: "Error",
        description: "Failed to load task details",
        variant: "destructive",
      });
    }
  };

  // Implement task
  const handleImplementTask = async () => {
    if (!selectedTask) return;

    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}/implement`, {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Task implementation started",
        });
        fetchTasks();
        setIsDetailOpen(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error implementing task:", error);
      toast({
        title: "Error",
        description: "Failed to start task implementation",
        variant: "destructive",
      });
    }
  };

  // Add comment
  const handleAddComment = async (content: string) => {
    // TODO: Implement comment API endpoint
    console.log("Add comment:", content);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">
            Manage your project tasks with a Kanban board
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/projects/${projectId}/tasks/list`}>
              <List className="h-4 w-4 mr-2" />
              List View
            </Link>
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <TaskBoard
          tasks={tasks}
          onTaskUpdate={handleTaskUpdate}
          onTaskEdit={(task) => {
            setEditingTask(task);
            setIsFormOpen(true);
          }}
          onTaskDelete={handleDeleteTask}
          onTaskView={handleViewTask}
        />
      </div>

      <TaskForm
        task={editingTask}
        projectId={projectId}
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingTask(null);
        }}
        onSubmit={handleSubmitTask}
      />

      <TaskDetail
        task={selectedTask}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onEdit={() => {
          if (selectedTask) {
            setEditingTask(selectedTask as any);
            setIsFormOpen(true);
            setIsDetailOpen(false);
          }
        }}
        onImplement={handleImplementTask}
        onAddComment={handleAddComment}
      />
    </div>
  );
}
