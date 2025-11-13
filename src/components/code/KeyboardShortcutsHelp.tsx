"use client";

/**
 * KeyboardShortcutsHelp Component
 * Display keyboard shortcuts help panel
 */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";
import { useKeyboardShortcutsHelp, formatShortcut } from "./useKeyboardShortcuts";
import type { KeyboardShortcuts } from "./types";

interface KeyboardShortcutsHelpProps {
  shortcuts?: KeyboardShortcuts;
}

export function KeyboardShortcutsHelp({
  shortcuts,
}: KeyboardShortcutsHelpProps) {
  const { groupedShortcuts } = useKeyboardShortcutsHelp(shortcuts);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Keyboard className="h-4 w-4 mr-2" />
          Keyboard Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to quickly review and approve code changes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <Badge variant="outline" className="font-mono">
                      {formatShortcut(shortcut.key)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded bg-muted/30 text-xs text-muted-foreground">
          <p>
            💡 Tip: Keyboard shortcuts work when you're focused on the review
            panel. They won't interfere when typing in text fields.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Inline Keyboard Shortcuts Help
 * Compact version for inline display
 */
export function InlineKeyboardShortcutsHelp({
  shortcuts,
}: KeyboardShortcutsHelpProps) {
  const { groupedShortcuts } = useKeyboardShortcutsHelp(shortcuts);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Keyboard className="h-4 w-4" />
        <h4 className="font-semibold text-sm">Quick Actions</h4>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {Object.entries(groupedShortcuts).map(([category, shortcuts]) =>
          shortcuts.slice(0, 4).map((shortcut, index) => (
            <div
              key={`${category}-${index}`}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-muted-foreground">
                {shortcut.description}
              </span>
              <Badge variant="secondary" className="text-xs font-mono">
                {formatShortcut(shortcut.key)}
              </Badge>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
