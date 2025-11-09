/**
 * File System Types
 * TypeScript types and interfaces for file system operations
 */

/**
 * File node in directory tree structure
 */
export interface FileNode {
  name: string
  path: string
  relativePath: string
  type: 'file' | 'directory'
  size?: number
  extension?: string
  mimeType?: string
  modifiedAt?: Date
  children?: FileNode[]
}

/**
 * Options for reading files
 */
export interface ReadFileOptions {
  encoding?: BufferEncoding
  maxSize?: number
}

/**
 * Options for writing files
 */
export interface WriteFileOptions {
  encoding?: BufferEncoding
  createBackup?: boolean
  createDirectories?: boolean
}

/**
 * Options for getting directory structure
 */
export interface StructureOptions {
  depth?: number
  includeHidden?: boolean
  respectGitignore?: boolean
  includeStats?: boolean
}

/**
 * Options for file watcher
 */
export interface WatcherOptions {
  ignored?: string[]
  respectGitignore?: boolean
  debounceMs?: number
}

/**
 * File change event
 */
export interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir'
  path: string
  relativePath: string
  timestamp: number
  stats?: {
    size: number
    modifiedAt: Date
  }
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  normalizedPath?: string
  error?: string
  reason?: string
}

/**
 * File info result
 */
export interface FileInfo {
  exists: boolean
  isFile: boolean
  isDirectory: boolean
  size: number
  mimeType?: string
  extension?: string
  modifiedAt: Date
  createdAt: Date
  isText: boolean
  isBinary: boolean
}

/**
 * Directory stats
 */
export interface DirectoryStats {
  totalFiles: number
  totalDirectories: number
  totalSize: number
  fileTypes: Record<string, number>
}

/**
 * Base file system error
 */
export class FileSystemError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'FileSystemError'
  }
}

/**
 * Validation error
 */
export class ValidationError extends FileSystemError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

/**
 * Permission error
 */
export class PermissionError extends FileSystemError {
  constructor(message: string, details?: any) {
    super(message, 'PERMISSION_ERROR', details)
    this.name = 'PermissionError'
  }
}

/**
 * Size limit error
 */
export class SizeLimitError extends FileSystemError {
  constructor(message: string, details?: any) {
    super(message, 'SIZE_LIMIT_ERROR', details)
    this.name = 'SizeLimitError'
  }
}

/**
 * Not found error
 */
export class NotFoundError extends FileSystemError {
  constructor(message: string, details?: any) {
    super(message, 'NOT_FOUND_ERROR', details)
    this.name = 'NotFoundError'
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends FileSystemError {
  constructor(message: string, details?: any) {
    super(message, 'RATE_LIMIT_ERROR', details)
    this.name = 'RateLimitError'
  }
}
