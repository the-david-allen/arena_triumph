"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardData {
  card_id: string;
  color: string;
  slot: string;
  value: number;
  vertical_bonus: number | null;
  horizontal_bonus: number | null;
  slot_bonus: number;
}

interface CardProps {
  card: CardData;
  isHighlighted?: boolean;
  slotBonusActive?: boolean;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  className?: string;
}

export function Card({ card, isHighlighted = false, slotBonusActive = false, isDragging = false, onDragStart, className }: CardProps) {
  // #region agent log
  React.useEffect(() => {
    console.log('[DEBUG] Card rendered:', { 
      card_id: card.card_id, 
      color: card.color, 
      value: card.value, 
      slot: card.slot,
      slot_bonus: card.slot_bonus,
      horizontal_bonus: card.horizontal_bonus,
      vertical_bonus: card.vertical_bonus
    });
  }, [card]);
  // #endregion

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/json", JSON.stringify(card));
    e.dataTransfer.effectAllowed = "move";
    if (onDragStart) {
      onDragStart(e);
    }
  };

  // Ensure color is a valid CSS color value
  // Handle various color formats: hex (#fff, #ffffff), rgb, named colors
  const getBackgroundColor = (color: string): string => {
    if (!color || color.trim() === "") return "#4a5568"; // Default gray if no color
    
    const trimmedColor = color.trim();
    
    // If it's already a valid CSS color (starts with #, rgb, or is a named color), use it
    if (trimmedColor.startsWith("#") || trimmedColor.startsWith("rgb") || trimmedColor.startsWith("hsl")) {
      return trimmedColor;
    }
    
    // If it's a named color (like "red", "blue", etc.), use it directly
    // Common CSS named colors
    const namedColors = ["red", "blue", "green", "yellow", "orange", "purple", "pink", "brown", "black", "white", "gray", "grey"];
    if (namedColors.includes(trimmedColor.toLowerCase())) {
      return trimmedColor;
    }
    
    // Otherwise, assume it's a hex code without # and add it
    if (!trimmedColor.startsWith("#")) {
      // Remove any existing # and add a new one
      const hexCode = trimmedColor.replace(/^#/, "");
      // Validate hex code (6 or 3 characters)
      if (/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(hexCode)) {
        return `#${hexCode}`;
      }
    }
    
    return trimmedColor;
  };
  
  const backgroundColor = getBackgroundColor(card.color);
  
  // #region agent log
  console.log('[DEBUG] Card color processing:', { 
    originalColor: card.color, 
    processedColor: backgroundColor 
  });
  // #endregion
  // Use black text as specified
  const textColor = "text-black";

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "relative w-24 h-32 rounded-lg border-2 border-gray-800 shadow-lg cursor-move transition-all",
        "flex flex-col items-center justify-between p-2 font-bold",
        textColor,
        isHighlighted && "ring-4 ring-yellow-400 ring-opacity-75 shadow-xl",
        slotBonusActive && "border-4 border-yellow-500 shadow-2xl",
        isDragging && "scale-95",
        className
      )}
      style={{ 
        backgroundColor: backgroundColor,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {/* Slot name at top with "bonus: " */}
      <div className="absolute top-1 left-0 right-0 text-xs text-center font-semibold px-1">
        {card.slot} bonus:{" "}
        <span
          className={cn(
            "transition-all",
            slotBonusActive && "text-yellow-400 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse"
          )}
        >
          {card.slot_bonus}
        </span>
      </div>

      {/* Value centered vertically and horizontally */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-2xl font-bold">{card.value}</div>
      </div>

      {/* Horizontal bonus at bottom center with arrows */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-sm font-bold flex items-center gap-1">
        {card.horizontal_bonus !== null && (
          <>
            <span>←</span>
            <span>{card.horizontal_bonus}</span>
            <span>→</span>
          </>
        )}
      </div>

      {/* Vertical bonus vertically centered on the right with arrows above and below */}
      {card.vertical_bonus !== null && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 text-sm font-bold flex flex-col items-center gap-0.5">
          <span>↑</span>
          <span>{card.vertical_bonus}</span>
          <span>↓</span>
        </div>
      )}
    </div>
  );
}
