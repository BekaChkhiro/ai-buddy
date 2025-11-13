/**
 * Auth layout - Centered card design for authentication pages
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Sign in or create an account",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Claude Project Manager</h1>
          <p className="text-muted-foreground mt-2">Manage your projects with AI assistance</p>
        </div>
        {children}
      </div>
    </div>
  );
}
