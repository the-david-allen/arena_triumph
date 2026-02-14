import { createClient } from "@/lib/supabase/client";

export interface GauntletsReward {
  id: string;
  name: string;
  image_url: string | null;
  rarity: string;
}

/**
 * Gets the current user ID from Supabase auth
 */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.error("Error getting user:", error);
    return null;
  }

  return user.id;
}

/**
 * Updates the play count for a user's gauntlets game
 * Increments both today_play_count and total_play_count
 */
export async function updatePlayCount(userId: string): Promise<void> {
  const supabase = createClient();
  const gearType = "Gauntlets";

  const { data: existing, error: fetchError } = await supabase
    .from("user_gear_playcount")
    .select("*")
    .eq("user_id", userId)
    .eq("gear_type", gearType)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Error fetching play count:", fetchError);
    throw new Error(`Failed to fetch play count: ${fetchError.message}`);
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("user_gear_playcount")
      .update({
        today_play_count: existing.today_play_count + 1,
        total_play_count: existing.total_play_count + 1,
      })
      .eq("user_id", userId)
      .eq("gear_type", gearType);

    if (updateError) {
      console.error("Error updating play count:", updateError);
      throw new Error(`Failed to update play count: ${updateError.message}`);
    }
    return;
  }

  const { error: insertError } = await supabase
    .from("user_gear_playcount")
.insert({
        user_id: userId,
        gear_type: gearType,
        today_play_count: 1,
        total_play_count: 1,
        has_claimed_reward: false,
      });

  if (insertError) {
    console.error("Error creating play count:", insertError);
    throw new Error(`Failed to create play count: ${insertError.message}`);
  }
}

/**
 * Updates the top 10 scores for a user's gauntlets game
 * Keeps the 10 highest scores (longest time survived)
 */
export async function updateTopScores(userId: string, seconds: number): Promise<void> {
  const supabase = createClient();
  const gearType = "Gauntlets";

  try {
    const { data: existingScores, error: fetchError } = await supabase
      .from("user_top_gear_scores")
      .select("score")
      .eq("user_id", userId)
      .eq("gear_type", gearType)
      .order("score", { ascending: false });

    if (fetchError) {
      console.error("Error fetching top scores:", fetchError);
      throw new Error(`Failed to fetch top scores: ${fetchError.message}`);
    }

    const scores = existingScores || [];
    const hasLessThan10 = scores.length < 10;
    const tenthHighestScore = scores.length >= 10 ? scores[9].score : null;
    const qualifies = hasLessThan10 || (tenthHighestScore !== null && seconds > tenthHighestScore);

    if (!qualifies) {
      return;
    }

    const { error: insertError } = await supabase
      .from("user_top_gear_scores")
      .insert({
        user_id: userId,
        gear_type: gearType,
        score: seconds,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Error inserting top score:", insertError);
      throw new Error(`Failed to insert top score: ${insertError.message}`);
    }

    const { data: allScores, error: refetchError } = await supabase
      .from("user_top_gear_scores")
      .select("score, created_at")
      .eq("user_id", userId)
      .eq("gear_type", gearType)
      .order("score", { ascending: false });

    if (refetchError) {
      console.error("Error refetching top scores:", refetchError);
      return;
    }

    if (allScores && allScores.length > 10) {
      const tenthScore = allScores[9].score;
      const { error: deleteError } = await supabase
        .from("user_top_gear_scores")
        .delete()
        .eq("user_id", userId)
        .eq("gear_type", gearType)
        .lt("score", tenthScore);

      if (deleteError) {
        console.error("Error deleting excess scores:", deleteError);
      }
    }
  } catch (error) {
    console.error("Error in updateTopScores:", error);
  }
}

/**
 * Gets the reward rarity based on seconds survived
 * Finds the highest min_score <= seconds
 */
export async function getRewardRarity(seconds: number): Promise<string | null> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("gauntlets_rewards_lookup")
      .select("rarity")
      .lte("min_score", seconds)
      .order("min_score", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Error fetching reward rarity:", error);
      return null;
    }

    return data?.rarity || null;
  } catch (error) {
    console.error("Error in getRewardRarity:", error);
    return null;
  }
}

/**
 * Gets a random gauntlets item by rarity
 */
export async function getRandomGauntletsByRarity(rarity: string): Promise<GauntletsReward | null> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("gauntlets_lookup")
      .select("id, name, image_url, rarity")
      .eq("rarity", rarity);

    if (error) {
      console.error("Error fetching gauntlets by rarity:", error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * data.length);
    const selected = data[randomIndex];

    return {
      id: selected.id,
      name: selected.name,
      image_url: selected.image_url,
      rarity: selected.rarity ?? "Base",
    };
  } catch (error) {
    console.error("Error in getRandomGauntletsByRarity:", error);
    return null;
  }
}

/**
 * Adds gauntlets to the user's inventory
 */
export async function addToInventory(userId: string, gearId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("user_inventory").insert({
    user_id: userId,
    gear_id: gearId,
    gear_type: "Gauntlets",
    is_equipped: false,
  });

  if (error) {
    if (error.code === "23505") {
      console.log("Item already in inventory:", gearId);
      return;
    }
    console.error("Error adding to inventory:", error);
    throw new Error(`Failed to add to inventory: ${error.message}`);
  }
}
