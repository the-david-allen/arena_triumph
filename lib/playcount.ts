import { createClient } from "@/lib/supabase/client";

/**
 * Fetches today_play_count per gear_type for a user.
 * Missing gear types are treated as 0.
 * Client-safe (Edge-compatible).
 */
export async function getTodayPlayCountsByUser(
  userId: string
): Promise<Record<string, number>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_gear_playcount")
    .select("gear_type, today_play_count")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching play counts:", error);
    return {};
  }

  const map: Record<string, number> = {};
  for (const row of data ?? []) {
    map[row.gear_type] = row.today_play_count ?? 0;
  }
  return map;
}

/**
 * Fetches today_play_count for a single gear type for a user.
 * Returns 0 if no row exists. Client-safe (Edge-compatible).
 */
export async function getTodayPlayCountForGear(
  userId: string,
  gearType: string
): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_gear_playcount")
    .select("today_play_count")
    .eq("user_id", userId)
    .eq("gear_type", gearType)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching play count for gear:", error);
    return 0;
  }
  return data?.today_play_count ?? 0;
}
