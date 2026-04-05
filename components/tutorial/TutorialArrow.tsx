"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export type ArrowDirection = "top" | "bottom" | "left" | "right";

export interface TutorialArrowProps {
  direction: ArrowDirection;
  className?: string;
}

const ROTATIONS: Record<ArrowDirection, string> = {
  top: "rotate-0",
  bottom: "rotate-180",
  left: "-rotate-90",
  right: "rotate-90",
};

export function TutorialArrow({ direction, className }: TutorialArrowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn("inline-flex", ROTATIONS[direction], className)}
      aria-hidden
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 5v14M12 5l-6 6M12 5l6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
}
