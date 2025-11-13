/**
 * Git Branch Management
 *
 * This module provides functions for managing Git branches.
 */

import { getGitClient } from './client';
import type {
  GitBranch,
  GitBranchOptions,
  GitOperationResult,
  BranchNamingConvention,
} from './types';

/**
 * Default branch naming convention
 */
const defaultNamingConvention: BranchNamingConvention = {
  prefix: 'feature',
  separator: '/',
  maxLength: 50,
  allowedCharacters: /^[a-zA-Z0-9/_-]+$/,
  transformer: (name: string) =>
    name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9/_-]/g, ''),
};

/**
 * Get list of branches
 *
 * @param projectPath - Project directory path
 * @param includeRemote - Include remote branches
 * @returns List of branches
 */
export async function getBranches(
  projectPath: string,
  includeRemote = false
): Promise<GitOperationResult<GitBranch[]>> {
  try {
    const git = getGitClient(projectPath);
    const branchSummary = await git.branch(
      includeRemote ? ['-a'] : undefined
    );

    const branches: GitBranch[] = Object.keys(branchSummary.branches).map(
      (name) => {
        const branch = branchSummary.branches[name];
        return {
          name: name.replace('remotes/', ''),
          current: branch.current,
          commit: branch.commit,
          label: branch.label || undefined,
          remote: name.startsWith('remotes/'),
        };
      }
    );

    return {
      success: true,
      data: branches,
      message: 'Branches retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get branches',
    };
  }
}

/**
 * Get current branch
 *
 * @param projectPath - Project directory path
 * @returns Current branch name
 */
export async function getCurrentBranch(
  projectPath: string
): Promise<GitOperationResult<string>> {
  try {
    const git = getGitClient(projectPath);
    const branchSummary = await git.branch();

    return {
      success: true,
      data: branchSummary.current,
      message: 'Current branch retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get current branch',
    };
  }
}

/**
 * Create a new branch
 *
 * @param projectPath - Project directory path
 * @param options - Branch options
 * @returns Operation result
 */
export async function createBranch(
  projectPath: string,
  options: GitBranchOptions
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);

    const args: string[] = [];

    if (options.force) {
      args.push('-f');
    }

    if (options.track && options.remote) {
      args.push('--track', `${options.remote}/${options.name}`);
    }

    if (options.startPoint) {
      await git.checkoutBranch(options.name, options.startPoint);
    } else {
      await git.checkoutLocalBranch(options.name);
    }

    return {
      success: true,
      message: `Branch ${options.name} created successfully`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create branch',
    };
  }
}

/**
 * Switch to a branch
 *
 * @param projectPath - Project directory path
 * @param branchName - Branch name
 * @returns Operation result
 */
export async function switchBranch(
  projectPath: string,
  branchName: string
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);
    await git.checkout(branchName);

    return {
      success: true,
      message: `Switched to branch ${branchName}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to switch branch',
    };
  }
}

/**
 * Delete a branch
 *
 * @param projectPath - Project directory path
 * @param branchName - Branch name
 * @param force - Force delete
 * @returns Operation result
 */
export async function deleteBranch(
  projectPath: string,
  branchName: string,
  force = false
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);

    if (force) {
      await git.deleteLocalBranch(branchName, true);
    } else {
      await git.deleteLocalBranch(branchName);
    }

    return {
      success: true,
      message: `Branch ${branchName} deleted successfully`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to delete branch',
    };
  }
}

/**
 * Rename current branch
 *
 * @param projectPath - Project directory path
 * @param newName - New branch name
 * @returns Operation result
 */
export async function renameBranch(
  projectPath: string,
  newName: string
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);
    await git.branch(['-m', newName]);

    return {
      success: true,
      message: `Branch renamed to ${newName}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to rename branch',
    };
  }
}

/**
 * Check if a branch exists
 *
 * @param projectPath - Project directory path
 * @param branchName - Branch name
 * @returns True if the branch exists
 */
export async function branchExists(
  projectPath: string,
  branchName: string
): Promise<boolean> {
  const result = await getBranches(projectPath, true);
  if (!result.success || !result.data) {
    return false;
  }

  return result.data.some((branch) => branch.name === branchName);
}

/**
 * Generate a branch name from a task title
 *
 * @param taskTitle - Task title
 * @param convention - Naming convention
 * @returns Generated branch name
 */
export function generateBranchName(
  taskTitle: string,
  convention: Partial<BranchNamingConvention> = {}
): string {
  const config = { ...defaultNamingConvention, ...convention };

  let name = taskTitle;

  // Apply transformer
  if (config.transformer) {
    name = config.transformer(name);
  }

  // Ensure valid characters
  name = name.replace(
    new RegExp(`[^${config.allowedCharacters.source.slice(2, -3)}]`, 'g'),
    ''
  );

  // Truncate if too long
  const prefixLength = config.prefix.length + config.separator.length;
  const maxNameLength = config.maxLength - prefixLength;
  if (name.length > maxNameLength) {
    name = name.substring(0, maxNameLength);
  }

  // Add prefix
  return `${config.prefix}${config.separator}${name}`;
}

/**
 * Create a feature branch from task
 *
 * @param projectPath - Project directory path
 * @param taskTitle - Task title
 * @param convention - Naming convention
 * @returns Operation result with branch name
 */
export async function createFeatureBranch(
  projectPath: string,
  taskTitle: string,
  convention?: Partial<BranchNamingConvention>
): Promise<GitOperationResult<string>> {
  try {
    const branchName = generateBranchName(taskTitle, convention);

    // Check if branch already exists
    if (await branchExists(projectPath, branchName)) {
      return {
        success: false,
        error: 'Branch already exists',
        message: `Branch ${branchName} already exists`,
      };
    }

    // Create branch
    const result = await createBranch(projectPath, { name: branchName });

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        message: result.message,
      };
    }

    return {
      success: true,
      data: branchName,
      message: `Feature branch ${branchName} created successfully`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create feature branch',
    };
  }
}

/**
 * Get branch tracking information
 *
 * @param projectPath - Project directory path
 * @param branchName - Branch name (optional, uses current branch)
 * @returns Tracking information
 */
export async function getBranchTracking(
  projectPath: string,
  branchName?: string
): Promise<
  GitOperationResult<{
    local: string;
    remote?: string;
    ahead: number;
    behind: number;
  }>
> {
  try {
    const git = getGitClient(projectPath);

    const branch = branchName || (await git.branch()).current;
    const status = await git.status();

    return {
      success: true,
      data: {
        local: branch,
        remote: status.tracking || undefined,
        ahead: status.ahead,
        behind: status.behind,
      },
      message: 'Branch tracking retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get branch tracking',
    };
  }
}

/**
 * Set branch upstream
 *
 * @param projectPath - Project directory path
 * @param branchName - Local branch name
 * @param remote - Remote name
 * @param remoteBranch - Remote branch name
 * @returns Operation result
 */
export async function setUpstream(
  projectPath: string,
  branchName: string,
  remote = 'origin',
  remoteBranch?: string
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);

    const upstream = remoteBranch || branchName;
    await git.branch(['--set-upstream-to', `${remote}/${upstream}`, branchName]);

    return {
      success: true,
      message: `Upstream set to ${remote}/${upstream}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to set upstream',
    };
  }
}

/**
 * Get merged branches
 *
 * @param projectPath - Project directory path
 * @param targetBranch - Target branch (default: current branch)
 * @returns List of merged branch names
 */
export async function getMergedBranches(
  projectPath: string,
  targetBranch?: string
): Promise<GitOperationResult<string[]>> {
  try {
    const git = getGitClient(projectPath);

    const args = ['--merged'];
    if (targetBranch) {
      args.push(targetBranch);
    }

    const result = await git.branch(args);

    const branches = Object.keys(result.branches)
      .filter((name) => !result.branches[name].current)
      .map((name) => name.trim());

    return {
      success: true,
      data: branches,
      message: 'Merged branches retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get merged branches',
    };
  }
}

/**
 * Get unmerged branches
 *
 * @param projectPath - Project directory path
 * @param targetBranch - Target branch (default: current branch)
 * @returns List of unmerged branch names
 */
export async function getUnmergedBranches(
  projectPath: string,
  targetBranch?: string
): Promise<GitOperationResult<string[]>> {
  try {
    const git = getGitClient(projectPath);

    const args = ['--no-merged'];
    if (targetBranch) {
      args.push(targetBranch);
    }

    const result = await git.branch(args);

    const branches = Object.keys(result.branches).map((name) => name.trim());

    return {
      success: true,
      data: branches,
      message: 'Unmerged branches retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get unmerged branches',
    };
  }
}

/**
 * Prune remote branches
 *
 * @param projectPath - Project directory path
 * @param remote - Remote name
 * @returns Operation result
 */
export async function pruneRemoteBranches(
  projectPath: string,
  remote = 'origin'
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);
    await git.raw(['remote', 'prune', remote]);

    return {
      success: true,
      message: `Pruned remote branches from ${remote}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to prune remote branches',
    };
  }
}

export default {
  getBranches,
  getCurrentBranch,
  createBranch,
  switchBranch,
  deleteBranch,
  renameBranch,
  branchExists,
  generateBranchName,
  createFeatureBranch,
  getBranchTracking,
  setUpstream,
  getMergedBranches,
  getUnmergedBranches,
  pruneRemoteBranches,
};
