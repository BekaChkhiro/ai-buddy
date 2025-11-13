/**
 * File System Path Validator
 * SECURITY CRITICAL: Prevents directory traversal and unauthorized access
 */

import path from "path";
import fs from "fs/promises";
import { ValidationError, PermissionError, ValidationResult } from "./types";
import { BLOCKED_PATTERNS } from "./constants";

/**
 * Validate that a path is safe and within project boundaries
 * This is the primary security function that prevents directory traversal attacks
 *
 * @param projectPath - The root project directory path
 * @param targetPath - The target file/directory path to validate
 * @returns ValidationResult with normalized path if valid
 * @throws ValidationError if path is invalid
 * @throws PermissionError if path accesses blocked resources
 */
export async function validatePath(
  projectPath: string,
  targetPath: string
): Promise<ValidationResult> {
  try {
    // Normalize and resolve both paths
    const normalizedProjectPath = path.resolve(projectPath);
    const normalizedTargetPath = path.resolve(projectPath, targetPath);

    // SECURITY CHECK 1: Ensure target path is within project boundaries
    if (
      !normalizedTargetPath.startsWith(normalizedProjectPath + path.sep) &&
      normalizedTargetPath !== normalizedProjectPath
    ) {
      return {
        valid: false,
        error: "Path is outside project boundaries",
        reason: "OUTSIDE_PROJECT",
      };
    }

    // SECURITY CHECK 2: Check for blocked patterns
    const relativePath = path.relative(normalizedProjectPath, normalizedTargetPath);
    if (isBlockedPath(relativePath)) {
      return {
        valid: false,
        error: "Access to this path is forbidden",
        reason: "BLOCKED_PATTERN",
      };
    }

    // SECURITY CHECK 3: Ensure no symlink escapes project boundaries
    try {
      const realPath = await fs.realpath(normalizedTargetPath);
      if (
        !realPath.startsWith(normalizedProjectPath + path.sep) &&
        realPath !== normalizedProjectPath
      ) {
        return {
          valid: false,
          error: "Symbolic link points outside project boundaries",
          reason: "SYMLINK_ESCAPE",
        };
      }
    } catch (error: any) {
      // File doesn't exist yet - that's okay for write operations
      if (error.code !== "ENOENT") {
        throw error;
      }
    }

    return {
      valid: true,
      normalizedPath: normalizedTargetPath,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Validation failed",
      reason: "VALIDATION_ERROR",
    };
  }
}

/**
 * Validate path and throw error if invalid
 * Convenience wrapper around validatePath that throws on failure
 *
 * @param projectPath - The root project directory path
 * @param targetPath - The target file/directory path to validate
 * @returns Normalized path if valid
 * @throws ValidationError or PermissionError if invalid
 */
export async function validatePathOrThrow(
  projectPath: string,
  targetPath: string
): Promise<string> {
  const result = await validatePath(projectPath, targetPath);

  if (!result.valid) {
    if (result.reason === "BLOCKED_PATTERN") {
      throw new PermissionError(result.error || "Access forbidden", {
        path: targetPath,
        reason: result.reason,
      });
    }
    throw new ValidationError(result.error || "Invalid path", {
      path: targetPath,
      reason: result.reason,
    });
  }

  return result.normalizedPath!;
}

/**
 * Check if a path matches any blocked patterns
 *
 * @param relativePath - Path relative to project root
 * @returns true if path should be blocked
 */
export function isBlockedPath(relativePath: string): boolean {
  const pathSegments = relativePath.split(path.sep);
  const fileName = path.basename(relativePath);

  // Check each path segment and the full path against blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    // Exact match
    if (pathSegments.includes(pattern) || fileName === pattern) {
      return true;
    }

    // Wildcard match (simple implementation)
    if (pattern.includes("*")) {
      const regexPattern = pattern.replace(/\./g, "\\.").replace(/\*/g, ".*");
      const regex = new RegExp(`^${regexPattern}$`);

      if (regex.test(relativePath) || regex.test(fileName)) {
        return true;
      }
    }

    // Extension match
    if (pattern.startsWith("*.") && fileName.endsWith(pattern.substring(1))) {
      return true;
    }
  }

  return false;
}

/**
 * Validate that a project folder path exists and is accessible
 *
 * @param folderPath - The folder path to validate
 * @returns ValidationResult
 */
export async function validateProjectFolder(folderPath: string): Promise<ValidationResult> {
  try {
    const normalizedPath = path.resolve(folderPath);

    // Check if path exists
    try {
      const stats = await fs.stat(normalizedPath);

      if (!stats.isDirectory()) {
        return {
          valid: false,
          error: "Path is not a directory",
          reason: "NOT_DIRECTORY",
        };
      }
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return {
          valid: false,
          error: "Directory does not exist",
          reason: "NOT_FOUND",
        };
      }
      if (error.code === "EACCES") {
        return {
          valid: false,
          error: "Permission denied",
          reason: "PERMISSION_DENIED",
        };
      }
      throw error;
    }

    // Check if we can read the directory
    try {
      await fs.access(normalizedPath, fs.constants.R_OK);
    } catch (error) {
      return {
        valid: false,
        error: "Directory is not readable",
        reason: "NOT_READABLE",
      };
    }

    return {
      valid: true,
      normalizedPath,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Validation failed",
      reason: "VALIDATION_ERROR",
    };
  }
}

/**
 * Sanitize a file path by removing potentially dangerous characters
 * This is a defense-in-depth measure
 *
 * @param filePath - The file path to sanitize
 * @returns Sanitized path
 */
export function sanitizePath(filePath: string): string {
  return (
    filePath
      // Remove null bytes
      .replace(/\0/g, "")
      // Remove leading dots that could be used for traversal
      .replace(/^\.*\//, "")
      // Normalize path separators
      .split(/[/\\]/)
      .join(path.sep)
  );
}

/**
 * Get safe relative path from project root
 * Ensures the path is relative and doesn't contain traversal attempts
 *
 * @param projectPath - The root project directory
 * @param targetPath - The target path
 * @returns Relative path from project root
 */
export function getSafeRelativePath(projectPath: string, targetPath: string): string {
  const normalizedProject = path.resolve(projectPath);
  const normalizedTarget = path.resolve(targetPath);

  let relativePath = path.relative(normalizedProject, normalizedTarget);

  // If relative path starts with .., it's outside the project
  if (relativePath.startsWith("..")) {
    throw new ValidationError("Path is outside project boundaries");
  }

  return relativePath;
}

/**
 * Check if a file extension is allowed
 * This is a whitelist approach for certain operations
 *
 * @param fileName - The file name to check
 * @param allowedExtensions - Set of allowed extensions (e.g., new Set(['.txt', '.md']))
 * @returns true if extension is allowed
 */
export function hasAllowedExtension(fileName: string, allowedExtensions: Set<string>): boolean {
  const ext = path.extname(fileName).toLowerCase();
  return allowedExtensions.has(ext);
}

/**
 * Validate file name doesn't contain dangerous characters
 *
 * @param fileName - The file name to validate
 * @returns true if file name is safe
 */
export function isValidFileName(fileName: string): boolean {
  // File name should not be empty
  if (!fileName || fileName.trim() === "") {
    return false;
  }

  // Should not contain path separators
  if (fileName.includes("/") || fileName.includes("\\")) {
    return false;
  }

  // Should not be . or ..
  if (fileName === "." || fileName === "..") {
    return false;
  }

  // Should not contain null bytes
  if (fileName.includes("\0")) {
    return false;
  }

  // Should not contain control characters
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f\x7f]/.test(fileName)) {
    return false;
  }

  return true;
}
