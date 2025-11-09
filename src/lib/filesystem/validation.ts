/**
 * File System Validation Schemas
 * Zod schemas for API request validation
 */

import { z } from 'zod'

/**
 * Schema for path validation request
 */
export const validatePathSchema = z.object({
  projectId: z.string().uuid(),
  folderPath: z.string().min(1),
})

/**
 * Schema for structure request
 */
export const getStructureSchema = z.object({
  projectId: z.string().uuid(),
  path: z.string().optional(),
  depth: z.number().int().min(1).max(10).optional(),
  includeHidden: z.boolean().optional(),
  respectGitignore: z.boolean().optional(),
})

/**
 * Schema for read file request
 */
export const readFileSchema = z.object({
  projectId: z.string().uuid(),
  filePath: z.string().min(1),
  encoding: z.enum(['utf-8', 'ascii', 'base64', 'binary']).optional(),
})

/**
 * Schema for write file request
 */
export const writeFileSchema = z.object({
  projectId: z.string().uuid(),
  filePath: z.string().min(1),
  content: z.string(),
  createBackup: z.boolean().optional(),
  createDirectories: z.boolean().optional(),
})

/**
 * Schema for watch request
 */
export const watchSchema = z.object({
  projectId: z.string().uuid(),
  path: z.string().optional(),
})
