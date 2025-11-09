/**
 * Chat Page
 * Project chat interface with split view
 */

import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { getProjectById } from '@/lib/supabase/queries'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { Loader2 } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'

interface ChatPageProps {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    conversation?: string
  }>
}

export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const supabase = await createServerClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get project
  const project = await getProjectById(supabase, resolvedParams.id)

  if (!project) {
    notFound()
  }

  // Verify ownership
  if (project.userId !== user.id) {
    redirect('/projects')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Page header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Chat Assistant</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Get AI-powered help for {project.name}
            </p>
          </div>
        </div>
      </div>

      {/* Chat interface */}
      <div className="flex-1 overflow-hidden">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <ChatInterface
            projectId={resolvedParams.id}
            conversationId={resolvedSearchParams.conversation}
            showSidebar={true}
          />
        </Suspense>
      </div>
    </div>
  )
}

// Metadata
export async function generateMetadata({ params }: ChatPageProps) {
  const resolvedParams = await params
  const supabase = await createServerClient()
  const project = await getProjectById(supabase, resolvedParams.id)

  return {
    title: project ? `Chat - ${project.name}` : 'Chat',
    description: 'AI-powered chat assistant for your project',
  }
}
