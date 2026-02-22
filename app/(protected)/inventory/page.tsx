"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  GEAR_SLOTS,
  getAffinityIconUrl,
  RARITY_XP,
  getCurrentUserId,
  fetchEquippedItems,
  fetchInventoryBySlot,
  equipItem,
  discardItem,
  type InventoryItem,
} from "@/lib/inventory";

export default function InventoryPage() {
  const [selectedSlot, setSelectedSlot] = React.useState<string>("Weapon");
  const [selectedInventoryItem, setSelectedInventoryItem] =
    React.useState<InventoryItem | null>(null);
  const [equippedBySlot, setEquippedBySlot] = React.useState<
    Record<string, InventoryItem>
  >({});
  const [inventoryItems, setInventoryItems] = React.useState<InventoryItem[]>(
    []
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [isActionLoading, setIsActionLoading] = React.useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = React.useState(false);
  const [showLevelUp, setShowLevelUp] = React.useState(false);
  const [pendingDiscard, setPendingDiscard] = React.useState<{
    item: InventoryItem;
    xpVal: number;
  } | null>(null);
  const [showRarityLookup, setShowRarityLookup] = React.useState(false);

  const userIdRef = React.useRef<string | null>(null);

  const RARITY_DISPLAY: { name: string; color: string }[] = [
    { name: "Mythic", color: "rgb(230, 0, 38)" },
    { name: "Legendary", color: "rgb(255, 155, 1)" },
    { name: "Epic", color: "rgb(167, 139, 253)" },
    { name: "Rare", color: "rgb(62, 100, 225)" },
    { name: "Uncommon", color: "rgb(70, 180, 90)" },
    { name: "Common", color: "rgb(255, 255, 255)" },
    { name: "Base", color: "rgb(211, 211, 211)" },
  ];

  React.useEffect(() => {
    if (!showLevelUp) return;
    const t = setTimeout(() => setShowLevelUp(false), 2000);
    return () => clearTimeout(t);
  }, [showLevelUp]);

  const loadEquippedItems = React.useCallback(async () => {
    const userId = userIdRef.current;
    if (!userId) return {};
    const equipped = await fetchEquippedItems(userId);
    setEquippedBySlot(equipped);
    return equipped;
  }, []);

  const loadInventoryForSlot = React.useCallback(
    async (gearType: string) => {
      const userId = userIdRef.current;
      if (!userId) return [];
      const items = await fetchInventoryBySlot(userId, gearType);
      setInventoryItems(items);
      return items;
    },
    []
  );

  React.useEffect(() => {
    let cancelled = false;
    async function init() {
      setIsLoading(true);
      try {
        const userId = await getCurrentUserId();
        if (cancelled) return;
        userIdRef.current = userId;
        if (userId) {
          const equipped = await fetchEquippedItems(userId);
          if (!cancelled) setEquippedBySlot(equipped);
          if (!cancelled) {
            const items = await fetchInventoryBySlot(userId, "Weapon");
            setInventoryItems(items);
            setSelectedInventoryItem(equipped["Weapon"] ?? null);
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSlotClick = React.useCallback(
    async (gearType: string) => {
      setSelectedSlot(gearType);
      const equipped = equippedBySlot[gearType];
      setSelectedInventoryItem(equipped ?? null);
      await loadInventoryForSlot(gearType);
    },
    [loadInventoryForSlot, equippedBySlot]
  );

  const handleGridItemClick = React.useCallback((item: InventoryItem) => {
    setSelectedInventoryItem(item);
  }, []);

  const handleEquip = React.useCallback(async () => {
    if (!selectedInventoryItem) return;
    const userId = userIdRef.current;
    if (!userId) return;

    const itemToEquip = selectedInventoryItem;
    const gearType = itemToEquip.gear_type;

    setEquippedBySlot((prev) => ({
      ...prev,
      [gearType]: { ...itemToEquip, is_equipped: true },
    }));
    setInventoryItems((prev) =>
      prev.map((item) => ({
        ...item,
        is_equipped: item.gear_id === itemToEquip.gear_id,
      }))
    );
    setSelectedInventoryItem({ ...itemToEquip, is_equipped: true });
    setIsActionLoading(true);

    try {
      await equipItem(userId, itemToEquip.gear_id, gearType);
      const [, items] = await Promise.all([
        loadEquippedItems(),
        loadInventoryForSlot(selectedSlot),
      ]);
      if (selectedSlot && items) {
        const updated = items.find((i) => i.gear_id === itemToEquip.gear_id);
        if (updated) setSelectedInventoryItem(updated);
      }
    } catch (err) {
      console.error("Failed to equip:", err);
      await Promise.all([
        loadEquippedItems(),
        loadInventoryForSlot(selectedSlot),
      ]);
    } finally {
      setIsActionLoading(false);
    }
  }, [selectedInventoryItem, selectedSlot, loadEquippedItems, loadInventoryForSlot]);

  const handleDiscardClick = React.useCallback(() => {
    if (!selectedInventoryItem) return;
    const xpVal =
      RARITY_XP[selectedInventoryItem.details.rarity] ??
      RARITY_XP["Base"] ??
      1;
    setPendingDiscard({ item: selectedInventoryItem, xpVal });
    setShowDiscardConfirm(true);
  }, [selectedInventoryItem]);

  const handleDiscardConfirm = React.useCallback(async () => {
    if (!pendingDiscard) return;
    const userId = userIdRef.current;
    if (!userId) return;

    const discardedItem = pendingDiscard.item;
    const discardXp = pendingDiscard.xpVal;

    setShowDiscardConfirm(false);
    setPendingDiscard(null);
    setSelectedInventoryItem(null);
    setInventoryItems((prev) =>
      prev.filter((item) => item.gear_id !== discardedItem.gear_id)
    );
    if (discardedItem.is_equipped) {
      setEquippedBySlot((prev) => {
        const next = { ...prev };
        delete next[discardedItem.gear_type];
        return next;
      });
    }

    setIsActionLoading(true);
    try {
      const result = await discardItem(userId, discardedItem.gear_id, discardXp);
      if (result.leveledUp) setShowLevelUp(true);
      await Promise.all([
        loadEquippedItems(),
        loadInventoryForSlot(selectedSlot),
      ]);
    } catch (err) {
      console.error("Failed to discard:", err);
      await Promise.all([
        loadEquippedItems(),
        loadInventoryForSlot(selectedSlot),
      ]);
    } finally {
      setIsActionLoading(false);
    }
  }, [pendingDiscard, selectedSlot, loadEquippedItems, loadInventoryForSlot]);

  const SLOT_PLURAL: Record<string, string> = {
    Weapon: "Weapons",
    Helm: "Helms",
    Shoulders: "Shoulders",
    Chestpiece: "Chestpieces",
    Gauntlets: "Gauntlets",
    Belt: "Belts",
    Leggings: "Leggings",
    Boots: "Boots",
  };
  const count = inventoryItems.length;
  const slotLabel = count === 1 ? selectedSlot : (SLOT_PLURAL[selectedSlot] ?? `${selectedSlot}s`);
  const inventoryLabel = `Inventory: ${count} ${slotLabel}`;
  const isInventoryLabelWarning = inventoryItems.length >= 20;

  const sortedInventoryItems = React.useMemo(() => {
    return [...inventoryItems].sort((a, b) => {
      if (a.is_equipped) return -1;
      if (b.is_equipped) return 1;
      return (b.details.strength ?? 0) - (a.details.strength ?? 0);
    });
  }, [inventoryItems]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Manage Inventory</h1>
          <Button
            variant="outline"
            onClick={() => setShowRarityLookup(true)}
          >
            Rarity Lookup
          </Button>
        </div>
        <p className="mt-2 text-muted-foreground">
          View, equip, and remove items from your inventory.
        </p>
        {showLevelUp && (
          <p className="mt-2 text-2xl font-bold text-primary">Level Up!</p>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left column: Slot label list */}
        <div className="w-full shrink-0 lg:w-[200px]">
          <div className="rounded-lg border shadow-sm p-2 bg-[rgb(120,75,0)]">
            {GEAR_SLOTS.map((slot) => {
              const isSelected = selectedSlot === slot.type;
              return (
                <button
                  key={slot.type}
                  type="button"
                  onClick={() => handleSlotClick(slot.type)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md transition-colors text-white",
                    isSelected
                      ? "bg-[rgb(160,100,0)] font-medium"
                      : "hover:bg-accent"
                  )}
                >
                  {slot.displayName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right area: Item details + Inventory grid */}
        <div className="flex flex-1 flex-col gap-6">
          {/* Top: Item details + Equip/Discard (equipped area) */}
          <div className="flex flex-col gap-4 rounded-lg border p-4 shadow-sm sm:flex-row bg-[rgb(120,75,0)]">
            <div className="flex flex-1 flex-row items-start gap-4">
              <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/50">
                {selectedInventoryItem?.details?.image_url ? (
                  <Image
                    src={selectedInventoryItem.details.image_url}
                    alt={selectedInventoryItem.details.name}
                    width={128}
                    height={128}
                    className="h-full w-full object-contain"
                    unoptimized
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Select an item
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 pt-0">
                <p className="font-medium">
                  {selectedInventoryItem?.details?.name ? (
                    <>
                      {selectedInventoryItem.details.name}
                      {selectedInventoryItem.is_equipped && " (equipped)"}
                    </>
                  ) : (
                    <span className="text-muted-foreground">&lt;Name&gt;</span>
                  )}
                </p>
                <p className="text-sm">
                  Power:{" "}
                  {selectedInventoryItem?.details?.strength ?? (
                    <span className="text-muted-foreground">___</span>
                  )}
                </p>
                {(selectedInventoryItem?.details?.primary_affinity ||
                  selectedInventoryItem?.details?.secondary_affinity) && (
                  <div className="flex items-center gap-1 text-sm">
                    <span>Affinities:</span>
                    {selectedInventoryItem?.details?.primary_affinity && (
                      <span
                        title={selectedInventoryItem.details.primary_affinity}
                        className="inline-flex"
                      >
                        <Image
                          src={getAffinityIconUrl(
                            selectedInventoryItem.details.primary_affinity
                          )}
                          alt={selectedInventoryItem.details.primary_affinity}
                          width={24}
                          height={24}
                          className="rounded object-contain"
                          unoptimized
                        />
                      </span>
                    )}
                    {selectedInventoryItem?.details?.secondary_affinity && (
                      <span
                        title={selectedInventoryItem.details.secondary_affinity}
                        className="inline-flex"
                      >
                        <Image
                          src={getAffinityIconUrl(
                            selectedInventoryItem.details.secondary_affinity
                          )}
                          alt={selectedInventoryItem.details.secondary_affinity}
                          width={24}
                          height={24}
                          className="rounded object-contain"
                          unoptimized
                        />
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleEquip}
                disabled={!selectedInventoryItem || isActionLoading}
              >
                Equip
              </Button>
              <Button
                variant="destructive"
                onClick={handleDiscardClick}
                disabled={!selectedInventoryItem || isActionLoading}
              >
                Discard
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Discarding an item will gain you experience.
          </p>

          {/* Bottom: Inventory grid */}
          <div className="rounded-lg border p-4 shadow-sm bg-[rgb(120,75,0)]">
            <p
              className={cn(
                "mb-3 font-medium text-white",
                isInventoryLabelWarning && "font-bold text-destructive"
              )}
            >
              {inventoryLabel}
            </p>
            <div className="grid max-h-64 grid-cols-4 gap-2 overflow-y-auto">
              {sortedInventoryItems.map((item) => (
                <button
                  key={item.gear_id}
                  type="button"
                  onClick={() => handleGridItemClick(item)}
                  className={cn(
                    "flex h-16 w-full items-center gap-1 overflow-hidden rounded-lg border px-1 transition-colors hover:bg-accent",
                    selectedInventoryItem?.gear_id === item.gear_id
                      ? "bg-[rgb(160,100,0)]"
                      : "bg-muted/30"
                  )}
                >
                  <div className="h-12 w-12 shrink-0 flex items-center justify-center overflow-hidden">
                    {item.details?.image_url ? (
                      <Image
                        src={item.details.image_url}
                        alt={item.details.name}
                        width={48}
                        height={48}
                        className="h-full w-full object-contain"
                        unoptimized
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">?</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 shrink-0">
                    {item.details?.primary_affinity ? (
                      <span
                        title={item.details.primary_affinity}
                        className="inline-flex"
                      >
                        <Image
                          src={getAffinityIconUrl(item.details.primary_affinity)}
                          alt={item.details.primary_affinity}
                          width={20}
                          height={20}
                          className="rounded object-contain"
                          unoptimized
                        />
                      </span>
                    ) : null}
                    {item.details?.secondary_affinity ? (
                      <span
                        title={item.details.secondary_affinity}
                        className="inline-flex"
                      >
                        <Image
                          src={getAffinityIconUrl(item.details.secondary_affinity)}
                          alt={item.details.secondary_affinity}
                          width={20}
                          height={20}
                          className="rounded object-contain"
                          unoptimized
                        />
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rarity Lookup dialog */}
      <Dialog open={showRarityLookup} onOpenChange={setShowRarityLookup}>
        <DialogContent className="bg-black border-black">
          <DialogHeader>
            <DialogTitle className="text-white">Rarity Lookup</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 py-2">
            {RARITY_DISPLAY.map(({ name, color }) => (
              <div key={name} style={{ color }}>
                {name}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Discard confirmation dialog */}
      <Dialog
        open={showDiscardConfirm}
        onOpenChange={(open) => {
          setShowDiscardConfirm(open);
          if (!open) setPendingDiscard(null);
        }}
      >
        <DialogContent
          onPointerDownOutside={(e) => {
            if (pendingDiscard) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Discard item?</DialogTitle>
            <DialogDescription>
              {pendingDiscard
                ? `Are you sure you want to discard this item for ${pendingDiscard.xpVal} experience?`
                : "Confirm discard."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDiscardConfirm(false);
                setPendingDiscard(null);
              }}
            >
              No
            </Button>
            <Button variant="destructive" onClick={handleDiscardConfirm}>
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
