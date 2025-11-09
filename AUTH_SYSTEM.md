# Authentication System Documentation

This document describes the complete authentication system implementation for the Claude Project Manager application.

## Overview

The authentication system uses Supabase Auth with email/password authentication, including email verification, password reset, and session management.

## File Structure

```
src/
├── app/
│   ├── (auth)/                         # Auth pages group
│   │   ├── layout.tsx                  # Centered card layout for auth pages
│   │   ├── login/
│   │   │   └── page.tsx                # Login page
│   │   ├── register/
│   │   │   └── page.tsx                # Registration page
│   │   ├── forgot-password/
│   │   │   └── page.tsx                # Password reset request page
│   │   └── auth/
│   │       ├── callback/
│   │       │   └── page.tsx            # OAuth and email verification callback
│   │       └── reset-password/
│   │           └── page.tsx            # Password reset form
│   ├── (dashboard)/                    # Dashboard pages group
│   │   ├── layout.tsx                  # Dashboard layout with sidebar
│   │   └── projects/
│   │       └── page.tsx                # Projects list page
│   └── page.tsx                        # Root page (redirects based on auth)
│
├── components/
│   ├── auth/
│   │   ├── AuthForm.tsx                # Reusable login/register form
│   │   ├── AuthGuard.tsx               # Client-side route protection
│   │   ├── UserMenu.tsx                # User dropdown menu
│   │   └── index.ts                    # Barrel export
│   └── dashboard/
│       ├── Sidebar.tsx                 # Navigation sidebar
│       ├── ProjectSwitcher.tsx         # Project dropdown
│       └── ...
│
├── lib/
│   ├── auth/
│   │   ├── auth.ts                     # Auth operations (login, signup, etc.)
│   │   ├── session.ts                  # Session management
│   │   └── index.ts                    # Barrel export
│   └── supabase/
│       ├── client.ts                   # Browser Supabase client
│       ├── server.ts                   # Server Supabase client
│       └── middleware.ts               # Middleware helpers
│
└── middleware.ts                        # Root middleware (route protection)
```

## Features

### 1. User Registration
- Email and password signup
- Full name capture
- Password strength validation (8+ chars, uppercase, lowercase, numbers)
- Email verification support
- Automatic profile creation via database trigger

### 2. User Login
- Email and password authentication
- Remember me (handled by Supabase)
- Error handling for invalid credentials
- Redirect to intended page after login

### 3. Password Reset
- Request reset email
- Secure reset link with token
- Password strength validation
- Confirmation field

### 4. Session Management
- Automatic session refresh
- Session validation
- Secure cookie storage
- Server and client-side session access

### 5. Route Protection
- Middleware-based protection for dashboard routes
- Client-side AuthGuard component
- Automatic redirect to login for unauthenticated users
- Redirect authenticated users away from auth pages

### 6. User Menu
- Profile avatar display
- User name and email
- Links to profile and settings
- Logout functionality

## Authentication Flow

### Registration Flow

```
1. User fills out registration form
2. Frontend validates input (email format, password strength, matching passwords)
3. Call signUp() function
4. Supabase creates user account
5. Database trigger creates profile record
6. Email verification sent (if enabled)
7. User redirected to login or dashboard
```

### Login Flow

```
1. User enters credentials
2. Call signIn() function
3. Supabase validates credentials
4. Session created and stored in cookies
5. User redirected to dashboard
```

### Password Reset Flow

```
1. User requests password reset
2. Call sendPasswordResetEmail()
3. Supabase sends reset email with token
4. User clicks link in email
5. Redirected to reset-password page
6. User enters new password
7. Call updatePassword()
8. Session created, user logged in
```

### Route Protection Flow

```
1. User navigates to protected route
2. Middleware checks authentication
3. If not authenticated → redirect to /login?redirect=/intended-page
4. If authenticated → allow access
5. Session updated on each request
```

## API Reference

### Auth Functions (`lib/auth/auth.ts`)

#### `signUp(credentials)`
Create a new user account.

```typescript
const result = await signUp({
  email: 'user@example.com',
  password: 'SecurePass123',
  fullName: 'John Doe'
})

if (result.success) {
  console.log('User created:', result.data)
} else {
  console.error('Error:', result.error?.message)
}
```

#### `signIn(credentials)`
Sign in an existing user.

```typescript
const result = await signIn({
  email: 'user@example.com',
  password: 'SecurePass123'
})

if (result.success) {
  console.log('Logged in:', result.data)
}
```

#### `signOut()`
Sign out the current user.

```typescript
const result = await signOut()
if (result.success) {
  // Redirect to login
}
```

#### `sendPasswordResetEmail(email)`
Send password reset email.

```typescript
const result = await sendPasswordResetEmail('user@example.com')
```

#### `updatePassword(newPassword)`
Update user password (requires valid reset token).

```typescript
const result = await updatePassword('NewSecurePass123')
```

#### `getCurrentUser()`
Get the currently authenticated user (client-side).

```typescript
const user = await getCurrentUser()
if (user) {
  console.log('User ID:', user.id)
}
```

#### `isAuthenticated()`
Check if user is authenticated (client-side).

```typescript
const authenticated = await isAuthenticated()
if (authenticated) {
  // User is logged in
}
```

#### Validation Functions

```typescript
// Validate email format
const isValid = isValidEmail('user@example.com') // true

// Validate password strength
const validation = validatePassword('weak')
if (!validation.isValid) {
  console.log('Errors:', validation.errors)
  // ['Password must be at least 8 characters long', ...]
}
```

### Session Functions (`lib/auth/session.ts`)

#### `getSession()`
Get current session (client-side).

```typescript
const session = await getSession()
if (session) {
  console.log('Expires at:', session.expires_at)
}
```

#### `isSessionValid(session)`
Check if session is valid and not expired.

```typescript
const valid = isSessionValid(session) // true/false
```

#### `refreshSession()`
Manually refresh the session.

```typescript
const newSession = await refreshSession()
```

#### Auto-Refresh

```typescript
// Start auto-refresh (checks every minute)
startAutoRefresh()

// Stop auto-refresh
stopAutoRefresh()
```

## Components

### AuthForm

Reusable form for both login and registration.

```tsx
import { AuthForm } from '@/components/auth'

// Login mode
<AuthForm mode="login" redirectTo="/projects" />

// Register mode
<AuthForm mode="register" redirectTo="/projects" />
```

### AuthGuard

Client-side route protection component.

```tsx
import { AuthGuard } from '@/components/auth'

export default function ProtectedPage() {
  return (
    <AuthGuard redirectTo="/login">
      <YourProtectedContent />
    </AuthGuard>
  )
}
```

### UserMenu

User dropdown menu component.

```tsx
import { UserMenu } from '@/components/auth'

<UserMenu />
```

## Middleware Configuration

The root `middleware.ts` file protects routes automatically:

```typescript
// Protected routes (require authentication)
const protectedRoutes = ["/projects", "/profile", "/settings", "/dashboard"]

// Auth routes (redirect to dashboard if authenticated)
const authRoutes = ["/login", "/register", "/forgot-password"]
```

### Adding Protected Routes

Edit `middleware.ts` and add routes to the `protectedRoutes` array:

```typescript
const protectedRoutes = [
  "/projects",
  "/profile",
  "/settings",
  "/dashboard",
  "/your-new-route"  // Add your route here
]
```

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Usage Examples

### Protecting a Page (Server Component)

```tsx
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export default async function ProtectedPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <div>Protected content for {user.email}</div>
}
```

### Protecting a Page (Client Component)

```tsx
'use client'

import { AuthGuard } from '@/components/auth'

export default function ProtectedPage() {
  return (
    <AuthGuard>
      <div>Protected content</div>
    </AuthGuard>
  )
}
```

### Custom Login Form

```tsx
'use client'

import { useState } from 'react'
import { signIn } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function CustomLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const result = await signIn({ email, password })

    if (result.success) {
      router.push('/dashboard')
    } else {
      alert(result.error?.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">Sign In</button>
    </form>
  )
}
```

### Logout Button

```tsx
'use client'

import { signOut } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const result = await signOut()
    if (result.success) {
      router.push('/login')
    }
  }

  return <button onClick={handleLogout}>Logout</button>
}
```

## Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Session Security
- HTTPOnly cookies
- Secure cookies (HTTPS only in production)
- SameSite: Lax
- Automatic expiration
- Server-side validation

### Route Protection
- Middleware-level protection (runs before page loads)
- Client-side guards (additional protection)
- Automatic redirect for unauthorized access
- Protected API routes via middleware

### Email Enumeration Protection
- Password reset always shows success (even if email doesn't exist)
- Prevents attackers from discovering valid emails

## Error Handling

All auth functions return a consistent result object:

```typescript
interface AuthResult<T = void> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    field?: string
  }
}
```

Example error handling:

```typescript
const result = await signIn(credentials)

if (!result.success) {
  if (result.error?.code === '401') {
    console.log('Invalid credentials')
  } else {
    console.log('Error:', result.error?.message)
  }
}
```

## Troubleshooting

### Issue: "Missing Supabase environment variables"
**Solution**: Create `.env.local` file with Supabase URL and anon key.

### Issue: User can't log in after registration
**Solution**: Check if email verification is enabled in Supabase. If yes, user must verify email first.

### Issue: Session expires too quickly
**Solution**: Adjust session timeout in Supabase dashboard → Authentication → Settings.

### Issue: Infinite redirect loop
**Solution**: Check middleware configuration. Ensure auth routes and protected routes don't overlap.

### Issue: TypeScript errors with router.push()
**Solution**: These are type-checking warnings from Next.js experimental typedRoutes. They don't affect functionality.

## Testing the Authentication Flow

### 1. Test Registration
```bash
1. Navigate to /register
2. Fill out form with valid data
3. Submit form
4. Check for success message
5. Check email for verification (if enabled)
6. Verify user created in Supabase dashboard
```

### 2. Test Login
```bash
1. Navigate to /login
2. Enter credentials
3. Submit form
4. Verify redirect to /projects
5. Check user menu shows correct name
```

### 3. Test Route Protection
```bash
1. Log out
2. Try to access /projects
3. Verify redirect to /login
4. Log in
5. Try to access /login
6. Verify redirect to /projects
```

### 4. Test Password Reset
```bash
1. Navigate to /forgot-password
2. Enter email
3. Check email for reset link
4. Click link
5. Enter new password
6. Verify redirect and auto-login
```

## Next Steps

1. **Enable Email Verification** - Configure in Supabase dashboard
2. **Add OAuth Providers** - Google, GitHub, etc.
3. **Implement 2FA** - Two-factor authentication
4. **Add Rate Limiting** - Prevent brute force attacks
5. **Session Timeout Warnings** - Notify users before session expires
6. **Activity Logging** - Track login attempts and changes

## Related Documentation

- [Database Schema](./DATABASE_SCHEMA.md) - User profiles and database structure
- [Supabase Setup](./SUPABASE_SHADCN_SETUP.md) - Initial Supabase configuration
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth) - Official Supabase documentation

---

**Status**: ✅ Authentication system fully implemented and ready for use
