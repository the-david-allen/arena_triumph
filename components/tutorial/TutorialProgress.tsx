"use client";

import { useTutorial } from "@/lib/tutorial/use-tutorial";
import { cn } from "@/lib/cn";

export interface TutorialProgressProps {
  className?: string;
}

export function TutorialProgress({ className }: TutorialProgressProps) {
  const { isActive, currentStepIndex, totalSteps } = useTutorial();

  if (!isActive || totalSteps <= 1) return null;

  return (
    <div
      className={cn(
        "text-xs text-muted-foreground",
        className
      )}
      aria-live="polite"
    >
      {currentStepIndex + 1} / {totalSteps}
    </div>
  );
}
