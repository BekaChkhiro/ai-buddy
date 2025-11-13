"use client";

import { useState } from "react";
import { ExtractedTask } from "@/lib/claude/task-extraction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  TrendingUp,
  Lightbulb,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskPriority } from "@/types";
import { TaskComplexity } from "@/lib/claude/task-extraction";

interface TaskSuggestionsProps {
  tasks: ExtractedTask[];
  onReview: (tasks: ExtractedTask[]) => void;
  onDismiss: () => void;
  summary?: string;
  totalEstimatedHours?: number;
  loading?: boolean;
}

const priorityColors: Record<TaskPriority, string> = {
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  urgent: "bg-red-500/10 text-red-500 border-red-500/20",
};

const complexityColors: Record<TaskComplexity, string> = {
  low: "bg-green-500/10 text-green-600",
  medium: "bg-yellow-500/10 text-yellow-600",
  high: "bg-red-500/10 text-red-600",
};

const complexityLabels: Record<TaskComplexity, string> = {
  low: "Simple",
  medium: "Moderate",
  high: "Complex",
};

export function TaskSuggestions({
  tasks,
  onReview,
  onDismiss,
  summary,
  totalEstimatedHours,
  loading = false,
}: TaskSuggestionsProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(
    new Set(tasks.map((_, idx) => idx.toString()))
  );

  const toggleExpand = (index: number) => {
    const key = index.toString();
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedTasks(newExpanded);
  };

  const toggleSelect = (index: number) => {
    const key = index.toString();
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedTasks(newSelected);
  };

  const handleReviewSelected = () => {
    const selected = tasks.filter((_, idx) =>
      selectedTasks.has(idx.toString())
    );
    onReview(selected);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-orange-600";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return "High";
    if (confidence >= 60) return "Medium";
    return "Low";
  };

  if (loading) {
    return (
      <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />
            <CardTitle className="text-lg">Analyzing conversation...</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">
                AI Detected {tasks.length} Task{tasks.length !== 1 ? "s" : ""}
              </CardTitle>
            </div>
            {summary && (
              <p className="text-sm text-muted-foreground">{summary}</p>
            )}
            {totalEstimatedHours !== undefined && totalEstimatedHours > 0 && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Total estimated: {totalEstimatedHours.toFixed(1)} hours
                </span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map((task, index) => {
          const isExpanded = expandedTasks.has(index.toString());
          const isSelected = selectedTasks.has(index.toString());

          return (
            <div
              key={index}
              className={cn(
                "border rounded-lg p-4 transition-all",
                isSelected
                  ? "border-purple-500/50 bg-purple-500/5"
                  : "border-gray-200 dark:border-gray-700 bg-card"
              )}
            >
              {/* Task Header */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(index)}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm leading-tight">
                      {task.title}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(index)}
                      className="h-6 w-6 p-0 flex-shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge
                      variant="outline"
                      className={priorityColors[task.priority]}
                    >
                      {task.priority}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={complexityColors[task.complexity]}
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {complexityLabels[task.complexity]}
                    </Badge>
                    {task.estimatedHours && (
                      <Badge variant="outline" className="text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {task.estimatedHours}h
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={getConfidenceColor(task.confidence)}
                    >
                      {task.confidence}% confident
                    </Badge>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-3 space-y-3 text-sm">
                      {/* Description */}
                      {task.description && (
                        <div>
                          <p className="text-muted-foreground">
                            {task.description}
                          </p>
                        </div>
                      )}

                      {/* Technical Requirements */}
                      {task.technicalRequirements.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                            <Lightbulb className="h-3 w-3" />
                            <span>Technical Requirements</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {task.technicalRequirements.map((req, i) => (
                              <Badge
                                key={i}
                                variant="secondary"
                                className="text-xs"
                              >
                                {req}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Labels */}
                      {task.suggestedLabels.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            Suggested Labels
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {task.suggestedLabels.map((label, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs"
                              >
                                {label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Dependencies */}
                      {task.dependencies.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>Depends On</span>
                          </div>
                          <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                            {task.dependencies.map((dep, i) => (
                              <li key={i} className="text-xs">
                                {dep}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Reasoning */}
                      {task.reasoning && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            AI Reasoning
                          </div>
                          <p className="text-xs text-muted-foreground italic">
                            {task.reasoning}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            {selectedTasks.size} of {tasks.length} selected
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onDismiss}>
              Dismiss All
            </Button>
            <Button
              size="sm"
              onClick={handleReviewSelected}
              disabled={selectedTasks.size === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Review Selected ({selectedTasks.size})
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
