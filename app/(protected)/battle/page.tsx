"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAffinityIconUrl } from "@/lib/inventory";
import { cn } from "@/lib/utils";

const TIER_BORDER_COLORS: Record<number, string> = {
  1: "rgb(70, 180, 90)",
  2: "rgb(167, 139, 253)",
  3: "rgb(255, 155, 1)",
  4: "rgb(230, 0, 38)",
};

const TIER_VIDEO_SOURCES: Record<number, string> = {
  1: "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/bling/boss_rotation1.webm",
  2: "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/bling/boss_rotation2.webm",
  3: "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/bling/boss_rotation3.webm",
  4: "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/bling/boss_rotation4.webm",
};

interface TierStatus {
  tier: number;
  has_scouted: boolean;
  has_fought: boolean;
  scouting_success: boolean;
  boss_name?: string;
  boss_image_url?: string;
  boss_attack_affinity_name?: string;
  boss_defense_affinity_name?: string;
}

export default function BattleSelectPage() {
  const router = useRouter();
  const [statusByTier, setStatusByTier] = useState<Record<number, TierStatus>>({
    1: { tier: 1, has_scouted: false, has_fought: false, scouting_success: false },
    2: { tier: 2, has_scouted: false, has_fought: false, scouting_success: false },
    3: { tier: 3, has_scouted: false, has_fought: false, scouting_success: false },
    4: { tier: 4, has_scouted: false, has_fought: false, scouting_success: false },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingTier, setPendingTier] = useState<number | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: rows } = await supabase
        .from("user_daily_boss_status")
        .select("tier, has_scouted, has_fought, scouting_success")
        .eq("user_id", user.id)
        .in("tier", [1, 2, 3, 4]);

      if (rows) {
        const next: Record<number, TierStatus> = { ...statusByTier };
        for (const row of rows) {
          next[row.tier] = {
            tier: row.tier,
            has_scouted: row.has_scouted ?? false,
            has_fought: row.has_fought ?? false,
            scouting_success: row.scouting_success ?? false,
          };
        }

        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        for (const row of rows) {
          if (row.has_scouted && row.scouting_success) {
            const { data: lineupRows } = await supabase
              .from("daily_boss_lineup")
              .select("boss_id")
              .eq("lineup_date", today)
              .eq("tier", row.tier)
              .limit(1);
            const lineup = lineupRows?.[0] ?? null;

            if (lineup) {
              const { data: boss } = await supabase
                .from("bosses_lookup")
                .select("name, image_url, attack_affinity, defense_affinity")
                .eq("id", lineup.boss_id)
                .single();

              if (boss) {
                next[row.tier].boss_name = boss.name;
                next[row.tier].boss_image_url = boss.image_url ?? undefined;
                const attackName =
                  boss.attack_affinity != null
                    ? (
                        await supabase
                          .from("affinity_lookup")
                          .select("affinity_name")
                          .eq("id", boss.attack_affinity)
                          .single()
                      ).data?.affinity_name ?? undefined
                    : undefined;
                const defenseName =
                  boss.defense_affinity != null
                    ? (
                        await supabase
                          .from("affinity_lookup")
                          .select("affinity_name")
                          .eq("id", boss.defense_affinity)
                          .single()
                      ).data?.affinity_name ?? undefined
                    : undefined;
                next[row.tier].boss_attack_affinity_name = attackName;
                next[row.tier].boss_defense_affinity_name = defenseName;
              }
            }
          }
        }

        setStatusByTier(next);
      }
      setIsLoading(false);
    }
    fetchStatus();
  }, []);

  function handleTierClick(tier: number) {
    const status = statusByTier[tier];
    if (status?.has_fought) return;

    if (!status?.has_scouted) {
      setPendingTier(tier);
      setConfirmOpen(true);
      return;
    }
    router.push(`/battle/${tier}`);
  }

  async function handleScoutClick(tier: number) {
    const status = statusByTier[tier];
    if (status?.has_scouted) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("user_daily_boss_status")
      .upsert(
        { user_id: user.id, tier, has_scouted: true },
        { onConflict: "user_id,tier" }
      );

    router.push(`/battle/scout/${tier}`);
  }

  function handleConfirmYes() {
    if (pendingTier != null) {
      router.push(`/battle/${pendingTier}`);
    }
    setConfirmOpen(false);
    setPendingTier(null);
  }

  function handleConfirmNo() {
    setConfirmOpen(false);
    setPendingTier(null);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">Loading boss line-up…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Today&apos;s Arena Boss Line-up
      </h1>
      <p className="text-center text-sm text-muted-foreground sm:text-base">
        Reminder: You may only enter the Arena once to battle each boss today.
      </p>

      {/* Layout: Tiers 1–3 horizontally aligned; Tier 4 centered underneath */}
      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
          {[1, 2, 3].map((tier) => (
            <TierCard
              key={tier}
              tier={tier}
              status={statusByTier[tier]}
              onTierClick={handleTierClick}
              onScoutClick={handleScoutClick}
            />
          ))}
        </div>
        <TierCard
          tier={4}
          status={statusByTier[4]}
          onTierClick={handleTierClick}
          onScoutClick={handleScoutClick}
        />
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Battle without scouting?</DialogTitle>
            <DialogDescription>
              Are you sure you want to battle without scouting?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleConfirmNo}>
              No
            </Button>
            <Button onClick={handleConfirmYes}>Yes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TierCardProps {
  tier: number;
  status: TierStatus;
  onTierClick: (tier: number) => void;
  onScoutClick: (tier: number) => void;
}

function TierCard({ tier, status, onTierClick, onScoutClick }: TierCardProps) {
  const borderColor = TIER_BORDER_COLORS[tier] ?? "rgb(100, 100, 100)";
  const videoSrc = TIER_VIDEO_SOURCES[tier];
  const hasFought = status?.has_fought ?? false;
  const hasScouted = status?.has_scouted ?? false;
  const scoutingSuccess = status?.scouting_success ?? false;
  const showBoss = hasScouted && scoutingSuccess;

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => onTierClick(tier)}
        disabled={hasFought}
        className={cn(
          "relative flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-lg border-4 text-card-foreground shadow-sm transition",
          hasFought
            ? "cursor-not-allowed bg-black"
            : "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:brightness-110"
        )}
        style={{ borderColor }}
        aria-label={
          hasFought
            ? `Tier ${tier} (already fought)`
            : showBoss
              ? `Battle ${status.boss_name ?? `Tier ${tier}`} boss`
              : `Select Tier ${tier} boss`
        }
      >
        {hasFought ? (
          <span
            className="text-6xl font-bold leading-none text-gray-500"
            aria-hidden
          >
            ✕
          </span>
        ) : showBoss ? (
          <>
            {status.boss_image_url ? (
              <img
                src={status.boss_image_url}
                alt={status.boss_name ?? "Boss"}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <span className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-950" />
            )}
            <span className="absolute inset-0 bg-black/35" aria-hidden />
            <span className="absolute left-0 right-0 top-0 z-10 truncate px-1 py-0.5 text-center text-base font-semibold text-white drop-shadow-md">
              {status.boss_name ?? `Tier ${tier} Boss`}
            </span>
            <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center justify-center gap-0.5 px-1 py-1 text-white">
              <span className="flex items-center gap-1.5 text-sm">
                Attack:{" "}
                {status.boss_attack_affinity_name ? (
                  <img
                    src={getAffinityIconUrl(status.boss_attack_affinity_name)}
                    alt={status.boss_attack_affinity_name}
                    title={status.boss_attack_affinity_name}
                    className="h-5 w-5 rounded object-contain"
                  />
                ) : (
                  "—"
                )}
              </span>
              <span className="flex items-center gap-1.5 text-sm">
                Defense:{" "}
                {status.boss_defense_affinity_name ? (
                  <img
                    src={getAffinityIconUrl(status.boss_defense_affinity_name)}
                    alt={status.boss_defense_affinity_name}
                    title={status.boss_defense_affinity_name}
                    className="h-5 w-5 rounded object-contain"
                  />
                ) : (
                  "—"
                )}
              </span>
            </div>
          </>
        ) : (
          <>
            {videoSrc ? (
              <video
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                aria-hidden
              >
                <source src={videoSrc} type="video/webm" />
              </video>
            ) : null}
            <span className="absolute inset-0 bg-black/35" aria-hidden />
            <span className="relative z-10 text-xl font-semibold text-white">
              Tier {tier}
            </span>
          </>
        )}
      </button>
      <Button
        variant="secondary"
        size="default"
        onClick={() => onScoutClick(tier)}
        disabled={hasScouted}
        className="w-auto"
      >
        Scout
      </Button>
    </div>
  );
}
