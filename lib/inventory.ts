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

/**
 * Checks if the user already has an item in their inventory
 */
export async function checkUserHasItem(
  userId: string,
  gearId: string
): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_inventory")
    .select("gear_id")
    .eq("user_id", userId)
    .eq("gear_id", gearId)
    .maybeSingle();

  if (error) {
    console.error("Error checking user inventory:", error);
    return false;
  }
  return data !== null;
}

/**
 * Adds XP to user without deleting any item (for duplicate reward case)
 */
export async function addXpToUser(
  userId: string,
  xpVal: number
): Promise<void> {
  const supabase = createClient();

  const { data: profile, error: fetchError } = await supabase
    .from("user_profiles")
    .select("xp, level")
    .eq("id", userId)
    .single();

  if (fetchError || !profile) {
    console.error("Error fetching user profile:", fetchError);
    throw new Error(
      `Failed to update XP: ${fetchError?.message ?? "Profile not found"}`
    );
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

  await checkAndUpdateLevel(supabase, userId, newXp, currentLevel);
}

/**
 * Batch-fetches affinity names for a set of UUIDs in a single query.
 * Returns a Map from affinity UUID to affinity name.
 */
async function batchGetAffinityNames(
  supabase: ReturnType<typeof createClient>,
  affinityIds: string[]
): Promise<Map<string, string>> {
  if (affinityIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("affinity_lookup")
    .select("id, affinity_name")
    .in("id", affinityIds);

  if (error || !data) return new Map();
  return new Map(data.map((a) => [a.id, a.affinity_name]));
}

interface RawGearRow {
  id: string;
  name: string;
  image_url: string | null;
  strength: number;
  rarity: string;
  primary_affinity: string | null;
  secondary_affinity: string | null;
}

/**
 * Batch-fetches gear details for multiple items grouped by gear type,
 * then resolves all affinity names in a single query.
 */
async function batchFetchGearDetails(
  supabase: ReturnType<typeof createClient>,
  rows: { gear_id: string; gear_type: string }[]
): Promise<Map<string, GearDetails>> {
  if (rows.length === 0) return new Map();

  const grouped = new Map<string, string[]>();
  for (const row of rows) {
    const existing = grouped.get(row.gear_type);
    if (existing) {
      existing.push(row.gear_id);
    } else {
      grouped.set(row.gear_type, [row.gear_id]);
    }
  }

  const rawGearByIdPromises = [...grouped.entries()].map(
    async ([gearType, gearIds]) => {
      const table = GEAR_TYPE_TO_LOOKUP_TABLE[gearType];
      if (!table) return [];
      const { data, error } = await supabase
        .from(table)
        .select(
          "id, name, image_url, strength, rarity, primary_affinity, secondary_affinity"
        )
        .in("id", gearIds);
      if (error || !data) return [];
      return data as RawGearRow[];
    }
  );

  const rawGearArrays = await Promise.all(rawGearByIdPromises);
  const allRawGear = rawGearArrays.flat();

  const affinityIds = new Set<string>();
  for (const gear of allRawGear) {
    if (gear.primary_affinity) affinityIds.add(gear.primary_affinity);
    if (gear.secondary_affinity) affinityIds.add(gear.secondary_affinity);
  }

  const affinityMap = await batchGetAffinityNames(supabase, [...affinityIds]);

  const result = new Map<string, GearDetails>();
  for (const gear of allRawGear) {
    result.set(gear.id, {
      id: gear.id,
      name: gear.name,
      image_url: gear.image_url,
      strength: gear.strength ?? 0,
      rarity: gear.rarity ?? "Base",
      primary_affinity: gear.primary_affinity
        ? affinityMap.get(gear.primary_affinity) ?? null
        : null,
      secondary_affinity: gear.secondary_affinity
        ? affinityMap.get(gear.secondary_affinity) ?? null
        : null,
    });
  }

  return result;
}

/**
 * Fetches all equipped items for a user, organized by slot.
 * Uses batch queries for gear details and affinity names.
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

  if (error || !inventoryRows || inventoryRows.length === 0) return {};

  const detailsMap = await batchFetchGearDetails(supabase, inventoryRows);

  const equippedBySlot: Record<string, InventoryItem> = {};
  for (const row of inventoryRows) {
    const details = detailsMap.get(row.gear_id);
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
 * Fetches all user items for a given slot.
 * Uses batch queries for gear details and affinity names.
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

  if (error || !inventoryRows || inventoryRows.length === 0) return [];

  const detailsMap = await batchFetchGearDetails(supabase, inventoryRows);

  const items: InventoryItem[] = [];
  for (const row of inventoryRows) {
    const details = detailsMap.get(row.gear_id);
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
 * Fetches gear details for a single item.
 * Uses batch helper internally for consistency.
 */
export async function fetchGearDetails(
  gearId: string,
  gearType: string
): Promise<GearDetails | null> {
  const supabase = createClient();
  const detailsMap = await batchFetchGearDetails(supabase, [
    { gear_id: gearId, gear_type: gearType },
  ]);
  return detailsMap.get(gearId) ?? null;
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
