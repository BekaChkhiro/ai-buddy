/**
 * QuickActions Component
 * Suggested prompts and common actions for chat
 */

'use client'

import { Card } from '@/components/ui/card'
import {
  Lightbulb,
  Code,
  FileSearch,
  Bug,
  Sparkles,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatMode } from '@/hooks/useChat'

interface QuickAction {
  icon: React.ReactNode
  label: string
  prompt: string
  mode?: ChatMode
}

interface QuickActionsProps {
  onSelectAction: (prompt: string, mode?: ChatMode) => void
  currentMode?: ChatMode
  className?: string
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: <Lightbulb className="h-4 w-4" />,
    label: 'Plan Feature',
    prompt: 'Help me plan and break down a new feature into tasks',
    mode: 'planning',
  },
  {
    icon: <Code className="h-4 w-4" />,
    label: 'Write Code',
    prompt: 'Help me implement this feature with production-ready code',
    mode: 'implementation',
  },
  {
    icon: <FileSearch className="h-4 w-4" />,
    label: 'Review Code',
    prompt: 'Review the code for quality, security, and best practices',
    mode: 'review',
  },
  {
    icon: <Bug className="h-4 w-4" />,
    label: 'Debug Issue',
    prompt: 'Help me debug and fix this issue',
    mode: 'general',
  },
  {
    icon: <Sparkles className="h-4 w-4" />,
    label: 'Improve Code',
    prompt: 'Suggest improvements and refactoring opportunities',
    mode: 'review',
  },
  {
    icon: <CheckCircle className="h-4 w-4" />,
    label: 'Add Tests',
    prompt: 'Help me write comprehensive tests for this code',
    mode: 'implementation',
  },
]

export function QuickActions({
  onSelectAction,
  currentMode,
  className,
}: QuickActionsProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 px-4">
        <Sparkles className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">
          Quick Actions
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-4">
        {QUICK_ACTIONS.map((action) => (
          <Card
            key={action.label}
            className={cn(
              'p-3 cursor-pointer hover:bg-muted/50 transition-colors border',
              currentMode === action.mode && 'border-primary bg-primary/5'
            )}
            onClick={() => onSelectAction(action.prompt, action.mode)}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5 text-primary">
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium mb-1">{action.label}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {action.prompt}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
