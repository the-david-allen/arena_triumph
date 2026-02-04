import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns the level from levels_lookup for the given total XP.
 * The level is the highest level where xp_required <= totalXp.
 */
export async function getLevelForXp(
  supabase: SupabaseClient,
  totalXp: number
): Promise<number> {
  const { data, error } = await supabase
    .from("levels_lookup")
    .select("level")
    .lte("xp_required", totalXp)
    .order("level", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching level for XP:", error);
    return 1;
  }

  return data?.level ?? 1;
}

/**
 * After XP is updated, checks if the user has earned a new level and updates
 * user_profiles.level if so. Returns whether a level-up occurred.
 */
export async function checkAndUpdateLevel(
  supabase: SupabaseClient,
  userId: string,
  newXp: number,
  currentLevel: number
): Promise<{ leveledUp: boolean; newLevel: number }> {
  const levelForXp = await getLevelForXp(supabase, newXp);

  if (levelForXp <= currentLevel) {
    return { leveledUp: false, newLevel: currentLevel };
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({ level: levelForXp })
    .eq("id", userId);

  if (error) {
    console.error("Error updating user level:", error);
    return { leveledUp: false, newLevel: currentLevel };
  }

  return { leveledUp: true, newLevel: levelForXp };
}
