# Contributing to Claude Project Manager

Thank you for your interest in contributing to the Claude Project Manager! This document provides guidelines and instructions for contributing to this project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/claude-project-manager.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Install dependencies: `npm install`
5. Set up your environment variables (see `.env.local.example`)

## Development Workflow

### 1. Before You Start

- Check existing issues to avoid duplicate work
- Create an issue if one doesn't exist for your feature/bug
- Discuss major changes in an issue before starting work

### 2. While Developing

- Follow the existing code style and conventions
- Write meaningful commit messages
- Keep commits focused and atomic
- Test your changes thoroughly
- Update documentation as needed

### 3. Before Submitting

Run all quality checks:

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format

# Build
npm run build
```

All checks must pass before submitting a PR.

## Code Style

### TypeScript

- Use strict TypeScript - avoid `any` types
- Define interfaces for component props
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

Example:

```typescript
interface ButtonProps {
  variant?: "primary" | "secondary";
  onClick: () => void;
  children: React.ReactNode;
}

/**
 * A reusable button component
 * @param variant - The button style variant
 * @param onClick - Click handler function
 * @param children - Button content
 */
export function Button({ variant = "primary", onClick, children }: ButtonProps) {
  // Implementation
}
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper TypeScript types for props

### File Organization

- Place components in appropriate directories:
  - `/components/ui` - Reusable UI components
  - `/components/layout` - Layout components
  - `/components/forms` - Form components
- Use index files for clean imports when appropriate
- Keep related files close together

### Import Order

1. External packages (React, Next.js, etc.)
2. Internal absolute imports (`@/components`, `@/lib`, etc.)
3. Relative imports
4. Type imports (at the end)

Example:

```typescript
import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

import { formatDate } from "./utils";

import type { User } from "@/types";
```

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:

```
feat(auth): add social login support

fix(ui): resolve button alignment issue on mobile

docs(readme): update installation instructions
```

## Pull Request Process

1. **Update your branch** with the latest main:

   ```bash
   git checkout main
   git pull upstream main
   git checkout your-branch
   git rebase main
   ```

2. **Run all checks** to ensure quality:

   ```bash
   npm run type-check
   npm run lint
   npm run format
   npm run build
   ```

3. **Create a Pull Request** with:

   - Clear title following commit message conventions
   - Description of changes and motivation
   - Link to related issue(s)
   - Screenshots for UI changes
   - List of breaking changes (if any)

4. **Respond to feedback**:
   - Address review comments promptly
   - Push updates to the same branch
   - Request re-review when ready

## Testing Guidelines

- Write tests for new features
- Update tests when modifying existing features
- Ensure all tests pass before submitting PR
- Aim for meaningful test coverage, not just high numbers

## Documentation

Update documentation when:

- Adding new features
- Changing existing behavior
- Updating configuration
- Adding new dependencies

Documentation locations:

- `README.md` - Project overview and setup
- `CONTRIBUTING.md` - This file
- Component JSDoc - Inline documentation
- `/docs` - Detailed guides (if applicable)

## Questions?

- Check existing documentation
- Search closed issues
- Open a new issue with the "question" label
- Join our community discussions

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

Thank you for contributing!
