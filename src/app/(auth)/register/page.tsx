/**
 * Register page
 */

import type { Metadata } from 'next'
import { AuthForm } from '@/components/auth/AuthForm'

export const metadata: Metadata = {
  title: 'Register',
  description: 'Create a new account',
}

export default function RegisterPage() {
  return <AuthForm mode="register" />
}
