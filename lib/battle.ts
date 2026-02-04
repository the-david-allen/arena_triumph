import { createClient } from "@/lib/supabase/client";
import { fetchAffinityMatchups } from "@/lib/leggings-game";
import { checkAndUpdateLevel } from "@/lib/levels";

const GEAR_TYPE_TO_LOOKUP_TABLE: Record<string, string> = {
  Weapon: "weapons_lookup",
  Helm: "helm_lookup",
  Shoulders: "shoulders_lookup",
  Chestpiece: "chest_lookup",
  Gauntlets: "gauntlets_lookup",
  Belt: "belt_lookup",
  Leggings: "leggings_lookup",
  Boots: "boots_lookup",
};

const ARMOR_SLOTS = [
  "Helm",
  "Chestpiece",
  "Shoulders",
  "Gauntlets",
  "Belt",
  "Leggings",
  "Boots",
] as const;

export interface BossInfo {
  id: string;
  name: string;
  image_url: string | null;
  attack_strength: number;
  attack_affinity: string | null;
  defense_strength: number;
  defense_affinity: string | null;
  health: number;
}

export interface GearWithAffinities {
  strength: number;
  primary_affinity: string | null;
  secondary_affinity: string | null;
}

export interface PlayerProfile {
  level: number;
  user_image_url: string | null;
  username: string | null;
}

export interface BattleData {
  boss: BossInfo;
  weapon: GearWithAffinities | null;
  armorBySlot: Record<string, GearWithAffinities>;
  playerProfile: PlayerProfile;
  matchupMap: Map<string, Set<string>>;
}

export interface CombatStats {
  playerAttack: number;
  playerHealth: number;
  numPlayerHits: number;
  playerSwingDamage: number;
  playerDefense: number;
  numBossHits: number;
  bossSwingDamage: number;
}

const TIER_XP: Record<number, number> = {
  1: 5,
  2: 10,
  3: 15,
  4: 20,
};

function applyAffinityMultiplier(
  value: number,
  myAffinityId: string | null,
  theirAffinityId: string | null,
  matchupMap: Map<string, Set<string>>
): number {
  if (!myAffinityId || !theirAffinityId) return value;

  const myStrongAgainst = matchupMap.get(myAffinityId);
  if (myStrongAgainst?.has(theirAffinityId)) {
    return value * 1.2;
  }

  const theirStrongAgainst = matchupMap.get(theirAffinityId);
  if (theirStrongAgainst?.has(myAffinityId)) {
    return value * 0.8;
  }

  return value;
}

export async function fetchBattleData(
  tier: number,
  userId: string
): Promise<BattleData | null> {
  const supabase = createClient();

  const today = new Date().toISOString().split("T")[0];

  const { data: lineupRow, error: lineupError } = await supabase
    .from("daily_boss_lineup")
    .select("boss_id")
    .eq("lineup_date", today)
    .eq("tier", tier)
    .maybeSingle();

  if (lineupError || !lineupRow?.boss_id) {
    return null;
  }

  const { data: bossRow, error: bossError } = await supabase
    .from("bosses_lookup")
    .select(
      "id, name, image_url, attack_strength, attack_affinity, defense_strength, defense_affinity, health"
    )
    .eq("id", lineupRow.boss_id)
    .single();

  if (bossError || !bossRow) {
    return null;
  }

  const boss: BossInfo = {
    id: bossRow.id,
    name: bossRow.name ?? "Unknown Boss",
    image_url: bossRow.image_url ?? null,
    attack_strength: bossRow.attack_strength ?? 0,
    attack_affinity: bossRow.attack_affinity ?? null,
    defense_strength: bossRow.defense_strength ?? 0,
    defense_affinity: bossRow.defense_affinity ?? null,
    health: bossRow.health ?? 1,
  };

  const { data: profileRow, error: profileError } = await supabase
    .from("user_profiles")
    .select("level, user_image_url, username")
    .eq("id", userId)
    .single();

  if (profileError || !profileRow) {
    return null;
  }

  const playerProfile: PlayerProfile = {
    level: profileRow.level ?? 1,
    user_image_url: profileRow.user_image_url ?? null,
    username: profileRow.username ?? null,
  };

  const { data: inventoryRows, error: invError } = await supabase
    .from("user_inventory")
    .select("gear_id, gear_type")
    .eq("user_id", userId)
    .eq("is_equipped", true)
    .in("gear_type", ["Weapon", ...ARMOR_SLOTS]);

  if (invError || !inventoryRows) {
    return {
      boss,
      weapon: null,
      armorBySlot: {},
      playerProfile,
      matchupMap: await fetchAffinityMatchups(),
    };
  }

  const armorBySlot: Record<string, GearWithAffinities> = {};
  let weapon: GearWithAffinities | null = null;

  for (const row of inventoryRows) {
    const table = GEAR_TYPE_TO_LOOKUP_TABLE[row.gear_type];
    if (!table) continue;

    const { data: gearRow, error } = await supabase
      .from(table)
      .select("strength, primary_affinity, secondary_affinity")
      .eq("id", row.gear_id)
      .single();

    if (error || !gearRow) continue;

    const gear: GearWithAffinities = {
      strength: gearRow.strength ?? 0,
      primary_affinity: gearRow.primary_affinity ?? null,
      secondary_affinity: gearRow.secondary_affinity ?? null,
    };

    if (row.gear_type === "Weapon") {
      weapon = gear;
    } else {
      armorBySlot[row.gear_type] = gear;
    }
  }

  const matchupMap = await fetchAffinityMatchups();

  return {
    boss,
    weapon,
    armorBySlot,
    playerProfile,
    matchupMap,
  };
}

export function calculateCombatStats(
  data: BattleData
): CombatStats | null {
  const { boss, weapon, armorBySlot, playerProfile, matchupMap } = data;

  if (!weapon) return null;

  let playerAttack = weapon.strength;
  playerAttack = applyAffinityMultiplier(
    playerAttack,
    weapon.primary_affinity,
    boss.defense_affinity,
    matchupMap
  );
  playerAttack = applyAffinityMultiplier(
    playerAttack,
    weapon.secondary_affinity,
    boss.defense_affinity,
    matchupMap
  );

  const playerHealth = playerProfile.level + 9;

  let numPlayerHits = -0.3 * (playerAttack - boss.defense_strength) + 12;
  if (numPlayerHits < 2) numPlayerHits = 2;

  const playerSwingDamage = Math.round(boss.health / numPlayerHits);

  let playerDefense = 0;
  for (const slot of ARMOR_SLOTS) {
    const armor = armorBySlot[slot];
    if (!armor) continue;

    let slotPower = armor.strength;
    slotPower = applyAffinityMultiplier(
      slotPower,
      armor.primary_affinity,
      boss.attack_affinity,
      matchupMap
    );
    slotPower = applyAffinityMultiplier(
      slotPower,
      armor.secondary_affinity,
      boss.attack_affinity,
      matchupMap
    );
    playerDefense += slotPower;
  }

  let numBossHits = -0.3 * (boss.attack_strength - playerDefense) + 12;
  if (numBossHits < 1) numBossHits = 1;

  const bossSwingDamage = Math.ceil(playerHealth / numBossHits);

  return {
    playerAttack,
    playerHealth,
    numPlayerHits,
    playerSwingDamage,
    playerDefense,
    numBossHits,
    bossSwingDamage,
  };
}

export async function updateHasFought(
  userId: string,
  tier: number
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("user_daily_boss_status").upsert(
    {
      user_id: userId,
      tier,
      has_fought: true,
    },
    {
      onConflict: "user_id,tier",
    }
  );

  if (error) {
    console.error("Error updating has_fought:", error);
    throw new Error(`Failed to update battle status: ${error.message}`);
  }
}

export interface AwardVictoryXPResult {
  leveledUp: boolean;
}

export async function awardVictoryXP(
  userId: string,
  tier: number
): Promise<AwardVictoryXPResult> {
  const xp = TIER_XP[tier] ?? 0;
  if (xp <= 0) return { leveledUp: false };

  const supabase = createClient();

  const { data: profile, error: fetchError } = await supabase
    .from("user_profiles")
    .select("xp, level")
    .eq("id", userId)
    .single();

  if (fetchError || !profile) {
    console.error("Error fetching profile:", fetchError);
    throw new Error("Failed to award XP: profile not found");
  }

  const newXp = (profile.xp ?? 0) + xp;
  const currentLevel = profile.level ?? 1;

  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ xp: newXp })
    .eq("id", userId);

  if (updateError) {
    console.error("Error updating XP:", updateError);
    throw new Error(`Failed to award XP: ${updateError.message}`);
  }

  const { leveledUp } = await checkAndUpdateLevel(
    supabase,
    userId,
    newXp,
    currentLevel
  );

  return { leveledUp };
}
