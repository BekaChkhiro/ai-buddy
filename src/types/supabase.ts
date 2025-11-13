/**
 * Supabase Database Types
 * Auto-generated based on database schema
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          folder_path: string | null;
          tech_stack: string[];
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          folder_path?: string | null;
          tech_stack?: string[];
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          folder_path?: string | null;
          tech_stack?: string[];
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          project_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          role?: "user" | "assistant" | "system";
          content?: string;
          created_at?: string;
          user_id?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          status: "pending" | "in_progress" | "completed" | "failed" | "blocked";
          priority: "low" | "medium" | "high" | "urgent";
          implementation_details: Json | null;
          created_at: string;
          updated_at: string;
          implemented_at: string | null;
          implementation_log: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          status?: "pending" | "in_progress" | "completed" | "failed" | "blocked";
          priority?: "low" | "medium" | "high" | "urgent";
          implementation_details?: Json | null;
          created_at?: string;
          updated_at?: string;
          implemented_at?: string | null;
          implementation_log?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          status?: "pending" | "in_progress" | "completed" | "failed" | "blocked";
          priority?: "low" | "medium" | "high" | "urgent";
          implementation_details?: Json | null;
          created_at?: string;
          updated_at?: string;
          implemented_at?: string | null;
          implementation_log?: string | null;
        };
      };
      task_executions: {
        Row: {
          id: string;
          task_id: string;
          status: "running" | "success" | "failed" | "cancelled";
          changes: Json | null;
          error_log: string | null;
          executed_at: string;
          executed_by: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          status?: "running" | "success" | "failed" | "cancelled";
          changes?: Json | null;
          error_log?: string | null;
          executed_at?: string;
          executed_by: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          status?: "running" | "success" | "failed" | "cancelled";
          changes?: Json | null;
          error_log?: string | null;
          executed_at?: string;
          executed_by?: string;
        };
      };
      token_usage: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          input_tokens: number;
          output_tokens: number;
          total_tokens: number;
          model: string;
          cost: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id: string;
          input_tokens: number;
          output_tokens: number;
          total_tokens: number;
          model: string;
          cost?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string;
          input_tokens?: number;
          output_tokens?: number;
          total_tokens?: number;
          model?: string;
          cost?: number;
          created_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          title: string | null;
          mode: "planning" | "implementation" | "review" | "general";
          context_files: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          title?: string | null;
          mode?: "planning" | "implementation" | "review" | "general";
          context_files?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          title?: string | null;
          mode?: "planning" | "implementation" | "review" | "general";
          context_files?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          parent_id: string | null;
          role: "user" | "assistant" | "system";
          content: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          parent_id?: string | null;
          role: "user" | "assistant" | "system";
          content: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          parent_id?: string | null;
          role?: "user" | "assistant" | "system";
          content?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_usage_stats: {
        Args: {
          p_user_id: string;
          p_start_date?: string;
          p_end_date?: string;
        };
        Returns: {
          total_input_tokens: number;
          total_output_tokens: number;
          total_tokens: number;
          total_cost: number;
          request_count: number;
          average_tokens_per_request: number;
        }[];
      };
      get_project_usage_stats: {
        Args: {
          p_project_id: string;
          p_start_date?: string;
          p_end_date?: string;
        };
        Returns: {
          total_input_tokens: number;
          total_output_tokens: number;
          total_tokens: number;
          total_cost: number;
          request_count: number;
          average_tokens_per_request: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
