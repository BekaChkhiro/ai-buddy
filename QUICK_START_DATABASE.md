# Quick Start: Database Setup

This guide will help you get started with the Supabase database schema that has been created for your Claude Project Manager application.

## Files Created

### 1. Migration File

- **Location**: `/supabase/migrations/001_initial_schema.sql`
- **Purpose**: Database schema with all tables, indexes, RLS policies, and triggers

### 2. TypeScript Types

- **Location**: `/src/types/database.ts`
- **Purpose**: Low-level database types matching the SQL schema

### 3. Application Types

- **Location**: `/src/types/index.ts`
- **Purpose**: Clean, application-friendly interfaces and enums

### 4. Query Helpers

- **Location**: `/src/lib/supabase/queries.ts`
- **Purpose**: Pre-built functions for common database operations

### 5. Documentation

- **Location**: `/DATABASE_SCHEMA.md`
- **Purpose**: Comprehensive documentation of schema, types, and usage

## Quick Setup Steps

### Step 1: Run the Migration

Choose one of these methods:

**Method A: Using Supabase CLI (Recommended)**

```bash
# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
supabase db push
```

**Method B: Using Supabase Dashboard**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Copy contents of `/supabase/migrations/001_initial_schema.sql`
5. Paste and run

### Step 2: Verify Tables Created

In Supabase Dashboard > Table Editor, you should see:

- ✅ profiles
- ✅ projects
- ✅ chat_messages
- ✅ tasks
- ✅ task_executions

### Step 3: Test RLS Policies

Try inserting data through the dashboard to verify RLS policies work correctly.

## Quick Usage Examples

### Import the Query Helpers

```typescript
import { createServerClient } from "@/lib/supabase/server";
import { getProjects, createProject, getProjectTasks, createTask } from "@/lib/supabase/queries";
import { TaskStatus, TaskPriority } from "@/types";
```

### Create a Project

```typescript
const supabase = await createServerClient();

const project = await createProject(supabase, {
  name: "My Awesome Project",
  description: "Building something cool",
  tech_stack: ["Next.js", "TypeScript", "Supabase"],
  folder_path: "/path/to/project",
});
```

### Get All Projects

```typescript
const projects = await getProjects(supabase);
```

### Create a Task

```typescript
const task = await createTask(supabase, {
  project_id: projectId,
  title: "Implement authentication",
  description: "Add login and signup pages",
  status: TaskStatus.PENDING,
  priority: TaskPriority.HIGH,
});
```

### Get Project Tasks

```typescript
// Get all tasks
const tasks = await getProjectTasks(supabase, projectId);

// Get with filters
const highPriorityTasks = await getProjectTasks(supabase, projectId, {
  priority: TaskPriority.HIGH,
  status: TaskStatus.PENDING,
});
```

### Update Task Status

```typescript
import { updateTaskStatus } from "@/lib/supabase/queries";

await updateTaskStatus(supabase, taskId, TaskStatus.COMPLETED);
```

### Create Chat Message

```typescript
import { createChatMessage } from "@/lib/supabase/queries";
import { MessageRole } from "@/types";

const message = await createChatMessage(supabase, {
  project_id: projectId,
  role: MessageRole.USER,
  content: "Hello, how can I help with this project?",
});
```

### Get Project Statistics

```typescript
import { getProjectTaskStats, getUserStats } from "@/lib/supabase/queries";

// Get stats for specific project
const projectStats = await getProjectTaskStats(supabase, projectId);
console.log(projectStats);
// {
//   total: 10,
//   pending: 3,
//   inProgress: 2,
//   completed: 5,
//   failed: 0,
//   blocked: 0
// }

// Get overall user stats
const userStats = await getUserStats(supabase);
console.log(userStats);
// {
//   projectCount: 5,
//   totalTasks: 50,
//   completedTasks: 30,
//   pendingTasks: 15
// }
```

## Common Patterns

### Server Component (Recommended)

```typescript
import { createServerClient } from '@/lib/supabase/server'
import { getProjects } from '@/lib/supabase/queries'

export default async function ProjectsPage() {
  const supabase = await createServerClient()
  const projects = await getProjects(supabase)

  return (
    <div>
      <h1>My Projects</h1>
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}
```

### Client Component

```typescript
'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { getProjectTasks } from '@/lib/supabase/queries'
import type { Task } from '@/types'

export default function TaskList({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const supabase = createBrowserClient()

  useEffect(() => {
    loadTasks()
  }, [projectId])

  async function loadTasks() {
    const data = await getProjectTasks(supabase, projectId)
    setTasks(data)
  }

  return (
    <div>
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  )
}
```

### API Route

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
    tech_stack: body.techStack || [],
  });

  if (!project) {
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }

  return NextResponse.json({ project }, { status: 201 });
}
```

## Database Schema Overview

### profiles

- User profile information
- Auto-created on signup via trigger
- Fields: id, email, full_name, avatar_url, created_at

### projects

- User projects with metadata
- Fields: id, name, description, folder_path, tech_stack[], user_id, created_at, updated_at

### chat_messages

- Chat messages for each project
- Fields: id, project_id, role (user/assistant/system), content, created_at, user_id

### tasks

- Tasks within projects
- Fields: id, project_id, title, description, status, priority, implementation_details, created_at, updated_at, implemented_at, implementation_log

### task_executions

- Execution history for tasks
- Fields: id, task_id, status, changes, error_log, executed_at, executed_by

## Available Enums

```typescript
import { TaskStatus, TaskPriority, MessageRole, ExecutionStatus } from "@/types";

// TaskStatus values:
TaskStatus.PENDING;
TaskStatus.IN_PROGRESS;
TaskStatus.COMPLETED;
TaskStatus.FAILED;
TaskStatus.BLOCKED;

// TaskPriority values:
TaskPriority.LOW;
TaskPriority.MEDIUM;
TaskPriority.HIGH;
TaskPriority.URGENT;

// MessageRole values:
MessageRole.USER;
MessageRole.ASSISTANT;
MessageRole.SYSTEM;

// ExecutionStatus values:
ExecutionStatus.RUNNING;
ExecutionStatus.SUCCESS;
ExecutionStatus.FAILED;
ExecutionStatus.CANCELLED;
```

## Next Steps

1. ✅ Run the migration to create tables
2. ✅ Test by creating a project through Supabase dashboard
3. ✅ Build your first page using the query helpers
4. ✅ Implement authentication pages
5. ✅ Create project management UI
6. ✅ Add task tracking features
7. ✅ Implement chat interface

## Helpful Resources

- **Full Documentation**: See `/DATABASE_SCHEMA.md`
- **Type Definitions**: See `/src/types/index.ts`
- **Query Helpers**: See `/src/lib/supabase/queries.ts`
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs

## Troubleshooting

**Problem**: "Cannot find module '@/types'"

- **Solution**: Make sure TypeScript paths are configured correctly in `tsconfig.json`

**Problem**: "Permission denied" when querying

- **Solution**: Ensure user is authenticated and owns the resource (RLS policies are strict)

**Problem**: Type errors in queries

- **Solution**: Run `npm run type-check` to find issues

**Problem**: Migration fails

- **Solution**: Check if tables already exist, drop them first or use a new database

## Support

For detailed information about:

- **Schema structure** → See `/DATABASE_SCHEMA.md`
- **RLS policies** → See `/DATABASE_SCHEMA.md` (Row Level Security section)
- **All available queries** → See `/src/lib/supabase/queries.ts`
- **Type definitions** → See `/src/types/index.ts`

---

**Status**: ✅ All files created, TypeScript type checking passed

You're ready to start building! 🚀
