import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WeaponPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Weapon</h1>
        <p className="mt-2 text-muted-foreground">
          Browse and obtain weapons for your character.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weapon Selection</CardTitle>
          <CardDescription>This page is a placeholder for future weapon functionality.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Weapon features will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
