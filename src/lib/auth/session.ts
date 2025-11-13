/**
 * Session management utilities
 * Handles session retrieval, validation, and refresh
 */

import { createBrowserClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

// =====================================================
// SESSION RETRIEVAL
// =====================================================

/**
 * Get current session (client-side)
 */
export async function getSession(): Promise<Session | null> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    return null;
  }

  return data.session;
}

// =====================================================
// SESSION VALIDATION
// =====================================================

/**
 * Check if session is valid and not expired
 */
export function isSessionValid(session: Session | null): boolean {
  if (!session) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  return session.expires_at ? session.expires_at > now : false;
}

/**
 * Get time until session expires (in seconds)
 */
export function getSessionTimeRemaining(session: Session | null): number {
  if (!session || !session.expires_at) {
    return 0;
  }

  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, session.expires_at - now);
}

/**
 * Check if session will expire soon (within 5 minutes)
 */
export function isSessionExpiringSoon(session: Session | null): boolean {
  const timeRemaining = getSessionTimeRemaining(session);
  return timeRemaining > 0 && timeRemaining < 300; // 5 minutes
}

// =====================================================
// SESSION REFRESH
// =====================================================

/**
 * Refresh the current session (client-side)
 */
export async function refreshSession(): Promise<Session | null> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.refreshSession();

  if (error || !data.session) {
    return null;
  }

  return data.session;
}

/**
 * Refresh session if it's expiring soon
 */
export async function refreshSessionIfNeeded(): Promise<Session | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  if (isSessionExpiringSoon(session)) {
    return refreshSession();
  }

  return session;
}

// =====================================================
// USER DATA FROM SESSION
// =====================================================

/**
 * Extract user ID from session
 */
export function getUserIdFromSession(session: Session | null): string | null {
  return session?.user?.id || null;
}

/**
 * Extract user email from session
 */
export function getUserEmailFromSession(session: Session | null): string | null {
  return session?.user?.email || null;
}

/**
 * Extract user metadata from session
 */
export function getUserMetadataFromSession(session: Session | null): Record<string, any> {
  return session?.user?.user_metadata || {};
}

// =====================================================
// SESSION STORAGE
// =====================================================

/**
 * Clear session storage (useful for logout)
 */
export async function clearSessionStorage(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  // Clear any auth-related localStorage items
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("sb-")) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

// =====================================================
// AUTO REFRESH
// =====================================================

let refreshInterval: NodeJS.Timeout | null = null;

/**
 * Start auto-refresh interval (checks every minute)
 */
export function startAutoRefresh(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (refreshInterval) {
    return; // Already running
  }

  refreshInterval = setInterval(async () => {
    await refreshSessionIfNeeded();
  }, 60000); // Check every minute
}

/**
 * Stop auto-refresh interval
 */
export function stopAutoRefresh(): void {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}
