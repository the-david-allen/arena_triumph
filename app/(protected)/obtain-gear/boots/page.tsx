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
  getRandomBootsByRarity,
  addToInventory,
} from "@/lib/boots-game";
import { getTodayPlayCountForGear } from "@/lib/playcount";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";

const GRID_SIZE = 20;
const NUM_MINES = 45;
const LOSS_SCORE = 9999;
const MYSTIC_ICON_URL = "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/affinities/mystic.jpg";

const RULES_TEXT =
  "45 mystic explosions are hidden throughout this grid.  Press or click a cell to reveal what lies beneath.  A number tells you how many mystic explosions touch that cell.  Long-press or right-click to mark cells that you know have mystic explosions, but do not detonate them or the game will end.  Complete the grid by marking all mystic explosions as fast as you can. Good luck!";

function getNeighborKeys(r: number, c: number): string[] {
  const keys: string[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
        keys.push(`${nr}-${nc}`);
      }
    }
  }
  return keys;
}

function countAdjacentMines(mineMap: boolean[][], r: number, c: number): number {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && mineMap[nr][nc]) {
        count++;
      }
    }
  }
  return count;
}

function buildBoardExcluding(firstR: number, firstC: number): {
  mineMap: boolean[][];
  adjacentCounts: number[][];
} {
  const excluded = new Set(getNeighborKeys(firstR, firstC));
  const candidates: { r: number; c: number }[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!excluded.has(`${r}-${c}`)) {
        candidates.push({ r, c });
      }
    }
  }
  // Fisher-Yates partial shuffle to pick NUM_MINES
  const mines: { r: number; c: number }[] = [];
  const len = candidates.length;
  for (let i = 0; i < NUM_MINES && i < len; i++) {
    const j = i + Math.floor(Math.random() * (len - i));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    mines.push(candidates[i]);
  }
  const mineMap: boolean[][] = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(false));
  for (const { r, c } of mines) {
    mineMap[r][c] = true;
  }
  const adjacentCounts: number[][] = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(0));
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      adjacentCounts[r][c] = countAdjacentMines(mineMap, r, c);
    }
  }
  return { mineMap, adjacentCounts };
}

function floodReveal(
  mineMap: boolean[][],
  adjacentCounts: number[][],
  revealed: boolean[][],
  r: number,
  c: number
): void {
  if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return;
  if (revealed[r][c] || mineMap[r][c]) return;
  revealed[r][c] = true;
  if (adjacentCounts[r][c] === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        floodReveal(mineMap, adjacentCounts, revealed, r + dr, c + dc);
      }
    }
  }
}

export default function BootsPage() {
  const [isGameActive, setIsGameActive] = React.useState(false);
  const [mineMap, setMineMap] = React.useState<boolean[][] | null>(null);
  const [adjacentCounts, setAdjacentCounts] = React.useState<number[][] | null>(null);
  const [revealed, setRevealed] = React.useState<boolean[][]>(
    () => Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false))
  );
  const [flagged, setFlagged] = React.useState<boolean[][]>(
    () => Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false))
  );
  const [timer, setTimer] = React.useState(0);
  const [isGameEnding, setIsGameEnding] = React.useState(false);
  const [hasLost, setHasLost] = React.useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = React.useState(false);
  const [rewardBoots, setRewardBoots] = React.useState<{
    id: string;
    name: string;
    image_url: string | null;
  } | null>(null);
  const [finalSeconds, setFinalSeconds] = React.useState(0);
  const [showRules, setShowRules] = React.useState(false);
  const [todayPlayCount, setTodayPlayCount] = React.useState<number | null>(null);
  const timerIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getCurrentUserId().then((userId) => {
      if (!userId || cancelled) return;
      getTodayPlayCountForGear(userId, "Boots").then((count) => {
        if (!cancelled) setTodayPlayCount(count);
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const longPressTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchTargetRef = React.useRef<{ row: number; col: number } | null>(null);

  // Timer
  React.useEffect(() => {
    if (isGameActive && mineMap !== null && !isGameEnding) {
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
  }, [isGameActive, mineMap, isGameEnding]);

  // Win condition: all 355 non-mine cells revealed
  const totalRevealed = revealed.flat().filter(Boolean).length;
  const nonMineCount = GRID_SIZE * GRID_SIZE - NUM_MINES;
  const handleGameEndRef = React.useRef<(scoreSeconds: number) => void>(() => {});
  handleGameEndRef.current = async (scoreSeconds: number) => {
    setIsGameEnding(true);
    setFinalSeconds(scoreSeconds);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      const userId = await getCurrentUserId();
      if (userId) {
        await updateTopScores(userId, scoreSeconds);
        const rarity = await getRewardRarity(scoreSeconds);
        if (rarity) {
          const boots = await getRandomBootsByRarity(rarity);
          if (boots) {
            await addToInventory(userId, boots.id);
            setRewardBoots(boots);
          }
        }
      }
    } catch (error) {
      console.error("Failed to process game end:", error);
    }
    setIsGameActive(false);
    setShowCompletionScreen(true);
  };
  React.useEffect(() => {
    if (!isGameActive || !mineMap || isGameEnding || hasLost) return;
    if (totalRevealed === nonMineCount) {
      handleGameEndRef.current(timer);
    }
  }, [totalRevealed, isGameActive, mineMap, isGameEnding, hasLost, timer]);

  const handlePlayGame = async () => {
    const userId = await getCurrentUserId();
    if (userId) {
      await updatePlayCount(userId);
      setTodayPlayCount((prev) => (prev !== null ? prev + 1 : null));
    }
    setMineMap(null);
    setAdjacentCounts(null);
    setRevealed(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false)));
    setFlagged(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false)));
    setTimer(0);
    setIsGameActive(true);
    setIsGameEnding(false);
    setHasLost(false);
    setShowCompletionScreen(false);
    setRewardBoots(null);
    setFinalSeconds(0);
  };

  const handleFirstClick = (row: number, col: number) => {
    if (mineMap !== null) return;
    const { mineMap: newMineMap, adjacentCounts: newCounts } = buildBoardExcluding(row, col);
    setMineMap(newMineMap);
    setAdjacentCounts(newCounts);
    const newRevealed = revealed.map((row) => [...row]);
    floodReveal(newMineMap, newCounts, newRevealed, row, col);
    setRevealed(newRevealed);
  };

  const handleReveal = (row: number, col: number) => {
    if (!mineMap || !adjacentCounts || revealed[row][col] || flagged[row][col] || isGameEnding) return;
    if (mineMap[row][col]) {
      setHasLost(true);
      setRevealed((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = true;
        return next;
      });
      handleGameEnd(LOSS_SCORE);
      return;
    }
    const newRevealed = revealed.map((r) => [...r]);
    floodReveal(mineMap, adjacentCounts, newRevealed, row, col);
    setRevealed(newRevealed);
  };

  const handleCellLeftClick = (row: number, col: number) => {
    if (!isGameActive || isGameEnding) return;
    if (mineMap === null) {
      handleFirstClick(row, col);
      return;
    }
    handleReveal(row, col);
  };

  const handleCellRightClick = (row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!isGameActive || isGameEnding || mineMap === null) return;
    if (revealed[row][col]) return;
    setFlagged((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][col] = !next[row][col];
      return next;
    });
  };

  const handleTouchStart = (row: number, col: number) => {
    if (!isGameActive || isGameEnding) return;
    touchTargetRef.current = { row, col };
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null;
      const t = touchTargetRef.current;
      if (t && t.row === row && t.col === col && !revealed[row][col]) {
        setFlagged((prev) => {
          const next = prev.map((r) => [...r]);
          next[row][col] = !next[row][col];
          return next;
        });
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchTargetRef.current = null;
  };

  const handleGameEnd = (scoreSeconds: number) => {
    handleGameEndRef.current(scoreSeconds);
  };

  const handleResetGame = () => {
    setShowCompletionScreen(false);
    setRewardBoots(null);
    setFinalSeconds(0);
    setIsGameActive(false);
    setIsGameEnding(false);
    setMineMap(null);
    setAdjacentCounts(null);
    setRevealed(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false)));
    setFlagged(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false)));
    setTimer(0);
    setHasLost(false);
  };

  React.useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => {
      if (isGameActive && !isGameEnding) e.preventDefault();
    };
    document.addEventListener("contextmenu", preventContextMenu);
    return () => document.removeEventListener("contextmenu", preventContextMenu);
  }, [isGameActive, isGameEnding]);

  if (showCompletionScreen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200 p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center space-y-4">
          <h2 className="text-3xl font-bold">Game Complete!</h2>
          <p className="text-lg">
            {finalSeconds === LOSS_SCORE
              ? "You hit a mystic explosion. Better luck next time."
              : "Congratulations! You have completed the game."}
          </p>
          <div className="text-2xl font-bold">
            Time: {finalSeconds === LOSS_SCORE ? "—" : `${finalSeconds} seconds`}
          </div>
          {rewardBoots && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">You have been rewarded with:</p>
              <p className="text-xl font-semibold text-primary mb-3">{rewardBoots.name}</p>
              {rewardBoots.image_url && (
                <div className="flex justify-center">
                  <Image
                    src={rewardBoots.image_url}
                    alt={rewardBoots.name}
                    width={256}
                    height={256}
                    className="max-w-full h-auto max-h-64 rounded-lg shadow-md object-contain"
                    unoptimized
                  />
                </div>
              )}
            </div>
          )}
          <Button onClick={() => router.push("/obtain-gear")} className="mt-4">
            Ok
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 min-h-screen bg-gray-200">
      <div className="flex justify-between items-center">
        <Button
          onClick={() => void handlePlayGame()}
          disabled={
            isGameActive ||
            (todayPlayCount !== null && todayPlayCount >= 3)
          }
        >
          {todayPlayCount !== null && todayPlayCount >= 3
            ? "No plays remaining today"
            : "Play Game"}
        </Button>
        <Button variant="outline" onClick={() => setShowRules(true)}>
          Rules
        </Button>
      </div>

      {isGameActive && (
        <div className="flex flex-col items-center justify-center w-full px-4">
          <div className="text-2xl font-bold mb-4">
            Time Elapsed: {timer} seconds
          </div>
          <div className="bg-white p-4 rounded-lg shadow-lg flex justify-center">
            <div
              className="grid gap-0.5 border-2 border-gray-800"
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                width: "min(92vw, 42rem)",
                aspectRatio: "1",
              }}
            >
              {Array(GRID_SIZE)
                .fill(null)
                .map((_, rowIndex) =>
                  Array(GRID_SIZE)
                    .fill(null)
                    .map((_, colIndex) => {
                      const isRevealed = revealed[rowIndex][colIndex];
                      const isFlag = flagged[rowIndex][colIndex];
                      const isMine = mineMap?.[rowIndex]?.[colIndex] ?? false;
                      const count = adjacentCounts?.[rowIndex]?.[colIndex] ?? 0;
                      const showMine = isRevealed && isMine;
                      const showCount = isRevealed && !isMine && count > 0;

                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={cn(
                            "aspect-square flex items-center justify-center text-sm font-bold border border-gray-400 cursor-pointer select-none",
                            isRevealed && "bg-white",
                            !isRevealed && "bg-slate-500 hover:bg-slate-600",
                            isGameEnding && "pointer-events-none opacity-80"
                          )}
                          onClick={() => handleCellLeftClick(rowIndex, colIndex)}
                          onContextMenu={(e) => handleCellRightClick(rowIndex, colIndex, e)}
                          onTouchStart={() => handleTouchStart(rowIndex, colIndex)}
                          onTouchEnd={handleTouchEnd}
                          onTouchCancel={handleTouchEnd}
                        >
                          {showMine && (
                            <Image
                              src={MYSTIC_ICON_URL}
                              alt="Mystic explosion"
                              width={24}
                              height={24}
                              className="w-full h-full object-contain p-0.5"
                              unoptimized
                            />
                          )}
                          {showCount && (
                            <span
                              className={cn(
                                count === 1 && "text-blue-600",
                                count === 2 && "text-green-600",
                                count === 3 && "text-red-600",
                                count >= 4 && "text-purple-700"
                              )}
                            >
                              {count}
                            </span>
                          )}
                          {!isRevealed && isFlag && (
                            <Image
                              src={MYSTIC_ICON_URL}
                              alt="Flag"
                              width={20}
                              height={20}
                              className="w-full h-full object-contain p-0.5 opacity-80"
                              unoptimized
                            />
                          )}
                        </div>
                      );
                    })
                )}
            </div>
          </div>
        </div>
      )}

      <Dialog open={showRules} onOpenChange={setShowRules}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Game Rules</DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {RULES_TEXT}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
