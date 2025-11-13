/**
 * ProjectForm Component
 * Form for creating and editing projects
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Project } from "@/types";
import { FolderPicker } from "./FolderPicker";

interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ProjectForm({ project, onSubmit, onCancel, isLoading }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    name: project?.name || "",
    description: project?.description || "",
    folderPath: project?.folderPath || "",
    techStack: project?.techStack || [],
  });
  const [techInput, setTechInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        folderPath: formData.folderPath.trim() || undefined,
        techStack: formData.techStack,
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const addTech = () => {
    const tech = techInput.trim();
    if (tech && !formData.techStack.includes(tech)) {
      setFormData({
        ...formData,
        techStack: [...formData.techStack, tech],
      });
      setTechInput("");
    }
  };

  const removeTech = (tech: string) => {
    setFormData({
      ...formData,
      techStack: formData.techStack.filter((t) => t !== tech),
    });
  };

  const handleTechInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTech();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Project Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Project Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => {
            setFormData({ ...formData, name: e.target.value });
            setErrors({ ...errors, name: "" });
          }}
          placeholder="My Awesome Project"
          disabled={isLoading}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of your project..."
          rows={4}
          disabled={isLoading}
        />
      </div>

      {/* Folder Path */}
      <div className="space-y-2">
        <Label htmlFor="folderPath">Project Folder</Label>
        <FolderPicker
          value={formData.folderPath}
          onChange={(path) => setFormData({ ...formData, folderPath: path })}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Select the local folder containing your project files
        </p>
      </div>

      {/* Tech Stack */}
      <div className="space-y-2">
        <Label htmlFor="techStack">Tech Stack</Label>
        <div className="flex gap-2">
          <Input
            id="techStack"
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={handleTechInputKeyDown}
            placeholder="e.g., React, TypeScript, Node.js"
            disabled={isLoading}
          />
          <Button type="button" onClick={addTech} disabled={isLoading || !techInput.trim()}>
            Add
          </Button>
        </div>
        {formData.techStack.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.techStack.map((tech) => (
              <Badge key={tech} variant="secondary" className="gap-1">
                {tech}
                <button
                  type="button"
                  onClick={() => removeTech(tech)}
                  disabled={isLoading}
                  className="ml-1 hover:bg-destructive/20 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : project ? "Update Project" : "Create Project"}
        </Button>
      </div>
    </form>
  );
}
