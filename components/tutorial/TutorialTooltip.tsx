"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TutorialArrow, type ArrowDirection } from "./TutorialArrow";
import { cn } from "@/lib/cn";

export interface TutorialTooltipProps {
  title?: string;
  body: string;
  cta?: string;
  placement: "top" | "bottom" | "left" | "right" | "center";
  arrow?: ArrowDirection | "none";
  targetRect: DOMRect | null;
  onCtaClick?: () => void;
  onBackdropClick?: () => void;
  advanceOnTap?: boolean;
  className?: string;
}

const ARROW_FROM_PLACEMENT: Record<string, ArrowDirection> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
  center: "top",
};

export function TutorialTooltip({
  title,
  body,
  cta,
  placement,
  arrow = "none",
  targetRect,
  onCtaClick,
  onBackdropClick,
  advanceOnTap = false,
  className,
}: TutorialTooltipProps) {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });


  React.useEffect(() => {
    if (placement === "center") {
      setPosition({
        x: typeof window !== "undefined" ? window.innerWidth / 2 - 150 : 0,
        y: typeof window !== "undefined" ? window.innerHeight / 2 - 80 : 0,
      });
      return;
    }
    if (!targetRect) return;
    const rect = targetRect;
    let x = rect.left + rect.width / 2 - 150;
    let y = rect.top + rect.height / 2 - 40;
    if (placement === "top") y = rect.top - 120;
    else if (placement === "bottom") y = rect.bottom + 12;
    else if (placement === "left") {
      x = rect.left - 320;
      y = rect.top + rect.height / 2 - 60;
    } else if (placement === "right") {
      x = rect.right + 12;
      y = rect.top + rect.height / 2 - 60;
    }
    setPosition({
      x: Math.max(16, Math.min(x, (typeof window !== "undefined" ? window.innerWidth : 400) - 316)),
      y: Math.max(16, Math.min(y, (typeof window !== "undefined" ? window.innerHeight : 600) - 140)),
    });
  }, [placement, targetRect]);

  const effectiveArrow: ArrowDirection =
    arrow === "none" ? (ARROW_FROM_PLACEMENT[placement] ?? "top") : arrow;
  const showArrow = arrow !== "none";

  const content = (
    <motion.div
      initial={{ opacity: 0, y: placement === "top" ? 8 : placement === "bottom" ? -8 : 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn(
        "relative z-[10001] max-w-[300px] rounded-lg border border-border bg-card p-4 shadow-lg",
        "text-card-foreground",
        className
      )}
      style={
        placement === "center"
          ? {
              position: "fixed",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }
          : {
              position: "fixed",
              left: position.x,
              top: position.y,
            }
      }
    >
      {showArrow && (
        <div
          className={cn(
            "absolute flex justify-center",
            effectiveArrow === "top" && "-top-3 left-1/2 -translate-x-1/2",
            effectiveArrow === "bottom" && "-bottom-3 left-1/2 -translate-x-1/2",
            effectiveArrow === "left" && "-left-3 top-1/2 -translate-y-1/2",
            effectiveArrow === "right" && "-right-3 top-1/2 -translate-y-1/2"
          )}
        >
          <TutorialArrow direction={effectiveArrow} className="text-card" />
        </div>
      )}
      {title && (
        <h3 className="mb-2 text-base font-semibold">{title}</h3>
      )}
      <p className="mb-4 text-sm text-muted-foreground">{body}</p>
      {cta && (
        <Button
          size="md"
          className="min-h-[44px]"
          onClick={onCtaClick}
        >
          {cta}
        </Button>
      )}
    </motion.div>
  );

  return content;
}
