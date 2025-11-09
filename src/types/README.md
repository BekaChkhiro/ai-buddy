# Types

This directory contains TypeScript type definitions and interfaces.

## Usage

Import types using the `@/types` alias:

```typescript
import type { User, Project, Task } from "@/types";
```

## Best Practices

- Use interfaces for objects that can be extended
- Use types for unions, intersections, and primitives
- Export all types as named exports
- Group related types in the same file
- Use descriptive names for types
- Add JSDoc comments for complex types
