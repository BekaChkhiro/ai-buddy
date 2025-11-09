/**
 * ProjectStats Component
 * Display project statistics and metrics
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Circle, Clock, XCircle, AlertCircle } from 'lucide-react'
import { Project } from '@/types'

interface ProjectStatsProps {
  project: Project
  stats: {
    total: number
    pending: number
    inProgress: number
    completed: number
    failed: number
    blocked: number
  }
}

export function ProjectStats({ project, stats }: ProjectStatsProps) {
  const completionRate = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0

  const statItems = [
    {
      label: 'Total Tasks',
      value: stats.total,
      icon: Circle,
      color: 'text-muted-foreground'
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle2,
      color: 'text-green-600'
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      icon: Clock,
      color: 'text-blue-600'
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Circle,
      color: 'text-yellow-600'
    },
    {
      label: 'Failed',
      value: stats.failed,
      icon: XCircle,
      color: 'text-red-600'
    },
    {
      label: 'Blocked',
      value: stats.blocked,
      icon: AlertCircle,
      color: 'text-orange-600'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Completion Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Project Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completion Rate</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{stats.completed} completed</span>
              <span>{stats.total} total</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statItems.map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="text-2xl font-bold mt-2">{item.value}</p>
                </div>
                <item.icon className={`h-8 w-8 ${item.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tech Stack */}
      {project.techStack && project.techStack.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tech Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                >
                  {tech}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Info */}
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {project.description && (
            <div>
              <span className="font-medium">Description:</span>
              <p className="text-muted-foreground mt-1">{project.description}</p>
            </div>
          )}
          {project.folderPath && (
            <div>
              <span className="font-medium">Folder Path:</span>
              <p className="text-muted-foreground mt-1 font-mono text-xs">
                {project.folderPath}
              </p>
            </div>
          )}
          <div>
            <span className="font-medium">Created:</span>
            <p className="text-muted-foreground mt-1">
              {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className="font-medium">Last Updated:</span>
            <p className="text-muted-foreground mt-1">
              {new Date(project.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
