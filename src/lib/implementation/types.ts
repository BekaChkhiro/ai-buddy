/**
 * Implementation System Types
 * Type definitions for the task implementation engine
 */

export type ImplementationStatus =
  | "pending"
  | "planning"
  | "reviewing"
  | "executing"
  | "validating"
  | "completed"
  | "failed"
  | "cancelled";

export type StepStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "skipped";

export type ChangeType = "create" | "modify" | "delete";

export interface TaskContext {
  taskId: string;
  title: string;
  description: string;
  acceptance_criteria?: string;
  projectId: string;
  projectPath: string;
  techStack: string[];
  existingFiles?: string[];
  relatedFiles?: FileContent[];
}

export interface FileContent {
  path: string;
  content: string;
  language?: string;
}

export interface ImplementationPlan {
  steps: ImplementationStep[];
  estimatedDuration?: number;
  risks?: string[];
  dependencies?: string[];
}

export interface ImplementationStep {
  id: string;
  title: string;
  description: string;
  type: "create_file" | "modify_file" | "delete_file" | "run_command" | "test";
  target?: string; // file path or command
  content?: string; // new content or patch
  order: number;
  status: StepStatus;
  dependencies?: string[]; // IDs of steps that must complete first
  validation?: ValidationRule[];
  rollbackInfo?: RollbackInfo;
}

export interface ValidationRule {
  type: "syntax" | "type_check" | "lint" | "test" | "custom";
  command?: string;
  errorPattern?: string;
  successPattern?: string;
}

export interface RollbackInfo {
  changeType: ChangeType;
  filePath: string;
  originalContent?: string; // For modify/delete operations
  backupPath?: string;
  timestamp: string;
}

export interface FileChange {
  path: string;
  changeType: ChangeType;
  originalContent?: string;
  newContent?: string;
  timestamp: string;
}

export interface ExecutionResult {
  stepId: string;
  status: StepStatus;
  output?: string;
  error?: string;
  changes?: FileChange[];
  validationResults?: ValidationResult[];
  duration: number;
}

export interface ValidationResult {
  rule: ValidationRule;
  passed: boolean;
  message?: string;
  output?: string;
}

export interface ImplementationProgress {
  status: ImplementationStatus;
  currentStep?: number;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  message?: string;
  error?: string;
  plan?: ImplementationPlan;
  results?: ExecutionResult[];
  canRollback: boolean;
}

export interface ImplementationConfig {
  dryRun?: boolean;
  autoApprove?: boolean;
  enableBackups?: boolean;
  runTests?: boolean;
  validateSyntax?: boolean;
  createCommit?: boolean;
  maxRetries?: number;
  timeoutMs?: number;
}

export interface ImplementationEvent {
  type:
    | "status_change"
    | "plan_generated"
    | "step_started"
    | "step_completed"
    | "step_failed"
    | "validation_started"
    | "validation_completed"
    | "error"
    | "log";
  timestamp: string;
  data: any;
  message?: string;
}

export class ImplementationError extends Error {
  constructor(
    message: string,
    public code: string,
    public stepId?: string,
    public recoverable: boolean = true,
    public details?: any,
  ) {
    super(message);
    this.name = "ImplementationError";
  }
}

export class ValidationError extends ImplementationError {
  constructor(
    message: string,
    public validationResults: ValidationResult[],
    stepId?: string,
  ) {
    super(message, "VALIDATION_FAILED", stepId, true);
    this.name = "ValidationError";
  }
}

export class RollbackError extends Error {
  constructor(
    message: string,
    public failedChanges: FileChange[],
  ) {
    super(message);
    this.name = "RollbackError";
  }
}
