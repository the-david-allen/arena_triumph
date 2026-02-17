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
import { checkUserHasItem, addXpToUser, RARITY_XP } from "@/lib/inventory";
import { getTodayPlayCountForGear } from "@/lib/playcount";
import { useRouter } from "next/navigation";

/* ─────────────────────────── Asset URLs ─────────────────────────── */
const CDN_BASE = "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/gauntlets_game";
const ASSET_URLS = {
  background: `${CDN_BASE}/tavern_working.png`,
  heart: `${CDN_BASE}/heart.png`,
  tkLeft: `${CDN_BASE}/tavernkeeper_left_facing.png`,
  tkRight: `${CDN_BASE}/tavernkeeper_right_facing.png`,
  mug: `${CDN_BASE}/mug.png`,
  mugEmpty: `${CDN_BASE}/mug_empty.png`,
  patron1: `${CDN_BASE}/patron1.png`,
  patron2: `${CDN_BASE}/patron2.png`,
  patron3: `${CDN_BASE}/patron3.png`,
} as const;

const PATRON_IMAGES = ["patron1", "patron2", "patron3"] as const;
type PatronImageKey = (typeof PATRON_IMAGES)[number];

/* ─────────────────────────── Game Constants ──────────────────────── */
const BASE_W = 2048;
const BASE_H = 1895;
const HUD_H = 50;
const NUM_BARS = 4;
const FIXED_DT = 1 / 60;

const BARS = [
  { y: 0.2422, xDoorCenter: 0.2185, xKegCenter: 0.7376 },
  { y: 0.4440, xDoorCenter: 0.1559, xKegCenter: 0.8030 },
  { y: 0.6458, xDoorCenter: 0.0906, xKegCenter: 0.8637 },
  { y: 0.8476, xDoorCenter: 0.0187, xKegCenter: 0.9244 },
];
const DOOR_FAIL_X = [0.2353, 0.1727, 0.1102, 0.0458];
const KEG_FAIL_X = [0.6545, 0.7199, 0.7750, 0.8375];

const MUG_FILL_TIME = 1.25;
const FULL_MUG_SPEED = 520;
const EMPTY_MUG_SPEED = 300;
const PATRON_SPEED_START = 80;
const PATRON_SPEED_MAX = 150;
const SLIDE_BACK_SPEED = 240;
const SLIDE_DIST_NORM = 0.23;
const PAUSE_AFTER_CATCH = 1.0;
const LIVES_START = 4;
const MUG_RADIUS = 10;
const PATRON_RADIUS = 18;
const CATCH_DIST = MUG_RADIUS + PATRON_RADIUS;

/* ─────────────────────────── Types ───────────────────────────────── */
type Phase = "IDLE" | "COUNTDOWN" | "PLAYING" | "GAME_OVER";
type TKState = "IDLE" | "FILLING";
type PatronState = "ADVANCING" | "SLIDING_BACK" | "PAUSE" | "RETURNING";
type MugType = "FULL" | "EMPTY";

interface Patron {
  id: number;
  barIdx: number;
  x: number;
  state: PatronState;
  slideRemaining: number;
  pauseTimer: number;
  linkedEmptyMugId: number | null;
  imageKey: PatronImageKey;
}

interface Mug {
  id: number;
  barIdx: number;
  x: number;
  type: MugType;
}

interface GameState {
  phase: Phase;
  countdownValue: number;
  countdownTimer: number;
  elapsed: number;
  lives: number;
  tkBarIdx: number;
  tkState: TKState;
  fillTimer: number;
  patrons: Patron[];
  mugs: Mug[];
  spawnTimer: number;
  nextId: number;
  pendingMove: number | null;
  pendingPour: boolean;
  lifeLossesThisTick: number;
  gameOverTimer: number;
}

/* ─────────────────────── Helpers ─────────────────────────────────── */
function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function getDifficulty(t: number) {
  const speedT = Math.min(t / 300, 1);
  const spawnT = Math.min(t / 200, 1);
  let maxPerBar: number;
  if (t < 20) maxPerBar = 1;
  else if (t < 60) maxPerBar = 2;
  else if (t < 100) maxPerBar = 3;
  else maxPerBar = 4;
  return {
    patronSpeed: PATRON_SPEED_START + (PATRON_SPEED_MAX - PATRON_SPEED_START) * speedT,
    spawnInterval: 4.0 - 2 * spawnT,
    maxPerBar,
  };
}

function playCrashSound(): void {
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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
    /* placeholder */
  }
}

function freshState(): GameState {
  return {
    phase: "IDLE",
    countdownValue: 5,
    countdownTimer: 0,
    elapsed: 0,
    lives: LIVES_START,
    tkBarIdx: 0,
    tkState: "IDLE",
    fillTimer: 0,
    patrons: [],
    mugs: [],
    spawnTimer: 2.0,
    nextId: 1,
    pendingMove: null,
    pendingPour: false,
    lifeLossesThisTick: 0,
    gameOverTimer: 0,
  };
}

/* ──────────────────── Fixed-step simulation ──────────────────────── */
function step(gs: GameState, dt: number): void {
  if (gs.phase === "COUNTDOWN") {
    gs.countdownTimer -= dt;
    if (gs.countdownTimer <= 0) {
      gs.countdownValue -= 1;
      if (gs.countdownValue <= 0) {
        gs.phase = "PLAYING";
        gs.elapsed = 0;
      } else {
        gs.countdownTimer += 1;
      }
    }
    return;
  }

  if (gs.phase === "GAME_OVER") {
    gs.gameOverTimer -= dt;
    return;
  }

  if (gs.phase !== "PLAYING") return;

  gs.elapsed += dt;
  gs.lifeLossesThisTick = 0;
  const diff = getDifficulty(gs.elapsed);

  /* 1) Apply queued input */
  if (gs.tkState === "IDLE") {
    if (gs.pendingMove !== null) {
      gs.tkBarIdx = clamp(gs.pendingMove, 0, NUM_BARS - 1);
      gs.pendingMove = null;
    }
    if (gs.pendingPour) {
      gs.pendingPour = false;
      gs.tkState = "FILLING";
      gs.fillTimer = MUG_FILL_TIME;
    }
  } else {
    gs.pendingMove = null;
    gs.pendingPour = false;
  }

  /* 2) Fill timer */
  if (gs.tkState === "FILLING") {
    gs.fillTimer -= dt;
    if (gs.fillTimer <= 0) {
      gs.fillTimer = 0;
      gs.tkState = "IDLE";
      const bar = BARS[gs.tkBarIdx];
      gs.mugs.push({
        id: gs.nextId++,
        barIdx: gs.tkBarIdx,
        x: bar.xKegCenter * BASE_W,
        type: "FULL",
      });
    }
  }

  /* 3) Spawn patrons */
  const MIN_SPAWN_GAP = 300;
  gs.spawnTimer -= dt;
  if (gs.spawnTimer <= 0) {
    const eligible: number[] = [];
    for (let b = 0; b < NUM_BARS; b++) {
      const barPatrons = gs.patrons.filter((p) => p.barIdx === b);
      if (barPatrons.length >= diff.maxPerBar) continue;
      const doorX = BARS[b].xDoorCenter * BASE_W;
      const tooClose = barPatrons.some((p) => Math.abs(p.x - doorX) < MIN_SPAWN_GAP);
      if (!tooClose) eligible.push(b);
    }
    if (eligible.length > 0) {
      const barIdx = eligible[Math.floor(Math.random() * eligible.length)];
      const bar = BARS[barIdx];
      gs.patrons.push({
        id: gs.nextId++,
        barIdx,
        x: bar.xDoorCenter * BASE_W,
        state: "ADVANCING",
        slideRemaining: 0,
        pauseTimer: 0,
        linkedEmptyMugId: null,
        imageKey: PATRON_IMAGES[Math.floor(Math.random() * PATRON_IMAGES.length)],
      });
    }
    gs.spawnTimer = diff.spawnInterval * (0.7 + Math.random() * 0.6);
  }

  /* 4) Update patrons */
  for (let i = gs.patrons.length - 1; i >= 0; i--) {
    const p = gs.patrons[i];
    const bar = BARS[p.barIdx];
    const doorX = bar.xDoorCenter * BASE_W;

    switch (p.state) {
      case "ADVANCING":
      case "RETURNING": {
        p.x += diff.patronSpeed * dt;
        const kegFail = KEG_FAIL_X[p.barIdx] * BASE_W;
        if (p.x >= kegFail) {
          gs.lifeLossesThisTick++;
          playCrashSound();
          if (p.linkedEmptyMugId !== null) {
            const mi = gs.mugs.findIndex((m) => m.id === p.linkedEmptyMugId);
            if (mi >= 0) gs.mugs.splice(mi, 1);
          }
          gs.patrons.splice(i, 1);
        }
        break;
      }
      case "SLIDING_BACK": {
        const move = Math.min(p.slideRemaining, SLIDE_BACK_SPEED * dt);
        p.x -= move;
        p.slideRemaining -= move;
        if (p.x <= doorX) {
          if (p.linkedEmptyMugId !== null) {
            const mi = gs.mugs.findIndex((m) => m.id === p.linkedEmptyMugId);
            if (mi >= 0) gs.mugs.splice(mi, 1);
          }
          gs.patrons.splice(i, 1);
          break;
        }
        if (p.slideRemaining <= 0) {
          p.state = "PAUSE";
          p.pauseTimer = PAUSE_AFTER_CATCH;
        }
        break;
      }
      case "PAUSE": {
        if (p.x <= doorX) {
          if (p.linkedEmptyMugId !== null) {
            const mi = gs.mugs.findIndex((m) => m.id === p.linkedEmptyMugId);
            if (mi >= 0) gs.mugs.splice(mi, 1);
          }
          gs.patrons.splice(i, 1);
          break;
        }
        p.pauseTimer -= dt;
        if (p.pauseTimer <= 0) {
          const emptyMug: Mug = {
            id: gs.nextId++,
            barIdx: p.barIdx,
            x: p.x,
            type: "EMPTY",
          };
          gs.mugs.push(emptyMug);
          p.linkedEmptyMugId = emptyMug.id;
          p.state = "RETURNING";
        }
        break;
      }
    }
  }

  /* 5) Update mugs */
  for (let i = gs.mugs.length - 1; i >= 0; i--) {
    const m = gs.mugs[i];
    if (m.type === "FULL") {
      m.x -= FULL_MUG_SPEED * dt;
    } else {
      m.x += EMPTY_MUG_SPEED * dt;
    }
  }

  /* 6) Resolve full-mug catches (priority: patron with largest x on same bar) */
  for (let i = gs.mugs.length - 1; i >= 0; i--) {
    const m = gs.mugs[i];
    if (m.type !== "FULL") continue;
    let bestIdx = -1;
    let bestX = -Infinity;
    for (let j = 0; j < gs.patrons.length; j++) {
      const p = gs.patrons[j];
      if (
        p.barIdx === m.barIdx &&
        (p.state === "ADVANCING" || p.state === "RETURNING") &&
        Math.abs(m.x - p.x) <= CATCH_DIST
      ) {
        if (p.x > bestX) {
          bestX = p.x;
          bestIdx = j;
        }
      }
    }
    if (bestIdx >= 0) {
      const p = gs.patrons[bestIdx];
      p.state = "SLIDING_BACK";
      p.slideRemaining = SLIDE_DIST_NORM * BASE_W;
      p.pauseTimer = 0;
      if (p.linkedEmptyMugId !== null) {
        const mi2 = gs.mugs.findIndex((mm) => mm.id === p.linkedEmptyMugId);
        if (mi2 >= 0) gs.mugs.splice(mi2, 1);
        p.linkedEmptyMugId = null;
      }
      gs.mugs.splice(i, 1);
    }
  }

  /* 7) Resolve failures */
  for (let i = gs.mugs.length - 1; i >= 0; i--) {
    const m = gs.mugs[i];
    if (m.type === "FULL") {
      const doorFail = DOOR_FAIL_X[m.barIdx] * BASE_W;
      if (m.x <= doorFail) {
        gs.lifeLossesThisTick++;
        playCrashSound();
        gs.mugs.splice(i, 1);
      }
    } else {
      const kegFail = KEG_FAIL_X[m.barIdx] * BASE_W;
      if (m.x >= kegFail) {
        const tkOnBar = gs.tkBarIdx === m.barIdx && gs.tkState === "IDLE";
        if (!tkOnBar) {
          gs.lifeLossesThisTick++;
          playCrashSound();
        }
        gs.mugs.splice(i, 1);
      }
    }
  }

  /* 8) Apply life losses */
  if (gs.lifeLossesThisTick > 0) {
    gs.lives = Math.max(0, gs.lives - gs.lifeLossesThisTick);
    if (gs.lives <= 0) {
      gs.phase = "GAME_OVER";
      gs.gameOverTimer = 2.0;
    }
  }
}

/* ─────────────────── Rendering ───────────────────────────────────── */
interface LoadedImages {
  background: HTMLImageElement;
  heart: HTMLImageElement;
  tkLeft: HTMLImageElement;
  tkRight: HTMLImageElement;
  mug: HTMLImageElement;
  mugEmpty: HTMLImageElement;
  patron1: HTMLImageElement;
  patron2: HTMLImageElement;
  patron3: HTMLImageElement;
}

function renderGame(
  ctx: CanvasRenderingContext2D,
  gs: GameState,
  imgs: LoadedImages,
  canvasW: number,
  canvasH: number
): void {
  const scaleX = canvasW / BASE_W;
  const scaleY = canvasH / BASE_H;

  ctx.clearRect(0, 0, canvasW, canvasH);

  /* Background */
  ctx.drawImage(imgs.background, 0, 0, canvasW, canvasH);

  /* HUD: timer */
  if (gs.phase === "PLAYING" || gs.phase === "GAME_OVER") {
    const hudFontSize = Math.round(HUD_H * scaleY * 1.6);
    ctx.font = `bold ${hudFontSize}px sans-serif`;
    ctx.fillStyle = "#fff";
    const timerText = `${Math.floor(gs.elapsed)}`;
    const px = 0.315 * canvasW;
    const py = 0.020 * canvasH;
    ctx.fillText(timerText, px + 4, py + hudFontSize);
  }

  /* HUD: hearts */
  if (gs.phase === "PLAYING" || gs.phase === "GAME_OVER") {
    const heartSize = Math.round(160 * Math.min(scaleX, scaleY));
    const gap = Math.round(4 * Math.min(scaleX, scaleY));
    const margin = Math.round(20 * scaleX);
    const startX = canvasW - (LIVES_START * (heartSize + gap)) - margin;
    const hy = Math.round(12 * scaleY);
    for (let i = 0; i < gs.lives; i++) {
      ctx.drawImage(imgs.heart, startX + i * (heartSize + gap), hy, heartSize, heartSize);
    }
  }

  /* Mugs */
  const mugDrawSize = Math.round(240 * Math.min(scaleX, scaleY));
  for (const m of gs.mugs) {
    const bar = BARS[m.barIdx];
    const sx = m.x * scaleX;
    const sy = bar.y * BASE_H * scaleY - 8;
    const img = m.type === "FULL" ? imgs.mug : imgs.mugEmpty;
    ctx.drawImage(img, sx - mugDrawSize / 2, sy - mugDrawSize / 2, mugDrawSize, mugDrawSize);
  }

  /* Patrons */
  const patronDrawSize = Math.round(300 * Math.min(scaleX, scaleY));
  for (const p of gs.patrons) {
    const bar = BARS[p.barIdx];
    const sx = p.x * scaleX;
    const sy = bar.y * BASE_H * scaleY - 40;
    const patronImg = imgs[p.imageKey];
    ctx.drawImage(
      patronImg,
      sx - patronDrawSize / 2,
      sy - patronDrawSize / 2,
      patronDrawSize,
      patronDrawSize
    );
  }

  /* Tavernkeeper */
  const tkDrawSize = Math.round(400 * Math.min(scaleX, scaleY));
  if (gs.phase === "PLAYING" || gs.phase === "GAME_OVER" || gs.phase === "COUNTDOWN") {
    const bar = BARS[gs.tkBarIdx];
    const tx =(bar.xKegCenter * BASE_W * scaleX) - 50;
    const ty = bar.y * BASE_H * scaleY;
    const tkImg = gs.tkState === "FILLING" ? imgs.tkRight : imgs.tkLeft;
    ctx.drawImage(tkImg, tx - tkDrawSize / 2, ty - tkDrawSize / 2, tkDrawSize, tkDrawSize);
  }

  /* Countdown overlay */
  if (gs.phase === "COUNTDOWN") {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvasW, canvasH);
    const fontSize = Math.round(120 * Math.min(scaleX, scaleY));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(gs.countdownValue), canvasW / 2, canvasH / 2);
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
  }

  /* Game-over overlay */
  if (gs.phase === "GAME_OVER" && gs.gameOverTimer > 0) {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, 0, canvasW, canvasH);
  }
}

/* ─────────────────── Image loader ────────────────────────────────── */
function loadImages(): Promise<LoadedImages> {
  const keys: (keyof typeof ASSET_URLS)[] = [
    "background",
    "heart",
    "tkLeft",
    "tkRight",
    "mug",
    "mugEmpty",
    "patron1",
    "patron2",
    "patron3",
  ];
  const map: Record<string, HTMLImageElement> = {};
  return Promise.all(
    keys.map(
      (k) =>
        new Promise<void>((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => {
            map[k] = img;
            resolve();
          };
          img.onerror = () => reject(new Error(`Failed to load ${k}`));
          img.src = ASSET_URLS[k];
        })
    )
  ).then(() => map as unknown as LoadedImages);
}

/* ═══════════════════ React Component ═════════════════════════════ */
export default function GauntletsPage() {
  const [showRules, setShowRules] = React.useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = React.useState(false);
  const [finalSeconds, setFinalSeconds] = React.useState(0);
  const [rewardGauntlets, setRewardGauntlets] = React.useState<GauntletsReward | null>(null);
  const [rewardXp, setRewardXp] = React.useState<number | null>(null);
  const [todayPlayCount, setTodayPlayCount] = React.useState<number | null>(null);
  const [isGameActive, setIsGameActive] = React.useState(false);
  const [imagesLoaded, setImagesLoaded] = React.useState(false);
  const router = useRouter();

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const gsRef = React.useRef<GameState>(freshState());
  const imgsRef = React.useRef<LoadedImages | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const lastTimeRef = React.useRef<number | null>(null);
  const accumulatorRef = React.useRef(0);
  const gameOverHandledRef = React.useRef(false);

  /* Load play count on mount */
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

  /* Preload images once */
  React.useEffect(() => {
    loadImages()
      .then((imgs) => {
        imgsRef.current = imgs;
        setImagesLoaded(true);
      })
      .catch((e) => console.error("Image load failed:", e));
  }, []);

  /* Canvas resize */
  const resizeCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const containerW = rect.width;
    const containerH = rect.height;
    const aspect = BASE_W / BASE_H;
    let drawW: number, drawH: number;
    if (containerW / containerH > aspect) {
      drawH = containerH;
      drawW = containerH * aspect;
    } else {
      drawW = containerW;
      drawH = containerW / aspect;
    }
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(drawW * dpr);
    canvas.height = Math.round(drawH * dpr);
    canvas.style.width = `${drawW}px`;
    canvas.style.height = `${drawH}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  React.useEffect(() => {
    if (!isGameActive) return;
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [isGameActive, resizeCanvas]);

  /* Determine which bar was clicked (in game coordinates) */
  const getClickedBar = React.useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return -1;
    const rect = canvas.getBoundingClientRect();
    const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    const normY = (clientY - rect.top) / rect.height;
    const gameY = normY * BASE_H;
    const laneHeight = (BASE_H - HUD_H) / NUM_BARS;
    for (let b = 0; b < NUM_BARS; b++) {
      const barCenterY = BARS[b].y * BASE_H;
      if (Math.abs(gameY - barCenterY) < laneHeight / 2) return b;
    }
    return -1;
  }, []);

  /* Main loop */
  const gameLoop = React.useCallback(
    (time: number) => {
      const gs = gsRef.current;
      if (gs.phase === "IDLE") {
        rafRef.current = null;
        return;
      }

      if (lastTimeRef.current === null) lastTimeRef.current = time;
      const frameDt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      accumulatorRef.current += frameDt;
      while (accumulatorRef.current >= FIXED_DT) {
        step(gs, FIXED_DT);
        accumulatorRef.current -= FIXED_DT;
      }

      /* Render */
      const canvas = canvasRef.current;
      const imgs = imgsRef.current;
      if (canvas && imgs) {
        const dpr = window.devicePixelRatio || 1;
        const drawW = canvas.width / dpr;
        const drawH = canvas.height / dpr;
        const ctx2 = canvas.getContext("2d");
        if (ctx2) renderGame(ctx2, gs, imgs, drawW, drawH);
      }

      /* Handle game-over transition (once) */
      if (gs.phase === "GAME_OVER" && gs.gameOverTimer <= 0 && !gameOverHandledRef.current) {
        gameOverHandledRef.current = true;
        const finalTime = Math.floor(gs.elapsed);
        setFinalSeconds(finalTime);
        (async () => {
          try {
            const userId = await getCurrentUserId();
            if (userId) {
              await updateTopScores(userId, finalTime);
              const rarity = await getRewardRarity(finalTime);
              if (rarity) {
                const gauntlets = await getRandomGauntletsByRarity(rarity);
                if (gauntlets) {
                  const alreadyHas = await checkUserHasItem(userId, gauntlets.id);
                  if (alreadyHas) {
                    const xpVal = RARITY_XP[gauntlets.rarity] ?? RARITY_XP.Base ?? 1;
                    await addXpToUser(userId, xpVal);
                    setRewardXp(xpVal);
                    setRewardGauntlets(null);
                  } else {
                    await addToInventory(userId, gauntlets.id);
                    setRewardGauntlets(gauntlets);
                    setRewardXp(null);
                  }
                }
              }
            }
          } catch (err) {
            console.error("Failed to process game end:", err);
          }
          setIsGameActive(false);
          setShowCompletionScreen(true);
        })();
        return;
      }

      rafRef.current = requestAnimationFrame(gameLoop);
    },
    []
  );

  const stopLoop = React.useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastTimeRef.current = null;
    accumulatorRef.current = 0;
  }, []);

  /* Start game */
  const startGame = React.useCallback(() => {
    stopLoop();
    gsRef.current = freshState();
    gsRef.current.phase = "COUNTDOWN";
    gsRef.current.countdownValue = 5;
    gsRef.current.countdownTimer = 1;
    gameOverHandledRef.current = false;
    setShowCompletionScreen(false);
    setRewardGauntlets(null);
    setRewardXp(null);
    setFinalSeconds(0);
    setIsGameActive(true);
    setTimeout(() => {
      resizeCanvas();
      rafRef.current = requestAnimationFrame(gameLoop);
    }, 0);
  }, [gameLoop, resizeCanvas, stopLoop]);

  /* Cleanup on unmount */
  React.useEffect(() => {
    return () => stopLoop();
  }, [stopLoop]);

  /* Input: keyboard */
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const gs = gsRef.current;
      if (gs.phase !== "PLAYING") return;
      if (gs.tkState === "FILLING") return;
      if (e.key === "ArrowUp" && !e.repeat) {
        e.preventDefault();
        gs.pendingMove = gs.tkBarIdx - 1;
      }
      if (e.key === "ArrowDown" && !e.repeat) {
        e.preventDefault();
        gs.pendingMove = gs.tkBarIdx + 1;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /* Input: mouse/touch on canvas */
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isGameActive) return;

    function handlePointer(e: MouseEvent | TouchEvent) {
      const gs = gsRef.current;
      if (gs.phase !== "PLAYING") return;
      if (gs.tkState === "FILLING") return;
      e.preventDefault();
      const bar = getClickedBar(e);
      if (bar < 0) return;
      if (bar === gs.tkBarIdx) {
        gs.pendingPour = true;
      } else {
        const dir = bar > gs.tkBarIdx ? 1 : -1;
        gs.pendingMove = gs.tkBarIdx + dir;
      }
    }

    canvas.addEventListener("mousedown", handlePointer);
    canvas.addEventListener("touchstart", handlePointer, { passive: false });
    return () => {
      canvas.removeEventListener("mousedown", handlePointer);
      canvas.removeEventListener("touchstart", handlePointer);
    };
  }, [isGameActive, getClickedBar]);

  /* Play game handler */
  const handlePlayGame = async () => {
    const userId = await getCurrentUserId();
    if (userId) {
      await updatePlayCount(userId);
      setTodayPlayCount((prev) => (prev !== null ? prev + 1 : null));
    }
    startGame();
  };

  const handleResetGame = React.useCallback(() => {
    stopLoop();
    gsRef.current = freshState();
    setShowCompletionScreen(false);
    setIsGameActive(false);
  }, [stopLoop]);

  const rulesText =
    "Hello Tavernkeeper.  Fill the mugs and provide the patrons with their drinks and do not let them get to the kegs while still thirsty.  Good luck!";

  /* Tada sound on completion */
  React.useEffect(() => {
    if (showCompletionScreen && (rewardGauntlets || rewardXp !== null)) {
      const audio = new Audio(
        "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/sounds/tada.mp3"
      );
      audio.play().catch(() => {});
    }
  }, [showCompletionScreen, rewardGauntlets, rewardXp]);

  /* ─────────── Completion screen ─────────── */
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

  /* ─────────── Main page ─────────── */
  return (
    <div className="space-y-6 p-6 min-h-screen bg-gray-200">
      <div className="flex justify-between items-center">
        <Button
          onClick={() => void handlePlayGame()}
          disabled={
            !imagesLoaded ||
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
        <div
          ref={containerRef}
          className="flex justify-center items-center w-full"
          style={{ height: "calc(100vh - 140px)" }}
        >
          <canvas
            ref={canvasRef}
            className="rounded-lg shadow-lg"
            style={{ display: "block", maxWidth: "100%", maxHeight: "100%" }}
          />
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
