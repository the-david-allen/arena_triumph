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
import { getTodayPlayCountForGear } from "@/lib/playcount";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";

const GRID_SIZE = 12;

type CellState = null | true | false; // null = empty, true = dark green, false = X

/**
 * Calculate hints for a row or column
 * Returns array of run lengths of consecutive true values
 */
function calculateHints(line: boolean[]): number[] {
  const hints: number[] = [];
  let currentRun = 0;

  for (const cell of line) {
    if (cell) {
      currentRun++;
    } else {
      if (currentRun > 0) {
        hints.push(currentRun);
        currentRun = 0;
      }
    }
  }

  if (currentRun > 0) {
    hints.push(currentRun);
  }

  return hints;
}

/**
 * Check if a line matches the given hints
 */
function lineMatchesHints(line: boolean[], hints: number[]): boolean {
  const calculatedHints = calculateHints(line);
  if (calculatedHints.length !== hints.length) return false;
  return calculatedHints.every((hint, i) => hint === hints[i]);
}

/**
 * Validate if a nonogram puzzle has a unique solution
 * Uses backtracking to count solutions - returns true if exactly one solution exists
 */
function validateGridUniqueness(rowHints: number[][], columnHints: number[][]): boolean {
  const grid: (boolean | null)[][] = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(null));
  
  let solutionCount = 0;
  const MAX_SOLUTIONS_TO_CHECK = 2; // Stop after finding 2 solutions

  function solve(row: number, col: number): void {
    // If we've found more than one solution, stop
    if (solutionCount >= MAX_SOLUTIONS_TO_CHECK) return;

    // If we've filled the entire grid, check if it's valid
    if (row === GRID_SIZE) {
      // Validate all rows and columns
      let isValid = true;
      
      // Check rows
      for (let i = 0; i < GRID_SIZE && isValid; i++) {
        const rowLine = grid[i].map(cell => cell === true);
        if (!lineMatchesHints(rowLine, rowHints[i])) {
          isValid = false;
        }
      }
      
      // Check columns
      for (let j = 0; j < GRID_SIZE && isValid; j++) {
        const colLine = grid.map(row => row[j] === true);
        if (!lineMatchesHints(colLine, columnHints[j])) {
          isValid = false;
        }
      }
      
      if (isValid) {
        solutionCount++;
      }
      return;
    }

    // Calculate next position
    const nextRow = col === GRID_SIZE - 1 ? row + 1 : row;
    const nextCol = col === GRID_SIZE - 1 ? 0 : col + 1;

    // Check if current row is complete and valid
    if (col === 0 && row > 0) {
      const prevRow = grid[row - 1].map(cell => cell === true);
      if (!lineMatchesHints(prevRow, rowHints[row - 1])) {
        return; // Previous row doesn't match hints, backtrack
      }
    }

    // Try setting cell to true (filled)
    grid[row][col] = true;
    // Check if current column is still valid so far
    const currentCol = grid.map(r => r[col] === true);
    const colHintsSoFar = calculateHints(currentCol);
    // Check if the hints so far could lead to a valid solution
    if (colHintsSoFar.length <= columnHints[col].length) {
      let couldBeValid = true;
      for (let i = 0; i < colHintsSoFar.length; i++) {
        if (i < colHintsSoFar.length - 1 && colHintsSoFar[i] !== columnHints[col][i]) {
          couldBeValid = false;
          break;
        }
        if (i === colHintsSoFar.length - 1 && colHintsSoFar[i] > columnHints[col][i]) {
          couldBeValid = false;
          break;
        }
      }
      if (couldBeValid) {
        solve(nextRow, nextCol);
      }
    }

    // Try setting cell to false (empty)
    grid[row][col] = false;
    // Check if current column is still valid so far
    const currentColEmpty = grid.map(r => r[col] === true);
    const colHintsSoFarEmpty = calculateHints(currentColEmpty);
    if (colHintsSoFarEmpty.length <= columnHints[col].length) {
      let couldBeValid = true;
      for (let i = 0; i < colHintsSoFarEmpty.length; i++) {
        if (i < colHintsSoFarEmpty.length - 1 && colHintsSoFarEmpty[i] !== columnHints[col][i]) {
          couldBeValid = false;
          break;
        }
        if (i === colHintsSoFarEmpty.length - 1 && colHintsSoFarEmpty[i] > columnHints[col][i]) {
          couldBeValid = false;
          break;
        }
      }
      if (couldBeValid) {
        solve(nextRow, nextCol);
      }
    }

    // Reset cell
    grid[row][col] = null;
  }

  // Start solving from top-left
  solve(0, 0);

  // Return true if exactly one solution exists
  return solutionCount === 1;
}

/**
 * Generate a random nonogram puzzle
 * Returns: { puzzle: boolean[][], rowHints: number[][], columnHints: number[][] }
 */
function generatePuzzle(): {
  puzzle: boolean[][];
  rowHints: number[][];
  columnHints: number[][];
} {
  let puzzle: boolean[][];
  let rowHints: number[][];
  let columnHints: number[][];
  let attempts = 0;
  const maxAttempts = 100;

  do {
    // Generate random 12x12 grid with 30-50% fill rate
    puzzle = Array(GRID_SIZE)
      .fill(null)
      .map(() =>
        Array(GRID_SIZE)
          .fill(false)
          .map(() => Math.random() < 0.4) // 40% fill rate
      );

    // Ensure each row and column has at least one filled cell
    for (let i = 0; i < GRID_SIZE; i++) {
      const rowHasFill = puzzle[i].some((cell) => cell);
      if (!rowHasFill) {
        const randomIndex = Math.floor(Math.random() * GRID_SIZE);
        puzzle[i][randomIndex] = true;
      }
    }

    for (let j = 0; j < GRID_SIZE; j++) {
      const colHasFill = puzzle.some((row) => row[j]);
      if (!colHasFill) {
        const randomIndex = Math.floor(Math.random() * GRID_SIZE);
        puzzle[randomIndex][j] = true;
      }
    }

    // Calculate hints
    rowHints = puzzle.map((row) => calculateHints(row));
    columnHints = Array(GRID_SIZE)
      .fill(null)
      .map((_, j) => calculateHints(puzzle.map((row) => row[j])));

    // Check if we have at least 2 rows with run length >= 6
    const rowsWithLongRun = rowHints.filter((hints) => hints.some((hint) => hint >= 6)).length;
    // Check if we have at least 2 columns with run length >= 6
    const colsWithLongRun = columnHints.filter((hints) => hints.some((hint) => hint >= 6)).length;

    // If we don't have enough long runs, add them
    if (rowsWithLongRun < 2 || colsWithLongRun < 2) {
      // Add runs of 6+ to rows if needed
      let rowsAdded = 0;
      const rowsToAdd = 2 - rowsWithLongRun;
      const availableRows = Array.from({ length: GRID_SIZE }, (_, i) => i)
        .filter((i) => !rowHints[i].some((hint) => hint >= 6))
        .sort(() => Math.random() - 0.5); // Shuffle

      for (let i = 0; i < Math.min(rowsToAdd, availableRows.length) && rowsAdded < rowsToAdd; i++) {
        const rowIndex = availableRows[i];
        // Find a position where we can place a run of 6
        const startPos = Math.floor(Math.random() * (GRID_SIZE - 5));
        // Place 6 consecutive true values
        for (let j = startPos; j < startPos + 6 && j < GRID_SIZE; j++) {
          puzzle[rowIndex][j] = true;
        }
        rowsAdded++;
      }

      // Add runs of 6+ to columns if needed
      let colsAdded = 0;
      const colsToAdd = 2 - colsWithLongRun;
      const availableCols = Array.from({ length: GRID_SIZE }, (_, i) => i)
        .filter((i) => !columnHints[i].some((hint) => hint >= 6))
        .sort(() => Math.random() - 0.5); // Shuffle

      for (let i = 0; i < Math.min(colsToAdd, availableCols.length) && colsAdded < colsToAdd; i++) {
        const colIndex = availableCols[i];
        // Find a position where we can place a run of 6
        const startPos = Math.floor(Math.random() * (GRID_SIZE - 5));
        // Place 6 consecutive true values
        for (let j = startPos; j < startPos + 6 && j < GRID_SIZE; j++) {
          puzzle[j][colIndex] = true;
        }
        colsAdded++;
      }

      // Recalculate hints after adding long runs
      rowHints = puzzle.map((row) => calculateHints(row));
      columnHints = Array(GRID_SIZE)
        .fill(null)
        .map((_, j) => calculateHints(puzzle.map((row) => row[j])));
    }

    attempts++;
    // Continue if we have any empty rows or columns (no hints) OR if puzzle is not unique
  } while (
    attempts < maxAttempts &&
    (rowHints.some((h) => h.length === 0) || 
     columnHints.some((h) => h.length === 0) ||
     !validateGridUniqueness(rowHints, columnHints))
  );

  return { puzzle, rowHints, columnHints };
}

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
  } | null>(null);
  const [finalSeconds, setFinalSeconds] = React.useState(0);
  const [showRules, setShowRules] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragState, setDragState] = React.useState<"green" | "x" | null>(null);
  const [beltIconPositions, setBeltIconPositions] = React.useState<Set<string>>(new Set());
  const [showSolution, setShowSolution] = React.useState(false);
  const [todayPlayCount, setTodayPlayCount] = React.useState<number | null>(null);

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
    const userId = await getCurrentUserId();
    if (userId) {
      await updatePlayCount(userId);
      setTodayPlayCount((prev) => (prev !== null ? prev + 1 : null));
    }
    const { puzzle: newPuzzle, rowHints: newRowHints, columnHints: newColumnHints } = generatePuzzle();
    setPuzzle(newPuzzle);
    setRowHints(newRowHints);
    setColumnHints(newColumnHints);
    setPlayerGrid(
      Array(GRID_SIZE)
        .fill(null)
        .map(() => Array(GRID_SIZE).fill(null))
    );
    
    // Calculate belt icon positions for cells adjacent to both vertical and horizontal run length of 1
    const iconPositions = new Set<string>();
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        // Check if this cell is false (not part of solution)
        if (!newPuzzle[row][col]) {
          // Check if adjacent to a vertical run length of 1
          let adjacentToVerticalRunOfOne = false;
          
          // Check above
          if (row > 0 && newPuzzle[row - 1][col]) {
            // Check if the cell above is part of a run of length 1
            const isRunOfOne = 
              (row - 1 === 0 || !newPuzzle[row - 2][col]) && // No cell above the run, or it's false
              (row === GRID_SIZE - 1 || !newPuzzle[row][col]); // No cell below the run, or it's false (current cell)
            if (isRunOfOne) {
              adjacentToVerticalRunOfOne = true;
            }
          }
          
          // Check below
          if (!adjacentToVerticalRunOfOne && row < GRID_SIZE - 1 && newPuzzle[row + 1][col]) {
            // Check if the cell below is part of a run of length 1
            const isRunOfOne = 
              (row === 0 || !newPuzzle[row - 1][col]) && // No cell above the run, or it's false (current cell)
              (row + 1 === GRID_SIZE - 1 || !newPuzzle[row + 2][col]); // No cell below the run, or it's false
            if (isRunOfOne) {
              adjacentToVerticalRunOfOne = true;
            }
          }
          
          // Check if adjacent to a horizontal run length of 1
          let adjacentToHorizontalRunOfOne = false;
          
          // Check left
          if (col > 0 && newPuzzle[row][col - 1]) {
            // Check if the cell to the left is part of a run of length 1
            const isRunOfOne = 
              (col - 1 === 0 || !newPuzzle[row][col - 2]) && // No cell left of the run, or it's false
              (col === GRID_SIZE - 1 || !newPuzzle[row][col]); // No cell right of the run, or it's false (current cell)
            if (isRunOfOne) {
              adjacentToHorizontalRunOfOne = true;
            }
          }
          
          // Check right
          if (!adjacentToHorizontalRunOfOne && col < GRID_SIZE - 1 && newPuzzle[row][col + 1]) {
            // Check if the cell to the right is part of a run of length 1
            const isRunOfOne = 
              (col === 0 || !newPuzzle[row][col - 1]) && // No cell left of the run, or it's false (current cell)
              (col + 1 === GRID_SIZE - 1 || !newPuzzle[row][col + 2]); // No cell right of the run, or it's false
            if (isRunOfOne) {
              adjacentToHorizontalRunOfOne = true;
            }
          }
          
          // If adjacent to both, place icon
          if (adjacentToVerticalRunOfOne && adjacentToHorizontalRunOfOne) {
            iconPositions.add(`${row}-${col}`);
          }
        }
      }
    }
    setBeltIconPositions(iconPositions);
    
    setTimer(0);
    setIsGameActive(true);
    setIsGameEnding(false);
    setShowCompletionScreen(false);
    setRewardBelt(null);
    setFinalSeconds(0);
    setShowSolution(false);
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
            await addToInventory(userId, belt.id);
            setRewardBelt(belt);
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

      {/* Game board */}
      {isGameActive && (
        <div className="space-y-4">
          {/* Timer and Reveal Button */}
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
                          const hasBeltIcon = beltIconPositions.has(`${rowIndex}-${colIndex}`);
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
                              {!showSolution && hasBeltIcon && cellState === null && (
                                <Image
                                  src="https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/slots/belt.jpg"
                                  alt="Belt hint"
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-contain"
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
