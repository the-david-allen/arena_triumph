"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { Spotlight } from "./Spotlight";
import { TutorialTooltip } from "./TutorialTooltip";
import { GestureCoach } from "./GestureCoach";
import type { TutorialStep } from "@/lib/tutorial/types";

export interface TutorialOverlayProps {
  step: TutorialStep | null;
  targetRef: React.RefObject<HTMLElement | null>;
  targetRect: DOMRect | null;
  onAdvance: () => void;
  onBackdropClick?: () => void;
}

export function TutorialOverlay({
  step,
  targetRef,
  targetRect,
  onAdvance,
  onBackdropClick,
}: TutorialOverlayProps) {
  if (!step) return null;

  const showSpotlight =
    step.spotlight !== false &&
    step.targetId &&
    targetRect &&
    typeof window !== "undefined";

  const placement = step.placement ?? "bottom";
  const arrow = step.arrow ?? "none";
  const advanceOnTap = step.advanceOnTap ?? false;

  const handleBackdropClick = () => {
    if (advanceOnTap && onBackdropClick) {
      onBackdropClick();
    }
  };

  const overlay = (
    <div
      className="fixed inset-0 z-[9999]"
      style={{ touchAction: "none" }}
    >
      <div
        className="absolute inset-0"
        onClick={handleBackdropClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleBackdropClick();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Click to advance tutorial"
      />
      <AnimatePresence mode="wait">
        {showSpotlight && targetRect && (
          <Spotlight
            targetRect={targetRect}
            padding={
              typeof step.spotlight === "object" && step.spotlight?.padding
                ? step.spotlight.padding
                : 8
            }
            borderRadius={
              typeof step.spotlight === "object" && step.spotlight?.borderRadius
                ? step.spotlight.borderRadius
                : 8
            }
          />
        )}
      </AnimatePresence>
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        style={{ pointerEvents: "none" }}
      >
        <div
          className="pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <TutorialTooltip
            title={step.content.title}
            body={step.content.body}
            cta={step.content.cta}
            placement={placement}
            arrow={arrow}
            targetRect={step.targetId ? targetRect : null}
            onCtaClick={onAdvance}
            onBackdropClick={onBackdropClick}
            advanceOnTap={advanceOnTap}
          />
        </div>
      </div>
      {step.gestureHint && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2">
          <GestureCoach hint={step.gestureHint} />
        </div>
      )}
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(overlay, document.body);
  }
  return null;
}
