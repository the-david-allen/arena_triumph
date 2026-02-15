"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { AffinityStrengthsDialog } from "@/components/AffinityStrengthsDialog";
import { cn } from "@/lib/cn";

const GAME_LOOP_IMAGE =
  "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/bling/game_loop.png";

export function MainLandingPage() {
  const [affinityOpen, setAffinityOpen] = useState(false);

  return (
    <>
      <div className="min-h-[60vh] flex flex-col items-center">
        <h1 className="font-display text-4xl font-bold tracking-tight text-text sm:text-5xl md:text-6xl text-center">
          Can you Triumph in the Arena?
        </h1>

        <img
          src={GAME_LOOP_IMAGE}
          alt="Game loop"
          className="mt-6 w-full max-w-2xl object-contain"
        />

        <div className="mt-8 flex w-full max-w-2xl justify-between gap-4 px-4">
          <Link
            href="/daily-rewards"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "min-h-[44px] min-w-[140px] sm:min-w-[160px]"
            )}
          >
            Daily Rewards
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="min-h-[44px] min-w-[140px] sm:min-w-[160px]"
            onClick={() => setAffinityOpen(true)}
          >
            Affinity Reference
          </Button>
        </div>
      </div>

      <AffinityStrengthsDialog open={affinityOpen} onOpenChange={setAffinityOpen} />
    </>
  );
}
