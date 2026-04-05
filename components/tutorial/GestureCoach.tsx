"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export type GestureHint = "tap" | "drag" | "swipe" | "long-press" | "double-tap";

export interface GestureCoachProps {
  hint: GestureHint;
  className?: string;
}

export function GestureCoach({ hint, className }: GestureCoachProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("pointer-events-none flex items-center justify-center", className)}
      aria-hidden
    >
      {hint === "tap" && <TapAnimation />}
      {hint === "drag" && <DragAnimation />}
      {hint === "swipe" && <SwipeAnimation />}
      {hint === "long-press" && <LongPressAnimation />}
      {hint === "double-tap" && <DoubleTapAnimation />}
    </motion.div>
  );
}

function TapAnimation() {
  return (
    <div className="relative h-16 w-16">
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
        className="absolute inset-0 rounded-full bg-primary/30"
      />
      <motion.div
        animate={{ scale: [0.8, 1.2, 0.8] }}
        transition={{ repeat: Infinity, duration: 1.2, delay: 0.1 }}
        className="absolute inset-2 rounded-full border-2 border-primary"
      />
    </div>
  );
}

function DragAnimation() {
  return (
    <motion.div
      animate={{ x: [0, 40, 0] }}
      transition={{ repeat: Infinity, duration: 1.5 }}
      className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3" />
      </svg>
    </motion.div>
  );
}

function SwipeAnimation() {
  return (
    <motion.div
      animate={{ x: [0, 60, 0] }}
      transition={{ repeat: Infinity, duration: 1.2 }}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20"
    >
      <span className="text-lg">→</span>
    </motion.div>
  );
}

function LongPressAnimation() {
  return (
    <motion.div
      animate={{ scale: [1, 1.1, 1.1] }}
      transition={{ repeat: Infinity, duration: 2, times: [0, 0.2, 1] }}
      className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary"
    >
      <span className="text-xs font-medium">Hold</span>
    </motion.div>
  );
}

function DoubleTapAnimation() {
  return (
    <div className="flex gap-1">
      <motion.div
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
        className="h-3 w-3 rounded-full bg-primary"
      />
      <motion.div
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
        className="h-3 w-3 rounded-full bg-primary"
      />
    </div>
  );
}
