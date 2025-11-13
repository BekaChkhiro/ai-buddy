/**
 * Types for Code Preview and Approval System
 */

export type ChangeType = "create" | "modify" | "delete";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "modified";

export type DiffViewMode = "split" | "unified" | "inline";

export interface FileChange {
  path: string;
  changeType: ChangeType;
  originalContent?: string;
  newContent?: string;
  timestamp: string;
  language?: string;
  approved?: boolean;
  approvalStatus?: ApprovalStatus;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  lineNumber?: number;
  content: string;
  author: string;
  timestamp: string;
  resolved?: boolean;
}

export interface ChangeStats {
  totalFiles: number;
  filesCreated: number;
  filesModified: number;
  filesDeleted: number;
  linesAdded: number;
  linesRemoved: number;
  linesChanged: number;
}

export interface ApprovalAction {
  id: string;
  fileChange: FileChange;
  action: "approve" | "reject" | "request_changes";
  comment?: string;
  timestamp: string;
  user: string;
}

export interface ApprovalHistory {
  actions: ApprovalAction[];
  totalApproved: number;
  totalRejected: number;
  totalPending: number;
}

export interface DiffLine {
  type: "add" | "remove" | "context" | "header";
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface CodeEditorProps {
  value: string;
  language?: string;
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  theme?: "light" | "dark";
  showMinimap?: boolean;
  enableAutoComplete?: boolean;
  enableErrorDetection?: boolean;
  formatOnSave?: boolean;
}

export interface DiffViewerProps {
  originalContent: string;
  modifiedContent: string;
  language?: string;
  fileName?: string;
  viewMode?: DiffViewMode;
  showLineNumbers?: boolean;
  highlightChanges?: boolean;
  collapseUnchanged?: boolean;
  onCommentAdd?: (lineNumber: number, comment: string) => void;
  comments?: Comment[];
}

export interface FileChangesProps {
  changes: FileChange[];
  selectedFile?: string;
  onFileSelect?: (filePath: string) => void;
  onApprove?: (filePath: string) => void;
  onReject?: (filePath: string) => void;
  onRequestChanges?: (filePath: string, comment: string) => void;
  filterByStatus?: ApprovalStatus;
  sortBy?: "name" | "type" | "status" | "timestamp";
}

export interface ChangeStatsProps {
  stats: ChangeStats;
  showDetails?: boolean;
}

export interface ReviewPanelProps {
  fileChanges: FileChange[];
  onApproveAll?: () => void;
  onRejectAll?: () => void;
  onApproveFile?: (filePath: string) => void;
  onRejectFile?: (filePath: string) => void;
  onRequestChanges?: (filePath: string, comment: string) => void;
  onEditFile?: (filePath: string, newContent: string) => void;
  onRegenerate?: (filePath: string) => void;
}

export interface ChangeRequestProps {
  filePath: string;
  currentContent: string;
  onSubmit: (comment: string) => void;
  onCancel: () => void;
}

export interface ApprovalHistoryProps {
  history: ApprovalHistory;
  onActionClick?: (action: ApprovalAction) => void;
  showFilters?: boolean;
}

export interface KeyboardShortcuts {
  approveFile: string;
  rejectFile: string;
  nextFile: string;
  prevFile: string;
  toggleDiffView: string;
  search: string;
  comment: string;
  saveEdit: string;
}

export const defaultKeyboardShortcuts: KeyboardShortcuts = {
  approveFile: "a",
  rejectFile: "r",
  nextFile: "j",
  prevFile: "k",
  toggleDiffView: "v",
  search: "/",
  comment: "c",
  saveEdit: "cmd+s",
};
