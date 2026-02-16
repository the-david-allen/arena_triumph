"use client";

import { ROW_LABELS } from "@/lib/scouting-game";
import { GridCell } from "./GridCell";

export interface CellState {
  visibleItems: Set<number>;
  resolved: boolean;
  resolvedItem: number;
}

interface MainGridProps {
  cells: CellState[][];
  onLeftClick: (row: number, col: number, item: number) => void;
  onRightClick: (row: number, col: number, item: number) => void;
  disabled: boolean;
}

export function MainGrid({
  cells,
  onLeftClick,
  onRightClick,
  disabled,
}: MainGridProps) {
  return (
    <div
      className="grid grid-cols-4 gap-2"
      onContextMenu={(e) => e.preventDefault()}
    >
      {cells.map((rowCells, row) =>
        rowCells.map((cell, col) => (
          <div
            key={`${row}-${col}`}
            className="relative aspect-square w-full"
          >
            {col === 0 && (
              <span className="absolute -left-2 top-1/2 -translate-x-full -translate-y-1/2 text-[10px] font-semibold text-muted-foreground sm:text-xs">
                {ROW_LABELS[row]}
              </span>
            )}
            <GridCell
              row={row}
              col={col}
              visibleItems={cell.visibleItems}
              resolved={cell.resolved}
              resolvedItem={cell.resolvedItem}
              onLeftClick={onLeftClick}
              onRightClick={onRightClick}
              disabled={disabled}
            />
          </div>
        ))
      )}
    </div>
  );
}
