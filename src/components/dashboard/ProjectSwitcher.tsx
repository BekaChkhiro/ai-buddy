"use client";

/**
 * Project switcher dropdown
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@/lib/supabase/client";
import { getProjects } from "@/lib/supabase/queries";
import type { Project } from "@/types";
import { cn } from "@/lib/utils";

interface ProjectSwitcherProps {
  currentProjectId?: string;
}

export function ProjectSwitcher({ currentProjectId }: ProjectSwitcherProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const supabase = createBrowserClient();
      const projectList = await getProjects(supabase);
      setProjects(projectList);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const currentProject = projects.find((p) => p.id === currentProjectId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between">
          <span className="truncate">
            {isLoading ? "Loading..." : currentProject ? currentProject.name : "Select project"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuLabel>Projects</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {projects.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">No projects yet</div>
        ) : (
          projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => router.push(`/projects/${project.id}`)}
              className="cursor-pointer"
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  currentProjectId === project.id ? "opacity-100" : "opacity-0"
                )}
              />
              <div className="flex flex-col">
                <span className="font-medium">{project.name}</span>
                {project.description && (
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {project.description}
                  </span>
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/projects/new")} className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          <span>Create new project</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
