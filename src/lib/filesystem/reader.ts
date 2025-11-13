/**
 * Safe File Reader
 * Secure file reading with size limits and validation
 */

import fs from "fs/promises";
import path from "path";
import { fileTypeFromFile } from "file-type";
import mime from "mime-types";
import { validatePathOrThrow } from "./validator";
import { ReadFileOptions, FileInfo, NotFoundError, SizeLimitError } from "./types";
import {
  MAX_FILE_SIZE,
  DEFAULT_ENCODING,
  TEXT_FILE_EXTENSIONS,
  BINARY_FILE_EXTENSIONS,
} from "./constants";

/**
 * Safely read a file with size validation and security checks
 *
 * @param projectPath - The root project directory
 * @param filePath - The file path relative to project root
 * @param options - Read options
 * @returns File content as string
 * @throws ValidationError if path is invalid
 * @throws PermissionError if access is forbidden
 * @throws NotFoundError if file doesn't exist
 * @throws SizeLimitError if file exceeds size limit
 */
export async function readFile(
  projectPath: string,
  filePath: string,
  options: ReadFileOptions = {}
): Promise<string> {
  const { encoding = DEFAULT_ENCODING, maxSize = MAX_FILE_SIZE } = options;

  // Validate path
  const absolutePath = await validatePathOrThrow(projectPath, filePath);

  // Check if file exists
  let stats;
  try {
    stats = await fs.stat(absolutePath);
  } catch (error: any) {
    if (error.code === "ENOENT") {
      throw new NotFoundError(`File not found: ${filePath}`);
    }
    throw error;
  }

  // Check if it's a file
  if (!stats.isFile()) {
    throw new NotFoundError(`Path is not a file: ${filePath}`);
  }

  // Check file size
  if (stats.size > maxSize) {
    throw new SizeLimitError(
      `File size (${formatBytes(stats.size)}) exceeds limit (${formatBytes(maxSize)})`,
      { size: stats.size, limit: maxSize }
    );
  }

  // Read file content
  try {
    const content = await fs.readFile(absolutePath, { encoding });
    return content;
  } catch (error: any) {
    if (error.code === "EACCES") {
      throw new NotFoundError(`Permission denied: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Get comprehensive file information
 *
 * @param projectPath - The root project directory
 * @param filePath - The file path relative to project root
 * @returns File information
 */
export async function getFileInfo(projectPath: string, filePath: string): Promise<FileInfo> {
  const absolutePath = await validatePathOrThrow(projectPath, filePath);

  let stats;
  try {
    stats = await fs.stat(absolutePath);
  } catch (error: any) {
    if (error.code === "ENOENT") {
      throw new NotFoundError(`File not found: ${filePath}`);
    }
    throw error;
  }

  const extension = path.extname(filePath).toLowerCase();
  const mimeType = mime.lookup(filePath) || undefined;
  const isText = await isTextFile(absolutePath);

  return {
    exists: true,
    isFile: stats.isFile(),
    isDirectory: stats.isDirectory(),
    size: stats.size,
    extension,
    mimeType,
    modifiedAt: stats.mtime,
    createdAt: stats.birthtime,
    isText,
    isBinary: !isText,
  };
}

/**
 * Check if a file is a text file
 *
 * @param filePath - Absolute path to the file
 * @returns true if file is text
 */
export async function isTextFile(filePath: string): Promise<boolean> {
  const extension = path.extname(filePath).toLowerCase();

  // Check extension first (fast path)
  if (TEXT_FILE_EXTENSIONS.has(extension)) {
    return true;
  }

  if (BINARY_FILE_EXTENSIONS.has(extension)) {
    return false;
  }

  // For unknown extensions, check file content
  try {
    const fileType = await fileTypeFromFile(filePath);

    // If file-type can detect it, it's likely binary
    if (fileType) {
      return false;
    }

    // No known binary signature, likely text
    return true;
  } catch (error) {
    // If we can't determine, assume text
    return true;
  }
}

/**
 * Get file size
 *
 * @param projectPath - The root project directory
 * @param filePath - The file path relative to project root
 * @returns File size in bytes
 */
export async function getFileSize(projectPath: string, filePath: string): Promise<number> {
  const absolutePath = await validatePathOrThrow(projectPath, filePath);

  try {
    const stats = await fs.stat(absolutePath);
    return stats.size;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      throw new NotFoundError(`File not found: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Check if file exists
 *
 * @param projectPath - The root project directory
 * @param filePath - The file path relative to project root
 * @returns true if file exists
 */
export async function fileExists(projectPath: string, filePath: string): Promise<boolean> {
  try {
    const absolutePath = await validatePathOrThrow(projectPath, filePath);
    await fs.access(absolutePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Read multiple files in parallel
 *
 * @param projectPath - The root project directory
 * @param filePaths - Array of file paths relative to project root
 * @param options - Read options
 * @returns Array of file contents
 */
export async function readFiles(
  projectPath: string,
  filePaths: string[],
  options: ReadFileOptions = {}
): Promise<Array<{ path: string; content: string; error?: string }>> {
  const results = await Promise.allSettled(
    filePaths.map(async (filePath) => {
      const content = await readFile(projectPath, filePath, options);
      return { path: filePath, content };
    })
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      return {
        path: filePaths[index]!,
        content: "",
        error: result.reason.message || "Failed to read file",
      };
    }
  });
}

/**
 * Get MIME type for a file
 *
 * @param filePath - File path
 * @returns MIME type or undefined
 */
export function getMimeType(filePath: string): string | undefined {
  return mime.lookup(filePath) || undefined;
}

/**
 * Format bytes to human-readable string
 *
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Check if file is within size limit
 *
 * @param projectPath - The root project directory
 * @param filePath - The file path relative to project root
 * @param maxSize - Maximum size in bytes
 * @returns true if file is within limit
 */
export async function isWithinSizeLimit(
  projectPath: string,
  filePath: string,
  maxSize: number = MAX_FILE_SIZE
): Promise<boolean> {
  try {
    const size = await getFileSize(projectPath, filePath);
    return size <= maxSize;
  } catch (error) {
    return false;
  }
}
