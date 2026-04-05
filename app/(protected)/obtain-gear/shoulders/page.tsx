"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  updatePlayCount,
  getCurrentUserId,
  updateTopScores,
  getRewardRarity,
  getRandomShouldersByRarity,
  addToInventory,
  type ShouldersReward,
} from "@/lib/shoulders-game";
import { checkUserHasItem, addXpToUser, RARITY_XP } from "@/lib/inventory";

import { ENDGAME_REWARD_DELAY_MS } from "@/lib/game-constants";
import { getTodayPlayCountForGear } from "@/lib/playcount";
import { playDiceRollSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { TutorialButton } from "@/components/tutorial/TutorialButton";

const COLUMNS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const CDN_BASE_URL = "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/slots";
const DICE_IMAGES_BASE_URL = "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/bling/dice";

const NUMBERED_DICE_IMAGE_MAP: Record<number, string> = {
  1: "one.png",
  2: "two.png",
  3: "three.png",
  4: "four.png",
  5: "five.png",
  6: "six.png",
};

// Column heights mapping (varying heights like Can't Stop)
const COLUMN_HEIGHTS: Record<number, number> = {
  2: 2,
  3: 4,
  4: 5,
  5: 6,
  6: 7,
  7: 9,
  8: 7,
  9: 6,
  10: 5,
  11: 4,
  12: 2,
};

// Column slot types mapping
const COLUMN_SLOTS: Record<number, string> = {
  2: "boots.jpg",
  3: "leggings.jpg",
  4: "gauntlets.jpg",
  5: "shoulders.jpg",
  6: "chestpiece.jpg",
  7: "helm.jpg",
  8: "belt.jpg",
  9: "shoulders.jpg",
  10: "gauntlets.jpg",
  11: "leggings.jpg",
  12: "boots.jpg",
};

// Required columns for win condition
const REQUIRED_COLUMNS = {
  helm: 7,
  chest: 6,
  belt: 8,
  shoulders: [5, 9],
  gauntlets: [4, 10],
  leggings: [3, 11],
  boots: [2, 12],
};

type CellState = null | "highlighted" | "marked" | "lost";

export default function ShouldersPage() {
  const [isGameActive, setIsGameActive] = React.useState(false);
  const [turnsTaken, setTurnsTaken] = React.useState(0);
  const [dicePairOne, setDicePairOne] = React.useState<number[]>([]);
  const [dicePairTwo, setDicePairTwo] = React.useState<number[]>([]);
  const [gridState, setGridState] = React.useState<CellState[][]>(
    COLUMNS.map((col) => Array(COLUMN_HEIGHTS[col]).fill(null))
  );
  const [highlightedDiceArea, setHighlightedDiceArea] = React.useState<"one" | "two" | "both" | null>(null);
  const [showCompletionScreen, setShowCompletionScreen] = React.useState(false);
  const [rewardItem, setRewardItem] = React.useState<ShouldersReward | null>(null);
  const [rewardXp, setRewardXp] = React.useState<number | null>(null);
  const [finalTurns, setFinalTurns] = React.useState(0);
  const [noPlacementMessage, setNoPlacementMessage] = React.useState("");
  const [isGameEnding, setIsGameEnding] = React.useState(false);
  const [selectedDieForSwap, setSelectedDieForSwap] = React.useState<{ pair: "one" | "two"; index: number } | null>(null);
  const [placeJustClicked, setPlaceJustClicked] = React.useState(false);
  const [rollJustClicked, setRollJustClicked] = React.useState(false);
  const [todayPlayCount, setTodayPlayCount] = React.useState<number | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    let cancelled = false;
    getCurrentUserId().then((userId) => {
      if (!userId || cancelled) return;
      getTodayPlayCountForGear(userId, "Shoulders").then((count) => {
        if (!cancelled) setTodayPlayCount(count);
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Helper function to get column index from dice sum
  const getColumnIndex = (sum: number): number | null => {
    const index = COLUMNS.indexOf(sum);
    return index >= 0 ? index : null;
  };

  // Helper function to check if column top cell is marked or highlighted
  // Top cell is at index 0 (first element, rendered at top)
  const isColumnTopMarkedOrHighlighted = (columnIndex: number): boolean => {
    if (columnIndex < 0 || columnIndex >= COLUMNS.length) return false;
    const topCell = gridState[columnIndex][0]; // Index 0 is the top cell
    return topCell === "marked" || topCell === "highlighted";
  };

  // Helper function to count highlighted column icons
  const countHighlightedColumns = (): number => {
    let count = 0;
    for (let col = 0; col < COLUMNS.length; col++) {
      const hasHighlighted = gridState[col].some((cell) => cell === "highlighted");
      if (hasHighlighted) count++;
    }
    return count;
  };

  // Helper function to find lowest unfilled cell in column
  // "Lowermost" means the cell closest to the bottom, which is the last index in the array
  const findLowestUnfilledCell = (columnIndex: number): number | null => {
    if (columnIndex < 0 || columnIndex >= COLUMNS.length) return null;
    const columnValue = COLUMNS[columnIndex];
    const columnHeight = COLUMN_HEIGHTS[columnValue];
    // Search from the end (bottom) backwards to find the lowermost unfilled cell
    for (let row = columnHeight - 1; row >= 0; row--) {
      if (gridState[columnIndex][row] === null) {
        return row;
      }
    }
    return null; // Column is full
  };

  // Handle dice roll - first 2 dice go to Dice Pair One, last 2 to Dice Pair Two
  const handleRoll = () => {
    if (rollJustClicked) return;
    playDiceRollSound();
    setRollJustClicked(true);
    const newDice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
    setDicePairOne([newDice[0], newDice[1]]);
    setDicePairTwo([newDice[2], newDice[3]]);
    setHighlightedDiceArea(null);
    setSelectedDieForSwap(null);
    setNoPlacementMessage("");
    setPlaceJustClicked(false);
  };

  // Handle die click for swap: select one die from each pair to swap them
  const handleDieClick = (pair: "one" | "two", index: number) => {
    if (placeJustClicked) return;
    const other: "one" | "two" = pair === "one" ? "two" : "one";
    if (selectedDieForSwap && selectedDieForSwap.pair === other) {
      const val1 = pair === "one" ? dicePairOne[index] : dicePairTwo[index];
      const val2 = pair === "one" ? dicePairTwo[selectedDieForSwap.index] : dicePairOne[selectedDieForSwap.index];
      if (pair === "one") {
        setDicePairOne((prev) => {
          const next = [...prev];
          next[index] = val2;
          return next;
        });
        setDicePairTwo((prev) => {
          const next = [...prev];
          next[selectedDieForSwap!.index] = val1;
          return next;
        });
      } else {
        setDicePairOne((prev) => {
          const next = [...prev];
          next[selectedDieForSwap!.index] = val1;
          return next;
        });
        setDicePairTwo((prev) => {
          const next = [...prev];
          next[index] = val2;
          return next;
        });
      }
      setSelectedDieForSwap(null);
      setHighlightedDiceArea(null);
      setNoPlacementMessage("");
    } else {
      setSelectedDieForSwap({ pair, index });
    }
  };

  // Helper function to check if column has any highlighted cells
  const hasColumnHighlighted = (columnIndex: number): boolean => {
    if (columnIndex < 0 || columnIndex >= COLUMNS.length) return false;
    return gridState[columnIndex].some((cell) => cell === "highlighted");
  };

  // Update highlighting when dice change
  React.useEffect(() => {
    // Don't update highlighting if Place was just clicked (waiting for next roll)
    if (placeJustClicked) {
      return;
    }
    
    if (dicePairOne.length !== 2 || dicePairTwo.length !== 2) {
      setHighlightedDiceArea(null);
      return;
    }

    const diceSum1 = dicePairOne[0] + dicePairOne[1];
    const diceSum2 = dicePairTwo[0] + dicePairTwo[1];
    const colIndex1 = getColumnIndex(diceSum1);
    const colIndex2 = getColumnIndex(diceSum2);

    // Step (a): Check if column for dice_sum_1 has not had uppermost cell marked/highlighted
    const canHighlight1 = colIndex1 !== null && !isColumnTopMarkedOrHighlighted(colIndex1);
    
    // Step (b): Check if column for dice_sum_2 has not had uppermost cell marked/highlighted
    const canHighlight2 = colIndex2 !== null && !isColumnTopMarkedOrHighlighted(colIndex2);

    // Step (c): Count highlighted column icons
    const highlightedCount = countHighlightedColumns();

    // Determine highlighting based on rules
    if (highlightedCount === 0 || highlightedCount === 1) {
      // Activate Place button - highlight areas that can be highlighted
      if (canHighlight1 && canHighlight2) {
        // Both can be highlighted - highlight both areas
        setHighlightedDiceArea("both");
      } else if (canHighlight1) {
        setHighlightedDiceArea("one");
      } else if (canHighlight2) {
        setHighlightedDiceArea("two");
      } else {
        setHighlightedDiceArea(null);
      }
    } else if (highlightedCount === 3) {
      // If column for dice_sum_1 has highlighted icon, highlight Dice Pair One area and activate Place
      // If column for dice_sum_2 has highlighted icon, highlight Dice Pair Two area and activate Place
      // Both can be highlighted simultaneously
      const highlight1 = colIndex1 !== null && hasColumnHighlighted(colIndex1);
      const highlight2 = colIndex2 !== null && hasColumnHighlighted(colIndex2);
      
      if (highlight1 && highlight2) {
        setHighlightedDiceArea("both");
      } else if (highlight1) {
        setHighlightedDiceArea("one");
      } else if (highlight2) {
        setHighlightedDiceArea("two");
      } else {
        setHighlightedDiceArea(null);
      }
    } else if (highlightedCount === 2) {
      // If column for dice_sum_1 has highlighted icon, highlight Dice Pair One area and activate Place
      // If column for dice_sum_2 has highlighted icon, highlight Dice Pair Two area and activate Place
      // Both can be highlighted simultaneously
      const highlight1 = colIndex1 !== null && hasColumnHighlighted(colIndex1);
      const highlight2 = colIndex2 !== null && hasColumnHighlighted(colIndex2);
      
      // Check if columns have at least one unfilled/unhighlighted cell
      const col1HasUnfilledCell = colIndex1 !== null && findLowestUnfilledCell(colIndex1) !== null;
      const col2HasUnfilledCell = colIndex2 !== null && findLowestUnfilledCell(colIndex2) !== null;
      
      if (highlight1 && highlight2) {
        // Both columns are highlighted - highlight both dice areas
        setHighlightedDiceArea("both");
      } else if (highlight1) {
        // Dice Pair One matches a highlighted column
        // Check if Dice Pair Two column has at least one unfilled cell
        if (col2HasUnfilledCell) {
          setHighlightedDiceArea("both");
        } else {
          setHighlightedDiceArea("one");
        }
      } else if (highlight2) {
        // Dice Pair Two matches a highlighted column
        // Check if Dice Pair One column has at least one unfilled cell
        if (col1HasUnfilledCell) {
          setHighlightedDiceArea("both");
        } else {
          setHighlightedDiceArea("two");
        }
      } else {
        // If both sums are equal, no need to select - highlight both; placement will fill two cells in shared column
        if (diceSum1 === diceSum2 && col1HasUnfilledCell) {
          setHighlightedDiceArea("both");
        } else {
          // Place button inactive - player must click to select
          setHighlightedDiceArea(null);
        }
      }
    } else {
      setHighlightedDiceArea(null);
    }
  }, [dicePairOne, dicePairTwo, gridState, placeJustClicked]);

  // Handle Place button
  const handlePlace = () => {
    if (!highlightedDiceArea || dicePairOne.length !== 2 || dicePairTwo.length !== 2 || placeJustClicked) return;

    // Immediately disable Place button to prevent multiple clicks
    setPlaceJustClicked(true);

    if (highlightedDiceArea === "both") {
      // Highlight cells in both columns (or two cells in same column if sums are equal)
      const diceSum1 = dicePairOne[0] + dicePairOne[1];
      const diceSum2 = dicePairTwo[0] + dicePairTwo[1];
      const columnIndex1 = getColumnIndex(diceSum1);
      const columnIndex2 = getColumnIndex(diceSum2);

      if (diceSum1 === diceSum2 && columnIndex1 !== null) {
        // Same column - mark two cells if available
        const cellIndex1 = findLowestUnfilledCell(columnIndex1);
        
        if (cellIndex1 === null) {
          // No allowed placement - show error and change highlights to lost
          setNoPlacementMessage("No allowed placements. You must end your turn");
          setGridState((prev) =>
            prev.map((column) =>
              column.map((cell) => (cell === "highlighted" ? "lost" : cell))
            )
          );
        } else {
          // Mark first cell, then find and mark second cell
          setGridState((prev) => {
            const newState = prev.map((col) => [...col]);
            newState[columnIndex1][cellIndex1] = "highlighted";
            
            // Find second unfilled cell by checking the newState array
            const columnValue = COLUMNS[columnIndex1];
            const columnHeight = COLUMN_HEIGHTS[columnValue];
            let cellIndex2: number | null = null;
            for (let row = columnHeight - 1; row >= 0; row--) {
              if (newState[columnIndex1][row] === null) {
                cellIndex2 = row;
                break;
              }
            }
            
            if (cellIndex2 !== null) {
              newState[columnIndex1][cellIndex2] = "highlighted";
            }
            
            return newState;
          });
        }
      } else {
        // Different columns - mark one cell in each
        const cellIndex1 = columnIndex1 !== null ? findLowestUnfilledCell(columnIndex1) : null;
        const cellIndex2 = columnIndex2 !== null ? findLowestUnfilledCell(columnIndex2) : null;
        const anyPlaced = cellIndex1 !== null || cellIndex2 !== null;

        if (!anyPlaced) {
          // No allowed placement - show error and change highlights to lost
          setNoPlacementMessage("No allowed placements. You must end your turn");
          setGridState((prev) =>
            prev.map((column) =>
              column.map((cell) => (cell === "highlighted" ? "lost" : cell))
            )
          );
        } else {
          // Highlight cells in both columns
          setGridState((prev) => {
            const newState = prev.map((col) => [...col]);
            
            // Place in first column
            if (columnIndex1 !== null && cellIndex1 !== null) {
              newState[columnIndex1][cellIndex1] = "highlighted";
            }
            
            // Place in second column
            if (columnIndex2 !== null && cellIndex2 !== null) {
              newState[columnIndex2][cellIndex2] = "highlighted";
            }
            
            return newState;
          });
        }
      }
    } else {
      // Highlight cell in single column
      const diceSum = highlightedDiceArea === "one" 
        ? dicePairOne[0] + dicePairOne[1]
        : dicePairTwo[0] + dicePairTwo[1];
      
      const columnIndex = getColumnIndex(diceSum);
      if (columnIndex === null) {
        setPlaceJustClicked(false);
        setHighlightedDiceArea(null); // Clear highlighting even on error
        return;
      }

      const cellIndex = findLowestUnfilledCell(columnIndex);
      
      if (cellIndex === null) {
        // No allowed placement - show error and change highlights to lost
        setNoPlacementMessage("No allowed placements. You must end your turn");
        setGridState((prev) =>
          prev.map((column) =>
            column.map((cell) => (cell === "highlighted" ? "lost" : cell))
          )
        );
      } else {
        // Highlight the cell
        setGridState((prev) => {
          const newState = prev.map((col) => [...col]);
          newState[columnIndex][cellIndex] = "highlighted";
          return newState;
        });
      }
    }

    // Clear dice area highlights and swap selection
    setHighlightedDiceArea(null);
    setSelectedDieForSwap(null);
    setNoPlacementMessage("");
    setRollJustClicked(false);
  };

  // Handle clicking dice area to select (for 2 highlighted columns case) - only after roll, before place
  const handleDiceAreaClick = (area: "one" | "two") => {
    if (placeJustClicked) return; // After placing, ignore clicks until they roll again
    if (dicePairOne.length !== 2 || dicePairTwo.length !== 2) return;
    
    const highlightedCount = countHighlightedColumns();
    if (highlightedCount === 2 && !highlightedDiceArea) {
      // Only allow selection if Place button is inactive and we have 2 highlighted columns
      // Set the clicked area as highlighted - only one area can be highlighted at once
      setHighlightedDiceArea(area);
    }
  };

  // Handle End Turn button
  const handleEndTurn = () => {
    // If player did not click Place this turn, clear any green cells to empty and end turn
    if (!placeJustClicked) {
      setGridState((prev) =>
        prev.map((column) =>
          column.map((cell) => (cell === "highlighted" ? null : cell === "lost" ? null : cell))
        )
      );

      setTurnsTaken((prev) => prev + 1);
      setDicePairOne([]);
      setDicePairTwo([]);
      setHighlightedDiceArea(null);
      setSelectedDieForSwap(null);
      setNoPlacementMessage("");
      setPlaceJustClicked(false);
      setRollJustClicked(false);
      return;
    }

    // Player placed this turn: convert green highlights to marked (commit placements)
    setGridState((prev) =>
      prev.map((column) =>
        column.map((cell) => (cell === "highlighted" ? "marked" : cell === "lost" ? null : cell))
      )
    );

    // Check win condition - check topmost cell of each required column
    // Top cell is at index 0 (first element in array)
    // Check for "highlighted" or "marked" since highlighted cells will become marked
    const helmColIndex = COLUMNS.indexOf(REQUIRED_COLUMNS.helm);
    const helmMarked = helmColIndex >= 0 && (gridState[helmColIndex][0] === "marked" || gridState[helmColIndex][0] === "highlighted");
    
    const chestColIndex = COLUMNS.indexOf(REQUIRED_COLUMNS.chest);
    const chestMarked = chestColIndex >= 0 && (gridState[chestColIndex][0] === "marked" || gridState[chestColIndex][0] === "highlighted");
    
    const beltColIndex = COLUMNS.indexOf(REQUIRED_COLUMNS.belt);
    const beltMarked = beltColIndex >= 0 && (gridState[beltColIndex][0] === "marked" || gridState[beltColIndex][0] === "highlighted");
    
    const shouldersMarked = REQUIRED_COLUMNS.shoulders.some(
      (col) => {
        const colIndex = COLUMNS.indexOf(col);
        return colIndex >= 0 && (gridState[colIndex][0] === "marked" || gridState[colIndex][0] === "highlighted");
      }
    );
    const gauntletsMarked = REQUIRED_COLUMNS.gauntlets.some(
      (col) => {
        const colIndex = COLUMNS.indexOf(col);
        return colIndex >= 0 && (gridState[colIndex][0] === "marked" || gridState[colIndex][0] === "highlighted");
      }
    );
    const leggingsMarked = REQUIRED_COLUMNS.leggings.some(
      (col) => {
        const colIndex = COLUMNS.indexOf(col);
        return colIndex >= 0 && (gridState[colIndex][0] === "marked" || gridState[colIndex][0] === "highlighted");
      }
    );
    const bootsMarked = REQUIRED_COLUMNS.boots.some(
      (col) => {
        const colIndex = COLUMNS.indexOf(col);
        return colIndex >= 0 && (gridState[colIndex][0] === "marked" || gridState[colIndex][0] === "highlighted");
      }
    );

    if (helmMarked && chestMarked && beltMarked && shouldersMarked && gauntletsMarked && leggingsMarked && bootsMarked) {
      handleGameEnd();
    } else {
      // Increment turns and reset for next turn
      setTurnsTaken((prev) => prev + 1);
      setDicePairOne([]);
      setDicePairTwo([]);
      setHighlightedDiceArea(null);
      setSelectedDieForSwap(null);
      setNoPlacementMessage("");
      setPlaceJustClicked(false);
      setRollJustClicked(false);
    }
  };

  // Handle game end
  const handleGameEnd = async () => {
    setIsGameEnding(true);
    const finalTurnsValue = turnsTaken;
    setFinalTurns(finalTurnsValue);

    // Pause for 2 seconds
    await new Promise((resolve) => setTimeout(resolve, ENDGAME_REWARD_DELAY_MS));

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        console.error("No user ID found when processing game end");
        setIsGameActive(false);
        setShowCompletionScreen(true);
        return;
      }

      // Update top scores
      await updateTopScores(userId, finalTurnsValue);

      // Get reward based on turns
      const rarity = await getRewardRarity(finalTurnsValue);
      
      if (rarity) {
        const item = await getRandomShouldersByRarity(rarity);
        
        if (item) {
          const alreadyHas = await checkUserHasItem(userId, item.id);
          if (alreadyHas) {
            const xpVal = RARITY_XP[item.rarity] ?? RARITY_XP.Base ?? 1;
            await addXpToUser(userId, xpVal);
            setRewardXp(xpVal);
            setRewardItem(null);
          } else {
            await addToInventory(userId, item.id);
            setRewardItem(item);
            setRewardXp(null);
          }
        }
      }
    } catch (error) {
      console.error("Failed to process game end:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
    }

    // Show completion screen
    setIsGameActive(false);
    setShowCompletionScreen(true);
  };

  // Handle Play Game button
  const handlePlayGame = async () => {
    const userId = await getCurrentUserId();
    if (userId) {
      await updatePlayCount(userId);
      setTodayPlayCount((prev) => (prev !== null ? prev + 1 : null));
    }
    setIsGameActive(true);
    setTurnsTaken(0);
    setDicePairOne([]);
    setDicePairTwo([]);
    setGridState(COLUMNS.map((col) => Array(COLUMN_HEIGHTS[col]).fill(null)));
    setHighlightedDiceArea(null);
    setSelectedDieForSwap(null);
    setShowCompletionScreen(false);
    setRewardItem(null);
    setRewardXp(null);
    setFinalTurns(0);
    setNoPlacementMessage("");
    setIsGameEnding(false);
    setPlaceJustClicked(false);
    setRollJustClicked(false);
  };

  // Check if Place button should be enabled
  const isPlaceEnabled = React.useMemo(() => {
    if (placeJustClicked) return false; // Disable if Place was just clicked
    if (dicePairOne.length !== 2 || dicePairTwo.length !== 2) return false;
    if (!highlightedDiceArea) return false;
    
    const highlightedCount = countHighlightedColumns();
    // Place button is enabled when:
    // - 0 or 1 highlighted columns: always enabled if area is highlighted
    // - 2 highlighted columns: enabled if area is highlighted (or after click selection)
    // - 3 highlighted columns: enabled if area is highlighted
    return highlightedDiceArea !== null;
  }, [dicePairOne, dicePairTwo, highlightedDiceArea, gridState, placeJustClicked]);

  // Show "Select which set of dice to place." only after roll and before place (2 highlighted columns, no selection yet)
  const showSelectDiceMessage = React.useMemo(() => {
    if (placeJustClicked) return false; // After placing, don't show until they roll again
    if (dicePairOne.length !== 2 || dicePairTwo.length !== 2) return false;
    if (highlightedDiceArea !== null) return false;
    return countHighlightedColumns() === 2;
  }, [placeJustClicked, dicePairOne, dicePairTwo, highlightedDiceArea, gridState]);

  const gearCompletion = React.useMemo(() => {
    const helmCol = COLUMNS.indexOf(REQUIRED_COLUMNS.helm);
    const chestCol = COLUMNS.indexOf(REQUIRED_COLUMNS.chest);
    const beltCol = COLUMNS.indexOf(REQUIRED_COLUMNS.belt);
    return {
      helm: isColumnTopMarkedOrHighlighted(helmCol),
      chestpiece: isColumnTopMarkedOrHighlighted(chestCol),
      belt: isColumnTopMarkedOrHighlighted(beltCol),
      shoulders: REQUIRED_COLUMNS.shoulders.some((col) => isColumnTopMarkedOrHighlighted(COLUMNS.indexOf(col))),
      gauntlets: REQUIRED_COLUMNS.gauntlets.some((col) => isColumnTopMarkedOrHighlighted(COLUMNS.indexOf(col))),
      leggings: REQUIRED_COLUMNS.leggings.some((col) => isColumnTopMarkedOrHighlighted(COLUMNS.indexOf(col))),
      boots: REQUIRED_COLUMNS.boots.some((col) => isColumnTopMarkedOrHighlighted(COLUMNS.indexOf(col))),
    };
  }, [gridState]);

  React.useEffect(() => {
    if (showCompletionScreen && (rewardItem || rewardXp !== null)) {
      const audio = new Audio("https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/sounds/tada.mp3");
      audio.play().catch(() => {});
    }
  }, [showCompletionScreen, rewardItem, rewardXp]);

  // Show completion screen
  if (showCompletionScreen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-page p-6">
        <div className="max-w-md w-full game-panel-bg rounded-lg shadow-lg p-8 text-center space-y-4">
          <h2 className="text-3xl font-bold">Game Complete!</h2>
          <p className="text-lg">Congratulations! You have completed the game.</p>
          <div className="text-2xl font-bold">Turns Taken: {finalTurns}</div>
          {rewardItem && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">You have been rewarded with:</p>
              <p className="text-xl font-semibold text-primary mb-3">{rewardItem.name}</p>
              {rewardItem.image_url && (
                <div className="flex justify-center">
                  <Image
                    src={rewardItem.image_url}
                    alt={rewardItem.name}
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

  return (
    <div className="space-y-6 p-6 min-h-screen bg-page">
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
        <TutorialButton tutorialId="shoulders" variant="outline" />
      </div>

      {/* Game area */}
      {isGameActive && (
        <div className="space-y-4">
          {/* Turns Taken counter */}
          <div className="text-2xl font-bold text-center">
            Turns Taken: {turnsTaken}
          </div>

          {/* Buttons and Dice areas */}
          <div className="game-panel-bg p-4 rounded-lg shadow-lg game-interactive">
            <div className="flex flex-col md:flex-row flex-wrap gap-4 justify-center items-start">
              {/* Buttons - fixed width so location stays consistent */}
              <div className="flex flex-col gap-2 items-center justify-center w-[140px] min-w-[140px] shrink-0">
                <Button
                  onClick={handleRoll}
                  disabled={rollJustClicked || isGameEnding}
                  className="w-full min-w-[120px]"
                >
                  Roll
                </Button>
                <Button
                  onClick={handlePlace}
                  disabled={!isPlaceEnabled || isGameEnding}
                  className="w-full min-w-[120px]"
                >
                  Place
                </Button>
                <div className="flex flex-col items-center gap-2 w-full">
                  <Button
                    onClick={handleEndTurn}
                    disabled={isGameEnding}
                    className="w-full min-w-[120px]"
                  >
                    End Turn
                  </Button>
                  {noPlacementMessage && (
                    <span className="text-red-600 font-semibold text-sm text-center">{noPlacementMessage}</span>
                  )}
                  {showSelectDiceMessage && (
                    <span className="font-bold text-sm text-center">Select which set of dice to place.</span>
                  )}
                </div>
              </div>

              {/* Dice Pair One area - fixed width */}
              <div
                className={cn(
                  "border-2 rounded-lg p-4 w-[280px] min-w-[280px] h-[120px] flex flex-col items-center justify-center cursor-pointer shrink-0",
                  (highlightedDiceArea === "one" || highlightedDiceArea === "both") && "bg-[rgb(55,150,75)] border-[rgb(45,130,65)]",
                  highlightedDiceArea !== "one" && highlightedDiceArea !== "both" && "border-game-board-border-muted bg-game-board-panel-muted"
                )}
                onClick={() => handleDiceAreaClick("one")}
              >
                <div className="w-full text-center font-semibold mb-2 opacity-50">Dice Pair One</div>
                <div className="flex flex-nowrap gap-1 justify-center items-center">
                  {dicePairOne.map((die, index) => (
                    <div
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDieClick("one", index);
                      }}
                      className={cn(
                        "flex items-center justify-center overflow-hidden cursor-pointer rounded",
                        selectedDieForSwap?.pair === "one" && selectedDieForSwap?.index === index && "ring-2 ring-blue-500"
                      )}
                    >
                      <Image
                        src={`${DICE_IMAGES_BASE_URL}/${NUMBERED_DICE_IMAGE_MAP[die]}`}
                        alt={`${die}`}
                        width={64}
                        height={64}
                        className="object-contain w-16 h-16"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
                {dicePairOne.length === 2 && (
                  <div className="w-full text-center text-sm mt-2">
                    Sum: {dicePairOne[0] + dicePairOne[1]}
                  </div>
                )}
              </div>

              {/* Dice Pair Two area - fixed width */}
              <div
                className={cn(
                  "border-2 rounded-lg p-4 w-[280px] min-w-[280px] h-[120px] flex flex-col items-center justify-center cursor-pointer shrink-0",
                  (highlightedDiceArea === "two" || highlightedDiceArea === "both") && "bg-[rgb(55,150,75)] border-[rgb(45,130,65)]",
                  highlightedDiceArea !== "two" && highlightedDiceArea !== "both" && "border-game-board-border-muted bg-game-board-panel-muted"
                )}
                onClick={() => handleDiceAreaClick("two")}
              >
                <div className="w-full text-center font-semibold mb-2 opacity-50">Dice Pair Two</div>
                <div className="flex flex-nowrap gap-1 justify-center items-center">
                  {dicePairTwo.map((die, index) => (
                    <div
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDieClick("two", index);
                      }}
                      className={cn(
                        "flex items-center justify-center overflow-hidden cursor-pointer rounded",
                        selectedDieForSwap?.pair === "two" && selectedDieForSwap?.index === index && "ring-2 ring-blue-500"
                      )}
                    >
                      <Image
                        src={`${DICE_IMAGES_BASE_URL}/${NUMBERED_DICE_IMAGE_MAP[die]}`}
                        alt={`${die}`}
                        width={64}
                        height={64}
                        className="object-contain w-16 h-16"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
                {dicePairTwo.length === 2 && (
                  <div className="w-full text-center text-sm mt-2">
                    Sum: {dicePairTwo[0] + dicePairTwo[1]}
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center w-full shrink-0 basis-full">Select one of each dice pair to swap</p>
          </div>

          {/* Grid + checklist: grid centered in left half, gear list centered in right half */}
          <div className="game-panel-bg p-4 rounded-lg shadow-lg flex min-h-[400px] overflow-x-auto game-interactive">
            <div className="w-1/2 flex justify-center items-center min-w-0">
              <div className="flex gap-2 justify-center min-w-max">
              {COLUMNS.map((columnValue, colIndex) => {
                const maxHeight = Math.max(...COLUMNS.map(col => COLUMN_HEIGHTS[col]));
                const columnHeight = COLUMN_HEIGHTS[columnValue];
                const spacerHeight = maxHeight - columnHeight;
                const layoutOffset =
                  columnValue === 2 || columnValue === 12 ? -1 : columnValue === 7 ? 1 : 0;
                const visualSpacerHeight = Math.max(0, spacerHeight + layoutOffset);
                return (
                  <div key={columnValue} className="flex flex-col items-center relative">
                    {/* Column label - positioned just above top cell */}
                    <div 
                      className={cn(
                        "text-lg font-bold absolute left-1/2 -translate-x-1/2 z-10",
                        gridState[colIndex].some(cell => cell === "highlighted") 
                          ? "text-green-600" 
                          : "text-black"
                      )}
                      style={{ top: `${visualSpacerHeight * 42 - 24}px` }}
                    >
                      {columnValue}
                    </div>
                    
                    {/* Grid cells container - cells aligned at bottom */}
                    <div className="flex flex-col gap-1 relative" style={{ height: `${(maxHeight + layoutOffset) * 42}px` }}>
                      {/* Spacer to push cells to bottom */}
                      {visualSpacerHeight > 0 && (
                        <div style={{ height: `${visualSpacerHeight * 42}px` }} />
                      )}
                      
                      {/* Cells rendered top to bottom (normal order: index 0 at top, last index at bottom) */}
                      {Array.from({ length: columnHeight }, (_, rowIndex) => {
                        const cellState = gridState[colIndex][rowIndex];
                        return (
                          <div
                            key={rowIndex}
                            className={cn(
                              "w-10 h-10 border-2 border-game-board-border-muted flex items-center justify-center",
                              cellState === "marked" && "bg-black",
                              cellState === "highlighted" && "bg-[rgb(55,150,75)]",
                              cellState === "lost" && "bg-red-500",
                              cellState === null && "game-panel-bg"
                            )}
                          />
                        );
                      })}
                    </div>

                    {/* Slot icon - positioned directly below bottom cell */}
                    <div className={cn(
                      "mt-1 w-10 h-10 flex items-center justify-center rounded border-2 transition-colors",
                      gridState[colIndex].some(cell => cell === "highlighted") 
                        ? "bg-[rgb(55,150,75)] border-[rgb(45,130,65)]" 
                        : "border-transparent"
                    )}>
                      <Image
                        src={`${CDN_BASE_URL}/${COLUMN_SLOTS[columnValue]}`}
                        alt={COLUMN_SLOTS[columnValue]}
                        width={40}
                        height={40}
                        className="w-full h-full object-contain"
                        unoptimized
                      />
                    </div>
                  </div>
                );
              })}
              </div>
            </div>

            {/* Gear completion checklist - right half, centered */}
            <div className="w-1/2 flex justify-center items-center min-w-0">
              <div className="flex flex-col gap-1.5 shrink-0 border border-game-board-border-muted rounded-lg p-3 bg-game-board-panel-muted">
              {[
                { key: "helm", label: "Helm", done: gearCompletion.helm },
                { key: "chestpiece", label: "Chestpiece", done: gearCompletion.chestpiece },
                { key: "belt", label: "Belt", done: gearCompletion.belt },
                { key: "shoulders", label: "Shoulders", done: gearCompletion.shoulders },
                { key: "gauntlets", label: "Gauntlets", done: gearCompletion.gauntlets },
                { key: "leggings", label: "Leggings", done: gearCompletion.leggings },
                { key: "boots", label: "Boots", done: gearCompletion.boots },
              ].map(({ key, label, done }) => (
                <div key={key} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-6 h-6 border-2 flex items-center justify-center shrink-0 rounded",
                      done ? "bg-green-600 border-green-700 text-white" : "border-game-board-border-muted game-panel-bg"
                    )}
                  >
                    {done && <Check className="w-4 h-4" strokeWidth={3} />}
                  </div>
                  <span className="text-sm font-medium text-white">{label}</span>
                </div>
              ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
