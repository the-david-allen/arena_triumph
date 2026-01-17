"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardData } from "./Card";

interface GameSlotProps {
  slotName: string;
  card: CardData | null;
  isHighlighted?: boolean;
  slotBonusActive?: boolean;
  onDrop: (card: CardData) => void;
  onDragOver?: (e: React.DragEvent) => void;
  className?: string;
  showHorizontalLines?: boolean;
  showVerticalLines?: boolean;
  isLineHighlighted?: boolean;
}

export function GameSlot({
  slotName,
  card,
  isHighlighted = false,
  slotBonusActive = false,
  onDrop,
  onDragOver,
  className,
  showHorizontalLines = false,
  showVerticalLines = false,
  isLineHighlighted = false,
}: GameSlotProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
    if (onDragOver) {
      onDragOver(e);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (card) {
      // Slot already has a card
      return;
    }

    try {
      const cardData = JSON.parse(e.dataTransfer.getData("application/json")) as CardData;
      onDrop(cardData);
    } catch (error) {
      console.error("Failed to parse card data:", error);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative min-w-[100px] min-h-[140px] rounded-lg border-2 border-dashed border-gray-400",
        "flex items-center justify-center bg-gray-100/50 transition-all",
        isDragOver && !card && "border-blue-500 bg-blue-100/50 scale-105",
        card && "border-solid border-gray-600 bg-transparent",
        isHighlighted && "ring-2 ring-yellow-400",
        className
      )}
    >

      {card ? (
        <Card card={card} isHighlighted={isHighlighted} slotBonusActive={slotBonusActive} />
      ) : (
        <div className="text-xs text-gray-500 text-center px-2 font-medium">
          {slotName}
        </div>
      )}
    </div>
  );
}
