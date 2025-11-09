/**
 * Project Dashboard Page
 * Main project page with stats and overview
 */

import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { getProjectById, getProjectTaskStats } from '@/lib/supabase/queries'
import { Button } from '@/components/ui/button'
import { ProjectStats } from '@/components/projects'
import { Settings, MessageSquare, ListTodo, ArrowLeft } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerClient()
  const project = await getProjectById(supabase, id)

  return {
    title: project ? `${project.name} - Project Dashboard` : 'Project Not Found',
    description: project?.description || 'Project dashboard and overview',
  }
}

export default async function ProjectDashboardPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Get project
  const project = await getProjectById(supabase, id)
  if (!project) {
    notFound()
  }

  // Verify ownership
  if (project.userId !== user.id) {
    notFound()
  }

  // Get project stats
  const stats = await getProjectTaskStats(supabase, id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/projects/${id}/settings`}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">
            <ListTodo className="mr-2 h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ProjectStats project={project} stats={stats} />
        </TabsContent>

        <TabsContent value="tasks">
          <div className="text-center py-12 text-muted-foreground">
            <ListTodo className="h-12 w-12 mx-auto mb-4" />
            <p>Task management interface coming soon...</p>
            <p className="text-sm mt-2">
              This will show all tasks for this project with filtering and sorting options.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="chat">
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4" />
            <p>Chat interface coming soon...</p>
            <p className="text-sm mt-2">
              This will allow you to have AI-assisted conversations about your project.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
