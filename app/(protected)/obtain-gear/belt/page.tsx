"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  updatePlayCount,
  getCurrentUserId,
  updateTopScores,
  getRewardRarity,
  getRandomBeltByRarity,
  addToInventory,
} from "@/lib/belt-game";
import { checkUserHasItem, addXpToUser, RARITY_XP } from "@/lib/inventory";
import {
  generateBeltPuzzle,
  type PuzzleDifficulty,
} from "@/lib/belt-nonogram-generator";
import { getTodayPlayCountForGear } from "@/lib/playcount";
import { BACKGROUND_MUSIC_VOLUME } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";

const GRID_SIZE = 12;

const BELT_BACKGROUND_MUSIC_URL =
  "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/sounds/belt_background.mp3";

type CellState = null | true | false; // null = empty, true = dark green, false = X

export default function BeltPage() {
  const router = useRouter();
  const [isGameActive, setIsGameActive] = React.useState(false);
  const [puzzle, setPuzzle] = React.useState<boolean[][] | null>(null);
  const [playerGrid, setPlayerGrid] = React.useState<CellState[][]>(
    Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(null))
  );
  const [rowHints, setRowHints] = React.useState<number[][]>([]);
  const [columnHints, setColumnHints] = React.useState<number[][]>([]);
  const [timer, setTimer] = React.useState(0);
  const [isGameEnding, setIsGameEnding] = React.useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = React.useState(false);
  const [rewardBelt, setRewardBelt] = React.useState<{
    id: string;
    name: string;
    image_url: string | null;
    rarity: string;
  } | null>(null);
  const [rewardXp, setRewardXp] = React.useState<number | null>(null);
  const [finalSeconds, setFinalSeconds] = React.useState(0);
  const [showRules, setShowRules] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragState, setDragState] = React.useState<"green" | "x" | null>(null);
  const [showSolution, setShowSolution] = React.useState(false);
  const [puzzleDifficulty, setPuzzleDifficulty] =
    React.useState<PuzzleDifficulty | null>(null);
  const [todayPlayCount, setTodayPlayCount] = React.useState<number | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generationError, setGenerationError] = React.useState<string | null>(
    null
  );

  React.useEffect(() => {
    let cancelled = false;
    getCurrentUserId().then((userId) => {
      if (!userId || cancelled) return;
      getTodayPlayCountForGear(userId, "Belt").then((count) => {
        if (!cancelled) setTodayPlayCount(count);
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const mouseMovedRef = React.useRef(false);
  const mouseDownCellRef = React.useRef<{ row: number; col: number } | null>(null);
  const timerIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const beltMusicRef = React.useRef<HTMLAudioElement | null>(null);

  // Timer effect
  React.useEffect(() => {
    if (isGameActive && !isGameEnding) {
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isGameActive, isGameEnding]);

  // Stop belt background music when game ends
  React.useEffect(() => {
    if (!isGameActive && beltMusicRef.current) {
      beltMusicRef.current.pause();
      beltMusicRef.current.currentTime = 0;
    }
  }, [isGameActive]);

  // Cleanup: pause belt music on unmount
  React.useEffect(() => {
    return () => {
      if (beltMusicRef.current) {
        beltMusicRef.current.pause();
        beltMusicRef.current.currentTime = 0;
      }
    };
  }, []);

  // Check if puzzle is solved
  React.useEffect(() => {
    if (!isGameActive || !puzzle || isGameEnding) return;

    // Check if all solution dark green cells are marked dark green by player
    let allCorrect = true;
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (puzzle[i][j] && playerGrid[i][j] !== true) {
          allCorrect = false;
          break;
        }
      }
      if (!allCorrect) break;
    }

    if (allCorrect) {
      handleGameEnd();
    }
  }, [playerGrid, puzzle, isGameActive, isGameEnding]);

  const handlePlayGame = async () => {
    setGenerationError(null);
    setIsGenerating(true);
    try {
      const userId = await getCurrentUserId();
      const {
        puzzle: newPuzzle,
        rowHints: newRowHints,
        columnHints: newColumnHints,
        difficulty: newDifficulty,
      } = generateBeltPuzzle();

      if (userId) {
        await updatePlayCount(userId);
        setTodayPlayCount((prev) => (prev !== null ? prev + 1 : null));
      }

      setPuzzle(newPuzzle);
      setRowHints(newRowHints);
      setColumnHints(newColumnHints);
      setPuzzleDifficulty(newDifficulty);
      setPlayerGrid(
        Array(GRID_SIZE)
          .fill(null)
          .map(() => Array(GRID_SIZE).fill(null))
      );

      setTimer(0);
      setIsGameActive(true);
      setIsGameEnding(false);
      setShowCompletionScreen(false);
      setRewardBelt(null);
      setRewardXp(null);
      setFinalSeconds(0);
      setShowSolution(false);

      // Start belt background music (same user gesture as Play Game)
      try {
        if (!beltMusicRef.current) {
          const audio = new Audio(BELT_BACKGROUND_MUSIC_URL);
          audio.volume = BACKGROUND_MUSIC_VOLUME;
          audio.loop = true;
          beltMusicRef.current = audio;
        }
        const music = beltMusicRef.current;
        music.currentTime = 0;
        void music.play();
      } catch {
        // Autoplay blocked or SSR - fail silently
      }
    } catch (error) {
      console.error("Failed to generate puzzle:", error);
      setGenerationError("Game failed to generate.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCellClick = (row: number, col: number, isRightClick: boolean = false) => {
    if (!isGameActive || isGameEnding) return;

    setPlayerGrid((prev) => {
      const newGrid = prev.map((r) => [...r]);
      const currentState = newGrid[row][col];

      // If cell is already marked (green or X), unmark it
      if (currentState === true || currentState === false) {
        newGrid[row][col] = null;
      } else {
        // If cell is empty, mark it based on click type
        if (isRightClick) {
          // Right click: mark with X
          newGrid[row][col] = false;
        } else {
          // Left click: mark dark green
          newGrid[row][col] = true;
        }
      }

      return newGrid;
    });
  };

  const handleCellMouseDown = (row: number, col: number, e: React.MouseEvent) => {
    if (!isGameActive || isGameEnding) return;

    e.preventDefault();
    const isRightClick = e.button === 2 || e.ctrlKey || e.metaKey;
    const currentState = playerGrid[row][col];
    
    // If cell is already marked, unmark it and don't start dragging
    if (currentState === true || currentState === false) {
      setPlayerGrid((prev) => {
        const newGrid = prev.map((r) => [...r]);
        newGrid[row][col] = null;
        return newGrid;
      });
      return;
    }

    // If cell is empty, start dragging with the appropriate state
    const newState = isRightClick ? "x" : "green";
    setIsDragging(true);
    setDragState(newState);
    mouseMovedRef.current = false;
    mouseDownCellRef.current = { row, col };

    // Set initial cell
    setPlayerGrid((prev) => {
      const newGrid = prev.map((r) => [...r]);
      newGrid[row][col] = newState === "green" ? true : false;
      return newGrid;
    });
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (!isGameActive || isGameEnding || !isDragging || !dragState) return;

    // Mark that mouse has moved (this is a drag, not a click)
    if (mouseDownCellRef.current && (mouseDownCellRef.current.row !== row || mouseDownCellRef.current.col !== col)) {
      mouseMovedRef.current = true;
    }

    setPlayerGrid((prev) => {
      const newGrid = prev.map((r) => [...r]);
      newGrid[row][col] = dragState === "green" ? true : false;
      return newGrid;
    });
  };

  const handleCellMouseUp = () => {
    // If mouse didn't move, it was a single click - handleCellClick already handled it via onMouseDown
    // If mouse moved, it was a drag - already handled via onMouseEnter
    setIsDragging(false);
    setDragState(null);
    // Don't clear refs here - onClick needs to check them
  };

  // Prevent context menu on right click
  React.useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (isGameActive && !isGameEnding) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, [isGameActive, isGameEnding]);

  const handleGameEnd = async () => {
    setIsGameEnding(true);
    setFinalSeconds(timer);

    // Pause for 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const userId = await getCurrentUserId();
      if (userId) {
        // Update play count
        await updatePlayCount(userId);

        // Update top scores
        await updateTopScores(userId, timer);

        // Get reward based on seconds
        const rarity = await getRewardRarity(timer);
        if (rarity) {
          const belt = await getRandomBeltByRarity(rarity);
          if (belt) {
            const alreadyHas = await checkUserHasItem(userId, belt.id);
            if (alreadyHas) {
              const xpVal = RARITY_XP[belt.rarity] ?? RARITY_XP.Base ?? 1;
              await addXpToUser(userId, xpVal);
              setRewardXp(xpVal);
              setRewardBelt(null);
            } else {
              await addToInventory(userId, belt.id);
              setRewardBelt(belt);
              setRewardXp(null);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to process game end:", error);
    }

    // Show completion screen
    setIsGameActive(false);
    setShowCompletionScreen(true);
  };

  const handleResetGame = () => {
    setShowCompletionScreen(false);
    setRewardBelt(null);
    setRewardXp(null);
    setFinalSeconds(0);
    setIsGameActive(false);
    setIsGameEnding(false);
    setPlayerGrid(
      Array(GRID_SIZE)
        .fill(null)
        .map(() => Array(GRID_SIZE).fill(null))
    );
    setTimer(0);
    setPuzzle(null);
  };

  React.useEffect(() => {
    if (showCompletionScreen && (rewardBelt || rewardXp !== null)) {
      const audio = new Audio("https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/sounds/tada.mp3");
      audio.play().catch(() => {});
    }
  }, [showCompletionScreen, rewardBelt, rewardXp]);

  const rulesText = `You have a grid of squares, which must be either filled in dark green or marked with X. Beside each row of the grid are listed the lengths of the runs of dark green squares on that row. Above each column are listed the lengths of the runs of dark green squares in that column. Your aim is to find all dark green squares.

Left click on a square to make it dark green. Right click to mark with X. Click and drag to mark more than one square.  Good luck!`;

  // Show completion screen
  if (showCompletionScreen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200 p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center space-y-4">
          <h2 className="text-3xl font-bold">Game Complete!</h2>
          <p className="text-lg">Congratulations! You have completed the puzzle.</p>
          <div className="text-2xl font-bold">Time: {finalSeconds} seconds</div>
          {rewardBelt && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">You have been rewarded with:</p>
              <p className="text-xl font-semibold text-primary mb-3">{rewardBelt.name}</p>
              {rewardBelt.image_url && (
                <div className="flex justify-center">
                  <Image
                    src={rewardBelt.image_url}
                    alt={rewardBelt.name}
                    width={256}
                    height={256}
                    className="max-w-full h-auto max-h-64 rounded-lg shadow-md object-contain"
                    unoptimized
                  />
                </div>
              )}
            </div>
          )}
          {rewardXp !== null && (
            <div className="pt-4 border-t">
              <p className="text-xl font-semibold text-primary">{rewardXp} xp gained</p>
            </div>
          )}
          <Button onClick={() => router.push("/obtain-gear")} className="mt-4">
            Ok
          </Button>
        </div>
      </div>
    );
  }

  // Calculate max hint length for layout
  const maxRowHintLength = rowHints.length > 0 ? Math.max(...rowHints.map((h) => h.length || 0), 0) : 0;
  const maxColHintLength = columnHints.length > 0 ? Math.max(...columnHints.map((h) => h.length || 0), 0) : 0;

  return (
    <div className="space-y-6 p-6 min-h-screen bg-gray-200">
      {/* Header with buttons */}
      <div className="flex justify-between items-center">
        <Button
          onClick={() => void handlePlayGame()}
          disabled={
            isGenerating ||
            isGameActive ||
            (todayPlayCount !== null && todayPlayCount >= 3)
          }
        >
          {isGenerating
            ? "Generating…"
            : todayPlayCount !== null && todayPlayCount >= 3
            ? "No plays remaining today"
            : "Play Game"}
        </Button>
        <Button variant="outline" onClick={() => setShowRules(true)}>
          Rules
        </Button>
      </div>

      {generationError && (
        <p className="text-center text-destructive font-medium">
          {generationError}
        </p>
      )}

      {/* Game board */}
      {isGameActive && (
        <div className="space-y-4">
          {/* Timer and Reveal Button */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center gap-4">
              <div className="text-2xl font-bold">
                Time: {timer} seconds
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowSolution(!showSolution)}
                size="sm"
              >
                {showSolution ? "Hide Solution" : "Reveal Solution"}
              </Button>
            </div>
            {showSolution && puzzleDifficulty && (
              <div className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm">
                <div className="font-semibold text-gray-700 mb-1">
                  Puzzle difficulty
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-gray-600">
                  <span>minRounds:</span>
                  <span className="font-mono">{puzzleDifficulty.rounds}</span>
                  <span>minLineUpdates:</span>
                  <span className="font-mono">
                    {puzzleDifficulty.lineUpdates}
                  </span>
                  <span>maxFirstRoundCellsSet:</span>
                  <span className="font-mono">
                    {puzzleDifficulty.firstRoundCellsSet}
                  </span>
                  <span>minMaxLineCandidatesSeen:</span>
                  <span className="font-mono">
                    {puzzleDifficulty.maxLineCandidatesSeen}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Nonogram Grid */}
          <div className="flex justify-center">
            <div className="inline-block bg-white p-4 rounded-lg shadow-lg">
              {/* Column hints */}
              <div className="flex">
                {/* Empty space for row hints */}
                <div style={{ minWidth: `${maxRowHintLength * 24}px`, width: `${maxRowHintLength * 24}px` }}></div>
                {/* Column hints */}
                <div className="flex gap-1">
                  {Array(GRID_SIZE)
                    .fill(null)
                    .map((_, colIndex) => (
                      <div
                        key={colIndex}
                        className="flex flex-col items-center justify-end"
                        style={{ 
                          minHeight: `${maxColHintLength * 24}px`, 
                          height: `${maxColHintLength * 24}px`,
                          width: '40px' // Match grid cell width exactly (w-10 = 40px)
                        }}
                      >
                        {columnHints[colIndex] && columnHints[colIndex].length > 0 ? (
                          columnHints[colIndex].map((hint, hintIndex) => (
                            <div
                              key={hintIndex}
                              className="text-sm font-semibold text-center"
                              style={{ width: '40px' }}
                            >
                              {hint}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-400 text-center" style={{ width: '40px' }}>—</div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* Grid rows */}
              <div className="flex">
                {/* Row hints */}
                <div className="flex flex-col gap-1">
                  {Array(GRID_SIZE)
                    .fill(null)
                    .map((_, rowIndex) => (
                      <div
                        key={rowIndex}
                        className="flex items-center justify-end"
                        style={{ 
                          minWidth: `${maxRowHintLength * 24}px`, 
                          width: `${maxRowHintLength * 24}px`,
                          height: '40px' // Match grid cell height exactly (h-10 = 40px)
                        }}
                      >
                        <div className="flex gap-1 items-center pr-1">
                          {rowHints[rowIndex] && rowHints[rowIndex].length > 0 ? (
                            rowHints[rowIndex].map((hint, hintIndex) => (
                              <span
                                key={hintIndex}
                                className="text-sm font-semibold leading-none"
                              >
                                {hint}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400 leading-none">—</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Game grid */}
                <div
                  className="grid gap-1 border-2 border-gray-800 p-1"
                  style={{
                    gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                    gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                  }}
                  onMouseUp={handleCellMouseUp}
                  onMouseLeave={handleCellMouseUp}
                >
                  {Array(GRID_SIZE)
                    .fill(null)
                    .map((_, rowIndex) =>
                      Array(GRID_SIZE)
                        .fill(null)
                        .map((_, colIndex) => {
                          const cellState = playerGrid[rowIndex][colIndex];
                          const solutionValue = puzzle ? puzzle[rowIndex][colIndex] : null;
                          return (
                            <div
                              key={`${rowIndex}-${colIndex}`}
                              className={cn(
                                "w-10 h-10 border border-gray-400 flex items-center justify-center cursor-pointer transition-colors relative",
                                cellState === true
                                  ? "bg-green-800"
                                  : cellState === false
                                  ? "bg-gray-300"
                                  : "bg-white hover:bg-gray-100",
                                isGameEnding && "pointer-events-none opacity-50"
                              )}
                              onClick={(e) => {
                                // Only handle click if it wasn't part of a single click (already handled in onMouseDown)
                                if (!mouseMovedRef.current && mouseDownCellRef.current?.row === rowIndex && mouseDownCellRef.current?.col === colIndex) {
                                  // Single click was already handled in onMouseDown, don't toggle again
                                  mouseDownCellRef.current = null;
                                  return;
                                }
                                handleCellClick(rowIndex, colIndex, false);
                                mouseDownCellRef.current = null;
                              }}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                // Only handle if it wasn't part of a single click (already handled in onMouseDown)
                                if (!mouseMovedRef.current && mouseDownCellRef.current?.row === rowIndex && mouseDownCellRef.current?.col === colIndex) {
                                  // Single right-click was already handled in onMouseDown, don't toggle again
                                  mouseDownCellRef.current = null;
                                  return;
                                }
                                handleCellClick(rowIndex, colIndex, true);
                                mouseDownCellRef.current = null;
                              }}
                              onMouseDown={(e) => handleCellMouseDown(rowIndex, colIndex, e)}
                              onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                            >
                              {showSolution && solutionValue !== null && (
                                <span className={cn(
                                  "text-xs font-bold",
                                  solutionValue ? "text-green-900" : "text-red-600"
                                )}>
                                  {solutionValue ? "T" : "F"}
                                </span>
                              )}
                              {!showSolution && cellState === false && (
                                <span className="text-gray-700 font-bold text-lg">✕</span>
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
      )}

      {/* Rules Dialog */}
      <Dialog open={showRules} onOpenChange={setShowRules}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Game Rules</DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {rulesText}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
