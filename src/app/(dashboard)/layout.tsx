/**
 * Dashboard layout
 * Includes sidebar navigation, user menu, and main content area
 */

import type { Metadata } from "next";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { UserMenu } from "@/components/auth/UserMenu";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | Claude Project Manager",
  },
  description: "Manage your projects with AI assistance",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Projects</h2>
          </div>

          {/* User menu */}
          <div className="flex items-center gap-4">
            <UserMenu />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
      </div>

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}
