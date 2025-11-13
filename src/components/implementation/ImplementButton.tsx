"use client";

/**
 * ImplementButton Component
 * Button to trigger task implementation
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";
import { ImplementationModal } from "./ImplementationModal";

interface ImplementButtonProps {
  taskId: string;
  taskTitle: string;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

export function ImplementButton({
  taskId,
  taskTitle,
  disabled = false,
  variant = "default",
  size = "default",
  showLabel = true,
}: ImplementButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const handleClick = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={disabled || isStarting}
        variant={variant}
        size={size}
      >
        {isStarting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {showLabel && <span className="ml-2">Implement</span>}
      </Button>

      <ImplementationModal
        taskId={taskId}
        taskTitle={taskTitle}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStarting={setIsStarting}
      />
    </>
  );
}
