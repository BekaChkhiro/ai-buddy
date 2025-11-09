/**
 * Claude Error Handling
 * Error handling and retry logic for Claude API
 */

import { ClaudeError, RateLimitError } from './types'
import { RETRY_CONFIG } from './config'

/**
 * Parse Anthropic API error
 */
export function parseAnthropicError(error: any): ClaudeError {
  // Rate limit error
  if (error.status === 429) {
    const retryAfter = error.headers?.['retry-after']
      ? parseInt(error.headers['retry-after'])
      : undefined

    return new RateLimitError(
      error.message || 'Rate limit exceeded',
      retryAfter
    )
  }

  // Authentication error
  if (error.status === 401) {
    return new ClaudeError(
      'Invalid API key',
      'AUTHENTICATION_ERROR',
      401,
      error
    )
  }

  // Invalid request
  if (error.status === 400) {
    return new ClaudeError(
      error.message || 'Invalid request',
      'INVALID_REQUEST',
      400,
      error
    )
  }

  // Server error
  if (error.status >= 500) {
    return new ClaudeError(
      'Anthropic API server error',
      'SERVER_ERROR',
      error.status,
      error
    )
  }

  // Network error
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return new ClaudeError(
      'Network error: Unable to reach Anthropic API',
      'NETWORK_ERROR',
      undefined,
      error
    )
  }

  // Generic error
  return new ClaudeError(
    error.message || 'Unknown error occurred',
    'UNKNOWN_ERROR',
    error.status,
    error
  )
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = RETRY_CONFIG.maxRetries,
  onRetry?: (attempt: number, error: Error) => void
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error

      // Don't retry on certain errors
      const claudeError = parseAnthropicError(error)

      if (
        claudeError.code === 'AUTHENTICATION_ERROR' ||
        claudeError.code === 'INVALID_REQUEST'
      ) {
        throw claudeError
      }

      // If this was the last attempt, throw
      if (attempt === maxRetries) {
        throw claudeError
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
        RETRY_CONFIG.maxDelay
      )

      // For rate limit errors, use retry-after header if available
      if (claudeError instanceof RateLimitError && claudeError.retryAfter) {
        const retryAfterMs = claudeError.retryAfter * 1000
        console.log(`Rate limited. Retrying after ${claudeError.retryAfter} seconds...`)
        await sleep(retryAfterMs)
      } else {
        console.log(`Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`)
        await sleep(delay)
      }

      if (onRetry) {
        onRetry(attempt + 1, claudeError)
      }
    }
  }

  throw lastError!
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  const claudeError = parseAnthropicError(error)

  // Retry on rate limits, network errors, and server errors
  return (
    claudeError instanceof RateLimitError ||
    claudeError.code === 'NETWORK_ERROR' ||
    claudeError.code === 'SERVER_ERROR'
  )
}

/**
 * Format error for client response
 */
export function formatErrorResponse(error: any): {
  error: string
  code?: string
  retryable: boolean
} {
  const claudeError = parseAnthropicError(error)

  return {
    error: claudeError.message,
    code: claudeError.code,
    retryable: isRetryableError(error),
  }
}
