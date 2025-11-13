"use client";

/**
 * ImplementationModal Component
 * Modal showing implementation progress and plan review
 */

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Play,
  X,
} from "lucide-react";
import { PlanReview } from "./PlanReview";
import { CodePreview } from "./CodePreview";
import { ImplementationLog } from "./ImplementationLog";
import { useToast } from "@/components/ui/toast";

interface ImplementationModalProps {
  taskId: string;
  taskTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onStarting?: (starting: boolean) => void;
}

type ImplementationStatus =
  | "idle"
  | "planning"
  | "reviewing"
  | "executing"
  | "validating"
  | "completed"
  | "failed"
  | "cancelled";

interface ImplementationProgress {
  status: ImplementationStatus;
  currentStep?: number;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  message?: string;
  error?: string;
  plan?: any;
  results?: any[];
  canRollback: boolean;
}

export function ImplementationModal({
  taskId,
  taskTitle,
  isOpen,
  onClose,
  onStarting,
}: ImplementationModalProps) {
  const [progress, setProgress] = useState<ImplementationProgress>({
    status: "idle",
    totalSteps: 0,
    completedSteps: 0,
    failedSteps: 0,
    canRollback: false,
  });
  const [logs, setLogs] = useState<any[]>([]);
  const [config, setConfig] = useState({
    dryRun: false,
    enableBackups: true,
    runTests: true,
    validateSyntax: true,
    createCommit: false,
  });
  const eventSourceRef = useRef<EventSource | null>(null);
  const { toast } = useToast();

  // Start implementation
  const startImplementation = async () => {
    try {
      onStarting?.(true);

      const response = await fetch(`/api/tasks/${taskId}/implement`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ config }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start implementation");
      }

      // Start listening to SSE updates
      connectToSSE();

      toast({
        title: "Implementation Started",
        description: "Claude is now implementing your task...",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to start implementation",
        variant: "destructive",
      });
      setProgress({
        ...progress,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      onStarting?.(false);
    }
  };

  // Connect to SSE endpoint
  const connectToSSE = () => {
    const eventSource = new EventSource(
      `/api/tasks/${taskId}/implement`,
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProgress(data);
    };

    eventSource.addEventListener("implementation", (event) => {
      const data = JSON.parse((event as MessageEvent).data);
      setLogs((prev) => [...prev, data]);
    });

    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      eventSource.close();
    };

    eventSourceRef.current = eventSource;
  };

  // Cancel implementation
  const cancelImplementation = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/implement`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel implementation");
      }

      toast({
        title: "Cancelled",
        description: "Implementation has been cancelled",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel implementation",
        variant: "destructive",
      });
    }
  };

  // Approve plan
  const approvePlan = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/implement`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "approve" }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve plan");
      }

      toast({
        title: "Plan Approved",
        description: "Continuing with implementation...",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve plan",
        variant: "destructive",
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Calculate progress percentage
  const progressPercentage =
    progress.totalSteps > 0
      ? (progress.completedSteps / progress.totalSteps) * 100
      : 0;

  // Status icon
  const getStatusIcon = () => {
    switch (progress.status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "cancelled":
        return <X className="h-5 w-5 text-gray-600" />;
      case "planning":
      case "executing":
      case "validating":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
      case "reviewing":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const canStart = progress.status === "idle";
  const canCancel =
    progress.status === "planning" ||
    progress.status === "executing" ||
    progress.status === "reviewing";
  const needsApproval = progress.status === "reviewing";
  const isComplete =
    progress.status === "completed" ||
    progress.status === "failed" ||
    progress.status === "cancelled";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Implement: {taskTitle}
          </DialogTitle>
          <DialogDescription>
            {progress.status === "idle" &&
              "Configure and start the implementation"}
            {progress.status === "planning" && "Generating implementation plan..."}
            {progress.status === "reviewing" &&
              "Review the plan and approve to continue"}
            {progress.status === "executing" && "Executing implementation steps..."}
            {progress.status === "validating" && "Validating changes..."}
            {progress.status === "completed" && "Implementation completed successfully!"}
            {progress.status === "failed" && "Implementation failed"}
            {progress.status === "cancelled" && "Implementation cancelled"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Bar */}
          {progress.totalSteps > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  Step {progress.currentStep || 0} of {progress.totalSteps}
                </span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Completed: {progress.completedSteps}</span>
                {progress.failedSteps > 0 && (
                  <span className="text-red-600">
                    Failed: {progress.failedSteps}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Error Alert */}
          {progress.error && (
            <Alert variant="destructive">
              <AlertDescription>{progress.error}</AlertDescription>
            </Alert>
          )}

          {/* Configuration (only show when idle) */}
          {canStart && (
            <div className="space-y-3 p-4 border rounded-lg">
              <h3 className="font-medium">Configuration</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.dryRun}
                    onChange={(e) =>
                      setConfig({ ...config, dryRun: e.target.checked })
                    }
                  />
                  <span className="text-sm">Dry Run (preview only)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.enableBackups}
                    onChange={(e) =>
                      setConfig({ ...config, enableBackups: e.target.checked })
                    }
                  />
                  <span className="text-sm">Enable Backups</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.validateSyntax}
                    onChange={(e) =>
                      setConfig({ ...config, validateSyntax: e.target.checked })
                    }
                  />
                  <span className="text-sm">Validate Syntax</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.runTests}
                    onChange={(e) =>
                      setConfig({ ...config, runTests: e.target.checked })
                    }
                  />
                  <span className="text-sm">Run Tests</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.createCommit}
                    onChange={(e) =>
                      setConfig({ ...config, createCommit: e.target.checked })
                    }
                  />
                  <span className="text-sm">Create Git Commit</span>
                </label>
              </div>
            </div>
          )}

          {/* Tabs for different views */}
          {!canStart && (
            <Tabs defaultValue="log" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="log">Log</TabsTrigger>
                {progress.plan && <TabsTrigger value="plan">Plan</TabsTrigger>}
                {progress.results && progress.results.length > 0 && (
                  <TabsTrigger value="changes">Changes</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="log" className="max-h-96 overflow-y-auto">
                <ImplementationLog logs={logs} />
              </TabsContent>

              {progress.plan && (
                <TabsContent value="plan" className="max-h-96 overflow-y-auto">
                  <PlanReview plan={progress.plan} />
                </TabsContent>
              )}

              {progress.results && progress.results.length > 0 && (
                <TabsContent value="changes" className="max-h-96 overflow-y-auto">
                  <CodePreview results={progress.results} />
                </TabsContent>
              )}
            </Tabs>
          )}

          {/* Actions */}
          <div className="flex justify-between gap-2">
            <div>
              {canStart && (
                <Button onClick={startImplementation}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Implementation
                </Button>
              )}
              {needsApproval && (
                <Button onClick={approvePlan} variant="default">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve Plan
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {canCancel && (
                <Button onClick={cancelImplementation} variant="destructive">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
              {isComplete && (
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
