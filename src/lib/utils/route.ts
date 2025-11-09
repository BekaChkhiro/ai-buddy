/**
 * Route utilities
 * Helpers for type-safe routing
 */

/**
 * Type assertion helper for Next.js routes
 * Helps TypeScript understand that a string is a valid route
 */
export function route<T extends string>(path: T): T {
  return path
}
