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
  getSlotIconUrl,
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
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);
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
  const [pendingDiscard, setPendingDiscard] = React.useState<{
    item: InventoryItem;
    xpVal: number;
  } | null>(null);

  const loadEquippedItems = React.useCallback(async () => {
    const userId = await getCurrentUserId();
    if (!userId) return {};
    const equipped = await fetchEquippedItems(userId);
    setEquippedBySlot(equipped);
    return equipped;
  }, []);

  const loadInventoryForSlot = React.useCallback(
    async (gearType: string) => {
      const userId = await getCurrentUserId();
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
        await loadEquippedItems();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [loadEquippedItems]);

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
    const userId = await getCurrentUserId();
    if (!userId) return;
    const equippedGearId = selectedInventoryItem.gear_id;
    setIsActionLoading(true);
    try {
      await equipItem(
        userId,
        selectedInventoryItem.gear_id,
        selectedInventoryItem.gear_type
      );
      await loadEquippedItems();
      if (selectedSlot) {
        const items = await loadInventoryForSlot(selectedSlot);
        setInventoryItems(items);
        const updated = items.find((i) => i.gear_id === equippedGearId);
        if (updated) setSelectedInventoryItem(updated);
      }
    } catch (err) {
      console.error("Failed to equip:", err);
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
    const userId = await getCurrentUserId();
    if (!userId) return;
    setIsActionLoading(true);
    try {
      await discardItem(userId, pendingDiscard.item.gear_id, pendingDiscard.xpVal);
      setShowDiscardConfirm(false);
      setPendingDiscard(null);
      setSelectedInventoryItem(null);
      await loadEquippedItems();
      if (selectedSlot) {
        await loadInventoryForSlot(selectedSlot);
      }
    } catch (err) {
      console.error("Failed to discard:", err);
    } finally {
      setIsActionLoading(false);
    }
  }, [pendingDiscard, selectedSlot, loadEquippedItems, loadInventoryForSlot]);

  const inventoryLabel =
    selectedSlot === null
      ? "Inventory: "
      : `Inventory: ${inventoryItems.length} ${selectedSlot}`;
  const isInventoryLabelWarning = selectedSlot !== null && inventoryItems.length >= 20;

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
        <h1 className="text-3xl font-bold text-foreground">Manage Inventory</h1>
        <p className="mt-2 text-muted-foreground">
          View, equip, and remove items from your inventory.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left column: Slot list + Equipped */}
        <div className="w-full shrink-0 lg:w-[260px]">
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="grid grid-cols-2 gap-2 border-b px-3 py-1.5 font-semibold">
              <span>Slot</span>
              <span className="text-right">Equipped</span>
            </div>
            <div className="divide-y">
              {GEAR_SLOTS.map((slot) => {
                const isSelected = selectedSlot === slot.type;
                const equipped = equippedBySlot[slot.type];
                return (
                  <div
                    key={slot.type}
                    className={cn(
                      "grid grid-cols-2 gap-2 px-3 py-1.5 transition-colors",
                      isSelected && "bg-primary/10"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleSlotClick(slot.type)}
                      title={slot.displayName}
                      className={cn(
                        "flex items-center justify-center rounded-md border p-2 transition-colors hover:bg-accent",
                        isSelected
                          ? "border-primary font-bold ring-2 ring-primary"
                          : "border-transparent"
                      )}
                    >
                      <Image
                        src={getSlotIconUrl(slot.icon)}
                        alt={slot.displayName}
                        width={64}
                        height={64}
                        className="object-contain"
                        unoptimized
                      />
                    </button>
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => equipped && handleGridItemClick(equipped)}
                        disabled={!equipped}
                        className={cn(
                          "h-16 w-16 shrink-0 rounded border flex items-center justify-center overflow-hidden transition-colors hover:bg-accent disabled:pointer-events-none",
                          selectedInventoryItem?.gear_id === equipped?.gear_id
                            ? "ring-2 ring-primary"
                            : "bg-muted/50"
                        )}
                      >
                        {equipped?.details?.image_url ? (
                          <Image
                            src={equipped.details.image_url}
                            alt={equipped.details.name}
                            width={64}
                            height={64}
                            className="h-full w-full object-contain"
                            unoptimized
                          />
                        ) : null}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right area: Item details + Inventory grid */}
        <div className="flex flex-1 flex-col gap-6">
          {/* Top: Item details + Equip/Discard */}
          <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm sm:flex-row">
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
                <div className="flex items-center gap-1 text-sm">
                  <span>Affinities:</span>
                  {selectedInventoryItem?.details?.primary_affinity ? (
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
                  ) : (
                    <span className="h-6 w-6 rounded border bg-muted/50" />
                  )}
                  {selectedInventoryItem?.details?.secondary_affinity ? (
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
                  ) : (
                    <span className="h-6 w-6 rounded border bg-muted/50" />
                  )}
                </div>
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

          {/* Bottom: Inventory grid */}
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p
              className={cn(
                "mb-3 font-medium",
                isInventoryLabelWarning && "font-bold text-destructive"
              )}
            >
              {inventoryLabel}
            </p>
            <div className="grid max-h-64 grid-cols-4 gap-2 overflow-y-auto">
              {inventoryItems.map((item) => (
                <button
                  key={item.gear_id}
                  type="button"
                  onClick={() => handleGridItemClick(item)}
                  className={cn(
                    "flex h-16 w-full items-center justify-center overflow-hidden rounded-lg border transition-colors hover:bg-accent",
                    selectedInventoryItem?.gear_id === item.gear_id
                      ? "ring-2 ring-primary"
                      : "bg-muted/30"
                  )}
                >
                  {item.details?.image_url ? (
                    <Image
                      src={item.details.image_url}
                      alt={item.details.name}
                      width={64}
                      height={64}
                      className="h-full w-full object-contain"
                      unoptimized
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">?</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

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
