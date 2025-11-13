/**
 * MessageItem Component
 * Display individual chat message with markdown rendering
 */

"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { Message } from "@/hooks/useMessages";
import { Button } from "@/components/ui/button";
import { Copy, Check, Edit, Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onRegenerate?: () => void;
  className?: string;
}

export function MessageItem({
  message,
  isStreaming = false,
  onEdit,
  onDelete,
  onRegenerate,
  className,
}: MessageItemProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  // Copy code block to clipboard
  const handleCopyCode = async (code: string, language: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(language);
    setTimeout(() => setCopied(null), 2000);
  };

  // Save edited message
  const handleSaveEdit = () => {
    if (onEdit && editedContent.trim()) {
      onEdit(message.id, editedContent);
      setIsEditing(false);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        "group flex gap-4 py-4 px-4 hover:bg-muted/50 transition-colors",
        isUser && "bg-muted/30",
        className
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
            isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          )}
        >
          {isUser ? "U" : "AI"}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2 overflow-hidden">
        {/* Header with role and timestamp */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{isUser ? "You" : "Assistant"}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(message.created_at).toLocaleTimeString()}
          </span>
        </div>

        {/* Message content */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full min-h-[100px] p-2 border rounded-md resize-y"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeRaw]}
              components={{
                // Custom code block rendering with copy button
                code(props) {
                  const { node, className, children, ...rest } = props;
                  const match = /language-(\w+)/.exec(className || "");
                  const language = match ? match[1] : "";
                  const code = String(children).replace(/\n$/, "");
                  const isInline = !className;

                  return !isInline && language ? (
                    <div className="relative group/code">
                      <div className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyCode(code, language)}
                        >
                          {copied === language ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <SyntaxHighlighter style={oneDark as any} language={language} PreTag="div">
                        {code}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code className={className} {...rest}>
                      {children}
                    </code>
                  );
                },
                // Custom link rendering (open in new tab)
                a({ node, children, href, ...props }) {
                  return (
                    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                      {children}
                    </a>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Actions (visible on hover) */}
        {!isEditing && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {isUser && onEdit && (
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}

            {isAssistant && onRegenerate && !isStreaming && (
              <Button size="sm" variant="ghost" onClick={onRegenerate}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Regenerate
              </Button>
            )}

            {onDelete && (
              <Button size="sm" variant="ghost" onClick={() => onDelete(message.id)}>
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleCopyCode(message.content, "text")}
            >
              {copied === "text" ? (
                <Check className="h-3 w-3 mr-1" />
              ) : (
                <Copy className="h-3 w-3 mr-1" />
              )}
              Copy
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
