"use client";

import { useState } from "react";
import {
  ExtractedTask,
  TaskExtractionResult,
} from "@/lib/claude/task-extraction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Tag,
  TrendingUp,
} from "lucide-react";
import { TaskPriority } from "@/types";
import { cn } from "@/lib/utils";

interface TaskSuggestionsProps {
  extractionResult: TaskExtractionResult;
  onAccept: (tasks: ExtractedTask[]) => void;
  onReject: () => void;
  onReview: (tasks: ExtractedTask[]) => void;
  isCreating?: boolean;
}

const priorityColors: Record<TaskPriority, string> = {
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  urgent: "bg-red-500/10 text-red-500 border-red-500/20",
};

const confidenceColors = (score: number): string => {
  if (score >= 0.8) return "text-green-600";
  if (score >= 0.6) return "text-yellow-600";
  return "text-orange-600";
};

export function TaskSuggestions({
  extractionResult,
  onAccept,
  onReject,
  onReview,
  isCreating = false,
}: TaskSuggestionsProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(
    new Set(extractionResult.tasks.map((_, i) => i))
  );
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

  const toggleTask = (index: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTasks(newSelected);
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedTasks(newExpanded);
  };

  const selectAll = () => {
    setSelectedTasks(new Set(extractionResult.tasks.map((_, i) => i)));
  };

  const selectNone = () => {
    setSelectedTasks(new Set());
  };

  const handleAccept = () => {
    const selected = extractionResult.tasks.filter((_, i) =>
      selectedTasks.has(i)
    );
    onAccept(selected);
  };

  const handleReview = () => {
    const selected = extractionResult.tasks.filter((_, i) =>
      selectedTasks.has(i)
    );
    onReview(selected);
  };

  const averageConfidence = extractionResult.totalConfidence;

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                AI Task Suggestions
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {extractionResult.tasks.length} task{extractionResult.tasks.length !== 1 ? "s" : ""} extracted from conversation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Confidence</div>
              <div
                className={cn(
                  "text-sm font-semibold",
                  confidenceColors(averageConfidence)
                )}
              >
                {Math.round(averageConfidence * 100)}%
              </div>
            </div>
          </div>
        </div>

        {extractionResult.summary && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {extractionResult.summary}
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Selection Controls */}
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {selectedTasks.size} of {extractionResult.tasks.length} selected
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAll}
              className="h-8 text-xs"
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={selectNone}
              className="h-8 text-xs"
            >
              Select None
            </Button>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-2">
          {extractionResult.tasks.map((task, index) => {
            const isExpanded = expandedTasks.has(index);
            const isSelected = selectedTasks.has(index);

            return (
              <Card
                key={index}
                className={cn(
                  "transition-all",
                  isSelected
                    ? "border-primary/30 bg-primary/5"
                    : "border-muted bg-background"
                )}
              >
                <CardContent className="p-4">
                  {/* Task Header */}
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleTask(index)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{task.title}</h4>
                            {task.suggestedOrder !== undefined && (
                              <Badge
                                variant="outline"
                                className="text-xs px-1.5 py-0"
                              >
                                #{task.suggestedOrder}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(index)}
                          className="h-6 w-6 p-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge
                          className={priorityColors[task.priority]}
                          variant="secondary"
                        >
                          {task.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {task.complexity} complexity
                        </Badge>
                        {task.estimatedHours && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {task.estimatedHours}h
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={cn("text-xs", confidenceColors(task.confidenceScore))}
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {Math.round(task.confidenceScore * 100)}%
                        </Badge>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-3 space-y-2 text-xs">
                          {task.technicalRequirements && task.technicalRequirements.length > 0 && (
                            <div>
                              <div className="font-medium mb-1 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Technical Requirements
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {task.technicalRequirements.map((req, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {req}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {task.dependencies && task.dependencies.length > 0 && (
                            <div>
                              <div className="font-medium mb-1 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Dependencies
                              </div>
                              <ul className="list-disc list-inside text-muted-foreground">
                                {task.dependencies.map((dep, i) => (
                                  <li key={i}>{dep}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {task.tags && task.tags.length > 0 && (
                            <div>
                              <div className="font-medium mb-1 flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                Tags
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {task.tags.map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t">
          <Button variant="ghost" onClick={onReject} disabled={isCreating}>
            Dismiss
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReview}
              disabled={selectedTasks.size === 0 || isCreating}
            >
              Review & Edit
            </Button>
            <Button
              onClick={handleAccept}
              disabled={selectedTasks.size === 0 || isCreating}
            >
              {isCreating ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Create {selectedTasks.size} Task{selectedTasks.size !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
