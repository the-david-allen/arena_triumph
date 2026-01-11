import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const runtime = "edge";

export default function GauntletsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gauntlets</h1>
        <p className="mt-2 text-muted-foreground">
          Browse and obtain gauntlets for your character.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gauntlets Selection</CardTitle>
          <CardDescription>This page is a placeholder for future gauntlets functionality.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Gauntlets features will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
