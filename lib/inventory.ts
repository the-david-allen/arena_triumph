import { createClient } from "@/lib/supabase/client";
import { checkAndUpdateLevel } from "@/lib/levels";

const CDN_BASE_URL = "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev";

export const GEAR_SLOTS = [
  { type: "Weapon", displayName: "Weapon", icon: "weapon.jpg" },
  { type: "Helm", displayName: "Helm", icon: "helm.jpg" },
  { type: "Shoulders", displayName: "Shoulders", icon: "shoulders.jpg" },
  { type: "Chestpiece", displayName: "Chestpiece", icon: "chestpiece.jpg" },
  { type: "Gauntlets", displayName: "Gauntlets", icon: "gauntlets.jpg" },
  { type: "Belt", displayName: "Belt", icon: "belt.jpg" },
  { type: "Leggings", displayName: "Leggings", icon: "leggings.jpg" },
  { type: "Boots", displayName: "Boots", icon: "boots.jpg" },
] as const;

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

export const RARITY_XP: Record<string, number> = {
  Base: 1,
  Common: 2,
  Uncommon: 3,
  Rare: 4,
  Epic: 5,
  Legendary: 10,
  Mythic: 15,
};

export function getSlotIconUrl(iconFilename: string): string {
  return `${CDN_BASE_URL}/slots/${iconFilename}`;
}

export function getAffinityIconUrl(affinityName: string): string {
  return `${CDN_BASE_URL}/affinities/${affinityName.toLowerCase()}.jpg`;
}

export interface GearDetails {
  id: string;
  name: string;
  image_url: string | null;
  strength: number;
  rarity: string;
  primary_affinity: string | null;
  secondary_affinity: string | null;
}

export interface InventoryItem {
  gear_id: string;
  gear_type: string;
  is_equipped: boolean;
  details: GearDetails;
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

async function fetchGearFromLookup(
  gearId: string,
  gearType: string
): Promise<GearDetails | null> {
  const supabase = createClient();
  const table = GEAR_TYPE_TO_LOOKUP_TABLE[gearType];
  if (!table) return null;

  const { data, error } = await supabase
    .from(table)
    .select(
      "id, name, image_url, strength, rarity, primary_affinity, secondary_affinity"
    )
    .eq("id", gearId)
    .single();

  if (error || !data) return null;

  const primaryAffinityName = data.primary_affinity
    ? await getAffinityName(data.primary_affinity)
    : null;
  const secondaryAffinityName = data.secondary_affinity
    ? await getAffinityName(data.secondary_affinity)
    : null;

  return {
    id: data.id,
    name: data.name,
    image_url: data.image_url,
    strength: data.strength ?? 0,
    rarity: data.rarity ?? "Base",
    primary_affinity: primaryAffinityName,
    secondary_affinity: secondaryAffinityName,
  };
}

async function getAffinityName(affinityId: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("affinity_lookup")
    .select("affinity_name")
    .eq("id", affinityId)
    .single();

  if (error || !data) return null;
  return data.affinity_name;
}

/**
 * Fetches all equipped items for a user, organized by slot
 */
export async function fetchEquippedItems(
  userId: string
): Promise<Record<string, InventoryItem>> {
  const supabase = createClient();

  const { data: inventoryRows, error } = await supabase
    .from("user_inventory")
    .select("gear_id, gear_type, is_equipped")
    .eq("user_id", userId)
    .eq("is_equipped", true);

  if (error || !inventoryRows) return {};

  const equippedBySlot: Record<string, InventoryItem> = {};
  for (const row of inventoryRows) {
    const details = await fetchGearFromLookup(row.gear_id, row.gear_type);
    if (details) {
      equippedBySlot[row.gear_type] = {
        gear_id: row.gear_id,
        gear_type: row.gear_type,
        is_equipped: true,
        details,
      };
    }
  }
  return equippedBySlot;
}

/**
 * Fetches all user items for a given slot
 */
export async function fetchInventoryBySlot(
  userId: string,
  gearType: string
): Promise<InventoryItem[]> {
  const supabase = createClient();

  const { data: inventoryRows, error } = await supabase
    .from("user_inventory")
    .select("gear_id, gear_type, is_equipped")
    .eq("user_id", userId)
    .eq("gear_type", gearType);

  if (error || !inventoryRows) return [];

  const items: InventoryItem[] = [];
  for (const row of inventoryRows) {
    const details = await fetchGearFromLookup(row.gear_id, row.gear_type);
    if (details) {
      items.push({
        gear_id: row.gear_id,
        gear_type: row.gear_type,
        is_equipped: row.is_equipped,
        details,
      });
    }
  }
  return items;
}

/**
 * Fetches gear details for display
 */
export async function fetchGearDetails(
  gearId: string,
  gearType: string
): Promise<GearDetails | null> {
  return fetchGearFromLookup(gearId, gearType);
}

/**
 * Equips an item: unequips all others in the slot, then equips the selected item
 */
export async function equipItem(
  userId: string,
  gearId: string,
  gearType: string
): Promise<void> {
  const supabase = createClient();

  const { error: unEquipError } = await supabase
    .from("user_inventory")
    .update({ is_equipped: false })
    .eq("user_id", userId)
    .eq("gear_type", gearType);

  if (unEquipError) {
    console.error("Error unequipping items:", unEquipError);
    throw new Error(`Failed to unequip: ${unEquipError.message}`);
  }

  const { error: equipError } = await supabase
    .from("user_inventory")
    .update({ is_equipped: true })
    .eq("user_id", userId)
    .eq("gear_id", gearId);

  if (equipError) {
    console.error("Error equipping item:", equipError);
    throw new Error(`Failed to equip: ${equipError.message}`);
  }
}

export interface DiscardItemResult {
  leveledUp: boolean;
}

/**
 * Discards an item: deletes from user_inventory and increments user XP
 */
export async function discardItem(
  userId: string,
  gearId: string,
  xpVal: number
): Promise<DiscardItemResult> {
  const supabase = createClient();

  const { error: deleteError } = await supabase
    .from("user_inventory")
    .delete()
    .eq("user_id", userId)
    .eq("gear_id", gearId);

  if (deleteError) {
    console.error("Error discarding item:", deleteError);
    throw new Error(`Failed to discard: ${deleteError.message}`);
  }

  const { data: profile, error: fetchError } = await supabase
    .from("user_profiles")
    .select("xp, level")
    .eq("id", userId)
    .single();

  if (fetchError || !profile) {
    console.error("Error fetching user profile:", fetchError);
    throw new Error(`Failed to update XP: ${fetchError?.message ?? "Profile not found"}`);
  }

  const newXp = (profile.xp ?? 0) + xpVal;
  const currentLevel = profile.level ?? 1;

  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ xp: newXp })
    .eq("id", userId);

  if (updateError) {
    console.error("Error updating XP:", updateError);
    throw new Error(`Failed to update XP: ${updateError.message}`);
  }

  const { leveledUp } = await checkAndUpdateLevel(
    supabase,
    userId,
    newXp,
    currentLevel
  );

  return { leveledUp };
}
