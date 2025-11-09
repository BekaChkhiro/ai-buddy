# Components

This directory contains all React components organized by type:

## Structure

- `/ui` - Reusable UI components (buttons, inputs, cards, etc.)
- `/layout` - Layout components (header, footer, sidebar, etc.)
- `/forms` - Form-related components and form fields

## Usage

Import components using the `@/components` alias:

```typescript
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/layout/Header";
```

## Best Practices

- Keep components small and focused on a single responsibility
- Use TypeScript for proper type checking
- Export components as named exports
- Include prop types for all components
- Add JSDoc comments for complex components
