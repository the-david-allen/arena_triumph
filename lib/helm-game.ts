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
 * Updates the play count for a user's helm game
 * Increments both today_play_count and total_play_count
 */
export async function updatePlayCount(userId: string): Promise<void> {
  const supabase = createClient();
  const gearType = "Helm";

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
      });

    if (insertError) {
      console.error("Error creating play count:", insertError);
      throw new Error(`Failed to create play count: ${insertError.message}`);
    }
  }
}

/**
 * Updates the top 10 scores for a user's helm game
 * If the score qualifies (is in top 10), inserts it and removes any scores below the 10th highest
 */
export async function updateTopScores(userId: string, score: number): Promise<void> {
  const supabase = createClient();
  const gearType = "Helm";

  try {
    // Query existing scores for this user and gear type, ordered by score DESC
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
    const qualifies = hasLessThan10 || (tenthHighestScore !== null && score > tenthHighestScore);

    if (qualifies) {
      // Insert new score
      const { error: insertError } = await supabase
        .from("user_top_gear_scores")
        .insert({
          user_id: userId,
          gear_type: gearType,
          score: score,
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
        .order("score", { ascending: false });

      if (refetchError) {
        console.error("Error refetching top scores:", refetchError);
        // Don't throw - we already inserted the score, just log the error
        return;
      }

      // If more than 10 scores exist, delete all scores below the 10th highest
      if (allScores && allScores.length > 10) {
        const tenthScore = allScores[9].score;
        
        // Delete all scores that are lower than the 10th highest
        const { error: deleteError } = await supabase
          .from("user_top_gear_scores")
          .delete()
          .eq("user_id", userId)
          .eq("gear_type", gearType)
          .lt("score", tenthScore);

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
 * Gets the reward rarity based on final score
 * Queries helm_rewards_lookup to find the highest min_score <= finalScore
 */
export async function getRewardRarity(finalScore: number): Promise<string | null> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("helm_rewards_lookup")
      .select("rarity")
      .lte("min_score", finalScore)
      .order("min_score", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // If no rows found (PGRST116), that's okay - score doesn't qualify
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
 * Gets a random helm by rarity
 * Queries helm_lookup and randomly selects one helm
 */
export async function getRandomHelmByRarity(rarity: string): Promise<{ id: string; name: string; image_url: string | null } | null> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("helm_lookup")
      .select("id, name, image_url")
      .eq("rarity", rarity);

    if (error) {
      console.error("Error fetching helms by rarity:", error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Randomly select one helm
    const randomIndex = Math.floor(Math.random() * data.length);
    const selected = data[randomIndex];

    return {
      id: selected.id,
      name: selected.name,
      image_url: selected.image_url,
    };
  } catch (error) {
    console.error("Error in getRandomHelmByRarity:", error);
    return null;
  }
}

/**
 * Adds a helm to the user's inventory
 * Inserts into user_inventory table with gear_type "Helm" and is_equipped false
 */
export async function addToInventory(userId: string, gearId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("user_inventory").insert({
    user_id: userId,
    gear_id: gearId,
    gear_type: "Helm",
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
