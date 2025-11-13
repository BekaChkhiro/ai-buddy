/**
 * useProjects Hook
 * Fetch and manage all projects
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Project, ApiResponse } from "@/types";

interface UseProjectsOptions {
  autoFetch?: boolean;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

interface UseProjectsReturn {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createProject: (data: {
    name: string;
    description?: string;
    folderPath?: string;
    techStack?: string[];
  }) => Promise<Project | null>;
}

export function useProjects(options: UseProjectsOptions = {}): UseProjectsReturn {
  const { autoFetch = true, sortField, sortDirection } = options;

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (sortField) params.append("sortField", sortField);
      if (sortDirection) params.append("sortDirection", sortDirection);

      const response = await fetch(`/api/projects?${params.toString()}`);
      const result: ApiResponse<Project[]> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Failed to fetch projects");
      }

      setProjects(result.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch projects";
      setError(message);
      console.error("Error fetching projects:", err);
    } finally {
      setIsLoading(false);
    }
  }, [sortField, sortDirection]);

  const createProject = useCallback(
    async (data: {
      name: string;
      description?: string;
      folderPath?: string;
      techStack?: string[];
    }): Promise<Project | null> => {
      try {
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result: ApiResponse<Project> = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error?.message || "Failed to create project");
        }

        // Refresh projects list
        await fetchProjects();

        return result.data || null;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create project";
        setError(message);
        console.error("Error creating project:", err);
        return null;
      }
    },
    [fetchProjects]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchProjects();
    }
  }, [autoFetch, fetchProjects]);

  return {
    projects,
    isLoading,
    error,
    refetch: fetchProjects,
    createProject,
  };
}
