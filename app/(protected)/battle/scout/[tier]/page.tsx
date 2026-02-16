"use client";

import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ScoutingGame } from "@/components/scouting/ScoutingGame";
import {
  ResultPopup,
  type BossInfo,
} from "@/components/scouting/ResultPopup";

type Phase = "pregame" | "playing" | "result";

export default function ScoutPage() {
  const params = useParams<{ tier: string }>();
  const tier = Number(params.tier);
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("pregame");
  const [success, setSuccess] = useState(false);
  const [bossInfo, setBossInfo] = useState<BossInfo | null>(null);

  const handleBeginScouting = useCallback(() => {
    setPhase("playing");
  }, []);

  const handleGameEnd = useCallback(
    async (didSucceed: boolean) => {
      setSuccess(didSucceed);
      setPhase("result");

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("user_daily_boss_status")
        .update({ scouting_success: didSucceed })
        .eq("user_id", user.id)
        .eq("tier", tier);

      if (didSucceed) {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        const { data: lineupRows } = await supabase
          .from("daily_boss_lineup")
          .select("boss_id")
          .eq("lineup_date", today)
          .eq("tier", tier)
          .limit(1);
        const lineup = lineupRows?.[0] ?? null;

        if (lineup) {
          const { data: boss } = await supabase
            .from("bosses_lookup")
            .select(
              "name, image_url, attack_affinity, defense_affinity"
            )
            .eq("id", lineup.boss_id)
            .single();

          if (boss) {
            const attackName = boss.attack_affinity
              ? (
                  await supabase
                    .from("affinity_lookup")
                    .select("affinity_name")
                    .eq("id", boss.attack_affinity)
                    .single()
                ).data?.affinity_name ?? "Unknown"
              : "Unknown";

            const defenseName = boss.defense_affinity
              ? (
                  await supabase
                    .from("affinity_lookup")
                    .select("affinity_name")
                    .eq("id", boss.defense_affinity)
                    .single()
                ).data?.affinity_name ?? "Unknown"
              : "Unknown";

            setBossInfo({
              name: boss.name,
              imageUrl: boss.image_url,
              attackAffinity: attackName,
              defenseAffinity: defenseName,
            });
          }
        }
      }
    },
    [tier]
  );

  const handleClose = useCallback(() => {
    router.push("/battle");
  }, [router]);

  return (
    <div className="space-y-6">
      <h1 className="text-center text-3xl font-bold text-foreground">
        Scout &mdash; Tier {tier}
      </h1>

      {phase === "pregame" && (
        <div className="flex flex-col items-center gap-6 pt-8">
          <Button size="lg" onClick={handleBeginScouting}>
            Begin Scouting
          </Button>
          <p className="max-w-md text-center text-sm text-muted-foreground">
            Within the allotted time, determine which Weapon, Affinity,
            Number, and Armor belongs in each spot.
          </p>
        </div>
      )}

      {phase === "playing" && (
        <ScoutingGame onGameEnd={handleGameEnd} />
      )}

      <ResultPopup
        open={phase === "result"}
        success={success}
        bossInfo={bossInfo}
        onClose={handleClose}
      />
    </div>
  );
}
