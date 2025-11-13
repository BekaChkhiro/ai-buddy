/**
 * Safe File Writer
 * Secure file writing with backups and atomic operations
 */

import fs from "fs/promises";
import path from "path";
import { validatePathOrThrow } from "./validator";
import { WriteFileOptions, FileSystemError, SizeLimitError } from "./types";
import { MAX_FILE_SIZE, DEFAULT_ENCODING, BACKUP_EXTENSION } from "./constants";

/**
 * Safely write content to a file with atomic operation and optional backup
 *
 * @param projectPath - The root project directory
 * @param filePath - The file path relative to project root
 * @param content - Content to write
 * @param options - Write options
 * @returns Object with success status and backup path if created
 * @throws ValidationError if path is invalid
 * @throws PermissionError if access is forbidden
 * @throws SizeLimitError if content exceeds size limit
 */
export async function writeFile(
  projectPath: string,
  filePath: string,
  content: string,
  options: WriteFileOptions = {}
): Promise<{ success: boolean; backupPath?: string }> {
  const { encoding = DEFAULT_ENCODING, createBackup = true, createDirectories = true } = options;

  // Validate path
  const absolutePath = await validatePathOrThrow(projectPath, filePath);

  // Check content size
  const contentSize = Buffer.byteLength(content, encoding);
  if (contentSize > MAX_FILE_SIZE) {
    throw new SizeLimitError(
      `Content size exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`,
      { size: contentSize, limit: MAX_FILE_SIZE }
    );
  }

  let backupPath: string | undefined;

  try {
    // Create parent directories if needed
    if (createDirectories) {
      const dir = path.dirname(absolutePath);
      await fs.mkdir(dir, { recursive: true });
    }

    // Create backup if file exists and backup is requested
    if (createBackup) {
      try {
        await fs.access(absolutePath);
        // File exists, create backup
        backupPath = await createFileBackup(absolutePath);
      } catch (error: any) {
        // File doesn't exist, no backup needed
        if (error.code !== "ENOENT") {
          throw error;
        }
      }
    }

    // Atomic write: write to temp file, then rename
    const tempPath = `${absolutePath}.tmp.${Date.now()}`;

    try {
      // Write to temporary file
      await fs.writeFile(tempPath, content, { encoding });

      // Atomic rename
      await fs.rename(tempPath, absolutePath);

      return {
        success: true,
        backupPath,
      };
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(tempPath);
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  } catch (error) {
    // If write failed and we created a backup, restore it
    if (backupPath) {
      try {
        await restoreFileBackup(backupPath);
      } catch (restoreError) {
        // Log but don't throw - original error is more important
        console.error("Failed to restore backup:", restoreError);
      }
    }
    throw error;
  }
}

/**
 * Create a backup of a file
 *
 * @param filePath - Absolute path to the file
 * @returns Path to the backup file
 */
export async function createFileBackup(filePath: string): Promise<string> {
  const backupPath = `${filePath}${BACKUP_EXTENSION}`;

  try {
    await fs.copyFile(filePath, backupPath);
    return backupPath;
  } catch (error: any) {
    throw new FileSystemError(`Failed to create backup: ${error.message}`, "BACKUP_ERROR", error);
  }
}

/**
 * Restore a file from its backup
 *
 * @param backupPath - Path to the backup file
 */
export async function restoreFileBackup(backupPath: string): Promise<void> {
  if (!backupPath.endsWith(BACKUP_EXTENSION)) {
    throw new FileSystemError("Invalid backup file path", "INVALID_BACKUP");
  }

  const originalPath = backupPath.slice(0, -BACKUP_EXTENSION.length);

  try {
    await fs.copyFile(backupPath, originalPath);
  } catch (error: any) {
    throw new FileSystemError(`Failed to restore backup: ${error.message}`, "RESTORE_ERROR", error);
  }
}

/**
 * Delete a backup file
 *
 * @param backupPath - Path to the backup file
 */
export async function deleteFileBackup(backupPath: string): Promise<void> {
  if (!backupPath.endsWith(BACKUP_EXTENSION)) {
    throw new FileSystemError("Invalid backup file path", "INVALID_BACKUP");
  }

  try {
    await fs.unlink(backupPath);
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      throw new FileSystemError(
        `Failed to delete backup: ${error.message}`,
        "DELETE_BACKUP_ERROR",
        error
      );
    }
  }
}

/**
 * Create a directory safely
 *
 * @param projectPath - The root project directory
 * @param dirPath - The directory path relative to project root
 */
export async function createDirectory(projectPath: string, dirPath: string): Promise<void> {
  const absolutePath = await validatePathOrThrow(projectPath, dirPath);

  try {
    await fs.mkdir(absolutePath, { recursive: true });
  } catch (error: any) {
    throw new FileSystemError(
      `Failed to create directory: ${error.message}`,
      "CREATE_DIR_ERROR",
      error
    );
  }
}

/**
 * Delete a file safely
 *
 * @param projectPath - The root project directory
 * @param filePath - The file path relative to project root
 * @param createBackup - Whether to create a backup before deletion
 * @returns Backup path if created
 */
export async function deleteFile(
  projectPath: string,
  filePath: string,
  createBackup: boolean = true
): Promise<{ success: boolean; backupPath?: string }> {
  const absolutePath = await validatePathOrThrow(projectPath, filePath);

  let backupPath: string | undefined;

  try {
    // Create backup if requested
    if (createBackup) {
      try {
        backupPath = await createFileBackup(absolutePath);
      } catch (error: any) {
        // If file doesn't exist, nothing to delete
        if (error.code === "ENOENT") {
          return { success: true };
        }
        throw error;
      }
    }

    // Delete the file
    await fs.unlink(absolutePath);

    return {
      success: true,
      backupPath,
    };
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return { success: true };
    }
    throw new FileSystemError(`Failed to delete file: ${error.message}`, "DELETE_ERROR", error);
  }
}

/**
 * Append content to a file
 *
 * @param projectPath - The root project directory
 * @param filePath - The file path relative to project root
 * @param content - Content to append
 * @param options - Write options
 */
export async function appendToFile(
  projectPath: string,
  filePath: string,
  content: string,
  options: WriteFileOptions = {}
): Promise<void> {
  const { encoding = DEFAULT_ENCODING, createDirectories = true } = options;

  const absolutePath = await validatePathOrThrow(projectPath, filePath);

  try {
    // Create parent directories if needed
    if (createDirectories) {
      const dir = path.dirname(absolutePath);
      await fs.mkdir(dir, { recursive: true });
    }

    // Append to file
    await fs.appendFile(absolutePath, content, { encoding });
  } catch (error: any) {
    throw new FileSystemError(`Failed to append to file: ${error.message}`, "APPEND_ERROR", error);
  }
}

/**
 * Rename or move a file
 *
 * @param projectPath - The root project directory
 * @param oldPath - The current file path relative to project root
 * @param newPath - The new file path relative to project root
 */
export async function moveFile(
  projectPath: string,
  oldPath: string,
  newPath: string
): Promise<void> {
  const absoluteOldPath = await validatePathOrThrow(projectPath, oldPath);
  const absoluteNewPath = await validatePathOrThrow(projectPath, newPath);

  try {
    // Create parent directory for new path if needed
    const newDir = path.dirname(absoluteNewPath);
    await fs.mkdir(newDir, { recursive: true });

    // Move the file
    await fs.rename(absoluteOldPath, absoluteNewPath);
  } catch (error: any) {
    throw new FileSystemError(`Failed to move file: ${error.message}`, "MOVE_ERROR", error);
  }
}

/**
 * Copy a file
 *
 * @param projectPath - The root project directory
 * @param sourcePath - The source file path relative to project root
 * @param destPath - The destination file path relative to project root
 */
export async function copyFile(
  projectPath: string,
  sourcePath: string,
  destPath: string
): Promise<void> {
  const absoluteSourcePath = await validatePathOrThrow(projectPath, sourcePath);
  const absoluteDestPath = await validatePathOrThrow(projectPath, destPath);

  try {
    // Create parent directory for destination if needed
    const destDir = path.dirname(absoluteDestPath);
    await fs.mkdir(destDir, { recursive: true });

    // Copy the file
    await fs.copyFile(absoluteSourcePath, absoluteDestPath);
  } catch (error: any) {
    throw new FileSystemError(`Failed to copy file: ${error.message}`, "COPY_ERROR", error);
  }
}
