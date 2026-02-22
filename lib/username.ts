import { createClient } from "@/lib/supabase/client";

// Simple profanity/inappropriate word list
const BLOCKED_WORDS = [
  "admin",
  "moderator",
  "system",
  "null",
  "undefined",
  // Add more as needed
];

export interface UsernameValidationResult {
  isValid: boolean;
  message: string;
}

/**
 * Validates username format and checks for inappropriate words
 */
export function validateUsername(username: string): UsernameValidationResult {
  // Check if empty
  if (!username || username.trim().length === 0) {
    return {
      isValid: false,
      message: "Username cannot be empty",
    };
  }

  // Check length
  if (username.length < 3) {
    return {
      isValid: false,
      message: "Username must be at least 3 characters",
    };
  }

  if (username.length > 20) {
    return {
      isValid: false,
      message: "Username must be 20 characters or less",
    };
  }

  // Check for valid characters (alphanumeric, underscore, hyphen)
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  if (!validPattern.test(username)) {
    return {
      isValid: false,
      message: "Username can only contain letters, numbers, underscores, and hyphens",
    };
  }

  // Check for blocked words
  const lowerUsername = username.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    if (lowerUsername.includes(word)) {
      return {
        isValid: false,
        message: "Username contains inappropriate words",
      };
    }
  }

  return {
    isValid: true,
    message: "Username format is valid",
  };
}

/**
 * Checks if username contains any word from profanity_lookup table.
 * Returns { allowed: false } if it contains a listed word or on error.
 */
export async function checkUsernameAgainstProfanity(
  username: string
): Promise<{ allowed: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("profanity_lookup")
      .select("word");

    if (error) {
      console.error("Error fetching profanity lookup:", error);
      return {
        allowed: false,
        error: "Error checking username availability",
      };
    }

    const lowerUsername = username.toLowerCase();
    const words = (data ?? []) as { word: string }[];
    for (const row of words) {
      const wordLower = (row.word ?? "").toLowerCase();
      if (wordLower && lowerUsername.includes(wordLower)) {
        return { allowed: false };
      }
    }

    return { allowed: true };
  } catch (err) {
    console.error("Error checking username against profanity:", err);
    return {
      allowed: false,
      error: "Error checking username availability",
    };
  }
}

/**
 * Checks if username is available in the database
 */
export async function checkUsernameAvailability(
  username: string
): Promise<{ isAvailable: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("user_profiles")
      .select("username")
      .eq("username", username)
      .maybeSingle();

    if (error) {
      console.error("Error checking username availability:", error);
      return {
        isAvailable: false,
        error: "Error checking username availability",
      };
    }

    return {
      isAvailable: data === null,
    };
  } catch (error) {
    console.error("Error checking username availability:", error);
    return {
      isAvailable: false,
      error: "Error checking username availability",
    };
  }
}

/**
 * Updates user profile with new username and image URL
 */
export async function updateUserProfile(
  userId: string,
  username: string,
  userImageUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("user_profiles")
      .update({
        username,
        user_image_url: userImageUrl,
      })
      .eq("id", userId);

    if (error) {
      console.error("Error updating user profile:", error);
      return {
        success: false,
        error: "Error updating profile",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return {
      success: false,
      error: "Error updating profile",
    };
  }
}
