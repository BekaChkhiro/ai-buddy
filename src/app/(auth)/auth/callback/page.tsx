/**
 * Auth callback page
 * Handles email verification and OAuth redirects
 */

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: { code?: string; next?: string }
}) {
  const supabase = await createServerClient()

  if (searchParams.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(searchParams.code)

    if (error) {
      console.error('Auth callback error:', error)
      redirect('/login?error=auth_callback_error')
    }
  }

  // Redirect to the specified page or default to projects
  const next = searchParams.next || '/projects'
  redirect(next)
}
