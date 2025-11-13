/**
 * Git LFS (Large File Storage) Support
 *
 * This module provides utilities for working with Git LFS to handle large files.
 */

import fs from 'fs/promises';
import path from 'path';
import { getGitClient } from './client';
import type { GitLFSFile, GitLFSConfig, GitOperationResult } from './types';

/**
 * Default LFS configuration
 */
export const defaultLFSConfig: GitLFSConfig = {
  enabled: false,
  patterns: [
    '*.psd',
    '*.ai',
    '*.zip',
    '*.tar.gz',
    '*.mp4',
    '*.mov',
    '*.avi',
    '*.pdf',
    '*.dmg',
    '*.pkg',
    '*.exe',
    '*.dll',
  ],
  minFileSize: 1024 * 1024, // 1 MB
};

/**
 * Check if Git LFS is installed
 *
 * @returns True if Git LFS is installed
 */
export async function isLFSInstalled(): Promise<boolean> {
  try {
    const git = getGitClient(process.cwd());
    const result = await git.raw(['lfs', 'version']);
    return result.includes('git-lfs');
  } catch {
    return false;
  }
}

/**
 * Initialize Git LFS in a repository
 *
 * @param projectPath - Project directory path
 * @returns Operation result
 */
export async function initLFS(
  projectPath: string
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);
    await git.raw(['lfs', 'install']);

    return {
      success: true,
      message: 'Git LFS initialized successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to initialize Git LFS',
    };
  }
}

/**
 * Track files with Git LFS
 *
 * @param projectPath - Project directory path
 * @param patterns - File patterns to track
 * @returns Operation result
 */
export async function trackPatterns(
  projectPath: string,
  patterns: string[]
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);

    for (const pattern of patterns) {
      await git.raw(['lfs', 'track', pattern]);
    }

    return {
      success: true,
      message: `Tracking ${patterns.length} pattern(s) with Git LFS`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to track patterns with Git LFS',
    };
  }
}

/**
 * Untrack files from Git LFS
 *
 * @param projectPath - Project directory path
 * @param patterns - File patterns to untrack
 * @returns Operation result
 */
export async function untrackPatterns(
  projectPath: string,
  patterns: string[]
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);

    for (const pattern of patterns) {
      await git.raw(['lfs', 'untrack', pattern]);
    }

    return {
      success: true,
      message: `Untracked ${patterns.length} pattern(s) from Git LFS`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to untrack patterns from Git LFS',
    };
  }
}

/**
 * List tracked patterns
 *
 * @param projectPath - Project directory path
 * @returns List of tracked patterns
 */
export async function listTrackedPatterns(
  projectPath: string
): Promise<GitOperationResult<string[]>> {
  try {
    const git = getGitClient(projectPath);
    const result = await git.raw(['lfs', 'track']);

    // Parse output to extract patterns
    const patterns = result
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.includes('*'))
      .map((line) => {
        const match = line.match(/"([^"]+)"/);
        return match ? match[1] : null;
      })
      .filter((pattern): pattern is string => pattern !== null);

    return {
      success: true,
      data: patterns,
      message: 'Tracked patterns retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to list tracked patterns',
    };
  }
}

/**
 * List LFS files in the repository
 *
 * @param projectPath - Project directory path
 * @returns List of LFS files
 */
export async function listLFSFiles(
  projectPath: string
): Promise<GitOperationResult<GitLFSFile[]>> {
  try {
    const git = getGitClient(projectPath);
    const result = await git.raw(['lfs', 'ls-files', '-l']);

    const files: GitLFSFile[] = result
      .trim()
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        // Parse format: "oid size path"
        const parts = line.split(/\s+/);
        if (parts.length >= 3) {
          return {
            oid: parts[0],
            size: parseInt(parts[1]) || 0,
            path: parts.slice(2).join(' '),
            isLFS: true,
          };
        }
        return null;
      })
      .filter((file): file is GitLFSFile => file !== null);

    return {
      success: true,
      data: files,
      message: 'LFS files retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to list LFS files',
    };
  }
}

/**
 * Check if a file is tracked by LFS
 *
 * @param projectPath - Project directory path
 * @param filePath - Path to the file
 * @returns True if the file is tracked by LFS
 */
export async function isLFSFile(
  projectPath: string,
  filePath: string
): Promise<boolean> {
  try {
    const git = getGitClient(projectPath);
    const result = await git.raw(['check-attr', 'filter', filePath]);

    return result.includes('filter: lfs');
  } catch {
    return false;
  }
}

/**
 * Get file size
 *
 * @param filePath - Path to the file
 * @returns File size in bytes
 */
async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

/**
 * Check if a file should be tracked by LFS based on configuration
 *
 * @param projectPath - Project directory path
 * @param filePath - Path to the file
 * @param config - LFS configuration
 * @returns True if the file should be tracked by LFS
 */
export async function shouldTrackWithLFS(
  projectPath: string,
  filePath: string,
  config: GitLFSConfig
): Promise<boolean> {
  if (!config.enabled) {
    return false;
  }

  // Check if file matches any pattern
  const fileName = path.basename(filePath);
  const matchesPattern = config.patterns.some((pattern) => {
    const regex = new RegExp(
      pattern.replace(/\*/g, '.*').replace(/\?/g, '.')
    );
    return regex.test(fileName);
  });

  if (!matchesPattern) {
    return false;
  }

  // Check file size if minFileSize is set
  if (config.minFileSize) {
    const fullPath = path.join(projectPath, filePath);
    const size = await getFileSize(fullPath);
    return size >= config.minFileSize;
  }

  return true;
}

/**
 * Load LFS configuration
 *
 * @param projectPath - Project directory path
 * @returns LFS configuration
 */
export async function loadLFSConfig(
  projectPath: string
): Promise<GitLFSConfig> {
  try {
    const configPath = path.join(projectPath, '.aibuddy', 'lfs-config.json');
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);

    return {
      ...defaultLFSConfig,
      ...config,
    };
  } catch {
    return defaultLFSConfig;
  }
}

/**
 * Save LFS configuration
 *
 * @param projectPath - Project directory path
 * @param config - LFS configuration
 * @returns True if saved successfully
 */
export async function saveLFSConfig(
  projectPath: string,
  config: GitLFSConfig
): Promise<boolean> {
  try {
    const configDir = path.join(projectPath, '.aibuddy');
    await fs.mkdir(configDir, { recursive: true });

    const configPath = path.join(configDir, 'lfs-config.json');
    await fs.writeFile(
      configPath,
      JSON.stringify(config, null, 2),
      'utf-8'
    );

    return true;
  } catch (error) {
    console.error('Failed to save LFS config:', error);
    return false;
  }
}

/**
 * Migrate existing files to LFS
 *
 * @param projectPath - Project directory path
 * @param patterns - File patterns to migrate
 * @returns Operation result
 */
export async function migrateToLFS(
  projectPath: string,
  patterns: string[]
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);

    for (const pattern of patterns) {
      await git.raw(['lfs', 'migrate', 'import', '--include', pattern]);
    }

    return {
      success: true,
      message: `Migrated ${patterns.length} pattern(s) to Git LFS`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to migrate files to Git LFS',
    };
  }
}

/**
 * Fetch LFS files
 *
 * @param projectPath - Project directory path
 * @returns Operation result
 */
export async function fetchLFS(
  projectPath: string
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);
    await git.raw(['lfs', 'fetch']);

    return {
      success: true,
      message: 'LFS files fetched successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to fetch LFS files',
    };
  }
}

/**
 * Pull LFS files
 *
 * @param projectPath - Project directory path
 * @returns Operation result
 */
export async function pullLFS(
  projectPath: string
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);
    await git.raw(['lfs', 'pull']);

    return {
      success: true,
      message: 'LFS files pulled successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to pull LFS files',
    };
  }
}

/**
 * Prune LFS objects
 *
 * @param projectPath - Project directory path
 * @returns Operation result
 */
export async function pruneLFS(
  projectPath: string
): Promise<GitOperationResult<void>> {
  try {
    const git = getGitClient(projectPath);
    await git.raw(['lfs', 'prune']);

    return {
      success: true,
      message: 'LFS objects pruned successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to prune LFS objects',
    };
  }
}

export default {
  defaultLFSConfig,
  isLFSInstalled,
  initLFS,
  trackPatterns,
  untrackPatterns,
  listTrackedPatterns,
  listLFSFiles,
  isLFSFile,
  shouldTrackWithLFS,
  loadLFSConfig,
  saveLFSConfig,
  migrateToLFS,
  fetchLFS,
  pullLFS,
  pruneLFS,
};
