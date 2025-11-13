/**
 * Global Chat Page
 * Chat interface for all projects with project selector
 */

import { Suspense } from "react";
import { createServerClient } from "@/lib/supabase/server";
import { getProjects } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";
import { GlobalChatInterface } from "@/components/chat/GlobalChatInterface";

export default async function ChatPage() {
  const supabase = await createServerClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's projects
  const projects = await getProjects(supabase);

  // If no projects, redirect to create one
  if (!projects || projects.length === 0) {
    redirect("/projects/new");
  }

  // Get default project (we know projects.length > 0 here)
  const defaultProjectId = projects[0]?.id;
  if (!defaultProjectId) {
    redirect("/projects/new");
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Page header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI Chat Assistant</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Get AI-powered help across all your projects
            </p>
          </div>
        </div>
      </div>

      {/* Chat interface */}
      <div className="flex-1 overflow-hidden">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <GlobalChatInterface projects={projects} defaultProjectId={defaultProjectId} />
        </Suspense>
      </div>
    </div>
  );
}

export const metadata = {
  title: "Chat - Claude Project Manager",
  description: "AI-powered chat assistant for your projects",
};
