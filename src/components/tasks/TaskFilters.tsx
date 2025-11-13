"use client";

import { useState } from "react";
import { TaskPriority, TaskStatus } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export interface TaskFilterValues {
  search: string;
  status: TaskStatus | "all";
  priority: TaskPriority | "all";
  labels: string[];
}

interface TaskFiltersProps {
  filters: TaskFilterValues;
  onFiltersChange: (filters: TaskFilterValues) => void;
  availableLabels?: string[];
}

export function TaskFilters({
  filters,
  onFiltersChange,
  availableLabels = [],
}: TaskFiltersProps) {
  const [labelInput, setLabelInput] = useState("");

  const updateFilter = <K extends keyof TaskFilterValues>(
    key: K,
    value: TaskFilterValues[K],
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const addLabel = (label: string) => {
    if (label && !filters.labels.includes(label)) {
      updateFilter("labels", [...filters.labels, label]);
    }
    setLabelInput("");
  };

  const removeLabel = (label: string) => {
    updateFilter(
      "labels",
      filters.labels.filter((l) => l !== label),
    );
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      status: "all",
      priority: "all",
      labels: [],
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.status !== "all" ||
    filters.priority !== "all" ||
    filters.labels.length > 0;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2"
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="search" className="text-xs">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="status" className="text-xs">
              Status
            </Label>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                updateFilter("status", value as TaskStatus | "all")
              }
            >
              <SelectTrigger id="status" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="implementing">Implementing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority" className="text-xs">
              Priority
            </Label>
            <Select
              value={filters.priority}
              onValueChange={(value) =>
                updateFilter("priority", value as TaskPriority | "all")
              }
            >
              <SelectTrigger id="priority" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {availableLabels.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs">Filter by Label</Label>
            <div className="flex flex-wrap gap-1.5">
              {availableLabels.map((label) => (
                <Badge
                  key={label}
                  variant={
                    filters.labels.includes(label) ? "default" : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() =>
                    filters.labels.includes(label)
                      ? removeLabel(label)
                      : addLabel(label)
                  }
                >
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {filters.labels.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs">Active Label Filters</Label>
            <div className="flex flex-wrap gap-1.5">
              {filters.labels.map((label) => (
                <Badge key={label} variant="secondary" className="gap-1">
                  {label}
                  <button
                    onClick={() => removeLabel(label)}
                    className="hover:bg-muted rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
