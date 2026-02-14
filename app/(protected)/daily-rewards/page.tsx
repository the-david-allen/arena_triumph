"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/ui/PageShell";
import { createClient } from "@/lib/supabase/client";
import {
  getDailyRewardState,
  claimDailyReward,
  DAILY_REWARDS_GEAR_SLOTS,
  type DailyRewardState,
  type ClaimedRewardItem,
} from "@/lib/daily-rewards";
import { cn } from "@/lib/utils";

const CDN_BASE_URL = "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/slots";
const TADA_SOUND_URL = "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/sounds/tada.mp3";

const gearTiles = [
  { name: "Helm", image: "helm.jpg" },
  { name: "Chestpiece", image: "chestpiece.jpg" },
  { name: "Boots", image: "boots.jpg" },
  { name: "Gauntlets", image: "gauntlets.jpg" },
  { name: "Leggings", image: "leggings.jpg" },
  { name: "Belt", image: "belt.jpg" },
  { name: "Shoulders", image: "shoulders.jpg" },
  { name: "Weapon", image: "weapon.jpg" },
];

function getSubtitle(
  state: DailyRewardState[string] | undefined,
  scoreLabel: string
): string {
  if (!state) return "Loading…";
  if (state.hasClaimed) return "Daily Reward claimed.";
  if (state.top10Count >= 10 && state.averageScore !== null) {
    return `Average of Top 10: ${state.averageScore} ${scoreLabel}`;
  }
  return "Less than 10 top scores found";
}

export default function DailyRewardsPage() {
  const router = useRouter();
  const [state, setState] = React.useState<DailyRewardState | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [rewardDialog, setRewardDialog] = React.useState<ClaimedRewardItem | null>(null);
  const [claimingGear, setClaimingGear] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) {
        if (!cancelled && !user) router.replace("/");
        return;
      }
      setUserId(user.id);
      const nextState = await getDailyRewardState(user.id);
      if (!cancelled) setState(nextState);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleClaim = React.useCallback(
    async (gearType: string) => {
      if (!userId || !state) return;
      const slotState = state[gearType];
      if (slotState?.hasClaimed || (slotState?.top10Count ?? 0) < 10) return;

      setClaimingGear(gearType);
      try {
        const item = await claimDailyReward(userId, gearType);
        if (item) {
          setRewardDialog(item);
          setState((prev) =>
            prev
              ? {
                  ...prev,
                  [gearType]: {
                    ...prev[gearType],
                    hasClaimed: true,
                    top10Count: prev[gearType].top10Count,
                    averageScore: prev[gearType].averageScore,
                  },
                }
              : null
          );
          const audio = new Audio(TADA_SOUND_URL);
          audio.play().catch(() => {});
        }
      } catch (err) {
        console.error("Failed to claim daily reward:", err);
      } finally {
        setClaimingGear(null);
      }
    },
    [userId, state]
  );

  const isLoading = state === null;
  const slotConfigByName = React.useMemo(() => {
    const map: Record<string, (typeof DAILY_REWARDS_GEAR_SLOTS)[number]> = {};
    for (const slot of DAILY_REWARDS_GEAR_SLOTS) {
      map[slot.name] = slot;
    }
    return map;
  }, []);

  return (
    <PageShell className="bg-bg">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Daily Rewards</h1>
          <p className="mt-2 text-muted-foreground">
            Once you have completed 10 games for a gear slot, each day you can
            claim a free reward for that slot based on the average of your Top
            10 scores.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {gearTiles.map((gear) => (
              <Card key={gear.name} className="h-full opacity-70">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    <Image
                      src={`${CDN_BASE_URL}/${gear.image}`}
                      alt={gear.name}
                      width={128}
                      height={128}
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <CardTitle className="text-lg">{gear.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">
                    Loading…
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {gearTiles.map((gear) => {
              const slotState = state?.[gear.name];
              const config = slotConfigByName[gear.name];
              const canClaim =
                slotState &&
                !slotState.hasClaimed &&
                slotState.top10Count >= 10;
              const disabled = !canClaim;
              const subtitle = getSubtitle(
                slotState,
                config?.scoreLabel ?? "points"
              );

              const cardContent = (
                <Card
                  className={cn(
                    "h-full",
                    disabled
                      ? "opacity-75 cursor-not-allowed pointer-events-none bg-muted/50"
                      : "transition-all hover:shadow-lg hover:scale-105 cursor-pointer"
                  )}
                >
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                      <Image
                        src={`${CDN_BASE_URL}/${gear.image}`}
                        alt={gear.name}
                        width={128}
                        height={128}
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <CardTitle className="text-lg">{gear.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground text-center">
                      {subtitle}
                    </p>
                  </CardContent>
                </Card>
              );

              if (disabled) {
                return <div key={gear.name}>{cardContent}</div>;
              }
              return (
                <button
                  key={gear.name}
                  type="button"
                  className="text-left w-full border-0 bg-transparent p-0"
                  onClick={() => void handleClaim(gear.name)}
                  disabled={claimingGear !== null}
                >
                  {cardContent}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!rewardDialog} onOpenChange={(open) => !open && setRewardDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reward claimed</DialogTitle>
          </DialogHeader>
          {rewardDialog && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You have been rewarded with:
              </p>
              <p className="text-xl font-semibold text-primary">
                {rewardDialog.name}
              </p>
              {rewardDialog.image_url && (
                <div className="flex justify-center">
                  <Image
                    src={rewardDialog.image_url}
                    alt={rewardDialog.name}
                    width={256}
                    height={256}
                    className="max-w-full h-auto max-h-64 rounded-lg object-contain"
                    unoptimized
                  />
                </div>
              )}
              <Button
                onClick={() => setRewardDialog(null)}
                className="w-full mt-4"
              >
                Ok
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
