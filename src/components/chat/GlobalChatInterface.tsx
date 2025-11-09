/**
 * GlobalChatInterface Component
 * Chat interface with project selector for cross-project chatting
 */

'use client'

import { useState } from 'react'
import { ChatInterface } from './ChatInterface'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Folder } from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string | null
}

interface GlobalChatInterfaceProps {
  projects: Project[]
  defaultProjectId: string
}

export function GlobalChatInterface({
  projects,
  defaultProjectId,
}: GlobalChatInterfaceProps) {
  const [selectedProjectId, setSelectedProjectId] = useState(defaultProjectId)

  return (
    <div className="flex flex-col h-full">
      {/* Project selector */}
      <div className="border-b p-4">
        <div className="flex items-center gap-3 max-w-md">
          <Folder className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{project.name}</span>
                    {project.description && (
                      <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                        {project.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chat interface for selected project */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          key={selectedProjectId} // Remount when project changes
          projectId={selectedProjectId}
          showSidebar={true}
        />
      </div>
    </div>
  )
}
