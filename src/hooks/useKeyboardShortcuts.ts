/**
 * useKeyboardShortcuts Hook
 * Global keyboard shortcuts for chat and navigation
 */

'use client'

import { useEffect } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  handler: (event: KeyboardEvent) => void
  description: string
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
}

export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrlKey === undefined || shortcut.ctrlKey === event.ctrlKey
        const shiftMatch = shortcut.shiftKey === undefined || shortcut.shiftKey === event.shiftKey
        const altMatch = shortcut.altKey === undefined || shortcut.altKey === event.altKey
        const metaMatch = shortcut.metaKey === undefined || shortcut.metaKey === event.metaKey
        const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase()

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          // Don't trigger if user is typing in an input/textarea
          const target = event.target as HTMLElement
          if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
          ) {
            // Allow only specific shortcuts in inputs
            if (!shortcut.ctrlKey && !shortcut.metaKey) {
              continue
            }
          }

          event.preventDefault()
          shortcut.handler(event)
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts, enabled])
}

// Common chat shortcuts
export const CHAT_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'n',
    ctrlKey: true,
    description: 'New conversation',
    handler: () => {},
  },
  {
    key: 'k',
    ctrlKey: true,
    description: 'Focus search',
    handler: () => {},
  },
  {
    key: '/',
    description: 'Focus message input',
    handler: () => {},
  },
  {
    key: 'Escape',
    description: 'Close dialogs / Clear input',
    handler: () => {},
  },
  {
    key: 's',
    ctrlKey: true,
    shiftKey: true,
    description: 'Toggle sidebar',
    handler: () => {},
  },
  {
    key: 'r',
    ctrlKey: true,
    description: 'Regenerate last message',
    handler: () => {},
  },
]
