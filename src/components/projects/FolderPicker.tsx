/**
 * FolderPicker Component
 * Local folder selection with validation
 */

"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, Check, AlertCircle } from "lucide-react";

interface FolderPickerProps {
  value: string;
  onChange: (path: string) => void;
  disabled?: boolean;
}

export function FolderPicker({ value, onChange, disabled }: FolderPickerProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<"valid" | "invalid" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validatePath = async (path: string) => {
    if (!path.trim()) {
      setValidationStatus(null);
      return;
    }

    setIsValidating(true);
    try {
      // In a real implementation, you would validate the path
      // For now, we'll just do basic validation
      const isValid =
        path.length > 0 &&
        (path.startsWith("/") || // Unix path
          /^[a-zA-Z]:\\/.test(path)); // Windows path

      setValidationStatus(isValid ? "valid" : "invalid");
    } catch (error) {
      setValidationStatus("invalid");
    } finally {
      setIsValidating(false);
    }
  };

  const handlePathChange = (newPath: string) => {
    onChange(newPath);
    validatePath(newPath);
  };

  const handleBrowse = () => {
    // In a real implementation with Electron or Tauri,
    // you would open a native folder picker dialog
    // For web, we'll just focus the input
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => handlePathChange(e.target.value)}
            placeholder="/path/to/project or C:\path\to\project"
            disabled={disabled || isValidating}
            className={
              validationStatus === "valid"
                ? "pr-8 border-green-500"
                : validationStatus === "invalid"
                  ? "pr-8 border-destructive"
                  : ""
            }
          />
          {validationStatus && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {validationStatus === "valid" ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleBrowse}
          disabled={disabled || isValidating}
        >
          <Folder className="h-4 w-4 mr-2" />
          Browse
        </Button>
      </div>
      {validationStatus === "invalid" && (
        <p className="text-xs text-destructive">Please enter a valid folder path</p>
      )}
    </div>
  );
}
