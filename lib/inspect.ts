import { createClient } from "@/lib/supabase/client";

export interface UserProfile {
  id: string;
  username: string | null;
  level: number;
  xp: number;
  user_image_url: string | null;
}

export interface LevelProgress {
  xpForCurrentLevel: number;
  xpForNextLevel: number | null;
  percent: number;
}

export interface Contestant {
  id: string;
  username: string;
}

/**
 * Fetches the user profile for a given user ID
 */
export async function fetchUserProfile(
  userId: string
): Promise<UserProfile | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, username, level, xp, user_image_url")
    .eq("id", userId)
    .single();

  if (error || !data) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return {
    id: data.id,
    username: data.username,
    level: data.level ?? 1,
    xp: Number(data.xp ?? 0),
    user_image_url: data.user_image_url,
  };
}

/**
 * Fetches XP thresholds for current and next level, and computes progress percent.
 */
export async function fetchLevelProgress(
  level: number,
  userXp: number
): Promise<LevelProgress> {
  const supabase = createClient();

  const [currentResult, nextResult] = await Promise.all([
    supabase
      .from("levels_lookup")
      .select("xp_required")
      .eq("level", level)
      .maybeSingle(),
    supabase
      .from("levels_lookup")
      .select("xp_required")
      .eq("level", level + 1)
      .maybeSingle(),
  ]);

  const xpForCurrentLevel = Number(
    currentResult.data?.xp_required ?? 0
  );
  const xpForNextLevel = nextResult.data?.xp_required != null
    ? Number(nextResult.data.xp_required)
    : null;

  let percent: number;
  if (xpForNextLevel == null) {
    percent = 100;
  } else {
    const range = xpForNextLevel - xpForCurrentLevel;
    percent =
      range <= 0
        ? 100
        : Math.min(
            100,
            Math.max(0, ((userXp - xpForCurrentLevel) / range) * 100)
          );
  }

  return {
    xpForCurrentLevel,
    xpForNextLevel,
    percent,
  };
}

/**
 * Fetches all contestants (users) sorted alphabetically by username
 */
export async function fetchAllContestants(): Promise<Contestant[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, username")
    .not("username", "is", null)
    .order("username", { ascending: true });

  if (error || !data) {
    console.error("Error fetching contestants:", error);
    return [];
  }

  return data
    .filter((user): user is { id: string; username: string } => 
      user.username !== null
    )
    .map((user) => ({
      id: user.id,
      username: user.username,
    }));
}

/**
 * Fetches a user ID by their username
 */
export async function fetchUserIdByUsername(
  username: string
): Promise<string | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (error || !data) {
    console.error("Error fetching user by username:", error);
    return null;
  }

  return data.id;
}
