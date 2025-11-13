"use client";

import { useState } from "react";
import { ExtractedTask } from "@/lib/claude/task-extraction";
import { TaskPriority } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskReviewProps {
  tasks: ExtractedTask[];
  isOpen: boolean;
  onClose: () => void;
  onApprove: (tasks: ExtractedTask[]) => void;
  onReject: () => void;
}

export function TaskReview({
  tasks,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: TaskReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editedTasks, setEditedTasks] = useState<ExtractedTask[]>(tasks);
  const [rejectedIndices, setRejectedIndices] = useState<Set<number>>(
    new Set()
  );

  const currentTask = editedTasks[currentIndex];
  const isRejected = rejectedIndices.has(currentIndex);

  const handleUpdateTask = (field: keyof ExtractedTask, value: any) => {
    const updated = [...editedTasks];
    updated[currentIndex] = {
      ...updated[currentIndex],
      [field]: value,
    };
    setEditedTasks(updated);
  };

  const handleToggleReject = () => {
    const newRejected = new Set(rejectedIndices);
    if (newRejected.has(currentIndex)) {
      newRejected.delete(currentIndex);
    } else {
      newRejected.add(currentIndex);
    }
    setRejectedIndices(newRejected);
  };

  const handleNext = () => {
    if (currentIndex < editedTasks.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleApproveAll = () => {
    // Filter out rejected tasks
    const approvedTasks = editedTasks.filter(
      (_, idx) => !rejectedIndices.has(idx)
    );
    onApprove(approvedTasks);
  };

  const addLabel = (label: string) => {
    if (!label.trim()) return;
    const labels = currentTask.suggestedLabels || [];
    if (!labels.includes(label.trim())) {
      handleUpdateTask("suggestedLabels", [...labels, label.trim()]);
    }
  };

  const removeLabel = (label: string) => {
    const labels = currentTask.suggestedLabels || [];
    handleUpdateTask(
      "suggestedLabels",
      labels.filter((l) => l !== label)
    );
  };

  const approvedCount = editedTasks.length - rejectedIndices.size;

  if (!currentTask) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <DialogTitle>
                Review Task {currentIndex + 1} of {editedTasks.length}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-green-600 font-medium">
                {approvedCount} approved
              </span>
              {rejectedIndices.size > 0 && (
                <span className="text-red-600 font-medium">
                  · {rejectedIndices.size} rejected
                </span>
              )}
            </div>
          </div>
          <DialogDescription>
            Review and edit AI-extracted tasks before adding them to your
            project
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            "space-y-4 p-4 rounded-lg border-2 transition-colors",
            isRejected
              ? "bg-red-500/5 border-red-500/20"
              : "bg-purple-500/5 border-purple-500/20"
          )}
        >
          {/* Reject Toggle */}
          <div className="flex justify-end">
            <Button
              variant={isRejected ? "destructive" : "outline"}
              size="sm"
              onClick={handleToggleReject}
            >
              {isRejected ? (
                <>
                  <XCircle className="h-4 w-4 mr-1" />
                  Rejected
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Approved
                </>
              )}
            </Button>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={currentTask.title}
              onChange={(e) => handleUpdateTask("title", e.target.value)}
              disabled={isRejected}
              placeholder="Clear, action-oriented title"
              maxLength={80}
            />
            <p className="text-xs text-muted-foreground">
              {currentTask.title.length}/80 characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={currentTask.description}
              onChange={(e) => handleUpdateTask("description", e.target.value)}
              disabled={isRejected}
              placeholder="Detailed requirements and acceptance criteria"
              rows={4}
            />
          </div>

          {/* Priority and Complexity Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={currentTask.priority}
                onValueChange={(value: TaskPriority) =>
                  handleUpdateTask("priority", value)
                }
                disabled={isRejected}
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
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                min="0"
                step="0.5"
                value={currentTask.estimatedHours || ""}
                onChange={(e) =>
                  handleUpdateTask(
                    "estimatedHours",
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                disabled={isRejected}
                placeholder="0.0"
              />
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <Label>Labels</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {currentTask.suggestedLabels.map((label, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="cursor-pointer hover:bg-red-500/20"
                  onClick={() => !isRejected && removeLabel(label)}
                >
                  {label}
                  {!isRejected && <X className="h-3 w-3 ml-1" />}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add label (press Enter)"
                disabled={isRejected}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addLabel(e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
              />
            </div>
          </div>

          {/* Technical Requirements */}
          {currentTask.technicalRequirements.length > 0 && (
            <div className="space-y-2">
              <Label>Technical Requirements</Label>
              <div className="flex flex-wrap gap-2">
                {currentTask.technicalRequirements.map((req, idx) => (
                  <Badge key={idx} variant="outline">
                    {req}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Dependencies */}
          {currentTask.dependencies.length > 0 && (
            <div className="space-y-2">
              <Label>Dependencies</Label>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {currentTask.dependencies.map((dep, idx) => (
                  <li key={idx}>{dep}</li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Reasoning */}
          {currentTask.reasoning && (
            <div className="pt-3 border-t">
              <Label className="text-xs text-muted-foreground">
                AI Reasoning
              </Label>
              <p className="text-sm text-muted-foreground italic mt-1">
                {currentTask.reasoning}
              </p>
            </div>
          )}

          {/* Confidence Score */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Label className="text-xs text-muted-foreground">
              AI Confidence:
            </Label>
            <Badge
              variant="outline"
              className={cn(
                currentTask.confidence >= 80
                  ? "text-green-600"
                  : currentTask.confidence >= 60
                    ? "text-yellow-600"
                    : "text-orange-600"
              )}
            >
              {currentTask.confidence}%
            </Badge>
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentIndex === editedTasks.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onReject}>
              Cancel
            </Button>
            <Button
              onClick={handleApproveAll}
              disabled={approvedCount === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Create {approvedCount} Task{approvedCount !== 1 ? "s" : ""}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
