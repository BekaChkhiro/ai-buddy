/**
 * Rollback System
 * Handles reverting changes on implementation failure
 */

import { promises as fs } from "fs";
import { join, dirname } from "path";
import { FileChange, RollbackError } from "./types";

export class RollbackManager {
  private changes: FileChange[] = [];
  private backupDir: string;

  constructor(projectPath: string, taskId: string) {
    this.backupDir = join(projectPath, ".ai-buddy", "backups", taskId);
  }

  /**
   * Initialize backup directory
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.backupDir, { recursive: true });
  }

  /**
   * Record a file change for potential rollback
   */
  async recordChange(change: FileChange): Promise<void> {
    this.changes.push(change);

    // Create backup for modify/delete operations
    if (
      change.changeType !== "create" &&
      change.originalContent !== undefined
    ) {
      const backupPath = join(
        this.backupDir,
        change.path.replace(/\//g, "_"),
      );
      await fs.writeFile(backupPath, change.originalContent, "utf-8");
    }
  }

  /**
   * Get all recorded changes
   */
  getChanges(): FileChange[] {
    return [...this.changes];
  }

  /**
   * Check if there are any changes to rollback
   */
  hasChanges(): boolean {
    return this.changes.length > 0;
  }

  /**
   * Rollback all changes
   */
  async rollbackAll(projectPath: string): Promise<void> {
    const failedChanges: FileChange[] = [];

    // Rollback in reverse order
    for (let i = this.changes.length - 1; i >= 0; i--) {
      const change = this.changes[i];
      try {
        await this.rollbackChange(change, projectPath);
      } catch (error) {
        console.error(`Failed to rollback change for ${change.path}:`, error);
        failedChanges.push(change);
      }
    }

    if (failedChanges.length > 0) {
      throw new RollbackError(
        `Failed to rollback ${failedChanges.length} changes`,
        failedChanges,
      );
    }

    // Clear changes after successful rollback
    this.changes = [];
  }

  /**
   * Rollback a single change
   */
  private async rollbackChange(
    change: FileChange,
    projectPath: string,
  ): Promise<void> {
    const filePath = join(projectPath, change.path);

    switch (change.changeType) {
      case "create":
        // Delete the created file
        try {
          await fs.unlink(filePath);
        } catch (error: any) {
          if (error.code !== "ENOENT") {
            throw error;
          }
        }
        break;

      case "modify":
        // Restore original content
        if (change.originalContent !== undefined) {
          await fs.writeFile(filePath, change.originalContent, "utf-8");
        }
        break;

      case "delete":
        // Restore deleted file
        if (change.originalContent !== undefined) {
          const dir = dirname(filePath);
          await fs.mkdir(dir, { recursive: true });
          await fs.writeFile(filePath, change.originalContent, "utf-8");
        }
        break;
    }
  }

  /**
   * Create a snapshot of a file before modification
   */
  async createSnapshot(
    filePath: string,
    projectPath: string,
  ): Promise<string | undefined> {
    try {
      const fullPath = join(projectPath, filePath);
      const content = await fs.readFile(fullPath, "utf-8");
      return content;
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return undefined; // File doesn't exist
      }
      throw error;
    }
  }

  /**
   * Cleanup backup directory
   */
  async cleanup(): Promise<void> {
    try {
      await fs.rm(this.backupDir, { recursive: true, force: true });
    } catch (error) {
      console.error("Failed to cleanup backup directory:", error);
    }
  }

  /**
   * Get backup directory path
   */
  getBackupDir(): string {
    return this.backupDir;
  }

  /**
   * Export changes for persistence
   */
  exportChanges(): FileChange[] {
    return this.changes.map((change) => ({ ...change }));
  }

  /**
   * Import changes from persistence
   */
  importChanges(changes: FileChange[]): void {
    this.changes = changes.map((change) => ({ ...change }));
  }
}

/**
 * Create a git stash for additional safety
 */
export async function createGitStash(
  projectPath: string,
  message: string,
): Promise<boolean> {
  const { exec } = require("child_process");
  const { promisify } = require("util");
  const execAsync = promisify(exec);

  try {
    const { stdout } = await execAsync(
      `cd "${projectPath}" && git stash push -u -m "${message}"`,
    );
    return stdout.includes("Saved") || stdout.includes("No local changes");
  } catch (error) {
    console.error("Failed to create git stash:", error);
    return false;
  }
}

/**
 * Pop the latest git stash
 */
export async function popGitStash(projectPath: string): Promise<boolean> {
  const { exec } = require("child_process");
  const { promisify } = require("util");
  const execAsync = promisify(exec);

  try {
    await execAsync(`cd "${projectPath}" && git stash pop`);
    return true;
  } catch (error) {
    console.error("Failed to pop git stash:", error);
    return false;
  }
}
