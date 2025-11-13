"use client";

/**
 * ChangeRequest Component
 * UI for requesting modifications to code changes
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageSquare, Send, X } from "lucide-react";
import type { ChangeRequestProps } from "./types";

export function ChangeRequest({
  filePath,
  currentContent,
  onSubmit,
  onCancel,
}: ChangeRequestProps) {
  const [comment, setComment] = useState("");
  const [isOpen, setIsOpen] = useState(true);

  const handleSubmit = () => {
    if (comment.trim()) {
      onSubmit(comment);
      setComment("");
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setComment("");
    setIsOpen(false);
    onCancel();
  };

  // Suggested templates for common feedback
  const templates = [
    "Please add error handling for edge cases",
    "Consider adding unit tests for this functionality",
    "Add JSDoc comments to explain the logic",
    "Simplify this implementation",
    "Follow the project's code style guidelines",
    "Add validation for input parameters",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Request Changes
          </DialogTitle>
          <DialogDescription>
            Provide feedback for improvements to{" "}
            <code className="text-sm font-mono bg-muted px-1 py-0.5 rounded">
              {filePath}
            </code>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Comment Input */}
          <div className="space-y-2">
            <Label htmlFor="comment">Your Feedback</Label>
            <Textarea
              id="comment"
              placeholder="Describe what changes you'd like to see..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Be specific about what needs to be changed and why
            </p>
          </div>

          {/* Quick Templates */}
          <div className="space-y-2">
            <Label className="text-xs">Quick Templates</Label>
            <div className="flex flex-wrap gap-2">
              {templates.map((template, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => setComment(template)}
                >
                  {template}
                </Badge>
              ))}
            </div>
          </div>

          {/* Current Content Preview */}
          <Card className="p-3">
            <div className="text-xs font-medium mb-2 text-muted-foreground">
              Current Content Preview
            </div>
            <pre className="text-xs font-mono max-h-48 overflow-y-auto bg-muted/50 p-2 rounded">
              {currentContent.slice(0, 500)}
              {currentContent.length > 500 && "..."}
            </pre>
          </Card>

          {/* Tips */}
          <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="text-sm space-y-1">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                💡 Tips for effective feedback:
              </p>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-disc">
                <li>Be specific about what needs to change</li>
                <li>Explain why the change is needed</li>
                <li>Suggest alternatives or improvements</li>
                <li>Reference specific lines if applicable</li>
              </ul>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!comment.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            Submit Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Inline Change Request Component
 * Compact version for inline use
 */
export function InlineChangeRequest({
  filePath,
  onSubmit,
  onCancel,
}: ChangeRequestProps) {
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (comment.trim()) {
      onSubmit(comment);
      setComment("");
    }
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span className="text-sm font-medium">Request Changes</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {filePath}
        </Badge>
      </div>

      <Textarea
        placeholder="Describe what changes you'd like to see..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        className="resize-none"
      />

      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!comment.trim()}>
          <Send className="h-3 w-3 mr-2" />
          Submit
        </Button>
      </div>
    </div>
  );
}
