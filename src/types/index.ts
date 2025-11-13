/**
 * Application-wide TypeScript types and interfaces
 * Clean, easy-to-use types for the application layer
 */

import { Database } from "./database";

// =====================================================
// ENUMS
// =====================================================

export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  IMPLEMENTING = "implementing",
  COMPLETED = "completed",
  FAILED = "failed",
  BLOCKED = "blocked",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export enum MessageRole {
  USER = "user",
  ASSISTANT = "assistant",
  SYSTEM = "system",
}

export enum ExecutionStatus {
  RUNNING = "running",
  SUCCESS = "success",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

// =====================================================
// DATABASE ROW TYPES
// =====================================================

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type ChatMessageRow = Database["public"]["Tables"]["chat_messages"]["Row"];
export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskExecutionRow = Database["public"]["Tables"]["task_executions"]["Row"];
export type TaskDependencyRow = Database["public"]["Tables"]["task_dependencies"]["Row"];
export type TaskCommentRow = Database["public"]["Tables"]["task_comments"]["Row"];
export type TaskHistoryRow = Database["public"]["Tables"]["task_history"]["Row"];

// =====================================================
// INSERT TYPES
// =====================================================

export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ChatMessageInsert = Database["public"]["Tables"]["chat_messages"]["Insert"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskExecutionInsert = Database["public"]["Tables"]["task_executions"]["Insert"];
export type TaskDependencyInsert = Database["public"]["Tables"]["task_dependencies"]["Insert"];
export type TaskCommentInsert = Database["public"]["Tables"]["task_comments"]["Insert"];
export type TaskHistoryInsert = Database["public"]["Tables"]["task_history"]["Insert"];

// =====================================================
// UPDATE TYPES
// =====================================================

export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];
export type ChatMessageUpdate = Database["public"]["Tables"]["chat_messages"]["Update"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];
export type TaskExecutionUpdate = Database["public"]["Tables"]["task_executions"]["Update"];
export type TaskDependencyUpdate = Database["public"]["Tables"]["task_dependencies"]["Update"];
export type TaskCommentUpdate = Database["public"]["Tables"]["task_comments"]["Update"];
export type TaskHistoryUpdate = Database["public"]["Tables"]["task_history"]["Update"];

// =====================================================
// APPLICATION INTERFACES
// =====================================================

/**
 * User Profile
 */
export interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}

/**
 * Project with metadata
 */
export interface Project {
  id: string;
  name: string;
  description: string | null;
  folderPath: string | null;
  techStack: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Project with additional counts and stats
 */
export interface ProjectWithStats extends Project {
  taskCount: number;
  completedTaskCount: number;
  messageCount: number;
}

/**
 * Chat Message
 */
export interface ChatMessage {
  id: string;
  projectId: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
  userId: string;
}

/**
 * Task with implementation details
 */
export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  implementationDetails: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  implementedAt: Date | null;
  implementationLog: string | null;
  dueDate: Date | null;
  assigneeId: string | null;
  labels: string[];
  estimatedHours: number | null;
  actualHours: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  sortOrder: number;
}

/**
 * Task with execution history
 */
export interface TaskWithExecutions extends Task {
  executions: TaskExecution[];
}

/**
 * Task Execution
 */
export interface TaskExecution {
  id: string;
  taskId: string;
  status: ExecutionStatus;
  changes: Record<string, any> | null;
  errorLog: string | null;
  executedAt: Date;
  executedBy: string;
}

/**
 * Task Execution with executor profile
 */
export interface TaskExecutionWithProfile extends TaskExecution {
  executor: Profile;
}

/**
 * Task Dependency
 */
export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: "blocks" | "relates_to";
  createdAt: Date;
}

/**
 * Task Comment
 */
export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Task Comment with user profile
 */
export interface TaskCommentWithProfile extends TaskComment {
  user: Profile;
}

/**
 * Task History Entry
 */
export interface TaskHistory {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date;
}

/**
 * Task History with user profile
 */
export interface TaskHistoryWithProfile extends TaskHistory {
  user: Profile;
}

/**
 * Task with all related data
 */
export interface TaskWithDetails extends Task {
  assignee?: Profile | null;
  dependencies: TaskDependency[];
  dependents: TaskDependency[];
  comments: TaskCommentWithProfile[];
  history: TaskHistoryWithProfile[];
  executions: TaskExecution[];
}

// =====================================================
// FORM TYPES
// =====================================================

/**
 * Form data for creating a new project
 */
export interface CreateProjectForm {
  name: string;
  description?: string;
  folderPath?: string;
  techStack?: string[];
}

/**
 * Form data for updating a project
 */
export interface UpdateProjectForm {
  name?: string;
  description?: string;
  folderPath?: string;
  techStack?: string[];
}

/**
 * Form data for creating a new task
 */
export interface CreateTaskForm {
  projectId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  implementationDetails?: Record<string, any>;
}

/**
 * Form data for updating a task
 */
export interface UpdateTaskForm {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  implementationDetails?: Record<string, any>;
  implementationLog?: string;
}

/**
 * Form data for creating a chat message
 */
export interface CreateMessageForm {
  projectId: string;
  role: MessageRole;
  content: string;
}

/**
 * Form data for creating a task execution
 */
export interface CreateTaskExecutionForm {
  taskId: string;
  status?: ExecutionStatus;
  changes?: Record<string, any>;
  errorLog?: string;
}

// =====================================================
// UTILITY TYPES
// =====================================================

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Pagination result with metadata
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Filter options for tasks
 */
export interface TaskFilters {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  projectId?: string;
  search?: string;
}

/**
 * Sort options
 */
export interface SortOptions {
  field: string;
  direction: "asc" | "desc";
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  success: boolean;
}

// =====================================================
// HELPER FUNCTIONS FOR TYPE CONVERSION
// =====================================================

/**
 * Convert database row to Profile interface
 */
export function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Convert database row to Project interface
 */
export function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    folderPath: row.folder_path,
    techStack: row.tech_stack,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert database row to ChatMessage interface
 */
export function toChatMessage(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    projectId: row.project_id,
    role: row.role as MessageRole,
    content: row.content,
    createdAt: new Date(row.created_at),
    userId: row.user_id,
  };
}

/**
 * Convert database row to Task interface
 */
export function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    implementationDetails: row.implementation_details as Record<string, any> | null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    implementedAt: row.implemented_at ? new Date(row.implemented_at) : null,
    implementationLog: row.implementation_log,
    dueDate: row.due_date ? new Date(row.due_date) : null,
    assigneeId: row.assignee_id,
    labels: row.labels,
    estimatedHours: row.estimated_hours,
    actualHours: row.actual_hours,
    startedAt: row.started_at ? new Date(row.started_at) : null,
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    sortOrder: row.sort_order,
  };
}

/**
 * Convert database row to TaskExecution interface
 */
export function toTaskExecution(row: TaskExecutionRow): TaskExecution {
  return {
    id: row.id,
    taskId: row.task_id,
    status: row.status as ExecutionStatus,
    changes: row.changes as Record<string, any> | null,
    errorLog: row.error_log,
    executedAt: new Date(row.executed_at),
    executedBy: row.executed_by,
  };
}

/**
 * Convert database row to TaskDependency interface
 */
export function toTaskDependency(row: TaskDependencyRow): TaskDependency {
  return {
    id: row.id,
    taskId: row.task_id,
    dependsOnTaskId: row.depends_on_task_id,
    dependencyType: row.dependency_type,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Convert database row to TaskComment interface
 */
export function toTaskComment(row: TaskCommentRow): TaskComment {
  return {
    id: row.id,
    taskId: row.task_id,
    userId: row.user_id,
    content: row.content,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Convert database row to TaskHistory interface
 */
export function toTaskHistory(row: TaskHistoryRow): TaskHistory {
  return {
    id: row.id,
    taskId: row.task_id,
    userId: row.user_id,
    action: row.action,
    fieldName: row.field_name,
    oldValue: row.old_value,
    newValue: row.new_value,
    createdAt: new Date(row.created_at),
  };
}
