"use client";

import Image from "next/image";
import { type Clue, getItemImage, getItemName } from "@/lib/scouting-game";

interface ClueDisplayProps {
  clue: Clue;
}

function ItemImg({ row, item }: { row: number; item: number }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border bg-card p-0.5 sm:h-12 sm:w-12">
      <Image
        src={getItemImage({ row, item })}
        alt={getItemName({ row, item })}
        width={40}
        height={40}
        className="h-full w-full object-contain"
        unoptimized
      />
    </div>
  );
}

export function ClueDisplay({ clue }: ClueDisplayProps) {
  switch (clue.type) {
    case "before":
      return (
        <div className="flex items-center gap-1.5">
          <ItemImg row={clue.a.row} item={clue.a.item} />
          <span className="text-lg text-muted-foreground">&rarr;</span>
          <ItemImg row={clue.b.row} item={clue.b.item} />
        </div>
      );

    case "adjacent":
      return (
        <div className="flex items-center gap-1.5">
          <ItemImg row={clue.a.row} item={clue.a.item} />
          <span className="text-lg text-muted-foreground">&harr;</span>
          <ItemImg row={clue.b.row} item={clue.b.item} />
        </div>
      );

    case "hTrio":
      return (
        <div className="flex flex-col items-center gap-0">
          <span className="text-xs text-muted-foreground">&rarr;</span>
          <div className="flex items-center gap-1">
            <ItemImg row={clue.a.row} item={clue.a.item} />
            <ItemImg row={clue.b.row} item={clue.b.item} />
            <ItemImg row={clue.c.row} item={clue.c.item} />
          </div>
          <span className="text-xs text-muted-foreground">&larr;</span>
        </div>
      );

    case "vTrio":
      return (
        <div className="flex flex-col items-center gap-1">
          <ItemImg row={clue.a.row} item={clue.a.item} />
          <ItemImg row={clue.b.row} item={clue.b.item} />
          <ItemImg row={clue.c.row} item={clue.c.item} />
        </div>
      );

    case "above":
      return (
        <div className="flex flex-col items-center gap-1">
          <ItemImg row={clue.a.row} item={clue.a.item} />
          <ItemImg row={clue.b.row} item={clue.b.item} />
        </div>
      );
  }
}
