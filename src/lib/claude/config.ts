/**
 * Claude SDK Configuration
 * Configuration constants for Claude integration
 */

import { ClaudeModel } from "./types";

/**
 * Default Claude model to use
 * Sonnet 4.5 (September 2025) - Best balance of performance and cost
 */
export const DEFAULT_MODEL: ClaudeModel = "claude-sonnet-4-5-20250929";

/**
 * Model for faster, cheaper operations
 * Haiku 4.5 (October 2025) - Fast and economical
 */
export const FAST_MODEL: ClaudeModel = "claude-haiku-4-5-20251001";

/**
 * Model for complex, high-quality operations
 * Opus 4.1 (August 2025) - Highest quality and reasoning
 */
export const PREMIUM_MODEL: ClaudeModel = "claude-opus-4-1-20250805";

/**
 * Maximum tokens for response
 */
export const MAX_TOKENS = 4096;

/**
 * Default temperature for responses
 */
export const DEFAULT_TEMPERATURE = 1.0;

/**
 * Maximum conversation history to include
 */
export const MAX_CONVERSATION_HISTORY = 10;

/**
 * Maximum context files to include
 */
export const MAX_CONTEXT_FILES = 10;

/**
 * Maximum file size to include in context (50KB)
 */
export const MAX_CONTEXT_FILE_SIZE = 50 * 1024;

/**
 * Maximum total context size (200KB)
 */
export const MAX_TOTAL_CONTEXT_SIZE = 200 * 1024;

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

/**
 * Rate limit configuration
 */
export const RATE_LIMIT_CONFIG = {
  maxRequestsPerMinute: 50,
  maxRequestsPerHour: 500,
  maxTokensPerDay: 500000,
};

/**
 * Token pricing per million tokens (USD)
 * Prices as of 2025 - check https://www.anthropic.com/pricing for updates
 */
export const TOKEN_PRICING: Record<ClaudeModel, { input: number; output: number }> = {
  "claude-sonnet-4-5-20250929": {
    input: 3.0,
    output: 15.0,
  },
  "claude-haiku-4-5-20251001": {
    input: 1.0,
    output: 5.0,
  },
  "claude-opus-4-1-20250805": {
    input: 15.0,
    output: 75.0,
  },
};

/**
 * Calculate cost for token usage
 */
export function calculateTokenCost(
  model: ClaudeModel,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = TOKEN_PRICING[model];
  const inputCost = (inputTokens / 1000000) * pricing.input;
  const outputCost = (outputTokens / 1000000) * pricing.output;
  return inputCost + outputCost;
}

/**
 * Estimate tokens from text (rough approximation)
 * Claude uses ~4 characters per token on average
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
