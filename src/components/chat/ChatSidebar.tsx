/**
 * ChatSidebar Component
 * Conversation history and settings
 */

'use client'

import { useState } from 'react'
import { Conversation, ChatMode } from '@/hooks/useChat'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  MessageSquare,
  Trash2,
  Settings,
  Lightbulb,
  Code,
  FileSearch,
  MessageCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatSidebarProps {
  conversations: Conversation[]
  currentConversation: Conversation | null
  currentMode: ChatMode
  loading?: boolean
  onNewConversation: () => void
  onSelectConversation: (conversationId: string) => void
  onDeleteConversation: (conversationId: string) => void
  onModeChange: (mode: ChatMode) => void
  className?: string
}

const MODE_ICONS: Record<ChatMode, React.ReactNode> = {
  planning: <Lightbulb className="h-3 w-3" />,
  implementation: <Code className="h-3 w-3" />,
  review: <FileSearch className="h-3 w-3" />,
  general: <MessageCircle className="h-3 w-3" />,
}

const MODE_LABELS: Record<ChatMode, string> = {
  planning: 'Planning',
  implementation: 'Implementation',
  review: 'Code Review',
  general: 'General',
}

export function ChatSidebar({
  conversations,
  currentConversation,
  currentMode,
  loading = false,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onModeChange,
  className,
}: ChatSidebarProps) {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className={cn('flex flex-col h-full bg-muted/30 border-r', className)}>
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chat</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <Button onClick={onNewConversation} className="w-full" disabled={loading}>
          <Plus className="h-4 w-4 mr-2" />
          New Conversation
        </Button>

        {/* Mode selector */}
        {showSettings && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Chat Mode
            </label>
            <Select value={currentMode} onValueChange={(value) => onModeChange(value as ChatMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MODE_LABELS).map(([mode, label]) => (
                  <SelectItem key={mode} value={mode}>
                    <div className="flex items-center gap-2">
                      {MODE_ICONS[mode as ChatMode]}
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Conversations list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No conversations yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Start a new conversation to get started
              </p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={currentConversation?.id === conversation.id}
                onSelect={() => onSelectConversation(conversation.id)}
                onDelete={() => onDeleteConversation(conversation.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: ConversationItemProps) {
  const [showDelete, setShowDelete] = useState(false)

  return (
    <Card
      className={cn(
        'p-3 cursor-pointer hover:bg-muted transition-colors group',
        isActive && 'bg-primary/10 border-primary'
      )}
      onClick={onSelect}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {MODE_ICONS[conversation.mode]}
            <h3 className="text-sm font-medium truncate">
              {conversation.title || 'New Conversation'}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="capitalize">{conversation.mode}</span>
            <span>•</span>
            <span>{new Date(conversation.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {showDelete && (
          <Button
            size="icon"
            variant="ghost"
            className="flex-shrink-0 h-6 w-6 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </Card>
  )
}
