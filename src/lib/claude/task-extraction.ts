/**
 * AI-Powered Task Extraction from Chat
 * Extracts actionable tasks from conversations using Claude AI
 */

import { TaskPriority, TaskStatus } from "@/types";
import { getClaudeClient } from "./client";
import { TASK_EXTRACTION_PROMPT } from "./prompts";
import { FAST_MODEL, DEFAULT_MODEL } from "./config";

// =====================================================
// TYPES
// =====================================================

/**
 * Complexity level for tasks
 */
export enum TaskComplexity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

/**
 * Extracted task data from AI analysis
 */
export interface ExtractedTask {
  title: string;
  description: string;
  priority: TaskPriority;
  complexity: TaskComplexity;
  estimatedHours?: number;
  dependencies?: string[]; // Task titles this depends on
  technicalRequirements?: string[];
  suggestedOrder?: number;
  confidenceScore: number; // 0-1, how confident the AI is about this task
  sourceMessageIds?: string[]; // IDs of messages this task was extracted from
  tags?: string[];
}

/**
 * Result of task extraction
 */
export interface TaskExtractionResult {
  tasks: ExtractedTask[];
  summary: string;
  totalConfidence: number; // Average confidence across all tasks
  conversationContext: string;
  extractedAt: Date;
}

/**
 * Options for task extraction
 */
export interface ExtractionOptions {
  /** Use fast model for quicker extraction (less accurate) */
  useFastModel?: boolean;
  /** Minimum confidence score to include task (0-1) */
  minConfidence?: number;
  /** Maximum number of tasks to extract */
  maxTasks?: number;
  /** Include technical requirements analysis */
  includeTechnicalRequirements?: boolean;
  /** Include time estimates */
  includeTimeEstimates?: boolean;
  /** Context from project (tech stack, recent tasks, etc.) */
  projectContext?: {
    techStack?: string[];
    recentTasks?: Array<{ title: string; status: string }>;
    projectName?: string;
  };
}

/**
 * Message for extraction
 */
export interface ChatMessageForExtraction {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
}

// =====================================================
// EXTRACTION FUNCTIONS
// =====================================================

/**
 * Extract tasks from a conversation using Claude AI
 */
export async function extractTasksFromConversation(
  messages: ChatMessageForExtraction[],
  options: ExtractionOptions = {}
): Promise<TaskExtractionResult> {
  const {
    useFastModel = false,
    minConfidence = 0.6,
    maxTasks = 20,
    includeTechnicalRequirements = true,
    includeTimeEstimates = true,
    projectContext,
  } = options;

  const client = getClaudeClient();

  // Build extraction prompt with context
  let extractionPrompt = TASK_EXTRACTION_PROMPT;

  if (projectContext) {
    extractionPrompt += "\n\n## PROJECT CONTEXT\n\n";
    if (projectContext.projectName) {
      extractionPrompt += `**Project**: ${projectContext.projectName}\n`;
    }
    if (projectContext.techStack && projectContext.techStack.length > 0) {
      extractionPrompt += `**Tech Stack**: ${projectContext.techStack.join(", ")}\n`;
    }
    if (projectContext.recentTasks && projectContext.recentTasks.length > 0) {
      extractionPrompt += "\n**Recent Tasks**:\n";
      projectContext.recentTasks.forEach((task, index) => {
        extractionPrompt += `${index + 1}. [${task.status}] ${task.title}\n`;
      });
    }
  }

  if (includeTechnicalRequirements) {
    extractionPrompt += "\n\nFor each task, also identify:\n- Technical requirements (libraries, APIs, tools needed)\n- Potential challenges or risks\n";
  }

  if (includeTimeEstimates) {
    extractionPrompt += "\n\nProvide time estimates in hours based on complexity:\n- Low complexity: 1-4 hours\n- Medium complexity: 4-16 hours\n- High complexity: 16+ hours\n";
  }

  extractionPrompt += `\n\nIMPORTANT: Also analyze task dependencies and suggest the optimal order for implementation.

Return response as a JSON object with this structure:
\`\`\`json
{
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed description",
      "priority": "low|medium|high|urgent",
      "complexity": "low|medium|high",
      "estimatedHours": 8,
      "dependencies": ["Other task title"],
      "technicalRequirements": ["React", "TypeScript"],
      "suggestedOrder": 1,
      "confidenceScore": 0.95,
      "tags": ["frontend", "api"]
    }
  ],
  "summary": "Overall summary of the conversation and extracted tasks",
  "conversationContext": "Brief context about what was discussed"
}
\`\`\``;

  // Format conversation for Claude
  const conversationText = messages
    .map(
      (msg) =>
        `[${msg.role.toUpperCase()}] (${msg.createdAt.toISOString()})\n${msg.content}\n`
    )
    .join("\n---\n\n");

  const userPrompt = `Please analyze the following conversation and extract actionable tasks:\n\n${conversationText}\n\nExtract up to ${maxTasks} tasks with confidence scores.`;

  // Call Claude API
  try {
    const response = await client.messages.create({
      model: useFastModel ? FAST_MODEL : DEFAULT_MODEL,
      max_tokens: 4096,
      system: extractionPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    // Parse response
    const content = response.content[0];
    if (!content || content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    const extractedData = parseExtractionResponse(content.text);

    // Filter by confidence
    const filteredTasks = extractedData.tasks.filter(
      (task) => task.confidenceScore >= minConfidence
    );

    // Add source message IDs
    const tasksWithSources = filteredTasks.map((task) => ({
      ...task,
      sourceMessageIds: messages.map((m) => m.id),
    }));

    // Calculate average confidence
    const totalConfidence =
      tasksWithSources.length > 0
        ? tasksWithSources.reduce((sum, task) => sum + task.confidenceScore, 0) /
          tasksWithSources.length
        : 0;

    return {
      tasks: tasksWithSources,
      summary: extractedData.summary,
      totalConfidence,
      conversationContext: extractedData.conversationContext,
      extractedAt: new Date(),
    };
  } catch (error) {
    console.error("Error extracting tasks:", error);
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
  options: ExtractionOptions = {}
): Promise<TaskExtractionResult> {
  const messageObj: ChatMessageForExtraction = {
    id: "temp",
    role: "user",
    content: message,
    createdAt: new Date(),
  };

  return extractTasksFromConversation([messageObj], {
    ...options,
    useFastModel: true, // Use fast model for single message
  });
}

/**
 * Auto-detect if a message contains task-like content
 */
export function detectTaskLikeContent(message: string): boolean {
  const taskIndicators = [
    // Action verbs
    /\b(implement|create|build|add|update|fix|refactor|optimize|test|deploy|setup|configure)\b/i,
    // Task markers
    /\b(todo|task|need to|should|must|have to)\b/i,
    // List markers
    /^[\s]*[-*•]\s+/m,
    /^[\s]*\d+\.\s+/m,
    // Imperative sentences
    /^(let's|we need to|we should|please)\s+/i,
    // Feature requests
    /\b(feature|functionality|capability|enhancement)\b/i,
  ];

  return taskIndicators.some((pattern) => pattern.test(message));
}

/**
 * Break down a complex task into subtasks
 */
export async function breakDownComplexTask(
  taskTitle: string,
  taskDescription: string,
  options: ExtractionOptions = {}
): Promise<ExtractedTask[]> {
  const client = getClaudeClient();

  const prompt = `You are breaking down a complex task into smaller, actionable subtasks.

**Main Task**: ${taskTitle}
**Description**: ${taskDescription}

Break this down into 3-8 smaller subtasks that:
1. Are independently completable
2. Follow a logical implementation order
3. Have clear deliverables
4. Together complete the main task

Return as JSON array:
\`\`\`json
[
  {
    "title": "Subtask title",
    "description": "What needs to be done",
    "priority": "low|medium|high|urgent",
    "complexity": "low|medium|high",
    "estimatedHours": 4,
    "dependencies": [],
    "technicalRequirements": ["tool", "library"],
    "suggestedOrder": 1,
    "confidenceScore": 0.9,
    "tags": ["backend", "api"]
  }
]
\`\`\``;

  try {
    const response = await client.messages.create({
      model: options.useFastModel ? FAST_MODEL : DEFAULT_MODEL,
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (!content || content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    const tasks = parseTaskArray(content.text);
    return tasks;
  } catch (error) {
    console.error("Error breaking down task:", error);
    throw new Error(
      `Failed to break down task: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Estimate implementation time for a task
 */
export async function estimateTaskTime(
  taskTitle: string,
  taskDescription: string,
  techStack: string[] = []
): Promise<{
  estimatedHours: number;
  confidence: number;
  breakdown: string;
  assumptions: string[];
}> {
  const client = getClaudeClient();

  const prompt = `Estimate the implementation time for this task:

**Task**: ${taskTitle}
**Description**: ${taskDescription}
${techStack.length > 0 ? `**Tech Stack**: ${techStack.join(", ")}` : ""}

Provide a realistic time estimate considering:
- Development time
- Testing time
- Documentation time
- Potential blockers

Return as JSON:
\`\`\`json
{
  "estimatedHours": 8,
  "confidence": 0.8,
  "breakdown": "Development: 5h, Testing: 2h, Documentation: 1h",
  "assumptions": ["Developer has experience with React", "API endpoints already exist"]
}
\`\`\``;

  try {
    const response = await client.messages.create({
      model: FAST_MODEL,
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (!content || content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    const result = parseJSON(content.text);
    return result;
  } catch (error) {
    console.error("Error estimating task time:", error);
    // Return default estimate on error
    return {
      estimatedHours: 4,
      confidence: 0.5,
      breakdown: "Unable to estimate",
      assumptions: [],
    };
  }
}

/**
 * Identify dependencies between tasks
 */
export function identifyTaskDependencies(
  tasks: ExtractedTask[]
): Map<string, string[]> {
  const dependencies = new Map<string, string[]>();

  tasks.forEach((task) => {
    if (task.dependencies && task.dependencies.length > 0) {
      dependencies.set(task.title, task.dependencies);
    }
  });

  return dependencies;
}

/**
 * Suggest task priority and order
 */
export function suggestTaskOrder(tasks: ExtractedTask[]): ExtractedTask[] {
  // Sort by suggested order, then by dependencies, then by priority
  const ordered = [...tasks].sort((a, b) => {
    // First by suggested order
    if (a.suggestedOrder !== undefined && b.suggestedOrder !== undefined) {
      if (a.suggestedOrder !== b.suggestedOrder) {
        return a.suggestedOrder - b.suggestedOrder;
      }
    }

    // Then by dependencies (tasks with no dependencies first)
    const aDeps = a.dependencies?.length || 0;
    const bDeps = b.dependencies?.length || 0;
    if (aDeps !== bDeps) {
      return aDeps - bDeps;
    }

    // Then by priority
    const priorityOrder = {
      [TaskPriority.URGENT]: 0,
      [TaskPriority.HIGH]: 1,
      [TaskPriority.MEDIUM]: 2,
      [TaskPriority.LOW]: 3,
    };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Update suggested order
  return ordered.map((task, index) => ({
    ...task,
    suggestedOrder: index + 1,
  }));
}

// =====================================================
// PARSING UTILITIES
// =====================================================

/**
 * Parse extraction response from Claude
 */
function parseExtractionResponse(text: string): {
  tasks: ExtractedTask[];
  summary: string;
  conversationContext: string;
} {
  try {
    const json = parseJSON(text);

    return {
      tasks: (json.tasks || []).map(normalizeExtractedTask),
      summary: json.summary || "No summary provided",
      conversationContext: json.conversationContext || "",
    };
  } catch (error) {
    console.error("Error parsing extraction response:", error);
    throw new Error("Failed to parse task extraction response");
  }
}

/**
 * Parse task array from Claude response
 */
function parseTaskArray(text: string): ExtractedTask[] {
  try {
    const json = parseJSON(text);
    const tasks = Array.isArray(json) ? json : json.tasks || [];
    return tasks.map(normalizeExtractedTask);
  } catch (error) {
    console.error("Error parsing task array:", error);
    return [];
  }
}

/**
 * Parse JSON from Claude response (handles markdown code blocks)
 */
function parseJSON(text: string): any {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  const jsonText = jsonMatch ? jsonMatch[1] : text;

  if (!jsonText) {
    throw new Error("No JSON content found");
  }

  try {
    return JSON.parse(jsonText.trim());
  } catch (error) {
    // Try to find JSON object in text
    if (jsonText) {
      const objectMatch = jsonText.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        return JSON.parse(objectMatch[0]);
      }
    }
    throw error;
  }
}

/**
 * Normalize extracted task data
 */
function normalizeExtractedTask(data: any): ExtractedTask {
  return {
    title: data.title || "Untitled Task",
    description: data.description || "",
    priority: normalizePriority(data.priority),
    complexity: normalizeComplexity(data.complexity),
    estimatedHours: data.estimatedHours || undefined,
    dependencies: Array.isArray(data.dependencies) ? data.dependencies : [],
    technicalRequirements: Array.isArray(data.technicalRequirements)
      ? data.technicalRequirements
      : [],
    suggestedOrder: data.suggestedOrder || undefined,
    confidenceScore: typeof data.confidenceScore === "number" ? data.confidenceScore : 0.7,
    tags: Array.isArray(data.tags) ? data.tags : [],
  };
}

/**
 * Normalize priority value
 */
function normalizePriority(value: any): TaskPriority {
  const normalized = String(value).toLowerCase();
  switch (normalized) {
    case "urgent":
      return TaskPriority.URGENT;
    case "high":
      return TaskPriority.HIGH;
    case "low":
      return TaskPriority.LOW;
    case "medium":
    default:
      return TaskPriority.MEDIUM;
  }
}

/**
 * Normalize complexity value
 */
function normalizeComplexity(value: any): TaskComplexity {
  const normalized = String(value).toLowerCase();
  switch (normalized) {
    case "high":
      return TaskComplexity.HIGH;
    case "low":
      return TaskComplexity.LOW;
    case "medium":
    default:
      return TaskComplexity.MEDIUM;
  }
}

// =====================================================
// BULK TASK CREATION
// =====================================================

/**
 * Create tasks in database from extracted tasks
 */
export async function createTasksFromExtraction(
  projectId: string,
  extractedTasks: ExtractedTask[],
  conversationId?: string
): Promise<{ success: boolean; createdCount: number; errors: string[] }> {
  const result = {
    success: true,
    createdCount: 0,
    errors: [] as string[],
  };

  for (const task of extractedTasks) {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: TaskStatus.PENDING,
          estimatedHours: task.estimatedHours,
          labels: [
            ...(task.tags || []),
            `extracted-${new Date().toISOString().split("T")[0]}`,
            `confidence-${Math.round(task.confidenceScore * 100)}`,
          ],
          implementationDetails: {
            complexity: task.complexity,
            technicalRequirements: task.technicalRequirements,
            confidenceScore: task.confidenceScore,
            extractedFrom: conversationId,
            sourceMessageIds: task.sourceMessageIds,
            suggestedOrder: task.suggestedOrder,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        result.createdCount++;
      } else {
        result.errors.push(`Failed to create "${task.title}": ${data.error}`);
      }
    } catch (error) {
      result.errors.push(
        `Failed to create "${task.title}": ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  result.success = result.errors.length === 0;
  return result;
}
