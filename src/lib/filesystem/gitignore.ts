/**
 * Git Ignore Parser
 * Parse and respect .gitignore rules when traversing directories
 */

import path from "path";
import fs from "fs/promises";
import ignore, { Ignore } from "ignore";
import { validatePathOrThrow } from "./validator";
import { EXCLUDED_PATTERNS } from "./constants";

/**
 * Cache for parsed .gitignore rules by project path
 */
const gitignoreCache = new Map<string, Ignore>();

/**
 * Create an ignore instance with .gitignore rules for a project
 *
 * @param projectPath - The root project directory
 * @returns Ignore instance with parsed rules
 */
export async function createIgnoreInstance(projectPath: string): Promise<Ignore> {
  // Check cache first
  if (gitignoreCache.has(projectPath)) {
    return gitignoreCache.get(projectPath)!;
  }

  const ig = ignore();

  // Add default excluded patterns
  ig.add(EXCLUDED_PATTERNS);

  // Try to read .gitignore file
  try {
    const gitignorePath = await validatePathOrThrow(projectPath, ".gitignore");
    const gitignoreContent = await fs.readFile(gitignorePath, "utf-8");

    // Parse and add .gitignore rules
    ig.add(gitignoreContent);
  } catch (error: any) {
    // .gitignore doesn't exist or can't be read - that's okay
    // We'll just use the default excluded patterns
  }

  // Cache the instance
  gitignoreCache.set(projectPath, ig);

  return ig;
}

/**
 * Check if a path should be ignored based on .gitignore rules
 *
 * @param projectPath - The root project directory
 * @param targetPath - The path to check (relative to project root)
 * @returns true if path should be ignored
 */
export async function shouldIgnore(projectPath: string, targetPath: string): Promise<boolean> {
  const ig = await createIgnoreInstance(projectPath);
  const relativePath = path.relative(projectPath, targetPath);

  // ignore library expects forward slashes
  const normalizedPath = relativePath.split(path.sep).join("/");

  return ig.ignores(normalizedPath);
}

/**
 * Filter an array of paths based on .gitignore rules
 *
 * @param projectPath - The root project directory
 * @param paths - Array of paths to filter
 * @returns Filtered array of paths that should not be ignored
 */
export async function filterIgnored(projectPath: string, paths: string[]): Promise<string[]> {
  const ig = await createIgnoreInstance(projectPath);

  return paths.filter((filePath) => {
    const relativePath = path.relative(projectPath, filePath);
    const normalizedPath = relativePath.split(path.sep).join("/");
    return !ig.ignores(normalizedPath);
  });
}

/**
 * Clear the gitignore cache for a project
 * Useful when .gitignore file changes
 *
 * @param projectPath - The root project directory
 */
export function clearGitignoreCache(projectPath?: string): void {
  if (projectPath) {
    gitignoreCache.delete(projectPath);
  } else {
    gitignoreCache.clear();
  }
}

/**
 * Check if a file path matches common patterns that should be ignored
 * This is a fast check that doesn't require reading .gitignore
 *
 * @param filePath - The file path to check
 * @returns true if path matches common ignore patterns
 */
export function matchesCommonIgnorePatterns(filePath: string): boolean {
  const fileName = path.basename(filePath);
  const pathSegments = filePath.split(path.sep);

  const commonPatterns = [
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    "out",
    ".cache",
    ".DS_Store",
    "Thumbs.db",
  ];

  return commonPatterns.some((pattern) => pathSegments.includes(pattern) || fileName === pattern);
}

/**
 * Parse .gitignore content and return patterns
 *
 * @param gitignoreContent - Content of .gitignore file
 * @returns Array of patterns
 */
export function parseGitignorePatterns(gitignoreContent: string): string[] {
  return gitignoreContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}
