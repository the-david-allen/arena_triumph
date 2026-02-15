"use client";

import { useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/ui/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { AffinityStrengthsDialog } from "@/components/AffinityStrengthsDialog";
import { cn } from "@/lib/cn";

export function MainLandingPage() {
  const [affinityOpen, setAffinityOpen] = useState(false);

  return (
    <>
      <PageShell
        className="min-h-[60vh] bg-bg bg-[radial-gradient(ellipse_80%_80%_at_50%_0%,hsl(var(--surface)/0.25),transparent)]"
        maxWidth="7xl"
      >
        <div className="flex flex-col items-center text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-text sm:text-5xl">
            Welcome to the Arena
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Can you triumph?
          </p>
          <p className="mt-1 max-w-2xl text-base text-muted-foreground/80 sm:text-lg">
            Obtain Gear → Manage Your Inventory → Battle Bosses
          </p>

          <div className="mt-8 flex w-full flex-col gap-4 sm:flex-row sm:justify-center sm:gap-6">
            <Link
              href="/daily-rewards"
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
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

        <Card className="mt-10 transition-shadow hover:shadow-md">
          <CardContent className="pt-6">
            <div className="space-y-3 text-center font-body text-text">
              <p className="text-base text-muted-foreground sm:text-lg">
                You&apos;ll need to master a number of challenges to have a
                chance at beating some of the Arena bosses.
              </p>
              <p className="text-base text-muted-foreground sm:text-lg">
                Obtain Gear for your armor and weapon slots by beating that
                slot&apos;s challenge — the better you do, the better gear
                you&apos;ll receive.
              </p>
              <p className="text-base text-muted-foreground sm:text-lg">
                Manage your Inventory by equipping or removing gear.
              </p>
              <p className="text-base text-muted-foreground sm:text-lg">
                When you&apos;re ready, Battle to test your strength against
                today&apos;s Arena bosses.
              </p>
            </div>
          </CardContent>
        </Card>
      </PageShell>

      <AffinityStrengthsDialog open={affinityOpen} onOpenChange={setAffinityOpen} />
    </>
  );
}
