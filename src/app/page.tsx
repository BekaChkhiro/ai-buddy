/**
 * Home page - Redirects to appropriate page based on auth status
 */

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect to projects if authenticated, otherwise to login
  if (user) {
    redirect('/projects')
  } else {
    redirect('/login')
  }
}
