"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  addToInventory,
  getCurrentUserId,
  getRandomShouldersByRarity,
  getRewardRarity,
  updatePlayCount,
  updateTopScores,
  type ShouldersReward,
} from "@/lib/shoulders-game";
import { getTodayPlayCountForGear } from "@/lib/playcount";
import { playDiceRollSound } from "@/lib/sounds";
import {
  computeScore,
  DIE_FACE_IMAGES,
  type DieFace,
} from "@/lib/shoulders-scoring";
import { useRouter } from "next/navigation";

const RULES_TEXT = `You begin with 8 turns to try and achieve the highest score possible.  Roll 6 dice to start your turn.  You must Bank at least 1 die to continue rolling.  You may End Turn at any time to add your Banked Score to your overall Score, or you may roll the remaining dice to continue.  But if you roll no scoring dice, your turn will end, you will not score, and you'll be given a strike.  3 strikes ends the game.  Good luck!

Scoring:
Armor:  50
Weapon:  100
3x Armor or 3x Weapon:  800
3x Aquatic or 3x Fire:  250
3x Verdant or 3x Rock:  500
1 each of Armor, Weapon, Aquatic, Fire, Verdant, and Rock:  1000
4 of a kind:  1000
5 of a kind:  1500
6 of a kind:  2000
`;

const INITIAL_TURNS = 8;
const TOTAL_DICE = 6;

interface RolledDie {
  face: DieFace;
  angle: number;
  offset: number;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function rollDice(count: number): RolledDie[] {
  const faces: DieFace[] = [
    "Armor",
    "Weapon",
    "Aquatic",
    "Fire",
    "Verdant",
    "Rock",
  ];
  const result: RolledDie[] = [];
  for (let i = 0; i < count; i++) {
    result.push({
      face: faces[Math.floor(Math.random() * faces.length)],
      angle: randomBetween(-30, 30),
      offset: Math.floor(randomBetween(-5, 6)),
    });
  }
  return result;
}

function DieFaceIcon({ face, size = "md" }: { face: DieFace; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-8 h-8" : "w-14 h-14";
  return (
    <span className={`relative inline-block ${dim} shrink-0 rounded border border-gray-400 bg-white overflow-hidden [&>img]:object-cover`}>
      <Image
        src={DIE_FACE_IMAGES[face]}
        alt={face}
        fill
        className="object-cover"
        unoptimized
        sizes={size === "sm" ? "32px" : "56px"}
      />
    </span>
  );
}

function ScoringReferenceBox() {
  return (
    <div className="rounded-lg border-2 border-gray-700 bg-card p-4 shadow-md w-[333px] shrink-0">
      <h3 className="font-semibold text-sm mb-3">Valid Scoring Combinations</h3>
      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2 flex-wrap">
          <DieFaceIcon face="Armor" size="sm" />
          <span>1–2: 50 each</span>
        </li>
        <li className="flex items-center gap-2 flex-wrap">
          <DieFaceIcon face="Weapon" size="sm" />
          <span>1–2: 100 each</span>
        </li>
        <li className="flex items-center gap-2 flex-wrap">
          <DieFaceIcon face="Armor" size="sm" />
          <span className="text-black">×3</span>
          <span>or</span>
          <DieFaceIcon face="Weapon" size="sm" />
          <span className="text-black">×3</span>
          <span>: 800</span>
        </li>
        <li className="flex items-center gap-2 flex-wrap">
          <DieFaceIcon face="Aquatic" size="sm" />
          <span className="text-black">×3</span>
          <span>or</span>
          <DieFaceIcon face="Fire" size="sm" />
          <span className="text-black">×3</span>
          <span>: 250</span>
        </li>
        <li className="flex items-center gap-2 flex-wrap">
          <DieFaceIcon face="Verdant" size="sm" />
          <span className="text-black">×3</span>
          <span>or</span>
          <DieFaceIcon face="Rock" size="sm" />
          <span className="text-black">×3</span>
          <span>: 500</span>
        </li>
        <li className="flex items-center gap-2 flex-wrap">
          <DieFaceIcon face="Armor" size="sm" />
          <DieFaceIcon face="Weapon" size="sm" />
          <DieFaceIcon face="Aquatic" size="sm" />
          <DieFaceIcon face="Fire" size="sm" />
          <DieFaceIcon face="Verdant" size="sm" />
          <DieFaceIcon face="Rock" size="sm" />
          <span>: 1000</span>
        </li>
        <li className="flex items-center gap-2">4 of a kind: 1000</li>
        <li className="flex items-center gap-2">5 of a kind: 1500</li>
        <li className="flex items-center gap-2">6 of a kind: 2000</li>
      </ul>
    </div>
  );
}

function Die({
  face,
  angle = 0,
  offset = 0,
  onClick,
  onDragStart,
  draggable,
  disabled,
}: {
  face: DieFace;
  angle?: number;
  offset?: number;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  draggable?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`relative w-14 h-14 shrink-0 rounded border-2 border-gray-400 bg-white overflow-hidden ${
        disabled ? "pointer-events-none opacity-60" : "cursor-pointer hover:border-primary"
      }`}
      style={{
        transform: `rotate(${angle}deg) translateY(${offset}px)`,
      }}
      aria-label={`Die showing ${face}`}
    >
      <Image
        src={DIE_FACE_IMAGES[face]}
        alt={face}
        fill
        className="object-cover"
        unoptimized
        sizes="56px"
      />
    </div>
  );
}

export default function ShouldersPage() {
  const [isGameActive, setIsGameActive] = React.useState(false);
  const [turnsRemaining, setTurnsRemaining] = React.useState(INITIAL_TURNS);
  const [score, setScore] = React.useState(0);
  const [strikes, setStrikes] = React.useState(0);
  const [bankedScore, setBankedScore] = React.useState(0);
  const [diceInHand, setDiceInHand] = React.useState<RolledDie[]>([]);
  const [bankedDice, setBankedDice] = React.useState<RolledDie[]>([]);
  const [pendingBanked, setPendingBanked] = React.useState<RolledDie[]>([]);
  const [rollDisabled, setRollDisabled] = React.useState(false);
  const [bankDisabled, setBankDisabled] = React.useState(true);
  const [showRules, setShowRules] = React.useState(false);
  const [isGameEnding, setIsGameEnding] = React.useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = React.useState(false);
  const [finalScore, setFinalScore] = React.useState(0);
  const [rewardItem, setRewardItem] = React.useState<ShouldersReward | null>(null);
  const [strikeFromRoll, setStrikeFromRoll] = React.useState(false);
  const [todayPlayCount, setTodayPlayCount] = React.useState<number | null>(null);
  const suppressClickAfterDropToBankedRef = React.useRef(false);
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
  const suppressClickAfterDropToHandRef = React.useRef(false);
  const diceInHandRef = React.useRef<RolledDie[]>(diceInHand);
  const pendingBankedRef = React.useRef<RolledDie[]>(pendingBanked);

  diceInHandRef.current = diceInHand;
  pendingBankedRef.current = pendingBanked;

  const pendingResult = React.useMemo(
    () => computeScore(pendingBanked.map((d) => d.face)),
    [pendingBanked]
  );
  const canBank = pendingResult.valid;

  React.useEffect(() => {
    setBankDisabled(strikeFromRoll || !canBank);
  }, [canBank, strikeFromRoll]);

  const startGame = React.useCallback(() => {
    setIsGameActive(true);
    setTurnsRemaining(INITIAL_TURNS);
    setScore(0);
    setStrikes(0);
    setBankedScore(0);
    setDiceInHand([]);
    setBankedDice([]);
    setPendingBanked([]);
    setRollDisabled(false);
    setBankDisabled(true);
    setIsGameEnding(false);
    setShowCompletionScreen(false);
    setFinalScore(0);
    setRewardItem(null);
    setStrikeFromRoll(false);
  }, []);

  const handleRoll = React.useCallback(() => {
    playDiceRollSound();
    const inBanked = bankedDice.length + pendingBanked.length;
    let newDice: RolledDie[];
    if (inBanked === TOTAL_DICE) {
      setBankedDice([]);
      setPendingBanked([]);
      newDice = rollDice(TOTAL_DICE);
      setDiceInHand(newDice);
    } else {
      newDice = rollDice(TOTAL_DICE - inBanked);
      setDiceInHand(newDice);
    }
    setRollDisabled(true);
    const rollScores = computeScore(newDice.map((d) => d.face)).valid;
    if (!rollScores) {
      setBankedScore(0);
      setBankDisabled(true);
      setStrikeFromRoll(true);
    } else {
      setStrikeFromRoll(false);
    }
  }, [bankedDice.length, pendingBanked.length]);

  const moveToBanked = React.useCallback((index: number) => {
    if (rollDisabled === false) return;
    if (suppressClickAfterDropToBankedRef.current) {
      suppressClickAfterDropToBankedRef.current = false;
      return;
    }
    const hand = diceInHandRef.current;
    const removed = hand[index];
    if (removed === undefined) return;
    setDiceInHand((prev) => prev.filter((_, i) => i !== index));
    setPendingBanked((prev) => [...prev, removed]);
  }, [rollDisabled]);

  const moveToHand = React.useCallback((index: number) => {
    if (rollDisabled === false) return;
    if (suppressClickAfterDropToHandRef.current) {
      suppressClickAfterDropToHandRef.current = false;
      return;
    }
    const pending = pendingBankedRef.current;
    const removed = pending[index];
    if (removed === undefined) return;
    setPendingBanked((prev) => prev.filter((_, i) => i !== index));
    setDiceInHand((prev) => [...prev, removed]);
  }, [rollDisabled]);

  const handleBankDice = React.useCallback(() => {
    if (!canBank) return;
    setBankedScore((s) => s + pendingResult.score);
    setBankedDice((b) => [...b, ...pendingBanked]);
    setPendingBanked([]);
    setBankDisabled(true);
    setRollDisabled(false);
  }, [canBank, pendingBanked, pendingResult.score]);

  const triggerEndgame = React.useCallback(async () => {
    setIsGameEnding(true);
    setFinalScore(score + bankedScore);
    await new Promise((r) => setTimeout(r, 2000));
    const total = score + bankedScore;
    setFinalScore(total);
    try {
      const userId = await getCurrentUserId();
      if (userId) {
        await updateTopScores(userId, total);
        const rarity = await getRewardRarity(total);
        if (rarity) {
          const item = await getRandomShouldersByRarity(rarity);
          if (item) {
            await addToInventory(userId, item.id);
            setRewardItem(item);
          }
        }
      }
    } catch (e) {
      console.error("Failed to process game end:", e);
    }
    setIsGameActive(false);
    setShowCompletionScreen(true);
  }, [score, bankedScore]);

  const handleEndTurn = React.useCallback(() => {
    let newScore = score;
    let newStrikes = strikes;
    if (bankedScore === 0) {
      newStrikes = strikes + 1;
      setStrikes(newStrikes);
      if (newStrikes >= 3) {
        triggerEndgame();
        return;
      }
    } else {
      newScore = score + bankedScore;
      setScore(newScore);
    }
    setBankedScore(0);
    setBankedDice([]);
    setPendingBanked([]);
    setDiceInHand([]);
    setRollDisabled(false);
    setBankDisabled(true);
    setStrikeFromRoll(false);
    const newTurns = turnsRemaining - 1;
    setTurnsRemaining(newTurns);
    if (newTurns <= 0) {
      triggerEndgame();
    }
  }, [score, strikes, bankedScore, turnsRemaining, triggerEndgame]);

  const handleResetAfterComplete = React.useCallback(() => {
    setShowCompletionScreen(false);
    setRewardItem(null);
    setFinalScore(0);
  }, []);

  if (showCompletionScreen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-background p-6">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg border p-8 text-center space-y-4">
          <h2 className="text-3xl font-bold">Game Complete!</h2>
          <p className="text-lg">You have completed the game.</p>
          <div className="text-2xl font-bold">Final Score: {finalScore}</div>
          {rewardItem && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">
                You have been rewarded with:
              </p>
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
          <Button onClick={() => router.push("/obtain-gear")} className="mt-4">
            Ok
          </Button>
        </div>
      </div>
    );
  }

  const handlePlayGame = async () => {
    const userId = await getCurrentUserId();
    if (userId) {
      await updatePlayCount(userId);
      setTodayPlayCount((prev) => (prev !== null ? prev + 1 : null));
    }
    startGame();
  };

  return (
    <div className="space-y-6 p-6 min-h-screen bg-background">
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
        <Button
          variant="outline"
          onClick={() => setShowRules(true)}
        >
          Rules
        </Button>
      </div>

      {isGameActive ? (
        <div className="flex flex-row gap-6 items-start">
          <div className="border-2 border-gray-800 rounded-lg p-4 bg-card shadow-lg space-y-4 flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <div className="flex gap-6">
              <span>
                Turns Remaining: <strong>{turnsRemaining}</strong>
              </span>
              <span>
                Strikes: <strong>{strikes}</strong>
              </span>
            </div>
            <span>
              Score: <strong>{score}</strong>
            </span>
          </div>

          <div
            className="min-h-[140px] w-full rounded-md border-2 border-dashed border-gray-400 bg-muted/30 flex flex-wrap gap-5 p-3 items-center justify-center"
            style={{ aspectRatio: "2/1", maxHeight: 160 }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (!rollDisabled) return;
              const handIdx = e.dataTransfer.getData("die-hand-index");
              if (handIdx !== "") {
                const i = parseInt(handIdx, 10);
                if (!Number.isNaN(i)) {
                  moveToBanked(i);
                  suppressClickAfterDropToBankedRef.current = true;
                  setTimeout(() => { suppressClickAfterDropToBankedRef.current = false; }, 150);
                }
                return;
              }
              const bankedIdx = e.dataTransfer.getData("die-banked-index");
              if (bankedIdx !== "") {
                const i = parseInt(bankedIdx, 10);
                if (!Number.isNaN(i)) {
                  moveToHand(i);
                  suppressClickAfterDropToHandRef.current = true;
                  setTimeout(() => { suppressClickAfterDropToHandRef.current = false; }, 150);
                }
              }
            }}
          >
            {diceInHand.map((d, i) => (
              <Die
                key={`hand-${i}-${d.face}`}
                face={d.face}
                angle={d.angle}
                offset={d.offset}
                draggable={rollDisabled}
                disabled={isGameEnding}
                onClick={() => moveToBanked(i)}
                onDragStart={(e) => {
                  e.dataTransfer.setData("die-hand-index", String(i));
                  e.dataTransfer.effectAllowed = "move";
                }}
              />
            ))}
          </div>

          {strikeFromRoll && (
            <p className="text-center text-red-600 font-bold text-lg" role="alert">
              Strike!
            </p>
          )}

          <div className="flex justify-center gap-4">
            <Button
              onClick={handleBankDice}
              disabled={bankDisabled || isGameEnding}
            >
              Bank Dice
            </Button>
            <Button
              onClick={handleRoll}
              disabled={rollDisabled || isGameEnding}
            >
              Roll
            </Button>
            <Button
              onClick={handleEndTurn}
              disabled={isGameEnding}
            >
              End Turn
            </Button>
          </div>

          <div>
            Banked Score: <strong>{bankedScore}</strong>
          </div>

          <div
            className="min-h-[80px] w-full rounded-md border-2 border-dashed border-gray-400 bg-muted/30 flex flex-wrap gap-2 p-3 items-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (!rollDisabled) return;
              const handIdx = e.dataTransfer.getData("die-hand-index");
              if (handIdx !== "") {
                const i = parseInt(handIdx, 10);
                if (!Number.isNaN(i)) {
                  moveToBanked(i);
                  suppressClickAfterDropToBankedRef.current = true;
                  setTimeout(() => { suppressClickAfterDropToBankedRef.current = false; }, 150);
                }
                return;
              }
              const bankedIdx = e.dataTransfer.getData("die-banked-index");
              if (bankedIdx !== "") {
                const i = parseInt(bankedIdx, 10);
                if (!Number.isNaN(i)) {
                  moveToHand(i);
                  suppressClickAfterDropToHandRef.current = true;
                  setTimeout(() => { suppressClickAfterDropToHandRef.current = false; }, 150);
                }
              }
            }}
          >
            {[...bankedDice, ...pendingBanked].map((d, i) => (
              <Die
                key={`banked-${i}-${d.face}`}
                face={d.face}
                angle={i < bankedDice.length ? 0 : d.angle}
                offset={i < bankedDice.length ? 0 : d.offset}
                draggable={rollDisabled && i >= bankedDice.length}
                disabled={isGameEnding}
                onClick={() => {
                  if (i >= bankedDice.length) moveToHand(i - bankedDice.length);
                }}
                onDragStart={
                  rollDisabled && i >= bankedDice.length
                    ? (e) => {
                        e.dataTransfer.setData("die-banked-index", String(i - bankedDice.length));
                        e.dataTransfer.effectAllowed = "move";
                      }
                    : undefined
                }
              />
            ))}
          </div>
          </div>
          <ScoringReferenceBox />
        </div>
      ) : (
        <p className="text-center text-muted-foreground">
          Press Play Game to begin the shoulders challenge.
        </p>
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
