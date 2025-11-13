/**
 * API Route: /api/tasks/[id]/history
 * Get task history
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/database";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/tasks/[id]/history
 * Get task change history
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      },
    );

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get task history
    const { data: history, error: historyError } = await supabase
      .from("task_history")
      .select(
        `
        *,
        user:profiles(id, email, full_name, avatar_url)
      `,
      )
      .eq("task_id", id)
      .order("created_at", { ascending: false });

    if (historyError) {
      console.error("Error fetching task history:", historyError);
      return NextResponse.json(
        { error: "Failed to fetch task history" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: history || [],
    });
  } catch (error) {
    console.error("Error in GET /api/tasks/[id]/history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
