"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Sparkles,
  MessageSquare,
  MessagesSquare,
  Loader2,
} from "lucide-react";

interface TaskExtractionButtonProps {
  onExtractFromLastMessage: () => void;
  onExtractFromConversation: () => void;
  onExtractCustomRange?: () => void;
  isExtracting?: boolean;
  disabled?: boolean;
}

export function TaskExtractionButton({
  onExtractFromLastMessage,
  onExtractFromConversation,
  onExtractCustomRange,
  isExtracting = false,
  disabled = false,
}: TaskExtractionButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isExtracting}
          className="gap-2"
        >
          {isExtracting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Extracting...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Extract Tasks
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Extract tasks from...</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onExtractFromLastMessage}
          disabled={isExtracting}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Last Message
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onExtractFromConversation}
          disabled={isExtracting}
        >
          <MessagesSquare className="h-4 w-4 mr-2" />
          Full Conversation
        </DropdownMenuItem>
        {onExtractCustomRange && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onExtractCustomRange}
              disabled={isExtracting}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Custom Range...
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
