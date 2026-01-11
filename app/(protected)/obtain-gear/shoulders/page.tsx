import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ShouldersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Shoulders</h1>
        <p className="mt-2 text-muted-foreground">
          Browse and obtain shoulder pieces for your character.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shoulders Selection</CardTitle>
          <CardDescription>This page is a placeholder for future shoulders functionality.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Shoulders features will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
