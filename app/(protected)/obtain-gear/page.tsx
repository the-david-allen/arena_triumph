import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Obtain Gear</h1>
        <p className="mt-2 text-muted-foreground">
          Select a gear type to view available equipment.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {gearTypes.map((gear) => (
          <Link key={gear.href} href={gear.href}>
            <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer h-full">
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
                  Click to view {gear.name.toLowerCase()} options
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
