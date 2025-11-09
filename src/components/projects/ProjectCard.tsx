/**
 * ProjectCard Component
 * Card component for displaying project in grid/list view
 */

import Link from 'next/link'
import { FolderKanban } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Project } from '@/types'

interface ProjectCardProps {
  project: Project & { taskCount?: number; completedTaskCount?: number }
  className?: string
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  const completionRate = project.taskCount && project.taskCount > 0
    ? Math.round((project.completedTaskCount || 0) / project.taskCount * 100)
    : 0

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className={`hover:bg-accent transition-colors cursor-pointer h-full ${className || ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            {project.name}
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {project.description || 'No description'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Task stats */}
          <div className="flex gap-4 text-sm text-muted-foreground mb-3">
            <div>
              <span className="font-medium">{project.taskCount || 0}</span> tasks
            </div>
            <div>
              <span className="font-medium">{project.completedTaskCount || 0}</span> completed
            </div>
            {(project.taskCount ?? 0) > 0 && (
              <div>
                <span className="font-medium">{completionRate}%</span> done
              </div>
            )}
          </div>

          {/* Tech stack badges */}
          {project.techStack.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {project.techStack.slice(0, 3).map((tech) => (
                <Badge key={tech} variant="secondary">
                  {tech}
                </Badge>
              ))}
              {project.techStack.length > 3 && (
                <Badge variant="outline">
                  +{project.techStack.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Folder path if exists */}
          {project.folderPath && (
            <div className="mt-3 text-xs text-muted-foreground truncate">
              {project.folderPath}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
