# Supabase and shadcn/ui Setup Guide

This document provides a comprehensive guide for the Supabase and shadcn/ui integration in this Next.js project.

## Table of Contents

- [Overview](#overview)
- [Supabase Setup](#supabase-setup)
- [shadcn/ui Components](#shadcnui-components)
- [Dark Mode](#dark-mode)
- [File Structure](#file-structure)
- [Usage Examples](#usage-examples)
- [Next Steps](#next-steps)

---

## Overview

This project has been configured with:

- **Supabase**: Backend-as-a-Service for authentication, database, and storage
- **shadcn/ui**: High-quality, accessible UI components built with Radix UI and Tailwind CSS
- **next-themes**: Dark mode support with theme persistence
- **TypeScript**: Full type safety throughout the application

---

## Supabase Setup

### 1. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Update the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these values from your [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API

### 2. Supabase Client Files

Three client files have been created for different use cases:

#### Browser Client (`/src/lib/supabase/client.ts`)

Use in Client Components:

```typescript
import { createClient } from "@/lib/supabase/client";

export default function MyComponent() {
  const supabase = createClient();

  // Use supabase client here
}
```

#### Server Client (`/src/lib/supabase/server.ts`)

Use in Server Components, Route Handlers, and Server Actions:

```typescript
import { createClient } from "@/lib/supabase/server";

export async function MyServerComponent() {
  const supabase = await createClient();

  // Use supabase client here
}
```

#### Middleware Helper (`/src/lib/supabase/middleware.ts`)

Already integrated in `/middleware.ts` to handle session updates on every request.

### 3. Generate Database Types

To generate TypeScript types from your Supabase schema:

1. Install Supabase CLI globally:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_ID
   ```

3. Generate types:
   ```bash
   npm run types:supabase
   ```

This will update `/src/types/supabase.ts` with your database schema types.

### 4. Authentication Example

```typescript
// Client Component
"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const supabase = createClient();

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Error logging in:", error);
    }
  };

  return (
    // Your form JSX
  );
}
```

### 5. Protected Routes

To protect routes, you can enhance the middleware:

```typescript
// middleware.ts
import { type NextRequest, NextResponse } from "next/server";
import { updateSession, checkAuth } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Update session
  const response = await updateSession(request);

  // Protect specific routes
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    const { authenticated } = await checkAuth(request);

    if (!authenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return response;
}
```

---

## shadcn/ui Components

### Installed Components

The following components have been installed and are ready to use:

- **button**: Customizable button component
- **input**: Form input field
- **card**: Content container with header, content, and footer
- **dialog**: Modal dialog window
- **toast**: Notification system
- **dropdown-menu**: Dropdown menu with items
- **tabs**: Tabbed interface
- **badge**: Small status indicator
- **skeleton**: Loading placeholder
- **avatar**: User avatar with fallback
- **textarea**: Multi-line text input
- **scroll-area**: Custom scrollable area

### Component Usage

Import and use components from `@/components/ui`:

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Card</CardTitle>
      </CardHeader>
      <CardContent>
        <Input placeholder="Enter text..." />
        <Button>Submit</Button>
      </CardContent>
    </Card>
  );
}
```

### Adding More Components

To add additional shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

Browse available components at [ui.shadcn.com](https://ui.shadcn.com)

---

## Dark Mode

### Setup

Dark mode is configured with `next-themes` and integrated into the application.

### Theme Provider

Wrap your application with the ThemeProvider in your root layout:

```typescript
// src/app/layout.tsx
import { ThemeProvider } from "@/components/providers/theme-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Theme Toggle Component

Use the pre-built theme toggle component:

```typescript
import { ThemeToggle } from "@/components/theme-toggle";

export default function Header() {
  return (
    <header>
      <nav>
        {/* Your navigation */}
        <ThemeToggle />
      </nav>
    </header>
  );
}
```

### Using Theme in Components

```typescript
"use client";

import { useTheme } from "next-themes";

export default function MyComponent() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme("dark")}>Dark</button>
      <button onClick={() => setTheme("light")}>Light</button>
      <button onClick={() => setTheme("system")}>System</button>
    </div>
  );
}
```

---

## File Structure

```
/src
├── app/                    # Next.js App Router
│   └── globals.css        # Global styles with CSS variables
├── components/
│   ├── ui/                # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── providers/
│   │   └── theme-provider.tsx
│   └── theme-toggle.tsx   # Theme toggle component
├── lib/
│   ├── supabase/
│   │   ├── client.ts      # Browser Supabase client
│   │   ├── server.ts      # Server Supabase client
│   │   └── middleware.ts  # Middleware helpers
│   └── utils.ts           # Utility functions (cn helper)
├── hooks/
│   └── use-toast.ts       # Toast notification hook
└── types/
    └── supabase.ts        # Generated Supabase types

/middleware.ts             # Next.js middleware
/components.json           # shadcn/ui configuration
/tailwind.config.ts        # Tailwind configuration
```

---

## Custom Brand Colors

The following custom brand colors have been added to Tailwind:

```typescript
// Usage in components
<div className="bg-brand-500 text-white">
  Brand colored background
</div>

<div className="bg-success text-success-foreground">
  Success message
</div>

<div className="bg-warning text-warning-foreground">
  Warning message
</div>

<div className="bg-error text-error-foreground">
  Error message
</div>

<div className="bg-info text-info-foreground">
  Info message
</div>
```

Color palette:
- **brand**: 50-950 scale (blue theme)
- **success**: Green (#10b981)
- **warning**: Orange (#f59e0b)
- **error**: Red (#ef4444)
- **info**: Blue (#3b82f6)

---

## Usage Examples

### Complete Authentication Flow

```typescript
// src/app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      // Redirect to dashboard
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Server Component with Data Fetching

```typescript
// src/app/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Fetch data from your database
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects?.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle>{project.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{project.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## Next Steps

### 1. Set Up Your Supabase Database

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Create tables for your application
3. Set up Row Level Security (RLS) policies
4. Run `npm run types:supabase` to generate types

### 2. Configure Authentication

1. Enable authentication providers in Supabase Dashboard
2. Set up email templates
3. Configure redirect URLs
4. Implement sign-up, login, and logout flows

### 3. Add More Components

```bash
# Add form components
npx shadcn@latest add form select checkbox radio-group

# Add navigation
npx shadcn@latest add navigation-menu

# Add data display
npx shadcn@latest add table sheet
```

### 4. Implement Features

- Create authentication pages (login, register, forgot password)
- Build protected routes with the middleware
- Add user profile management
- Implement CRUD operations with Supabase
- Set up real-time subscriptions
- Add file upload with Supabase Storage

### 5. Customize Styling

- Update CSS variables in `src/app/globals.css`
- Modify brand colors in `tailwind.config.ts`
- Create custom component variants
- Add custom animations

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [next-themes Documentation](https://github.com/pacocoursey/next-themes)

---

## Troubleshooting

### Common Issues

**1. Supabase client errors**
- Ensure environment variables are set in `.env.local`
- Restart the development server after adding environment variables

**2. TypeScript errors with Supabase types**
- Run `npm run types:supabase` to regenerate types
- Make sure your Supabase project is linked

**3. Dark mode not working**
- Ensure ThemeProvider is in your root layout
- Add `suppressHydrationWarning` to the `<html>` tag

**4. Components not found**
- Run `npx shadcn@latest add [component-name]` to install missing components
- Check import paths match the components.json configuration

---

## Support

For issues or questions:
- Check the documentation links above
- Review the example code in this guide
- Consult the Supabase and shadcn/ui communities
