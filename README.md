# Claude Project Manager

A modern, production-ready Next.js 14 application built with TypeScript, Tailwind CSS, and best practices for building AI-powered project management tools.

## Overview

This project serves as a comprehensive foundation for building project management applications with AI capabilities using Anthropic's Claude API. It features a carefully crafted architecture with strict TypeScript configuration, modern tooling, and a well-organized directory structure.

## Features

- **Next.js 14** with App Router for modern React development
- **TypeScript** with strict mode and comprehensive type checking
- **Tailwind CSS** with custom design system and dark mode support
- **ESLint & Prettier** for consistent code quality
- **Production-ready** configuration with security headers
- **Organized structure** for scalable application development

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.17 or later
- **npm** 9.x or later (or **yarn** / **pnpm**)
- **Git** for version control

### External Services

You'll need accounts and API keys for:

- **Supabase** - Database and authentication ([Sign up](https://supabase.com))
- **Anthropic** - Claude API access ([Sign up](https://console.anthropic.com))

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd claude-project-manager
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set up environment variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your actual values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Anthropic API
ANTHROPIC_API_KEY=your_anthropic_api_key

# Project Configuration
PROJECT_ROOT_PATH=/absolute/path/to/your/project
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
claude-project-manager/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── ui/                 # Reusable UI components
│   │   ├── layout/             # Layout components (header, footer, etc.)
│   │   └── forms/              # Form components
│   ├── lib/                    # Core library code
│   │   ├── api/                # API clients and integrations
│   │   ├── config/             # Configuration files
│   │   └── utils/              # Utility functions
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript type definitions
│   └── utils/                  # Helper functions
├── public/                     # Static assets
├── .env.local.example          # Environment variables template
├── .eslintrc.json              # ESLint configuration
├── .prettierrc                 # Prettier configuration
├── next.config.mjs             # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Project dependencies
```

### Directory Descriptions

- **`/app`** - Next.js 14 App Router pages and layouts
- **`/components`** - Reusable React components organized by type
- **`/lib`** - Core application logic, API clients, and configurations
- **`/hooks`** - Custom React hooks for shared logic
- **`/types`** - TypeScript type definitions and interfaces
- **`/utils`** - Standalone helper functions and utilities

## Development Commands

### Running the Application

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting without making changes
npm run format:check

# Type-check TypeScript
npm run type-check
```

### Maintenance

```bash
# Clean build artifacts and dependencies
npm run clean
```

## Technology Stack

### Core Framework

- **[Next.js 14](https://nextjs.org/)** - React framework with App Router
- **[React 18](https://react.dev/)** - UI library
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe JavaScript

### Styling

- **[Tailwind CSS 3.4](https://tailwindcss.com/)** - Utility-first CSS framework
- **PostCSS** - CSS transformations

### Code Quality

- **[ESLint 8](https://eslint.org/)** - JavaScript/TypeScript linting
- **[Prettier 3](https://prettier.io/)** - Code formatting
- **[prettier-plugin-tailwindcss](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)** - Tailwind class sorting

### Type Checking

- **TypeScript Strict Mode** - Enhanced type safety
- **@typescript-eslint** - TypeScript-specific linting rules

## Configuration Details

### TypeScript Configuration

The project uses strict TypeScript configuration with:

- Strict mode enabled for maximum type safety
- Unused variables and parameters detection
- Implicit return type checking
- Unchecked indexed access protection
- Comprehensive path aliases for clean imports

### Tailwind CSS

Custom Tailwind configuration includes:

- Design system with CSS custom properties
- Dark mode support (class-based)
- Custom animations (fade-in, slide-in, accordion)
- Responsive breakpoints
- Custom color palette with semantic naming

### Next.js Configuration

Production-ready Next.js setup with:

- React Strict Mode enabled
- SWC minification for faster builds
- Security headers (X-Frame-Options, CSP, etc.)
- Image optimization with modern formats (AVIF, WebP)
- Typed routes (experimental)

## Environment Variables

### Required Variables

| Variable                        | Description                   | Example                    |
| ------------------------------- | ----------------------------- | -------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL     | `https://xxx.supabase.co`  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key        | `eyJhbGc...`               |
| `ANTHROPIC_API_KEY`             | Anthropic Claude API key      | `sk-ant-...`               |
| `PROJECT_ROOT_PATH`             | Absolute path to project root | `/Users/name/projects/app` |

### Optional Variables

| Variable              | Description          | Default                 |
| --------------------- | -------------------- | ----------------------- |
| `NEXT_PUBLIC_APP_URL` | Application base URL | `http://localhost:3000` |
| `NODE_ENV`            | Node environment     | `development`           |
| `DEBUG`               | Enable debug logging | `false`                 |

## Best Practices

### Component Organization

- Keep components small and focused
- Use TypeScript interfaces for props
- Place shared components in `/components/ui`
- Create feature-specific components in relevant directories

### Import Aliases

Use the configured path aliases for clean imports:

```typescript
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api/client";
import type { User } from "@/types";
```

### Type Safety

- Always define types for component props
- Use strict TypeScript settings
- Avoid `any` types when possible
- Leverage type inference

### Code Style

- Run `npm run format` before committing
- Follow ESLint rules
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. Import project to [Vercel](https://vercel.com)
3. Configure environment variables
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- **Netlify**
- **AWS Amplify**
- **Google Cloud Run**
- **Docker** (see Next.js deployment docs)

## Troubleshooting

### Build Errors

If you encounter TypeScript errors:

```bash
# Check for type errors
npm run type-check

# Clean and reinstall
npm run clean
npm install
```

### Environment Variables Not Loading

- Ensure `.env.local` exists and is not gitignored
- Restart the development server after changes
- Verify variable names start with `NEXT_PUBLIC_` for client-side access

### Styling Issues

```bash
# Rebuild Tailwind classes
npm run dev
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run linting and formatting: `npm run lint:fix && npm run format`
4. Commit with descriptive messages
5. Create a pull request

## License

This project is licensed under the MIT License.

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Supabase Documentation](https://supabase.com/docs)

## Support

For issues and questions:

- Check the [documentation](docs/)
- Search existing issues
- Create a new issue with detailed information

---

**Built with Next.js 14, TypeScript, and Tailwind CSS**
