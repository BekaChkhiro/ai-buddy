/**
 * Git Client Initialization
 *
 * This module provides functions to initialize and configure simple-git instances
 * for different project paths.
 */

import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import path from 'path';
import fs from 'fs/promises';

/**
 * Cache for git instances per project path
 */
const gitInstances = new Map<string, SimpleGit>();

/**
 * Default simple-git options
 */
const defaultOptions: Partial<SimpleGitOptions> = {
  binary: 'git',
  maxConcurrentProcesses: 6,
  trimmed: true,
};

/**
 * Initialize a Git client for a specific project path
 *
 * @param projectPath - Absolute path to the project directory
 * @param options - Additional simple-git options
 * @returns SimpleGit instance
 */
export function initGitClient(
  projectPath: string,
  options?: Partial<SimpleGitOptions>
): SimpleGit {
  const normalizedPath = path.resolve(projectPath);

  // Return cached instance if available
  if (gitInstances.has(normalizedPath)) {
    return gitInstances.get(normalizedPath)!;
  }

  // Create new instance
  const git = simpleGit({
    baseDir: normalizedPath,
    ...defaultOptions,
    ...options,
  });

  // Cache the instance
  gitInstances.set(normalizedPath, git);

  return git;
}

/**
 * Get an existing Git client or create a new one
 *
 * @param projectPath - Absolute path to the project directory
 * @returns SimpleGit instance
 */
export function getGitClient(projectPath: string): SimpleGit {
  const normalizedPath = path.resolve(projectPath);
  return gitInstances.get(normalizedPath) || initGitClient(normalizedPath);
}

/**
 * Clear cached Git client for a specific path
 *
 * @param projectPath - Absolute path to the project directory
 */
export function clearGitClient(projectPath: string): void {
  const normalizedPath = path.resolve(projectPath);
  gitInstances.delete(normalizedPath);
}

/**
 * Clear all cached Git clients
 */
export function clearAllGitClients(): void {
  gitInstances.clear();
}

/**
 * Check if a directory is a Git repository
 *
 * @param projectPath - Absolute path to the project directory
 * @returns True if the directory is a Git repository
 */
export async function isGitRepository(projectPath: string): Promise<boolean> {
  try {
    const git = getGitClient(projectPath);
    await git.status();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Initialize a new Git repository
 *
 * @param projectPath - Absolute path to the project directory
 * @param bare - Create a bare repository
 * @returns True if initialization was successful
 */
export async function initGitRepository(
  projectPath: string,
  bare = false
): Promise<boolean> {
  try {
    const git = getGitClient(projectPath);
    await git.init(bare);
    return true;
  } catch (error) {
    console.error('Failed to initialize Git repository:', error);
    return false;
  }
}

/**
 * Check if Git is installed and available
 *
 * @returns True if Git is available
 */
export async function isGitAvailable(): Promise<boolean> {
  try {
    const tempDir = await fs.mkdtemp('/tmp/git-check-');
    const git = simpleGit({ baseDir: tempDir });
    await git.version();
    await fs.rm(tempDir, { recursive: true });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get Git version information
 *
 * @returns Git version string or null if not available
 */
export async function getGitVersion(): Promise<string | null> {
  try {
    const tempDir = await fs.mkdtemp('/tmp/git-check-');
    const git = simpleGit({ baseDir: tempDir });
    const version = await git.version();
    await fs.rm(tempDir, { recursive: true });
    return version.major ? `${version.major}.${version.minor}.${version.patch}` : null;
  } catch (error) {
    return null;
  }
}

/**
 * Clone a Git repository
 *
 * @param url - Repository URL
 * @param targetPath - Target directory path
 * @param options - Clone options
 * @returns True if clone was successful
 */
export async function cloneRepository(
  url: string,
  targetPath: string,
  options?: {
    branch?: string;
    depth?: number;
    single?: boolean;
  }
): Promise<boolean> {
  try {
    const parentDir = path.dirname(targetPath);
    const git = simpleGit({ baseDir: parentDir });

    const cloneOptions: string[] = [];
    if (options?.branch) {
      cloneOptions.push('--branch', options.branch);
    }
    if (options?.depth) {
      cloneOptions.push('--depth', options.depth.toString());
    }
    if (options?.single) {
      cloneOptions.push('--single-branch');
    }

    await git.clone(url, targetPath, cloneOptions);
    return true;
  } catch (error) {
    console.error('Failed to clone repository:', error);
    return false;
  }
}

/**
 * Get the root directory of a Git repository
 *
 * @param projectPath - Any path within the repository
 * @returns Root directory path or null if not a Git repository
 */
export async function getGitRoot(projectPath: string): Promise<string | null> {
  try {
    const git = getGitClient(projectPath);
    const root = await git.revparse(['--show-toplevel']);
    return root.trim();
  } catch (error) {
    return null;
  }
}

/**
 * Get the .git directory path
 *
 * @param projectPath - Any path within the repository
 * @returns .git directory path or null if not a Git repository
 */
export async function getGitDir(projectPath: string): Promise<string | null> {
  try {
    const git = getGitClient(projectPath);
    const gitDir = await git.revparse(['--git-dir']);
    return path.resolve(projectPath, gitDir.trim());
  } catch (error) {
    return null;
  }
}

export default {
  initGitClient,
  getGitClient,
  clearGitClient,
  clearAllGitClients,
  isGitRepository,
  initGitRepository,
  isGitAvailable,
  getGitVersion,
  cloneRepository,
  getGitRoot,
  getGitDir,
};
