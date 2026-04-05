/**
 * Tutorial step and definition types for the custom tutorial system.
 */

export interface AdvanceCondition {
  type: "event";
  event: string;
  payload?: Record<string, unknown>;
}

export interface TutorialStepContent {
  title?: string;
  body: string;
  cta?: string;
}

export interface TutorialStep {
  id: string;
  targetId?: string;
  placement?: "top" | "bottom" | "left" | "right" | "center";
  arrow?: "top" | "bottom" | "left" | "right" | "none";
  spotlight?: boolean | { padding?: number; borderRadius?: number };
  content: TutorialStepContent;
  advanceOn?: AdvanceCondition;
  advanceOnTap?: boolean;
  gestureHint?: "tap" | "drag" | "swipe" | "long-press" | "double-tap";
  animation?: "fade" | "slide" | "scale" | "none";
}

export interface TutorialDefinition {
  id: string;
  version: number;
  steps: TutorialStep[];
}
