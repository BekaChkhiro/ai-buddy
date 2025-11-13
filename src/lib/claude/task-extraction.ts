/**
 * AI-Powered Task Extraction from Chat
 * Analyzes conversations and extracts actionable tasks
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClaudeClient } from "./client";
import { getModelConfig } from "./config";
import { TaskPriority, TaskStatus } from "@/types";

/**
 * Complexity levels for tasks
 */
export type TaskComplexity = "low" | "medium" | "high";

/**
 * Extracted task with AI analysis
 */
export interface ExtractedTask {
  title: string;
  description: string;
  priority: TaskPriority;
  complexity: TaskComplexity;
  estimatedHours: number | null;
  confidence: number; // 0-100
  suggestedLabels: string[];
  technicalRequirements: string[];
  dependencies: string[]; // Task titles this depends on
  reasoning: string; // Why this was extracted as a task
}

/**
 * Task extraction result
 */
export interface TaskExtractionResult {
  tasks: ExtractedTask[];
  summary: string;
  conversationContext: string;
  totalEstimatedHours: number;
  suggestedTaskOrder: string[]; // Task titles in suggested order
}

/**
 * Options for task extraction
 */
export interface TaskExtractionOptions {
  /** Maximum number of tasks to extract */
  maxTasks?: number;
  /** Minimum confidence score (0-100) */
  minConfidence?: number;
  /** Focus on specific types of tasks */
  focusArea?: "features" | "bugs" | "refactoring" | "documentation" | "all";
  /** Include automatically detected dependencies */
  detectDependencies?: boolean;
  /** Include time estimates */
  includeTimeEstimates?: boolean;
}

/**
 * Enhanced prompt for task extraction with detailed analysis
 */
const ENHANCED_TASK_EXTRACTION_PROMPT = `You are an expert project manager and technical analyst. Your role is to analyze conversations and extract actionable, well-defined tasks.

For each task you extract, provide:
1. **Title**: Clear, action-oriented (starts with a verb), max 80 characters
2. **Description**: Detailed requirements, acceptance criteria, and context
3. **Priority**: Based on urgency, impact, and dependencies
   - urgent: Critical, blocking other work, immediate action needed
   - high: Important, significant impact, should be done soon
   - medium: Normal priority, can be scheduled
   - low: Nice to have, can be deferred
4. **Complexity**: Development effort estimation
   - low: Simple, straightforward, < 4 hours
   - medium: Moderate effort, some challenges, 4-16 hours
   - high: Complex, significant effort, > 16 hours
5. **EstimatedHours**: Realistic time estimate in hours (null if uncertain)
6. **Confidence**: How confident you are this is a valid task (0-100)
7. **SuggestedLabels**: Relevant tags (e.g., "frontend", "api", "database", "bug", "feature")
8. **TechnicalRequirements**: Technologies, frameworks, or skills needed
9. **Dependencies**: Titles of other tasks that must be completed first
10. **Reasoning**: Brief explanation of why this is a task and what makes it actionable

Guidelines:
- Only extract tasks that are clearly actionable and have specific outcomes
- Break down complex features into smaller, manageable tasks
- Identify technical dependencies between tasks
- Consider the order in which tasks should be completed
- Skip vague ideas, questions, or already completed items
- Each task should be completable by a single developer in a reasonable timeframe
- Ensure tasks are testable and have clear completion criteria

Also provide:
- **Summary**: Brief overview of all extracted tasks
- **ConversationContext**: Key context from the conversation
- **SuggestedTaskOrder**: Order in which tasks should be tackled (by title)

Respond ONLY with valid JSON in this exact format:
{
  "tasks": [
    {
      "title": "Implement user authentication API",
      "description": "Create REST API endpoints for user login, logout, and session management. Include JWT token generation and validation.",
      "priority": "high",
      "complexity": "medium",
      "estimatedHours": 8,
      "confidence": 95,
      "suggestedLabels": ["backend", "api", "authentication", "security"],
      "technicalRequirements": ["Node.js", "JWT", "bcrypt", "Express.js"],
      "dependencies": ["Setup database schema for users"],
      "reasoning": "This is a clearly defined backend task with specific deliverables (login, logout, JWT) and is essential for the application."
    }
  ],
  "summary": "Extracted 3 tasks focused on implementing user authentication system",
  "conversationContext": "Discussion about building a secure authentication system with JWT tokens and session management",
  "suggestedTaskOrder": ["Setup database schema for users", "Implement user authentication API", "Create login UI components"]
}`;

/**
 * Extract tasks from conversation messages
 */
export async function extractTasksFromConversation(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  options: TaskExtractionOptions = {}
): Promise<TaskExtractionResult> {
  const {
    maxTasks = 10,
    minConfidence = 60,
    focusArea = "all",
    detectDependencies = true,
    includeTimeEstimates = true,
  } = options;

  // Build the extraction prompt with options
  let systemPrompt = ENHANCED_TASK_EXTRACTION_PROMPT;

  if (focusArea !== "all") {
    systemPrompt += `\n\nFocus specifically on extracting tasks related to: ${focusArea}`;
  }

  if (!detectDependencies) {
    systemPrompt += `\n\nDo not include dependency analysis.`;
  }

  if (!includeTimeEstimates) {
    systemPrompt += `\n\nSet estimatedHours to null for all tasks.`;
  }

  // Create the analysis request
  const analysisMessage = {
    role: "user" as const,
    content: `Analyze the following conversation and extract actionable tasks (max ${maxTasks}, min confidence ${minConfidence}%):\n\n${formatMessagesForAnalysis(messages)}`,
  };

  try {
    const client = createClaudeClient();
    const model = getModelConfig("sonnet-4.5");

    const response = await client.messages.create({
      model: model.id,
      max_tokens: 4096,
      temperature: 0.3, // Lower temperature for more consistent extraction
      system: systemPrompt,
      messages: [analysisMessage],
    });

    // Parse the response
    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    // Extract JSON from the response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in Claude response");
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate and transform the result
    const extractedTasks: ExtractedTask[] = result.tasks
      .filter((task: any) => task.confidence >= minConfidence)
      .map((task: any) => ({
        title: task.title,
        description: task.description,
        priority: validatePriority(task.priority),
        complexity: validateComplexity(task.complexity),
        estimatedHours: task.estimatedHours,
        confidence: task.confidence,
        suggestedLabels: Array.isArray(task.suggestedLabels)
          ? task.suggestedLabels
          : [],
        technicalRequirements: Array.isArray(task.technicalRequirements)
          ? task.technicalRequirements
          : [],
        dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
        reasoning: task.reasoning || "",
      }));

    // Calculate total estimated hours
    const totalEstimatedHours = extractedTasks.reduce(
      (sum, task) => sum + (task.estimatedHours || 0),
      0
    );

    return {
      tasks: extractedTasks.slice(0, maxTasks),
      summary: result.summary || "",
      conversationContext: result.conversationContext || "",
      totalEstimatedHours,
      suggestedTaskOrder: Array.isArray(result.suggestedTaskOrder)
        ? result.suggestedTaskOrder
        : extractedTasks.map((t) => t.title),
    };
  } catch (error) {
    console.error("Task extraction error:", error);
    throw new Error(
      `Failed to extract tasks: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Extract tasks from a single message (quick extraction)
 */
export async function extractTasksFromMessage(
  message: string,
  options: TaskExtractionOptions = {}
): Promise<TaskExtractionResult> {
  return extractTasksFromConversation(
    [{ role: "user", content: message }],
    options
  );
}

/**
 * Analyze task dependencies and suggest order
 */
export function analyzeTaskDependencies(
  tasks: ExtractedTask[]
): Map<string, string[]> {
  const dependencyMap = new Map<string, string[]>();

  tasks.forEach((task) => {
    const dependencies = task.dependencies.filter((dep) =>
      tasks.some((t) => t.title === dep)
    );
    dependencyMap.set(task.title, dependencies);
  });

  return dependencyMap;
}

/**
 * Sort tasks by dependencies (topological sort)
 */
export function sortTasksByDependencies(tasks: ExtractedTask[]): ExtractedTask[] {
  const sorted: ExtractedTask[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const taskMap = new Map(tasks.map((t) => [t.title, t]));

  function visit(taskTitle: string) {
    if (visited.has(taskTitle)) return;
    if (visiting.has(taskTitle)) {
      // Circular dependency detected, skip
      return;
    }

    visiting.add(taskTitle);

    const task = taskMap.get(taskTitle);
    if (task) {
      // Visit dependencies first
      task.dependencies.forEach((dep) => {
        if (taskMap.has(dep)) {
          visit(dep);
        }
      });

      visited.add(taskTitle);
      visiting.delete(taskTitle);
      sorted.push(task);
    }
  }

  tasks.forEach((task) => visit(task.title));

  return sorted;
}

/**
 * Break down a complex task into smaller tasks
 */
export async function breakDownComplexTask(
  task: ExtractedTask
): Promise<ExtractedTask[]> {
  if (task.complexity !== "high") {
    return [task];
  }

  const client = createClaudeClient();
  const model = getModelConfig("sonnet-4.5");

  const prompt = `Break down this complex task into smaller, manageable subtasks:

Title: ${task.title}
Description: ${task.description}
Technical Requirements: ${task.technicalRequirements.join(", ")}

Create 3-5 smaller tasks that together accomplish this goal. Each subtask should be completable in less than 8 hours.

Respond with JSON only:
{
  "tasks": [
    {
      "title": "Subtask title",
      "description": "Detailed description",
      "priority": "medium",
      "complexity": "low",
      "estimatedHours": 4,
      "confidence": 90,
      "suggestedLabels": ["label1"],
      "technicalRequirements": ["tech1"],
      "dependencies": [],
      "reasoning": "Why this subtask"
    }
  ],
  "summary": "Task breakdown summary",
  "conversationContext": "Context",
  "suggestedTaskOrder": ["Task 1", "Task 2"]
}`;

  try {
    const response = await client.messages.create({
      model: model.id,
      max_tokens: 4096,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return [task];
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return [task];
    }

    const result = JSON.parse(jsonMatch[0]);
    return result.tasks.map((t: any) => ({
      title: t.title,
      description: t.description,
      priority: validatePriority(t.priority),
      complexity: validateComplexity(t.complexity),
      estimatedHours: t.estimatedHours,
      confidence: t.confidence,
      suggestedLabels: Array.isArray(t.suggestedLabels) ? t.suggestedLabels : [],
      technicalRequirements: Array.isArray(t.technicalRequirements)
        ? t.technicalRequirements
        : [],
      dependencies: Array.isArray(t.dependencies) ? t.dependencies : [],
      reasoning: t.reasoning || "",
    }));
  } catch (error) {
    console.error("Task breakdown error:", error);
    return [task];
  }
}

/**
 * Format messages for analysis
 */
function formatMessagesForAnalysis(
  messages: Array<{ role: string; content: string }>
): string {
  return messages
    .map((msg, index) => {
      const role = msg.role === "user" ? "User" : "Assistant";
      return `[${index + 1}] ${role}:\n${msg.content}\n`;
    })
    .join("\n---\n\n");
}

/**
 * Validate and normalize priority
 */
function validatePriority(priority: string): TaskPriority {
  const validPriorities: TaskPriority[] = ["low", "medium", "high", "urgent"];
  const normalized = priority.toLowerCase() as TaskPriority;
  return validPriorities.includes(normalized) ? normalized : "medium";
}

/**
 * Validate and normalize complexity
 */
function validateComplexity(complexity: string): TaskComplexity {
  const validComplexities: TaskComplexity[] = ["low", "medium", "high"];
  const normalized = complexity.toLowerCase() as TaskComplexity;
  return validComplexities.includes(normalized) ? normalized : "medium";
}

/**
 * Estimate time based on complexity
 */
export function estimateTimeFromComplexity(complexity: TaskComplexity): number {
  switch (complexity) {
    case "low":
      return 2;
    case "medium":
      return 8;
    case "high":
      return 24;
    default:
      return 8;
  }
}

/**
 * Calculate confidence score based on task attributes
 */
export function calculateConfidenceScore(task: Partial<ExtractedTask>): number {
  let score = 50; // Base score

  // Clear title with action verb
  if (task.title && task.title.length > 10 && task.title.length < 80) {
    score += 15;
  }

  // Detailed description
  if (task.description && task.description.length > 50) {
    score += 15;
  }

  // Technical requirements specified
  if (task.technicalRequirements && task.technicalRequirements.length > 0) {
    score += 10;
  }

  // Has labels
  if (task.suggestedLabels && task.suggestedLabels.length > 0) {
    score += 5;
  }

  // Has time estimate
  if (task.estimatedHours && task.estimatedHours > 0) {
    score += 5;
  }

  return Math.min(100, score);
}
