"use client";

/**
 * FileChanges Component
 * List of changed files with filtering and sorting
 */

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FilePlus,
  FileEdit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Search,
} from "lucide-react";
import type { FileChangesProps, FileChange, ApprovalStatus } from "./types";

export function FileChanges({
  changes,
  selectedFile,
  onFileSelect,
  onApprove,
  onReject,
  onRequestChanges,
  filterByStatus,
  sortBy = "name",
}: FileChangesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | "all">(
    filterByStatus || "all"
  );
  const [sortOption, setSortOption] = useState(sortBy);

  // Get icon for change type
  const getChangeIcon = (type: string) => {
    switch (type) {
      case "create":
        return <FilePlus className="h-4 w-4 text-green-600" />;
      case "modify":
        return <FileEdit className="h-4 w-4 text-blue-600" />;
      case "delete":
        return <Trash2 className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  // Get status badge
  const getStatusBadge = (change: FileChange) => {
    const status = change.approvalStatus || "pending";

    switch (status) {
      case "approved":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case "modified":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <MessageSquare className="h-3 w-3 mr-1" />
            Changes Requested
          </Badge>
        );
      case "pending":
      default:
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  // Filter and sort changes
  const filteredChanges = useMemo(() => {
    let result = changes;

    // Apply search filter
    if (searchTerm) {
      result = result.filter((change) =>
        change.path.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(
        (change) => (change.approvalStatus || "pending") === statusFilter
      );
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      switch (sortOption) {
        case "name":
          return a.path.localeCompare(b.path);
        case "type":
          return a.changeType.localeCompare(b.changeType);
        case "status":
          return (a.approvalStatus || "pending").localeCompare(
            b.approvalStatus || "pending"
          );
        case "timestamp":
          return (
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        default:
          return 0;
      }
    });

    return result;
  }, [changes, searchTerm, statusFilter, sortOption]);

  // Get summary counts
  const summary = useMemo(() => {
    return {
      total: changes.length,
      approved: changes.filter((c) => c.approvalStatus === "approved").length,
      rejected: changes.filter((c) => c.approvalStatus === "rejected").length,
      pending: changes.filter(
        (c) => !c.approvalStatus || c.approvalStatus === "pending"
      ).length,
      modified: changes.filter((c) => c.approvalStatus === "modified").length,
    };
  }, [changes]);

  return (
    <div className="flex flex-col h-full border rounded-lg">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Changed Files ({filteredChanges.length})</h3>
        </div>

        {/* Summary Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            Total: {summary.total}
          </Badge>
          <Badge variant="outline" className="text-xs text-green-600">
            Approved: {summary.approved}
          </Badge>
          <Badge variant="outline" className="text-xs text-red-600">
            Rejected: {summary.rejected}
          </Badge>
          <Badge variant="outline" className="text-xs text-gray-600">
            Pending: {summary.pending}
          </Badge>
          {summary.modified > 0 && (
            <Badge variant="outline" className="text-xs text-yellow-600">
              Changes Requested: {summary.modified}
            </Badge>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as ApprovalStatus | "all")
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="modified">Changes Requested</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortOption}
            onValueChange={(value) =>
              setSortOption(value as typeof sortOption)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="type">Type</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="timestamp">Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* File List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredChanges.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No files found
            </div>
          ) : (
            filteredChanges.map((change, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedFile === change.path
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => onFileSelect?.(change.path)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {getChangeIcon(change.changeType)}
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm truncate">
                        {change.path}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {change.changeType}
                        </Badge>
                        {change.language && (
                          <Badge variant="outline" className="text-xs">
                            {change.language}
                          </Badge>
                        )}
                        {change.comments && change.comments.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {change.comments.length}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(change)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(change.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                {selectedFile === change.path &&
                  change.approvalStatus !== "approved" && (
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      {onApprove && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onApprove(change.path);
                          }}
                          className="flex-1"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                      )}
                      {onReject && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onReject(change.path);
                          }}
                          className="flex-1"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      )}
                      {onRequestChanges && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            const comment = prompt("Enter your feedback:");
                            if (comment) {
                              onRequestChanges(change.path, comment);
                            }
                          }}
                          className="flex-1"
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Request Changes
                        </Button>
                      )}
                    </div>
                  )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
