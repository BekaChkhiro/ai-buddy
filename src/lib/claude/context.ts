/**
 * Claude Context Builder
 * Build context from project files and data
 */

import { ChatContext } from "./types";
import {
  MAX_CONTEXT_FILES,
  MAX_CONTEXT_FILE_SIZE,
  MAX_TOTAL_CONTEXT_SIZE,
  estimateTokens,
} from "./config";
import { readFile, isTextFile, getFileSize } from "@/lib/filesystem/reader";
import { getProjectById, getProjectTasks } from "@/lib/supabase/queries";
import { SupabaseClient } from "@supabase/supabase-js";
import path from "path";

/**
 * Build chat context from project and optional file paths
 */
export async function buildChatContext(
  supabase: SupabaseClient,
  projectId: string,
  contextFiles?: string[]
): Promise<ChatContext> {
  // Get project details
  const project = await getProjectById(supabase, projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  const context: ChatContext = {
    projectId: project.id,
    projectName: project.name,
    projectDescription: project.description || undefined,
    techStack: project.techStack,
    folderPath: project.folderPath || undefined,
  };

  // Get recent tasks
  try {
    const tasks = await getProjectTasks(
      supabase,
      projectId,
      {},
      {
        field: "updated_at",
        direction: "desc",
      }
    );

    context.recentTasks = tasks.slice(0, 10).map((task) => ({
      title: task.title,
      status: task.status,
      description: task.description || undefined,
    }));
  } catch (error) {
    console.error("Error fetching tasks for context:", error);
  }

  // Include relevant files if specified and project has folder path
  if (contextFiles && contextFiles.length > 0 && project.folderPath) {
    context.relevantFiles = await loadContextFiles(project.folderPath, contextFiles);
  }

  return context;
}

/**
 * Load context files with size and count limits
 */
async function loadContextFiles(
  projectPath: string,
  filePaths: string[]
): Promise<Array<{ path: string; content: string; language?: string }>> {
  const files: Array<{ path: string; content: string; language?: string }> = [];
  let totalSize = 0;

  // Limit number of files
  const limitedPaths = filePaths.slice(0, MAX_CONTEXT_FILES);

  for (const filePath of limitedPaths) {
    try {
      // Check file size
      const size = await getFileSize(projectPath, filePath);

      if (size > MAX_CONTEXT_FILE_SIZE) {
        console.warn(`Skipping ${filePath}: file too large (${size} bytes)`);
        continue;
      }

      // Check total size limit
      if (totalSize + size > MAX_TOTAL_CONTEXT_SIZE) {
        console.warn("Total context size limit reached");
        break;
      }

      // Check if file is text
      const absolutePath = path.join(projectPath, filePath);
      const isText = await isTextFile(absolutePath);

      if (!isText) {
        console.warn(`Skipping ${filePath}: not a text file`);
        continue;
      }

      // Read file content
      const content = await readFile(projectPath, filePath);

      // Determine language from extension
      const ext = path.extname(filePath).toLowerCase();
      const language = getLanguageFromExtension(ext);

      files.push({
        path: filePath,
        content: content.trim(),
        language,
      });

      totalSize += size;
    } catch (error) {
      console.error(`Error loading context file ${filePath}:`, error);
    }
  }

  return files;
}

/**
 * Get programming language from file extension
 */
function getLanguageFromExtension(ext: string): string | undefined {
  const languageMap: Record<string, string> = {
    ".ts": "typescript",
    ".tsx": "tsx",
    ".js": "javascript",
    ".jsx": "jsx",
    ".py": "python",
    ".java": "java",
    ".c": "c",
    ".cpp": "cpp",
    ".cs": "csharp",
    ".go": "go",
    ".rs": "rust",
    ".php": "php",
    ".rb": "ruby",
    ".swift": "swift",
    ".kt": "kotlin",
    ".scala": "scala",
    ".html": "html",
    ".css": "css",
    ".scss": "scss",
    ".json": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".md": "markdown",
    ".sql": "sql",
    ".sh": "bash",
    ".bash": "bash",
    ".zsh": "zsh",
  };

  return languageMap[ext];
}

/**
 * Estimate total tokens in context
 */
export function estimateContextTokens(context: ChatContext): number {
  let totalTokens = 0;

  // Estimate from project metadata
  totalTokens += estimateTokens(context.projectName);
  if (context.projectDescription) {
    totalTokens += estimateTokens(context.projectDescription);
  }
  totalTokens += estimateTokens(context.techStack.join(", "));

  // Estimate from tasks
  if (context.recentTasks) {
    context.recentTasks.forEach((task) => {
      totalTokens += estimateTokens(task.title);
      if (task.description) {
        totalTokens += estimateTokens(task.description);
      }
    });
  }

  // Estimate from files
  if (context.relevantFiles) {
    context.relevantFiles.forEach((file) => {
      totalTokens += estimateTokens(file.path);
      totalTokens += estimateTokens(file.content);
    });
  }

  return totalTokens;
}

/**
 * Get suggested context files based on project structure
 * Returns files that are likely to be relevant (config, main files, etc.)
 */
export function getSuggestedContextFiles(_projectPath: string, maxFiles: number = 5): string[] {
  const suggestedFiles = [
    "package.json",
    "tsconfig.json",
    "README.md",
    "src/index.ts",
    "src/main.ts",
    "src/app.ts",
    "src/types/index.ts",
    "src/lib/config.ts",
  ];

  return suggestedFiles.slice(0, maxFiles);
}
