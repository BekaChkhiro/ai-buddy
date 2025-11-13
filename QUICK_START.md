# Quick Start Guide

Get up and running with Claude Project Manager in 5 minutes.

## Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm
- Text editor (VS Code recommended)

## 1. Navigate to Project

```bash
cd /Users/bekachkhirodze/Desktop/claude-project-manager
```

## 2. Set Up Environment Variables

```bash
# Copy the example file
cp .env.local.example .env.local

# Open and edit with your values
# You can use nano, vim, or any text editor
nano .env.local
```

**Minimum required values:**

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
PROJECT_ROOT_PATH=/Users/bekachkhirodze/Desktop/claude-project-manager
```

## 3. Start Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

## 4. Verify Setup

Open another terminal and run:

```bash
# Check TypeScript
npm run type-check

# Check linting
npm run lint

# Format code
npm run format
```

All checks should pass with no errors.

## 5. Start Building

### Create Your First Component

```bash
# Create a new button component
touch src/components/ui/Button.tsx
```

```tsx
// src/components/ui/Button.tsx
import { cn } from "@/lib/utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}

export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-lg font-medium transition-colors",
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/90",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

### Use the Component

```tsx
// src/app/page.tsx
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Claude Project Manager</h1>
      <div className="flex gap-4">
        <Button variant="primary">Get Started</Button>
        <Button variant="secondary">Learn More</Button>
      </div>
    </main>
  );
}
```

## 6. Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Check for linting errors
npm run lint:fix        # Auto-fix linting errors
npm run format          # Format all files
npm run type-check      # Check TypeScript types

# Maintenance
npm run clean           # Clean build artifacts
```

## 7. Project Structure Quick Reference

```
src/
├── app/              # Pages (add new pages here)
├── components/       # React components
│   ├── ui/          # Reusable UI components
│   ├── layout/      # Layout components
│   └── forms/       # Form components
├── lib/             # Core logic
│   ├── api/         # API integrations
│   ├── config/      # Configuration
│   └── utils/       # Utilities
├── hooks/           # Custom React hooks
├── types/           # TypeScript types
└── utils/           # Helper functions
```

## 8. Import Paths

Use these aliases for clean imports:

```typescript
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils/cn";
import type { User } from "@/types";
```

## 9. VS Code Setup (Optional)

If using VS Code, install recommended extensions:

1. Open command palette (Cmd/Ctrl + Shift + P)
2. Type: "Extensions: Show Recommended Extensions"
3. Install all recommended extensions

## 10. Need Help?

- 📖 Full documentation: [README.md](./README.md)
- 🤝 Contributing guide: [CONTRIBUTING.md](./CONTRIBUTING.md)
- 📋 Setup details: [PROJECT_SETUP_SUMMARY.md](./PROJECT_SETUP_SUMMARY.md)

## Troubleshooting

### Port 3000 already in use?

```bash
# Use a different port
npm run dev -- -p 3001
```

### Module not found errors?

```bash
# Reinstall dependencies
npm run clean
npm install
```

### TypeScript errors?

```bash
# Check your tsconfig.json and run
npm run type-check
```

---

**You're ready to build! Happy coding! 🚀**
