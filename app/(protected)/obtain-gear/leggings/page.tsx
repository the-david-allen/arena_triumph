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
import { AffinityStrengthsDialog } from "@/components/AffinityStrengthsDialog";
import {
  fetchAllAffinities,
  fetchAffinityMatchups,
  updatePlayCount,
  getCurrentUserId,
  updateTopScores,
  getRewardRarity,
  getRandomLeggingsByRarity,
  addToInventory,
  type Affinity,
} from "@/lib/leggings-game";
import { getTodayPlayCountForGear } from "@/lib/playcount";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";

const CDN_BASE_URL = "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/affinities";

interface RoundData {
  guess: (Affinity | null)[];
  feedback: {
    exactMatches: number;
    misplacedMatches: number;
    strongAgainst: number;
    weakAgainst: number;
  };
  highlightedTileIndex: number;
}

export default function LeggingsPage() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/48848a1b-9019-4cd4-a6a6-ace0c21a0b17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'leggings/page.tsx:41',message:'LeggingsPage render',data:{hasRouter:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const router = useRouter();
  const [isGameActive, setIsGameActive] = React.useState(false);
  const [answer, setAnswer] = React.useState<Affinity[]>([]);
  const [rounds, setRounds] = React.useState<RoundData[]>([]);
  const [currentRoundGuess, setCurrentRoundGuess] = React.useState<(Affinity | null)[]>(Array(5).fill(null));
  const [currentHighlightedTileIndex, setCurrentHighlightedTileIndex] = React.useState<number>(0);
  const [allAffinities, setAllAffinities] = React.useState<Affinity[]>([]);
  const [affinityMatchups, setAffinityMatchups] = React.useState<Map<string, Set<string>>>(new Map());
  const [selectedAffinity, setSelectedAffinity] = React.useState<Affinity | null>(null);
  const [showRules, setShowRules] = React.useState(false);
  const [showStrengths, setShowStrengths] = React.useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = React.useState(false);
  const [rewardLeggings, setRewardLeggings] = React.useState<{ id: string; name: string; image_url: string | null } | null>(null);
  const [finalRounds, setFinalRounds] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGameEnding, setIsGameEnding] = React.useState(false);
  const [todayPlayCount, setTodayPlayCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getCurrentUserId().then((userId) => {
      if (!userId || cancelled) return;
      getTodayPlayCountForGear(userId, "Leggings").then((count) => {
        if (!cancelled) setTodayPlayCount(count);
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load affinities and matchups when component mounts
  React.useEffect(() => {
    async function loadData() {
      try {
        const [affinities, matchups] = await Promise.all([
          fetchAllAffinities(),
          fetchAffinityMatchups(),
        ]);
        setAllAffinities(affinities);
        setAffinityMatchups(matchups);
      } catch (error) {
        console.error("Failed to load affinities:", error);
      }
    }
    loadData();
  }, []);

  // Generate random answer: 5 affinities from all 10 (can include duplicates)
  const generateAnswer = React.useCallback((): Affinity[] => {
    if (allAffinities.length === 0) return [];
    const answer: Affinity[] = [];
    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * allAffinities.length);
      answer.push(allAffinities[randomIndex]);
    }
    return answer;
  }, [allAffinities]);

  const handlePlayGame = async () => {
    if (allAffinities.length === 0) {
      alert("Affinities not loaded yet. Please wait...");
      return;
    }
    const userId = await getCurrentUserId();
    if (userId) {
      await updatePlayCount(userId);
      setTodayPlayCount((prev) => (prev !== null ? prev + 1 : null));
    }
    const newAnswer = generateAnswer();
    setAnswer(newAnswer);
    setRounds([]);
    setCurrentRoundGuess(Array(5).fill(null));
    const randomHighlighted = Math.floor(Math.random() * 5);
    setCurrentHighlightedTileIndex(randomHighlighted);
    setSelectedAffinity(null);
    setIsGameActive(true);
    setIsGameEnding(false);
    setShowCompletionScreen(false);
    setRewardLeggings(null);
    setFinalRounds(0);
  };

  const handleAffinityClick = (affinity: Affinity) => {
    setSelectedAffinity(affinity);
  };

  const handleTileClick = (tileIndex: number) => {
    if (selectedAffinity) {
      const newGuess = [...currentRoundGuess];
      newGuess[tileIndex] = selectedAffinity;
      setCurrentRoundGuess(newGuess);
      setSelectedAffinity(null);
    }
  };

  const handleTileDragOver = (e: React.DragEvent, tileIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleTileDrop = (e: React.DragEvent, tileIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const affinityData = JSON.parse(e.dataTransfer.getData("application/json")) as Affinity;
      const newGuess = [...currentRoundGuess];
      newGuess[tileIndex] = affinityData;
      setCurrentRoundGuess(newGuess);
    } catch (error) {
      console.error("Error handling drop:", error);
    }
  };

  const handleAffinityDragStart = (e: React.DragEvent, affinity: Affinity) => {
    e.dataTransfer.setData("application/json", JSON.stringify(affinity));
  };

  // Calculate feedback for a guess
  const calculateFeedback = React.useCallback((guess: Affinity[], answer: Affinity[], highlightedTileIndex: number): RoundData["feedback"] => {
    let exactMatches = 0;
    const answerCount = new Map<string, number>();
    const guessCount = new Map<string, number>();

    // Count exact matches
    for (let i = 0; i < 5; i++) {
      if (guess[i]?.id === answer[i]?.id) {
        exactMatches++;
      } else {
        // Count non-exact matches for misplaced calculation
        const answerId = answer[i]?.id;
        const guessId = guess[i]?.id;
        if (answerId) {
          answerCount.set(answerId, (answerCount.get(answerId) || 0) + 1);
        }
        if (guessId) {
          guessCount.set(guessId, (guessCount.get(guessId) || 0) + 1);
        }
      }
    }

    // Calculate misplaced matches
    let misplacedMatches = 0;
    for (const [guessId, guessNum] of guessCount.entries()) {
      const answerNum = answerCount.get(guessId) || 0;
      misplacedMatches += Math.min(guessNum, answerNum);
    }

    // Calculate strong/weak against for highlighted tile
    const highlightedAffinity = guess[highlightedTileIndex];
    let strongAgainst = 0;
    let weakAgainst = 0;

    if (highlightedAffinity) {
      const strongAgainstSet = affinityMatchups.get(highlightedAffinity.id);
      
      for (const answerAffinity of answer) {
        if (strongAgainstSet?.has(answerAffinity.id)) {
          strongAgainst++;
        }
        
        // Check if answer affinity is strong against highlighted affinity (then highlighted is weak against answer)
        const answerStrongSet = affinityMatchups.get(answerAffinity.id);
        if (answerStrongSet?.has(highlightedAffinity.id)) {
          weakAgainst++;
        }
      }
    }

    return {
      exactMatches,
      misplacedMatches,
      strongAgainst,
      weakAgainst,
    };
  }, [affinityMatchups]);

  const handleSubmitGuess = () => {
    // Check if all tiles are filled
    if (currentRoundGuess.some(affinity => affinity === null)) {
      return;
    }

    const guess = currentRoundGuess as Affinity[];
    const feedback = calculateFeedback(guess, answer, currentHighlightedTileIndex);

    // Add round to history (prepend so newest appears above)
    const newRound: RoundData = {
      guess: [...guess],
      feedback,
      highlightedTileIndex: currentHighlightedTileIndex,
    };
    setRounds([newRound, ...rounds]);

    // Check if guess matches answer exactly
    const isExactMatch = guess.every((affinity, index) => affinity.id === answer[index].id);

    if (isExactMatch) {
      // Trigger endgame
      handleGameEnd(rounds.length + 1);
    } else {
      // Start next round
      setCurrentRoundGuess(Array(5).fill(null));
      const randomHighlighted = Math.floor(Math.random() * 5);
      setCurrentHighlightedTileIndex(randomHighlighted);
      setSelectedAffinity(null);
    }
  };

  const handleGameEnd = async (roundCount: number) => {
    setFinalRounds(roundCount);
    setIsGameEnding(true); // Disable interactions but keep game board visible
    
    // Pause for 2 seconds (without allowing further button presses)
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const userId = await getCurrentUserId();
      if (userId) {
        // Update play count
        await updatePlayCount(userId);

        // Update top scores (rounds is the score, lower is better)
        await updateTopScores(userId, roundCount);

        // Get reward based on rounds
        const rarity = await getRewardRarity(roundCount);
        if (rarity) {
          const leggings = await getRandomLeggingsByRarity(rarity);
          if (leggings) {
            await addToInventory(userId, leggings.id);
            setRewardLeggings(leggings);
          }
        }
      }
    } catch (error) {
      console.error("Failed to process game end:", error);
    }

    // Replace game surface with completion screen
    setIsGameActive(false);
    setShowCompletionScreen(true);
  };

  const handleResetGame = () => {
    setShowCompletionScreen(false);
    setRewardLeggings(null);
    setFinalRounds(0);
    setIsGameActive(false);
    setIsGameEnding(false);
    setRounds([]);
    setCurrentRoundGuess(Array(5).fill(null));
    setSelectedAffinity(null);
  };

  const rulesText = `A random set of 5 Affinities has been chosen as the answer.  Take a guess and learn how many affinities you guessed are an exact match and how many match but in the wrong location.

Each round, a random guess slot is highlighted and you will also learn which affinities in the answer are strong against or weak against the affinity guessed in that slot.

Try to guess in as few rounds as possible.  Good luck!`;

  // Show completion screen
  if (showCompletionScreen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200 p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center space-y-4">
          <h2 className="text-3xl font-bold">Game Complete!</h2>
          <p className="text-lg">Congratulations! You have completed the game.</p>
          <div className="text-2xl font-bold">Rounds: {finalRounds}</div>
          {rewardLeggings && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">You have been rewarded with:</p>
              <p className="text-xl font-semibold text-primary mb-3">{rewardLeggings.name}</p>
              {rewardLeggings.image_url && (
                <div className="flex justify-center">
                  <Image
                    src={rewardLeggings.image_url}
                    alt={rewardLeggings.name}
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

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/48848a1b-9019-4cd4-a6a6-ace0c21a0b17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'leggings/page.tsx:pre-main-return',message:'About to return main UI',data:{showCompletionScreen,todayPlayCount},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'verify'})}).catch(()=>{});
  // #endregion
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
        <div className="space-y-6">
          {/* Affinities header */}
          <div className="flex items-center gap-4 bg-white rounded-lg shadow-md p-4">
            <span className="font-semibold text-lg">Affinities:</span>
            <div className="flex gap-2 flex-wrap">
              {allAffinities.map((affinity) => {
                const affinityName = (affinity.affinity_name as string).toLowerCase();
                const isSelected = selectedAffinity?.id === affinity.id;
                return (
                  <button
                    key={affinity.id}
                    onClick={() => !isGameEnding && handleAffinityClick(affinity)}
                    onDragStart={(e) => !isGameEnding && handleAffinityDragStart(e, affinity)}
                    draggable={!isGameEnding}
                    className={cn(
                      "w-16 h-16 rounded-lg border-2 transition-all",
                      !isGameEnding && "hover:scale-110 cursor-pointer",
                      isSelected
                        ? "border-blue-600 ring-2 ring-blue-400 scale-110"
                        : "border-gray-400 hover:border-gray-600",
                      isGameEnding && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Image
                      src={`${CDN_BASE_URL}/${affinityName}.jpg`}
                      alt={affinity.affinity_name as string}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover rounded-lg"
                      unoptimized
                    />
                  </button>
                );
              })}
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowStrengths(true)} 
              className="ml-auto bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900 shadow-lg"
            >
              Strengths
            </Button>
          </div>

          {/* Current round - always displayed directly below affinities header */}
          <div className="flex items-center gap-4">
            <span className="font-semibold">Round {rounds.length + 1}:</span>
            <div className="flex gap-2">
              {currentRoundGuess.map((affinity, tileIndex) => {
                const affinityName = affinity ? (affinity.affinity_name as string).toLowerCase() : null;
                const isHighlighted = tileIndex === currentHighlightedTileIndex;
                return (
                  <div
                    key={tileIndex}
                    onClick={() => !isGameEnding && handleTileClick(tileIndex)}
                    onDragOver={(e) => !isGameEnding && handleTileDragOver(e, tileIndex)}
                    onDrop={(e) => !isGameEnding && handleTileDrop(e, tileIndex)}
                    className={cn(
                      "w-16 h-16 rounded-lg flex items-center justify-center transition-all",
                      !isGameEnding && "cursor-pointer hover:scale-110",
                      isHighlighted
                        ? "border-4 border-red-600 bg-red-50 ring-4 ring-red-400"
                        : "border-2 border-gray-400 bg-white hover:border-gray-600",
                      isGameEnding && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {affinity && affinityName && (
                      <Image
                        src={`${CDN_BASE_URL}/${affinityName}.jpg`}
                        alt={affinity.affinity_name as string}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover rounded-lg"
                        unoptimized
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <Button
              onClick={handleSubmitGuess}
              disabled={currentRoundGuess.some(affinity => affinity === null) || isGameEnding}
              className="ml-4"
            >
              Submit
            </Button>
          </div>

          {/* Previous rounds - displayed below current round, with newest at top */}
          {rounds.map((round, roundIndex) => (
            <div key={roundIndex} className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="font-semibold">Round {rounds.length - roundIndex}:</span>
                <div className="flex gap-2">
                  {round.guess.map((affinity, tileIndex) => {
                    const affinityName = affinity ? (affinity.affinity_name as string).toLowerCase() : null;
                    const isHighlighted = tileIndex === round.highlightedTileIndex;
                    return (
                      <div
                        key={tileIndex}
                        className={cn(
                          "w-16 h-16 rounded-lg flex items-center justify-center",
                          isHighlighted
                            ? "border-4 border-red-600 bg-red-50 ring-4 ring-red-400"
                            : "border-2 border-gray-400 bg-white"
                        )}
                      >
                        {affinity && affinityName && (
                          <Image
                            src={`${CDN_BASE_URL}/${affinityName}.jpg`}
                            alt={affinity.affinity_name as string}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover rounded-lg"
                            unoptimized
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="ml-4 flex gap-6 text-sm">
                  <div className="space-y-1">
                    <div>Exact Match: {round.feedback.exactMatches}</div>
                    <div>Misplaced Match: {round.feedback.misplacedMatches}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span>Strong against:</span>
                      {round.guess[round.highlightedTileIndex] && (
                        <Image
                          src={`${CDN_BASE_URL}/${(round.guess[round.highlightedTileIndex]!.affinity_name as string).toLowerCase()}.jpg`}
                          alt={round.guess[round.highlightedTileIndex]!.affinity_name as string}
                          width={20}
                          height={20}
                          className="w-5 h-5 object-cover rounded"
                          unoptimized
                        />
                      )}
                      <span>{round.feedback.strongAgainst}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Weak against:</span>
                      {round.guess[round.highlightedTileIndex] && (
                        <Image
                          src={`${CDN_BASE_URL}/${(round.guess[round.highlightedTileIndex]!.affinity_name as string).toLowerCase()}.jpg`}
                          alt={round.guess[round.highlightedTileIndex]!.affinity_name as string}
                          width={20}
                          height={20}
                          className="w-5 h-5 object-cover rounded"
                          unoptimized
                        />
                      )}
                      <span>{round.feedback.weakAgainst}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
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

      <AffinityStrengthsDialog
        open={showStrengths}
        onOpenChange={setShowStrengths}
      />
    </div>
  );
}
