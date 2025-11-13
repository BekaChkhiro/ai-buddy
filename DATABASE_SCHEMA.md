# Database Schema Documentation

This document describes the database schema, TypeScript types, and query helpers for the Claude Project Manager application.

## Table of Contents

- [Schema Overview](#schema-overview)
- [Tables](#tables)
- [Row Level Security (RLS)](#row-level-security-rls)
- [TypeScript Types](#typescript-types)
- [Query Helpers](#query-helpers)
- [Usage Examples](#usage-examples)

## Schema Overview

The database consists of 5 main tables:

1. **profiles** - User profile information
2. **projects** - User projects with metadata
3. **chat_messages** - Chat messages for each project
4. **tasks** - Tasks within projects
5. **task_executions** - Execution history for tasks

All tables have Row Level Security (RLS) enabled to ensure users can only access their own data.

## Tables

### profiles

Stores user profile information, synchronized with Supabase Auth.

| Column     | Type        | Description                            |
| ---------- | ----------- | -------------------------------------- |
| id         | UUID        | Primary key, references auth.users(id) |
| email      | TEXT        | User's email address (unique)          |
| full_name  | TEXT        | User's full name                       |
| avatar_url | TEXT        | URL to user's avatar image             |
| created_at | TIMESTAMPTZ | Profile creation timestamp             |

**Indexes:**

- Primary key on `id`

**Triggers:**

- Automatically creates a profile when a user signs up via `on_auth_user_created` trigger

### projects

Stores user projects with metadata and tech stack information.

| Column      | Type        | Description                          |
| ----------- | ----------- | ------------------------------------ |
| id          | UUID        | Primary key                          |
| name        | TEXT        | Project name                         |
| description | TEXT        | Project description                  |
| folder_path | TEXT        | Path to project folder on filesystem |
| tech_stack  | TEXT[]      | Array of technologies used           |
| user_id     | UUID        | Foreign key to profiles(id)          |
| created_at  | TIMESTAMPTZ | Creation timestamp                   |
| updated_at  | TIMESTAMPTZ | Last update timestamp                |

**Indexes:**

- Primary key on `id`
- Index on `user_id` for faster user-based queries
- Index on `created_at` (descending) for recent projects

**Triggers:**

- Updates `updated_at` automatically on row update

### chat_messages

Stores chat messages for project conversations.

| Column     | Type        | Description                                    |
| ---------- | ----------- | ---------------------------------------------- |
| id         | UUID        | Primary key                                    |
| project_id | UUID        | Foreign key to projects(id)                    |
| role       | TEXT        | Message role: 'user', 'assistant', or 'system' |
| content    | TEXT        | Message content                                |
| created_at | TIMESTAMPTZ | Message timestamp                              |
| user_id    | UUID        | Foreign key to profiles(id)                    |

**Indexes:**

- Primary key on `id`
- Index on `project_id` for project-based queries
- Index on `created_at` (descending) for message history
- Index on `user_id` for user-based queries

**Constraints:**

- `role` must be one of: 'user', 'assistant', 'system'

### tasks

Stores tasks for projects with status and priority tracking.

| Column                 | Type        | Description                         |
| ---------------------- | ----------- | ----------------------------------- |
| id                     | UUID        | Primary key                         |
| project_id             | UUID        | Foreign key to projects(id)         |
| title                  | TEXT        | Task title                          |
| description            | TEXT        | Task description                    |
| status                 | TEXT        | Task status (see below)             |
| priority               | TEXT        | Task priority (see below)           |
| implementation_details | JSONB       | Additional implementation details   |
| created_at             | TIMESTAMPTZ | Creation timestamp                  |
| updated_at             | TIMESTAMPTZ | Last update timestamp               |
| implemented_at         | TIMESTAMPTZ | Implementation completion timestamp |
| implementation_log     | TEXT        | Log of implementation process       |

**Status values:**

- `pending` - Task not started
- `in_progress` - Task is being worked on
- `completed` - Task is finished
- `failed` - Task failed
- `blocked` - Task is blocked

**Priority values:**

- `low` - Low priority
- `medium` - Medium priority (default)
- `high` - High priority
- `urgent` - Urgent priority

**Indexes:**

- Primary key on `id`
- Index on `project_id` for project-based queries
- Index on `status` for filtering by status
- Index on `priority` for filtering by priority
- Index on `created_at` (descending) for recent tasks

**Triggers:**

- Updates `updated_at` automatically on row update

### task_executions

Stores execution history for tasks.

| Column      | Type        | Description                   |
| ----------- | ----------- | ----------------------------- |
| id          | UUID        | Primary key                   |
| task_id     | UUID        | Foreign key to tasks(id)      |
| status      | TEXT        | Execution status (see below)  |
| changes     | JSONB       | Details of changes made       |
| error_log   | TEXT        | Error log if execution failed |
| executed_at | TIMESTAMPTZ | Execution timestamp           |
| executed_by | UUID        | Foreign key to profiles(id)   |

**Status values:**

- `running` - Execution in progress (default)
- `success` - Execution completed successfully
- `failed` - Execution failed
- `cancelled` - Execution was cancelled

**Indexes:**

- Primary key on `id`
- Index on `task_id` for task-based queries
- Index on `status` for filtering by status
- Index on `executed_at` (descending) for execution history
- Index on `executed_by` for user-based queries

## Row Level Security (RLS)

All tables have RLS policies that ensure users can only access their own data.

### profiles

- Users can view, insert, and update their own profile only

### projects

- Users can view, insert, update, and delete their own projects only

### chat_messages

- Users can view, insert, update, and delete their own messages only

### tasks

- Access is controlled through project ownership
- Users can perform all operations on tasks belonging to their projects

### task_executions

- Access is controlled through task → project ownership
- Users can perform all operations on executions belonging to their tasks

## TypeScript Types

### Database Types (`types/database.ts`)

Generated from the SQL schema, provides low-level database types:

```typescript
import { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
```

### Application Types (`types/index.ts`)

Clean, application-friendly interfaces:

```typescript
import {
  Profile,
  Project,
  Task,
  ChatMessage,
  TaskExecution,
  TaskStatus,
  TaskPriority,
  MessageRole,
} from "@/types";
```

**Enums:**

- `TaskStatus` - pending, in_progress, completed, failed, blocked
- `TaskPriority` - low, medium, high, urgent
- `MessageRole` - user, assistant, system
- `ExecutionStatus` - running, success, failed, cancelled

**Conversion Functions:**
Convert database rows to application interfaces:

- `toProfile(row: ProfileRow): Profile`
- `toProject(row: ProjectRow): Project`
- `toTask(row: TaskRow): Task`
- `toChatMessage(row: ChatMessageRow): ChatMessage`
- `toTaskExecution(row: TaskExecutionRow): TaskExecution`

## Query Helpers

All query helpers are located in `src/lib/supabase/queries.ts`.

### Profile Queries

```typescript
// Get current user's profile
const profile = await getCurrentProfile(supabase);

// Get profile by ID
const profile = await getProfileById(supabase, userId);

// Update profile
const updated = await updateProfile(supabase, {
  full_name: "John Doe",
  avatar_url: "https://example.com/avatar.jpg",
});
```

### Project Queries

```typescript
// Get all projects
const projects = await getProjects(supabase);

// Get projects with sorting
const projects = await getProjects(supabase, {
  sort: { field: "name", direction: "asc" },
});

// Get single project
const project = await getProjectById(supabase, projectId);

// Create project
const project = await createProject(supabase, {
  name: "My Project",
  description: "A cool project",
  tech_stack: ["React", "TypeScript", "Supabase"],
});

// Update project
const updated = await updateProject(supabase, projectId, {
  name: "Updated Name",
});

// Delete project
const success = await deleteProject(supabase, projectId);

// Get projects with stats
const projects = await getProjectsWithStats(supabase);
// Returns: { ...project, taskCount: 10, completedTaskCount: 5 }
```

### Chat Message Queries

```typescript
// Get all messages for a project
const messages = await getProjectMessages(supabase, projectId);

// Get limited messages
const messages = await getProjectMessages(supabase, projectId, 50);

// Create message
const message = await createChatMessage(supabase, {
  project_id: projectId,
  role: MessageRole.USER,
  content: "Hello, Claude!",
});

// Delete message
const success = await deleteChatMessage(supabase, messageId);

// Delete all project messages
const success = await deleteProjectMessages(supabase, projectId);
```

### Task Queries

```typescript
// Get all tasks for a project
const tasks = await getProjectTasks(supabase, projectId);

// Get tasks with filters
const tasks = await getProjectTasks(supabase, projectId, {
  status: TaskStatus.PENDING,
  priority: TaskPriority.HIGH,
  search: "bug fix",
});

// Get tasks with sorting
const tasks = await getProjectTasks(supabase, projectId, null, {
  field: "priority",
  direction: "desc",
});

// Get single task
const task = await getTaskById(supabase, taskId);

// Create task
const task = await createTask(supabase, {
  project_id: projectId,
  title: "Fix authentication bug",
  description: "Users cannot log in",
  status: TaskStatus.PENDING,
  priority: TaskPriority.HIGH,
});

// Update task
const updated = await updateTask(supabase, taskId, {
  status: TaskStatus.COMPLETED,
  implementation_log: "Fixed by updating auth middleware",
});

// Update task status
const updated = await updateTaskStatus(supabase, taskId, TaskStatus.COMPLETED);

// Delete task
const success = await deleteTask(supabase, taskId);

// Get pending tasks
const pending = await getPendingTasks(supabase, projectId);

// Get completed tasks
const completed = await getCompletedTasks(supabase, projectId);
```

### Task Execution Queries

```typescript
// Get all executions for a task
const executions = await getTaskExecutions(supabase, taskId);

// Get single execution
const execution = await getTaskExecutionById(supabase, executionId);

// Create execution
const execution = await createTaskExecution(supabase, {
  task_id: taskId,
  status: ExecutionStatus.RUNNING,
  changes: { files_modified: ["src/auth.ts"] },
});

// Update execution
const updated = await updateTaskExecution(supabase, executionId, {
  status: ExecutionStatus.SUCCESS,
  changes: { files_modified: ["src/auth.ts", "src/middleware.ts"] },
});

// Delete execution
const success = await deleteTaskExecution(supabase, executionId);

// Get latest execution
const latest = await getLatestTaskExecution(supabase, taskId);
```

### Batch Operations

```typescript
// Create multiple tasks
const tasks = await createTasksBatch(supabase, [
  { project_id: projectId, title: 'Task 1', ... },
  { project_id: projectId, title: 'Task 2', ... }
])

// Update multiple tasks
const updated = await updateTasksBatch(
  supabase,
  [taskId1, taskId2],
  { status: TaskStatus.COMPLETED }
)

// Delete multiple tasks
const success = await deleteTasksBatch(supabase, [taskId1, taskId2])
```

### Statistics Queries

```typescript
// Get task stats for a project
const stats = await getProjectTaskStats(supabase, projectId);
// Returns: {
//   total: 10,
//   pending: 3,
//   inProgress: 2,
//   completed: 4,
//   failed: 1,
//   blocked: 0
// }

// Get user's overall stats
const stats = await getUserStats(supabase);
// Returns: {
//   projectCount: 5,
//   totalTasks: 50,
//   completedTasks: 30,
//   pendingTasks: 15
// }
```

## Usage Examples

### Server Component Example

```typescript
import { createServerClient } from '@/lib/supabase/server'
import { getProjects, getProjectTasks } from '@/lib/supabase/queries'

export default async function ProjectsPage() {
  const supabase = await createServerClient()
  const projects = await getProjects(supabase)

  return (
    <div>
      {projects.map(project => (
        <div key={project.id}>
          <h2>{project.name}</h2>
          <p>{project.description}</p>
        </div>
      ))}
    </div>
  )
}
```

### Client Component Example

```typescript
'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { getProjectTasks, createTask } from '@/lib/supabase/queries'
import { Task, TaskStatus, TaskPriority } from '@/types'

export default function TaskList({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const supabase = createBrowserClient()

  useEffect(() => {
    loadTasks()
  }, [projectId])

  async function loadTasks() {
    const tasks = await getProjectTasks(supabase, projectId)
    setTasks(tasks)
  }

  async function handleCreateTask() {
    await createTask(supabase, {
      project_id: projectId,
      title: 'New Task',
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM
    })
    loadTasks()
  }

  return (
    <div>
      <button onClick={handleCreateTask}>Create Task</button>
      {tasks.map(task => (
        <div key={task.id}>
          <h3>{task.title}</h3>
          <span>{task.status}</span>
        </div>
      ))}
    </div>
  )
}
```

### API Route Example

```typescript
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createProject } from "@/lib/supabase/queries";

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const body = await request.json();

  const project = await createProject(supabase, {
    name: body.name,
    description: body.description,
    tech_stack: body.techStack,
  });

  if (!project) {
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }

  return NextResponse.json({ project });
}
```

## Running Migrations

To apply the database schema to your Supabase project:

### Option 1: Using Supabase CLI (Recommended)

```bash
# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and run the SQL

### Option 3: Using Database URL

```bash
psql YOUR_DATABASE_URL < supabase/migrations/001_initial_schema.sql
```

## Generating TypeScript Types from Database

After running migrations, you can generate TypeScript types:

```bash
# Generate types (requires Supabase CLI)
npm run types:supabase
```

This will update `src/types/supabase.ts` with the latest database schema.

## Best Practices

1. **Always use query helpers** instead of raw Supabase queries for consistency
2. **Use TypeScript interfaces** from `types/index.ts` in your application code
3. **Let RLS handle security** - don't add additional user ID checks in queries
4. **Use batch operations** when creating/updating multiple records
5. **Use conversion functions** to transform database rows to application interfaces
6. **Keep implementation_details as JSONB** for flexible task metadata
7. **Log executions** for debugging and audit trails

## Troubleshooting

### RLS Policy Issues

If you get permission denied errors:

1. Ensure the user is authenticated
2. Check that RLS policies are enabled
3. Verify the user owns the resource

### Type Errors

If you get TypeScript errors:

1. Run `npm run types:supabase` to regenerate types
2. Ensure imports are from the correct paths
3. Check that conversion functions are used

### Migration Errors

If migrations fail:

1. Check for existing tables with the same names
2. Verify UUID extension is installed
3. Ensure you have proper database permissions
