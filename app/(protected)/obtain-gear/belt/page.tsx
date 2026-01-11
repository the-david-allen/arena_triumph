import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const runtime = "edge";

export default function BeltPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Belt</h1>
        <p className="mt-2 text-muted-foreground">
          Browse and obtain belts for your character.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Belt Selection</CardTitle>
          <CardDescription>This page is a placeholder for future belt functionality.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Belt features will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
