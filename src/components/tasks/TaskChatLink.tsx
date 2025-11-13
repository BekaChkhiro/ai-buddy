"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MessageSquare,
  ExternalLink,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

interface TaskChatLinkProps {
  conversationId?: string;
  conversationTitle?: string;
  sourceMessageIds?: string[];
  confidenceScore?: number;
  extractedAt?: Date;
  onViewConversation?: () => void;
  onViewMessage?: (messageId: string) => void;
}

export function TaskChatLink({
  conversationId,
  conversationTitle,
  sourceMessageIds,
  confidenceScore,
  extractedAt,
  onViewConversation,
  onViewMessage,
}: TaskChatLinkProps) {
  if (!conversationId && !sourceMessageIds?.length) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">
                AI-Generated Task
              </CardTitle>
              {extractedAt && (
                <CardDescription className="text-xs mt-0.5">
                  Extracted {format(extractedAt, "MMM d, yyyy 'at' h:mm a")}
                </CardDescription>
              )}
            </div>
          </div>
          {confidenceScore !== undefined && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {Math.round(confidenceScore * 100)}%
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>AI Confidence Score</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {conversationId && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-background border">
            <div className="flex items-center gap-2 min-w-0">
              <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm truncate">
                {conversationTitle || "Conversation"}
              </span>
            </div>
            {onViewConversation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewConversation}
                className="ml-2 flex-shrink-0 h-7"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View
              </Button>
            )}
          </div>
        )}

        {sourceMessageIds && sourceMessageIds.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Source:</span> {sourceMessageIds.length}{" "}
            message{sourceMessageIds.length !== 1 ? "s" : ""} in conversation
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Component to display in task detail view
 */
export function TaskExtractionDetails({
  implementationDetails,
  onViewConversation,
}: {
  implementationDetails: Record<string, any>;
  onViewConversation?: () => void;
}) {
  const {
    complexity,
    technicalRequirements,
    confidenceScore,
    extractedFrom,
    sourceMessageIds,
    suggestedOrder,
  } = implementationDetails;

  return (
    <div className="space-y-4">
      {/* Extraction Info */}
      <TaskChatLink
        conversationId={extractedFrom}
        sourceMessageIds={sourceMessageIds}
        confidenceScore={confidenceScore}
        onViewConversation={onViewConversation}
      />

      {/* Technical Details */}
      <div className="space-y-3">
        {complexity && (
          <div>
            <span className="text-sm font-medium">Complexity:</span>
            <Badge variant="outline" className="ml-2">
              {complexity}
            </Badge>
          </div>
        )}

        {suggestedOrder !== undefined && (
          <div>
            <span className="text-sm font-medium">Suggested Order:</span>
            <Badge variant="outline" className="ml-2">
              #{suggestedOrder}
            </Badge>
          </div>
        )}

        {technicalRequirements && technicalRequirements.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">
              Technical Requirements:
            </div>
            <div className="flex flex-wrap gap-1">
              {technicalRequirements.map((req: string, i: number) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {req}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
