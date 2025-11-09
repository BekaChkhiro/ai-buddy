/**
 * Supabase Database Types
 *
 * This file will be auto-generated when you run: npm run types:supabase
 * To generate types, you need to:
 * 1. Have the Supabase CLI installed: npm install -g supabase
 * 2. Have your Supabase project URL and service role key
 * 3. Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
 *
 * Alternatively, you can link your project and generate types:
 * - supabase link --project-ref YOUR_PROJECT_ID
 * - supabase gen types typescript --linked > src/types/supabase.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
