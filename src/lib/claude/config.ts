/**
 * Claude SDK Configuration
 * Configuration constants for Claude integration
 */

import { ClaudeModel } from './types'

/**
 * Default Claude model to use
 */
export const DEFAULT_MODEL: ClaudeModel = 'claude-3-5-sonnet-20241022'

/**
 * Model for faster, cheaper operations
 */
export const FAST_MODEL: ClaudeModel = 'claude-3-5-haiku-20241022'

/**
 * Model for complex, high-quality operations
 */
export const PREMIUM_MODEL: ClaudeModel = 'claude-3-opus-20240229'

/**
 * Maximum tokens for response
 */
export const MAX_TOKENS = 4096

/**
 * Default temperature for responses
 */
export const DEFAULT_TEMPERATURE = 1.0

/**
 * Maximum conversation history to include
 */
export const MAX_CONVERSATION_HISTORY = 10

/**
 * Maximum context files to include
 */
export const MAX_CONTEXT_FILES = 10

/**
 * Maximum file size to include in context (50KB)
 */
export const MAX_CONTEXT_FILE_SIZE = 50 * 1024

/**
 * Maximum total context size (200KB)
 */
export const MAX_TOTAL_CONTEXT_SIZE = 200 * 1024

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
}

/**
 * Rate limit configuration
 */
export const RATE_LIMIT_CONFIG = {
  maxRequestsPerMinute: 50,
  maxRequestsPerHour: 500,
  maxTokensPerDay: 500000,
}

/**
 * Token pricing per million tokens (USD)
 */
export const TOKEN_PRICING: Record<ClaudeModel, { input: number; output: number }> = {
  'claude-3-5-sonnet-20241022': {
    input: 3.00,
    output: 15.00,
  },
  'claude-3-5-haiku-20241022': {
    input: 0.80,
    output: 4.00,
  },
  'claude-3-opus-20240229': {
    input: 15.00,
    output: 75.00,
  },
}

/**
 * Calculate cost for token usage
 */
export function calculateTokenCost(
  model: ClaudeModel,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = TOKEN_PRICING[model]
  const inputCost = (inputTokens / 1000000) * pricing.input
  const outputCost = (outputTokens / 1000000) * pricing.output
  return inputCost + outputCost
}

/**
 * Estimate tokens from text (rough approximation)
 * Claude uses ~4 characters per token on average
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}
