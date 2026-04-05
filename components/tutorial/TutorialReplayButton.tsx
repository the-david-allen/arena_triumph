"use client";

import { Button } from "@/components/ui/button";
import { useTutorial } from "@/lib/tutorial/use-tutorial";

export interface TutorialReplayButtonProps {
  tutorialId: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
}

export function TutorialReplayButton({
  tutorialId,
  variant = "ghost",
  size = "sm",
  className,
  children = "Replay tutorial",
}: TutorialReplayButtonProps) {
  const { replayTutorial } = useTutorial();

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => void replayTutorial(tutorialId)}
    >
      {children}
    </Button>
  );
}
