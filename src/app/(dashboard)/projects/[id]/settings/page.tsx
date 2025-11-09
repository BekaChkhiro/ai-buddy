/**
 * Project Settings Page
 * Edit project details and manage project
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProjectForm, DeleteProjectDialog } from '@/components/projects'
import { useToast } from '@/hooks/use-toast'
import { Project, UpdateProjectForm } from '@/types'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

type Props = {
  params: Promise<{ id: string }>
}

export default function ProjectSettingsPage({ params }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [projectId, setProjectId] = useState<string>('')
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Unwrap params
  useEffect(() => {
    params.then((p) => setProjectId(p.id))
  }, [params])

  // Fetch project data
  useEffect(() => {
    if (!projectId) return

    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`)
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error?.message || 'Failed to fetch project')
        }

        setProject(result.data)
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load project',
          variant: 'destructive',
        })
        router.push('/projects')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProject()
  }, [projectId, router, toast])

  const handleUpdate = async (data: UpdateProjectForm) => {
    if (!projectId) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to update project')
      }

      setProject(result.data)
      toast({
        title: 'Project updated',
        description: 'Your changes have been saved successfully.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update project',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!projectId) return

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to delete project')
      }

      toast({
        title: 'Project deleted',
        description: 'The project has been permanently deleted.',
      })

      router.push('/projects')
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete project',
        variant: 'destructive',
      })
    }
  }

  const handleCancel = () => {
    router.push(`/projects/${projectId}`)
  }

  if (isLoading || !projectId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-96 w-full max-w-3xl" />
      </div>
    )
  }

  if (!project) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Settings</h1>
          <p className="text-muted-foreground">
            Manage your project settings and preferences
          </p>
        </div>
      </div>

      {/* Settings Form */}
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Update your project information and configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm
            project={project}
            onSubmit={handleUpdate}
            onCancel={handleCancel}
            isLoading={isSaving}
          />
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="max-w-3xl border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that will permanently affect your project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Delete this project</h3>
              <p className="text-sm text-muted-foreground">
                Once you delete a project, there is no going back. Please be certain.
              </p>
            </div>
            <DeleteProjectDialog
              project={project}
              onConfirm={handleDelete}
              open={showDeleteDialog}
              onOpenChange={setShowDeleteDialog}
              trigger={
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Project
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
