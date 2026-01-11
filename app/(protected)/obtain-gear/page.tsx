import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const runtime = "edge";

const gearTypes = [
  { name: "Helm", href: "/obtain-gear/helm", icon: "🪖" },
  { name: "Chestpiece", href: "/obtain-gear/chestpiece", icon: "🛡️" },
  { name: "Boots", href: "/obtain-gear/boots", icon: "👢" },
  { name: "Gauntlets", href: "/obtain-gear/gauntlets", icon: "🧤" },
  { name: "Leggings", href: "/obtain-gear/leggings", icon: "👖" },
  { name: "Belt", href: "/obtain-gear/belt", icon: "⛓️" },
  { name: "Shoulders", href: "/obtain-gear/shoulders", icon: "🎯" },
  { name: "Weapon", href: "/obtain-gear/weapon", icon: "⚔️" },
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
                <div className="text-4xl mb-2">{gear.icon}</div>
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
