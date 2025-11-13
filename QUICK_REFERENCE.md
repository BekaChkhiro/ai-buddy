# Quick Reference Guide - Supabase & shadcn/ui

## Environment Setup

```bash
# 1. Copy environment file
cp .env.local.example .env.local

# 2. Add your Supabase credentials to .env.local
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here

# 3. Start development server
npm run dev
```

---

## Supabase Usage

### Client Component

```typescript
"use client";
import { createClient } from "@/lib/supabase/client";

export default function MyComponent() {
  const supabase = createClient();
  // Use supabase here
}
```

### Server Component

```typescript
import { createClient } from "@/lib/supabase/server";

export default async function MyServerComponent() {
  const supabase = await createClient();
  // Use supabase here
}
```

### Generate Types

```bash
# After creating database schema
npm run types:supabase
```

---

## shadcn/ui Components

### Import Pattern

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
```

### Available Components

- button, input, textarea
- card, dialog, sheet
- toast, dropdown-menu
- tabs, badge, skeleton
- avatar, scroll-area

### Add More Components

```bash
npx shadcn@latest add [component-name]
```

---

## Dark Mode

### Add to Layout

```typescript
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Theme Toggle

```typescript
import { ThemeToggle } from "@/components/theme-toggle";

<ThemeToggle />
```

---

## Custom Colors

```typescript
// Brand colors (50-950 scale)
<div className="bg-brand-500 text-white">Brand</div>

// Semantic colors
<div className="bg-success text-success-foreground">Success</div>
<div className="bg-warning text-warning-foreground">Warning</div>
<div className="bg-error text-error-foreground">Error</div>
<div className="bg-info text-info-foreground">Info</div>
```

---

## Authentication Example

```typescript
"use client";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const supabase = createClient();

  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
  };

  const handleSignUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };
}
```

---

## Protected Routes (Middleware)

```typescript
// middleware.ts
import { updateSession, checkAuth } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

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

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format with Prettier
npm run type-check       # TypeScript check

# Supabase
npm run types:supabase   # Generate database types

# Add Components
npx shadcn@latest add [component-name]
```

---

## File Locations

```
/src
├── lib/supabase/
│   ├── client.ts        # Browser client
│   ├── server.ts        # Server client
│   └── middleware.ts    # Auth helpers
├── components/
│   ├── ui/              # shadcn components
│   ├── providers/       # Theme provider
│   └── theme-toggle.tsx # Dark mode toggle
├── types/
│   └── supabase.ts      # Database types
└── app/
    └── globals.css      # Theme CSS variables

/middleware.ts           # Route protection
/components.json         # shadcn config
/tailwind.config.ts      # Tailwind config
```

---

## Helpful Links

- [Full Setup Guide](./SUPABASE_SHADCN_SETUP.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Next.js Docs](https://nextjs.org/docs)
