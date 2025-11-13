"use client";

import { useState } from "react";
import { TaskWithDetails, TaskPriority, TaskStatus } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskTimeline } from "./TaskTimeline";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Calendar,
  Clock,
  Edit,
  Play,
  User,
  MessageSquare,
  History,
  Link as LinkIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TaskDetailProps {
  task: TaskWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onImplement?: () => void;
  onAddComment?: (content: string) => Promise<void>;
}

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

export function TaskDetail({
  task,
  open,
  onOpenChange,
  onEdit,
  onImplement,
  onAddComment,
}: TaskDetailProps) {
  const [commentContent, setCommentContent] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  if (!task) return null;

  const handleSubmitComment = async () => {
    if (!commentContent.trim() || !onAddComment) return;

    setIsSubmittingComment(true);
    try {
      await onAddComment(commentContent);
      setCommentContent("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl leading-tight pr-8">
                {task.title}
              </DialogTitle>
              <div className="flex flex-wrap gap-2 mt-3">
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
            <div className="flex gap-2">
              {onEdit && (
                <Button size="sm" variant="outline" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {onImplement && task.status !== "completed" && (
                <Button size="sm" onClick={onImplement}>
                  <Play className="h-4 w-4 mr-2" />
                  Implement
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 pb-4">
            {/* Description */}
            {task.description && (
              <div>
                <h3 className="font-semibold text-sm mb-2">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              {task.dueDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p className="font-medium">
                      {format(new Date(task.dueDate), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              )}

              {task.estimatedHours && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Time Estimate</p>
                    <p className="font-medium">
                      {task.estimatedHours}h
                      {task.actualHours ? ` / ${task.actualHours}h spent` : ""}
                    </p>
                  </div>
                </div>
              )}

              {task.assignee && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Assignee</p>
                    <p className="font-medium">
                      {task.assignee.fullName || task.assignee.email}
                    </p>
                  </div>
                </div>
              )}

              {task.startedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Started</p>
                    <p className="font-medium">
                      {format(new Date(task.startedAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Dependencies */}
            {(task.dependencies.length > 0 || task.dependents.length > 0) && (
              <div>
                <h3 className="font-semibold text-sm mb-2">Dependencies</h3>
                <div className="space-y-2">
                  {task.dependencies.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">
                        Blocked by:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
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
                      <p className="text-xs text-muted-foreground mb-1.5">
                        Blocking:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {task.dependents.map((dep) => (
                          <Badge key={dep.id} variant="outline" className="gap-1">
                            <LinkIcon className="h-3 w-3" />
                            {(dep as any).task?.title || "Task"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tabs for Comments and History */}
            <Tabs defaultValue="comments" className="w-full">
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

              <TabsContent value="comments" className="space-y-4 mt-4">
                {/* Add Comment */}
                {onAddComment && (
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
                      disabled={
                        !commentContent.trim() || isSubmittingComment
                      }
                    >
                      {isSubmittingComment ? "Adding..." : "Add Comment"}
                    </Button>
                  </div>
                )}

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

              <TabsContent value="history" className="mt-4">
                <TaskTimeline history={task.history} />
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
