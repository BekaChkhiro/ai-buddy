/**
 * ChatInput Component
 * Message input with file attachments and send button
 */

"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string, files?: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  contextFiles?: string[];
  onContextFilesChange?: (files: string[]) => void;
  className?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Type your message...",
  contextFiles = [],
  onContextFilesChange,
  className,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>(contextFiles);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle send message
  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSend(trimmedMessage, selectedFiles.length > 0 ? selectedFiles : undefined);
      setMessage("");
      setSelectedFiles([]);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }

    // Cancel on Escape
    if (e.key === "Escape") {
      setMessage("");
      setSelectedFiles([]);
      textareaRef.current?.blur();
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  // Remove file from context
  const removeFile = (file: string) => {
    const updatedFiles = selectedFiles.filter((f) => f !== file);
    setSelectedFiles(updatedFiles);
    onContextFilesChange?.(updatedFiles);
  };

  return (
    <div className={cn("border-t bg-background", className)}>
      {/* Context files */}
      {selectedFiles.length > 0 && (
        <div className="px-4 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Context files:</span>
            {selectedFiles.map((file) => (
              <div
                key={file}
                className="flex items-center gap-1 px-2 py-1 bg-background rounded text-xs"
              >
                <span className="max-w-[200px] truncate">{file}</span>
                <button
                  onClick={() => removeFile(file)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 p-4">
        {/* Attach files button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setShowFilePicker(!showFilePicker)}
          disabled={disabled}
          title="Attach files"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Message input */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[44px] max-h-[200px] resize-none"
          rows={1}
        />

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          size="icon"
          title="Send message (Enter)"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick tips */}
      <div className="px-4 pb-2 text-xs text-muted-foreground">
        Press <kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> to send,{" "}
        <kbd className="px-1 py-0.5 bg-muted rounded">Shift+Enter</kbd> for new line
      </div>
    </div>
  );
}
