"use client";

import { useState } from "react";
import { ExtractedTask } from "@/lib/claude/task-extraction";
import { TaskPriority } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  X,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface TaskReviewProps {
  tasks: ExtractedTask[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (tasks: ExtractedTask[]) => void;
  isCreating?: boolean;
}

export function TaskReview({
  tasks,
  open,
  onOpenChange,
  onSave,
  isCreating = false,
}: TaskReviewProps) {
  const [editedTasks, setEditedTasks] = useState<ExtractedTask[]>(tasks);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentTask = editedTasks[currentIndex];

  const updateCurrentTask = (updates: Partial<ExtractedTask>) => {
    const updated = [...editedTasks];
    const current = updated[currentIndex];
    if (!current) return;
    updated[currentIndex] = { ...current, ...updates };
    setEditedTasks(updated);
  };

  const removeCurrentTask = () => {
    const updated = editedTasks.filter((_, i) => i !== currentIndex);
    setEditedTasks(updated);
    if (currentIndex >= updated.length && updated.length > 0) {
      setCurrentIndex(updated.length - 1);
    }
  };

  const addTag = (tag: string) => {
    if (!currentTask || !tag || currentTask.tags?.includes(tag)) return;
    updateCurrentTask({
      tags: [...(currentTask.tags || []), tag],
    });
  };

  const removeTag = (tag: string) => {
    if (!currentTask) return;
    updateCurrentTask({
      tags: currentTask.tags?.filter((t) => t !== tag),
    });
  };

  const addTechnicalRequirement = (req: string) => {
    if (!currentTask || !req || currentTask.technicalRequirements?.includes(req)) return;
    updateCurrentTask({
      technicalRequirements: [...(currentTask.technicalRequirements || []), req],
    });
  };

  const removeTechnicalRequirement = (req: string) => {
    if (!currentTask) return;
    updateCurrentTask({
      technicalRequirements: currentTask.technicalRequirements?.filter((r) => r !== req),
    });
  };

  const handleSave = () => {
    onSave(editedTasks);
  };

  const goToNext = () => {
    if (currentIndex < editedTasks.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!currentTask) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Review & Edit Tasks</DialogTitle>
          <DialogDescription>
            Review and modify the extracted tasks before creating them.
            {editedTasks.length > 1 && (
              <span className="ml-2 font-medium">
                Task {currentIndex + 1} of {editedTasks.length}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={currentTask.title}
                onChange={(e) => updateCurrentTask({ title: e.target.value })}
                placeholder="Task title"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={currentTask.description}
                onChange={(e) => updateCurrentTask({ description: e.target.value })}
                placeholder="Task description"
                rows={4}
              />
            </div>

            {/* Priority and Complexity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={currentTask.priority}
                  onValueChange={(value) =>
                    updateCurrentTask({ priority: value as TaskPriority })
                  }
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complexity">Complexity</Label>
                <Select
                  value={currentTask.complexity}
                  onValueChange={(value) =>
                    updateCurrentTask({ complexity: value as any })
                  }
                >
                  <SelectTrigger id="complexity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Estimated Hours */}
            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                min="0"
                step="0.5"
                value={currentTask.estimatedHours || ""}
                onChange={(e) =>
                  updateCurrentTask({
                    estimatedHours: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="8"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {currentTask.tags?.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  id="new-tag"
                  placeholder="Add a tag"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const input = document.getElementById("new-tag") as HTMLInputElement;
                    addTag(input.value);
                    input.value = "";
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Technical Requirements */}
            <div className="space-y-2">
              <Label>Technical Requirements</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {currentTask.technicalRequirements?.map((req, i) => (
                  <Badge key={i} variant="outline" className="gap-1">
                    {req}
                    <button
                      onClick={() => removeTechnicalRequirement(req)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  id="new-req"
                  placeholder="Add a requirement (e.g., React, TypeScript)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTechnicalRequirement(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const input = document.getElementById("new-req") as HTMLInputElement;
                    addTechnicalRequirement(input.value);
                    input.value = "";
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Confidence Score (read-only) */}
            <div className="space-y-2">
              <Label>AI Confidence Score</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${currentTask.confidenceScore * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {Math.round(currentTask.confidenceScore * 100)}%
                </span>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="flex gap-2">
            {editedTasks.length > 1 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={removeCurrentTask}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Task
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {editedTasks.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevious}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNext}
                  disabled={currentIndex === editedTasks.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isCreating || editedTasks.length === 0}>
              {isCreating ? (
                "Creating..."
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Create {editedTasks.length} Task{editedTasks.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
