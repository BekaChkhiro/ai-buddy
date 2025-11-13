/**
 * Code Preview and Approval System
 * Export all components and utilities
 */

// Components
export { DiffViewer } from "./DiffViewer";
export { CodeEditor } from "./CodeEditor";
export { FileChanges } from "./FileChanges";
export { ChangeStats } from "./ChangeStats";
export { ReviewPanel } from "./ReviewPanel";
export { ChangeRequest, InlineChangeRequest } from "./ChangeRequest";
export { ApprovalHistory } from "./ApprovalHistory";
export {
  KeyboardShortcutsHelp,
  InlineKeyboardShortcutsHelp,
} from "./KeyboardShortcutsHelp";

// Hooks
export {
  useKeyboardShortcuts,
  useKeyboardShortcutsHelp,
  formatShortcut,
} from "./useKeyboardShortcuts";

// Types
export type {
  ChangeType,
  ApprovalStatus,
  DiffViewMode,
  FileChange,
  Comment,
  ChangeStats as ChangeStatsType,
  ApprovalAction,
  ApprovalHistory as ApprovalHistoryType,
  DiffLine,
  CodeEditorProps,
  DiffViewerProps,
  FileChangesProps,
  ChangeStatsProps,
  ReviewPanelProps,
  ChangeRequestProps,
  ApprovalHistoryProps,
  KeyboardShortcuts,
} from "./types";

export { defaultKeyboardShortcuts } from "./types";

// Utilities
export {
  calculateChangeStats,
  generateDiffLines,
  detectLanguage,
  createApprovalHistory,
  areAllFilesApproved,
  hasRejectedFiles,
  getPendingFilesCount,
  filterChangesByStatus,
  sortChanges,
  formatFileSize,
  getChangeTypeColor,
  getApprovalStatusColor,
  validateFileChange,
  mergeFileChanges,
} from "./utils";
