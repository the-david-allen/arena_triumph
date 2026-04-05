"use client";

import * as React from "react";
import { useReducer, useCallback, useEffect, useRef } from "react";
import {
  createTargetRegistry,
  tutorialEngineReducer,
  getCurrentStep,
  type TutorialEngineState,
} from "@/lib/tutorial/engine";
import { loadTutorialDefinition } from "@/lib/tutorial/load-definition";
import type { TutorialDefinition } from "@/lib/tutorial/types";
import { TutorialOverlay } from "./TutorialOverlay";
import { TARGET_ATTR } from "@/lib/tutorial/use-tutorial-target";

const INITIAL_STATE: TutorialEngineState = {
  activeTutorialId: null,
  definition: null,
  stepIndex: 0,
  isActive: false,
};

export interface TutorialContextValue {
  startTutorial: (tutorialId: string) => Promise<void>;
  advanceStep: () => void;
  goBackStep: () => void;
  completeTutorial: () => void;
  skipTutorial: () => void;
  replayTutorial: (tutorialId: string) => Promise<void>;
  emit: (event: string, payload?: Record<string, unknown>) => void;
  state: TutorialEngineState;
  targetRegistry: ReturnType<typeof createTargetRegistry>;
}

export const TutorialContext = React.createContext<TutorialContextValue | null>(
  null
);

function resolveTargetElement(targetId: string): HTMLElement | null {
  const el = document.querySelector(
    `[${TARGET_ATTR}="${targetId}"]`
  ) as HTMLElement | null;
  return el;
}

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(
    tutorialEngineReducer,
    INITIAL_STATE
  );
  const targetRegistryRef = useRef(createTargetRegistry());
  const targetRegistry = targetRegistryRef.current;

  const eventSubRef = useRef<{
    event: string;
    handler: (payload?: unknown) => void;
  } | null>(null);

  const getTargetElement = useCallback((targetId: string): HTMLElement | null => {
    const fromRegistry = targetRegistryRef.current.getElement(targetId);
    if (fromRegistry) return fromRegistry;
    return resolveTargetElement(targetId);
  }, []);

  const advanceStep = useCallback(() => {
    dispatch({ type: "ADVANCE" });
  }, []);

  const goBackStep = useCallback(() => {
    dispatch({ type: "BACK" });
  }, []);

  const handleComplete = useCallback(() => {
    dispatch({ type: "COMPLETE" });
  }, []);

  const skipTutorial = useCallback(() => {
    dispatch({ type: "SKIP" });
  }, []);

  const startTutorial = useCallback(async (tutorialId: string) => {
    const definition = await loadTutorialDefinition(tutorialId);
    if (!definition) {
      console.warn(`Tutorial definition not found: ${tutorialId}`);
      return;
    }
    dispatch({ type: "START", tutorialId, definition });
  }, []);

  const replayTutorial = useCallback(async (tutorialId: string) => {
    const definition = await loadTutorialDefinition(tutorialId);
    if (!definition) return;
    dispatch({ type: "REPLAY", definition });
  }, []);

  const emit = useCallback(
    (event: string, payload?: Record<string, unknown>) => {
      const sub = eventSubRef.current;
      if (sub && sub.event === event) {
        sub.handler(payload);
      }
    },
    []
  );

  const currentStep = getCurrentStep(state);

  useEffect(() => {
    if (!currentStep || !currentStep.advanceOn || currentStep.advanceOn.type !== "event")
      return;

    const eventName = currentStep.advanceOn.event;
    const expectedPayload = currentStep.advanceOn.payload;

    const handler = (payload?: unknown) => {
      if (expectedPayload && payload && typeof payload === "object") {
        const p = payload as Record<string, unknown>;
        for (const [k, v] of Object.entries(expectedPayload)) {
          if (p[k] !== v) return;
        }
      }
      eventSubRef.current = null;
      advanceStep();
    };

    eventSubRef.current = { event: eventName, handler };
    return () => {
      eventSubRef.current = null;
    };
  }, [currentStep, advanceStep]);


  const targetRef = React.useRef<HTMLElement | null>(null);
  const [targetRect, setTargetRect] = React.useState<DOMRect | null>(null);

  useEffect(() => {
    if (!currentStep || !state.isActive) {
      setTargetRect(null);
      return;
    }

    const targetId = currentStep.targetId;
    if (!targetId) {
      targetRef.current = null;
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const el = getTargetElement(targetId);
      targetRef.current = el;
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    updateRect();

    const ro = new ResizeObserver(updateRect);
    const el = getTargetElement(targetId);
    if (el) ro.observe(el);

    const interval = setInterval(updateRect, 100);

    return () => {
      ro.disconnect();
      clearInterval(interval);
    };
  }, [currentStep, state.isActive, getTargetElement]);

  const handleAdvance = useCallback(() => {
    advanceStep();
  }, [advanceStep]);

  const handleBackdropClick = useCallback(() => {
    if (currentStep?.advanceOnTap) {
      advanceStep();
    }
  }, [currentStep?.advanceOnTap, advanceStep]);

  const value: TutorialContextValue = {
    startTutorial,
    advanceStep,
    goBackStep,
    completeTutorial: handleComplete,
    skipTutorial,
    replayTutorial,
    emit,
    state,
    targetRegistry,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
      {state.isActive && currentStep && state.activeTutorialId !== "belt" && (
        <TutorialOverlay
          step={currentStep}
          targetRef={targetRef}
          targetRect={targetRect}
          onAdvance={handleAdvance}
          onBackdropClick={handleBackdropClick}
        />
      )}
    </TutorialContext.Provider>
  );
}
