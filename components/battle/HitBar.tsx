"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ZoneType = "green" | "yellow" | "white";

// Two target zones: one inner green strip on each side surrounded by yellow
// Green widened ~75% (1.5% -> 2.625%), yellow thinned ~40% (14% -> 8.4%)
const ZONE_1_START = 5;
const ZONE_1_YELLOW_END = 13.4;   // yellow outer left (8.4%)
const ZONE_1_GREEN_END = 16.025;  // green inner (2.625%)
const ZONE_1_END = 24.425;        // yellow outer right (8.4%)
const ZONE_2_START = 75.575;
const ZONE_2_YELLOW_END = 83.975; // yellow outer left (8.4%)
const ZONE_2_GREEN_END = 86.6;    // green inner (2.625%)
const ZONE_2_END = 95;            // yellow outer right (8.4%)
const TRAVEL_MS = 3000;
const CLICK_MARKER_DURATION_MS = 1750;

interface HitBarProps {
  isActive: boolean;
  onComplete: (clicks: ZoneType[]) => void;
}

interface ClickMarker {
  id: number;
  position: number;
}

export function HitBar({ isActive, onComplete }: HitBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [linePosition, setLinePosition] = useState(0);
  const [clickMarkers, setClickMarkers] = useState<ClickMarker[]>([]);
  const clicksRef = useRef<ZoneType[]>([]);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const isLeftToRightRef = useRef(true);
  onCompleteRef.current = onComplete;

  const getZoneAtPosition = useCallback((percent: number): ZoneType => {
    if (percent < ZONE_1_START) return "white";
    if (percent < ZONE_1_YELLOW_END) return "yellow";
    if (percent < ZONE_1_GREEN_END) return "green";
    if (percent < ZONE_1_END) return "yellow";
    if (percent < ZONE_2_START) return "white";
    if (percent < ZONE_2_YELLOW_END) return "yellow";
    if (percent < ZONE_2_GREEN_END) return "green";
    if (percent < ZONE_2_END) return "yellow";
    return "white";
  }, []);

  const handleClick = useCallback(
    (e?: React.MouseEvent | React.TouchEvent) => {
      if (!isActive || hasCompletedRef.current) return;

      const zone = getZoneAtPosition(linePosition);
      clicksRef.current = [...clicksRef.current, zone];

      if (barRef.current && e) {
        const ev = e as React.MouseEvent & React.TouchEvent;
        const clientX =
          ev.touches?.[0]?.clientX ??
          ev.changedTouches?.[0]?.clientX ??
          ev.clientX;
        if (typeof clientX === "number") {
          const rect = barRef.current.getBoundingClientRect();
          const position = Math.max(
            0,
            Math.min(100, ((clientX - rect.left) / rect.width) * 100)
          );
          const id = Date.now();
          setClickMarkers((prev) => [...prev, { id, position }]);
          setTimeout(() => {
            setClickMarkers((prev) => prev.filter((m) => m.id !== id));
          }, CLICK_MARKER_DURATION_MS);
        }
      }
    },
    [isActive, linePosition, getZoneAtPosition]
  );

  useEffect(() => {
    if (!isActive) {
      clicksRef.current = [];
      setLinePosition(0);
      setClickMarkers([]);
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

    const handler = (e: MouseEvent | TouchEvent) => {
      handleClick(e as unknown as React.MouseEvent);
    };
    window.addEventListener("mousedown", handler);
    window.addEventListener("touchstart", handler, { passive: true });

    return () => {
      window.removeEventListener("mousedown", handler);
      window.removeEventListener("touchstart", handler);
    };
  }, [isActive, handleClick]);

  return (
    <div
      ref={barRef}
      className={`relative h-12 w-full min-h-12 select-none overflow-hidden rounded-lg border border-border bg-background ${
        isActive ? "cursor-pointer" : "cursor-default opacity-80"
      }`}
    >
      <div className="absolute inset-0 flex w-full flex-nowrap">
        {/* Left white */}
        <div
          className="min-w-0 shrink-0 grow-0 bg-muted"
          style={{ width: `${ZONE_1_START}%` }}
        />
        {/* Zone 1: yellow | thin green | yellow */}
        <div
          className="min-w-0 shrink-0 grow-0 bg-yellow-500"
          style={{ width: `${ZONE_1_YELLOW_END - ZONE_1_START}%` }}
        />
        <div
          className="min-w-0 shrink-0 grow-0 bg-green-500"
          style={{ width: `${ZONE_1_GREEN_END - ZONE_1_YELLOW_END}%` }}
        />
        <div
          className="min-w-0 shrink-0 grow-0 bg-yellow-500"
          style={{ width: `${ZONE_1_END - ZONE_1_GREEN_END}%` }}
        />
        {/* Middle white */}
        <div
          className="min-w-0 shrink-0 grow-0 bg-muted"
          style={{ width: `${ZONE_2_START - ZONE_1_END}%` }}
        />
        {/* Zone 2: yellow | thin green | yellow */}
        <div
          className="min-w-0 shrink-0 grow-0 bg-yellow-500"
          style={{ width: `${ZONE_2_YELLOW_END - ZONE_2_START}%` }}
        />
        <div
          className="min-w-0 shrink-0 grow-0 bg-green-500"
          style={{ width: `${ZONE_2_GREEN_END - ZONE_2_YELLOW_END}%` }}
        />
        <div
          className="min-w-0 shrink-0 grow-0 bg-yellow-500"
          style={{ width: `${ZONE_2_END - ZONE_2_GREEN_END}%` }}
        />
        {/* Right white */}
        <div
          className="min-w-0 shrink-0 grow-0 bg-muted"
          style={{ width: `${100 - ZONE_2_END}%` }}
        />
      </div>
      {isActive && (
        <div
          className="absolute top-0 bottom-0 w-1 bg-foreground transition-none"
          style={{
            left: `${linePosition}%`,
            transform: "translateX(-50%)",
          }}
        />
      )}
      {clickMarkers.map((marker) => (
        <div
          key={marker.id}
          className="absolute top-0 bottom-0 w-0 border-l-2 border-dashed border-foreground/70 pointer-events-none"
          style={{
            left: `${marker.position}%`,
            transform: "translateX(-50%)",
          }}
        />
      ))}
    </div>
  );
}
