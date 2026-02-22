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
import { generateBeltPuzzle } from "@/lib/belt-nonogram-generator";
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
  /** Set when we right-click an empty cell and set it to X in mouseDown; prevents onContextMenu from unmarking it. */
  const rightClickSetXRef = React.useRef<{ row: number; col: number } | null>(null);
  /** All cells set to X during this right-click gesture (single or drag); don't unmark any of them in contextmenu/click. */
  const rightClickXCellsRef = React.useRef<Set<string>>(new Set());
  /** True when the current pointer gesture is a right-click (set in mouseDown, cleared in mouseUp). */
  const rightClickGestureRef = React.useRef(false);
  /** After right-click mouseUp, ignore the next click (browsers often fire click after right-click and would unmark). */
  const ignoreNextClickRef = React.useRef(false);
  /** Timestamp when the last right-click gesture ended (mouseUp); used to suppress all click/contextmenu for a short window. */
  const rightClickEndTimeRef = React.useRef(0);
  const RIGHT_CLICK_SUPPRESS_MS = 400;
  const timerIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const beltMusicRef = React.useRef<HTMLAudioElement | null>(null);
  const gridContainerRef = React.useRef<HTMLDivElement | null>(null);
  /** Long-press (mobile): timer and target cell */
  const longPressTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchTargetRef = React.useRef<{ row: number; col: number } | null>(null);
  /** Set when long-press fired so we ignore the next synthetic click */
  const longPressOccurredRef = React.useRef(false);
  const LONG_PRESS_MS = 500;

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
      } = generateBeltPuzzle();

      if (userId) {
        await updatePlayCount(userId);
        setTodayPlayCount((prev) => (prev !== null ? prev + 1 : null));
      }

      setPuzzle(newPuzzle);
      setRowHints(newRowHints);
      setColumnHints(newColumnHints);
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/48848a1b-9019-4cd4-a6a6-ace0c21a0b17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'belt/page.tsx:handleCellMouseDown',message:'mouseDown',data:{row,col,button:e.button,isRightClick,currentState:currentState===null?'null':currentState},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion

    // If cell is already marked: left-click unmarks here; right-click unmarks in onContextMenu (handleCellClick)
    if (currentState === true || currentState === false) {
      if (!isRightClick) {
        // Don't unmark cells we set to X with right-click: spurious mousedown can fire before mouseup, so check gesture ref and time/set
        if (rightClickGestureRef.current || (Date.now() - rightClickEndTimeRef.current < RIGHT_CLICK_SUPPRESS_MS && rightClickXCellsRef.current.has(`${row},${col}`))) {
          return;
        }
        setPlayerGrid((prev) => {
          const newGrid = prev.map((r) => [...r]);
          newGrid[row][col] = null;
          return newGrid;
        });
      }
      return;
    }

    // If cell is empty, start dragging with the appropriate state
    const newState = isRightClick ? "x" : "green";
    setIsDragging(true);
    setDragState(newState);
    mouseMovedRef.current = false;
    mouseDownCellRef.current = { row, col };
    if (isRightClick) {
      rightClickSetXRef.current = { row, col };
      rightClickXCellsRef.current = new Set([`${row},${col}`]);
      rightClickGestureRef.current = true;
      // Set before any other event (e.g. click can fire before contextmenu or mouseUp); so the next click is ignored and won't unmark
      ignoreNextClickRef.current = true;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/48848a1b-9019-4cd4-a6a6-ace0c21a0b17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'belt/page.tsx:mouseDown set X',message:'rightClick set refs and will set cell to X',data:{row,col},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
    }

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

    // So contextmenu/click on release see refMatch for this cell and don't unmark it (right-click drag last cell)
    if (dragState === "x") {
      rightClickSetXRef.current = { row, col };
      rightClickXCellsRef.current.add(`${row},${col}`);
    }

    setPlayerGrid((prev) => {
      const newGrid = prev.map((r) => [...r]);
      newGrid[row][col] = dragState === "green" ? true : false;
      return newGrid;
    });
  };

  const handleCellMouseUp = () => {
    // #region agent log
    const hadRightGesture = rightClickGestureRef.current;
    fetch('http://127.0.0.1:7242/ingest/48848a1b-9019-4cd4-a6a6-ace0c21a0b17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'belt/page.tsx:handleCellMouseUp',message:'mouseUp',data:{rightClickGestureRef:hadRightGesture,settingIgnoreNextClick:hadRightGesture},timestamp:Date.now(),hypothesisId:'H2_H5'})}).catch(()=>{});
    // #endregion
    // Right-click release is handled in document mouseup (capture); here we only clear drag state
    setIsDragging(false);
    setDragState(null);
  };

  const handleCellTouchStart = (row: number, col: number) => {
    if (!isGameActive || isGameEnding) return;
    touchTargetRef.current = { row, col };
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null;
      const t = touchTargetRef.current;
      if (t && t.row === row && t.col === col) {
        longPressOccurredRef.current = true;
        handleCellClick(row, col, true);
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

  // When right button is released anywhere: apply X to cell under cursor (so last cell is set even if mouseEnter never fired), then set refs for suppression
  React.useEffect(() => {
    const onDocMouseUp = (e: MouseEvent) => {
      if (e.button !== 2 || !rightClickGestureRef.current) return;
      rightClickGestureRef.current = false;
      ignoreNextClickRef.current = true;
      rightClickEndTimeRef.current = Date.now();
      let el: Element | null = document.elementFromPoint(e.clientX, e.clientY);
      while (el && el.getAttribute("data-belt-row") == null) el = el.parentElement;
      const dr = el?.getAttribute("data-belt-row");
      const dc = el?.getAttribute("data-belt-col");
      if (dr != null && dc != null) {
        const r = Number(dr);
        const c = Number(dc);
        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
          rightClickXCellsRef.current.add(`${r},${c}`);
          rightClickSetXRef.current = { row: r, col: c };
          setPlayerGrid((prev) => {
            const next = prev.map((row) => [...row]);
            if (next[r][c] !== false) {
              next[r][c] = false;
              return next;
            }
            return prev;
          });
        }
      }
    };
    document.addEventListener("mouseup", onDocMouseUp, true);
    return () => document.removeEventListener("mouseup", onDocMouseUp, true);
  }, []);

  // Suppress click/contextmenu in capture phase when they occur right after a right-click gesture (so cell handlers never run and can't unmark)
  React.useEffect(() => {
    const suppressIfJustRightClickEnded = (e: MouseEvent) => {
      if (Date.now() - rightClickEndTimeRef.current < RIGHT_CLICK_SUPPRESS_MS) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("click", suppressIfJustRightClickEnded, true);
    document.addEventListener("contextmenu", suppressIfJustRightClickEnded, true);
    return () => {
      document.removeEventListener("click", suppressIfJustRightClickEnded, true);
      document.removeEventListener("contextmenu", suppressIfJustRightClickEnded, true);
    };
  }, []);

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
        // Play count is incremented at game start only; do not increment again here.
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

Left click on a square to make it dark green. Long-press or right-click to mark with X. Click and drag to mark more than one square. Good luck!`;

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
          {/* Timer */}
          <div className="flex flex-col items-center gap-3">
            <div className="text-2xl font-bold">
              Time: {timer} seconds
            </div>
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
                  ref={gridContainerRef}
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
                          return (
                            <div
                              key={`${rowIndex}-${colIndex}`}
                              data-belt-row={rowIndex}
                              data-belt-col={colIndex}
                              className={cn(
                                "w-10 h-10 border border-gray-400 flex items-center justify-center cursor-pointer transition-colors relative",
                                cellState === true
                                  ? "bg-[rgb(70,180,90)]"
                                  : cellState === false
                                  ? "bg-gray-300"
                                  : "bg-white hover:bg-gray-100",
                                isGameEnding && "pointer-events-none opacity-50"
                              )}
                              onClick={(e) => {
                                if (longPressOccurredRef.current) {
                                  longPressOccurredRef.current = false;
                                  return;
                                }
                                // #region agent log
                                const ign = ignoreNextClickRef.current;
                                const sameCell = mouseDownCellRef.current?.row === rowIndex && mouseDownCellRef.current?.col === colIndex;
                                fetch('http://127.0.0.1:7242/ingest/48848a1b-9019-4cd4-a6a6-ace0c21a0b17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'belt/page.tsx:onClick',message:'click',data:{rowIndex,colIndex,button:e.button,ignoreNextClick:ign,sameCell,cellState:cellState===null?'null':cellState},timestamp:Date.now(),hypothesisId:'H3_H5'})}).catch(()=>{});
                                // #endregion
                                // Ignore right-click (handled by onContextMenu)
                                if (e.button === 2) return;
                                // Short window after right-click end: suppress any click so no cell we just marked gets unmarked (handles ordering/target quirks)
                                if (Date.now() - rightClickEndTimeRef.current < RIGHT_CLICK_SUPPRESS_MS) {
                                  mouseDownCellRef.current = null;
                                  return;
                                }
                                // After right-click release (single or drag), browsers often fire a click; ignore it so we don't unmark the cell(s)
                                if (ignoreNextClickRef.current) {
                                  ignoreNextClickRef.current = false;
                                  mouseDownCellRef.current = null;
                                  return;
                                }
                                // Right-click drag can fire multiple clicks; don't unmark any cell we set to X during this gesture.
                                if (rightClickXCellsRef.current.has(`${rowIndex},${colIndex}`)) {
                                  mouseDownCellRef.current = null;
                                  return;
                                }
                                if (rightClickSetXRef.current?.row === rowIndex && rightClickSetXRef.current?.col === colIndex) {
                                  rightClickSetXRef.current = null;
                                  mouseDownCellRef.current = null;
                                  return;
                                }
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
                                // Short window after right-click end: suppress so no cell we just marked gets unmarked
                                if (Date.now() - rightClickEndTimeRef.current < RIGHT_CLICK_SUPPRESS_MS) {
                                  ignoreNextClickRef.current = true;
                                  rightClickSetXRef.current = null;
                                  mouseDownCellRef.current = null;
                                  return;
                                }
                                const refMatch = rightClickSetXRef.current?.row === rowIndex && rightClickSetXRef.current?.col === colIndex;
                                const inSet = rightClickXCellsRef.current.has(`${rowIndex},${colIndex}`);
                                // #region agent log
                                fetch('http://127.0.0.1:7242/ingest/48848a1b-9019-4cd4-a6a6-ace0c21a0b17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'belt/page.tsx:onContextMenu',message:'contextMenu',data:{rowIndex,colIndex,cellState:cellState===null?'null':cellState,refMatch,inSet,refCell:rightClickSetXRef.current},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
                                // #endregion
                                // We just set this cell to X in mouseDown or drag (right-click): keep it X; ignore the next click (often fires before mouseUp and would unmark)
                                if (refMatch || inSet) {
                                  ignoreNextClickRef.current = true;
                                  rightClickSetXRef.current = null;
                                  mouseDownCellRef.current = null;
                                  return;
                                }
                                // Right-click on already-marked cell (green or X): unmark
                                if (cellState === true || cellState === false) {
                                  handleCellClick(rowIndex, colIndex, true);
                                  mouseDownCellRef.current = null;
                                  return;
                                }
                                // Right-click on empty cell (e.g. from another cell's drag): set X
                                if (!mouseMovedRef.current && mouseDownCellRef.current?.row === rowIndex && mouseDownCellRef.current?.col === colIndex) {
                                  mouseDownCellRef.current = null;
                                  return;
                                }
                                handleCellClick(rowIndex, colIndex, true);
                                mouseDownCellRef.current = null;
                              }}
                              onMouseDown={(e) => handleCellMouseDown(rowIndex, colIndex, e)}
                              onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                              onTouchStart={() => handleCellTouchStart(rowIndex, colIndex)}
                              onTouchEnd={handleCellTouchEnd}
                              onTouchCancel={handleCellTouchEnd}
                            >
                              {cellState === false && (
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
