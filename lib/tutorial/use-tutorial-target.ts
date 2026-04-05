"use client";

import { useEffect } from "react";

export const TARGET_ATTR = "data-tutorial-target";

export interface TargetRegistry {
  register: (id: string, el: HTMLElement | null) => void;
  unregister: (id: string) => void;
}

export interface UseTutorialTargetOptions {
  targetId: string;
  targetRegistry: TargetRegistry;
}

/**
 * Register a ref's element as a tutorial target. Call from a component
 * that wraps the target element. Returns props to spread onto the target.
 */
export function useTutorialTarget(
  ref: React.RefObject<HTMLElement | null>,
  options: UseTutorialTargetOptions
): Record<string, string> {
  const { targetId, targetRegistry } = options;

  useEffect(() => {
    const el = ref.current;
    targetRegistry.register(targetId, el);
    return () => {
      targetRegistry.unregister(targetId);
    };
  }, [ref, targetId, targetRegistry]);

  return {
    [TARGET_ATTR]: targetId,
  };
}
