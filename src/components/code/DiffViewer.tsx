"use client";

/**
 * DiffViewer Component
 * Enhanced side-by-side diff view with syntax highlighting and features
 */

import { useState, useMemo } from "react";
import { DiffEditor } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Maximize2,
  Minimize2,
  Search,
  MessageSquare,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { DiffViewerProps } from "./types";

export function DiffViewer({
  originalContent,
  modifiedContent,
  language = "typescript",
  fileName,
  viewMode = "split",
  showLineNumbers = true,
  onCommentAdd,
  comments = [],
}: DiffViewerProps) {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");

  const monacoTheme = theme === "dark" ? "vs-dark" : "light";

  // Calculate diff statistics
  const diffStats = useMemo(() => {
    const originalLines = originalContent.split("\n");
    const modifiedLines = modifiedContent.split("\n");

    return {
      linesAdded: Math.max(0, modifiedLines.length - originalLines.length),
      linesRemoved: Math.max(0, originalLines.length - modifiedLines.length),
      linesChanged: Math.min(originalLines.length, modifiedLines.length),
    };
  }, [originalContent, modifiedContent]);

  // Handle search in diff
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // Monaco editor will handle the search highlighting
  };

  // Handle adding a comment
  const handleAddComment = () => {
    if (selectedLine !== null && commentText.trim() && onCommentAdd) {
      onCommentAdd(selectedLine, commentText);
      setCommentText("");
      setSelectedLine(null);
    }
  };

  return (
    <div
      className={`flex flex-col border rounded-lg ${
        isFullscreen ? "fixed inset-0 z-50 bg-background" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <div className="flex items-center gap-3">
          {fileName && (
            <span className="font-mono text-sm font-medium">{fileName}</span>
          )}
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              +{diffStats.linesAdded}
            </Badge>
            <Badge variant="outline" className="text-xs text-red-600">
              -{diffStats.linesRemoved}
            </Badge>
            <Badge variant="outline" className="text-xs">
              ~{diffStats.linesChanged}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="p-3 border-b">
          <Input
            type="text"
            placeholder="Search in diff..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-md"
          />
        </div>
      )}

      {/* Diff Editor */}
      <div className={isFullscreen ? "flex-1" : "h-[600px]"}>
        <DiffEditor
          original={originalContent}
          modified={modifiedContent}
          language={language}
          theme={monacoTheme}
          options={{
            readOnly: true,
            renderSideBySide: viewMode === "split",
            lineNumbers: showLineNumbers ? "on" : "off",
            minimap: { enabled: !isFullscreen },
            scrollBeyondLastLine: false,
            fontSize: 13,
            wordWrap: "on",
            automaticLayout: true,
            renderWhitespace: "selection",
            diffWordWrap: "on",
            scrollbar: {
              vertical: "visible",
              horizontal: "visible",
            },
            find: {
              seedSearchStringFromSelection: "selection",
              autoFindInSelection: "never",
            },
          }}
        />
      </div>

      {/* Comments Section */}
      {comments.length > 0 && (
        <div className="border-t p-3">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm font-medium">
              Comments ({comments.length})
            </span>
          </div>
          <ScrollArea className="max-h-48">
            <div className="space-y-2">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-2 rounded border bg-muted/30 text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-xs">
                      {comment.author}
                    </span>
                    {comment.lineNumber && (
                      <Badge variant="outline" className="text-xs">
                        Line {comment.lineNumber}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{comment.content}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Add Comment Form */}
      {selectedLine !== null && onCommentAdd && (
        <div className="border-t p-3 bg-muted/30">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Add comment for line {selectedLine}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLine(null)}
              >
                Cancel
              </Button>
            </div>
            <Input
              type="text"
              placeholder="Enter your comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddComment();
                }
              }}
            />
            <Button size="sm" onClick={handleAddComment}>
              Add Comment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
