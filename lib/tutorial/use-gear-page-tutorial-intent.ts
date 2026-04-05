"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

/**
 * If ?tutorial=1 is in the URL, auto-start the given tutorial once.
 * Clears the query param after starting.
 */
export function useGearPageTutorialIntent(
  tutorialId: string,
  startTutorial: (id: string) => Promise<void>
): void {
  const searchParams = useSearchParams();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    if (searchParams.get("tutorial") !== "1") return;

    hasStarted.current = true;
    void startTutorial(tutorialId);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("tutorial");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [searchParams, tutorialId, startTutorial]);
}
