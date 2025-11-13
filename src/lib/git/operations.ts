/**
 * Git Operations Wrapper
 *
 * This module provides high-level Git operations with error handling,
 * validation, and type-safe interfaces.
 */

import { getGitClient } from './client';
import type {
  GitStatus,
  GitFileStatus,
  GitOperationResult,
  GitCommitOptions,
  GitPushOptions,
  GitPullOptions,
  GitMergeOptions,
  GitRemote,
  GitStash,
} from './types';

/**
 * Get the current Git status
 *
 * @param projectPath - Project directory path
 * @returns Git status information
 */
export async function getStatus(
  projectPath: string
): Promise<GitOperationResult<GitStatus>> {
  try {
    const git = getGitClient(projectPath);
    const status = await git.status();

    const files: GitFileStatus[] = [];

    // Process staged files
    status.staged.forEach((file) => {
      files.push({
        path: file,
        status: 'modified',
        staged: true,
        workingDir: false,
      });
    });

    // Process modified files
    status.modified.forEach((file) => {
      if (!files.find((f) => f.path === file)) {
        files.push({
          path: file,
          status: 'modified',
          staged: false,
          workingDir: true,
        });
      }
    });

    // Process deleted files
    status.deleted.forEach((file) => {
      files.push({
        path: file,
        status: 'deleted',
        staged: false,
        workingDir: true,
      });
    });

    // Process renamed files
    status.renamed.forEach((file) => {
      files.push({
        path: file.to || file.from,
        status: 'renamed',
        staged: true,
        workingDir: false,
      });
    });

    // Process created/added files
    status.created.forEach((file) => {
      files.push({
        path: file,
        status: 'added',
        staged: true,
        workingDir: false,
      });
    });

    // Process untracked files
    status.not_added.forEach((file) => {
      files.push({
        path: file,
        status: 'untracked',
        staged: false,
        workingDir: true,
      });
    });

    // Process conflicted files
    status.conflicted.forEach((file) => {
      files.push({
        path: file,
        status: 'conflicted',
        staged: false,
        workingDir: true,
      });
    });

    const gitStatus: GitStatus = {
      branch: status.current || 'HEAD',
      ahead: status.ahead,
      behind: status.behind,
      files,
      conflicts: status.conflicted,
      isClean: status.isClean(),
      hasChanges: !status.isClean(),
      tracking: status.tracking || undefined,
    };

    return {
      success: true,
      data: gitStatus,
      message: 'Status retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get Git status',
    };
  }
}

/**
 * Stage files for commit
 *
 * @param projectPath - Project directory path
 * @param files - Files to stage (empty array for all files)
 * @returns Operation result
 */
export async function stageFiles(
  projectPath: string,
  files: string[] = []
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);

    if (files.length === 0) {
      await git.add('.');
    } else {
      await git.add(files);
    }

    return {
      success: true,
      message: `Staged ${files.length === 0 ? 'all files' : `${files.length} file(s)`}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to stage files',
    };
  }
}

/**
 * Unstage files
 *
 * @param projectPath - Project directory path
 * @param files - Files to unstage (empty array for all files)
 * @returns Operation result
 */
export async function unstageFiles(
  projectPath: string,
  files: string[] = []
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);

    if (files.length === 0) {
      await git.reset(['HEAD']);
    } else {
      await git.reset(['HEAD', ...files]);
    }

    return {
      success: true,
      message: `Unstaged ${files.length === 0 ? 'all files' : `${files.length} file(s)`}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to unstage files',
    };
  }
}

/**
 * Create a commit
 *
 * @param projectPath - Project directory path
 * @param options - Commit options
 * @returns Operation result with commit hash
 */
export async function commit(
  projectPath: string,
  options: GitCommitOptions
): Promise<GitOperationResult<string>> {
  try {
    const git = getGitClient(projectPath);

    // Stage files if specified
    if (options.files && options.files.length > 0) {
      await git.add(options.files);
    } else if (options.all) {
      await git.add('.');
    }

    // Build commit options
    const commitOptions: string[] = [];

    if (options.amend) {
      commitOptions.push('--amend');
    }

    if (options.author) {
      commitOptions.push('--author', options.author);
    }

    // Add co-authors to message if specified
    let message = options.message;
    if (options.coAuthors && options.coAuthors.length > 0) {
      message += '\n\n';
      options.coAuthors.forEach((coAuthor) => {
        message += `Co-authored-by: ${coAuthor}\n`;
      });
    }

    // Commit
    const result = await git.commit(message, undefined, commitOptions);

    return {
      success: true,
      data: result.commit,
      message: `Commit created: ${result.commit.substring(0, 7)}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create commit',
    };
  }
}

/**
 * Push changes to remote
 *
 * @param projectPath - Project directory path
 * @param options - Push options
 * @returns Operation result
 */
export async function push(
  projectPath: string,
  options: GitPushOptions = {}
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);

    const pushOptions: string[] = [];

    if (options.force) {
      pushOptions.push('--force');
    }

    if (options.setUpstream) {
      pushOptions.push('--set-upstream');
    }

    if (options.tags) {
      pushOptions.push('--tags');
    }

    const remote = options.remote || 'origin';
    const branch = options.branch;

    if (branch) {
      await git.push(remote, branch, pushOptions);
    } else {
      await git.push(remote, pushOptions);
    }

    return {
      success: true,
      message: `Pushed to ${remote}${branch ? `/${branch}` : ''}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to push changes',
    };
  }
}

/**
 * Pull changes from remote
 *
 * @param projectPath - Project directory path
 * @param options - Pull options
 * @returns Operation result
 */
export async function pull(
  projectPath: string,
  options: GitPullOptions = {}
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);

    const pullOptions: string[] = [];

    if (options.rebase) {
      pullOptions.push('--rebase');
    }

    const remote = options.remote || 'origin';
    const branch = options.branch;

    if (branch) {
      await git.pull(remote, branch, pullOptions);
    } else {
      await git.pull(remote, undefined, pullOptions);
    }

    return {
      success: true,
      message: `Pulled from ${remote}${branch ? `/${branch}` : ''}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to pull changes',
    };
  }
}

/**
 * Fetch changes from remote
 *
 * @param projectPath - Project directory path
 * @param remote - Remote name (default: origin)
 * @returns Operation result
 */
export async function fetch(
  projectPath: string,
  remote = 'origin'
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);
    await git.fetch(remote);

    return {
      success: true,
      message: `Fetched from ${remote}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to fetch changes',
    };
  }
}

/**
 * Merge a branch into the current branch
 *
 * @param projectPath - Project directory path
 * @param options - Merge options
 * @returns Operation result
 */
export async function merge(
  projectPath: string,
  options: GitMergeOptions
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);

    const mergeOptions: string[] = [];

    if (options.noFastForward) {
      mergeOptions.push('--no-ff');
    }

    if (options.strategy) {
      mergeOptions.push('--strategy', options.strategy);
    }

    if (options.message) {
      mergeOptions.push('-m', options.message);
    }

    await git.merge([options.branch, ...mergeOptions]);

    return {
      success: true,
      message: `Merged ${options.branch}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to merge branch',
    };
  }
}

/**
 * Get list of remotes
 *
 * @param projectPath - Project directory path
 * @returns List of remotes
 */
export async function getRemotes(
  projectPath: string
): Promise<GitOperationResult<GitRemote[]>> {
  try {
    const git = getGitClient(projectPath);
    const remotes = await git.getRemotes(true);

    const gitRemotes: GitRemote[] = remotes.map((remote) => ({
      name: remote.name,
      url: remote.refs.fetch,
      fetchUrl: remote.refs.fetch,
      pushUrl: remote.refs.push,
    }));

    return {
      success: true,
      data: gitRemotes,
      message: 'Remotes retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get remotes',
    };
  }
}

/**
 * Add a remote
 *
 * @param projectPath - Project directory path
 * @param name - Remote name
 * @param url - Remote URL
 * @returns Operation result
 */
export async function addRemote(
  projectPath: string,
  name: string,
  url: string
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);
    await git.addRemote(name, url);

    return {
      success: true,
      message: `Added remote ${name}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to add remote',
    };
  }
}

/**
 * Remove a remote
 *
 * @param projectPath - Project directory path
 * @param name - Remote name
 * @returns Operation result
 */
export async function removeRemote(
  projectPath: string,
  name: string
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);
    await git.removeRemote(name);

    return {
      success: true,
      message: `Removed remote ${name}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to remove remote',
    };
  }
}

/**
 * Stash changes
 *
 * @param projectPath - Project directory path
 * @param message - Stash message
 * @returns Operation result
 */
export async function stash(
  projectPath: string,
  message?: string
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);

    if (message) {
      await git.stash(['push', '-m', message]);
    } else {
      await git.stash(['push']);
    }

    return {
      success: true,
      message: 'Changes stashed',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to stash changes',
    };
  }
}

/**
 * Pop stashed changes
 *
 * @param projectPath - Project directory path
 * @param index - Stash index (default: 0)
 * @returns Operation result
 */
export async function stashPop(
  projectPath: string,
  index = 0
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);
    await git.stash(['pop', `stash@{${index}}`]);

    return {
      success: true,
      message: 'Stash applied',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to apply stash',
    };
  }
}

/**
 * List stashes
 *
 * @param projectPath - Project directory path
 * @returns List of stashes
 */
export async function listStashes(
  projectPath: string
): Promise<GitOperationResult<GitStash[]>> {
  try {
    const git = getGitClient(projectPath);
    const stashList = await git.stashList();

    const stashes: GitStash[] = stashList.all.map((stash, index) => ({
      index,
      message: stash.message,
      branch: '',
      hash: stash.hash,
    }));

    return {
      success: true,
      data: stashes,
      message: 'Stashes retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to list stashes',
    };
  }
}

/**
 * Discard changes in working directory
 *
 * @param projectPath - Project directory path
 * @param files - Files to discard (empty array for all files)
 * @returns Operation result
 */
export async function discardChanges(
  projectPath: string,
  files: string[] = []
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);

    if (files.length === 0) {
      await git.checkout(['.']);
    } else {
      await git.checkout(files);
    }

    return {
      success: true,
      message: `Discarded changes in ${files.length === 0 ? 'all files' : `${files.length} file(s)`}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to discard changes',
    };
  }
}

/**
 * Check if there are merge conflicts
 *
 * @param projectPath - Project directory path
 * @returns True if there are conflicts
 */
export async function hasConflicts(projectPath: string): Promise<boolean> {
  const result = await getStatus(projectPath);
  return result.success && result.data ? result.data.conflicts.length > 0 : false;
}

export default {
  getStatus,
  stageFiles,
  unstageFiles,
  commit,
  push,
  pull,
  fetch,
  merge,
  getRemotes,
  addRemote,
  removeRemote,
  stash,
  stashPop,
  listStashes,
  discardChanges,
  hasConflicts,
};
