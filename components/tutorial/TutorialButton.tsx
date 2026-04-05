"use client";

import { Button } from "@/components/ui/button";
import { useTutorial } from "@/lib/tutorial/use-tutorial";

export interface TutorialButtonProps {
  tutorialId: string;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
}

export function TutorialButton({
  tutorialId,
  variant = "outline",
  size = "default",
  className,
  children = "Tutorial",
}: TutorialButtonProps) {
  const { startTutorial } = useTutorial();

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => void startTutorial(tutorialId)}
    >
      {children}
    </Button>
  );
}
