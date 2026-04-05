"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { BELT_TUTORIAL_5x5 } from "@/lib/belt-nonogram-generator";
import { cn } from "@/lib/utils";
import type { TutorialStep } from "@/lib/tutorial/types";

type CellState = null | true | false;

/** Invalid 2 2 row: four consecutive black cells (user must add X between) */
const INVALID_ROW_2: CellState[] = [true, true, true, true, null];

/** Correct row 2 for 2 2 clue */
const CORRECT_ROW_2: CellState[] = [true, true, false, true, true];

/** Correct row 3 for 3 clue (run of 3 in middle) */
const CORRECT_ROW_3: CellState[] = [false, true, true, true, false];

const TUTORIAL_SIZE = 5;

export interface BeltTutorialViewProps {
  currentStep: TutorialStep;
  stepIndex: number;
  emit: (event: string) => void;
  goBackStep: () => void;
  skipTutorial: () => void;
}

function getInitialGrid(stepIndex: number): CellState[][] {
  const grid: CellState[][] = Array(TUTORIAL_SIZE)
    .fill(null)
    .map(() => Array(TUTORIAL_SIZE).fill(null) as CellState[]);

  if (stepIndex === 0) {
    grid[1] = [...INVALID_ROW_2];
  } else if (stepIndex === 1) {
    grid[1] = [...CORRECT_ROW_2];
  } else if (stepIndex === 2) {
    grid[1] = [...CORRECT_ROW_2];
    grid[2] = [...CORRECT_ROW_3];
  }
  return grid;
}

function rowsMatch(a: CellState[], b: CellState[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

function gridMatchesSolution(playerGrid: CellState[][]): boolean {
  const solution = BELT_TUTORIAL_5x5.solution;
  for (let r = 0; r < TUTORIAL_SIZE; r++) {
    for (let c = 0; c < TUTORIAL_SIZE; c++) {
      const player = playerGrid[r][c];
      const expectedFilled = solution[r][c];
      if (expectedFilled && player !== true) return false;
      if (!expectedFilled && player === true) return false;
    }
  }
  return true;
}

export function BeltTutorialView({
  currentStep,
  stepIndex,
  emit,
  goBackStep,
  skipTutorial,
}: BeltTutorialViewProps) {
  const [playerGrid, setPlayerGrid] = React.useState<CellState[][]>(() =>
    getInitialGrid(stepIndex)
  );
  const emittedRow2Ref = React.useRef(false);
  const emittedRow3Ref = React.useRef(false);
  const emittedPuzzleRef = React.useRef(false);

  React.useEffect(() => {
    setPlayerGrid(getInitialGrid(stepIndex));
    if (stepIndex === 1) {
      emittedRow2Ref.current = true; // Already completed in step 0
      emittedRow3Ref.current = false;
      emittedPuzzleRef.current = false;
    } else if (stepIndex === 2) {
      emittedRow2Ref.current = true;
      emittedRow3Ref.current = true;
      emittedPuzzleRef.current = false;
    }
  }, [stepIndex]);

  const longPressTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchTargetRef = React.useRef<{ row: number; col: number } | null>(null);
  const longPressOccurredRef = React.useRef(false);
  const LONG_PRESS_MS = 500;

  const handleCellClick = (row: number, col: number, isRightClick: boolean) => {
    if (longPressOccurredRef.current) {
      longPressOccurredRef.current = false;
      return;
    }
    setPlayerGrid((prev) => {
      const newGrid = prev.map((r) => [...r]);
      const currentState = newGrid[row][col];
      if (currentState === true || currentState === false) {
        newGrid[row][col] = null;
      } else {
        newGrid[row][col] = isRightClick ? false : true;
      }
      return newGrid;
    });
  };

  const handleCellTouchStart = (row: number, col: number) => {
    touchTargetRef.current = { row, col };
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null;
      const t = touchTargetRef.current;
      if (t && t.row === row && t.col === col) {
        handleCellClick(row, col, true);
        longPressOccurredRef.current = true;
      }
    }, LONG_PRESS_MS);
  };

  const handleCellTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchTargetRef.current = null;
  };

  // Validate and emit events
  React.useEffect(() => {
    if (stepIndex === 0 && !emittedRow2Ref.current) {
      if (rowsMatch(playerGrid[1], CORRECT_ROW_2)) {
        emittedRow2Ref.current = true;
        emit("belt-tutorial-row-2-complete");
      }
    } else if (stepIndex === 1 && !emittedRow3Ref.current) {
      if (rowsMatch(playerGrid[2], CORRECT_ROW_3)) {
        emittedRow3Ref.current = true;
        emit("belt-tutorial-row-3-complete");
      }
    } else if (stepIndex === 2 && !emittedPuzzleRef.current) {
      if (gridMatchesSolution(playerGrid)) {
        emittedPuzzleRef.current = true;
        emit("belt-tutorial-puzzle-complete");
      }
    }
  }, [playerGrid, stepIndex, emit]);

  const rowHints = BELT_TUTORIAL_5x5.rowHints;
  const columnHints = BELT_TUTORIAL_5x5.columnHints;
  const maxRowHintLength = Math.max(...rowHints.map((h) => h.length), 1);
  const maxColHintLength = Math.max(...columnHints.map((h) => h.length), 1);

  // Top bar: Back (left, when not step 0) and Skip tutorial (right). Keep this pattern for future custom tutorial views.
  return (
    <div className="flex flex-col items-center min-h-screen bg-page p-6">
      <div className="flex justify-between items-center w-full max-w-lg mb-4">
        <div className="min-w-[4rem]">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={goBackStep}
              className="text-sm font-medium text-primary underline underline-offset-2 hover:no-underline"
            >
              Back
            </button>
          ) : null}
        </div>
        <Button variant="ghost" size="sm" onClick={skipTutorial}>
          Skip tutorial
        </Button>
      </div>

      <div className="w-full max-w-lg space-y-4">
        <div className="game-panel-bg rounded-lg p-4 shadow-lg">
          {currentStep.content.title && (
            <h3 className="mb-2 text-base font-semibold">
              {currentStep.content.title}
            </h3>
          )}
          <p className="mb-4 text-sm text-muted-foreground">
            {currentStep.content.body}
          </p>
        </div>

        <div className="flex justify-center">
          <div className="inline-block game-panel-bg p-4 rounded-lg shadow-lg">
            <div className="flex">
              <div
                style={{
                  minWidth: `${maxRowHintLength * 20}px`,
                  width: `${maxRowHintLength * 20}px`,
                }}
              />
              <div className="flex gap-0.5">
                {columnHints.map((hints, colIndex) => (
                  <div
                    key={colIndex}
                    className="flex flex-col items-center justify-end gap-0.5"
                    style={{
                      minHeight: `${maxColHintLength * 20}px`,
                      height: `${maxColHintLength * 20}px`,
                      width: 36,
                    }}
                  >
                    {hints.length > 0 ? (
                      hints.map((h, i) => (
                        <span
                          key={i}
                          className="text-xs font-semibold leading-none"
                        >
                          {h}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex">
              <div className="flex flex-col gap-0.5">
                {rowHints.map((hints, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="flex items-center justify-end gap-0.5 pr-1"
                    style={{
                      minWidth: `${maxRowHintLength * 20}px`,
                      width: `${maxRowHintLength * 20}px`,
                      height: 36,
                    }}
                  >
                    {hints.length > 0 ? (
                      hints.map((h, i) => (
                        <span
                          key={i}
                          className="text-xs font-semibold leading-none"
                        >
                          {h}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                ))}
              </div>

              <div
                className="grid gap-0.5 border-2 border-game-board-border p-1 game-interactive"
                style={{
                  gridTemplateColumns: `repeat(${TUTORIAL_SIZE}, 1fr)`,
                  gridTemplateRows: `repeat(${TUTORIAL_SIZE}, 1fr)`,
                }}
              >
                {Array.from({ length: TUTORIAL_SIZE }).map((_, rowIndex) =>
                  Array.from({ length: TUTORIAL_SIZE }).map((_, colIndex) => {
                    const cellState = playerGrid[rowIndex][colIndex];
                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={cn(
                          "w-9 h-9 border border-game-board-border-muted flex items-center justify-center cursor-pointer transition-colors",
                          cellState === true
                            ? "bg-[rgb(55,150,75)]"
                            : cellState === false
                            ? "bg-black"
                            : "bg-gray-500 hover:bg-gray-600"
                        )}
                        onClick={(e) =>
                          handleCellClick(rowIndex, colIndex, e.button === 2)
                        }
                        onContextMenu={(e) => {
                          e.preventDefault();
                          handleCellClick(rowIndex, colIndex, true);
                        }}
                        onTouchStart={() =>
                          handleCellTouchStart(rowIndex, colIndex)
                        }
                        onTouchEnd={handleCellTouchEnd}
                        onTouchCancel={handleCellTouchEnd}
                      >
                        {cellState === false && (
                          <span className="text-white font-bold text-sm">✕</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
