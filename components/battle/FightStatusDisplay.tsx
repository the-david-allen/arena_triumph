"use client";

import { HitBar, type ZoneType } from "./HitBar";

interface FightStatusDisplayProps {
  statusText: string;
  showHitBar: boolean;
  onHitBarComplete: (clicks: ZoneType[]) => void;
}

export function FightStatusDisplay({
  statusText,
  showHitBar,
  onHitBarComplete,
}: FightStatusDisplayProps) {
  return (
    <div className="w-full rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex flex-col gap-3">
        <p
          className="text-center font-semibold text-foreground"
          aria-live="polite"
        >
          {statusText}
        </p>
        <div className="max-w-md mx-auto w-full min-h-12">
          <HitBar isActive={showHitBar} onComplete={onHitBarComplete} />
        </div>
      </div>
    </div>
  );
}
