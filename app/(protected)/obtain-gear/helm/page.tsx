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
  getRandomHelmByRarity,
  addToInventory,
} from "@/lib/helm-game";
import { cn } from "@/lib/utils";
import Image from "next/image";

const SLOT_ORDER = ["Helm", "Chest", "Gauntlets", "Leggings", "Boots", "Weapon"] as const;
type SlotName = typeof SLOT_ORDER[number];

const SLOT_IMAGE_MAP: Record<SlotName, string> = {
  Helm: "helm_face.jpg",
  Chest: "chest_face.jpg",
  Gauntlets: "gauntlets_face.png",
  Leggings: "leggings_face.png",
  Boots: "boots_face.png",
  Weapon: "weapon_face.jpg",
};

const CDN_BASE_URL = "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/helm_game";

const ENCUMBERANCE_VALUE = -10;
const INITIAL_STRIKES = 10;
const INITIAL_ROWS_PER_COLUMN = 10;

interface DiceRoll {
  numbered: [number, number]; // 2 numbered dice (1-6)
  slot: [SlotName, SlotName]; // 2 slot dice
}

export default function HelmPage() {
  const [isGameActive, setIsGameActive] = React.useState(false);
  const [strength, setStrength] = React.useState(0);
  const [encumberance, setEncumberance] = React.useState(0);
  const [totalScore, setTotalScore] = React.useState(0);
  const [strikesRemaining, setStrikesRemaining] = React.useState(INITIAL_STRIKES);
  const [grid, setGrid] = React.useState<(number | null)[][]>(
    Array(6).fill(null).map(() => Array(INITIAL_ROWS_PER_COLUMN).fill(null))
  );
  const [diceRoll, setDiceRoll] = React.useState<DiceRoll | null>(null);
  const [selectedNumberedDieIndex, setSelectedNumberedDieIndex] = React.useState<number | null>(null);
  const [selectedSlotDieIndex, setSelectedSlotDieIndex] = React.useState<number | null>(null);
  const [diceRotations, setDiceRotations] = React.useState<[number, number, number, number]>([0, 0, 0, 0]);
  const [showRules, setShowRules] = React.useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = React.useState(false);
  const [rewardHelm, setRewardHelm] = React.useState<{ id: string; name: string; image_url: string | null } | null>(null);
  const [finalScore, setFinalScore] = React.useState(0);

  // Calculate total score whenever strength or encumberance changes
  React.useEffect(() => {
    setTotalScore(strength + encumberance);
  }, [strength, encumberance]);

  const rollDice = () => {
    const numbered1 = Math.floor(Math.random() * 6) + 1;
    const numbered2 = Math.floor(Math.random() * 6) + 1;
    const slot1 = SLOT_ORDER[Math.floor(Math.random() * 6)];
    const slot2 = SLOT_ORDER[Math.floor(Math.random() * 6)];

    // Generate random rotations between -40 and 40 degrees for each die
    const rotation1 = Math.random() * 80 - 40; // -40 to 40
    const rotation2 = Math.random() * 80 - 40;
    const rotation3 = Math.random() * 80 - 40;
    const rotation4 = Math.random() * 80 - 40;

    setDiceRoll({
      numbered: [numbered1, numbered2],
      slot: [slot1, slot2],
    });
    setDiceRotations([rotation1, rotation2, rotation3, rotation4]);
    setSelectedNumberedDieIndex(null);
    setSelectedSlotDieIndex(null);
  };

  const handlePlayGame = () => {
    setIsGameActive(true);
    setStrength(0);
    setEncumberance(0);
    setTotalScore(0);
    setFinalScore(0);
    setStrikesRemaining(INITIAL_STRIKES);
    setGrid(Array(6).fill(null).map(() => Array(INITIAL_ROWS_PER_COLUMN).fill(null)));
    setDiceRoll(null);
    setDiceRotations([0, 0, 0, 0]);
    setSelectedNumberedDieIndex(null);
    setSelectedSlotDieIndex(null);
    setShowCompletionScreen(false);
    setRewardHelm(null);
  };

  const getColumnIndex = (slot: SlotName): number => {
    return SLOT_ORDER.indexOf(slot);
  };

  const findLowestAvailableCell = (columnIndex: number): number | null => {
    const column = grid[columnIndex];
    // Find the lowest (highest index) null cell
    for (let i = column.length - 1; i >= 0; i--) {
      if (column[i] === null) {
        return i;
      }
    }
    return null;
  };

  const getHighestValueInColumn = (columnIndex: number): number => {
    const column = grid[columnIndex];
    let max = -1;
    for (const value of column) {
      if (value !== null && value > max) {
        max = value;
      }
    }
    return max === -1 ? 0 : max;
  };

  const hasValueInColumn = (columnIndex: number): boolean => {
    return grid[columnIndex].some((value) => value !== null);
  };

  const handlePlaceValue = () => {
    if (selectedNumberedDieIndex === null || selectedSlotDieIndex === null || !diceRoll) {
      return;
    }

    const selectedValue = diceRoll.numbered[selectedNumberedDieIndex];
    const selectedSlot = diceRoll.slot[selectedSlotDieIndex];
    const columnIndex = getColumnIndex(selectedSlot);
    const lowestCell = findLowestAvailableCell(columnIndex);
    
    if (lowestCell === null) {
      return; // No available cells
    }

    const highestValue = getHighestValueInColumn(columnIndex);
    if (selectedValue < highestValue) {
      return; // Value too low
    }

    // Check if this is the first value in the column (before updating)
    const isFirstValueInColumn = !hasValueInColumn(columnIndex);

    // Place the value
    const newGrid = grid.map((col, colIdx) => {
      if (colIdx === columnIndex) {
        const newCol = [...col];
        newCol[lowestCell] = selectedValue;
        
        // If we placed in the top row (index 0), add a new row at the top
        if (lowestCell === 0) {
          newCol.unshift(null);
        }
        
        return newCol;
      }
      return col;
    });

    setGrid(newGrid);
    
    // Update strength
    setStrength((prev) => prev + selectedValue);

    // Update encumberance if this is the first value in the column
    if (isFirstValueInColumn) {
      setEncumberance((prev) => prev + ENCUMBERANCE_VALUE);
    }

    // Clear selections and dice
    setSelectedNumberedDieIndex(null);
    setSelectedSlotDieIndex(null);
    setDiceRoll(null);
  };

  const canPlaceAnyValue = (): boolean => {
    if (!diceRoll) return false;
    
    for (const slot of diceRoll.slot) {
      const columnIndex = getColumnIndex(slot);
      const lowestCell = findLowestAvailableCell(columnIndex);
      
      if (lowestCell === null) continue; // Column full
      
      const highestValue = getHighestValueInColumn(columnIndex);
      
      // Check if any numbered die can be placed
      for (const numberedValue of diceRoll.numbered) {
        if (numberedValue >= highestValue) {
          return true;
        }
      }
    }
    
    return false;
  };

  const handleStrike = async () => {
    const newStrikes = strikesRemaining - 1;
    setStrikesRemaining(newStrikes);
    setSelectedNumberedDieIndex(null);
    setSelectedSlotDieIndex(null);
    setDiceRoll(null);

    if (newStrikes === 0) {
      await handleGameEnd();
    }
  };

  const handleGameEnd = async () => {
    // Calculate final score from current state
    const score = strength + encumberance;
    setFinalScore(score);

    // Wait 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const userId = await getCurrentUserId();
      if (userId) {
        // Update play count
        await updatePlayCount(userId);

        // Update top scores
        await updateTopScores(userId, score);

        // Get reward based on score
        const rarity = await getRewardRarity(score);
        if (rarity) {
          const helm = await getRandomHelmByRarity(rarity);
          if (helm) {
            await addToInventory(userId, helm.id);
            setRewardHelm(helm);
          }
        }
      }
    } catch (error) {
      console.error("Failed to process game end:", error);
    }

    // Show completion screen
    setShowCompletionScreen(true);
    setIsGameActive(false);
  };

  const handleResetGame = () => {
    setShowCompletionScreen(false);
    setRewardHelm(null);
    setFinalScore(0);
    setIsGameActive(false);
    setStrength(0);
    setEncumberance(0);
    setTotalScore(0);
    setStrikesRemaining(INITIAL_STRIKES);
    setGrid(Array(6).fill(null).map(() => Array(INITIAL_ROWS_PER_COLUMN).fill(null)));
    setDiceRoll(null);
    setDiceRotations([0, 0, 0, 0]);
    setSelectedNumberedDieIndex(null);
    setSelectedSlotDieIndex(null);
  };

  const canPlaceSelected = (): boolean => {
    if (selectedNumberedDieIndex === null || selectedSlotDieIndex === null || !diceRoll) {
      return false;
    }

    const selectedValue = diceRoll.numbered[selectedNumberedDieIndex];
    const selectedSlot = diceRoll.slot[selectedSlotDieIndex];
    const columnIndex = getColumnIndex(selectedSlot);
    const lowestCell = findLowestAvailableCell(columnIndex);
    
    if (lowestCell === null) {
      return false;
    }

    const highestValue = getHighestValueInColumn(columnIndex);
    return selectedValue >= highestValue;
  };

  const rulesText = `Roll 4 dice:  2 standard and 2 that have faces corresponding to the equipment slots for the grid columns.  Each roll, you select 1 of each type of die (1 numerical, 1 slot) and place the numerical value into the lowest open cell in that slot column.  But watch out, you may only place values that are at least as large as the highest value already in the column.  If you find yourself without a good move (or without any move), push the Strike button to end you turn and prepare to roll again.  However, you only get 10 Strikes before the game ends.

Also, each piece of equipment you use (meaning you have 1 or more cells filled in that column) weighs you down with some Encumberance.`;

  // Show completion screen
  if (showCompletionScreen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200 p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center space-y-4">
          <h2 className="text-3xl font-bold">Game Complete!</h2>
          <p className="text-lg">Congratulations! You have completed the game.</p>
          <div className="text-2xl font-bold">Total Score: {finalScore}</div>
          {rewardHelm && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">You have been rewarded with:</p>
              <p className="text-xl font-semibold text-primary mb-3">{rewardHelm.name}</p>
              {rewardHelm.image_url && (
                <div className="flex justify-center">
                  <Image
                    src={rewardHelm.image_url}
                    alt={rewardHelm.name}
                    width={256}
                    height={256}
                    className="max-w-full h-auto max-h-64 rounded-lg shadow-md object-contain"
                    unoptimized
                  />
                </div>
              )}
            </div>
          )}
          <Button onClick={handleResetGame} className="mt-4">
            Ok
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 min-h-screen bg-gray-200">
      {/* Header with buttons */}
      <div className="flex justify-between items-center">
        <Button onClick={handlePlayGame} disabled={isGameActive}>
          Play Game
        </Button>
        <Button variant="outline" onClick={() => setShowRules(true)}>
          Rules
        </Button>
      </div>

      {/* Game board */}
      {isGameActive && (
        <div className="space-y-6">
          {/* Scores and Strikes */}
          <div className="flex gap-8 justify-center items-center">
            <div className="text-center">
              <div className="text-sm text-gray-600">Strength</div>
              <div className="text-2xl font-bold">{strength}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Encumberance</div>
              <div className="text-2xl font-bold">{encumberance}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Total Score</div>
              <div className="text-2xl font-bold">{totalScore}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Strikes Remaining</div>
              <div className="text-2xl font-bold">{strikesRemaining}</div>
            </div>
          </div>

          {/* Dice Area */}
          {!diceRoll && (
            <div className="flex justify-center">
              <Button onClick={rollDice} size="lg">
                Roll
              </Button>
            </div>
          )}

          {diceRoll && (
            <div className="flex gap-8 items-start justify-center">
              {/* Action Buttons on the left */}
              <div className="flex flex-col gap-4">
                <Button
                  onClick={handlePlaceValue}
                  disabled={!canPlaceSelected()}
                  size="lg"
                >
                  Place Value
                </Button>
                <Button
                  onClick={handleStrike}
                  variant="destructive"
                  size="lg"
                >
                  Strike
                </Button>
              </div>

              {/* Dice on the right */}
              <div className="grid grid-cols-2 gap-4">
                {/* Numbered Dice */}
                {diceRoll.numbered.map((value, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedNumberedDieIndex(index)}
                    className={cn(
                      "w-16 h-16 rounded-lg border-4 flex items-center justify-center text-2xl font-bold shadow-lg transition-all",
                      selectedNumberedDieIndex === index
                        ? "border-blue-600 bg-blue-100 scale-110"
                        : "border-gray-400 bg-white hover:border-gray-600 hover:scale-105"
                    )}
                    style={{
                      transform: `rotate(${diceRotations[index]}deg)`,
                    }}
                  >
                    {value}
                  </button>
                ))}

                {/* Slot Dice */}
                {diceRoll.slot.map((slot, index) => (
                  <button
                    key={index + 2}
                    onClick={() => setSelectedSlotDieIndex(index)}
                    className={cn(
                      "w-16 h-16 rounded-lg border-4 flex items-center justify-center shadow-lg transition-all overflow-hidden",
                      selectedSlotDieIndex === index
                        ? "border-blue-600 bg-blue-100 scale-110"
                        : "border-gray-400 bg-white hover:border-gray-600 hover:scale-105"
                    )}
                    style={{
                      transform: `rotate(${diceRotations[index + 2]}deg)`,
                    }}
                  >
                    <Image
                      src={`${CDN_BASE_URL}/${SLOT_IMAGE_MAP[slot]}`}
                      alt={slot}
                      width={64}
                      height={64}
                      className="object-contain"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="border-2 border-gray-800 rounded-lg p-4 bg-white">
            <div className="grid grid-cols-6 gap-2">
              {SLOT_ORDER.map((slot, columnIndex) => (
                <div key={slot} className="flex flex-col">
                  {/* Column cells - render from top to bottom */}
                  <div className="flex flex-col gap-1 mb-2">
                    {grid[columnIndex].map((value, rowIndex) => (
                      <div
                        key={rowIndex}
                        className={cn(
                          "w-full h-12 border-2 rounded flex items-center justify-center font-bold text-lg",
                          value !== null
                            ? "border-gray-600 bg-gray-100"
                            : "border-gray-300 bg-gray-50"
                        )}
                      >
                        {value !== null ? value : ""}
                      </div>
                    ))}
                  </div>
                  {/* Column header image at bottom */}
                  <div className="flex justify-center items-center h-16 border-t-2 border-gray-400 pt-2">
                    <Image
                      src={`${CDN_BASE_URL}/${SLOT_IMAGE_MAP[slot]}`}
                      alt={slot}
                      width={64}
                      height={64}
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              ))}
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
