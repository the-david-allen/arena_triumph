"use client";

import { Suspense } from "react";
import { useGearPageTutorialIntent } from "@/lib/tutorial/use-gear-page-tutorial-intent";

interface GearPageTutorialIntentProps {
  tutorialId: string;
  startTutorial: (id: string) => Promise<void>;
}

function GearPageTutorialIntentInner({
  tutorialId,
  startTutorial,
}: GearPageTutorialIntentProps) {
  useGearPageTutorialIntent(tutorialId, startTutorial);
  return null;
}

/**
 * Wraps URL-driven tutorial intent (?tutorial=1) in Suspense because useSearchParams()
 * requires a Suspense boundary during static generation (Next.js App Router).
 */
export function GearPageTutorialIntent(props: GearPageTutorialIntentProps) {
  return (
    <Suspense fallback={null}>
      <GearPageTutorialIntentInner {...props} />
    </Suspense>
  );
}
