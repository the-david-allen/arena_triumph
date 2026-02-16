"use client";

import Image from "next/image";
import { ITEM_IMAGES, ITEM_NAMES } from "@/lib/scouting-game";
import { cn } from "@/lib/utils";

interface GridCellProps {
  row: number;
  col: number;
  visibleItems: Set<number>;
  resolved: boolean;
  resolvedItem: number;
  onLeftClick: (row: number, col: number, item: number) => void;
  onRightClick: (row: number, col: number, item: number) => void;
  disabled: boolean;
}

export function GridCell({
  row,
  col,
  visibleItems,
  resolved,
  resolvedItem,
  onLeftClick,
  onRightClick,
  disabled,
}: GridCellProps) {
  if (resolved) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-md border-2 border-emerald-500 bg-emerald-950/30 p-1">
        <Image
          src={ITEM_IMAGES[row][resolvedItem]}
          alt={ITEM_NAMES[row][resolvedItem]}
          width={80}
          height={80}
          className="h-full w-full object-contain"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5 rounded-md border border-border bg-card p-0.5">
      {[0, 1, 2, 3].map((item) => (
        <button
          key={item}
          type="button"
          disabled={disabled || !visibleItems.has(item)}
          onClick={(e) => {
            e.preventDefault();
            if (!disabled && visibleItems.has(item)) {
              onLeftClick(row, col, item);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            if (!disabled && visibleItems.has(item)) {
              onRightClick(row, col, item);
            }
          }}
          className={cn(
            "relative flex items-center justify-center rounded-sm transition-all",
            visibleItems.has(item)
              ? "cursor-pointer hover:bg-accent/50 hover:ring-1 hover:ring-ring"
              : "invisible"
          )}
        >
          {visibleItems.has(item) && (
            <Image
              src={ITEM_IMAGES[row][item]}
              alt={ITEM_NAMES[row][item]}
              width={36}
              height={36}
              className="h-full w-full object-contain"
              unoptimized
            />
          )}
        </button>
      ))}
    </div>
  );
}
