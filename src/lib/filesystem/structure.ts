/**
 * Directory Structure Reader
 * Get directory tree structure with .gitignore respect
 */

import fs from 'fs/promises'
import path from 'path'
import { validatePathOrThrow } from './validator'
import { shouldIgnore } from './gitignore'
import { getMimeType } from './reader'
import {
  FileNode,
  StructureOptions,
  DirectoryStats,
  NotFoundError,
} from './types'
import { MAX_DIRECTORY_DEPTH } from './constants'

/**
 * Get directory structure as a tree
 *
 * @param projectPath - The root project directory
 * @param relativePath - The relative path to start from (default: root)
 * @param options - Structure options
 * @returns Array of file nodes
 */
export async function getDirectoryStructure(
  projectPath: string,
  relativePath: string = '',
  options: StructureOptions = {}
): Promise<FileNode[]> {
  const {
    depth = MAX_DIRECTORY_DEPTH,
    includeHidden = false,
    respectGitignore = true,
    includeStats = true,
  } = options

  const absolutePath = await validatePathOrThrow(projectPath, relativePath)

  // Check if path exists and is a directory
  let stats
  try {
    stats = await fs.stat(absolutePath)
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new NotFoundError(`Directory not found: ${relativePath}`)
    }
    throw error
  }

  if (!stats.isDirectory()) {
    throw new NotFoundError(`Path is not a directory: ${relativePath}`)
  }

  return await buildDirectoryTree(
    projectPath,
    absolutePath,
    depth,
    includeHidden,
    respectGitignore,
    includeStats
  )
}

/**
 * Build directory tree recursively
 */
async function buildDirectoryTree(
  projectPath: string,
  currentPath: string,
  depth: number,
  includeHidden: boolean,
  respectGitignore: boolean,
  includeStats: boolean,
  currentDepth: number = 0
): Promise<FileNode[]> {
  if (currentDepth >= depth) {
    return []
  }

  let entries
  try {
    entries = await fs.readdir(currentPath, { withFileTypes: true })
  } catch (error: any) {
    // If we can't read the directory, return empty array
    return []
  }

  const nodes: FileNode[] = []

  for (const entry of entries) {
    const fullPath = path.join(currentPath, entry.name)
    const relativePath = path.relative(projectPath, fullPath)

    // Skip hidden files unless explicitly included
    if (!includeHidden && entry.name.startsWith('.')) {
      continue
    }

    // Check gitignore
    if (respectGitignore && await shouldIgnore(projectPath, fullPath)) {
      continue
    }

    const node: FileNode = {
      name: entry.name,
      path: fullPath,
      relativePath,
      type: entry.isDirectory() ? 'directory' : 'file',
    }

    // Add stats if requested
    if (includeStats) {
      try {
        const stats = await fs.stat(fullPath)
        node.modifiedAt = stats.mtime
        node.size = entry.isFile() ? stats.size : undefined

        if (entry.isFile()) {
          const extension = path.extname(entry.name).toLowerCase()
          node.extension = extension
          node.mimeType = getMimeType(entry.name)
        }
      } catch (error) {
        // Stats failed, skip them
      }
    }

    // Recursively get children for directories
    if (entry.isDirectory()) {
      try {
        node.children = await buildDirectoryTree(
          projectPath,
          fullPath,
          depth,
          includeHidden,
          respectGitignore,
          includeStats,
          currentDepth + 1
        )
      } catch (error) {
        // Failed to read subdirectory, set empty children
        node.children = []
      }
    }

    nodes.push(node)
  }

  // Sort: directories first, then files, alphabetically
  return nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })
}

/**
 * Get flat list of all files in a directory
 *
 * @param projectPath - The root project directory
 * @param relativePath - The relative path to start from
 * @param options - Structure options
 * @returns Array of file paths
 */
export async function listAllFiles(
  projectPath: string,
  relativePath: string = '',
  options: StructureOptions = {}
): Promise<string[]> {
  const structure = await getDirectoryStructure(projectPath, relativePath, options)
  const files: string[] = []

  function collectFiles(nodes: FileNode[]) {
    for (const node of nodes) {
      if (node.type === 'file') {
        files.push(node.relativePath)
      } else if (node.children) {
        collectFiles(node.children)
      }
    }
  }

  collectFiles(structure)
  return files
}

/**
 * Get directory statistics
 *
 * @param projectPath - The root project directory
 * @param relativePath - The relative path to analyze
 * @param options - Structure options
 * @returns Directory statistics
 */
export async function getDirectoryStats(
  projectPath: string,
  relativePath: string = '',
  options: StructureOptions = {}
): Promise<DirectoryStats> {
  const structure = await getDirectoryStructure(projectPath, relativePath, {
    ...options,
    includeStats: true,
  })

  const stats: DirectoryStats = {
    totalFiles: 0,
    totalDirectories: 0,
    totalSize: 0,
    fileTypes: {},
  }

  function collectStats(nodes: FileNode[]) {
    for (const node of nodes) {
      if (node.type === 'directory') {
        stats.totalDirectories++
        if (node.children) {
          collectStats(node.children)
        }
      } else {
        stats.totalFiles++
        stats.totalSize += node.size || 0

        const extension = node.extension || 'none'
        stats.fileTypes[extension] = (stats.fileTypes[extension] || 0) + 1
      }
    }
  }

  collectStats(structure)
  return stats
}

/**
 * Search for files by name pattern
 *
 * @param projectPath - The root project directory
 * @param pattern - Search pattern (supports wildcards)
 * @param options - Structure options
 * @returns Array of matching file paths
 */
export async function searchFiles(
  projectPath: string,
  pattern: string,
  options: StructureOptions = {}
): Promise<string[]> {
  const allFiles = await listAllFiles(projectPath, '', options)

  // Simple pattern matching (can be enhanced with more sophisticated matching)
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')

  const regex = new RegExp(regexPattern, 'i')

  return allFiles.filter(file => regex.test(path.basename(file)))
}

/**
 * Find files by extension
 *
 * @param projectPath - The root project directory
 * @param extensions - Array of extensions (e.g., ['.ts', '.tsx'])
 * @param options - Structure options
 * @returns Array of matching file paths
 */
export async function findFilesByExtension(
  projectPath: string,
  extensions: string[],
  options: StructureOptions = {}
): Promise<string[]> {
  const allFiles = await listAllFiles(projectPath, '', options)
  const extensionSet = new Set(extensions.map(ext => ext.toLowerCase()))

  return allFiles.filter(file => {
    const ext = path.extname(file).toLowerCase()
    return extensionSet.has(ext)
  })
}
