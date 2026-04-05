"use client";

import { useMemo, useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export interface SpotlightProps {
  targetRect: DOMRect | null;
  padding?: number;
  borderRadius?: number;
  className?: string;
}

/**
 * Spotlight overlay: darkens the screen except for a cutout around the target.
 * Uses an SVG mask for the cutout.
 */
export function Spotlight({
  targetRect,
  padding = 8,
  borderRadius = 8,
  className,
}: SpotlightProps) {
  const cutout = useMemo(() => {
    if (!targetRect || typeof window === "undefined") return null;
    const x = Math.max(0, targetRect.left - padding);
    const y = Math.max(0, targetRect.top - padding);
    const w = Math.min(
      targetRect.width + padding * 2,
      window.innerWidth - x
    );
    const h = Math.min(
      targetRect.height + padding * 2,
      window.innerHeight - y
    );
    return { x, y, w, h };
  }, [targetRect, padding]);

  if (!targetRect || !cutout) return null;

  const maskId = useId().replace(/:/g, "-");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("pointer-events-none absolute inset-0", className)}
      aria-hidden
    >
      <svg width="100%" height="100%" className="block">
        <defs>
          <mask id={maskId}>
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={cutout.x}
              y={cutout.y}
              width={cutout.w}
              height={cutout.h}
              rx={borderRadius}
              ry={borderRadius}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.75)"
          mask={`url(#${maskId})`}
        />
      </svg>
    </motion.div>
  );
}
