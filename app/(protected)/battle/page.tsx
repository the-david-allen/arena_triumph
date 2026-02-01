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
import { cn } from "@/lib/utils";

const TIER_BORDER_COLORS: Record<number, string> = {
  1: "rgb(70, 180, 90)",
  2: "rgb(167, 139, 253)",
  3: "rgb(255, 155, 1)",
  4: "rgb(230, 0, 38)",
};

interface TierStatus {
  tier: number;
  has_scouted: boolean;
  has_fought: boolean;
}

export default function BattleSelectPage() {
  const router = useRouter();
  const [statusByTier, setStatusByTier] = useState<Record<number, TierStatus>>({
    1: { tier: 1, has_scouted: false, has_fought: false },
    2: { tier: 2, has_scouted: false, has_fought: false },
    3: { tier: 3, has_scouted: false, has_fought: false },
    4: { tier: 4, has_scouted: false, has_fought: false },
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
        .select("tier, has_scouted, has_fought")
        .eq("user_id", user.id)
        .in("tier", [1, 2, 3, 4]);

      if (rows) {
        const next: Record<number, TierStatus> = { ...statusByTier };
        for (const row of rows) {
          next[row.tier] = {
            tier: row.tier,
            has_scouted: row.has_scouted ?? false,
            has_fought: row.has_fought ?? false,
          };
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

  function handleScoutClick(tier: number) {
    const status = statusByTier[tier];
    if (status?.has_scouted) return;
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
  const hasFought = status?.has_fought ?? false;
  const hasScouted = status?.has_scouted ?? false;

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => onTierClick(tier)}
        disabled={hasFought}
        className={cn(
          "relative flex h-40 w-40 shrink-0 items-center justify-center rounded-lg border-4 bg-card text-card-foreground shadow-sm transition-colors",
          hasFought
            ? "cursor-not-allowed opacity-60"
            : "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
        style={{ borderColor }}
        aria-label={hasFought ? `Tier ${tier} (already fought)` : `Select Tier ${tier} boss`}
      >
        {hasFought ? (
          <span
            className="text-6xl font-bold leading-none text-muted-foreground"
            aria-hidden
          >
            ✕
          </span>
        ) : (
          <span className="text-xl font-semibold">Tier {tier}</span>
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
