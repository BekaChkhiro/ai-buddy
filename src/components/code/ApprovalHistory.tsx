"use client";

/**
 * ApprovalHistory Component
 * Track and display approval history for code changes
 */

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
  User,
  FileText,
  Filter,
} from "lucide-react";
import type { ApprovalHistoryProps } from "./types";

export function ApprovalHistory({
  history,
  onActionClick,
  showFilters = true,
}: ApprovalHistoryProps) {
  const [filterAction, setFilterAction] = useState<
    "all" | "approve" | "reject" | "request_changes"
  >("all");
  const [sortBy, setSortBy] = useState<"date" | "file" | "action">("date");

  // Filter and sort actions
  const filteredActions = useMemo(() => {
    let actions = [...history.actions];

    // Apply filter
    if (filterAction !== "all") {
      actions = actions.filter((action) => action.action === filterAction);
    }

    // Apply sort
    actions.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return (
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        case "file":
          return a.fileChange.path.localeCompare(b.fileChange.path);
        case "action":
          return a.action.localeCompare(b.action);
        default:
          return 0;
      }
    });

    return actions;
  }, [history.actions, filterAction, sortBy]);

  // Get action icon and color
  const getActionDisplay = (action: string) => {
    switch (action) {
      case "approve":
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
          label: "Approved",
          color: "text-green-600",
          bgColor: "bg-green-50 dark:bg-green-950/20",
          borderColor: "border-green-200 dark:border-green-800",
        };
      case "reject":
        return {
          icon: <XCircle className="h-4 w-4 text-red-600" />,
          label: "Rejected",
          color: "text-red-600",
          bgColor: "bg-red-50 dark:bg-red-950/20",
          borderColor: "border-red-200 dark:border-red-800",
        };
      case "request_changes":
        return {
          icon: <MessageSquare className="h-4 w-4 text-yellow-600" />,
          label: "Changes Requested",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
          borderColor: "border-yellow-200 dark:border-yellow-800",
        };
      default:
        return {
          icon: <Clock className="h-4 w-4 text-gray-600" />,
          label: "Unknown",
          color: "text-gray-600",
          bgColor: "bg-gray-50 dark:bg-gray-950/20",
          borderColor: "border-gray-200 dark:border-gray-800",
        };
    }
  };

  if (history.actions.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No approval history yet</p>
          <p className="text-sm mt-2">
            Actions will appear here as you review changes
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Actions</p>
              <p className="text-2xl font-bold">{history.actions.length}</p>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {history.totalApproved}
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold text-red-600">
                {history.totalRejected}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-gray-600">
                {history.totalPending}
              </p>
            </div>
            <Clock className="h-8 w-8 text-gray-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filterAction}
            onValueChange={(value: any) => setFilterAction(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="approve">Approved</SelectItem>
              <SelectItem value="reject">Rejected</SelectItem>
              <SelectItem value="request_changes">Changes Requested</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(value: any) => setSortBy(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="file">File</SelectItem>
              <SelectItem value="action">Action</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Timeline */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Action Timeline</h3>
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {filteredActions.map((action) => {
              const display = getActionDisplay(action.action);
              return (
                <Card
                  key={action.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${display.bgColor} ${display.borderColor}`}
                  onClick={() => onActionClick?.(action)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="mt-1">{display.icon}</div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${display.color}`}>
                            {display.label}
                          </p>
                          <p className="text-sm font-mono truncate text-muted-foreground">
                            {action.fileChange.path}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs whitespace-nowrap"
                        >
                          {action.fileChange.changeType}
                        </Badge>
                      </div>

                      {/* Comment */}
                      {action.comment && (
                        <div className="mb-2 p-2 rounded bg-background/50 border">
                          <p className="text-sm italic text-muted-foreground">
                            "{action.comment}"
                          </p>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{action.user}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(action.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}

            {filteredActions.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <p>No actions match the selected filters</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
