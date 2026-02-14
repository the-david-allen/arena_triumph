import { createClient } from "@/lib/supabase/client";
import { getRewardRarity as getHelmRarity } from "@/lib/helm-game";
import { getRandomHelmByRarity } from "@/lib/helm-game";
import { addToInventory as addHelmToInventory } from "@/lib/helm-game";
import { getRewardRarity as getChestRarity } from "@/lib/chestpiece-game";
import { getRandomChestByRarity } from "@/lib/chestpiece-game";
import { addToInventory as addChestToInventory } from "@/lib/chestpiece-game";
import { getRewardRarity as getBootsRarity } from "@/lib/boots-game";
import { getRandomBootsByRarity } from "@/lib/boots-game";
import { addToInventory as addBootsToInventory } from "@/lib/boots-game";
import { getRewardRarity as getGauntletsRarity } from "@/lib/gauntlets-game";
import { getRandomGauntletsByRarity } from "@/lib/gauntlets-game";
import { addToInventory as addGauntletsToInventory } from "@/lib/gauntlets-game";
import { getRewardRarity as getLeggingsRarity } from "@/lib/leggings-game";
import { getRandomLeggingsByRarity } from "@/lib/leggings-game";
import { addToInventory as addLeggingsToInventory } from "@/lib/leggings-game";
import { getRewardRarity as getBeltRarity } from "@/lib/belt-game";
import { getRandomBeltByRarity } from "@/lib/belt-game";
import { addToInventory as addBeltToInventory } from "@/lib/belt-game";
import { getRewardRarity as getShouldersRarity } from "@/lib/shoulders-game";
import { getRandomShouldersByRarity } from "@/lib/shoulders-game";
import { addToInventory as addShouldersToInventory } from "@/lib/shoulders-game";
import { getRewardRarity as getWeaponRarity } from "@/lib/weapon-game";
import { getRandomWeaponByRarity } from "@/lib/weapon-game";
import { addToInventory as addWeaponToInventory } from "@/lib/weapon-game";

export type ScoreLabel = "points" | "seconds" | "guesses" | "turns";

export interface GearSlotConfig {
  name: string;
  scoreLabel: ScoreLabel;
  topScoreOrder: "asc" | "desc";
}

/** Ordered list of 8 gear slots matching Obtain Gear page. Top score order aligns with each game's order("score", { ascending }). */
export const DAILY_REWARDS_GEAR_SLOTS: GearSlotConfig[] = [
  { name: "Helm", scoreLabel: "points", topScoreOrder: "desc" },
  { name: "Chestpiece", scoreLabel: "points", topScoreOrder: "desc" },
  { name: "Boots", scoreLabel: "seconds", topScoreOrder: "asc" },
  { name: "Gauntlets", scoreLabel: "seconds", topScoreOrder: "desc" },
  { name: "Leggings", scoreLabel: "guesses", topScoreOrder: "asc" },
  { name: "Belt", scoreLabel: "seconds", topScoreOrder: "asc" },
  { name: "Shoulders", scoreLabel: "points", topScoreOrder: "desc" },
  { name: "Weapon", scoreLabel: "turns", topScoreOrder: "asc" },
];

export interface SlotDailyState {
  hasClaimed: boolean;
  top10Count: number;
  averageScore: number | null;
}

export interface DailyRewardState {
  [gearType: string]: SlotDailyState;
}

export interface ClaimedRewardItem {
  name: string;
  image_url: string | null;
}

/**
 * Fetches daily reward state for all gear slots: has_claimed_reward and top-10 count/average per slot.
 */
export async function getDailyRewardState(userId: string): Promise<DailyRewardState> {
  const supabase = createClient();
  const state: DailyRewardState = {};

  const { data: playcountRows } = await supabase
    .from("user_gear_playcount")
    .select("gear_type, has_claimed_reward")
    .eq("user_id", userId);

  const claimedByGear: Record<string, boolean> = {};
  for (const row of playcountRows ?? []) {
    claimedByGear[row.gear_type] = row.has_claimed_reward ?? false;
  }

  for (const slot of DAILY_REWARDS_GEAR_SLOTS) {
    const hasClaimed = claimedByGear[slot.name] ?? false;

    const { data: topScores } = await supabase
      .from("user_top_gear_scores")
      .select("score")
      .eq("user_id", userId)
      .eq("gear_type", slot.name)
      .order("score", { ascending: slot.topScoreOrder === "asc" })
      .limit(10);

    const count = topScores?.length ?? 0;
    let averageScore: number | null = null;
    if (count >= 10 && topScores) {
      const sum = topScores.reduce((acc, r) => acc + (r.score ?? 0), 0);
      averageScore = Math.round(sum / 10);
    }

    state[slot.name] = {
      hasClaimed,
      top10Count: count,
      averageScore,
    };
  }

  return state;
}

/**
 * Claims the daily reward for a gear slot: computes average of top 10, grants item via slot logic, sets has_claimed_reward.
 * Call only when top10Count >= 10 and !hasClaimed.
 */
export async function claimDailyReward(
  userId: string,
  gearType: string
): Promise<ClaimedRewardItem | null> {
  const supabase = createClient();
  const slot = DAILY_REWARDS_GEAR_SLOTS.find((s) => s.name === gearType);
  if (!slot) return null;

  const { data: topScores } = await supabase
    .from("user_top_gear_scores")
    .select("score")
    .eq("user_id", userId)
    .eq("gear_type", gearType)
    .order("score", { ascending: slot.topScoreOrder === "asc" })
    .limit(10);

  if (!topScores || topScores.length < 10) return null;
  const sum = topScores.reduce((acc, r) => acc + (r.score ?? 0), 0);
  const averageScore = Math.round(sum / 10);

  let rarity: string | null = null;
  let item: { id: string; name: string; image_url: string | null } | null = null;

  switch (gearType) {
    case "Helm":
      rarity = await getHelmRarity(averageScore);
      item = await getRandomHelmByRarity(rarity ?? "Base");
      if (item) await addHelmToInventory(userId, item.id);
      break;
    case "Chestpiece":
      rarity = await getChestRarity(averageScore);
      item = await getRandomChestByRarity(rarity ?? "Base");
      if (item) await addChestToInventory(userId, item.id);
      break;
    case "Boots":
      rarity = await getBootsRarity(averageScore);
      item = await getRandomBootsByRarity(rarity ?? "Base");
      if (item) await addBootsToInventory(userId, item.id);
      break;
    case "Gauntlets":
      rarity = await getGauntletsRarity(averageScore);
      item = await getRandomGauntletsByRarity(rarity ?? "Base");
      if (item) await addGauntletsToInventory(userId, item.id);
      break;
    case "Leggings":
      rarity = await getLeggingsRarity(averageScore);
      item = await getRandomLeggingsByRarity(rarity ?? "Base");
      if (item) await addLeggingsToInventory(userId, item.id);
      break;
    case "Belt":
      rarity = await getBeltRarity(averageScore);
      item = await getRandomBeltByRarity(rarity ?? "Base");
      if (item) await addBeltToInventory(userId, item.id);
      break;
    case "Shoulders":
      rarity = await getShouldersRarity(averageScore);
      item = await getRandomShouldersByRarity(rarity ?? "Base");
      if (item) await addShouldersToInventory(userId, item.id);
      break;
    case "Weapon":
      rarity = await getWeaponRarity(averageScore);
      item = await getRandomWeaponByRarity(rarity ?? "Base");
      if (item) await addWeaponToInventory(userId, item.id);
      break;
    default:
      return null;
  }

  if (!item) return null;

  const { error: updateError } = await supabase
    .from("user_gear_playcount")
    .update({ has_claimed_reward: true })
    .eq("user_id", userId)
    .eq("gear_type", gearType)
    .select("user_id")
    .single();

  if (updateError && updateError.code === "PGRST116") {
    await supabase.from("user_gear_playcount").insert({
      user_id: userId,
      gear_type: gearType,
      today_play_count: 0,
      total_play_count: 0,
      has_claimed_reward: true,
    });
  } else if (updateError) {
    console.error("Error updating has_claimed_reward:", updateError);
  }

  return { name: item.name, image_url: item.image_url };
}
