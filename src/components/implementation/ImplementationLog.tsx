"use client";

/**
 * ImplementationLog Component
 * Display real-time implementation logs
 */

import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  FileText,
} from "lucide-react";

interface ImplementationLogProps {
  logs: Array<{
    type: string;
    timestamp: string;
    message?: string;
    data?: any;
  }>;
}

export function ImplementationLog({ logs }: ImplementationLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getLogIcon = (type: string) => {
    switch (type) {
      case "status_change":
        return <Info className="h-4 w-4 text-blue-600" />;
      case "plan_generated":
        return <FileText className="h-4 w-4 text-purple-600" />;
      case "step_started":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case "step_completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "step_failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "validation_started":
        return <Info className="h-4 w-4 text-yellow-600" />;
      case "validation_completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "log":
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case "step_completed":
      case "validation_completed":
        return "text-green-700 dark:text-green-400";
      case "step_failed":
      case "error":
        return "text-red-700 dark:text-red-400";
      case "step_started":
      case "status_change":
        return "text-blue-700 dark:text-blue-400";
      case "validation_started":
        return "text-yellow-700 dark:text-yellow-400";
      default:
        return "text-gray-700 dark:text-gray-400";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (logs.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No logs yet. Start the implementation to see progress.
      </div>
    );
  }

  return (
    <div className="space-y-2 font-mono text-xs">
      {logs.map((log, index) => (
        <div
          key={index}
          className="flex items-start gap-2 p-2 rounded hover:bg-muted/50 transition-colors"
        >
          <span className="text-muted-foreground mt-0.5">
            {formatTimestamp(log.timestamp)}
          </span>
          <div className="flex-shrink-0 mt-0.5">{getLogIcon(log.type)}</div>
          <div className="flex-1 min-w-0">
            <div className={`${getLogColor(log.type)} break-words`}>
              {log.message || log.type}
            </div>
            {log.data && log.data.step && (
              <div className="text-muted-foreground mt-1">
                Step: {log.data.step.title}
              </div>
            )}
            {log.data && log.data.result && log.data.result.output && (
              <pre className="text-muted-foreground mt-1 text-xs whitespace-pre-wrap overflow-x-auto">
                {log.data.result.output.slice(0, 200)}
                {log.data.result.output.length > 200 && "..."}
              </pre>
            )}
            {log.data && log.data.error && (
              <div className="text-red-600 dark:text-red-400 mt-1">
                Error: {log.data.error.message || String(log.data.error)}
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={logEndRef} />
    </div>
  );
}
