/**
 * Task Templates
 * Predefined task templates for common workflows
 */

import { TaskPriority, TaskStatus } from "@/types";

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tasks: TaskTemplateItem[];
}

export interface TaskTemplateItem {
  title: string;
  description: string;
  priority: TaskPriority;
  status?: TaskStatus;
  estimatedHours?: number;
  labels?: string[];
  dependencies?: number[]; // Index of tasks this depends on
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: "feature-development",
    name: "Feature Development",
    description: "Complete workflow for developing a new feature",
    category: "Development",
    tasks: [
      {
        title: "Feature Planning & Requirements",
        description:
          "Define feature requirements, user stories, and acceptance criteria",
        priority: "high",
        status: "pending",
        estimatedHours: 4,
        labels: ["planning", "requirements"],
      },
      {
        title: "Design & Architecture",
        description:
          "Create technical design and architecture for the feature",
        priority: "high",
        status: "pending",
        estimatedHours: 6,
        labels: ["design", "architecture"],
        dependencies: [0],
      },
      {
        title: "Backend Implementation",
        description: "Implement backend API and business logic",
        priority: "high",
        status: "pending",
        estimatedHours: 16,
        labels: ["backend", "implementation"],
        dependencies: [1],
      },
      {
        title: "Frontend Implementation",
        description: "Implement frontend UI and components",
        priority: "high",
        status: "pending",
        estimatedHours: 16,
        labels: ["frontend", "implementation"],
        dependencies: [1],
      },
      {
        title: "Write Unit Tests",
        description: "Write comprehensive unit tests for the feature",
        priority: "medium",
        status: "pending",
        estimatedHours: 8,
        labels: ["testing", "unit-tests"],
        dependencies: [2, 3],
      },
      {
        title: "Integration Testing",
        description: "Test feature integration with existing system",
        priority: "medium",
        status: "pending",
        estimatedHours: 4,
        labels: ["testing", "integration"],
        dependencies: [4],
      },
      {
        title: "Documentation",
        description: "Write user and technical documentation",
        priority: "medium",
        status: "pending",
        estimatedHours: 4,
        labels: ["documentation"],
        dependencies: [5],
      },
      {
        title: "Code Review & Deployment",
        description: "Conduct code review and deploy to production",
        priority: "high",
        status: "pending",
        estimatedHours: 2,
        labels: ["review", "deployment"],
        dependencies: [6],
      },
    ],
  },
  {
    id: "bug-fix",
    name: "Bug Fix Workflow",
    description: "Standard workflow for fixing bugs",
    category: "Maintenance",
    tasks: [
      {
        title: "Bug Investigation",
        description: "Reproduce bug and identify root cause",
        priority: "urgent",
        status: "pending",
        estimatedHours: 2,
        labels: ["bug", "investigation"],
      },
      {
        title: "Implement Fix",
        description: "Develop and test the bug fix",
        priority: "urgent",
        status: "pending",
        estimatedHours: 4,
        labels: ["bug", "fix"],
        dependencies: [0],
      },
      {
        title: "Add Regression Tests",
        description: "Add tests to prevent bug from recurring",
        priority: "high",
        status: "pending",
        estimatedHours: 2,
        labels: ["testing", "regression"],
        dependencies: [1],
      },
      {
        title: "Deploy Fix",
        description: "Deploy bug fix to production",
        priority: "urgent",
        status: "pending",
        estimatedHours: 1,
        labels: ["deployment"],
        dependencies: [2],
      },
    ],
  },
  {
    id: "api-endpoint",
    name: "New API Endpoint",
    description: "Create a new REST API endpoint",
    category: "Development",
    tasks: [
      {
        title: "Define API Specification",
        description:
          "Define request/response format, validation rules, and authentication",
        priority: "high",
        status: "pending",
        estimatedHours: 2,
        labels: ["api", "specification"],
      },
      {
        title: "Database Schema Updates",
        description: "Create or update database tables and migrations",
        priority: "high",
        status: "pending",
        estimatedHours: 3,
        labels: ["database", "migration"],
        dependencies: [0],
      },
      {
        title: "Implement Endpoint Handler",
        description: "Write API handler with business logic",
        priority: "high",
        status: "pending",
        estimatedHours: 4,
        labels: ["backend", "api"],
        dependencies: [1],
      },
      {
        title: "Add Input Validation",
        description: "Implement request validation and error handling",
        priority: "medium",
        status: "pending",
        estimatedHours: 2,
        labels: ["validation", "error-handling"],
        dependencies: [2],
      },
      {
        title: "Write API Tests",
        description: "Write integration tests for the endpoint",
        priority: "medium",
        status: "pending",
        estimatedHours: 3,
        labels: ["testing", "api"],
        dependencies: [3],
      },
      {
        title: "Update API Documentation",
        description: "Document the new endpoint in API docs",
        priority: "medium",
        status: "pending",
        estimatedHours: 1,
        labels: ["documentation", "api"],
        dependencies: [4],
      },
    ],
  },
  {
    id: "ui-component",
    name: "New UI Component",
    description: "Create a reusable UI component",
    category: "Frontend",
    tasks: [
      {
        title: "Component Design",
        description: "Design component props, variants, and behavior",
        priority: "high",
        status: "pending",
        estimatedHours: 2,
        labels: ["design", "ui"],
      },
      {
        title: "Implement Component",
        description: "Build the component with TypeScript and styling",
        priority: "high",
        status: "pending",
        estimatedHours: 6,
        labels: ["frontend", "component"],
        dependencies: [0],
      },
      {
        title: "Add Component Tests",
        description: "Write unit tests for the component",
        priority: "medium",
        status: "pending",
        estimatedHours: 3,
        labels: ["testing", "component"],
        dependencies: [1],
      },
      {
        title: "Create Storybook Stories",
        description: "Document component usage with Storybook",
        priority: "low",
        status: "pending",
        estimatedHours: 2,
        labels: ["documentation", "storybook"],
        dependencies: [2],
      },
      {
        title: "Accessibility Review",
        description: "Ensure component meets accessibility standards",
        priority: "medium",
        status: "pending",
        estimatedHours: 2,
        labels: ["accessibility", "a11y"],
        dependencies: [1],
      },
    ],
  },
  {
    id: "database-migration",
    name: "Database Migration",
    description: "Safe database schema change workflow",
    category: "Database",
    tasks: [
      {
        title: "Plan Migration Strategy",
        description:
          "Design migration approach with rollback plan",
        priority: "high",
        status: "pending",
        estimatedHours: 2,
        labels: ["database", "planning"],
      },
      {
        title: "Write Migration Script",
        description: "Create up and down migration scripts",
        priority: "high",
        status: "pending",
        estimatedHours: 3,
        labels: ["database", "migration"],
        dependencies: [0],
      },
      {
        title: "Test on Staging",
        description: "Test migration on staging environment",
        priority: "high",
        status: "pending",
        estimatedHours: 2,
        labels: ["testing", "staging"],
        dependencies: [1],
      },
      {
        title: "Update Application Code",
        description: "Update code to work with new schema",
        priority: "high",
        status: "pending",
        estimatedHours: 4,
        labels: ["backend", "migration"],
        dependencies: [1],
      },
      {
        title: "Production Migration",
        description: "Execute migration in production",
        priority: "urgent",
        status: "pending",
        estimatedHours: 1,
        labels: ["database", "production"],
        dependencies: [2, 3],
      },
      {
        title: "Post-Migration Verification",
        description: "Verify data integrity and application functionality",
        priority: "urgent",
        status: "pending",
        estimatedHours: 1,
        labels: ["testing", "verification"],
        dependencies: [4],
      },
    ],
  },
  {
    id: "performance-optimization",
    name: "Performance Optimization",
    description: "Identify and fix performance issues",
    category: "Optimization",
    tasks: [
      {
        title: "Performance Profiling",
        description: "Profile application to identify bottlenecks",
        priority: "high",
        status: "pending",
        estimatedHours: 4,
        labels: ["performance", "profiling"],
      },
      {
        title: "Analyze Results",
        description: "Analyze profiling data and prioritize fixes",
        priority: "high",
        status: "pending",
        estimatedHours: 2,
        labels: ["performance", "analysis"],
        dependencies: [0],
      },
      {
        title: "Implement Optimizations",
        description: "Apply performance optimizations",
        priority: "high",
        status: "pending",
        estimatedHours: 8,
        labels: ["performance", "optimization"],
        dependencies: [1],
      },
      {
        title: "Benchmark Results",
        description: "Measure performance improvements",
        priority: "medium",
        status: "pending",
        estimatedHours: 2,
        labels: ["performance", "benchmarking"],
        dependencies: [2],
      },
      {
        title: "Documentation",
        description: "Document optimization techniques used",
        priority: "low",
        status: "pending",
        estimatedHours: 1,
        labels: ["documentation"],
        dependencies: [3],
      },
    ],
  },
];

/**
 * Get all available templates
 */
export function getTemplates(): TaskTemplate[] {
  return TASK_TEMPLATES;
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): TaskTemplate | undefined {
  return TASK_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  category: string,
): TaskTemplate[] {
  return TASK_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get all unique categories
 */
export function getCategories(): string[] {
  const categories = new Set(TASK_TEMPLATES.map((t) => t.category));
  return Array.from(categories).sort();
}
