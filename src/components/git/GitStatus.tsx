"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GitBranch,
  GitCommit,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  FileText,
  FilePlus,
  FileX,
  FileEdit,
} from "lucide-react";
import type { GitStatus as GitStatusType, GitFileStatus } from "@/lib/git/types";

interface GitStatusProps {
  projectPath: string;
  onRefresh?: () => void;
}

const statusIcons = {
  added: FilePlus,
  modified: FileEdit,
  deleted: FileX,
  renamed: FileText,
  untracked: FileText,
  conflicted: AlertCircle,
};

const statusColors = {
  added: "text-green-500",
  modified: "text-blue-500",
  deleted: "text-red-500",
  renamed: "text-purple-500",
  untracked: "text-gray-500",
  conflicted: "text-orange-500",
};

export function GitStatus({ projectPath, onRefresh }: GitStatusProps) {
  const [status, setStatus] = useState<GitStatusType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/git/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch Git status");
      }

      setStatus(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [projectPath]);

  const handleRefresh = () => {
    fetchStatus();
    onRefresh?.();
  };

  const groupedFiles = status?.files.reduce(
    (acc, file) => {
      if (file.staged) {
        acc.staged.push(file);
      } else {
        acc.unstaged.push(file);
      }
      return acc;
    },
    { staged: [] as GitFileStatus[], unstaged: [] as GitFileStatus[] }
  );

  const renderFileItem = (file: GitFileStatus) => {
    const Icon = statusIcons[file.status];
    const colorClass = statusColors[file.status];

    return (
      <div
        key={file.path}
        className="flex items-center gap-2 py-2 px-3 hover:bg-accent rounded-md"
      >
        <Icon className={`h-4 w-4 ${colorClass}`} />
        <span className="text-sm flex-1 truncate" title={file.path}>
          {file.path}
        </span>
        <Badge variant="outline" className="text-xs">
          {file.status}
        </Badge>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCommit className="h-5 w-5" />
            Git Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCommit className="h-5 w-5" />
            Git Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
          <Button onClick={handleRefresh} variant="outline" className="mt-4" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitCommit className="h-5 w-5" />
            Git Status
          </CardTitle>
          <Button onClick={handleRefresh} variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{status.branch}</span>
          </div>

          {status.isClean ? (
            <Badge variant="outline" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Clean
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {status.files.length} change{status.files.length !== 1 ? "s" : ""}
            </Badge>
          )}

          {status.ahead > 0 && (
            <Badge variant="secondary">↑ {status.ahead}</Badge>
          )}

          {status.behind > 0 && (
            <Badge variant="secondary">↓ {status.behind}</Badge>
          )}
        </div>

        {status.tracking && (
          <div className="text-xs text-muted-foreground mt-1">
            Tracking: {status.tracking}
          </div>
        )}
      </CardHeader>

      {!status.isClean && (
        <CardContent className="space-y-4">
          {groupedFiles && groupedFiles.staged.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                Staged Changes ({groupedFiles.staged.length})
              </h4>
              <ScrollArea className="h-[200px]">
                <div className="space-y-1">
                  {groupedFiles.staged.map(renderFileItem)}
                </div>
              </ScrollArea>
            </div>
          )}

          {groupedFiles && groupedFiles.unstaged.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                Unstaged Changes ({groupedFiles.unstaged.length})
              </h4>
              <ScrollArea className="h-[200px]">
                <div className="space-y-1">
                  {groupedFiles.unstaged.map(renderFileItem)}
                </div>
              </ScrollArea>
            </div>
          )}

          {status.conflicts.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Merge Conflicts ({status.conflicts.length})
              </h4>
              <ScrollArea className="h-[150px]">
                <div className="space-y-1">
                  {status.conflicts.map((file) => (
                    <div
                      key={file}
                      className="flex items-center gap-2 py-2 px-3 bg-destructive/10 rounded-md"
                    >
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm flex-1 truncate" title={file}>
                        {file}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
