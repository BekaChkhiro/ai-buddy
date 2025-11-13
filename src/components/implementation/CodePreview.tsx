"use client";

/**
 * CodePreview Component
 * Preview code changes with diff view
 */

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilePlus, FileEdit, Trash2, CheckCircle2, XCircle } from "lucide-react";

interface CodePreviewProps {
  results: Array<{
    stepId: string;
    status: string;
    output?: string;
    error?: string;
    changes?: Array<{
      path: string;
      changeType: "create" | "modify" | "delete";
      originalContent?: string;
      newContent?: string;
      timestamp: string;
    }>;
  }>;
}

export function CodePreview({ results }: CodePreviewProps) {
  const [selectedChange, setSelectedChange] = useState<number>(0);

  // Collect all changes from results
  const allChanges = results.flatMap((result) => result.changes || []);

  if (allChanges.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No code changes yet
      </div>
    );
  }

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

  const renderDiff = (change: any) => {
    if (change.changeType === "create") {
      return (
        <div className="font-mono text-xs">
          <div className="bg-green-50 dark:bg-green-950/20 p-2 rounded">
            <div className="text-green-700 dark:text-green-400 mb-2">
              + New file
            </div>
            <pre className="whitespace-pre-wrap overflow-x-auto">
              {change.newContent}
            </pre>
          </div>
        </div>
      );
    }

    if (change.changeType === "delete") {
      return (
        <div className="font-mono text-xs">
          <div className="bg-red-50 dark:bg-red-950/20 p-2 rounded">
            <div className="text-red-700 dark:text-red-400 mb-2">- Deleted</div>
            <pre className="whitespace-pre-wrap overflow-x-auto line-through text-muted-foreground">
              {change.originalContent}
            </pre>
          </div>
        </div>
      );
    }

    if (change.changeType === "modify") {
      // Simple side-by-side view
      return (
        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
          <div className="border rounded p-2">
            <div className="text-red-700 dark:text-red-400 mb-2 font-semibold">
              Before
            </div>
            <pre className="whitespace-pre-wrap overflow-x-auto">
              {change.originalContent}
            </pre>
          </div>
          <div className="border rounded p-2">
            <div className="text-green-700 dark:text-green-400 mb-2 font-semibold">
              After
            </div>
            <pre className="whitespace-pre-wrap overflow-x-auto">
              {change.newContent}
            </pre>
          </div>
        </div>
      );
    }

    return null;
  };

  const currentChange = allChanges[selectedChange];

  return (
    <div className="space-y-4">
      {/* Change List */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Changed Files:</h4>
        <div className="space-y-1">
          {allChanges.map((change, index) => (
            <button
              key={index}
              onClick={() => setSelectedChange(index)}
              className={`w-full text-left p-2 rounded border transition-colors ${
                selectedChange === index
                  ? "bg-primary/10 border-primary"
                  : "hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2">
                {getChangeIcon(change.changeType)}
                <span className="text-sm font-mono flex-1">{change.path}</span>
                <Badge variant="outline" className="text-xs">
                  {change.changeType}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Change Preview */}
      {currentChange && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {getChangeIcon(currentChange.changeType)}
              <span className="font-medium text-sm">{currentChange.path}</span>
            </div>
            <Badge>{currentChange.changeType}</Badge>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {renderDiff(currentChange)}
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            Modified: {new Date(currentChange.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
