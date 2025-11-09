/**
 * ProjectContext
 * Global state management for projects
 */

'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { Project } from '@/types'

interface ProjectContextType {
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  error: string | null
  fetchProjects: () => Promise<void>
  fetchProject: (id: string) => Promise<void>
  setCurrentProject: (project: Project | null) => void
  refreshProjects: () => Promise<void>
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

interface ProjectProviderProps {
  children: React.ReactNode
  initialProjects?: Project[]
}

export function ProjectProvider({ children, initialProjects = [] }: ProjectProviderProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/projects')
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to fetch projects')
      }

      setProjects(result.data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch projects'
      setError(message)
      console.error('Error fetching projects:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchProject = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/projects/${id}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to fetch project')
      }

      setCurrentProject(result.data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch project'
      setError(message)
      console.error('Error fetching project:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshProjects = useCallback(async () => {
    await fetchProjects()
  }, [fetchProjects])

  const value: ProjectContextType = {
    projects,
    currentProject,
    isLoading,
    error,
    fetchProjects,
    fetchProject,
    setCurrentProject,
    refreshProjects,
  }

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjectContext() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider')
  }
  return context
}
