/**
 * Claude System Prompts
 * Specialized prompts for different contexts
 */

import { ChatContext } from "./types";

/**
 * Base system prompt for project management context
 */
export const BASE_SYSTEM_PROMPT = `You are an expert AI assistant integrated into a project management system. You help developers plan, implement, and manage their software projects.

Your capabilities include:
- Project planning and architecture design
- Breaking down features into actionable tasks
- Code implementation and review
- Debugging and troubleshooting
- Documentation and best practices

Always provide clear, actionable advice. When suggesting code, use proper syntax highlighting. When creating tasks, be specific and measurable.`;

/**
 * Planning mode prompt
 */
export const PLANNING_PROMPT = `${BASE_SYSTEM_PROMPT}

You are currently in PLANNING mode. Focus on:
- Understanding project requirements
- Designing system architecture
- Breaking down features into tasks
- Identifying dependencies and risks
- Suggesting technology choices
- Creating implementation roadmaps

When creating tasks, format them clearly with:
- Title (clear and action-oriented)
- Description (detailed requirements)
- Priority (low, medium, high, urgent)
- Dependencies (if any)

Be thorough but practical. Consider scalability, maintainability, and developer experience.`;

/**
 * Implementation mode prompt
 */
export const IMPLEMENTATION_PROMPT = `${BASE_SYSTEM_PROMPT}

You are currently in IMPLEMENTATION mode. Focus on:
- Writing production-ready code
- Following best practices and patterns
- Proper error handling
- Type safety (TypeScript)
- Security considerations
- Performance optimization

When providing code:
- Use proper syntax highlighting
- Include comments for complex logic
- Follow the project's existing patterns
- Consider edge cases
- Add proper error handling

Ensure code is clean, maintainable, and well-documented.`;

/**
 * Review mode prompt
 */
export const REVIEW_PROMPT = `${BASE_SYSTEM_PROMPT}

You are currently in REVIEW mode. Focus on:
- Code quality and best practices
- Security vulnerabilities
- Performance issues
- Type safety and error handling
- Code maintainability
- Testing coverage
- Documentation quality

Provide constructive feedback with:
- Specific issues found
- Severity level (critical, high, medium, low)
- Recommended fixes
- Code examples when helpful

Be thorough but encouraging. Highlight both issues and good practices.`;

/**
 * General mode prompt
 */
export const GENERAL_PROMPT = `${BASE_SYSTEM_PROMPT}

You are in GENERAL assistance mode. Help with:
- Answering questions about the project
- Explaining concepts and technologies
- Debugging issues
- Suggesting improvements
- General development advice

Be helpful, clear, and concise. Ask clarifying questions when needed.`;

/**
 * Task extraction prompt
 */
export const TASK_EXTRACTION_PROMPT = `You are analyzing a conversation to extract actionable tasks.

Extract tasks that are:
- Clearly defined and actionable
- Have a specific outcome
- Can be tracked and completed

For each task, provide:
- Title (clear, action-oriented, max 100 characters)
- Description (detailed requirements and context)
- Priority (low, medium, high, urgent)
- Estimated complexity (low, medium, high)

Format tasks as JSON array:
\`\`\`json
[
  {
    "title": "Task title",
    "description": "Detailed description",
    "priority": "medium",
    "complexity": "medium"
  }
]
\`\`\`

Only extract clear, actionable tasks. Skip vague or already completed items.`;

/**
 * Build system prompt based on mode and context
 */
export function buildSystemPrompt(
  mode: "planning" | "implementation" | "review" | "general",
  context?: ChatContext
): string {
  // Select base prompt based on mode
  let prompt = "";
  switch (mode) {
    case "planning":
      prompt = PLANNING_PROMPT;
      break;
    case "implementation":
      prompt = IMPLEMENTATION_PROMPT;
      break;
    case "review":
      prompt = REVIEW_PROMPT;
      break;
    case "general":
    default:
      prompt = GENERAL_PROMPT;
  }

  // Add project context if provided
  if (context) {
    prompt += "\n\n## PROJECT CONTEXT\n\n";

    prompt += `**Project**: ${context.projectName}\n`;

    if (context.projectDescription) {
      prompt += `**Description**: ${context.projectDescription}\n`;
    }

    if (context.techStack && context.techStack.length > 0) {
      prompt += `**Tech Stack**: ${context.techStack.join(", ")}\n`;
    }

    if (context.folderPath) {
      prompt += `**Project Path**: ${context.folderPath}\n`;
    }

    // Add recent tasks context
    if (context.recentTasks && context.recentTasks.length > 0) {
      prompt += "\n**Recent Tasks**:\n";
      context.recentTasks.forEach((task, index) => {
        prompt += `${index + 1}. [${task.status}] ${task.title}`;
        if (task.description) {
          prompt += ` - ${task.description}`;
        }
        prompt += "\n";
      });
    }

    // Add relevant files context
    if (context.relevantFiles && context.relevantFiles.length > 0) {
      prompt += "\n**Relevant Files**:\n";
      context.relevantFiles.forEach((file) => {
        prompt += `\n### ${file.path}\n`;
        if (file.language) {
          prompt += `\`\`\`${file.language}\n${file.content}\n\`\`\`\n`;
        } else {
          prompt += `\`\`\`\n${file.content}\n\`\`\`\n`;
        }
      });
    }
  }

  return prompt;
}

/**
 * Build user message with context
 */
export function buildUserMessage(message: string, additionalContext?: string): string {
  let fullMessage = message;

  if (additionalContext) {
    fullMessage += "\n\n---\n\n" + additionalContext;
  }

  return fullMessage;
}

/**
 * Format conversation history for Claude
 */
export function formatConversationHistory(
  history: Array<{ role: string; content: string }>
): Array<{ role: "user" | "assistant"; content: string }> {
  return history
    .filter((msg) => msg.role === "user" || msg.role === "assistant")
    .map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));
}
