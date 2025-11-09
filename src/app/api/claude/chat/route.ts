/**
 * Claude Chat API Route
 * POST /api/claude/chat - Stream chat responses from Claude
 */

import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getProjectById } from '@/lib/supabase/queries'
import { createClaudeClient } from '@/lib/claude/client'
import { buildSystemPrompt, formatConversationHistory } from '@/lib/claude/prompts'
import { buildChatContext, estimateContextTokens } from '@/lib/claude/context'
import { streamClaudeResponse, createSSEStream } from '@/lib/claude/streaming'
import { retryWithBackoff, formatErrorResponse } from '@/lib/claude/errors'
import {
  DEFAULT_MODEL,
  MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  MAX_CONVERSATION_HISTORY,
} from '@/lib/claude/config'
import { ChatRequest } from '@/lib/claude/types'
import { z } from 'zod'

/**
 * Request validation schema
 */
const chatRequestSchema = z.object({
  projectId: z.string().uuid(),
  message: z.string().min(1),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional(),
  includeProjectContext: z.boolean().optional().default(true),
  contextFiles: z.array(z.string()).optional(),
  mode: z.enum(['planning', 'implementation', 'review', 'general']).optional().default('general'),
})

/**
 * POST /api/claude/chat
 * Stream chat responses from Claude AI
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', success: false }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse and validate request
    const body = await request.json()
    const validatedData = chatRequestSchema.parse(body) as ChatRequest

    // Get project and verify ownership
    const project = await getProjectById(supabase, validatedData.projectId)

    if (!project) {
      return new Response(
        JSON.stringify({ error: 'Project not found', success: false }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (project.userId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden', success: false }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Build context
    let context
    if (validatedData.includeProjectContext) {
      context = await buildChatContext(
        supabase,
        validatedData.projectId,
        validatedData.contextFiles
      )

      // Estimate context tokens
      const contextTokens = estimateContextTokens(context)
      console.log(`Context tokens estimate: ${contextTokens}`)
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(validatedData.mode || 'general', context)

    // Format conversation history
    const history = validatedData.conversationHistory
      ? formatConversationHistory(validatedData.conversationHistory).slice(
          -MAX_CONVERSATION_HISTORY
        )
      : []

    // Add current message
    const messages = [
      ...history,
      {
        role: 'user' as const,
        content: validatedData.message,
      },
    ]

    // Create SSE stream
    const { readable, writable } = createSSEStream()
    const writer = writable.getWriter()

    // Start streaming in background
    ;(async () => {
      try {
        await retryWithBackoff(async () => {
          const client = createClaudeClient()

          // Create streaming message
          const stream = await client.messages.create({
            model: DEFAULT_MODEL,
            max_tokens: MAX_TOKENS,
            temperature: DEFAULT_TEMPERATURE,
            system: systemPrompt,
            messages,
            stream: true,
          })

          // Stream response
          const usage = await streamClaudeResponse(stream, writer)

          // Log token usage
          console.log(`Token usage - Input: ${usage.inputTokens}, Output: ${usage.outputTokens}, Total: ${usage.totalTokens}`)

          // Store token usage in database
          const { saveTokenUsage } = await import('@/lib/claude/usage')
          await saveTokenUsage(supabase, {
            userId: user.id,
            projectId: validatedData.projectId,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            model: DEFAULT_MODEL,
          })
        })
      } catch (error) {
        console.error('Error streaming Claude response:', error)

        const encoder = new TextEncoder()
        const errorResponse = formatErrorResponse(error)

        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'error',
              ...errorResponse,
            })}\n\n`
          )
        )
        await writer.close()
      }
    })()

    // Return SSE stream
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in Claude chat API:', error)

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          details: error.issues,
          success: false,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const errorResponse = formatErrorResponse(error)

    return new Response(JSON.stringify({ ...errorResponse, success: false }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
