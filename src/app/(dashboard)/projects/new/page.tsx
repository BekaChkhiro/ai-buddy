/**
 * New Project Page
 * Form for creating a new project
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectForm } from "@/components/projects";
import { useToast } from "@/hooks/use-toast";
import { CreateProjectForm } from "@/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateProjectForm) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Failed to create project");
      }

      toast({
        title: "Project created",
        description: `${data.name} has been created successfully.`,
      });

      // Redirect to the new project page
      router.push(`/projects/${result.data.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/projects");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
          <p className="text-muted-foreground">
            Set up a new project to start tracking tasks and conversations
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>Fill in the information below to create your project</CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
