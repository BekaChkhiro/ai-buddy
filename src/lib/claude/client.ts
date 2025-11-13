/**
 * Claude SDK Client
 * Initialize and configure Anthropic Claude client
 */

import Anthropic from "@anthropic-ai/sdk";
import { ClaudeError } from "./types";

/**
 * Get Anthropic API key from environment
 */
function getApiKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new ClaudeError(
      "ANTHROPIC_API_KEY is not set in environment variables",
      "MISSING_API_KEY"
    );
  }

  return apiKey;
}

/**
 * Create Anthropic client instance
 * This function creates a new client for each request to ensure proper timeout handling
 */
export function createClaudeClient(): Anthropic {
  return new Anthropic({
    apiKey: getApiKey(),
    timeout: 60000, // 60 seconds
    maxRetries: 0, // We handle retries manually
  });
}

/**
 * Singleton client for reuse
 * Use this for non-streaming requests
 */
let cachedClient: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  if (!cachedClient) {
    cachedClient = createClaudeClient();
  }
  return cachedClient;
}

/**
 * Validate API key is configured
 */
export function isApiKeyConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Test API connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = getClaudeClient();

    // Make a minimal request to test the connection
    await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 10,
      messages: [{ role: "user", content: "Hi" }],
    });

    return true;
  } catch (error) {
    console.error("Claude API connection test failed:", error);
    return false;
  }
}
