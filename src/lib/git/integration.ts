/**
 * Git Integration Service
 *
 * This module provides high-level Git integration features including
 * auto-commit, smart branching, and task-based Git workflows.
 */

import { getStatus, commit, push, stageFiles } from './operations';
import { createFeatureBranch, getCurrentBranch } from './branch';
import { getDiff } from './diff';
import {
  loadAutoCommitConfig,
  loadGitConfig,
  generateCommitMessage,
  inferCommitType,
} from './config';
import type {
  GitOperationResult,
  GitCommitOptions,
  BranchNamingConvention,
} from './types';

/**
 * Task information for Git integration
 */
export interface TaskInfo {
  id: string;
  title: string;
  description?: string;
  type?: 'feature' | 'bugfix' | 'chore' | 'refactor';
}

/**
 * Auto-commit after implementation
 *
 * @param projectPath - Project directory path
 * @param taskInfo - Task information
 * @param filesChanged - List of changed files
 * @returns Operation result with commit hash
 */
export async function autoCommitAfterImplementation(
  projectPath: string,
  taskInfo: TaskInfo,
  filesChanged?: string[]
): Promise<GitOperationResult<string>> {
  try {
    // Load configuration
    const autoCommitConfig = await loadAutoCommitConfig(projectPath);

    if (!autoCommitConfig.enabled || !autoCommitConfig.afterImplementation) {
      return {
        success: false,
        error: 'Auto-commit is disabled',
        message: 'Auto-commit is not enabled in configuration',
      };
    }

    // Check for changes
    const statusResult = await getStatus(projectPath);
    if (!statusResult.success || !statusResult.data?.hasChanges) {
      return {
        success: false,
        error: 'No changes to commit',
        message: 'No changes detected in working directory',
      };
    }

    // Get changed files if not provided
    if (!filesChanged && statusResult.data) {
      filesChanged = statusResult.data.files.map((f) => f.path);
    }

    // Generate commit message
    const commitMessage = generateCommitMessage(
      taskInfo.title,
      taskInfo.description,
      filesChanged,
      autoCommitConfig.messageTemplate
    );

    // Add task reference if enabled
    let finalMessage = commitMessage;
    if (autoCommitConfig.includeTaskReference) {
      finalMessage += `\n\nTask: #${taskInfo.id}`;
    }

    // Stage and commit
    const stageResult = await stageFiles(projectPath, []);
    if (!stageResult.success) {
      return {
        success: false,
        error: stageResult.error,
        message: 'Failed to stage files for commit',
      };
    }

    const commitOptions: GitCommitOptions = {
      message: finalMessage,
      all: true,
    };

    const commitResult = await commit(projectPath, commitOptions);
    if (!commitResult.success) {
      return commitResult;
    }

    // Auto-push if enabled
    if (autoCommitConfig.autoPush) {
      const pushResult = await push(projectPath);
      if (!pushResult.success) {
        return {
          success: true,
          data: commitResult.data,
          message: `Committed successfully but push failed: ${pushResult.error}`,
        };
      }
    }

    return {
      success: true,
      data: commitResult.data,
      message: autoCommitConfig.autoPush
        ? 'Changes committed and pushed successfully'
        : 'Changes committed successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to auto-commit changes',
    };
  }
}

/**
 * Create a feature branch for a task
 *
 * @param projectPath - Project directory path
 * @param taskInfo - Task information
 * @param convention - Branch naming convention
 * @returns Operation result with branch name
 */
export async function createTaskBranch(
  projectPath: string,
  taskInfo: TaskInfo,
  convention?: Partial<BranchNamingConvention>
): Promise<GitOperationResult<string>> {
  try {
    // Determine branch prefix based on task type
    let prefix = 'feature';
    if (taskInfo.type) {
      switch (taskInfo.type) {
        case 'bugfix':
          prefix = 'bugfix';
          break;
        case 'chore':
          prefix = 'chore';
          break;
        case 'refactor':
          prefix = 'refactor';
          break;
        default:
          prefix = 'feature';
      }
    }

    const branchConvention = {
      ...convention,
      prefix,
    };

    return await createFeatureBranch(
      projectPath,
      taskInfo.title,
      branchConvention
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create task branch',
    };
  }
}

/**
 * Complete a task with Git operations
 *
 * This function performs the following:
 * 1. Create a feature branch (if not already on one)
 * 2. Auto-commit changes
 * 3. Optionally push to remote
 *
 * @param projectPath - Project directory path
 * @param taskInfo - Task information
 * @param options - Options
 * @returns Operation result
 */
export async function completeTask(
  projectPath: string,
  taskInfo: TaskInfo,
  options: {
    createBranch?: boolean;
    autoCommit?: boolean;
    autoPush?: boolean;
  } = {}
): Promise<
  GitOperationResult<{
    branch?: string;
    commit?: string;
    pushed: boolean;
  }>
> {
  try {
    const result: {
      branch?: string;
      commit?: string;
      pushed: boolean;
    } = {
      pushed: false,
    };

    // Create branch if requested
    if (options.createBranch) {
      const branchResult = await createTaskBranch(projectPath, taskInfo);
      if (branchResult.success && branchResult.data) {
        result.branch = branchResult.data;
      }
    } else {
      const currentBranchResult = await getCurrentBranch(projectPath);
      if (currentBranchResult.success && currentBranchResult.data) {
        result.branch = currentBranchResult.data;
      }
    }

    // Auto-commit if requested
    if (options.autoCommit) {
      const commitResult = await autoCommitAfterImplementation(
        projectPath,
        taskInfo
      );

      if (commitResult.success && commitResult.data) {
        result.commit = commitResult.data;

        // Check if it was already pushed
        if (commitResult.message?.includes('pushed')) {
          result.pushed = true;
        }
      } else if (!commitResult.message?.includes('No changes')) {
        // If commit failed for reasons other than no changes, return error
        return {
          success: false,
          error: commitResult.error,
          message: commitResult.message,
        };
      }
    }

    // Push if requested and not already pushed
    if (options.autoPush && !result.pushed && result.commit) {
      const pushResult = await push(projectPath);
      if (pushResult.success) {
        result.pushed = true;
      }
    }

    return {
      success: true,
      data: result,
      message: 'Task completed successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to complete task',
    };
  }
}

/**
 * Get task completion status
 *
 * Check if a task has been committed and/or pushed
 *
 * @param projectPath - Project directory path
 * @param taskId - Task ID
 * @returns Status information
 */
export async function getTaskStatus(
  projectPath: string,
  taskId: string
): Promise<
  GitOperationResult<{
    hasUncommittedChanges: boolean;
    hasUnpushedCommits: boolean;
    branch: string;
  }>
> {
  try {
    const statusResult = await getStatus(projectPath);

    if (!statusResult.success || !statusResult.data) {
      return {
        success: false,
        error: 'Failed to get status',
        message: 'Could not retrieve Git status',
      };
    }

    return {
      success: true,
      data: {
        hasUncommittedChanges: statusResult.data.hasChanges,
        hasUnpushedCommits: statusResult.data.ahead > 0,
        branch: statusResult.data.branch,
      },
      message: 'Task status retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get task status',
    };
  }
}

/**
 * Generate a smart commit message from diff
 *
 * Analyzes the diff to generate an appropriate commit message
 *
 * @param projectPath - Project directory path
 * @param taskInfo - Optional task information
 * @returns Generated commit message
 */
export async function generateSmartCommitMessage(
  projectPath: string,
  taskInfo?: TaskInfo
): Promise<GitOperationResult<string>> {
  try {
    const diffResult = await getDiff(projectPath);

    if (!diffResult.success || !diffResult.data) {
      return {
        success: false,
        error: 'Failed to get diff',
        message: 'Could not retrieve diff',
      };
    }

    const diff = diffResult.data;

    // If task info is provided, use it
    if (taskInfo) {
      const commitType = inferCommitType(taskInfo.title);
      const message = generateCommitMessage(
        taskInfo.title,
        taskInfo.description,
        diff.files.map((f) => f.file),
        commitType
      );

      return {
        success: true,
        data: message,
        message: 'Commit message generated successfully',
      };
    }

    // Otherwise, generate from diff
    const fileCount = diff.files.length;
    const summary = diff.summary;

    let message = '';

    // Determine type based on changes
    if (diff.files.some((f) => f.changeType === 'add')) {
      message = `feat: Add ${fileCount} file${fileCount > 1 ? 's' : ''}`;
    } else if (diff.files.some((f) => f.changeType === 'delete')) {
      message = `chore: Remove ${fileCount} file${fileCount > 1 ? 's' : ''}`;
    } else {
      message = `refactor: Update ${fileCount} file${fileCount > 1 ? 's' : ''}`;
    }

    message += `\n\n${summary}`;

    return {
      success: true,
      data: message,
      message: 'Commit message generated successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to generate commit message',
    };
  }
}

/**
 * Validate task can be committed
 *
 * Check if there are changes and no conflicts
 *
 * @param projectPath - Project directory path
 * @returns Validation result
 */
export async function validateCanCommit(
  projectPath: string
): Promise<
  GitOperationResult<{
    canCommit: boolean;
    reason?: string;
  }>
> {
  try {
    const statusResult = await getStatus(projectPath);

    if (!statusResult.success || !statusResult.data) {
      return {
        success: false,
        error: 'Failed to get status',
        message: 'Could not retrieve Git status',
      };
    }

    const status = statusResult.data;

    // Check for conflicts
    if (status.conflicts.length > 0) {
      return {
        success: true,
        data: {
          canCommit: false,
          reason: `There are ${status.conflicts.length} merge conflict(s) that must be resolved`,
        },
        message: 'Cannot commit due to conflicts',
      };
    }

    // Check for changes
    if (!status.hasChanges) {
      return {
        success: true,
        data: {
          canCommit: false,
          reason: 'No changes to commit',
        },
        message: 'No changes detected',
      };
    }

    return {
      success: true,
      data: {
        canCommit: true,
      },
      message: 'Ready to commit',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to validate commit',
    };
  }
}

export default {
  autoCommitAfterImplementation,
  createTaskBranch,
  completeTask,
  getTaskStatus,
  generateSmartCommitMessage,
  validateCanCommit,
};
