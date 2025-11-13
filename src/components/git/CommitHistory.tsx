"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  GitCommit,
  RefreshCw,
  AlertCircle,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import type { GitCommit as GitCommitType } from "@/lib/git/types";

interface CommitHistoryProps {
  projectPath: string;
  maxCount?: number;
  branch?: string;
  onCommitClick?: (commit: GitCommitType) => void;
}

export function CommitHistory({
  projectPath,
  maxCount = 20,
  branch,
  onCommitClick,
}: CommitHistoryProps) {
  const [commits, setCommits] = useState<GitCommitType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCommits, setExpandedCommits] = useState<Set<string>>(
    new Set()
  );

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        projectPath,
        maxCount: maxCount.toString(),
      });

      if (branch) {
        params.append("branch", branch);
      }

      const response = await fetch(`/api/git/history?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch commit history");
      }

      setCommits(data.commits);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [projectPath, maxCount, branch]);

  const toggleCommit = (hash: string) => {
    setExpandedCommits((prev) => {
      const next = new Set(prev);
      if (next.has(hash)) {
        next.delete(hash);
      } else {
        next.add(hash);
      }
      return next;
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading && commits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCommit className="h-5 w-5" />
            Commit History
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
            Commit History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
          <Button
            onClick={fetchHistory}
            variant="outline"
            className="mt-4"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitCommit className="h-5 w-5" />
            Commit History
            {commits.length > 0 && (
              <Badge variant="secondary">{commits.length}</Badge>
            )}
          </CardTitle>
          <Button onClick={fetchHistory} variant="ghost" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {branch && (
          <div className="text-sm text-muted-foreground">
            Branch: <span className="font-medium">{branch}</span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {commits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <GitCommit className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No commits found</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {commits.map((commit) => {
                const isExpanded = expandedCommits.has(commit.hash);

                return (
                  <div
                    key={commit.hash}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => onCommitClick?.(commit)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(commit.author)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-medium text-sm leading-tight">
                            {commit.message}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCommit(commit.hash);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {commit.author}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span title={format(commit.date, "PPpp")}>
                              {formatDistanceToNow(commit.date, {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
                            {commit.hash.substring(0, 7)}
                          </code>
                        </div>

                        {commit.refs && commit.refs.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {commit.refs.map((ref, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-xs"
                              >
                                {ref}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {isExpanded && commit.body && (
                          <div className="mt-3 p-3 bg-muted rounded-md">
                            <pre className="text-xs whitespace-pre-wrap font-mono">
                              {commit.body}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
