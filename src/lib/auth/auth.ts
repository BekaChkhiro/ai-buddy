/**
 * Authentication utility functions
 * Handles login, signup, password reset, and logout operations
 */

import { createBrowserClient } from '@/lib/supabase/client'

// =====================================================
// ERROR TYPES
// =====================================================

export interface AuthError {
  message: string
  code?: string
  field?: string
}

export interface AuthResult<T = void> {
  success: boolean
  data?: T
  error?: AuthError
}

// =====================================================
// SIGN UP
// =====================================================

export interface SignUpCredentials {
  email: string
  password: string
  fullName?: string
}

export interface SignUpData {
  userId: string
  email: string
  needsEmailVerification: boolean
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(
  credentials: SignUpCredentials
): Promise<AuthResult<SignUpData>> {
  try {
    const supabase = createBrowserClient()

    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          full_name: credentials.fullName || null,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.status?.toString(),
        },
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: {
          message: 'Failed to create user account',
        },
      }
    }

    return {
      success: true,
      data: {
        userId: data.user.id,
        email: data.user.email || credentials.email,
        needsEmailVerification: !data.user.confirmed_at,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    }
  }
}

// =====================================================
// SIGN IN
// =====================================================

export interface SignInCredentials {
  email: string
  password: string
}

export interface SignInData {
  userId: string
  email: string
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn(
  credentials: SignInCredentials
): Promise<AuthResult<SignInData>> {
  try {
    const supabase = createBrowserClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.status?.toString(),
        },
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: {
          message: 'Invalid email or password',
        },
      }
    }

    return {
      success: true,
      data: {
        userId: data.user.id,
        email: data.user.email || credentials.email,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    }
  }
}

// =====================================================
// SIGN OUT
// =====================================================

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthResult> {
  try {
    const supabase = createBrowserClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
        },
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    }
  }
}

// =====================================================
// PASSWORD RESET
// =====================================================

/**
 * Send password reset email to user
 */
export async function sendPasswordResetEmail(email: string): Promise<AuthResult> {
  try {
    const supabase = createBrowserClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
        },
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    }
  }
}

/**
 * Update user password (requires valid session from password reset email)
 */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  try {
    const supabase = createBrowserClient()

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
        },
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    }
  }
}

// =====================================================
// SESSION MANAGEMENT
// =====================================================

/**
 * Get current user (client-side)
 */
export async function getCurrentUser() {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return null
  }

  return data.user
}

/**
 * Check if user is authenticated (client-side)
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return !!user
}

// =====================================================
// VALIDATION
// =====================================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 */
export interface PasswordValidation {
  isValid: boolean
  errors: string[]
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// =====================================================
// AUTH STATE CHANGES
// =====================================================

/**
 * Subscribe to auth state changes (client-side only)
 */
export function onAuthStateChange(
  callback: (event: string, session: any) => void
) {
  const supabase = createBrowserClient()
  const { data } = supabase.auth.onAuthStateChange(callback)
  return data.subscription
}
