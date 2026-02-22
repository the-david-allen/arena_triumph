"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { getTodayPlayCountsByUser } from "@/lib/playcount";
import { cn } from "@/lib/utils";

export const runtime = "edge";

const CDN_BASE_URL = "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/slots";

const gearTypes = [
  { name: "Helm", href: "/obtain-gear/helm", image: "helm.jpg" },
  { name: "Chestpiece", href: "/obtain-gear/chestpiece", image: "chestpiece.jpg" },
  { name: "Boots", href: "/obtain-gear/boots", image: "boots.jpg" },
  { name: "Gauntlets", href: "/obtain-gear/gauntlets", image: "gauntlets.jpg" },
  { name: "Leggings", href: "/obtain-gear/leggings", image: "leggings.jpg" },
  { name: "Belt", href: "/obtain-gear/belt", image: "belt.jpg" },
  { name: "Shoulders", href: "/obtain-gear/shoulders", image: "shoulders.jpg" },
  { name: "Weapon", href: "/obtain-gear/weapon", image: "weapon.jpg" },
];

export default function ObtainGearPage() {
  const [playCountsByGear, setPlayCountsByGear] = React.useState<
    Record<string, number> | null
  >(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const counts = await getTodayPlayCountsByUser(user.id);
      if (!cancelled) setPlayCountsByGear(counts);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const isLoading = playCountsByGear === null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Obtain Gear</h1>
        <p className="mt-2 text-muted-foreground">
          Select a gear slot to play for a new piece of gear.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {gearTypes.map((gear) => (
            <Card key={gear.href} className="h-full opacity-70">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <Image
                    src={`${CDN_BASE_URL}/${gear.image}`}
                    alt={gear.name}
                    width={128}
                    height={128}
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <CardTitle className="text-lg">{gear.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center">
                  Loading…
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {gearTypes.map((gear) => {
            const todayCount = playCountsByGear[gear.name] ?? 0;
            const remaining = Math.max(0, 3 - todayCount);
            const disabled = remaining <= 0;
            const label =
              remaining > 0
                ? `${remaining} plays remaining today`
                : "No plays remaining today";

            const cardContent = (
              <Card
                className={cn(
                  "h-full",
                  disabled
                    ? "opacity-75 cursor-not-allowed pointer-events-none"
                    : "transition-all hover:shadow-lg hover:scale-105 cursor-pointer"
                )}
              >
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    <Image
                      src={`${CDN_BASE_URL}/${gear.image}`}
                      alt={gear.name}
                      width={128}
                      height={128}
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <CardTitle className="text-lg">{gear.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">
                    {label}
                  </p>
                </CardContent>
              </Card>
            );

            if (disabled) {
              return <div key={gear.href}>{cardContent}</div>;
            }
            return (
              <Link key={gear.href} href={gear.href}>
                {cardContent}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
