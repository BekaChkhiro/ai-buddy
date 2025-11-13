"use client";

/**
 * ReviewPanel Component
 * Main UI for approving/rejecting code changes with preview
 */

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  Edit,
  RotateCcw,
  FileText,
} from "lucide-react";
import { DiffViewer } from "./DiffViewer";
import { CodeEditor } from "./CodeEditor";
import { FileChanges } from "./FileChanges";
import { ChangeStats } from "./ChangeStats";
import type { ReviewPanelProps, FileChange, ChangeStats as Stats } from "./types";

export function ReviewPanel({
  fileChanges,
  onApproveAll,
  onRejectAll,
  onApproveFile,
  onRejectFile,
  onRequestChanges,
  onEditFile,
  onRegenerate,
}: ReviewPanelProps) {
  const [selectedFile, setSelectedFile] = useState<FileChange | null>(
    fileChanges[0] || null
  );
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [activeTab, setActiveTab] = useState<"diff" | "edit" | "preview">(
    "diff"
  );

  // Calculate statistics
  const stats: Stats = useMemo(() => {
    const created = fileChanges.filter((f) => f.changeType === "create");
    const modified = fileChanges.filter((f) => f.changeType === "modify");
    const deleted = fileChanges.filter((f) => f.changeType === "delete");

    let linesAdded = 0;
    let linesRemoved = 0;
    let linesChanged = 0;

    fileChanges.forEach((change) => {
      const originalLines = (change.originalContent || "").split("\n").length;
      const newLines = (change.newContent || "").split("\n").length;

      if (change.changeType === "create") {
        linesAdded += newLines;
      } else if (change.changeType === "delete") {
        linesRemoved += originalLines;
      } else if (change.changeType === "modify") {
        const diff = newLines - originalLines;
        if (diff > 0) {
          linesAdded += diff;
        } else if (diff < 0) {
          linesRemoved += Math.abs(diff);
        }
        linesChanged += Math.min(originalLines, newLines);
      }
    });

    return {
      totalFiles: fileChanges.length,
      filesCreated: created.length,
      filesModified: modified.length,
      filesDeleted: deleted.length,
      linesAdded,
      linesRemoved,
      linesChanged,
    };
  }, [fileChanges]);

  // Approval counts
  const approvalCounts = useMemo(() => {
    return {
      approved: fileChanges.filter((f) => f.approvalStatus === "approved")
        .length,
      rejected: fileChanges.filter((f) => f.approvalStatus === "rejected")
        .length,
      pending: fileChanges.filter(
        (f) => !f.approvalStatus || f.approvalStatus === "pending"
      ).length,
    };
  }, [fileChanges]);

  const allApproved = approvalCounts.pending === 0;
  const hasRejections = approvalCounts.rejected > 0;

  // Handle file selection
  const handleFileSelect = (filePath: string) => {
    const file = fileChanges.find((f) => f.path === filePath);
    if (file) {
      setSelectedFile(file);
      setEditMode(false);
      setActiveTab("diff");
    }
  };

  // Handle file approval
  const handleApproveFile = (filePath: string) => {
    onApproveFile?.(filePath);
  };

  // Handle file rejection
  const handleRejectFile = (filePath: string) => {
    onRejectFile?.(filePath);
  };

  // Handle request changes
  const handleRequestChanges = (filePath: string, comment: string) => {
    onRequestChanges?.(filePath, comment);
  };

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (!editMode && selectedFile) {
      setEditedContent(selectedFile.newContent || "");
    }
    setEditMode(!editMode);
    setActiveTab("edit");
  };

  // Handle save edit
  const handleSaveEdit = (content: string) => {
    if (selectedFile && onEditFile) {
      onEditFile(selectedFile.path, content);
      setEditMode(false);
      setActiveTab("diff");
    }
  };

  // Handle regenerate
  const handleRegenerate = () => {
    if (selectedFile && onRegenerate) {
      onRegenerate(selectedFile.path);
    }
  };

  if (fileChanges.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border rounded-lg">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No code changes to review</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      {/* File List - Left Sidebar */}
      <div className="lg:col-span-1">
        <FileChanges
          changes={fileChanges}
          selectedFile={selectedFile?.path}
          onFileSelect={handleFileSelect}
          onApprove={handleApproveFile}
          onReject={handleRejectFile}
          onRequestChanges={handleRequestChanges}
        />
      </div>

      {/* Main Preview Area */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        {/* Header with stats and actions */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Badge variant="outline" className="text-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {approvalCounts.approved} Approved
              </Badge>
              <Badge variant="outline" className="text-red-600">
                <XCircle className="h-3 w-3 mr-1" />
                {approvalCounts.rejected} Rejected
              </Badge>
              <Badge variant="outline" className="text-gray-600">
                {approvalCounts.pending} Pending
              </Badge>
            </div>
          </div>

          <div className="flex gap-2">
            {onApproveAll && (
              <Button
                size="sm"
                variant="default"
                onClick={onApproveAll}
                disabled={allApproved}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve All
              </Button>
            )}
            {onRejectAll && (
              <Button
                size="sm"
                variant="destructive"
                onClick={onRejectAll}
                disabled={approvalCounts.pending === 0}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject All
              </Button>
            )}
          </div>
        </div>

        {/* Alerts */}
        {allApproved && !hasRejections && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              All changes have been approved! You can proceed with implementation.
            </AlertDescription>
          </Alert>
        )}

        {hasRejections && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Some changes have been rejected. Review and regenerate them before
              proceeding.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <div className="flex items-center justify-between mb-2">
            <TabsList>
              <TabsTrigger value="diff">Diff View</TabsTrigger>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>

            {selectedFile && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEditToggle}
                  disabled={
                    !selectedFile.newContent ||
                    selectedFile.changeType === "delete"
                  }
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {editMode ? "Cancel Edit" : "Edit"}
                </Button>
                {onRegenerate && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRegenerate}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Diff View */}
          <TabsContent value="diff" className="mt-0">
            {selectedFile ? (
              <DiffViewer
                originalContent={selectedFile.originalContent || ""}
                modifiedContent={selectedFile.newContent || ""}
                language={selectedFile.language}
                fileName={selectedFile.path}
                viewMode="split"
                showLineNumbers={true}
                highlightChanges={true}
                collapseUnchanged={false}
                comments={selectedFile.comments}
              />
            ) : (
              <div className="p-8 text-center text-muted-foreground border rounded-lg">
                Select a file to view changes
              </div>
            )}
          </TabsContent>

          {/* Edit View */}
          <TabsContent value="edit" className="mt-0">
            {selectedFile && selectedFile.newContent ? (
              <CodeEditor
                value={editedContent || selectedFile.newContent}
                language={selectedFile.language}
                onChange={setEditedContent}
                onSave={handleSaveEdit}
                readOnly={!editMode}
                height="600px"
                showMinimap={true}
                enableAutoComplete={true}
                enableErrorDetection={true}
                formatOnSave={true}
              />
            ) : (
              <div className="p-8 text-center text-muted-foreground border rounded-lg">
                No content to edit
              </div>
            )}
          </TabsContent>

          {/* Preview */}
          <TabsContent value="preview" className="mt-0">
            {selectedFile && selectedFile.newContent ? (
              <CodeEditor
                value={selectedFile.newContent}
                language={selectedFile.language}
                readOnly={true}
                height="600px"
                showMinimap={true}
              />
            ) : (
              <div className="p-8 text-center text-muted-foreground border rounded-lg">
                No preview available
              </div>
            )}
          </TabsContent>

          {/* Statistics */}
          <TabsContent value="stats" className="mt-0">
            <ChangeStats stats={stats} showDetails={true} />
          </TabsContent>
        </Tabs>

        {/* File Actions */}
        {selectedFile && (
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {selectedFile.path}
              </span>
              {selectedFile.approvalStatus && (
                <Badge
                  variant={
                    selectedFile.approvalStatus === "approved"
                      ? "default"
                      : selectedFile.approvalStatus === "rejected"
                        ? "destructive"
                        : "outline"
                  }
                >
                  {selectedFile.approvalStatus}
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              {onApproveFile && selectedFile.approvalStatus !== "approved" && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleApproveFile(selectedFile.path)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              )}
              {onRejectFile && selectedFile.approvalStatus !== "rejected" && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRejectFile(selectedFile.path)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              )}
              {onRequestChanges && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const comment = prompt("Enter your feedback:");
                    if (comment) {
                      handleRequestChanges(selectedFile.path, comment);
                    }
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Request Changes
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
