/**
 * StreamingMessage Component
 * Display streaming AI response with animated cursor
 */

"use client";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { Button } from "@/components/ui/button";
import { StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreamingMessageProps {
  content: string;
  onStop?: () => void;
  className?: string;
}

export function StreamingMessage({ content, onStop, className }: StreamingMessageProps) {
  return (
    <div
      className={cn(
        "flex gap-4 py-4 px-4 bg-muted/20 border-l-2 border-primary animate-pulse-subtle",
        className
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-secondary text-secondary-foreground">
          AI
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Assistant</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground animate-pulse">Thinking...</span>
            {onStop && (
              <Button size="sm" variant="destructive" onClick={onStop}>
                <StopCircle className="h-3 w-3 mr-1" />
                Stop
              </Button>
            )}
          </div>
        </div>

        {/* Streaming content with markdown */}
        {content ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeRaw]}
              components={{
                // Custom code block rendering
                code(props) {
                  const { node, className, children, ...rest } = props;
                  const match = /language-(\w+)/.exec(className || "");
                  const language = match ? match[1] : "";
                  const code = String(children).replace(/\n$/, "");
                  const isInline = !className;

                  return !isInline && language ? (
                    <SyntaxHighlighter style={oneDark as any} language={language} PreTag="div">
                      {code}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...rest}>
                      {children}
                    </code>
                  );
                },
                // Custom link rendering
                a({ node, children, href, ...props }) {
                  return (
                    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                      {children}
                    </a>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>

            {/* Animated cursor */}
            <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />
          </div>
        ) : (
          // Empty state with animated dots
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="animate-bounce" style={{ animationDelay: "0ms" }}>
              •
            </span>
            <span className="animate-bounce" style={{ animationDelay: "150ms" }}>
              •
            </span>
            <span className="animate-bounce" style={{ animationDelay: "300ms" }}>
              •
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
