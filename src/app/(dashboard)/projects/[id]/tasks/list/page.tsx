"use client";

import { useState, useEffect, useMemo, use } from "react";
import { Task, TaskWithDetails } from "@/types";
import {
  TaskFilters,
  TaskFilterValues,
} from "@/components/tasks/TaskFilters";
import { TaskForm, TaskFormData } from "@/components/tasks/TaskForm";
import { TaskDetail } from "@/components/tasks/TaskDetail";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, LayoutGrid, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function TasksListPage({ params }: PageProps) {
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

  const [filters, setFilters] = useState<TaskFilterValues>({
    search: "",
    status: "all",
    priority: "all",
    labels: [],
  });

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

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== "all" && task.status !== filters.status) {
        return false;
      }

      // Priority filter
      if (filters.priority !== "all" && task.priority !== filters.priority) {
        return false;
      }

      // Labels filter
      if (filters.labels.length > 0) {
        const hasLabel = filters.labels.some((label) =>
          task.labels.includes(label),
        );
        if (!hasLabel) return false;
      }

      return true;
    });
  }, [tasks, filters]);

  // Get available labels
  const availableLabels = useMemo(() => {
    const labels = new Set<string>();
    tasks.forEach((task) => {
      task.labels.forEach((label) => labels.add(label));
    });
    return Array.from(labels).sort();
  }, [tasks]);

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

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-blue-500/10 text-blue-500",
      medium: "bg-yellow-500/10 text-yellow-500",
      high: "bg-orange-500/10 text-orange-500",
      urgent: "bg-red-500/10 text-red-500",
    };
    return colors[priority as keyof typeof colors] || "";
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-gray-500/10 text-gray-500",
      in_progress: "bg-blue-500/10 text-blue-500",
      implementing: "bg-purple-500/10 text-purple-500",
      completed: "bg-green-500/10 text-green-500",
      failed: "bg-red-500/10 text-red-500",
      blocked: "bg-orange-500/10 text-orange-500",
    };
    return colors[status as keyof typeof colors] || "";
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
            View and manage tasks in list format
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/projects/${projectId}/tasks`}>
              <LayoutGrid className="h-4 w-4 mr-2" />
              Board View
            </Link>
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 flex-1 overflow-hidden">
        <div className="col-span-1">
          <TaskFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableLabels={availableLabels}
          />
        </div>

        <div className="col-span-3 overflow-auto">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Labels</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">
                        {tasks.length === 0
                          ? "No tasks yet. Create one to get started!"
                          : "No tasks match your filters."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks.map((task) => (
                    <TableRow
                      key={task.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleViewTask(task)}
                    >
                      <TableCell className="font-medium">
                        {task.title}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {task.dueDate ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(task.dueDate), "MMM d, yyyy")}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.estimatedHours ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {task.estimatedHours}h
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {task.labels.slice(0, 2).map((label) => (
                            <Badge key={label} variant="outline" className="text-xs">
                              {label}
                            </Badge>
                          ))}
                          {task.labels.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{task.labels.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
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
      />
    </div>
  );
}
