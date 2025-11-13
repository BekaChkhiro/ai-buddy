/**
 * Git Integration Types and Interfaces
 *
 * This module defines all TypeScript types and interfaces used in the Git integration system.
 */

import type { StatusResult, DiffResult, LogResult } from 'simple-git';

/**
 * Git file status information
 */
export interface GitFileStatus {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'untracked' | 'conflicted';
  staged: boolean;
  workingDir: boolean;
}

/**
 * Git repository status
 */
export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  files: GitFileStatus[];
  conflicts: string[];
  isClean: boolean;
  hasChanges: boolean;
  tracking?: string;
}

/**
 * Git commit information
 */
export interface GitCommit {
  hash: string;
  author: string;
  email: string;
  date: Date;
  message: string;
  body?: string;
  refs?: string[];
  parents?: string[];
}

/**
 * Git branch information
 */
export interface GitBranch {
  name: string;
  current: boolean;
  commit: string;
  label?: string;
  remote?: boolean;
}

/**
 * Git diff change type
 */
export type GitDiffChangeType = 'add' | 'delete' | 'modify' | 'rename' | 'copy';

/**
 * Git diff hunk
 */
export interface GitDiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}

/**
 * Git diff for a single file
 */
export interface GitFileDiff {
  file: string;
  oldFile?: string;
  changeType: GitDiffChangeType;
  additions: number;
  deletions: number;
  hunks: GitDiffHunk[];
}

/**
 * Complete Git diff result
 */
export interface GitDiff {
  files: GitFileDiff[];
  totalAdditions: number;
  totalDeletions: number;
  summary: string;
}

/**
 * Git merge conflict information
 */
export interface GitConflict {
  file: string;
  ours: string;
  theirs: string;
  base?: string;
  resolved: boolean;
}

/**
 * Git configuration options
 */
export interface GitConfig {
  projectPath: string;
  autoCommit?: boolean;
  autoPush?: boolean;
  branchPrefix?: string;
  commitTemplate?: string;
  remoteName?: string;
  excludePatterns?: string[];
}

/**
 * Commit message template variables
 */
export interface CommitTemplateVars {
  taskTitle?: string;
  taskDescription?: string;
  author?: string;
  timestamp?: string;
  filesChanged?: string[];
  customFields?: Record<string, string>;
}

/**
 * Git operation result
 */
export interface GitOperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Git commit options
 */
export interface GitCommitOptions {
  message: string;
  files?: string[];
  all?: boolean;
  amend?: boolean;
  author?: string;
  coAuthors?: string[];
}

/**
 * Git branch options
 */
export interface GitBranchOptions {
  name: string;
  startPoint?: string;
  force?: boolean;
  track?: boolean;
  remote?: string;
}

/**
 * Git push options
 */
export interface GitPushOptions {
  remote?: string;
  branch?: string;
  force?: boolean;
  setUpstream?: boolean;
  tags?: boolean;
}

/**
 * Git pull options
 */
export interface GitPullOptions {
  remote?: string;
  branch?: string;
  rebase?: boolean;
}

/**
 * Git merge options
 */
export interface GitMergeOptions {
  branch: string;
  noFastForward?: boolean;
  strategy?: string;
  message?: string;
}

/**
 * Git stash information
 */
export interface GitStash {
  index: number;
  message: string;
  branch: string;
  hash: string;
}

/**
 * Git LFS file information
 */
export interface GitLFSFile {
  path: string;
  oid: string;
  size: number;
  isLFS: boolean;
}

/**
 * Git LFS configuration
 */
export interface GitLFSConfig {
  enabled: boolean;
  patterns: string[];
  minFileSize?: number;
}

/**
 * Git remote information
 */
export interface GitRemote {
  name: string;
  url: string;
  fetchUrl: string;
  pushUrl: string;
}

/**
 * Git tag information
 */
export interface GitTag {
  name: string;
  hash: string;
  message?: string;
  taggerName?: string;
  taggerEmail?: string;
  date?: Date;
}

/**
 * Branch naming conventions
 */
export interface BranchNamingConvention {
  prefix: string;
  separator: string;
  maxLength: number;
  allowedCharacters: RegExp;
  transformer?: (name: string) => string;
}

/**
 * Git integration event types
 */
export type GitEventType =
  | 'commit'
  | 'push'
  | 'branch_created'
  | 'branch_switched'
  | 'merge'
  | 'conflict'
  | 'status_changed';

/**
 * Git integration event
 */
export interface GitEvent {
  type: GitEventType;
  timestamp: Date;
  data: unknown;
  projectPath: string;
}

/**
 * Auto-commit configuration
 */
export interface AutoCommitConfig {
  enabled: boolean;
  afterImplementation: boolean;
  messageTemplate: string;
  includeTaskReference: boolean;
  autoPush: boolean;
}

/**
 * Export types from simple-git for convenience
 */
export type { StatusResult, DiffResult, LogResult };
