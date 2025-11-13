/**
 * Claude Streaming Handler
 * Handle streaming responses from Claude API
 */

import Anthropic from "@anthropic-ai/sdk";
import { Stream } from "@anthropic-ai/sdk/streaming";
import { TokenUsage } from "./types";

/**
 * Stream Claude response to a TransformStream
 * This allows Server-Sent Events streaming in Next.js API routes
 */
export async function streamClaudeResponse(
  stream: Stream<Anthropic.Messages.MessageStreamEvent>,
  writer: WritableStreamDefaultWriter<Uint8Array>
): Promise<TokenUsage> {
  const encoder = new TextEncoder();
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    for await (const event of stream) {
      // Handle different event types
      if (event.type === "message_start") {
        // Extract input token count from message start
        if (event.message.usage) {
          inputTokens = event.message.usage.input_tokens;
        }
      } else if (event.type === "content_block_delta") {
        // Stream text deltas to client
        if (event.delta.type === "text_delta") {
          const text = event.delta.text;
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "text", text })}\n\n`));
        }
      } else if (event.type === "message_delta") {
        // Extract output token count
        if (event.usage) {
          outputTokens = event.usage.output_tokens;
        }
      } else if (event.type === "message_stop") {
        // Signal end of stream
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
      }
    }

    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
    };
  } catch (error) {
    // Send error to client
    await writer.write(
      encoder.encode(
        `data: ${JSON.stringify({ type: "error", error: error instanceof Error ? error.message : "Unknown error" })}\n\n`
      )
    );
    throw error;
  } finally {
    await writer.close();
  }
}

/**
 * Create a TransformStream for SSE
 */
export function createSSEStream(): TransformStream<Uint8Array, Uint8Array> {
  return new TransformStream({
    start(controller) {
      // Set up SSE headers
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(": SSE stream started\n\n"));
    },
    transform(chunk, controller) {
      controller.enqueue(chunk);
    },
    flush(controller) {
      // Ensure stream is properly closed
      controller.terminate();
    },
  });
}

/**
 * Parse SSE message from client
 */
export function parseSSEMessage(
  data: string
): { type: string; text?: string; error?: string } | null {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Collect full response from stream (for non-streaming use cases)
 */
export async function collectStreamResponse(
  stream: Stream<Anthropic.Messages.MessageStreamEvent>
): Promise<{ text: string; usage: TokenUsage }> {
  let fullText = "";
  let inputTokens = 0;
  let outputTokens = 0;

  for await (const event of stream) {
    if (event.type === "message_start" && event.message.usage) {
      inputTokens = event.message.usage.input_tokens;
    } else if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullText += event.delta.text;
    } else if (event.type === "message_delta" && event.usage) {
      outputTokens = event.usage.output_tokens;
    }
  }

  return {
    text: fullText,
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
    },
  };
}
