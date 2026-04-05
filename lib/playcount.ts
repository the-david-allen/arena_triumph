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

export interface PlayCounts {
  today: Record<string, number>;
  total: Record<string, number>;
}

/**
 * Fetches today_play_count and total_play_count per gear_type for a user in one query.
 */
export async function getPlayCountsByUser(userId: string): Promise<PlayCounts> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_gear_playcount")
    .select("gear_type, today_play_count, total_play_count")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching play counts:", error);
    return { today: {}, total: {} };
  }

  const today: Record<string, number> = {};
  const total: Record<string, number> = {};
  for (const row of data ?? []) {
    today[row.gear_type] = row.today_play_count ?? 0;
    total[row.gear_type] = row.total_play_count ?? 0;
  }
  return { today, total };
}

/**
 * Fetches total_play_count per gear_type for a user.
 * Missing gear types are treated as 0.
 */
export async function getTotalPlayCountsByUser(
  userId: string
): Promise<Record<string, number>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_gear_playcount")
    .select("gear_type, total_play_count")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching total play counts:", error);
    return {};
  }

  const map: Record<string, number> = {};
  for (const row of data ?? []) {
    map[row.gear_type] = row.total_play_count ?? 0;
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
