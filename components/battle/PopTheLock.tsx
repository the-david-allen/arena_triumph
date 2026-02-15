"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type HitAccuracy = "perfect" | "good" | "miss";

/* ─── Arc geometry (right-facing semi-circle) ─── */
const CX = 15;
const CY = 105;
const R = 85;
const TRACK_W = 20;
const IR = R - TRACK_W / 2; // 75
const OR = R + TRACK_W / 2; // 95
const DOT_RADIUS = 10;

/* Zone widths as fraction of arc (0→1 maps top→bottom, -90° → +90°) */
const GREEN_HALF = 0.03; // ±3% → 6% green band
const YELLOW_HALF = 0.108; // ±10.8% → ~21.6% total zone (~15.6% yellow)

/* Timing */
const SWEEP_MS = 1000; // ms for one sweep (end-to-end)

/* ─── Helpers ─── */

/** Map arc parameter t ∈ [0, 1] to angle in radians (-π/2 → +π/2) */
function tToAngle(t: number): number {
  return -Math.PI / 2 + t * Math.PI;
}

/** Map arc parameter t to a point on the arc at given radius */
function tToXY(t: number, r: number = R): [number, number] {
  const a = tToAngle(t);
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

/** Format a number for SVG path data */
function n(v: number): string {
  return v.toFixed(2);
}

/** Full semi-circle track path (split into two 90° quadrants for SVG stability) */
function fullTrackPath(): string {
  const otx = CX;
  const oty = CY - OR;
  const omx = CX + OR;
  const omy = CY;
  const obx = CX;
  const oby = CY + OR;
  const ibx = CX;
  const iby = CY + IR;
  const imx = CX + IR;
  const imy = CY;
  const itx = CX;
  const ity = CY - IR;
  return [
    `M${otx} ${oty}`,
    `A${OR} ${OR} 0 0 1 ${omx} ${omy}`,
    `A${OR} ${OR} 0 0 1 ${obx} ${oby}`,
    `L${ibx} ${iby}`,
    `A${IR} ${IR} 0 0 0 ${imx} ${imy}`,
    `A${IR} ${IR} 0 0 0 ${itx} ${ity}`,
    "Z",
  ].join(" ");
}

/** Ring segment path for a sub-portion of the arc (always < 180°) */
function zonePath(t0: number, t1: number): string {
  const s = Math.max(0, t0);
  const e = Math.min(1, t1);
  if (e <= s) return "";
  const a0 = tToAngle(s);
  const a1 = tToAngle(e);
  const lg = a1 - a0 > Math.PI ? 1 : 0;
  return [
    `M${n(CX + OR * Math.cos(a0))} ${n(CY + OR * Math.sin(a0))}`,
    `A${OR} ${OR} 0 ${lg} 1 ${n(CX + OR * Math.cos(a1))} ${n(CY + OR * Math.sin(a1))}`,
    `L${n(CX + IR * Math.cos(a1))} ${n(CY + IR * Math.sin(a1))}`,
    `A${IR} ${IR} 0 ${lg} 0 ${n(CX + IR * Math.cos(a0))} ${n(CY + IR * Math.sin(a0))}`,
    "Z",
  ].join(" ");
}

/* ─── Component ─── */

interface PopTheLockProps {
  /** Player turn — indicator animates, clicks are registered */
  isActive: boolean;
  /** Boss turn — indicator animates decoratively, no clicks */
  isSpinning: boolean;
  /** Called with the accuracy result after the player clicks */
  onHit: (accuracy: HitAccuracy) => void;
}

export function PopTheLock({ isActive, isSpinning, onHit }: PopTheLockProps) {
  const [indicatorT, setIndicatorT] = useState(0);
  const [target, setTarget] = useState(0.5);
  const [flash, setFlash] = useState<HitAccuracy | null>(null);

  const rafRef = useRef(0);
  const tRef = useRef(0);
  const clickedRef = useRef(false);
  const onHitRef = useRef(onHit);
  onHitRef.current = onHit;
  const startFromBottomRef = useRef(false);

  /* Randomize target zone and start direction each player turn */
  useEffect(() => {
    if (!isActive) return;
    const margin = YELLOW_HALF + 0.02;
    setTarget(margin + Math.random() * (1 - 2 * margin));
    startFromBottomRef.current = Math.random() >= 0.5;
    clickedRef.current = false;
    setFlash(null);
  }, [isActive]);

  /* Single-sweep animation during player turn (no bounce) */
  useEffect(() => {
    if (!isActive) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const origin = performance.now();
    const reverse = startFromBottomRef.current;

    function animate(now: number) {
      if (clickedRef.current) return; // freeze after click

      const elapsed = now - origin;
      const progress = Math.min(elapsed / SWEEP_MS, 1);
      const t = reverse ? 1 - progress : progress;
      tRef.current = t;
      setIndicatorT(t);

      if (progress >= 1) {
        // Reached the end without clicking — auto-miss
        if (!clickedRef.current) {
          clickedRef.current = true;
          setFlash("miss");
          setTimeout(() => {
            setFlash(null);
            onHitRef.current("miss");
          }, 400);
        }
        return;
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isActive]);

  /* Click / tap handler */
  const handleClick = useCallback(() => {
    if (!isActive || clickedRef.current) return;
    clickedRef.current = true;

    const dist = Math.abs(tRef.current - target);
    let accuracy: HitAccuracy;
    if (dist <= GREEN_HALF) {
      accuracy = "perfect";
    } else if (dist <= YELLOW_HALF) {
      accuracy = "good";
    } else {
      accuracy = "miss";
    }

    setFlash(accuracy);
    setTimeout(() => {
      setFlash(null);
      onHitRef.current(accuracy);
    }, 400);
  }, [isActive, target]);

  /* Global click / touch listeners during player turn */
  useEffect(() => {
    if (!isActive) return;
    const handler = () => handleClick();
    window.addEventListener("mousedown", handler);
    window.addEventListener("touchstart", handler, { passive: true });
    return () => {
      window.removeEventListener("mousedown", handler);
      window.removeEventListener("touchstart", handler);
    };
  }, [isActive, handleClick]);

  /* ─── Derived rendering values ─── */
  const [dotX, dotY] = tToXY(indicatorT);

  const yellowStart = Math.max(0, target - YELLOW_HALF);
  const yellowEnd = Math.min(1, target + YELLOW_HALF);
  const greenStart = Math.max(0, target - GREEN_HALF);
  const greenEnd = Math.min(1, target + GREEN_HALF);

  const dotColor =
    flash === "perfect"
      ? "#22c55e"
      : flash === "good"
        ? "#eab308"
        : flash === "miss"
          ? "#ef4444"
          : "hsl(var(--text))";

  return (
    <div
      className="flex items-center justify-center"
      style={{ maxWidth: 180, maxHeight: 300 }}
    >
      <svg
        viewBox="0 0 125 210"
        width={180}
        height={300}
        className={[
          "select-none",
          isActive ? "cursor-pointer" : "cursor-default",
        ].join(" ")}
        aria-label="Timing lock"
      >
        {/* Track background */}
        <path
          d={fullTrackPath()}
          fill="hsl(var(--surface-2))"
          stroke="hsl(var(--border))"
          strokeWidth={1.5}
        />

        {/* Yellow zone */}
        {isActive && (
          <path
            d={zonePath(yellowStart, yellowEnd)}
            fill="#eab308"
            opacity={0.5}
          />
        )}

        {/* Green zone (drawn on top of yellow) */}
        {isActive && (
          <path
            d={zonePath(greenStart, greenEnd)}
            fill="#22c55e"
            opacity={0.65}
          />
        )}

        {/* Indicator glow */}
        {isActive && (
          <circle
            cx={dotX}
            cy={dotY}
            r={DOT_RADIUS + 5}
            fill={dotColor}
            opacity={0.2}
          />
        )}

        {/* Indicator dot */}
        {isActive && (
          <circle
            cx={dotX}
            cy={dotY}
            r={DOT_RADIUS}
            fill={dotColor}
          />
        )}
      </svg>
    </div>
  );
}
