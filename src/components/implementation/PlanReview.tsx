"use client";

/**
 * PlanReview Component
 * Display implementation plan for review
 */

import { Badge } from "@/components/ui/badge";
import {
  FileText,
  FilePlus,
  FileEdit,
  Trash2,
  Terminal,
  TestTube,
  CheckCircle2,
  Circle,
  XCircle,
} from "lucide-react";

interface PlanReviewProps {
  plan: {
    steps: Array<{
      id: string;
      title: string;
      description: string;
      type: string;
      target?: string;
      order: number;
      status: string;
      dependencies?: string[];
      validation?: any[];
    }>;
    estimatedDuration?: number;
    risks?: string[];
    dependencies?: string[];
  };
}

export function PlanReview({ plan }: PlanReviewProps) {
  const getStepIcon = (type: string) => {
    switch (type) {
      case "create_file":
        return <FilePlus className="h-4 w-4 text-green-600" />;
      case "modify_file":
        return <FileEdit className="h-4 w-4 text-blue-600" />;
      case "delete_file":
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case "run_command":
        return <Terminal className="h-4 w-4 text-purple-600" />;
      case "test":
        return <TestTube className="h-4 w-4 text-orange-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "in_progress":
        return <Circle className="h-4 w-4 text-blue-600 animate-pulse" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Overview */}
      <div className="p-4 border rounded-lg bg-muted/50">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Total Steps:</span> {plan.steps.length}
          </div>
          {plan.estimatedDuration && (
            <div>
              <span className="font-medium">Estimated Time:</span>{" "}
              {plan.estimatedDuration} minutes
            </div>
          )}
        </div>

        {plan.dependencies && plan.dependencies.length > 0 && (
          <div className="mt-3">
            <span className="font-medium text-sm">Required Dependencies:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {plan.dependencies.map((dep, index) => (
                <Badge key={index} variant="outline">
                  {dep}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {plan.risks && plan.risks.length > 0 && (
          <div className="mt-3">
            <span className="font-medium text-sm text-yellow-600">
              Potential Risks:
            </span>
            <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground">
              {plan.risks.map((risk, index) => (
                <li key={index}>{risk}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Implementation Steps:</h4>
        <div className="space-y-2">
          {plan.steps.map((step) => (
            <div
              key={step.id}
              className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(step.status)}
                  {getStepIcon(step.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {step.order}. {step.title}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {step.type.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.description}
                  </p>
                  {step.target && (
                    <code className="text-xs text-muted-foreground mt-1 block">
                      {step.target}
                    </code>
                  )}
                  {step.dependencies && step.dependencies.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      <span className="font-medium">Depends on:</span>{" "}
                      {step.dependencies.join(", ")}
                    </div>
                  )}
                  {step.validation && step.validation.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {step.validation.map((v: any, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {v.type}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
