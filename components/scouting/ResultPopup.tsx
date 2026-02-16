"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface BossInfo {
  name: string;
  imageUrl: string | null;
  attackAffinity: string;
  defenseAffinity: string;
}

interface ResultPopupProps {
  open: boolean;
  success: boolean;
  bossInfo: BossInfo | null;
  onClose: () => void;
}

export function ResultPopup({
  open,
  success,
  bossInfo,
  onClose,
}: ResultPopupProps) {
  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {success ? "Scouting succeeded!" : "Scouting failed."}
          </DialogTitle>
          {success && bossInfo ? (
            <DialogDescription asChild>
              <div className="flex flex-col items-center gap-3 pt-3">
                {bossInfo.imageUrl && (
                  <Image
                    src={bossInfo.imageUrl}
                    alt={bossInfo.name}
                    width={120}
                    height={120}
                    className="rounded-lg border border-border object-contain"
                    unoptimized
                  />
                )}
                <span className="text-lg font-semibold text-foreground">
                  {bossInfo.name}
                </span>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>
                    Attack: <strong>{bossInfo.attackAffinity}</strong>
                  </span>
                  <span>
                    Defense: <strong>{bossInfo.defenseAffinity}</strong>
                  </span>
                </div>
              </div>
            </DialogDescription>
          ) : (
            <DialogDescription>
              {success
                ? "Loading boss information..."
                : "Better luck next time. You can still battle, but the boss identity remains hidden."}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>Back to Boss Line-up</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
