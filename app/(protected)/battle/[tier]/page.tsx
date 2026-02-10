"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  fetchBattleData,
  calculateCombatStats,
  updateHasFought,
  awardVictoryXP,
  type BattleData,
  type CombatStats,
} from "@/lib/battle";
import { Button } from "@/components/ui/button";
import { CombatantArea } from "@/components/battle/CombatantArea";
import { FightStatusDisplay } from "@/components/battle/FightStatusDisplay";
import { DebugWindow } from "@/components/battle/DebugWindow";
import type { ZoneType } from "@/components/battle/HitBar";
import { BACKGROUND_MUSIC_VOLUME } from "@/lib/sounds";

const BATTLE_BACKGROUND_MUSIC_URL =
  "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/sounds/battle_background.mp3";

type FightPhase =
  | "loading"
  | "error"
  | "no_weapon"
  | "no_boss"
  | "countdown"
  | "player_turn"
  | "boss_turn"
  | "player_wins"
  | "boss_wins";

export const runtime = "edge";

export default function BattleTierPage() {
  const params = useParams();
  const router = useRouter();
  const tier = parseInt(String(params.tier ?? "1"), 10);
  if (isNaN(tier) || tier < 1 || tier > 4) {
    router.replace("/battle");
    return null;
  }

  const [phase, setPhase] = useState<FightPhase>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [battleData, setBattleData] = useState<BattleData | null>(null);
  const [stats, setStats] = useState<CombatStats | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [playerHealth, setPlayerHealth] = useState(0);
  const [bossHealth, setBossHealth] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [showHitBar, setShowHitBar] = useState(false);
  const [isPlayerTurnNext, setIsPlayerTurnNext] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const hasUpdatedHasFoughtRef = useRef(false);
  const bossTurnProcessedRef = useRef(false);
  const battleAudioRef = useRef<HTMLAudioElement | null>(null);
  const battleMusicStartedRef = useRef(false);

  useEffect(() => {
    if (phase === "player_turn" || phase === "boss_turn") {
      if (battleMusicStartedRef.current) return;
      battleMusicStartedRef.current = true;
      const audio = new Audio(BATTLE_BACKGROUND_MUSIC_URL);
      audio.volume = BACKGROUND_MUSIC_VOLUME;
      audio.loop = true;
      audio.play().catch((err) =>
        console.warn("Battle music failed to play:", err)
      );
      battleAudioRef.current = audio;
    }
    if (phase === "player_wins" || phase === "boss_wins") {
      const audio = battleAudioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        battleAudioRef.current = null;
      }
      battleMusicStartedRef.current = false;
    }
  }, [phase]);

  useEffect(() => {
    return () => {
      const audio = battleAudioRef.current;
      if (audio) {
        audio.pause();
        battleAudioRef.current = null;
      }
      battleMusicStartedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!showLevelUp) return;
    const t = setTimeout(() => setShowLevelUp(false), 2000);
    return () => clearTimeout(t);
  }, [showLevelUp]);

  const loadBattle = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    userIdRef.current = user.id;
    const data = await fetchBattleData(tier, user.id);

    if (!data) {
      setPhase("no_boss");
      return;
    }

    if (!data.weapon) {
      setPhase("no_weapon");
      return;
    }

    const combatStats = calculateCombatStats(data);
    if (!combatStats) {
      setPhase("no_weapon");
      return;
    }

    setBattleData(data);
    setStats(combatStats);
    setPlayerHealth(combatStats.playerHealth);
    setBossHealth(data.boss.health);
    setCountdown(5);
    setPhase("countdown");
    setStatusText("Battle Begins in 5");
  }, [tier, router]);

  useEffect(() => {
    loadBattle();
  }, [loadBattle]);

  useEffect(() => {
    if (phase !== "countdown") return;

    if (countdown <= 0) {
      const userId = userIdRef.current;
      if (userId && !hasUpdatedHasFoughtRef.current) {
        hasUpdatedHasFoughtRef.current = true;
        updateHasFought(userId, tier).catch((err) => {
          console.error(err);
        });
      }

      const playerFirst = Math.random() >= 0.5;
      setIsPlayerTurnNext(playerFirst);
      if (playerFirst) {
        setPhase("player_turn");
        setStatusText("Time Your Attacks in the green zone");
        setShowHitBar(true);
      } else {
        setPhase("boss_turn");
        setStatusText(`${battleData?.boss.name ?? "Boss"} Attacks!`);
      }
      return;
    }

    const t = setTimeout(() => {
      setCountdown((c) => c - 1);
      setStatusText(`Battle Begins in ${countdown - 1}`);
    }, 1000);

    return () => clearTimeout(t);
  }, [phase, countdown, tier, battleData?.boss.name]);

  const evaluateHitResult = useCallback(
    (clicks: ZoneType[]): "critical" | "success" | "clumsy" => {
      const greenCount = clicks.filter((z) => z === "green").length;
      const yellowCount = clicks.filter((z) => z === "yellow").length;

      if (clicks.length === 2 && greenCount === 2) return "critical";
      if (
        clicks.length === 2 &&
        (greenCount >= 1 || yellowCount === 2)
      ) {
        return "success";
      }
      return "clumsy";
    },
    []
  );

  const handleHitBarComplete = useCallback(
    (clicks: ZoneType[]) => {
      setShowHitBar(false);
      if (!stats || !battleData) return;

      const result = evaluateHitResult(clicks);
      let damage = stats.playerSwingDamage;
      if (result === "critical") {
        damage = stats.playerSwingDamage + 1;
        setStatusText("Critical Hit!");
      } else if (result === "success") {
        setStatusText("Successful Attack");
      } else {
        damage = Math.max(1, stats.playerSwingDamage - 1);
        setStatusText("Clumsy attack");
      }

      setBossHealth((h) => {
        const newHealth = Math.max(0, h - damage);
        if (newHealth <= 0) {
          const uid = userIdRef.current;
          if (uid) {
            awardVictoryXP(uid, tier)
              .then((result) => {
                if (result.leveledUp) setShowLevelUp(true);
              })
              .catch(console.error);
          }
          setPhase("player_wins");
          setStatusText("Boss Defeated! XP awarded");
        } else {
          setTimeout(() => {
            setPhase("boss_turn");
            setStatusText(`${battleData.boss.name} Attacks!`);
          }, 1500);
        }
        return newHealth;
      });
    },
    [stats, battleData, tier, evaluateHitResult]
  );

  useEffect(() => {
    if (phase !== "boss_turn") {
      bossTurnProcessedRef.current = false;
      return;
    }

    const boss = battleData?.boss;
    if (!boss || !stats || bossTurnProcessedRef.current) return;
    bossTurnProcessedRef.current = true;

    const t = setTimeout(() => {
      const roll = Math.random();
      let damage = stats.bossSwingDamage;
      if (roll < 0.1) {
        damage = stats.bossSwingDamage + 1;
        setStatusText(`${boss.name} scores a Critical Hit!`);
      } else if (roll < 0.2) {
        damage = Math.max(1, stats.bossSwingDamage - 1);
        setStatusText(`${boss.name} executes a Clumsy Attack!`);
      } else {
        setStatusText(`${boss.name} successfully attacks!`);
      }

      setPlayerHealth((h) => {
        const newHealth = Math.max(0, h - damage);
        if (newHealth <= 0) {
          const username = battleData.playerProfile.username ?? "You";
          setTimeout(() => {
            setStatusText(`${boss.name} has defeated ${username}`);
            setPhase("boss_wins");
          }, 500);
        } else {
          setTimeout(() => {
            setPhase("player_turn");
            setStatusText("Time Your Attacks in the green zone");
            setShowHitBar(true);
          }, 1500);
        }
        return newHealth;
      });
    }, 500);

    return () => clearTimeout(t);
  }, [phase, battleData, stats]);

  if (phase === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">Loading battle…</p>
      </div>
    );
  }

  if (phase === "no_boss") {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Boss not found for this tier.
        </p>
        <Button asChild variant="outline">
          <Link href="/battle">Back to Boss Line-up</Link>
        </Button>
      </div>
    );
  }

  if (phase === "no_weapon") {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Equip a weapon in Inventory to battle.
        </p>
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link href="/inventory">Go to Inventory</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/battle">Back to Boss Line-up</Link>
          </Button>
        </div>
      </div>
    );
  }

  const boss = battleData?.boss;
  const playerProfile = battleData?.playerProfile;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-center text-2xl font-bold text-foreground">
        Battle — Tier {tier}
      </h1>

      <FightStatusDisplay
        statusText={statusText}
        showHitBar={showHitBar}
        onHitBarComplete={handleHitBarComplete}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <CombatantArea
          imageUrl={playerProfile?.user_image_url ?? null}
          name={playerProfile?.username ?? "Player"}
          currentHealth={playerHealth}
          maxHealth={stats?.playerHealth ?? 1}
          isPlayer
        />
        <CombatantArea
          imageUrl={boss?.image_url ?? null}
          name={boss?.name ?? "Boss"}
          currentHealth={bossHealth}
          maxHealth={boss?.health ?? 1}
        />
      </div>

      <div className="flex justify-center">
        <DebugWindow stats={stats} />
      </div>

      {phase === "player_wins" && showLevelUp && (
        <p className="text-center text-2xl font-bold text-primary">
          Level Up!
        </p>
      )}
      {(phase === "player_wins" || phase === "boss_wins") && (
        <div className="flex justify-center">
          <Button asChild>
            <Link href="/battle">Back to Boss Line-up</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
