"use client";

import { TutorialProvider } from "./TutorialProvider";

export function TutorialWrapper({ children }: { children: React.ReactNode }) {
  return <TutorialProvider>{children}</TutorialProvider>;
}
