"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RulesDialog({ open, onOpenChange }: RulesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Game Rules</DialogTitle>
          <DialogDescription className="whitespace-pre-line">
            {`Roll 4 dice at a time and separate them into 2 sets of 2.  Place these sets to fill out the grid.  You can only place in up to 3 distinct columns each turn though, so be careful or you might roll dice that you cannot place and lose your progress for the turn.  End your turn at any point to lock in the progress you've made so far this turn.

The game ends when you have completed the Helm, Chestpiece, and Belt columns and at least one Boots, Legs, Gauntlets, and Shoulders. Good luck!`}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
