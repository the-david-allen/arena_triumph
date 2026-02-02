"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  fetchEquippedItems,
  getAffinityIconUrl,
  getCurrentUserId,
  type InventoryItem,
} from "@/lib/inventory";
import {
  fetchUserProfile,
  fetchAllContestants,
  type UserProfile,
  type Contestant,
} from "@/lib/inspect";

export const runtime = "edge";

interface EquipmentSlotProps {
  item: InventoryItem | null;
  slotName: string;
  layout?: "horizontal" | "vertical";
  textAlign?: "left" | "right";
  imagePosition?: "left" | "right";
  className?: string;
}

function EquipmentSlot({
  item,
  slotName,
  layout = "vertical",
  textAlign = "left",
  imagePosition = "left",
  className,
}: EquipmentSlotProps) {
  const isHorizontal = layout === "horizontal";
  const imageOnRight = imagePosition === "right";

  const imageElement = (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/50">
      {item?.details?.image_url ? (
        <Image
          src={item.details.image_url}
          alt={item.details.name}
          width={56}
          height={56}
          className="h-full w-full object-contain"
          unoptimized
        />
      ) : (
        <span className="text-[10px] text-muted-foreground">{slotName}</span>
      )}
    </div>
  );

  const textElement = (
    <div
      className={cn(
        "text-xs",
        textAlign === "right" && "text-right"
      )}
    >
      <p className="font-medium leading-tight">
        {item?.details?.name ?? (
          <span className="text-muted-foreground">Empty</span>
        )}
      </p>
      <p className="text-muted-foreground">
        Power: {item?.details?.strength ?? "—"}
      </p>
      <div
        className={cn(
          "flex flex-wrap items-center gap-1",
          textAlign === "right" && "justify-end"
        )}
      >
        <span className="text-muted-foreground">Affinities:</span>
        {item?.details?.primary_affinity ? (
          <Image
            src={getAffinityIconUrl(item.details.primary_affinity)}
            alt={item.details.primary_affinity}
            width={14}
            height={14}
            className="rounded object-contain"
            unoptimized
          />
        ) : (
          <span className="h-3.5 w-3.5 rounded border bg-muted/30" />
        )}
        {item?.details?.secondary_affinity ? (
          <Image
            src={getAffinityIconUrl(item.details.secondary_affinity)}
            alt={item.details.secondary_affinity}
            width={14}
            height={14}
            className="rounded object-contain"
            unoptimized
          />
        ) : (
          <span className="h-3.5 w-3.5 rounded border bg-muted/30" />
        )}
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "flex gap-2",
        isHorizontal ? "flex-row items-start" : "flex-col",
        imageOnRight && !isHorizontal && "items-end",
        !imageOnRight && !isHorizontal && "items-start",
        className
      )}
    >
      {imageElement}
      {textElement}
    </div>
  );
}

export default function InspectPage() {
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(
    null
  );
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(
    null
  );
  const [equippedItems, setEquippedItems] = React.useState<
    Record<string, InventoryItem>
  >({});
  const [contestants, setContestants] = React.useState<Contestant[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Load current user and contestants on mount
  React.useEffect(() => {
    let cancelled = false;

    async function init() {
      setIsLoading(true);
      try {
        const userId = await getCurrentUserId();
        if (cancelled) return;

        if (userId) {
          setCurrentUserId(userId);
          setSelectedUserId(userId);
        }

        const allContestants = await fetchAllContestants();
        if (cancelled) return;
        setContestants(allContestants);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load profile and equipped items when selected user changes
  React.useEffect(() => {
    if (!selectedUserId) return;

    let cancelled = false;

    async function loadUserData() {
      const [profile, equipped] = await Promise.all([
        fetchUserProfile(selectedUserId!),
        fetchEquippedItems(selectedUserId!),
      ]);

      if (cancelled) return;

      setUserProfile(profile);
      setEquippedItems(equipped);
    }

    loadUserData();
    return () => {
      cancelled = true;
    };
  }, [selectedUserId]);

  const handleContestantClick = React.useCallback((contestant: Contestant) => {
    setSelectedUserId(contestant.id);
  }, []);

  const handleInspectSelf = React.useCallback(() => {
    if (currentUserId) {
      setSelectedUserId(currentUserId);
    }
  }, [currentUserId]);

  const isViewingSelf = selectedUserId === currentUserId;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left: Player Display Area */}
        <div className="flex-1">
          {/* Player Name and Level - Centered above the character display */}
          <div className="mb-4 text-center">
            <h1 className="text-3xl font-bold text-foreground">
              {userProfile?.username ?? "Unknown Player"}
            </h1>
            <p className="text-lg text-muted-foreground">
              Level: {userProfile?.level ?? 1}
            </p>
          </div>

          {/* Equipment Layout - Fixed grid matching wireframe */}
          <div className="relative mx-auto w-fit">
            {/* Top row: Shoulders and Head - horizontal layout with text to the right */}
            <div className="mb-2 flex justify-center gap-4">
              <EquipmentSlot
                item={equippedItems["Shoulders"] ?? null}
                slotName="Shoulders"
                layout="horizontal"
              />
              <EquipmentSlot
                item={equippedItems["Helm"] ?? null}
                slotName="Head"
                layout="horizontal"
              />
            </div>

            {/* Middle section: Left slots | Player Image | Right slot */}
            <div className="flex items-center justify-center gap-3">
              {/* Left side: Chest and Gauntlets - image on right next to player */}
              <div className="flex w-36 flex-col items-end gap-3">
                <EquipmentSlot
                  item={equippedItems["Chestpiece"] ?? null}
                  slotName="Chest"
                  textAlign="right"
                  imagePosition="right"
                />
                <EquipmentSlot
                  item={equippedItems["Gauntlets"] ?? null}
                  slotName="Gauntlets"
                  textAlign="right"
                  imagePosition="right"
                />
              </div>

              {/* Center: Player Image - 50% larger (384x384) */}
              <div className="flex h-96 w-96 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 bg-muted/30">
                {userProfile?.user_image_url ? (
                  <Image
                    src={userProfile.user_image_url}
                    alt={userProfile.username ?? "Player"}
                    width={384}
                    height={384}
                    className="h-full w-full object-contain"
                    unoptimized
                  />
                ) : (
                  <span className="text-muted-foreground">Player Image</span>
                )}
              </div>

              {/* Right side: Weapon - vertical layout */}
              <div className="flex w-36 flex-col items-start gap-3">
                <EquipmentSlot
                  item={equippedItems["Weapon"] ?? null}
                  slotName="Weapon"
                  layout="vertical"
                />
              </div>
            </div>

            {/* Bottom row: Leggings, Belt, Boots - vertical layout */}
            <div className="mt-2 flex justify-center gap-6">
              <EquipmentSlot
                item={equippedItems["Leggings"] ?? null}
                slotName="Leggings"
                layout="vertical"
              />
              <EquipmentSlot
                item={equippedItems["Belt"] ?? null}
                slotName="Belt"
                layout="vertical"
              />
              <EquipmentSlot
                item={equippedItems["Boots"] ?? null}
                slotName="Boots"
                layout="vertical"
              />
            </div>
          </div>
        </div>

        {/* Right: Arena Contestants */}
        <div className="w-full shrink-0 lg:w-72">
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="border-b px-4 py-3">
              <h2 className="text-lg font-semibold">Arena Contestants:</h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {contestants.map((contestant) => (
                <button
                  key={contestant.id}
                  type="button"
                  onClick={() => handleContestantClick(contestant)}
                  className={cn(
                    "w-full px-4 py-2 text-left transition-colors hover:bg-accent",
                    selectedUserId === contestant.id &&
                      "bg-primary/10 font-medium"
                  )}
                >
                  {contestant.username}
                </button>
              ))}
              {contestants.length === 0 && (
                <p className="px-4 py-3 text-sm text-muted-foreground">
                  No contestants found
                </p>
              )}
            </div>
          </div>

          {/* Inspect Self Button */}
          <Button
            onClick={handleInspectSelf}
            disabled={isViewingSelf}
            className="mt-4 w-full"
            variant={isViewingSelf ? "outline" : "default"}
          >
            Inspect Self
          </Button>
        </div>
      </div>
    </div>
  );
}
