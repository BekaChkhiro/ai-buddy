/**
 * Utility functions for code preview and approval system
 */

import type {
  FileChange,
  ChangeStats,
  DiffLine,
  ApprovalHistory,
  ApprovalAction,
} from "./types";

/**
 * Calculate statistics from file changes
 */
export function calculateChangeStats(changes: FileChange[]): ChangeStats {
  const stats: ChangeStats = {
    totalFiles: changes.length,
    filesCreated: 0,
    filesModified: 0,
    filesDeleted: 0,
    linesAdded: 0,
    linesRemoved: 0,
    linesChanged: 0,
  };

  changes.forEach((change) => {
    // Count file types
    switch (change.changeType) {
      case "create":
        stats.filesCreated++;
        break;
      case "modify":
        stats.filesModified++;
        break;
      case "delete":
        stats.filesDeleted++;
        break;
    }

    // Count lines
    const originalLines = (change.originalContent || "").split("\n");
    const newLines = (change.newContent || "").split("\n");

    if (change.changeType === "create") {
      stats.linesAdded += newLines.length;
    } else if (change.changeType === "delete") {
      stats.linesRemoved += originalLines.length;
    } else if (change.changeType === "modify") {
      const diff = newLines.length - originalLines.length;
      if (diff > 0) {
        stats.linesAdded += diff;
      } else if (diff < 0) {
        stats.linesRemoved += Math.abs(diff);
      }
      stats.linesChanged += Math.min(originalLines.length, newLines.length);
    }
  });

  return stats;
}

/**
 * Generate diff lines from original and modified content
 */
export function generateDiffLines(
  originalContent: string,
  modifiedContent: string
): DiffLine[] {
  const originalLines = originalContent.split("\n");
  const modifiedLines = modifiedContent.split("\n");
  const diffLines: DiffLine[] = [];

  // Simple diff algorithm (can be enhanced with proper diff library)
  const maxLength = Math.max(originalLines.length, modifiedLines.length);

  for (let i = 0; i < maxLength; i++) {
    const originalLine = originalLines[i];
    const modifiedLine = modifiedLines[i];

    if (originalLine === modifiedLine) {
      // Context line (unchanged)
      diffLines.push({
        type: "context",
        content: originalLine || "",
        oldLineNumber: i + 1,
        newLineNumber: i + 1,
      });
    } else if (originalLine !== undefined && modifiedLine !== undefined) {
      // Modified line
      diffLines.push({
        type: "remove",
        content: originalLine,
        oldLineNumber: i + 1,
      });
      diffLines.push({
        type: "add",
        content: modifiedLine,
        newLineNumber: i + 1,
      });
    } else if (originalLine !== undefined) {
      // Removed line
      diffLines.push({
        type: "remove",
        content: originalLine,
        oldLineNumber: i + 1,
      });
    } else if (modifiedLine !== undefined) {
      // Added line
      diffLines.push({
        type: "add",
        content: modifiedLine,
        newLineNumber: i + 1,
      });
    }
  }

  return diffLines;
}

/**
 * Detect programming language from file extension
 */
export function detectLanguage(filePath: string): string {
  const extension = filePath.split(".").pop()?.toLowerCase();

  const languageMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    rb: "ruby",
    java: "java",
    go: "go",
    rs: "rust",
    cpp: "cpp",
    c: "c",
    cs: "csharp",
    php: "php",
    swift: "swift",
    kt: "kotlin",
    scala: "scala",
    sql: "sql",
    css: "css",
    scss: "scss",
    sass: "sass",
    less: "less",
    html: "html",
    xml: "xml",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    sh: "shell",
    bash: "shell",
    dockerfile: "dockerfile",
  };

  return languageMap[extension || ""] || "plaintext";
}

/**
 * Create approval history from actions
 */
export function createApprovalHistory(
  actions: ApprovalAction[]
): ApprovalHistory {
  return {
    actions,
    totalApproved: actions.filter((a) => a.action === "approve").length,
    totalRejected: actions.filter((a) => a.action === "reject").length,
    totalPending: 0, // This should be calculated from file changes
  };
}

/**
 * Check if all files are approved
 */
export function areAllFilesApproved(changes: FileChange[]): boolean {
  return changes.every((change) => change.approvalStatus === "approved");
}

/**
 * Check if any files are rejected
 */
export function hasRejectedFiles(changes: FileChange[]): boolean {
  return changes.some((change) => change.approvalStatus === "rejected");
}

/**
 * Get pending files count
 */
export function getPendingFilesCount(changes: FileChange[]): number {
  return changes.filter(
    (change) => !change.approvalStatus || change.approvalStatus === "pending"
  ).length;
}

/**
 * Filter changes by approval status
 */
export function filterChangesByStatus(
  changes: FileChange[],
  status: "approved" | "rejected" | "pending" | "modified"
): FileChange[] {
  return changes.filter((change) => {
    if (status === "pending") {
      return !change.approvalStatus || change.approvalStatus === "pending";
    }
    return change.approvalStatus === status;
  });
}

/**
 * Sort changes by various criteria
 */
export function sortChanges(
  changes: FileChange[],
  sortBy: "name" | "type" | "status" | "timestamp"
): FileChange[] {
  return [...changes].sort((a, b) => {
    switch (sortBy) {
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
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

/**
 * Get change type color
 */
export function getChangeTypeColor(
  type: "create" | "modify" | "delete"
): string {
  switch (type) {
    case "create":
      return "text-green-600";
    case "modify":
      return "text-blue-600";
    case "delete":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}

/**
 * Get approval status color
 */
export function getApprovalStatusColor(
  status: "approved" | "rejected" | "pending" | "modified"
): string {
  switch (status) {
    case "approved":
      return "text-green-600";
    case "rejected":
      return "text-red-600";
    case "modified":
      return "text-yellow-600";
    case "pending":
    default:
      return "text-gray-600";
  }
}

/**
 * Validate file change
 */
export function validateFileChange(change: FileChange): string[] {
  const errors: string[] = [];

  if (!change.path) {
    errors.push("File path is required");
  }

  if (!change.changeType) {
    errors.push("Change type is required");
  }

  if (change.changeType === "modify" && !change.originalContent) {
    errors.push("Original content is required for modifications");
  }

  if (
    (change.changeType === "create" || change.changeType === "modify") &&
    !change.newContent
  ) {
    errors.push("New content is required for creates and modifications");
  }

  return errors;
}

/**
 * Merge file changes with same path
 */
export function mergeFileChanges(changes: FileChange[]): FileChange[] {
  const merged = new Map<string, FileChange>();

  changes.forEach((change) => {
    const existing = merged.get(change.path);
    if (existing) {
      // Merge comments
      const allComments = [
        ...(existing.comments || []),
        ...(change.comments || []),
      ];
      merged.set(change.path, {
        ...change,
        comments: allComments,
        timestamp: change.timestamp, // Use latest timestamp
      });
    } else {
      merged.set(change.path, change);
    }
  });

  return Array.from(merged.values());
}
