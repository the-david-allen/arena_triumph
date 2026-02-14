import { createClient } from "@/lib/supabase/client";

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
 * Updates the play count for a user's weapon game
 * Increments both today_play_count and total_play_count
 */
export async function updatePlayCount(userId: string): Promise<void> {
  const supabase = createClient();
  const gearType = "Weapon";

  // First, try to get the existing record
  const { data: existing, error: fetchError } = await supabase
    .from("user_gear_playcount")
    .select("*")
    .eq("user_id", userId)
    .eq("gear_type", gearType)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    // PGRST116 is "not found" error, which is expected if record doesn't exist
    console.error("Error fetching play count:", fetchError);
    throw new Error(`Failed to fetch play count: ${fetchError.message}`);
  }

  if (existing) {
    // Update existing record
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
  } else {
    // Create new record
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
}

/**
 * Updates the top 10 scores for a user's weapon game
 * Note: For weapon, lower turns = better score, so we track the 10 lowest scores
 * If the turns qualify (is in top 10 lowest), inserts it and removes any scores above the 10th lowest
 */
export async function updateTopScores(userId: string, turns: number): Promise<void> {
  const supabase = createClient();
  const gearType = "Weapon";

  try {
    // Query existing scores for this user and gear type, ordered by score ASC (lowest first)
    const { data: existingScores, error: fetchError } = await supabase
      .from("user_top_gear_scores")
      .select("score")
      .eq("user_id", userId)
      .eq("gear_type", gearType)
      .order("score", { ascending: true });

    if (fetchError) {
      console.error("Error fetching top scores:", fetchError);
      throw new Error(`Failed to fetch top scores: ${fetchError.message}`);
    }

    const scores = existingScores || [];
    const hasLessThan10 = scores.length < 10;
    const tenthLowestScore = scores.length >= 10 ? scores[9].score : null;
    const qualifies = hasLessThan10 || (tenthLowestScore !== null && turns <= tenthLowestScore);

    if (qualifies) {
      // Insert new score
      const { error: insertError } = await supabase
        .from("user_top_gear_scores")
        .insert({
          user_id: userId,
          gear_type: gearType,
          score: turns,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("Error inserting top score:", insertError);
        throw new Error(`Failed to insert top score: ${insertError.message}`);
      }

      // Query again to get all scores (including the new one)
      const { data: allScores, error: refetchError } = await supabase
        .from("user_top_gear_scores")
        .select("score, created_at")
        .eq("user_id", userId)
        .eq("gear_type", gearType)
        .order("score", { ascending: true });

      if (refetchError) {
        console.error("Error refetching top scores:", refetchError);
        // Don't throw - we already inserted the score, just log the error
        return;
      }

      // If more than 10 scores exist, delete all scores above the 10th lowest
      if (allScores && allScores.length > 10) {
        const tenthScore = allScores[9].score;
        
        // Delete all scores that are greater than the 10th lowest
        const { error: deleteError } = await supabase
          .from("user_top_gear_scores")
          .delete()
          .eq("user_id", userId)
          .eq("gear_type", gearType)
          .gt("score", tenthScore);

        if (deleteError) {
          console.error("Error deleting excess scores:", deleteError);
          // Don't throw - the score was inserted, just log the error
        }
      }
    }
  } catch (error) {
    console.error("Error in updateTopScores:", error);
    // Don't throw - this is a non-critical operation
  }
}

/**
 * Gets the reward rarity based on turns taken
 * Queries weapon_rewards_lookup to find the lowest max_score >= turns
 * (Since lower turns is better, we want the lowest max_score that qualifies)
 */
export async function getRewardRarity(turns: number): Promise<string | null> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("weapon_rewards_lookup")
      .select("rarity")
      .gte("max_score", turns)
      .order("max_score", { ascending: true })
      .limit(1)
      .single();

    if (error) {
      // If no rows found (PGRST116), that's okay - turns don't qualify
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
 * Gets a random weapon by rarity
 * Queries weapons_lookup and randomly selects one weapon
 */
export async function getRandomWeaponByRarity(
  rarity: string
): Promise<{ id: string; name: string; image_url: string | null; rarity: string } | null> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("weapons_lookup")
      .select("id, name, image_url, rarity")
      .eq("rarity", rarity);

    if (error) {
      console.error("Error fetching weapons by rarity:", error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Randomly select one weapon
    const randomIndex = Math.floor(Math.random() * data.length);
    const selected = data[randomIndex];

    return {
      id: selected.id,
      name: selected.name,
      image_url: selected.image_url,
      rarity: selected.rarity ?? "Base",
    };
  } catch (error) {
    console.error("Error in getRandomWeaponByRarity:", error);
    return null;
  }
}

/**
 * Adds weapon to the user's inventory
 * Inserts into user_inventory table with gear_type "Weapon" and is_equipped false
 */
export async function addToInventory(userId: string, gearId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("user_inventory").insert({
    user_id: userId,
    gear_id: gearId,
    gear_type: "Weapon",
    is_equipped: false,
  });

  if (error) {
    // If duplicate key error, that's okay - user already has this item
    if (error.code === "23505") {
      console.log("Item already in inventory:", gearId);
      return;
    }
    console.error("Error adding to inventory:", error);
    throw new Error(`Failed to add to inventory: ${error.message}`);
  }
}
