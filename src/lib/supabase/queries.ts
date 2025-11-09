/**
 * Supabase database query helpers
 * Common database operations for all tables
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import {
  Profile,
  Project,
  ChatMessage,
  Task,
  TaskExecution,
  ProjectInsert,
  ProjectUpdate,
  ChatMessageInsert,
  TaskInsert,
  TaskUpdate,
  TaskExecutionInsert,
  TaskExecutionUpdate,
  TaskFilters,
  SortOptions,
  toProfile,
  toProject,
  toChatMessage,
  toTask,
  toTaskExecution,
  TaskStatus,
} from '@/types'

type TypedSupabaseClient = SupabaseClient<Database>

// =====================================================
// PROFILE QUERIES
// =====================================================

/**
 * Get the current user's profile
 */
export async function getCurrentProfile(
  supabase: TypedSupabaseClient
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .single()

  if (error || !data) return null
  return toProfile(data)
}

/**
 * Get a profile by user ID
 */
export async function getProfileById(
  supabase: TypedSupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return toProfile(data)
}

/**
 * Update the current user's profile
 */
export async function updateProfile(
  supabase: TypedSupabaseClient,
  updates: { full_name?: string; avatar_url?: string }
): Promise<Profile | null> {
  const user = await supabase.auth.getUser()
  if (!user.data.user) return null

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.data.user.id)
    .select()
    .single()

  if (error || !data) return null
  return toProfile(data)
}

// =====================================================
// PROJECT QUERIES
// =====================================================

/**
 * Get all projects for the current user
 */
export async function getProjects(
  supabase: TypedSupabaseClient,
  options?: { sort?: SortOptions }
): Promise<Project[]> {
  let query = supabase.from('projects').select('*')

  if (options?.sort) {
    query = query.order(options.sort.field, { ascending: options.sort.direction === 'asc' })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query

  if (error || !data) return []
  return data.map(toProject)
}

/**
 * Get a single project by ID
 */
export async function getProjectById(
  supabase: TypedSupabaseClient,
  projectId: string
): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (error || !data) return null
  return toProject(data)
}

/**
 * Create a new project
 */
export async function createProject(
  supabase: TypedSupabaseClient,
  project: Omit<ProjectInsert, 'user_id'>
): Promise<Project | null> {
  const user = await supabase.auth.getUser()
  if (!user.data.user) return null

  const { data, error } = await supabase
    .from('projects')
    .insert({ ...project, user_id: user.data.user.id })
    .select()
    .single()

  if (error || !data) return null
  return toProject(data)
}

/**
 * Update a project
 */
export async function updateProject(
  supabase: TypedSupabaseClient,
  projectId: string,
  updates: ProjectUpdate
): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single()

  if (error || !data) return null
  return toProject(data)
}

/**
 * Delete a project
 */
export async function deleteProject(
  supabase: TypedSupabaseClient,
  projectId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  return !error
}

/**
 * Get projects with task counts
 */
export async function getProjectsWithStats(
  supabase: TypedSupabaseClient
): Promise<Array<Project & { taskCount: number; completedTaskCount: number }>> {
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (projectsError || !projects) return []

  // Get task counts for each project
  const projectsWithStats = await Promise.all(
    projects.map(async (project) => {
      const { count: totalCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', project.id)

      const { count: completedCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', project.id)
        .eq('status', 'completed')

      return {
        ...toProject(project),
        taskCount: totalCount || 0,
        completedTaskCount: completedCount || 0,
      }
    })
  )

  return projectsWithStats
}

// =====================================================
// CHAT MESSAGE QUERIES
// =====================================================

/**
 * Get all messages for a project
 */
export async function getProjectMessages(
  supabase: TypedSupabaseClient,
  projectId: string,
  limit?: number
): Promise<ChatMessage[]> {
  let query = supabase
    .from('chat_messages')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error || !data) return []
  return data.map(toChatMessage)
}

/**
 * Create a new chat message
 */
export async function createChatMessage(
  supabase: TypedSupabaseClient,
  message: Omit<ChatMessageInsert, 'user_id'>
): Promise<ChatMessage | null> {
  const user = await supabase.auth.getUser()
  if (!user.data.user) return null

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ ...message, user_id: user.data.user.id })
    .select()
    .single()

  if (error || !data) return null
  return toChatMessage(data)
}

/**
 * Delete a chat message
 */
export async function deleteChatMessage(
  supabase: TypedSupabaseClient,
  messageId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('id', messageId)

  return !error
}

/**
 * Delete all messages for a project
 */
export async function deleteProjectMessages(
  supabase: TypedSupabaseClient,
  projectId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('project_id', projectId)

  return !error
}

// =====================================================
// TASK QUERIES
// =====================================================

/**
 * Get all tasks for a project
 */
export async function getProjectTasks(
  supabase: TypedSupabaseClient,
  projectId: string,
  filters?: TaskFilters,
  sort?: SortOptions
): Promise<Task[]> {
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)

  // Apply filters
  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    } else {
      query = query.eq('status', filters.status)
    }
  }

  if (filters?.priority) {
    if (Array.isArray(filters.priority)) {
      query = query.in('priority', filters.priority)
    } else {
      query = query.eq('priority', filters.priority)
    }
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  // Apply sorting
  if (sort) {
    query = query.order(sort.field, { ascending: sort.direction === 'asc' })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query

  if (error || !data) return []
  return data.map(toTask)
}

/**
 * Get a single task by ID
 */
export async function getTaskById(
  supabase: TypedSupabaseClient,
  taskId: string
): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (error || !data) return null
  return toTask(data)
}

/**
 * Create a new task
 */
export async function createTask(
  supabase: TypedSupabaseClient,
  task: TaskInsert
): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single()

  if (error || !data) return null
  return toTask(data)
}

/**
 * Update a task
 */
export async function updateTask(
  supabase: TypedSupabaseClient,
  taskId: string,
  updates: TaskUpdate
): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single()

  if (error || !data) return null
  return toTask(data)
}

/**
 * Delete a task
 */
export async function deleteTask(
  supabase: TypedSupabaseClient,
  taskId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  return !error
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  supabase: TypedSupabaseClient,
  taskId: string,
  status: TaskStatus
): Promise<Task | null> {
  const updates: TaskUpdate = { status }

  if (status === TaskStatus.COMPLETED) {
    updates.implemented_at = new Date().toISOString()
  }

  return updateTask(supabase, taskId, updates)
}

/**
 * Get tasks by status
 */
export async function getTasksByStatus(
  supabase: TypedSupabaseClient,
  projectId: string,
  status: TaskStatus
): Promise<Task[]> {
  return getProjectTasks(supabase, projectId, { status })
}

/**
 * Get pending tasks for a project
 */
export async function getPendingTasks(
  supabase: TypedSupabaseClient,
  projectId: string
): Promise<Task[]> {
  return getTasksByStatus(supabase, projectId, TaskStatus.PENDING)
}

/**
 * Get completed tasks for a project
 */
export async function getCompletedTasks(
  supabase: TypedSupabaseClient,
  projectId: string
): Promise<Task[]> {
  return getTasksByStatus(supabase, projectId, TaskStatus.COMPLETED)
}

// =====================================================
// TASK EXECUTION QUERIES
// =====================================================

/**
 * Get all executions for a task
 */
export async function getTaskExecutions(
  supabase: TypedSupabaseClient,
  taskId: string
): Promise<TaskExecution[]> {
  const { data, error } = await supabase
    .from('task_executions')
    .select('*')
    .eq('task_id', taskId)
    .order('executed_at', { ascending: false })

  if (error || !data) return []
  return data.map(toTaskExecution)
}

/**
 * Get a single execution by ID
 */
export async function getTaskExecutionById(
  supabase: TypedSupabaseClient,
  executionId: string
): Promise<TaskExecution | null> {
  const { data, error } = await supabase
    .from('task_executions')
    .select('*')
    .eq('id', executionId)
    .single()

  if (error || !data) return null
  return toTaskExecution(data)
}

/**
 * Create a new task execution
 */
export async function createTaskExecution(
  supabase: TypedSupabaseClient,
  execution: Omit<TaskExecutionInsert, 'executed_by'>
): Promise<TaskExecution | null> {
  const user = await supabase.auth.getUser()
  if (!user.data.user) return null

  const { data, error } = await supabase
    .from('task_executions')
    .insert({ ...execution, executed_by: user.data.user.id })
    .select()
    .single()

  if (error || !data) return null
  return toTaskExecution(data)
}

/**
 * Update a task execution
 */
export async function updateTaskExecution(
  supabase: TypedSupabaseClient,
  executionId: string,
  updates: TaskExecutionUpdate
): Promise<TaskExecution | null> {
  const { data, error } = await supabase
    .from('task_executions')
    .update(updates)
    .eq('id', executionId)
    .select()
    .single()

  if (error || !data) return null
  return toTaskExecution(data)
}

/**
 * Delete a task execution
 */
export async function deleteTaskExecution(
  supabase: TypedSupabaseClient,
  executionId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('task_executions')
    .delete()
    .eq('id', executionId)

  return !error
}

/**
 * Get the latest execution for a task
 */
export async function getLatestTaskExecution(
  supabase: TypedSupabaseClient,
  taskId: string
): Promise<TaskExecution | null> {
  const { data, error } = await supabase
    .from('task_executions')
    .select('*')
    .eq('task_id', taskId)
    .order('executed_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null
  return toTaskExecution(data)
}

// =====================================================
// BATCH OPERATIONS
// =====================================================

/**
 * Create multiple tasks at once
 */
export async function createTasksBatch(
  supabase: TypedSupabaseClient,
  tasks: TaskInsert[]
): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .insert(tasks)
    .select()

  if (error || !data) return []
  return data.map(toTask)
}

/**
 * Update multiple tasks at once
 */
export async function updateTasksBatch(
  supabase: TypedSupabaseClient,
  taskIds: string[],
  updates: TaskUpdate
): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .in('id', taskIds)
    .select()

  if (error || !data) return []
  return data.map(toTask)
}

/**
 * Delete multiple tasks at once
 */
export async function deleteTasksBatch(
  supabase: TypedSupabaseClient,
  taskIds: string[]
): Promise<boolean> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .in('id', taskIds)

  return !error
}

// =====================================================
// STATISTICS QUERIES
// =====================================================

/**
 * Get task statistics for a project
 */
export async function getProjectTaskStats(
  supabase: TypedSupabaseClient,
  projectId: string
): Promise<{
  total: number
  pending: number
  inProgress: number
  completed: number
  failed: number
  blocked: number
}> {
  const { data, error } = await supabase
    .from('tasks')
    .select('status')
    .eq('project_id', projectId)

  if (error || !data) {
    return {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      failed: 0,
      blocked: 0,
    }
  }

  const stats = {
    total: data.length,
    pending: data.filter((t) => t.status === TaskStatus.PENDING).length,
    inProgress: data.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
    completed: data.filter((t) => t.status === TaskStatus.COMPLETED).length,
    failed: data.filter((t) => t.status === TaskStatus.FAILED).length,
    blocked: data.filter((t) => t.status === TaskStatus.BLOCKED).length,
  }

  return stats
}

/**
 * Get overall user statistics
 */
export async function getUserStats(
  supabase: TypedSupabaseClient
): Promise<{
  projectCount: number
  totalTasks: number
  completedTasks: number
  pendingTasks: number
}> {
  const user = await supabase.auth.getUser()
  if (!user.data.user) {
    return {
      projectCount: 0,
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
    }
  }

  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.data.user.id)

  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', user.data.user.id)

  if (!projects) {
    return {
      projectCount: projectCount || 0,
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
    }
  }

  const projectIds = projects.map((p) => p.id)

  const { count: totalTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .in('project_id', projectIds)

  const { count: completedTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .in('project_id', projectIds)
    .eq('status', TaskStatus.COMPLETED)

  const { count: pendingTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .in('project_id', projectIds)
    .eq('status', TaskStatus.PENDING)

  return {
    projectCount: projectCount || 0,
    totalTasks: totalTasks || 0,
    completedTasks: completedTasks || 0,
    pendingTasks: pendingTasks || 0,
  }
}
