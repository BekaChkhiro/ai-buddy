/**
 * useChat Hook
 * Main chat state management integrating messages and streaming
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useMessages, Message } from './useMessages'
import { useStreaming } from './useStreaming'

export type ChatMode = 'planning' | 'implementation' | 'review' | 'general'

export interface Conversation {
  id: string
  projectId: string
  userId: string
  title: string | null
  mode: ChatMode
  contextFiles: string[]
  createdAt: string
  updatedAt: string
}

interface UseChatOptions {
  projectId: string
  conversationId?: string
  mode?: ChatMode
  contextFiles?: string[]
}

interface UseChatReturn {
  // Conversation state
  conversation: Conversation | null
  conversations: Conversation[]
  loadingConversations: boolean

  // Messages state
  messages: Message[]
  loadingMessages: boolean

  // Streaming state
  isStreaming: boolean
  streamingContent: string

  // Error state
  error: string | null

  // Actions
  sendMessage: (content: string) => Promise<void>
  stopStreaming: () => void
  createConversation: (title?: string) => Promise<Conversation | null>
  switchConversation: (conversationId: string) => Promise<void>
  deleteConversation: (conversationId: string) => Promise<void>
  updateConversationMode: (mode: ChatMode) => Promise<void>
  updateContextFiles: (files: string[]) => Promise<void>
  regenerateLastMessage: () => Promise<void>
  editMessage: (messageId: string, content: string) => Promise<void>
}

export function useChat(options: UseChatOptions): UseChatReturn {
  const { projectId, conversationId: initialConversationId, mode = 'general', contextFiles = [] } = options

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(initialConversationId)
  const [error, setError] = useState<string | null>(null)

  const lastUserMessageRef = useRef<string>('')
  const supabase = createBrowserClient()

  // Use messages hook
  const {
    messages,
    loading: loadingMessages,
    addMessage,
    updateMessage,
    deleteMessage,
  } = useMessages({
    conversationId: currentConversationId,
    autoFetch: true,
  })

  // Use streaming hook
  const {
    isStreaming,
    content: streamingContent,
    error: streamingError,
    startStreaming,
    stopStreaming,
    resetContent,
  } = useStreaming()

  // Fetch conversations for project
  const fetchConversations = useCallback(async () => {
    setLoadingConversations(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false })

      if (fetchError) throw fetchError

      setConversations(data || [])
    } catch (err: any) {
      console.error('Error fetching conversations:', err)
      setError(err.message || 'Failed to fetch conversations')
    } finally {
      setLoadingConversations(false)
    }
  }, [projectId, supabase])

  // Fetch current conversation details
  const fetchConversation = useCallback(async () => {
    if (!currentConversationId) {
      setConversation(null)
      return
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', currentConversationId)
        .single()

      if (fetchError) throw fetchError

      setConversation(data)
    } catch (err: any) {
      console.error('Error fetching conversation:', err)
      setError(err.message || 'Failed to fetch conversation')
    }
  }, [currentConversationId, supabase])

  // Create new conversation
  const createConversation = useCallback(
    async (title?: string): Promise<Conversation | null> => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data, error: createError } = await supabase
          .from('conversations')
          .insert({
            project_id: projectId,
            user_id: user.id,
            title: title || null,
            mode,
            context_files: contextFiles,
          })
          .select()
          .single()

        if (createError) throw createError

        setConversations((prev) => [data, ...prev])
        setCurrentConversationId(data.id)
        setConversation(data)

        return data
      } catch (err: any) {
        console.error('Error creating conversation:', err)
        setError(err.message || 'Failed to create conversation')
        return null
      }
    },
    [projectId, mode, contextFiles, supabase]
  )

  // Switch to different conversation
  const switchConversation = useCallback(async (conversationId: string) => {
    setCurrentConversationId(conversationId)
    resetContent()
  }, [resetContent])

  // Delete conversation
  const deleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        const { error: deleteError } = await supabase
          .from('conversations')
          .delete()
          .eq('id', conversationId)

        if (deleteError) throw deleteError

        setConversations((prev) => prev.filter((c) => c.id !== conversationId))

        // If deleting current conversation, switch to first available
        if (conversationId === currentConversationId) {
          const remaining = conversations.filter((c) => c.id !== conversationId)
          if (remaining.length > 0) {
            setCurrentConversationId(remaining[0].id)
          } else {
            setCurrentConversationId(undefined)
            setConversation(null)
          }
        }
      } catch (err: any) {
        console.error('Error deleting conversation:', err)
        setError(err.message || 'Failed to delete conversation')
      }
    },
    [currentConversationId, conversations, supabase]
  )

  // Update conversation mode
  const updateConversationMode = useCallback(
    async (newMode: ChatMode) => {
      if (!currentConversationId) return

      try {
        const { error: updateError } = await supabase
          .from('conversations')
          .update({ mode: newMode })
          .eq('id', currentConversationId)

        if (updateError) throw updateError

        setConversation((prev) => prev ? { ...prev, mode: newMode } : null)
      } catch (err: any) {
        console.error('Error updating conversation mode:', err)
        setError(err.message || 'Failed to update mode')
      }
    },
    [currentConversationId, supabase]
  )

  // Update context files
  const updateContextFiles = useCallback(
    async (files: string[]) => {
      if (!currentConversationId) return

      try {
        const { error: updateError } = await supabase
          .from('conversations')
          .update({ context_files: files })
          .eq('id', currentConversationId)

        if (updateError) throw updateError

        setConversation((prev) => prev ? { ...prev, contextFiles: files } : null)
      } catch (err: any) {
        console.error('Error updating context files:', err)
        setError(err.message || 'Failed to update context files')
      }
    },
    [currentConversationId, supabase]
  )

  // Send message and get streaming response
  const sendMessage = useCallback(
    async (content: string) => {
      try {
        setError(null)
        resetContent()

        // Create conversation if it doesn't exist
        let convId = currentConversationId
        if (!convId) {
          const newConv = await createConversation()
          if (!newConv) {
            throw new Error('Failed to create conversation')
          }
          convId = newConv.id
        }

        // Save user message to database
        const userMessage = await addMessage({
          conversationId: convId,
          parentId: null,
          role: 'user',
          content,
          metadata: {},
        })

        if (!userMessage) {
          throw new Error('Failed to save user message')
        }

        lastUserMessageRef.current = content

        // Build conversation history
        const conversationHistory = messages.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }))

        // Start streaming response
        await startStreaming('/api/claude/chat', {
          projectId,
          message: content,
          conversationHistory,
          includeProjectContext: true,
          contextFiles: conversation?.contextFiles || contextFiles,
          mode: conversation?.mode || mode,
        })

        // After streaming completes, save assistant message
        // Note: This will be called after the streaming hook finishes
      } catch (err: any) {
        console.error('Error sending message:', err)
        setError(err.message || 'Failed to send message')
      }
    },
    [
      currentConversationId,
      createConversation,
      addMessage,
      messages,
      startStreaming,
      projectId,
      conversation,
      contextFiles,
      mode,
      resetContent,
    ]
  )

  // Save assistant message after streaming completes
  useEffect(() => {
    if (!isStreaming && streamingContent && currentConversationId) {
      // Save the streamed content as assistant message
      addMessage({
        conversationId: currentConversationId,
        parentId: null,
        role: 'assistant',
        content: streamingContent,
        metadata: {},
      }).then(() => {
        resetContent()
      })
    }
  }, [isStreaming, streamingContent, currentConversationId, addMessage, resetContent])

  // Regenerate last assistant message
  const regenerateLastMessage = useCallback(async () => {
    if (!lastUserMessageRef.current) return

    // Delete last assistant message
    const lastAssistantMessage = [...messages].reverse().find((msg) => msg.role === 'assistant')
    if (lastAssistantMessage) {
      await deleteMessage(lastAssistantMessage.id)
    }

    // Resend last user message
    await sendMessage(lastUserMessageRef.current)
  }, [messages, deleteMessage, sendMessage])

  // Edit message
  const editMessage = useCallback(
    async (messageId: string, content: string) => {
      await updateMessage(messageId, content)
    },
    [updateMessage]
  )

  // Initialize: fetch conversations and current conversation
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (currentConversationId) {
      fetchConversation()
    }
  }, [currentConversationId, fetchConversation])

  // Merge streaming error with general error
  useEffect(() => {
    if (streamingError) {
      setError(streamingError)
    }
  }, [streamingError])

  return {
    // Conversation state
    conversation,
    conversations,
    loadingConversations,

    // Messages state
    messages,
    loadingMessages,

    // Streaming state
    isStreaming,
    streamingContent,

    // Error state
    error,

    // Actions
    sendMessage,
    stopStreaming,
    createConversation,
    switchConversation,
    deleteConversation,
    updateConversationMode,
    updateContextFiles,
    regenerateLastMessage,
    editMessage,
  }
}
