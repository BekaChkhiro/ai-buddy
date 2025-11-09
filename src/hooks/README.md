# Custom Hooks

This directory contains custom React hooks for shared logic.

## Usage

Import hooks using the `@/hooks` alias:

```typescript
import { useAuth } from "@/hooks/useAuth";
```

## Best Practices

- Prefix all custom hooks with "use"
- Keep hooks focused on a single concern
- Include TypeScript types for parameters and return values
- Document hook parameters and return values
- Handle cleanup in useEffect when necessary
