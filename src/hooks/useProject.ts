/**
 * useProject Hook
 * Single project operations
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Project, ApiResponse, UpdateProjectForm } from "@/types";

interface UseProjectOptions {
  projectId: string;
  autoFetch?: boolean;
}

interface UseProjectReturn {
  project: Project | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProject: (data: UpdateProjectForm) => Promise<Project | null>;
  deleteProject: () => Promise<boolean>;
}

export function useProject(options: UseProjectOptions): UseProjectReturn {
  const { projectId, autoFetch = true } = options;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const result: ApiResponse<Project> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Failed to fetch project");
      }

      setProject(result.data || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch project";
      setError(message);
      console.error("Error fetching project:", err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const updateProject = useCallback(
    async (data: UpdateProjectForm): Promise<Project | null> => {
      if (!projectId) return null;

      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result: ApiResponse<Project> = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error?.message || "Failed to update project");
        }

        // Update local state
        if (result.data) {
          setProject(result.data);
        }

        return result.data || null;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update project";
        setError(message);
        console.error("Error updating project:", err);
        return null;
      }
    },
    [projectId]
  );

  const deleteProject = useCallback(async (): Promise<boolean> => {
    if (!projectId) return false;

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      const result: ApiResponse<{ id: string }> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Failed to delete project");
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete project";
      setError(message);
      console.error("Error deleting project:", err);
      return false;
    }
  }, [projectId]);

  useEffect(() => {
    if (autoFetch && projectId) {
      fetchProject();
    }
  }, [autoFetch, projectId, fetchProject]);

  return {
    project,
    isLoading,
    error,
    refetch: fetchProject,
    updateProject,
    deleteProject,
  };
}
