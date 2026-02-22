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
import { Card, CardData } from "@/components/chestpiece/Card";
import { GameSlot } from "@/components/chestpiece/GameSlot";
import { fetchChestGameCards, updatePlayCount, getCurrentUserId, updateTopScores, getRewardRarity, getRandomChestByRarity, addToInventory } from "@/lib/chestpiece-game";
import { checkUserHasItem, addXpToUser, RARITY_XP } from "@/lib/inventory";
import { getTodayPlayCountForGear } from "@/lib/playcount";
import { playChestBackgroundMusic, stopChestBackgroundMusic } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type SlotName =
  | "Helm"
  | "Shoulder-Left"
  | "Shoulder-Right"
  | "Chestpiece"
  | "Gauntlet-Left"
  | "Gauntlet-Right"
  | "Belt"
  | "Legging-Left"
  | "Legging-Right"
  | "Boot-Left"
  | "Boot-Right";

interface SlotState {
  [key: string]: CardData | null;
}

// Define which slots are in each vertical and horizontal line
const VERTICAL_LINES: Record<number, SlotName[]> = {
  1: ["Gauntlet-Left"],
  2: ["Shoulder-Left", "Legging-Left", "Boot-Left"],
  3: ["Helm", "Chestpiece", "Belt"],
  4: ["Shoulder-Right", "Legging-Right", "Boot-Right"],
  5: ["Gauntlet-Right"],
};

const HORIZONTAL_LINES: Record<number, SlotName[]> = {
  1: ["Helm"],
  2: ["Shoulder-Left", "Shoulder-Right"],
  3: ["Gauntlet-Left", "Chestpiece", "Gauntlet-Right"],
  4: ["Belt"],
  5: ["Legging-Left", "Legging-Right"],
  6: ["Boot-Left", "Boot-Right"],
};

export default function ChestpiecePage() {
  const router = useRouter();
  const [deck, setDeck] = React.useState<CardData[]>([]);
  const [currentCard, setCurrentCard] = React.useState<CardData | null>(null);
  const [slots, setSlots] = React.useState<SlotState>({
    Helm: null,
    "Shoulder-Left": null,
    "Shoulder-Right": null,
    Chestpiece: null,
    "Gauntlet-Left": null,
    "Gauntlet-Right": null,
    Belt: null,
    "Legging-Left": null,
    "Legging-Right": null,
    "Boot-Left": null,
    "Boot-Right": null,
  });
  const [discardPile, setDiscardPile] = React.useState<CardData[]>([]);
  const [currentScore, setCurrentScore] = React.useState(0);
  const [isGameActive, setIsGameActive] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showRules, setShowRules] = React.useState(false);
  const [finalScore, setFinalScore] = React.useState(0);
  const [highlightedLines, setHighlightedLines] = React.useState<Set<string>>(new Set());
  const [highlightedCards, setHighlightedCards] = React.useState<Set<string>>(new Set());
  const [slotBonusActive, setSlotBonusActive] = React.useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [showCompletionScreen, setShowCompletionScreen] = React.useState(false);
  const [rewardChestpiece, setRewardChestpiece] = React.useState<{ id: string; name: string; image_url: string | null; rarity: string } | null>(null);
  const [rewardXp, setRewardXp] = React.useState<number | null>(null);
  const [todayPlayCount, setTodayPlayCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getCurrentUserId().then((userId) => {
      if (!userId || cancelled) return;
      getTodayPlayCountForGear(userId, "Chestpiece").then((count) => {
        if (!cancelled) setTodayPlayCount(count);
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Stop chest background music when game ends or component unmounts (music is started in handlePlayGame to satisfy autoplay policy)
  React.useEffect(() => {
    if (!(isGameActive && !showCompletionScreen)) {
      stopChestBackgroundMusic();
      return;
    }
    return () => stopChestBackgroundMusic();
  }, [isGameActive, showCompletionScreen]);

  // #region agent log
  React.useEffect(() => {
    console.log('[DEBUG] Deck state changed:', { deckLength: deck.length, isGameActive, isLoading });
  }, [deck, isGameActive, isLoading]);
  // #endregion

  // Shuffle array function
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handlePlayGame = async () => {
    // Start music synchronously in the click handler so the browser allows it (autoplay policy)
    playChestBackgroundMusic();
    const userId = await getCurrentUserId();
    if (userId) {
      await updatePlayCount(userId);
      setTodayPlayCount((prev) => (prev !== null ? prev + 1 : null));
    }
    setIsLoading(true);
    // #region agent log
    console.log('[DEBUG] handlePlayGame called, isLoading=true');
    fetch('http://127.0.0.1:7242/ingest/48848a1b-9019-4cd4-a6a6-ace0c21a0b17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chestpiece/page.tsx:88',message:'handlePlayGame called',data:{isLoading:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'})}).catch(()=>{});
    // #endregion
    try {
      const cards = await fetchChestGameCards();
      // #region agent log
      console.log('[DEBUG] Cards fetched:', { cardsLength: cards?.length || 0, firstCard: cards?.[0] || null });
      fetch('http://127.0.0.1:7242/ingest/48848a1b-9019-4cd4-a6a6-ace0c21a0b17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chestpiece/page.tsx:92',message:'Cards fetched',data:{cardsLength:cards?.length||0,firstCard:cards?.[0]||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const shuffled = shuffleArray(cards);
      // #region agent log
      console.log('[DEBUG] Cards shuffled:', { shuffledLength: shuffled?.length || 0, firstShuffled: shuffled?.[0] || null });
      fetch('http://127.0.0.1:7242/ingest/48848a1b-9019-4cd4-a6a6-ace0c21a0b17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chestpiece/page.tsx:95',message:'Cards shuffled',data:{shuffledLength:shuffled?.length||0,firstShuffled:shuffled?.[0]||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      // Remove 34 cards at random (keep remaining cards for the deck)
      const cardsToRemove = 34;
      const remainingDeck = shuffled.slice(cardsToRemove);
      setDeck(remainingDeck);
      // #region agent log
      console.log('[DEBUG] setDeck called with:', { shuffledLength: shuffled?.length || 0 });
      fetch('http://127.0.0.1:7242/ingest/48848a1b-9019-4cd4-a6a6-ace0c21a0b17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chestpiece/page.tsx:97',message:'setDeck called',data:{shuffledLength:shuffled?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      setCurrentCard(null);
      setSlots({
        Helm: null,
        "Shoulder-Left": null,
        "Shoulder-Right": null,
        Chestpiece: null,
        "Gauntlet-Left": null,
        "Gauntlet-Right": null,
        Belt: null,
        "Legging-Left": null,
        "Legging-Right": null,
        "Boot-Left": null,
        "Boot-Right": null,
      });
      setDiscardPile([]);
      setCurrentScore(0);
      setIsGameActive(true);
      setHighlightedLines(new Set());
      setHighlightedCards(new Set());
      setSlotBonusActive(new Set());
      setErrorMessage(null);
      // #region agent log
      console.log('[DEBUG] Game state initialized:', { isGameActive: true, shuffledLength: shuffled?.length || 0 });
      fetch('http://127.0.0.1:7242/ingest/48848a1b-9019-4cd4-a6a6-ace0c21a0b17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chestpiece/page.tsx:112',message:'Game state initialized',data:{isGameActive:true,isLoading:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      console.error("Failed to start game:", error);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/48848a1b-9019-4cd4-a6a6-ace0c21a0b17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chestpiece/page.tsx:115',message:'Error in handlePlayGame',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const message = error instanceof Error ? error.message : "Failed to start game. Please try again.";
      setErrorMessage(message);
      setIsGameActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGameEnd = async (finalScore: number) => {
    setFinalScore(finalScore);
    
    // Pause for 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Lookup reward and update database
    try {
      const userId = await getCurrentUserId();
      if (userId) {
        // Play count is incremented at game start only; do not increment again here.
        // Update top scores (existing)
        await updateTopScores(userId, finalScore);
        
        // Get reward based on score
        const rarity = await getRewardRarity(finalScore);
        if (rarity) {
          const chestpiece = await getRandomChestByRarity(rarity);
          if (chestpiece) {
            const alreadyHas = await checkUserHasItem(userId, chestpiece.id);
            if (alreadyHas) {
              const xpVal = RARITY_XP[chestpiece.rarity] ?? RARITY_XP.Base ?? 1;
              await addXpToUser(userId, xpVal);
              setRewardXp(xpVal);
              setRewardChestpiece(null);
            } else {
              await addToInventory(userId, chestpiece.id);
              setRewardChestpiece(chestpiece);
              setRewardXp(null);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to process game end:", error);
    }
    
    // Replace game UI with completion screen
    setShowCompletionScreen(true);
  };

  const handleDrawCard = () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/48848a1b-9019-4cd4-a6a6-ace0c21a0b17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chestpiece/page.tsx:121',message:'handleDrawCard called',data:{deckLength:deck.length,currentCard:currentCard?.card_id||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (deck.length === 0 || currentCard !== null) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/48848a1b-9019-4cd4-a6a6-ace0c21a0b17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chestpiece/page.tsx:123',message:'handleDrawCard early return',data:{deckLength:deck.length,currentCard:currentCard?.card_id||null,reason:deck.length===0?'deck empty':'currentCard exists'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return;
    }

    const newDeck = [...deck];
    const drawnCard = newDeck.shift()!;
    setDeck(newDeck);
    setCurrentCard(drawnCard);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/48848a1b-9019-4cd4-a6a6-ace0c21a0b17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chestpiece/page.tsx:130',message:'Card drawn',data:{drawnCardId:drawnCard?.card_id,newDeckLength:newDeck.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
  };

  const checkLineMatch = (lineSlots: SlotName[], slots: SlotState): boolean => {
    const cards = lineSlots.map((slot) => slots[slot]).filter((card) => card !== null) as CardData[];
    if (cards.length !== lineSlots.length) {
      return false;
    }
    const firstColor = cards[0].color;
    return cards.every((card) => card.color === firstColor);
  };

  const checkAndApplyBonuses = (slotName: SlotName, newSlots: SlotState) => {
    const newHighlightedLines = new Set(highlightedLines);
    const newHighlightedCards = new Set(highlightedCards);
    let bonusScore = 0;

    // Check vertical lines
    for (const [lineKey, lineSlots] of Object.entries(VERTICAL_LINES)) {
      if (lineSlots.includes(slotName)) {
        if (checkLineMatch(lineSlots, newSlots)) {
          const lineId = `vertical-${lineKey}`;
          newHighlightedLines.add(lineId);
          // Add all vertical bonuses
          lineSlots.forEach((slot) => {
            const card = newSlots[slot];
            if (card && card.vertical_bonus !== null) {
              bonusScore += card.vertical_bonus;
              newHighlightedCards.add(card.card_id);
            }
          });
        }
      }
    }

    // Check horizontal lines
    for (const [lineKey, lineSlots] of Object.entries(HORIZONTAL_LINES)) {
      if (lineSlots.includes(slotName)) {
        if (checkLineMatch(lineSlots, newSlots)) {
          const lineId = `horizontal-${lineKey}`;
          newHighlightedLines.add(lineId);
          // Add all horizontal bonuses
          lineSlots.forEach((slot) => {
            const card = newSlots[slot];
            if (card && card.horizontal_bonus !== null) {
              bonusScore += card.horizontal_bonus;
              newHighlightedCards.add(card.card_id);
            }
          });
        }
      }
    }

    setHighlightedLines(newHighlightedLines);
    setHighlightedCards(newHighlightedCards);
    return bonusScore;
  };

  const handleCardDrop = async (slotName: SlotName, card: CardData) => {
    if (slots[slotName] !== null || currentCard?.card_id !== card.card_id) {
      return;
    }

    const newSlots = { ...slots, [slotName]: card };
    setSlots(newSlots);
    setCurrentCard(null);

    // Add base value to score
    let newScore = currentScore + card.value;

    // Check slot match - normalize slot names for comparison
    const normalizeSlotName = (name: string): string => {
      if (name.startsWith("Shoulder")) return "Shoulders";
      if (name.startsWith("Gauntlet")) return "Gauntlets";
      if (name.startsWith("Legging")) return "Leggings";
      if (name.startsWith("Boot")) return "Boots";
      return name;
    };
    
    const slotMatch = normalizeSlotName(slotName) === card.slot;

    if (slotMatch) {
      newScore += card.slot_bonus;
      setSlotBonusActive((prev) => new Set(prev).add(card.card_id));
    }

    // Check line matches and add bonuses
    const lineBonuses = checkAndApplyBonuses(slotName, newSlots);
    newScore += lineBonuses;

    setCurrentScore(newScore);

    // Check if game is complete (all slots filled OR deck is empty with no current card)
    const allSlotsFilled = Object.values(newSlots).every((slot) => slot !== null);
    // After placing a card, currentCard is set to null, so check if deck is empty
    const deckEmpty = deck.length === 0;
    
    if (allSlotsFilled || deckEmpty) {
      await handleGameEnd(newScore);
    }
  };

  const handleDiscardCard = () => {
    if (!currentCard) {
      return;
    }
    setDiscardPile((prev) => [...prev, currentCard]);
    setCurrentCard(null);
  };

  const handleDiscardDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentCard) {
      return;
    }

    try {
      const cardData = JSON.parse(e.dataTransfer.getData("application/json")) as CardData;
      // Verify it's the current card
      if (cardData.card_id === currentCard.card_id) {
        handleDiscardCard();
      }
    } catch (error) {
      // If parsing fails, still try to discard current card
      if (currentCard) {
        handleDiscardCard();
      }
    }
  };

  const handleDiscardDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  };

  const handleResetGame = () => {
    setShowCompletionScreen(false);
    setRewardChestpiece(null);
    setRewardXp(null);
    setIsGameActive(false);
    setCurrentScore(0);
    setHighlightedLines(new Set());
    setHighlightedCards(new Set());
    setSlotBonusActive(new Set());
    setDeck([]);
    setCurrentCard(null);
    setSlots({
      Helm: null,
      "Shoulder-Left": null,
      "Shoulder-Right": null,
      Chestpiece: null,
      "Gauntlet-Left": null,
      "Gauntlet-Right": null,
      Belt: null,
      "Legging-Left": null,
      "Legging-Right": null,
      "Boot-Left": null,
      "Boot-Right": null,
    });
    setDiscardPile([]);
    setFinalScore(0);
  };

  React.useEffect(() => {
    if (showCompletionScreen && (rewardChestpiece || rewardXp !== null)) {
      const audio = new Audio("https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/sounds/tada.mp3");
      audio.play().catch(() => {});
    }
  }, [showCompletionScreen, rewardChestpiece, rewardXp]);

  const rulesText = `Click the top card of the deck to reveal the next card which you may play into a slot or drag to the Discard pile.  The game ends when all slots are filled or the deck is empty.

Each card has a value that will add to your score.  It also has several possible bonuses:
Slot Bonus: If you place the card into the corresponding slot, you receive this bonus.
Horizontal Bonus: If all slots in the row match in color, you recieve the horizontal bonus for each.
Vertical Bonus: If all slots in the row match in color, you recieve the vertical bonus for each.

The Deck contains 33 cards randomly selected from the full 67 card pool.  The pool contains:
 11 Purple (highest value)
 22 Green (medium value)
 33 White (lowest value)`;

  // Show completion screen if flag is set
  if (showCompletionScreen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200 p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center space-y-4">
          <h2 className="text-3xl font-bold">Game Complete!</h2>
          <p className="text-lg">Congratulations! You have completed the game.</p>
          <div className="text-2xl font-bold">Final Score: {finalScore}</div>
          {rewardChestpiece && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">You have been rewarded with:</p>
              <p className="text-xl font-semibold text-primary mb-3">{rewardChestpiece.name}</p>
              {rewardChestpiece.image_url && (
                <div className="flex justify-center">
                  <img 
                    src={rewardChestpiece.image_url} 
                    alt={rewardChestpiece.name}
                    className="max-w-full h-auto max-h-64 rounded-lg shadow-md"
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
          <Button onClick={() => router.push("/obtain-gear")} className="mt-4">Ok</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 min-h-screen bg-gray-200">
      {/* Header with buttons */}
      <div className="flex justify-between items-center">
        <Button
          onClick={() => void handlePlayGame()}
          disabled={
            isLoading ||
            isGameActive ||
            (todayPlayCount !== null && todayPlayCount >= 3)
          }
        >
          {isLoading
            ? "Loading..."
            : todayPlayCount !== null && todayPlayCount >= 3
              ? "No plays remaining today"
              : "Play Game"}
        </Button>
        <Button variant="outline" onClick={() => setShowRules(true)}>
          Rules
        </Button>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-semibold">Error: {errorMessage}</p>
          {errorMessage.includes("No cards found") && (
            <p className="text-sm mt-2">
              The chest_game_lookup table appears to be empty. Please populate it with card data to play the game.
            </p>
          )}
        </div>
      )}

      {/* Game board */}
      {isGameActive && (
        <div className="flex items-start gap-6">
          {/* Left side: Deck, Current Card, Discard, and Score */}
          <div className="flex flex-col items-center gap-4">
            {/* Deck and Current Card side by side */}
            <div className="flex items-start gap-4">
              {/* Deck */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleDrawCard}
                  disabled={deck.length === 0 || currentCard !== null}
                  // #region agent log
                  onMouseEnter={()=>{fetch('http://127.0.0.1:7242/ingest/48848a1b-9019-4cd4-a6a6-ace0c21a0b17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chestpiece/page.tsx:310',message:'Deck button render',data:{deckLength:deck.length,currentCard:currentCard?.card_id||null,disabled:deck.length===0||currentCard!==null,isGameActive},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,D,E'})}).catch(()=>{});}}
                  // #endregion
                  className={cn(
                    "w-24 h-32 rounded-lg border-2 border-gray-600 overflow-hidden",
                    "flex items-center justify-center shadow-lg relative",
                    "hover:ring-2 hover:ring-blue-400 transition-all",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {deck.length > 0 ? (
                    <>
                      <img
                        src="https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/bling/card_back.png"
                        alt="Card back"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <span className="relative z-10 text-white text-sm font-bold drop-shadow-md bg-black/40 px-1.5 py-0.5 rounded">
                        {deck.length}
                      </span>
                    </>
                  ) : (
                    <div className="text-sm text-gray-600">Empty</div>
                  )}
                </button>
                <div className="text-xs text-gray-600">Deck</div>
              </div>

              {/* Current Card - displayed to the right of Deck */}
              {currentCard && (
                <div className="flex flex-col items-center gap-2">
                  <Card card={currentCard} />
                  <div className="text-xs text-gray-600">Drag to slot or discard</div>
                </div>
              )}
            </div>

            {/* Discard Pile */}
            <div className="flex flex-col items-center gap-2">
              <div
                onDrop={handleDiscardDrop}
                onDragOver={handleDiscardDragOver}
                className={cn(
                  "w-24 h-32 rounded-lg border-2 border-dashed border-gray-400",
                  "flex items-center justify-center bg-gray-100/50",
                  "transition-all hover:border-gray-600"
                )}
              >
                {discardPile.length > 0 ? (
                  <div className="text-center">
                    <div className="text-2xl">🗑️</div>
                    <div className="text-xs mt-1">{discardPile.length}</div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">Discard</div>
                )}
              </div>
              <div className="text-xs text-gray-600">Discard</div>
            </div>

            {/* Current Score */}
            <div className="flex flex-col items-center gap-2 mt-2">
              <h2 className="text-xl font-bold">Current Score</h2>
              <div className="text-2xl font-bold">{currentScore}</div>
            </div>
          </div>

          {/* Game Grid on the right */}
          <div className="flex-1 flex flex-col items-center">
            {/* Game Grid */}
            <div className="relative grid grid-cols-5 gap-2 max-w-2xl w-full" style={{ minHeight: 'calc(140px * 6 + 0.5rem * 5)' }}>
            {/* Horizontal lines - continuous lines running through the middle of each row */}
            {/* These lines run through the middle of each row, spanning full width */}
            {/* Skip row 1 (Helm) and row 4 (Belt) - no horizontal lines there */}
            {[2, 3, 5, 6].map((rowNum) => (
              <div
                key={`horizontal-${rowNum}`}
                className={cn(
                  "absolute left-0 right-0 flex flex-col gap-1 pointer-events-none z-0",
                  rowNum === 2 && "top-[calc(140px+0.5rem+70px)]", // Middle of second row
                  rowNum === 3 && "top-[calc((140px+0.5rem)*2+70px)]", // Middle of third row
                  rowNum === 5 && "top-[calc((140px+0.5rem)*4+70px)]", // Middle of fifth row
                  rowNum === 6 && "top-[calc((140px+0.5rem)*5+70px)]" // Middle of sixth row
                )}
                style={{ transform: 'translateY(-50%)' }}
              >
                <div
                  className={cn(
                    "h-px w-full",
                    highlightedLines.has(`horizontal-${rowNum}`)
                      ? "bg-yellow-400 opacity-90"
                      : "bg-gray-500 opacity-20"
                  )}
                />
                <div
                  className={cn(
                    "h-px w-full",
                    highlightedLines.has(`horizontal-${rowNum}`)
                      ? "bg-yellow-400 opacity-90"
                      : "bg-gray-500 opacity-20"
                  )}
                />
              </div>
            ))}

            {/* Vertical lines - continuous lines running through the middle of each column */}
            {/* These lines run through the middle of each column, spanning full height */}
            {/* Skip columns 1 and 5 (Gauntlet slots) - no vertical lines there */}
            {/* Column 2 (Shoulder Left, Legging Left, Boot Left) */}
            <div
              className="absolute top-0 bottom-0 w-1 flex gap-0.5 pointer-events-none z-0"
              style={{ 
                left: 'calc((100% - 4 * 0.5rem) / 5 * 1.5 + 0.5rem)', 
                transform: 'translateX(-50%)' 
              }}
            >
                  <div
                    className={cn(
                      "w-0.5 h-full",
                      highlightedLines.has("vertical-2")
                        ? "bg-yellow-400 opacity-90"
                        : "bg-gray-500 opacity-20"
                    )}
                  />
                  <div
                    className={cn(
                      "w-0.5 h-full",
                      highlightedLines.has("vertical-2")
                        ? "bg-yellow-400 opacity-90"
                        : "bg-gray-500 opacity-20"
                    )}
                  />
            </div>
            {/* Column 3 (Helm, Chestpiece, Belt) */}
            <div
              className="absolute top-0 bottom-0 w-1 flex gap-0.5 pointer-events-none z-0"
              style={{ 
                left: 'calc((100% - 4 * 0.5rem) / 5 * 2.5 + 0.5rem * 2)', 
                transform: 'translateX(-50%)' 
              }}
            >
                  <div
                    className={cn(
                      "w-0.5 h-full",
                      highlightedLines.has("vertical-3")
                        ? "bg-yellow-400 opacity-90"
                        : "bg-gray-500 opacity-20"
                    )}
                  />
                  <div
                    className={cn(
                      "w-0.5 h-full",
                      highlightedLines.has("vertical-3")
                        ? "bg-yellow-400 opacity-90"
                        : "bg-gray-500 opacity-20"
                    )}
                  />
            </div>
            {/* Column 4 (Shoulder Right, Legging Right, Boot Right) */}
            <div
              className="absolute top-0 bottom-0 w-1 flex gap-0.5 pointer-events-none z-0"
              style={{ 
                left: 'calc((100% - 4 * 0.5rem) / 5 * 3.5 + 0.5rem * 3)', 
                transform: 'translateX(-50%)' 
              }}
            >
                  <div
                    className={cn(
                      "w-0.5 h-full",
                      highlightedLines.has("vertical-4")
                        ? "bg-yellow-400 opacity-90"
                        : "bg-gray-500 opacity-20"
                    )}
                  />
                  <div
                    className={cn(
                      "w-0.5 h-full",
                      highlightedLines.has("vertical-4")
                        ? "bg-yellow-400 opacity-90"
                        : "bg-gray-500 opacity-20"
                    )}
                  />
            </div>
            {/* Row 1: Helm */}
            <div className="col-start-3">
              <GameSlot
                slotName="Helm"
                card={slots.Helm}
                isHighlighted={highlightedCards.has(slots.Helm?.card_id || "")}
                slotBonusActive={slotBonusActive.has(slots.Helm?.card_id || "")}
                onDrop={(card) => handleCardDrop("Helm", card)}
              />
            </div>

            {/* Row 2: Shoulders */}
            <div className="col-start-2">
              <GameSlot
                slotName="Shoulder (L)"
                card={slots["Shoulder-Left"]}
                isHighlighted={highlightedCards.has(slots["Shoulder-Left"]?.card_id || "")}
                slotBonusActive={slotBonusActive.has(slots["Shoulder-Left"]?.card_id || "")}
                onDrop={(card) => handleCardDrop("Shoulder-Left", card)}
              />
            </div>
            <div className="col-start-4">
              <GameSlot
                slotName="Shoulder (R)"
                card={slots["Shoulder-Right"]}
                isHighlighted={highlightedCards.has(slots["Shoulder-Right"]?.card_id || "")}
                slotBonusActive={slotBonusActive.has(slots["Shoulder-Right"]?.card_id || "")}
                onDrop={(card) => handleCardDrop("Shoulder-Right", card)}
              />
            </div>

            {/* Row 3: Gauntlets and Chestpiece */}
            <div className="col-start-1">
              <GameSlot
                slotName="Gauntlet (L)"
                card={slots["Gauntlet-Left"]}
                isHighlighted={highlightedCards.has(slots["Gauntlet-Left"]?.card_id || "")}
                slotBonusActive={slotBonusActive.has(slots["Gauntlet-Left"]?.card_id || "")}
                onDrop={(card) => handleCardDrop("Gauntlet-Left", card)}
              />
            </div>
            <div className="col-start-3">
              <GameSlot
                slotName="Chestpiece"
                card={slots.Chestpiece}
                isHighlighted={highlightedCards.has(slots.Chestpiece?.card_id || "")}
                slotBonusActive={slotBonusActive.has(slots.Chestpiece?.card_id || "")}
                onDrop={(card) => handleCardDrop("Chestpiece", card)}
              />
            </div>
            <div className="col-start-5">
              <GameSlot
                slotName="Gauntlet (R)"
                card={slots["Gauntlet-Right"]}
                isHighlighted={highlightedCards.has(slots["Gauntlet-Right"]?.card_id || "")}
                slotBonusActive={slotBonusActive.has(slots["Gauntlet-Right"]?.card_id || "")}
                onDrop={(card) => handleCardDrop("Gauntlet-Right", card)}
              />
            </div>

            {/* Row 4: Belt */}
            <div className="col-start-3">
              <GameSlot
                slotName="Belt"
                card={slots.Belt}
                isHighlighted={highlightedCards.has(slots.Belt?.card_id || "")}
                slotBonusActive={slotBonusActive.has(slots.Belt?.card_id || "")}
                onDrop={(card) => handleCardDrop("Belt", card)}
              />
            </div>

            {/* Row 5: Leggings */}
            <div className="col-start-2">
              <GameSlot
                slotName="Legging (L)"
                card={slots["Legging-Left"]}
                isHighlighted={highlightedCards.has(slots["Legging-Left"]?.card_id || "")}
                slotBonusActive={slotBonusActive.has(slots["Legging-Left"]?.card_id || "")}
                onDrop={(card) => handleCardDrop("Legging-Left", card)}
              />
            </div>
            <div className="col-start-4">
              <GameSlot
                slotName="Legging (R)"
                card={slots["Legging-Right"]}
                isHighlighted={highlightedCards.has(slots["Legging-Right"]?.card_id || "")}
                slotBonusActive={slotBonusActive.has(slots["Legging-Right"]?.card_id || "")}
                onDrop={(card) => handleCardDrop("Legging-Right", card)}
              />
            </div>

            {/* Row 6: Boots */}
            <div className="col-start-2">
              <GameSlot
                slotName="Boot (L)"
                card={slots["Boot-Left"]}
                isHighlighted={highlightedCards.has(slots["Boot-Left"]?.card_id || "")}
                slotBonusActive={slotBonusActive.has(slots["Boot-Left"]?.card_id || "")}
                onDrop={(card) => handleCardDrop("Boot-Left", card)}
              />
            </div>
            <div className="col-start-4">
              <GameSlot
                slotName="Boot (R)"
                card={slots["Boot-Right"]}
                isHighlighted={highlightedCards.has(slots["Boot-Right"]?.card_id || "")}
                slotBonusActive={slotBonusActive.has(slots["Boot-Right"]?.card_id || "")}
                onDrop={(card) => handleCardDrop("Boot-Right", card)}
              />
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
