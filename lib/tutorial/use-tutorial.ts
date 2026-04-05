"use client";

import { useContext } from "react";
import { TutorialContext } from "@/components/tutorial/TutorialProvider";
import { getCurrentStep } from "@/lib/tutorial/engine";
import type { TutorialStep } from "@/lib/tutorial/types";

export interface UseTutorialReturn {
  startTutorial: (tutorialId: string) => Promise<void>;
  advanceStep: () => void;
  goBackStep: () => void;
  completeTutorial: () => void;
  skipTutorial: () => void;
  replayTutorial: (tutorialId: string) => Promise<void>;
  emit: (event: string, payload?: Record<string, unknown>) => void;
  isActive: boolean;
  activeTutorialId: string | null;
  currentStep: TutorialStep | null;
  currentStepIndex: number;
  totalSteps: number;
}

export function useTutorial(): UseTutorialReturn {
  const ctx = useContext(TutorialContext);
  if (!ctx) {
    throw new Error("useTutorial must be used within TutorialProvider");
  }

  const {
    startTutorial,
    advanceStep,
    goBackStep,
    completeTutorial,
    skipTutorial,
    replayTutorial,
    emit,
    state,
  } = ctx;

  const totalSteps = state.definition?.steps.length ?? 0;
  const currentStep = getCurrentStep(state);

  return {
    startTutorial,
    advanceStep,
    goBackStep,
    completeTutorial,
    skipTutorial,
    replayTutorial,
    emit,
    isActive: state.isActive,
    activeTutorialId: state.activeTutorialId,
    currentStep,
    currentStepIndex: state.stepIndex,
    totalSteps,
  };
}
