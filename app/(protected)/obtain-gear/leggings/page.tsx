import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LeggingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Leggings</h1>
        <p className="mt-2 text-muted-foreground">
          Browse and obtain leggings for your character.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leggings Selection</CardTitle>
          <CardDescription>This page is a placeholder for future leggings functionality.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Leggings features will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
