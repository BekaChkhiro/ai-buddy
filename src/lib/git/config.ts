/**
 * Git Configuration and Commit Templates
 *
 * This module provides Git configuration management and commit message templating.
 */

import fs from 'fs/promises';
import path from 'path';
import type {
  GitConfig,
  CommitTemplateVars,
  AutoCommitConfig,
  BranchNamingConvention,
} from './types';

/**
 * Default Git configuration
 */
export const defaultGitConfig: Partial<GitConfig> = {
  autoCommit: false,
  autoPush: false,
  branchPrefix: 'feature',
  remoteName: 'origin',
  excludePatterns: ['node_modules/**', '.env*', '*.log', '.DS_Store'],
};

/**
 * Default auto-commit configuration
 */
export const defaultAutoCommitConfig: AutoCommitConfig = {
  enabled: false,
  afterImplementation: true,
  messageTemplate: '{{taskTitle}}\n\n{{taskDescription}}',
  includeTaskReference: true,
  autoPush: false,
};

/**
 * Default branch naming convention
 */
export const defaultBranchNaming: BranchNamingConvention = {
  prefix: 'feature',
  separator: '/',
  maxLength: 50,
  allowedCharacters: /^[a-zA-Z0-9/_-]+$/,
};

/**
 * Commit message templates
 */
export const commitTemplates = {
  // Standard conventional commit templates
  feat: 'feat: {{message}}',
  fix: 'fix: {{message}}',
  docs: 'docs: {{message}}',
  style: 'style: {{message}}',
  refactor: 'refactor: {{message}}',
  perf: 'perf: {{message}}',
  test: 'test: {{message}}',
  build: 'build: {{message}}',
  ci: 'ci: {{message}}',
  chore: 'chore: {{message}}',
  revert: 'revert: {{message}}',

  // Task-based templates
  task: `{{taskTitle}}

{{taskDescription}}

Files changed:
{{filesChanged}}`,

  // Implementation template
  implementation: `Implement: {{taskTitle}}

{{taskDescription}}

Changes:
{{filesChanged}}

Completed: {{timestamp}}`,

  // Bug fix template
  bugfix: `Fix: {{taskTitle}}

Issue: {{taskDescription}}

Resolution:
{{filesChanged}}

Fixed on: {{timestamp}}`,

  // Feature template
  feature: `Feature: {{taskTitle}}

Description:
{{taskDescription}}

Implementation:
{{filesChanged}}

Added on: {{timestamp}}`,
};

/**
 * Load Git configuration from file
 *
 * @param projectPath - Project directory path
 * @returns Git configuration
 */
export async function loadGitConfig(
  projectPath: string
): Promise<GitConfig> {
  try {
    const configPath = path.join(projectPath, '.aibuddy', 'git-config.json');
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);

    return {
      projectPath,
      ...defaultGitConfig,
      ...config,
    };
  } catch {
    // Return default config if file doesn't exist
    return {
      projectPath,
      ...defaultGitConfig,
    } as GitConfig;
  }
}

/**
 * Save Git configuration to file
 *
 * @param config - Git configuration
 * @returns True if saved successfully
 */
export async function saveGitConfig(config: GitConfig): Promise<boolean> {
  try {
    const configDir = path.join(config.projectPath, '.aibuddy');
    await fs.mkdir(configDir, { recursive: true });

    const configPath = path.join(configDir, 'git-config.json');
    const { projectPath, ...configData } = config;

    await fs.writeFile(
      configPath,
      JSON.stringify(configData, null, 2),
      'utf-8'
    );

    return true;
  } catch (error) {
    console.error('Failed to save Git config:', error);
    return false;
  }
}

/**
 * Render a commit message template
 *
 * @param template - Template string
 * @param vars - Template variables
 * @returns Rendered commit message
 */
export function renderCommitTemplate(
  template: string,
  vars: CommitTemplateVars
): string {
  let message = template;

  // Replace template variables
  if (vars.taskTitle) {
    message = message.replace(/\{\{taskTitle\}\}/g, vars.taskTitle);
  }

  if (vars.taskDescription) {
    message = message.replace(/\{\{taskDescription\}\}/g, vars.taskDescription);
  }

  if (vars.author) {
    message = message.replace(/\{\{author\}\}/g, vars.author);
  }

  if (vars.timestamp) {
    message = message.replace(/\{\{timestamp\}\}/g, vars.timestamp);
  } else {
    message = message.replace(
      /\{\{timestamp\}\}/g,
      new Date().toISOString()
    );
  }

  if (vars.filesChanged) {
    const filesStr = vars.filesChanged.map((f) => `- ${f}`).join('\n');
    message = message.replace(/\{\{filesChanged\}\}/g, filesStr);
  }

  // Replace custom fields
  if (vars.customFields) {
    Object.entries(vars.customFields).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      message = message.replace(regex, value);
    });
  }

  return message.trim();
}

/**
 * Generate a commit message from a task
 *
 * @param taskTitle - Task title
 * @param taskDescription - Task description
 * @param filesChanged - List of changed files
 * @param template - Template name or custom template string
 * @returns Generated commit message
 */
export function generateCommitMessage(
  taskTitle: string,
  taskDescription?: string,
  filesChanged?: string[],
  template: keyof typeof commitTemplates | string = 'task'
): string {
  const templateStr =
    template in commitTemplates
      ? commitTemplates[template as keyof typeof commitTemplates]
      : template;

  const vars: CommitTemplateVars = {
    taskTitle,
    taskDescription,
    filesChanged,
    timestamp: new Date().toISOString(),
  };

  return renderCommitTemplate(templateStr, vars);
}

/**
 * Get conventional commit type from task title
 *
 * @param taskTitle - Task title
 * @returns Commit type
 */
export function inferCommitType(
  taskTitle: string
): keyof typeof commitTemplates {
  const title = taskTitle.toLowerCase();

  if (title.includes('fix') || title.includes('bug')) {
    return 'fix';
  }
  if (title.includes('feat') || title.includes('feature') || title.includes('add')) {
    return 'feat';
  }
  if (title.includes('doc')) {
    return 'docs';
  }
  if (title.includes('test')) {
    return 'test';
  }
  if (title.includes('refactor')) {
    return 'refactor';
  }
  if (title.includes('style')) {
    return 'style';
  }
  if (title.includes('perf')) {
    return 'perf';
  }
  if (title.includes('build')) {
    return 'build';
  }
  if (title.includes('ci')) {
    return 'ci';
  }

  return 'chore';
}

/**
 * Load auto-commit configuration
 *
 * @param projectPath - Project directory path
 * @returns Auto-commit configuration
 */
export async function loadAutoCommitConfig(
  projectPath: string
): Promise<AutoCommitConfig> {
  try {
    const configPath = path.join(
      projectPath,
      '.aibuddy',
      'auto-commit-config.json'
    );
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);

    return {
      ...defaultAutoCommitConfig,
      ...config,
    };
  } catch {
    return defaultAutoCommitConfig;
  }
}

/**
 * Save auto-commit configuration
 *
 * @param projectPath - Project directory path
 * @param config - Auto-commit configuration
 * @returns True if saved successfully
 */
export async function saveAutoCommitConfig(
  projectPath: string,
  config: AutoCommitConfig
): Promise<boolean> {
  try {
    const configDir = path.join(projectPath, '.aibuddy');
    await fs.mkdir(configDir, { recursive: true });

    const configPath = path.join(configDir, 'auto-commit-config.json');
    await fs.writeFile(
      configPath,
      JSON.stringify(config, null, 2),
      'utf-8'
    );

    return true;
  } catch (error) {
    console.error('Failed to save auto-commit config:', error);
    return false;
  }
}

/**
 * Validate commit message format
 *
 * @param message - Commit message
 * @param conventionalCommits - Enforce conventional commits format
 * @returns Validation result
 */
export function validateCommitMessage(
  message: string,
  conventionalCommits = false
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if message is empty
  if (!message || message.trim().length === 0) {
    errors.push('Commit message cannot be empty');
    return { valid: false, errors };
  }

  // Check message length
  const lines = message.split('\n');
  if (lines[0].length > 72) {
    errors.push('First line should be 72 characters or less');
  }

  // Validate conventional commits format
  if (conventionalCommits) {
    const conventionalPattern =
      /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?!?: .+/;

    if (!conventionalPattern.test(lines[0])) {
      errors.push(
        'Message must follow conventional commits format: type(scope): description'
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Load branch naming convention
 *
 * @param projectPath - Project directory path
 * @returns Branch naming convention
 */
export async function loadBranchNamingConvention(
  projectPath: string
): Promise<BranchNamingConvention> {
  try {
    const configPath = path.join(
      projectPath,
      '.aibuddy',
      'branch-naming.json'
    );
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);

    return {
      ...defaultBranchNaming,
      ...config,
      allowedCharacters: new RegExp(config.allowedCharacters || defaultBranchNaming.allowedCharacters.source),
    };
  } catch {
    return defaultBranchNaming;
  }
}

/**
 * Save branch naming convention
 *
 * @param projectPath - Project directory path
 * @param convention - Branch naming convention
 * @returns True if saved successfully
 */
export async function saveBranchNamingConvention(
  projectPath: string,
  convention: BranchNamingConvention
): Promise<boolean> {
  try {
    const configDir = path.join(projectPath, '.aibuddy');
    await fs.mkdir(configDir, { recursive: true });

    const configPath = path.join(configDir, 'branch-naming.json');
    const config = {
      ...convention,
      allowedCharacters: convention.allowedCharacters.source,
    };

    await fs.writeFile(
      configPath,
      JSON.stringify(config, null, 2),
      'utf-8'
    );

    return true;
  } catch (error) {
    console.error('Failed to save branch naming convention:', error);
    return false;
  }
}

export default {
  defaultGitConfig,
  defaultAutoCommitConfig,
  defaultBranchNaming,
  commitTemplates,
  loadGitConfig,
  saveGitConfig,
  renderCommitTemplate,
  generateCommitMessage,
  inferCommitType,
  loadAutoCommitConfig,
  saveAutoCommitConfig,
  validateCommitMessage,
  loadBranchNamingConvention,
  saveBranchNamingConvention,
};
