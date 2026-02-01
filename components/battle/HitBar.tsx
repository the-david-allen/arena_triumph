"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ZoneType = "green" | "yellow" | "white";

// Wireframe: two target zones, each with thin green surrounded by thicker yellow
// Layout: white | zone1(green-yellow-green) | white | zone2(green-yellow-green) | white
const ZONE_1_START = 5;
const ZONE_1_GREEN_END = 10;
const ZONE_1_YELLOW_END = 30;
const ZONE_1_END = 35;
const ZONE_2_START = 65;
const ZONE_2_GREEN_END = 70;
const ZONE_2_YELLOW_END = 90;
const ZONE_2_END = 95;
const TRAVEL_MS = 3000;

interface HitBarProps {
  isActive: boolean;
  onComplete: (clicks: ZoneType[]) => void;
}

export function HitBar({ isActive, onComplete }: HitBarProps) {
  const [linePosition, setLinePosition] = useState(0);
  const clicksRef = useRef<ZoneType[]>([]);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const isLeftToRightRef = useRef(true);
  onCompleteRef.current = onComplete;

  const getZoneAtPosition = useCallback((percent: number): ZoneType => {
    if (percent < ZONE_1_START) return "white";
    if (percent < ZONE_1_GREEN_END) return "green";
    if (percent < ZONE_1_YELLOW_END) return "yellow";
    if (percent < ZONE_1_END) return "green";
    if (percent < ZONE_2_START) return "white";
    if (percent < ZONE_2_GREEN_END) return "green";
    if (percent < ZONE_2_YELLOW_END) return "yellow";
    if (percent < ZONE_2_END) return "green";
    return "white";
  }, []);

  const handleClick = useCallback(() => {
    if (!isActive || hasCompletedRef.current) return;

    const zone = getZoneAtPosition(linePosition);
    clicksRef.current = [...clicksRef.current, zone];
  }, [isActive, linePosition, getZoneAtPosition]);

  useEffect(() => {
    if (!isActive) {
      clicksRef.current = [];
      setLinePosition(0);
      hasCompletedRef.current = false;
      return;
    }

    clicksRef.current = [];
    hasCompletedRef.current = false;
    isLeftToRightRef.current = Math.random() >= 0.5;

    const delay = Math.random() * (2000 - 20) + 20;
    startTimeRef.current = performance.now() + delay;

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      if (elapsed < 0) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(elapsed / TRAVEL_MS, 1);
      const position = isLeftToRightRef.current
        ? progress * 100
        : 100 - progress * 100;
      setLinePosition(position);

      if (progress >= 1) {
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          onCompleteRef.current([...clicksRef.current]);
        }
        return;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafRef.current);
  }, [isActive]);

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

  if (!isActive) return null;

  return (
    <div
      className="relative flex h-12 w-full cursor-pointer select-none overflow-hidden rounded-lg border border-border bg-background"
      onClick={handleClick}
    >
      <div className="absolute inset-0 flex">
        {/* Left white */}
        <div className="bg-muted" style={{ width: `${ZONE_1_START}%` }} />
        {/* Zone 1: thin green | thicker yellow | thin green */}
        <div
          className="bg-green-500"
          style={{ width: `${ZONE_1_GREEN_END - ZONE_1_START}%` }}
        />
        <div
          className="bg-yellow-500"
          style={{ width: `${ZONE_1_YELLOW_END - ZONE_1_GREEN_END}%` }}
        />
        <div
          className="bg-green-500"
          style={{ width: `${ZONE_1_END - ZONE_1_YELLOW_END}%` }}
        />
        {/* Middle white */}
        <div
          className="bg-muted"
          style={{ width: `${ZONE_2_START - ZONE_1_END}%` }}
        />
        {/* Zone 2: thin green | thicker yellow | thin green */}
        <div
          className="bg-green-500"
          style={{ width: `${ZONE_2_GREEN_END - ZONE_2_START}%` }}
        />
        <div
          className="bg-yellow-500"
          style={{ width: `${ZONE_2_YELLOW_END - ZONE_2_GREEN_END}%` }}
        />
        <div
          className="bg-green-500"
          style={{ width: `${ZONE_2_END - ZONE_2_YELLOW_END}%` }}
        />
        {/* Right white */}
        <div
          className="bg-muted"
          style={{ width: `${100 - ZONE_2_END}%` }}
        />
      </div>
      <div
        className="absolute top-0 bottom-0 w-1 bg-foreground transition-none"
        style={{
          left: `${linePosition}%`,
          transform: "translateX(-50%)",
        }}
      />
    </div>
  );
}
