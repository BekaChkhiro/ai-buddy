/**
 * Git Integration Library
 *
 * Comprehensive Git integration for AI Buddy with support for:
 * - Basic Git operations (commit, push, pull, etc.)
 * - Branch management
 * - Diff parsing and formatting
 * - Commit history
 * - Git LFS support
 * - Auto-commit features
 * - Smart commit message generation
 * - Task-based Git workflows
 */

// Client and initialization
export * from './client';
export { default as clientUtils } from './client';

// Types
export * from './types';

// Operations
export * from './operations';
export { default as operations } from './operations';

// Branch management
export * from './branch';
export { default as branch } from './branch';

// Diff utilities
export * from './diff';
export { default as diff } from './diff';

// History
export * from './history';
export { default as history } from './history';

// Configuration
export * from './config';
export { default as config } from './config';

// LFS support
export * from './lfs';
export { default as lfs } from './lfs';

// Integration
export * from './integration';
export { default as integration } from './integration';
