"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generateScoutingPuzzle, type ScoutingPuzzle } from "@/lib/scouting-game";
import { MainGrid, type CellState } from "./MainGrid";
import { CluesPanel } from "./CluesPanel";

const TIMER_SECONDS = 300;

interface ScoutingGameProps {
  onGameEnd: (success: boolean) => void;
}

function buildInitialCells(puzzle: ScoutingPuzzle): CellState[][] {
  return Array.from({ length: 4 }, (_, row) =>
    Array.from({ length: 4 }, (_, _col) => ({
      visibleItems: new Set([0, 1, 2, 3]),
      resolved: false,
      resolvedItem: puzzle.solution[row][_col],
    }))
  );
}

export function ScoutingGame({ onGameEnd }: ScoutingGameProps) {
  const puzzle = useMemo(() => generateScoutingPuzzle(), []);
  const [cells, setCells] = useState<CellState[][]>(() =>
    buildInitialCells(puzzle)
  );
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const gameOverRef = useRef(false);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!gameOverRef.current) {
            gameOverRef.current = true;
            onGameEnd(false);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onGameEnd]);

  const triggerEnd = useCallback(
    (success: boolean) => {
      if (gameOverRef.current) return;
      gameOverRef.current = true;
      onGameEnd(success);
    },
    [onGameEnd]
  );

  const checkAllResolved = useCallback(
    (nextCells: CellState[][]) => {
      const allDone = nextCells.every((row) =>
        row.every((cell) => cell.resolved || cell.visibleItems.size === 1)
      );
      if (allDone) {
        triggerEnd(true);
      }
    },
    [triggerEnd]
  );

  const handleLeftClick = useCallback(
    (row: number, col: number, item: number) => {
      if (gameOverRef.current) return;
      const secret = puzzle.solution[row][col];
      if (item !== secret) {
        triggerEnd(false);
        return;
      }
      setCells((prev) => {
        const next = prev.map((r) => r.map((c) => ({ ...c })));
        next[row][col] = {
          ...next[row][col],
          visibleItems: new Set([item]),
          resolved: true,
        };
        checkAllResolved(next);
        return next;
      });
    },
    [puzzle, triggerEnd, checkAllResolved]
  );

  const handleRightClick = useCallback(
    (row: number, col: number, item: number) => {
      if (gameOverRef.current) return;
      const secret = puzzle.solution[row][col];
      if (item === secret) {
        triggerEnd(false);
        return;
      }
      setCells((prev) => {
        const next = prev.map((r) => r.map((c) => ({ ...c })));
        const cell = { ...next[row][col] };
        const newVisible = new Set(cell.visibleItems);
        newVisible.delete(item);
        cell.visibleItems = newVisible;
        if (newVisible.size === 1) {
          cell.resolved = true;
        }
        next[row][col] = cell;
        checkAllResolved(next);
        return next;
      });
    },
    [puzzle, triggerEnd, checkAllResolved]
  );

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const isGameOver = gameOverRef.current;

  return (
    <div className="flex flex-col gap-2">
      {/* Header row: Timer above grid, Clues label above clues */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-8">
        <div className="flex w-full max-w-[480px] shrink-0 justify-center pl-16 sm:pl-20">
          <div
            className={`rounded-lg border px-6 py-2 text-center text-2xl font-bold tabular-nums ${
              timeLeft <= 30
                ? "border-red-500 text-red-400"
                : "border-border text-foreground"
            }`}
          >
            <span className="font-normal text-muted-foreground">Time Remaining:{" "}</span>
            {timerDisplay}
          </div>
        </div>
        <div className="hidden w-full lg:block lg:max-w-md">
          <h2 className="text-center text-lg font-bold text-foreground">Clues</h2>
        </div>
      </div>

      {/* Game area: Grid + Clues */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        {/* Main Grid */}
        <div className="flex w-full max-w-[480px] shrink-0 flex-col gap-2 pl-16 sm:pl-20">
          <MainGrid
            cells={cells}
            onLeftClick={handleLeftClick}
            onRightClick={handleRightClick}
            disabled={isGameOver}
          />
          <p className="text-center text-xs text-muted-foreground">
            Left click to select the option when you know it. Right click to eliminate the option.
          </p>
        </div>

        {/* Clues Panel */}
        <div className="w-full lg:max-w-md">
          <CluesPanel clues={puzzle.clues} showHeader={false} />
        </div>
      </div>
    </div>
  );
}
