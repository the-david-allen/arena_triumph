"use client";

import Image from "next/image";
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
          <table className="w-full max-w-2xl border-collapse rounded-lg border border-border">
            <caption className="border-b border-border bg-muted/50 px-4 py-2 text-left text-lg font-semibold text-foreground">
              Rules
            </caption>
            <tbody>
              <tr>
                <td className="border-r border-border p-4 align-top">
                  <figure className="flex flex-col items-center gap-2">
                    <Image
                      src="https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/bling/scout_example.png"
                      alt="Example of a grid cell showing dice value possibilities"
                      width={200}
                      height={133}
                      className="rounded-lg border border-border object-contain"
                      unoptimized
                    />
                    <figcaption className="max-w-sm text-center text-sm text-muted-foreground">
                      Each square will contain one of the 4 possibilities shown, in this example one of the 4 dice
                      value possibilities. The player would right-click a die
                      face to eliminate that possibility and left-click a die
                      face if they know that is the correct one.
                    </figcaption>
                  </figure>
                </td>
                <td className="p-4 align-top">
                  <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                    <div className="grid grid-cols-2 gap-4 items-start">
                      <div className="flex flex-col gap-2">
                        <p className="font-medium text-foreground">Before clue</p>
                        <div className="flex items-center gap-1.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border bg-card p-0.5 sm:h-12 sm:w-12">
                          <Image
                            src="https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/slots/belt.jpg"
                            alt="Belt"
                            width={40}
                            height={40}
                            className="h-full w-full object-contain"
                            unoptimized
                          />
                        </div>
                        <span className="text-lg text-muted-foreground">
                          &rarr;
                        </span>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border bg-card p-0.5 sm:h-12 sm:w-12">
                          <Image
                            src="https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/bling/dice/five.png"
                            alt="5 dice"
                            width={40}
                            height={40}
                            className="h-full w-full object-contain"
                            unoptimized
                          />
                        </div>
                      </div>
                      <p className="text-sm">
                        In this example, the Belt armor would be in a column to
                        the left of the 5 dice.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="font-medium text-foreground">
                        Horizontal clue
                      </p>
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center justify-items-center gap-x-1 gap-y-0">
                        <span />
                        <span className="text-xs text-muted-foreground">
                          &rarr;
                        </span>
                        <span />
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border bg-card p-0.5 sm:h-12 sm:w-12">
                          <Image
                            src="https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/bling/dice/five.png"
                            alt="5 dice"
                            width={40}
                            height={40}
                            className="h-full w-full object-contain"
                            unoptimized
                          />
                        </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border bg-card p-0.5 sm:h-12 sm:w-12">
                          <Image
                            src="https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/slots/shoulders.jpg"
                            alt="Shoulders"
                            width={40}
                            height={40}
                            className="h-full w-full object-contain"
                            unoptimized
                          />
                        </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border bg-card p-0.5 sm:h-12 sm:w-12">
                          <Image
                            src="https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/affinities/rock.jpg"
                            alt="Rock affinity"
                            width={40}
                            height={40}
                            className="h-full w-full object-contain"
                            unoptimized
                          />
                        </div>
                        <span />
                        <span className="text-xs text-muted-foreground">
                          &larr;
                        </span>
                        <span />
                      </div>
                      <p className="text-sm">
                        In this example, the 5 and the Rock affinity are two
                        columns away with the Shoulders being in the column in
                        between.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="font-medium text-foreground">Adjacent clue</p>
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border bg-card p-0.5 sm:h-12 sm:w-12">
                          <Image
                            src="https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/bling/dice/six.png"
                            alt="6 dice"
                            width={40}
                            height={40}
                            className="h-full w-full object-contain"
                            unoptimized
                          />
                        </div>
                        <span className="text-lg text-muted-foreground">
                          &harr;
                        </span>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border bg-card p-0.5 sm:h-12 sm:w-12">
                          <Image
                            src="https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/affinities/lightning.jpg"
                            alt="Lightning affinity"
                            width={40}
                            height={40}
                            className="h-full w-full object-contain"
                            unoptimized
                          />
                        </div>
                      </div>
                      <p className="text-sm">
                        In this example, the 6 and the Lightning would be in
                        adjacent columns (either order).
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="font-medium text-foreground">Above clue</p>
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border bg-card p-0.5 sm:h-12 sm:w-12">
                          <Image
                            src="https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/bling/dice/six.png"
                            alt="6 dice"
                            width={40}
                            height={40}
                            className="h-full w-full object-contain"
                            unoptimized
                          />
                        </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border bg-card p-0.5 sm:h-12 sm:w-12">
                          <Image
                            src="https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/affinities/phantom.jpg"
                            alt="Phantom affinity"
                            width={40}
                            height={40}
                            className="h-full w-full object-contain"
                            unoptimized
                          />
                        </div>
                      </div>
                      <p className="text-sm">
                        In this example, the 6 and Phantom affinity would be in
                        the same vertical column.
                      </p>
                    </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
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
