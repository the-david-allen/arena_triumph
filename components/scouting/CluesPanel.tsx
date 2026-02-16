"use client";

import { type Clue } from "@/lib/scouting-game";
import { ClueDisplay } from "./ClueDisplay";

interface CluesPanelProps {
  clues: Clue[];
  showHeader?: boolean;
}

export function CluesPanel({ clues, showHeader = true }: CluesPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      {showHeader && (
        <h2 className="text-center text-lg font-bold text-foreground">Clues</h2>
      )}
      {/* On small screens where the header row is hidden, show the label inline */}
      {!showHeader && (
        <h2 className="text-center text-lg font-bold text-foreground lg:hidden">Clues</h2>
      )}
      <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-card/50 p-3">
        {clues.map((clue, i) => (
          <div
            key={i}
            className="flex items-center justify-center rounded-md bg-background p-2 shadow-sm"
          >
            <ClueDisplay clue={clue} />
          </div>
        ))}
      </div>
    </div>
  );
}
