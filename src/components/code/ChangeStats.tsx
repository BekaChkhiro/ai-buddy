"use client";

/**
 * ChangeStats Component
 * Statistics about code changes
 */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FilePlus,
  FileEdit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import type { ChangeStatsProps } from "./types";

export function ChangeStats({ stats, showDetails = true }: ChangeStatsProps) {
  const totalChanges =
    stats.filesCreated + stats.filesModified + stats.filesDeleted;
  const totalLineChanges = stats.linesAdded + stats.linesRemoved;

  // Calculate percentages
  const createdPercent =
    totalChanges > 0 ? (stats.filesCreated / totalChanges) * 100 : 0;
  const modifiedPercent =
    totalChanges > 0 ? (stats.filesModified / totalChanges) * 100 : 0;
  const deletedPercent =
    totalChanges > 0 ? (stats.filesDeleted / totalChanges) * 100 : 0;

  // Net change (additions - deletions)
  const netChange = stats.linesAdded - stats.linesRemoved;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Files */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Files</p>
              <p className="text-2xl font-bold">{stats.totalFiles}</p>
            </div>
            <Activity className="h-8 w-8 text-primary" />
          </div>
          {showDetails && totalChanges > 0 && (
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-600">Created</span>
                <span>{stats.filesCreated}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-600">Modified</span>
                <span>{stats.filesModified}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-600">Deleted</span>
                <span>{stats.filesDeleted}</span>
              </div>
            </div>
          )}
        </Card>

        {/* Lines Added */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Lines Added</p>
              <p className="text-2xl font-bold text-green-600">
                +{stats.linesAdded}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          {showDetails && totalLineChanges > 0 && (
            <div className="mt-3">
              <Progress
                value={(stats.linesAdded / totalLineChanges) * 100}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((stats.linesAdded / totalLineChanges) * 100)}% of
                changes
              </p>
            </div>
          )}
        </Card>

        {/* Lines Removed */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Lines Removed</p>
              <p className="text-2xl font-bold text-red-600">
                -{stats.linesRemoved}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
          {showDetails && totalLineChanges > 0 && (
            <div className="mt-3">
              <Progress
                value={(stats.linesRemoved / totalLineChanges) * 100}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((stats.linesRemoved / totalLineChanges) * 100)}% of
                changes
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Detailed Breakdown */}
      {showDetails && (
        <Card className="p-4">
          <h4 className="font-semibold mb-4">Change Breakdown</h4>

          <div className="space-y-4">
            {/* File Changes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Files by Type</span>
                <span className="text-sm text-muted-foreground">
                  {totalChanges} total
                </span>
              </div>

              <div className="space-y-2">
                {stats.filesCreated > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <FilePlus className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Created</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {stats.filesCreated}
                      </Badge>
                    </div>
                    <Progress value={createdPercent} className="h-2" />
                  </div>
                )}

                {stats.filesModified > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <FileEdit className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Modified</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {stats.filesModified}
                      </Badge>
                    </div>
                    <Progress value={modifiedPercent} className="h-2" />
                  </div>
                )}

                {stats.filesDeleted > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4 text-red-600" />
                        <span className="text-sm">Deleted</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {stats.filesDeleted}
                      </Badge>
                    </div>
                    <Progress value={deletedPercent} className="h-2" />
                  </div>
                )}
              </div>
            </div>

            {/* Net Change */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Net Change</span>
                <Badge
                  variant={netChange >= 0 ? "default" : "destructive"}
                  className="text-sm"
                >
                  {netChange >= 0 ? "+" : ""}
                  {netChange} lines
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {netChange >= 0
                  ? "Code base expanded"
                  : "Code base reduced"}
              </p>
            </div>

            {/* Lines Changed */}
            {stats.linesChanged > 0 && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Lines Changed</span>
                  <Badge variant="outline" className="text-sm">
                    {stats.linesChanged} lines
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Modified without net addition or removal
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Quick Summary */}
      {!showDetails && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            <FilePlus className="h-3 w-3 mr-1 text-green-600" />
            {stats.filesCreated} created
          </Badge>
          <Badge variant="outline">
            <FileEdit className="h-3 w-3 mr-1 text-blue-600" />
            {stats.filesModified} modified
          </Badge>
          <Badge variant="outline">
            <Trash2 className="h-3 w-3 mr-1 text-red-600" />
            {stats.filesDeleted} deleted
          </Badge>
          <Badge variant="outline" className="text-green-600">
            +{stats.linesAdded}
          </Badge>
          <Badge variant="outline" className="text-red-600">
            -{stats.linesRemoved}
          </Badge>
        </div>
      )}
    </div>
  );
}
