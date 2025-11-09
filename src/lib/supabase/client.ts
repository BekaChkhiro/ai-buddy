import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

/**
 * Creates a Supabase client for use in browser/client components
 * This client uses browser cookies for session management
 *
 * @returns A Supabase client instance configured for browser usage
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check your .env.local file.",
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

// Export alias for consistency
export { createClient as createBrowserClient }
