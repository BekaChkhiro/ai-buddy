/**
 * useStreaming Hook
 * Handle streaming responses from Claude API
 */

"use client";

import { useState, useCallback, useRef } from "react";

interface StreamingState {
  isStreaming: boolean;
  content: string;
  error: string | null;
}

interface UseStreamingReturn extends StreamingState {
  startStreaming: (url: string, body: any) => Promise<void>;
  stopStreaming: () => void;
  resetContent: () => void;
}

export function useStreaming(): UseStreamingReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const resetContent = useCallback(() => {
    setContent("");
    setError(null);
  }, []);

  const startStreaming = useCallback(async (url: string, body: any) => {
    // Reset state
    setContent("");
    setError(null);
    setIsStreaming(true);

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Request failed");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "text") {
                setContent((prev) => prev + data.text);
              } else if (data.type === "error") {
                setError(data.error);
                setIsStreaming(false);
                return;
              } else if (data.type === "done") {
                setIsStreaming(false);
                return;
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }

      setIsStreaming(false);
    } catch (err: any) {
      if (err.name === "AbortError") {
        // User cancelled
        setIsStreaming(false);
        return;
      }

      setError(err.message || "Streaming failed");
      setIsStreaming(false);
    }
  }, []);

  return {
    isStreaming,
    content,
    error,
    startStreaming,
    stopStreaming,
    resetContent,
  };
}
