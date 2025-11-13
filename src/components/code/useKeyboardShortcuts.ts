/**
 * useKeyboardShortcuts Hook
 * Handle keyboard shortcuts for quick code review
 */

import { useEffect, useCallback } from "react";
import type { KeyboardShortcuts } from "./types";
import { defaultKeyboardShortcuts } from "./types";

interface KeyboardShortcutHandlers {
  onApproveFile?: () => void;
  onRejectFile?: () => void;
  onNextFile?: () => void;
  onPrevFile?: () => void;
  onToggleDiffView?: () => void;
  onSearch?: () => void;
  onComment?: () => void;
  onSaveEdit?: () => void;
}

/**
 * Custom hook for handling keyboard shortcuts in code review
 * @param handlers - Object containing callback functions for each shortcut
 * @param shortcuts - Optional custom keyboard shortcuts configuration
 * @param enabled - Whether keyboard shortcuts are enabled (default: true)
 */
export function useKeyboardShortcuts(
  handlers: KeyboardShortcutHandlers,
  shortcuts: KeyboardShortcuts = defaultKeyboardShortcuts,
  enabled: boolean = true
) {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      const target = event.target as HTMLElement;
      const isInputElement =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Allow some shortcuts even in input elements
      const allowInInput = ["cmd+s", "ctrl+s"];
      const keyCombo = getKeyCombo(event);

      if (isInputElement && !allowInInput.includes(keyCombo)) {
        return;
      }

      // Check for modifier keys
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdKey = isMac ? event.metaKey : event.ctrlKey;

      // Handle shortcuts
      switch (event.key.toLowerCase()) {
        case "a":
          if (!event.metaKey && !event.ctrlKey && handlers.onApproveFile) {
            event.preventDefault();
            handlers.onApproveFile();
          }
          break;

        case "r":
          if (!event.metaKey && !event.ctrlKey && handlers.onRejectFile) {
            event.preventDefault();
            handlers.onRejectFile();
          }
          break;

        case "j":
          if (!event.metaKey && !event.ctrlKey && handlers.onNextFile) {
            event.preventDefault();
            handlers.onNextFile();
          }
          break;

        case "k":
          if (!event.metaKey && !event.ctrlKey && handlers.onPrevFile) {
            event.preventDefault();
            handlers.onPrevFile();
          }
          break;

        case "v":
          if (!event.metaKey && !event.ctrlKey && handlers.onToggleDiffView) {
            event.preventDefault();
            handlers.onToggleDiffView();
          }
          break;

        case "/":
          if (!event.metaKey && !event.ctrlKey && handlers.onSearch) {
            event.preventDefault();
            handlers.onSearch();
          }
          break;

        case "c":
          if (!event.metaKey && !event.ctrlKey && handlers.onComment) {
            event.preventDefault();
            handlers.onComment();
          }
          break;

        case "s":
          if (cmdKey && handlers.onSaveEdit) {
            event.preventDefault();
            handlers.onSaveEdit();
          }
          break;

        default:
          break;
      }
    },
    [handlers]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [enabled, handleKeyPress]);

  return {
    shortcuts,
    enabled,
  };
}

/**
 * Get a string representation of the key combination
 */
function getKeyCombo(event: KeyboardEvent): string {
  const parts: string[] = [];

  if (event.ctrlKey) parts.push("ctrl");
  if (event.metaKey) parts.push("cmd");
  if (event.altKey) parts.push("alt");
  if (event.shiftKey) parts.push("shift");

  parts.push(event.key.toLowerCase());

  return parts.join("+");
}

/**
 * Hook for displaying keyboard shortcuts help
 */
export function useKeyboardShortcutsHelp(
  shortcuts: KeyboardShortcuts = defaultKeyboardShortcuts
) {
  const shortcutsList = [
    {
      key: shortcuts.approveFile,
      description: "Approve current file",
      category: "Review",
    },
    {
      key: shortcuts.rejectFile,
      description: "Reject current file",
      category: "Review",
    },
    {
      key: shortcuts.nextFile,
      description: "Go to next file",
      category: "Navigation",
    },
    {
      key: shortcuts.prevFile,
      description: "Go to previous file",
      category: "Navigation",
    },
    {
      key: shortcuts.toggleDiffView,
      description: "Toggle diff view mode",
      category: "View",
    },
    {
      key: shortcuts.search,
      description: "Search in diff",
      category: "View",
    },
    {
      key: shortcuts.comment,
      description: "Add comment",
      category: "Review",
    },
    {
      key: shortcuts.saveEdit,
      description: "Save edited file",
      category: "Edit",
    },
  ];

  return {
    shortcuts: shortcutsList,
    groupedShortcuts: groupShortcutsByCategory(shortcutsList),
  };
}

/**
 * Group shortcuts by category
 */
function groupShortcutsByCategory(
  shortcuts: Array<{ key: string; description: string; category: string }>
): Record<string, Array<{ key: string; description: string }>> {
  return shortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category]!.push(shortcut);
      return acc;
    },
    {} as Record<string, Array<{ key: string; description: string }>>
  );
}

/**
 * Format keyboard shortcut for display
 */
export function formatShortcut(shortcut: string): string {
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  return shortcut
    .replace("cmd", isMac ? "⌘" : "Ctrl")
    .replace("ctrl", isMac ? "⌃" : "Ctrl")
    .replace("alt", isMac ? "⌥" : "Alt")
    .replace("shift", isMac ? "⇧" : "Shift")
    .replace("+", " + ")
    .toUpperCase();
}
