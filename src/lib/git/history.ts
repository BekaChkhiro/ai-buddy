/**
 * Git Commit History
 *
 * This module provides functions to retrieve and format Git commit history.
 */

import { getGitClient } from './client';
import type { GitCommit, GitOperationResult, GitTag } from './types';

/**
 * Options for retrieving commit history
 */
export interface GetHistoryOptions {
  maxCount?: number;
  skip?: number;
  branch?: string;
  file?: string;
  author?: string;
  since?: Date | string;
  until?: Date | string;
}

/**
 * Get commit history
 *
 * @param projectPath - Project directory path
 * @param options - History options
 * @returns List of commits
 */
export async function getHistory(
  projectPath: string,
  options: GetHistoryOptions = {}
): Promise<GitOperationResult<GitCommit[]>> {
  try {
    const git = getGitClient(projectPath);

    const logOptions: Record<string, unknown> = {
      format: {
        hash: '%H',
        author: '%an',
        email: '%ae',
        date: '%ai',
        message: '%s',
        body: '%b',
        refs: '%D',
      },
    };

    if (options.maxCount) {
      logOptions['--max-count'] = options.maxCount;
    }

    if (options.skip) {
      logOptions['--skip'] = options.skip;
    }

    if (options.author) {
      logOptions['--author'] = options.author;
    }

    if (options.since) {
      logOptions['--since'] =
        options.since instanceof Date
          ? options.since.toISOString()
          : options.since;
    }

    if (options.until) {
      logOptions['--until'] =
        options.until instanceof Date
          ? options.until.toISOString()
          : options.until;
    }

    let log;
    if (options.file) {
      log = await git.log({ ...logOptions, file: options.file });
    } else if (options.branch) {
      log = await git.log([options.branch, logOptions]);
    } else {
      log = await git.log(logOptions);
    }

    const commits: GitCommit[] = log.all.map((commit) => ({
      hash: commit.hash,
      author: commit.author_name,
      email: commit.author_email,
      date: new Date(commit.date),
      message: commit.message,
      body: commit.body || undefined,
      refs: commit.refs ? commit.refs.split(', ').filter(Boolean) : undefined,
    }));

    return {
      success: true,
      data: commits,
      message: 'History retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get history',
    };
  }
}

/**
 * Get commit by hash
 *
 * @param projectPath - Project directory path
 * @param hash - Commit hash
 * @returns Commit information
 */
export async function getCommit(
  projectPath: string,
  hash: string
): Promise<GitOperationResult<GitCommit | null>> {
  try {
    const git = getGitClient(projectPath);

    const log = await git.log({
      '--max-count': 1,
      format: {
        hash: '%H',
        author: '%an',
        email: '%ae',
        date: '%ai',
        message: '%s',
        body: '%b',
        refs: '%D',
      },
      [hash]: null,
    });

    if (log.all.length === 0) {
      return {
        success: true,
        data: null,
        message: 'Commit not found',
      };
    }

    const commit = log.all[0];
    const gitCommit: GitCommit = {
      hash: commit.hash,
      author: commit.author_name,
      email: commit.author_email,
      date: new Date(commit.date),
      message: commit.message,
      body: commit.body || undefined,
      refs: commit.refs ? commit.refs.split(', ').filter(Boolean) : undefined,
    };

    return {
      success: true,
      data: gitCommit,
      message: 'Commit retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get commit',
    };
  }
}

/**
 * Get file history
 *
 * @param projectPath - Project directory path
 * @param filePath - Path to the file
 * @param maxCount - Maximum number of commits to retrieve
 * @returns List of commits affecting the file
 */
export async function getFileHistory(
  projectPath: string,
  filePath: string,
  maxCount = 50
): Promise<GitOperationResult<GitCommit[]>> {
  return getHistory(projectPath, { file: filePath, maxCount });
}

/**
 * Get commits by author
 *
 * @param projectPath - Project directory path
 * @param author - Author name or email
 * @param maxCount - Maximum number of commits to retrieve
 * @returns List of commits by the author
 */
export async function getCommitsByAuthor(
  projectPath: string,
  author: string,
  maxCount = 50
): Promise<GitOperationResult<GitCommit[]>> {
  return getHistory(projectPath, { author, maxCount });
}

/**
 * Get commits in a date range
 *
 * @param projectPath - Project directory path
 * @param since - Start date
 * @param until - End date
 * @param maxCount - Maximum number of commits to retrieve
 * @returns List of commits in the date range
 */
export async function getCommitsInRange(
  projectPath: string,
  since: Date | string,
  until: Date | string,
  maxCount = 50
): Promise<GitOperationResult<GitCommit[]>> {
  return getHistory(projectPath, { since, until, maxCount });
}

/**
 * Get the latest commit
 *
 * @param projectPath - Project directory path
 * @param branch - Branch name (optional)
 * @returns Latest commit
 */
export async function getLatestCommit(
  projectPath: string,
  branch?: string
): Promise<GitOperationResult<GitCommit | null>> {
  const result = await getHistory(projectPath, { maxCount: 1, branch });

  if (!result.success || !result.data || result.data.length === 0) {
    return {
      success: result.success,
      data: null,
      error: result.error,
      message: result.message,
    };
  }

  return {
    success: true,
    data: result.data[0],
    message: 'Latest commit retrieved successfully',
  };
}

/**
 * Get commit count
 *
 * @param projectPath - Project directory path
 * @param branch - Branch name (optional)
 * @returns Number of commits
 */
export async function getCommitCount(
  projectPath: string,
  branch?: string
): Promise<GitOperationResult<number>> {
  try {
    const git = getGitClient(projectPath);

    const args = ['rev-list', '--count'];
    if (branch) {
      args.push(branch);
    } else {
      args.push('HEAD');
    }

    const count = await git.raw(args);

    return {
      success: true,
      data: parseInt(count.trim()),
      message: 'Commit count retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get commit count',
    };
  }
}

/**
 * Search commits by message
 *
 * @param projectPath - Project directory path
 * @param query - Search query
 * @param maxCount - Maximum number of commits to retrieve
 * @returns List of matching commits
 */
export async function searchCommits(
  projectPath: string,
  query: string,
  maxCount = 50
): Promise<GitOperationResult<GitCommit[]>> {
  try {
    const git = getGitClient(projectPath);

    const log = await git.log({
      '--max-count': maxCount,
      '--grep': query,
      format: {
        hash: '%H',
        author: '%an',
        email: '%ae',
        date: '%ai',
        message: '%s',
        body: '%b',
        refs: '%D',
      },
    });

    const commits: GitCommit[] = log.all.map((commit) => ({
      hash: commit.hash,
      author: commit.author_name,
      email: commit.author_email,
      date: new Date(commit.date),
      message: commit.message,
      body: commit.body || undefined,
      refs: commit.refs ? commit.refs.split(', ').filter(Boolean) : undefined,
    }));

    return {
      success: true,
      data: commits,
      message: 'Search completed successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to search commits',
    };
  }
}

/**
 * Get tags
 *
 * @param projectPath - Project directory path
 * @returns List of tags
 */
export async function getTags(
  projectPath: string
): Promise<GitOperationResult<GitTag[]>> {
  try {
    const git = getGitClient(projectPath);

    const tagList = await git.tags();

    const tags: GitTag[] = await Promise.all(
      tagList.all.map(async (tagName) => {
        try {
          const tagInfo = await git.raw([
            'show',
            '-s',
            '--format=%H%n%an%n%ae%n%ai%n%s',
            tagName,
          ]);

          const [hash, taggerName, taggerEmail, date, message] =
            tagInfo.trim().split('\n');

          return {
            name: tagName,
            hash,
            taggerName,
            taggerEmail,
            date: new Date(date),
            message,
          };
        } catch {
          // If tag info retrieval fails, return basic info
          return {
            name: tagName,
            hash: '',
          };
        }
      })
    );

    return {
      success: true,
      data: tags,
      message: 'Tags retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get tags',
    };
  }
}

/**
 * Create a tag
 *
 * @param projectPath - Project directory path
 * @param name - Tag name
 * @param message - Tag message (optional, creates annotated tag)
 * @param commit - Commit hash (optional, defaults to HEAD)
 * @returns Operation result
 */
export async function createTag(
  projectPath: string,
  name: string,
  message?: string,
  commit?: string
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);

    const args = [name];
    if (commit) {
      args.push(commit);
    }

    if (message) {
      await git.addAnnotatedTag(name, message);
    } else {
      await git.addTag(name);
    }

    return {
      success: true,
      message: `Tag ${name} created successfully`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create tag',
    };
  }
}

/**
 * Delete a tag
 *
 * @param projectPath - Project directory path
 * @param name - Tag name
 * @returns Operation result
 */
export async function deleteTag(
  projectPath: string,
  name: string
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);
    await git.raw(['tag', '-d', name]);

    return {
      success: true,
      message: `Tag ${name} deleted successfully`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to delete tag',
    };
  }
}

/**
 * Get contributors
 *
 * @param projectPath - Project directory path
 * @returns List of contributors with commit counts
 */
export async function getContributors(
  projectPath: string
): Promise<
  GitOperationResult<
    Array<{ name: string; email: string; commits: number }>
  >
> {
  try {
    const git = getGitClient(projectPath);

    const output = await git.raw([
      'shortlog',
      '-sne',
      '--all',
      '--no-merges',
    ]);

    const contributors = output
      .trim()
      .split('\n')
      .map((line) => {
        const match = line.trim().match(/^(\d+)\s+(.+)\s+<(.+)>$/);
        if (match) {
          return {
            commits: parseInt(match[1]),
            name: match[2],
            email: match[3],
          };
        }
        return null;
      })
      .filter((c): c is { name: string; email: string; commits: number } => c !== null);

    return {
      success: true,
      data: contributors,
      message: 'Contributors retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get contributors',
    };
  }
}

export default {
  getHistory,
  getCommit,
  getFileHistory,
  getCommitsByAuthor,
  getCommitsInRange,
  getLatestCommit,
  getCommitCount,
  searchCommits,
  getTags,
  createTag,
  deleteTag,
  getContributors,
};
