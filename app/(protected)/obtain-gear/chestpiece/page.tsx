import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const runtime = "edge";

export default function ChestpiecePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Chestpiece</h1>
        <p className="mt-2 text-muted-foreground">
          Browse and obtain chestpieces for your character.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chestpiece Selection</CardTitle>
          <CardDescription>This page is a placeholder for future chestpiece functionality.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Chestpiece features will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
