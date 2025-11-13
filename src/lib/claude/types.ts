/**
 * Claude SDK Types
 * Type definitions for Claude integration
 */

export type ClaudeModel =
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-sonnet-20240620'
  | 'claude-3-5-haiku-20241022'
  | 'claude-3-haiku-20240307'
  | 'claude-3-opus-20240229'

export type MessageRole = 'user' | 'assistant'

export interface ClaudeMessage {
  role: MessageRole
  content: string
}

export interface ClaudeStreamChunk {
  type: 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_start' | 'message_delta' | 'message_stop'
  delta?: {
    type: 'text_delta'
    text: string
  }
  content_block?: {
    type: string
    text: string
  }
  message?: {
    id: string
    usage?: {
      input_tokens: number
      output_tokens: number
    }
  }
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export interface ClaudeConfig {
  model: ClaudeModel
  maxTokens: number
  temperature?: number
  topP?: number
  topK?: number
}

export interface ChatContext {
  projectId: string
  projectName: string
  projectDescription?: string
  techStack: string[]
  folderPath?: string
  relevantFiles?: Array<{
    path: string
    content: string
    language?: string
  }>
  recentTasks?: Array<{
    title: string
    status: string
    description?: string
  }>
}

export interface ChatRequest {
  projectId: string
  message: string
  conversationHistory?: ClaudeMessage[]
  includeProjectContext?: boolean
  contextFiles?: string[]
  mode?: 'planning' | 'implementation' | 'review' | 'general'
}

export interface ChatResponse {
  message: string
  usage: TokenUsage
  conversationId?: string
}

export interface TokenUsageRecord {
  id: string
  userId: string
  projectId: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  model: string
  timestamp: Date
}

export interface UsageStats {
  totalInputTokens: number
  totalOutputTokens: number
  totalTokens: number
  totalCost: number
  requestCount: number
  averageTokensPerRequest: number
}

export class ClaudeError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'ClaudeError'
  }
}

export class RateLimitError extends ClaudeError {
  constructor(message: string, public retryAfter?: number) {
    super(message, 'RATE_LIMIT', 429)
    this.name = 'RateLimitError'
  }
}

export class TokenLimitError extends ClaudeError {
  constructor(message: string, public limit: number, public current: number) {
    super(message, 'TOKEN_LIMIT', 400)
    this.name = 'TokenLimitError'
  }
}
