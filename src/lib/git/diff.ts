/**
 * Git Diff Parsing and Formatting
 *
 * This module provides functions to parse and format Git diffs,
 * including support for unified diffs and human-readable summaries.
 */

import { getGitClient } from './client';
import type {
  GitDiff,
  GitFileDiff,
  GitDiffHunk,
  GitDiffChangeType,
  GitOperationResult,
} from './types';

/**
 * Parse a unified diff string into structured format
 *
 * @param diffText - Raw diff text
 * @returns Parsed diff structure
 */
export function parseDiff(diffText: string): GitFileDiff[] {
  const files: GitFileDiff[] = [];
  const lines = diffText.split('\n');

  let currentFile: Partial<GitFileDiff> | null = null;
  let currentHunk: Partial<GitDiffHunk> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // File header
    if (line.startsWith('diff --git')) {
      if (currentFile && currentFile.file) {
        files.push(currentFile as GitFileDiff);
      }

      currentFile = {
        file: '',
        changeType: 'modify',
        additions: 0,
        deletions: 0,
        hunks: [],
      };
      currentHunk = null;
    }

    // Old file name
    else if (line.startsWith('--- ')) {
      if (currentFile) {
        const match = line.match(/^--- a\/(.+)$/);
        if (match) {
          currentFile.oldFile = match[1];
        }
      }
    }

    // New file name
    else if (line.startsWith('+++ ')) {
      if (currentFile) {
        const match = line.match(/^\+\+\+ b\/(.+)$/);
        if (match) {
          currentFile.file = match[1];
        }
      }
    }

    // New file
    else if (line.startsWith('new file')) {
      if (currentFile) {
        currentFile.changeType = 'add';
      }
    }

    // Deleted file
    else if (line.startsWith('deleted file')) {
      if (currentFile) {
        currentFile.changeType = 'delete';
      }
    }

    // Renamed file
    else if (line.startsWith('rename from')) {
      if (currentFile) {
        currentFile.changeType = 'rename';
        const match = line.match(/^rename from (.+)$/);
        if (match) {
          currentFile.oldFile = match[1];
        }
      }
    }

    // Hunk header
    else if (line.startsWith('@@')) {
      const match = line.match(/^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
      if (match && currentFile) {
        if (currentHunk && currentHunk.lines) {
          currentFile.hunks!.push(currentHunk as GitDiffHunk);
        }

        currentHunk = {
          oldStart: parseInt(match[1]),
          oldLines: match[2] ? parseInt(match[2]) : 1,
          newStart: parseInt(match[3]),
          newLines: match[4] ? parseInt(match[4]) : 1,
          lines: [],
        };
      }
    }

    // Hunk content
    else if (currentHunk && (line.startsWith('+') || line.startsWith('-') || line.startsWith(' '))) {
      currentHunk.lines!.push(line);

      if (currentFile) {
        if (line.startsWith('+')) {
          currentFile.additions! += 1;
        } else if (line.startsWith('-')) {
          currentFile.deletions! += 1;
        }
      }
    }
  }

  // Add last hunk and file
  if (currentHunk && currentHunk.lines && currentFile) {
    currentFile.hunks!.push(currentHunk as GitDiffHunk);
  }
  if (currentFile && currentFile.file) {
    files.push(currentFile as GitFileDiff);
  }

  return files;
}

/**
 * Get diff between two commits or branches
 *
 * @param projectPath - Project directory path
 * @param from - Starting commit/branch
 * @param to - Ending commit/branch (default: working directory)
 * @returns Parsed diff
 */
export async function getDiff(
  projectPath: string,
  from?: string,
  to?: string
): Promise<GitOperationResult<GitDiff>> {
  try {
    const git = getGitClient(projectPath);

    let diffText: string;
    if (from && to) {
      diffText = await git.diff([from, to]);
    } else if (from) {
      diffText = await git.diff([from]);
    } else {
      diffText = await git.diff();
    }

    const files = parseDiff(diffText);

    const totalAdditions = files.reduce((sum, file) => sum + file.additions, 0);
    const totalDeletions = files.reduce((sum, file) => sum + file.deletions, 0);

    const summary = formatDiffSummary(files.length, totalAdditions, totalDeletions);

    const diff: GitDiff = {
      files,
      totalAdditions,
      totalDeletions,
      summary,
    };

    return {
      success: true,
      data: diff,
      message: 'Diff retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get diff',
    };
  }
}

/**
 * Get staged diff (diff of staged changes)
 *
 * @param projectPath - Project directory path
 * @returns Parsed diff of staged changes
 */
export async function getStagedDiff(
  projectPath: string
): Promise<GitOperationResult<GitDiff>> {
  try {
    const git = getGitClient(projectPath);
    const diffText = await git.diff(['--cached']);

    const files = parseDiff(diffText);

    const totalAdditions = files.reduce((sum, file) => sum + file.additions, 0);
    const totalDeletions = files.reduce((sum, file) => sum + file.deletions, 0);

    const summary = formatDiffSummary(files.length, totalAdditions, totalDeletions);

    const diff: GitDiff = {
      files,
      totalAdditions,
      totalDeletions,
      summary,
    };

    return {
      success: true,
      data: diff,
      message: 'Staged diff retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get staged diff',
    };
  }
}

/**
 * Get diff for a specific file
 *
 * @param projectPath - Project directory path
 * @param filePath - Path to the file
 * @param from - Starting commit/branch
 * @param to - Ending commit/branch (default: working directory)
 * @returns Parsed diff for the file
 */
export async function getFileDiff(
  projectPath: string,
  filePath: string,
  from?: string,
  to?: string
): Promise<GitOperationResult<GitFileDiff | null>> {
  try {
    const git = getGitClient(projectPath);

    let diffText: string;
    if (from && to) {
      diffText = await git.diff([from, to, '--', filePath]);
    } else if (from) {
      diffText = await git.diff([from, '--', filePath]);
    } else {
      diffText = await git.diff(['--', filePath]);
    }

    const files = parseDiff(diffText);
    const fileDiff = files.find((f) => f.file === filePath) || null;

    return {
      success: true,
      data: fileDiff,
      message: 'File diff retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get file diff',
    };
  }
}

/**
 * Format a diff summary
 *
 * @param filesChanged - Number of files changed
 * @param additions - Number of additions
 * @param deletions - Number of deletions
 * @returns Formatted summary string
 */
export function formatDiffSummary(
  filesChanged: number,
  additions: number,
  deletions: number
): string {
  const parts: string[] = [];

  if (filesChanged === 1) {
    parts.push('1 file changed');
  } else if (filesChanged > 1) {
    parts.push(`${filesChanged} files changed`);
  }

  if (additions > 0) {
    parts.push(`${additions} insertion${additions === 1 ? '' : 's'}(+)`);
  }

  if (deletions > 0) {
    parts.push(`${deletions} deletion${deletions === 1 ? '' : 's'}(-)`);
  }

  return parts.join(', ');
}

/**
 * Format a diff for display
 *
 * @param diff - Git diff object
 * @param colorize - Add ANSI color codes
 * @returns Formatted diff string
 */
export function formatDiff(diff: GitDiff, colorize = false): string {
  const lines: string[] = [];

  lines.push(diff.summary);
  lines.push('');

  for (const file of diff.files) {
    // File header
    const changeType = getChangeTypeSymbol(file.changeType);
    lines.push(`${changeType} ${file.file}`);

    if (file.oldFile && file.oldFile !== file.file) {
      lines.push(`  (renamed from ${file.oldFile})`);
    }

    lines.push(
      `  +${file.additions} -${file.deletions}`
    );

    // Hunks
    for (const hunk of file.hunks) {
      lines.push('');
      lines.push(
        `  @@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`
      );

      for (const line of hunk.lines) {
        if (colorize) {
          if (line.startsWith('+')) {
            lines.push(`  \x1b[32m${line}\x1b[0m`);
          } else if (line.startsWith('-')) {
            lines.push(`  \x1b[31m${line}\x1b[0m`);
          } else {
            lines.push(`  ${line}`);
          }
        } else {
          lines.push(`  ${line}`);
        }
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Get a symbol representing a change type
 *
 * @param changeType - Change type
 * @returns Symbol string
 */
function getChangeTypeSymbol(changeType: GitDiffChangeType): string {
  switch (changeType) {
    case 'add':
      return '✨';
    case 'delete':
      return '🗑️';
    case 'modify':
      return '✏️';
    case 'rename':
      return '📝';
    case 'copy':
      return '📋';
    default:
      return '•';
  }
}

/**
 * Get diff statistics
 *
 * @param projectPath - Project directory path
 * @param from - Starting commit/branch
 * @param to - Ending commit/branch
 * @returns Diff statistics
 */
export async function getDiffStats(
  projectPath: string,
  from?: string,
  to?: string
): Promise<
  GitOperationResult<{
    filesChanged: number;
    additions: number;
    deletions: number;
  }>
> {
  try {
    const git = getGitClient(projectPath);

    let output: string;
    if (from && to) {
      output = await git.diff(['--shortstat', from, to]);
    } else if (from) {
      output = await git.diff(['--shortstat', from]);
    } else {
      output = await git.diff(['--shortstat']);
    }

    // Parse shortstat output
    // Example: " 3 files changed, 45 insertions(+), 12 deletions(-)"
    const filesMatch = output.match(/(\d+) files? changed/);
    const additionsMatch = output.match(/(\d+) insertions?\(\+\)/);
    const deletionsMatch = output.match(/(\d+) deletions?\(-\)/);

    const stats = {
      filesChanged: filesMatch ? parseInt(filesMatch[1]) : 0,
      additions: additionsMatch ? parseInt(additionsMatch[1]) : 0,
      deletions: deletionsMatch ? parseInt(deletionsMatch[1]) : 0,
    };

    return {
      success: true,
      data: stats,
      message: 'Diff stats retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get diff stats',
    };
  }
}

/**
 * Check if a file has changes
 *
 * @param projectPath - Project directory path
 * @param filePath - Path to the file
 * @returns True if the file has changes
 */
export async function hasFileChanges(
  projectPath: string,
  filePath: string
): Promise<boolean> {
  const result = await getFileDiff(projectPath, filePath);
  return result.success && result.data !== null;
}

export default {
  parseDiff,
  getDiff,
  getStagedDiff,
  getFileDiff,
  formatDiffSummary,
  formatDiff,
  getDiffStats,
  hasFileChanges,
};
