"use client";

import { HitBar, type ZoneType } from "./HitBar";
import { cn } from "@/lib/utils";

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
        {showHitBar && (
          <div className="max-w-md mx-auto w-full">
            <HitBar isActive={showHitBar} onComplete={onHitBarComplete} />
          </div>
        )}
      </div>
    </div>
  );
}
