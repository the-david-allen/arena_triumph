"use client";

import { useEffect, useRef } from "react";

const SESSION_KEY = "tutorial-main-game-started";

/**
 * Auto-starts the main-game tutorial on first visit to MainLandingPage
 * after pre-landing (initial user setup). Uses sessionStorage to avoid
 * re-triggering in the same session.
 */
export function useFirstLandingTutorial(
  startTutorial: (tutorialId: string) => Promise<void>
): void {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;

    const run = async () => {
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(SESSION_KEY)) {
        return;
      }

      hasRun.current = true;
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(SESSION_KEY, "1");
      }
      await startTutorial("main-game");
    };

    void run();
  }, [startTutorial]);
}
