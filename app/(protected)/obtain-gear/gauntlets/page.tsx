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
  getRandomGauntletsByRarity,
  getRewardRarity,
  updatePlayCount,
  updateTopScores,
  type GauntletsReward,
} from "@/lib/gauntlets-game";
import { getTodayPlayCountForGear } from "@/lib/playcount";
import { useRouter } from "next/navigation";

const CDN_BASE = "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/gauntlets_game";
const ASSETS = {
  background: `${CDN_BASE}/tavern_working.png`,
  heart: `${CDN_BASE}/heart.png`,
  tavernkeeperLeft: `${CDN_BASE}/tavernkeeper_left_facing.png`,
  tavernkeeperRight: `${CDN_BASE}/tavernkeeper_right_facing.png`,
  mug: `${CDN_BASE}/mug.png`,
  mugEmpty: `${CDN_BASE}/mug_empty.png`,
  patron: `${CDN_BASE}/tavernkeeper_left_facing.png`,
} as const;

const LANE_COUNT = 4;
const LANE_Y_POSITIONS = [0.29, 0.45, 0.61, 0.77];
const LANE_HEIGHT = 0.08;
const DOOR_X = 0.12;
const DOOR_CENTER_X = 0.07;
const KEG_X = 0.88;
const BAR_START_X = 0.18;
const BAR_END_X = 0.88;
const MUG_FILL_TIME = 1.5;
const PATRON_SLIDE_DISTANCE = 0.15;
const PATRON_WAIT_AFTER_SLIDE = 1;
const MUG_SPEED = 0.25;
const PATRON_SLIDE_SPEED = 0.22;
const CATCH_RANGE = 0.04;

type MugType = "full" | "empty";
type PatronState = "advancing" | "sliding_left" | "waiting_1s";

interface Patron {
  id: string;
  laneIndex: number;
  x: number;
  state: PatronState;
  slideLeftRemaining: number;
  waitTimer: number;
}

interface Mug {
  id: string;
  laneIndex: number;
  x: number;
  type: MugType;
}

interface DifficultySettings {
  patronSpeed: number;
  spawnInterval: number;
  maxPatronsPerLane: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getDifficultySettings(elapsedSeconds: number): DifficultySettings {
  const speedScale = Math.min(elapsedSeconds / 60, 1);
  const spawnScale = Math.min(elapsedSeconds / 90, 1);
  const maxPatronsPerLane = Math.min(4, 1 + Math.floor(elapsedSeconds / 20));
  return {
    patronSpeed: 0.04 + 0.08 * speedScale,
    spawnInterval: 4 - 2.2 * spawnScale,
    maxPatronsPerLane,
  };
}

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function playCrashSound(): void {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 120;
    osc.type = "square";
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    /* placeholder; swap for real asset later */
  }
}

export default function GauntletsPage() {
  const [isGameActive, setIsGameActive] = React.useState(false);
  const [isCountingDown, setIsCountingDown] = React.useState(false);
  const [countdown, setCountdown] = React.useState(5);
  const [timer, setTimer] = React.useState(0);
  const [lives, setLives] = React.useState(4);
  const [tavernkeeperLane, setTavernkeeperLane] = React.useState(1);
  const [isFilling, setIsFilling] = React.useState(false);
  const [fillTimer, setFillTimer] = React.useState(0);
  const [patrons, setPatrons] = React.useState<Patron[]>([]);
  const [mugs, setMugs] = React.useState<Mug[]>([]);
  const [showRules, setShowRules] = React.useState(false);
  const [isGameEnding, setIsGameEnding] = React.useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = React.useState(false);
  const [finalSeconds, setFinalSeconds] = React.useState(0);
  const [rewardGauntlets, setRewardGauntlets] = React.useState<GauntletsReward | null>(null);
  const [todayPlayCount, setTodayPlayCount] = React.useState<number | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    let cancelled = false;
    getCurrentUserId().then((userId) => {
      if (!userId || cancelled) return;
      getTodayPlayCountForGear(userId, "Gauntlets").then((count) => {
        if (!cancelled) setTodayPlayCount(count);
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const patronsRef = React.useRef<Patron[]>([]);
  const mugsRef = React.useRef<Mug[]>([]);
  const tavernkeeperLaneRef = React.useRef(1);
  const isFillingRef = React.useRef(false);
  const fillTimerRef = React.useRef(0);
  const livesRef = React.useRef(4);
  const elapsedRef = React.useRef(0);
  const lastSecondRef = React.useRef(0);
  const spawnTimerRef = React.useRef(0);
  const animationFrameRef = React.useRef<number | null>(null);
  const lastFrameRef = React.useRef<number | null>(null);
  const countdownIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const isGameEndingRef = React.useRef(false);
  const isLoopRunningRef = React.useRef(false);

  React.useEffect(() => {
    patronsRef.current = patrons;
  }, [patrons]);
  React.useEffect(() => {
    mugsRef.current = mugs;
  }, [mugs]);
  React.useEffect(() => {
    tavernkeeperLaneRef.current = tavernkeeperLane;
  }, [tavernkeeperLane]);
  React.useEffect(() => {
    isFillingRef.current = isFilling;
  }, [isFilling]);
  React.useEffect(() => {
    fillTimerRef.current = fillTimer;
  }, [fillTimer]);
  React.useEffect(() => {
    livesRef.current = lives;
  }, [lives]);
  React.useEffect(() => {
    isGameEndingRef.current = isGameEnding;
  }, [isGameEnding]);

  const stopGameLoop = React.useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    isLoopRunningRef.current = false;
    lastFrameRef.current = null;
  }, []);

  const handleLifeLoss = React.useCallback(async () => {
    if (isGameEndingRef.current) return;
    playCrashSound();
    const nextLives = Math.max(0, livesRef.current - 1);
    livesRef.current = nextLives;
    setLives(nextLives);

    if (nextLives === 0) {
      setIsGameEnding(true);
      isGameEndingRef.current = true;
      stopGameLoop();
      const finalTime = Math.floor(elapsedRef.current);
      setFinalSeconds(finalTime);
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const userId = await getCurrentUserId();
        if (userId) {
          await updateTopScores(userId, finalTime);
          const rarity = await getRewardRarity(finalTime);
          if (rarity) {
            const gauntlets = await getRandomGauntletsByRarity(rarity);
            if (gauntlets) {
              await addToInventory(userId, gauntlets.id);
              setRewardGauntlets(gauntlets);
            }
          }
        }
      } catch (e) {
        console.error("Failed to process game end:", e);
      }
      setIsGameActive(false);
      setShowCompletionScreen(true);
    }
  }, [stopGameLoop]);

  const moveToLane = React.useCallback((laneIndex: number) => {
    if (isFillingRef.current || isGameEndingRef.current) return;
    const next = clamp(laneIndex, 0, LANE_COUNT - 1);
    tavernkeeperLaneRef.current = next;
    setTavernkeeperLane(next);
  }, []);

  const startFill = React.useCallback(() => {
    if (isFillingRef.current || isGameEndingRef.current) return;
    isFillingRef.current = true;
    setIsFilling(true);
    fillTimerRef.current = MUG_FILL_TIME;
    setFillTimer(MUG_FILL_TIME);
  }, []);

  const handleBarClick = React.useCallback(
    (laneIndex: number) => {
      if (!isGameActive || isCountingDown || isGameEndingRef.current) return;
      if (isFillingRef.current) return;
      const current = tavernkeeperLaneRef.current;
      if (laneIndex === current) {
        startFill();
      } else {
        const step = laneIndex > current ? 1 : -1;
        moveToLane(current + step);
      }
    },
    [isGameActive, isCountingDown, moveToLane, startFill]
  );

  const stepGame = React.useCallback(
    (timestamp: number) => {
      if (!isLoopRunningRef.current) return;
      if (lastFrameRef.current === null) lastFrameRef.current = timestamp;
      const dt = (timestamp - lastFrameRef.current) / 1000;
      lastFrameRef.current = timestamp;
      if (dt > 0.1) {
        animationFrameRef.current = requestAnimationFrame(stepGame);
        return;
      }

      const elapsed = elapsedRef.current + dt;
      elapsedRef.current = elapsed;
      const elapsedSeconds = Math.floor(elapsed);
      if (elapsedSeconds !== lastSecondRef.current) {
        lastSecondRef.current = elapsedSeconds;
        setTimer(elapsedSeconds);
      }

      const settings = getDifficultySettings(elapsedSeconds);
      let nextPatrons = [...patronsRef.current];
      let nextMugs = [...mugsRef.current];
      let shouldLoseLife = false;

      if (isFillingRef.current) {
        let ft = fillTimerRef.current - dt;
        if (ft <= 0) {
          ft = 0;
          isFillingRef.current = false;
          setIsFilling(false);
          fillTimerRef.current = 0;
          setFillTimer(0);
          const lane = tavernkeeperLaneRef.current;
          nextMugs = [
            ...nextMugs,
            { id: createId("mug"), laneIndex: lane, x: KEG_X - 0.02, type: "full" as const },
          ];
        } else {
          fillTimerRef.current = ft;
          setFillTimer(ft);
        }
      }

      for (let i = nextPatrons.length - 1; i >= 0; i--) {
        const p = nextPatrons[i];
        let np = { ...p };

        if (np.state === "waiting_1s") {
          np.waitTimer -= dt;
          if (np.waitTimer <= 0) {
            nextMugs = [
              ...nextMugs,
              { id: createId("mug"), laneIndex: np.laneIndex, x: np.x, type: "empty" as const },
            ];
            np.state = "advancing";
            np.waitTimer = 0;
          }
          nextPatrons[i] = np;
          continue;
        }

        if (np.state === "sliding_left") {
          const move = Math.min(np.slideLeftRemaining, PATRON_SLIDE_SPEED * dt);
          np.x -= move;
          np.slideLeftRemaining -= move;
          if (np.slideLeftRemaining <= 0) {
            if (np.x <= DOOR_CENTER_X) {
              nextPatrons.splice(i, 1);
              continue;
            }
            np.state = "waiting_1s";
            np.waitTimer = PATRON_WAIT_AFTER_SLIDE;
          }
          nextPatrons[i] = np;
          continue;
        }

        np.x += settings.patronSpeed * dt;
        if (np.x >= KEG_X - CATCH_RANGE) {
          shouldLoseLife = true;
          nextPatrons.splice(i, 1);
          continue;
        }
        nextPatrons[i] = np;
      }

      for (let i = nextMugs.length - 1; i >= 0; i--) {
        const m = nextMugs[i];
        const dir = m.type === "full" ? -1 : 1;
        let nx = m.x + dir * MUG_SPEED * dt;

        if (m.type === "full") {
          if (nx <= DOOR_X) {
            shouldLoseLife = true;
            nextMugs.splice(i, 1);
            continue;
          }
          const pi = nextPatrons.findIndex(
            (q) =>
              q.laneIndex === m.laneIndex &&
              q.state === "advancing" &&
              m.x <= q.x + CATCH_RANGE &&
              m.x >= q.x - CATCH_RANGE
          );
          if (pi >= 0) {
            const pat = nextPatrons[pi];
            nextPatrons[pi] = {
              ...pat,
              state: "sliding_left",
              slideLeftRemaining: PATRON_SLIDE_DISTANCE,
              waitTimer: 0,
            };
            nextMugs.splice(i, 1);
            continue;
          }
        } else {
          const tkThere = tavernkeeperLaneRef.current === m.laneIndex;
          if (nx >= KEG_X - CATCH_RANGE && nx <= KEG_X + CATCH_RANGE && tkThere) {
            nextMugs.splice(i, 1);
            continue;
          }
          if (nx >= KEG_X + CATCH_RANGE) {
            if (!tkThere) shouldLoseLife = true;
            nextMugs.splice(i, 1);
            continue;
          }
        }

        nextMugs[i] = { ...m, x: nx };
      }

      spawnTimerRef.current -= dt;
      if (spawnTimerRef.current <= 0) {
        const lanesWithSpace = [];
        for (let L = 0; L < LANE_COUNT; L++) {
          const count = nextPatrons.filter((q) => q.laneIndex === L).length;
          if (count < settings.maxPatronsPerLane) lanesWithSpace.push(L);
        }
        if (lanesWithSpace.length > 0) {
          const lane = lanesWithSpace[Math.floor(Math.random() * lanesWithSpace.length)];
          nextPatrons = [
            ...nextPatrons,
            {
              id: createId("patron"),
              laneIndex: lane,
              x: DOOR_X + 0.02,
              state: "advancing" as const,
              slideLeftRemaining: 0,
              waitTimer: 0,
            },
          ];
        }
        spawnTimerRef.current = settings.spawnInterval * (0.7 + Math.random() * 0.6);
      }

      setPatrons(nextPatrons);
      setMugs(nextMugs);
      patronsRef.current = nextPatrons;
      mugsRef.current = nextMugs;

      if (shouldLoseLife) handleLifeLoss();
      animationFrameRef.current = requestAnimationFrame(stepGame);
    },
    [handleLifeLoss]
  );

  const startGameLoop = React.useCallback(() => {
    stopGameLoop();
    isLoopRunningRef.current = true;
    animationFrameRef.current = requestAnimationFrame(stepGame);
  }, [stepGame, stopGameLoop]);

  const resetGame = React.useCallback(() => {
    setTimer(0);
    setLives(4);
    setPatrons([]);
    setMugs([]);
    setIsFilling(false);
    setFillTimer(0);
    setIsGameEnding(false);
    isGameEndingRef.current = false;
    setRewardGauntlets(null);
    setFinalSeconds(0);
    elapsedRef.current = 0;
    lastSecondRef.current = 0;
    spawnTimerRef.current = 0;
    patronsRef.current = [];
    mugsRef.current = [];
    fillTimerRef.current = 0;
    isFillingRef.current = false;
    const startLane = 1;
    tavernkeeperLaneRef.current = startLane;
    setTavernkeeperLane(startLane);
  }, []);

  const startCountdown = React.useCallback(() => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    resetGame();
    setIsGameActive(true);
    setShowCompletionScreen(false);
    setCountdown(5);
    setIsCountingDown(true);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          setIsCountingDown(false);
          startGameLoop();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [resetGame, startGameLoop]);

  const handleResetGame = React.useCallback(() => {
    stopGameLoop();
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setShowCompletionScreen(false);
    setIsGameActive(false);
    setIsCountingDown(false);
    resetGame();
  }, [resetGame, stopGameLoop]);

  React.useEffect(() => {
    return () => {
      stopGameLoop();
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [stopGameLoop]);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!isGameActive || isGameEndingRef.current || isCountingDown) return;
      if (isFillingRef.current) return;
      if (e.key === "ArrowUp" && !e.repeat) {
        e.preventDefault();
        moveToLane(tavernkeeperLaneRef.current - 1);
      }
      if (e.key === "ArrowDown" && !e.repeat) {
        e.preventDefault();
        moveToLane(tavernkeeperLaneRef.current + 1);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isGameActive, isCountingDown, moveToLane]);

  const rulesText =
    "Hello Tavernkeeper.  Fill the mugs and provide the patrons with their drinks and do not let them get to the kegs while still thirsty.  Good luck!";

  if (showCompletionScreen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200 p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center space-y-4">
          <h2 className="text-3xl font-bold">Game Complete!</h2>
          <p className="text-lg">You have completed the game.</p>
          <div className="text-2xl font-bold">Time Lasted: {finalSeconds} seconds</div>
          {rewardGauntlets && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">You have been rewarded with:</p>
              <p className="text-xl font-semibold text-primary mb-3">{rewardGauntlets.name}</p>
              {rewardGauntlets.image_url && (
                <div className="flex justify-center">
                  <Image
                    src={rewardGauntlets.image_url}
                    alt={rewardGauntlets.name}
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
    startCountdown();
  };

  return (
    <div className="space-y-6 p-6 min-h-screen bg-gray-200">
      <div className="flex justify-between items-center">
        <Button
          onClick={() => void handlePlayGame()}
          disabled={
            isCountingDown ||
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

      {isGameActive ? (
        <div className="flex justify-center">
          <div className="relative w-full max-w-5xl aspect-square rounded-lg shadow-lg overflow-hidden">
            <Image
              src={ASSETS.background}
              alt="Tavern"
              fill
              className="object-cover"
              priority
              unoptimized
            />
            <div className="absolute inset-0">
              <div className="absolute top-4 left-4 px-3 py-1 rounded-md bg-black/60 text-white text-sm font-semibold">
                Time Lasted: {timer}s
              </div>
              <div className="absolute top-4 right-4 flex gap-0.5 items-center">
                {Array.from({ length: lives }, (_, idx) => (
                  <div key={idx} className="relative w-8 h-8">
                    <Image
                      src={ASSETS.heart}
                      alt=""
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                ))}
              </div>

              {LANE_Y_POSITIONS.map((laneY, laneIndex) => (
                <div
                  key={laneIndex}
                  className="absolute left-0 right-0 cursor-pointer"
                  style={{
                    top: `${laneY * 100}%`,
                    height: `${LANE_HEIGHT * 100}%`,
                    transform: "translateY(-50%)",
                  }}
                  onClick={() => handleBarClick(laneIndex)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") handleBarClick(laneIndex);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Bar ${laneIndex + 1}`}
                />
              ))}

              {patrons.map((patron) => {
                const laneY = LANE_Y_POSITIONS[patron.laneIndex];
                return (
                  <div
                    key={patron.id}
                    className="absolute w-[4%] h-[4%]"
                    style={{
                      top: `${laneY * 100}%`,
                      left: `${patron.x * 100}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <Image
                      src={ASSETS.patron}
                      alt=""
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                );
              })}

              {mugs.map((mug) => {
                const laneY = LANE_Y_POSITIONS[mug.laneIndex];
                const src = mug.type === "full" ? ASSETS.mug : ASSETS.mugEmpty;
                return (
                  <div
                    key={mug.id}
                    className="absolute w-[3%] h-[3%]"
                    style={{
                      top: `${laneY * 100}%`,
                      left: `${mug.x * 100}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <Image src={src} alt="" fill className="object-contain" unoptimized />
                  </div>
                );
              })}

              <div
                className="absolute w-[4.5%] h-[4.5%]"
                style={{
                  top: `${LANE_Y_POSITIONS[tavernkeeperLane] * 100}%`,
                  left: `${KEG_X * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <Image
                  src={isFilling ? ASSETS.tavernkeeperRight : ASSETS.tavernkeeperLeft}
                  alt=""
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>

              {isCountingDown && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-6xl font-bold">
                  {countdown}
                </div>
              )}
              {isGameEnding && <div className="absolute inset-0 bg-black/40" />}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-600">
          Press Play Game to begin the gauntlets challenge.
        </div>
      )}

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
