/**
 * Tutorial engine: state machine for loading steps, matching targets,
 * and advancing on events.
 */

import type { TutorialDefinition, TutorialStep } from "./types";

export interface TargetRegistry {
  getElement(targetId: string): HTMLElement | null;
  register(targetId: string, element: HTMLElement | null): void;
  unregister(targetId: string): void;
}

export function createTargetRegistry(): TargetRegistry {
  const map = new Map<string, HTMLElement | null>();

  return {
    getElement(targetId: string): HTMLElement | null {
      return map.get(targetId) ?? null;
    },
    register(targetId: string, element: HTMLElement | null): void {
      if (element) {
        map.set(targetId, element);
      } else {
        map.delete(targetId);
      }
    },
    unregister(targetId: string): void {
      map.delete(targetId);
    },
  };
}

export interface TutorialEngineState {
  activeTutorialId: string | null;
  definition: TutorialDefinition | null;
  stepIndex: number;
  isActive: boolean;
}

export type TutorialEngineAction =
  | { type: "START"; tutorialId: string; definition: TutorialDefinition }
  | { type: "ADVANCE" }
  | { type: "BACK" }
  | { type: "COMPLETE" }
  | { type: "SKIP" }
  | { type: "REPLAY"; definition: TutorialDefinition };

export function tutorialEngineReducer(
  state: TutorialEngineState,
  action: TutorialEngineAction
): TutorialEngineState {
  switch (action.type) {
    case "START":
      return {
        activeTutorialId: action.tutorialId,
        definition: action.definition,
        stepIndex: 0,
        isActive: true,
      };
    case "ADVANCE": {
      if (!state.definition) return state;
      const nextIndex = state.stepIndex + 1;
      if (nextIndex >= state.definition.steps.length) {
        return {
          ...state,
          stepIndex: nextIndex,
          isActive: false,
        };
      }
      return {
        ...state,
        stepIndex: nextIndex,
      };
    }
    case "BACK": {
      if (state.stepIndex <= 0) return state;
      return {
        ...state,
        stepIndex: state.stepIndex - 1,
      };
    }
    case "COMPLETE":
      return {
        ...state,
        isActive: false,
      };
    case "SKIP":
      return {
        ...state,
        isActive: false,
      };
    case "REPLAY":
      return {
        ...state,
        activeTutorialId: action.definition.id,
        definition: action.definition,
        stepIndex: 0,
        isActive: true,
      };
    default:
      return state;
  }
}

export function getCurrentStep(state: TutorialEngineState): TutorialStep | null {
  if (!state.definition || !state.isActive) return null;
  const step = state.definition.steps[state.stepIndex];
  return step ?? null;
}

export function hasNextStep(state: TutorialEngineState): boolean {
  if (!state.definition) return false;
  return state.stepIndex + 1 < state.definition.steps.length;
}
