"use client";

import { TaskHistoryWithProfile } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

interface TaskTimelineProps {
  history: TaskHistoryWithProfile[];
}

const getActionLabel = (action: string, fieldName?: string | null): string => {
  switch (action) {
    case "created":
      return "created this task";
    case "updated":
      return fieldName ? `updated ${fieldName}` : "updated this task";
    case "status_changed":
      return "changed the status";
    case "implementation_started":
      return "started implementation";
    default:
      return action;
  }
};

export function TaskTimeline({ history }: TaskTimelineProps) {
  if (history.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No history available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((entry, index) => (
        <div key={entry.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {entry.user.fullName
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() || entry.user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {index < history.length - 1 && (
              <div className="w-px flex-1 bg-border mt-2" />
            )}
          </div>

          <div className="flex-1 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm">
                  <span className="font-medium">
                    {entry.user.fullName || entry.user.email}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    {getActionLabel(entry.action, entry.fieldName)}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(entry.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>

            {entry.oldValue && entry.newValue && (
              <div className="mt-2 text-xs bg-muted p-2 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground line-through">
                    {entry.oldValue}
                  </span>
                  <span>→</span>
                  <span className="font-medium">{entry.newValue}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
