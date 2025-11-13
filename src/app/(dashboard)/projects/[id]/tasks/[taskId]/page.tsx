"use client";

import { useState, useEffect, use } from "react";
import { TaskWithDetails, TaskPriority, TaskStatus } from "@/types";
import { TaskTimeline } from "@/components/tasks/TaskTimeline";
import { TaskForm, TaskFormData } from "@/components/tasks/TaskForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  Play,
  User,
  MessageSquare,
  History,
  Link as LinkIcon,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PageProps {
  params: Promise<{
    id: string;
    taskId: string;
  }>;
}

export default function TaskDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const taskId = resolvedParams.taskId;
  const router = useRouter();
  const { toast } = useToast();

  const [task, setTask] = useState<TaskWithDetails | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const priorityColors: Record<TaskPriority, string> = {
    low: "bg-blue-500/10 text-blue-500",
    medium: "bg-yellow-500/10 text-yellow-500",
    high: "bg-orange-500/10 text-orange-500",
    urgent: "bg-red-500/10 text-red-500",
  };

  const statusColors: Record<TaskStatus, string> = {
    pending: "bg-gray-500/10 text-gray-500",
    in_progress: "bg-blue-500/10 text-blue-500",
    implementing: "bg-purple-500/10 text-purple-500",
    completed: "bg-green-500/10 text-green-500",
    failed: "bg-red-500/10 text-red-500",
    blocked: "bg-orange-500/10 text-orange-500",
  };

  // Fetch task details
  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      const result = await response.json();

      if (result.success) {
        setTask(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error fetching task:", error);
      toast({
        title: "Error",
        description: "Failed to load task details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  // Update task
  const handleSubmitTask = async (data: TaskFormData) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Task updated successfully",
        });
        fetchTask();
        setIsFormOpen(false);
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
    }
  };

  // Delete task
  const handleDeleteTask = async () => {
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
        router.push(`/projects/${projectId}/tasks`);
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

  // Implement task
  const handleImplementTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/implement`, {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Task implementation started",
        });
        fetchTask();
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
  const handleSubmitComment = async () => {
    if (!commentContent.trim()) return;

    setIsSubmittingComment(true);
    try {
      // TODO: Implement comment API endpoint
      console.log("Add comment:", commentContent);
      setCommentContent("");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading task...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">Task not found</p>
        <Button asChild>
          <Link href={`/projects/${projectId}/tasks`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/projects/${projectId}/tasks`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsFormOpen(true)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        {task.status !== "completed" && (
          <Button size="sm" onClick={handleImplementTask}>
            <Play className="h-4 w-4 mr-2" />
            Implement
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDeleteTask}
        >
          <Trash className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      <div className="flex-1 overflow-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="space-y-3">
              <CardTitle className="text-2xl">{task.title}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge className={statusColors[task.status]}>
                  {task.status.replace("_", " ")}
                </Badge>
                <Badge className={priorityColors[task.priority]}>
                  {task.priority}
                </Badge>
                {task.labels.map((label) => (
                  <Badge key={label} variant="outline">
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>
          {task.description && (
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {task.description}
              </p>
            </CardContent>
          )}
        </Card>

        {/* Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {task.dueDate && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p className="font-medium text-sm">
                      {format(new Date(task.dueDate), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {task.estimatedHours && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Time Estimate
                    </p>
                    <p className="font-medium text-sm">
                      {task.estimatedHours}h
                      {task.actualHours ? ` / ${task.actualHours}h` : ""}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {task.assignee && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Assignee</p>
                    <p className="font-medium text-sm">
                      {task.assignee.fullName || task.assignee.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {task.startedAt && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Started</p>
                    <p className="font-medium text-sm">
                      {format(new Date(task.startedAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Dependencies */}
        {(task.dependencies.length > 0 || task.dependents.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dependencies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.dependencies.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Blocked by:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {task.dependencies.map((dep) => (
                      <Badge key={dep.id} variant="outline" className="gap-1">
                        <LinkIcon className="h-3 w-3" />
                        {(dep as any).depends_on?.title || "Task"}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {task.dependents.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Blocking:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {task.dependents.map((dep) => (
                      <Badge key={dep.id} variant="outline" className="gap-1">
                        <LinkIcon className="h-3 w-3" />
                        {(dep as any).task?.title || "Task"}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Comments and History */}
        <Card>
          <Tabs defaultValue="comments" className="w-full">
            <CardHeader>
              <TabsList className="w-full">
                <TabsTrigger value="comments" className="flex-1">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Comments ({task.comments.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-1">
                  <History className="h-4 w-4 mr-2" />
                  History ({task.history.length})
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="comments" className="space-y-4 mt-0">
                {/* Add Comment */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    rows={3}
                  />
                  <Button
                    size="sm"
                    onClick={handleSubmitComment}
                    disabled={!commentContent.trim() || isSubmittingComment}
                  >
                    {isSubmittingComment ? "Adding..." : "Add Comment"}
                  </Button>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {task.comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No comments yet
                    </p>
                  ) : (
                    task.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarFallback className="text-xs">
                            {comment.user.fullName
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() ||
                              comment.user.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-muted rounded-lg p-3">
                            <p className="font-medium text-sm">
                              {comment.user.fullName || comment.user.email}
                            </p>
                            <p className="text-sm mt-1 whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(
                              new Date(comment.createdAt),
                              "MMM d, yyyy 'at' h:mm a",
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <TaskTimeline history={task.history} />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      <TaskForm
        task={task as any}
        projectId={projectId}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmitTask}
      />
    </div>
  );
}
