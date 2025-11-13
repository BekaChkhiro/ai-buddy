/**
 * MessageList Component
 * Scrollable list of messages with auto-scroll and loading states
 */

"use client";

import { useEffect, useRef } from "react";
import { Message } from "@/hooks/useMessages";
import { MessageItem } from "./MessageItem";
import { StreamingMessage } from "./StreamingMessage";
import { Button } from "@/components/ui/button";
import { ArrowDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: Message[];
  isStreaming?: boolean;
  streamingContent?: string;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onStopStreaming?: () => void;
  onEditMessage?: (messageId: string, content: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onRegenerateMessage?: () => void;
  className?: string;
}

export function MessageList({
  messages,
  isStreaming = false,
  streamingContent = "",
  loading = false,
  hasMore = false,
  onLoadMore,
  onStopStreaming,
  onEditMessage,
  onDeleteMessage,
  onRegenerateMessage,
  className,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const isAutoScrolling = useRef(true);

  // Auto-scroll to bottom when new messages arrive or streaming updates
  useEffect(() => {
    if (isAutoScrolling.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingContent]);

  // Detect manual scroll to disable auto-scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    // Enable auto-scroll if near bottom, disable if scrolled up
    isAutoScrolling.current = isNearBottom;

    // Detect scroll to top for load more
    if (scrollTop === 0 && scrollTop < lastScrollTop.current && hasMore && onLoadMore && !loading) {
      onLoadMore();
    }

    lastScrollTop.current = scrollTop;
  };

  // Scroll to bottom button click
  const scrollToBottom = () => {
    isAutoScrolling.current = true;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Show scroll to bottom button if not auto-scrolling
  const showScrollButton = !isAutoScrolling.current && messages.length > 0;

  return (
    <div className={cn("relative flex flex-col h-full", className)}>
      {/* Messages container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-contain"
      >
        {/* Load more indicator */}
        {hasMore && onLoadMore && (
          <div className="flex justify-center py-4">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading more messages...
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={onLoadMore}>
                Load more messages
              </Button>
            )}
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
            <div className="text-6xl">💬</div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
              <p className="text-sm text-muted-foreground">
                Start a conversation by sending a message below
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="divide-y">
          {messages.map((message, index) => (
            <MessageItem
              key={message.id}
              message={message}
              onEdit={onEditMessage}
              onDelete={onDeleteMessage}
              onRegenerate={
                index === messages.length - 1 && message.role === "assistant"
                  ? onRegenerateMessage
                  : undefined
              }
            />
          ))}
        </div>

        {/* Streaming message */}
        {isStreaming && <StreamingMessage content={streamingContent} onStop={onStopStreaming} />}

        {/* Loading indicator */}
        {loading && !hasMore && messages.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div className="absolute bottom-4 right-4">
          <Button
            size="icon"
            variant="secondary"
            onClick={scrollToBottom}
            className="rounded-full shadow-lg"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
