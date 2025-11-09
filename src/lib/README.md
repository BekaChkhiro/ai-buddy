# Library

This directory contains utility functions, configurations, and API clients.

## Structure

- `/api` - API client functions and integrations
- `/config` - Configuration files and constants
- `/utils` - Utility and helper functions

## Usage

Import from the `@/lib` alias:

```typescript
import { apiClient } from "@/lib/api/client";
import { siteConfig } from "@/lib/config/site";
import { formatDate } from "@/lib/utils/date";
```

## Best Practices

- Keep functions pure when possible
- Add comprehensive JSDoc comments
- Include unit tests for complex logic
- Use TypeScript for type safety
