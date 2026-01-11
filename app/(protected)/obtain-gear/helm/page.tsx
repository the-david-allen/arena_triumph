import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HelmPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Helm</h1>
        <p className="mt-2 text-muted-foreground">
          Browse and obtain helms for your character.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Helm Selection</CardTitle>
          <CardDescription>This page is a placeholder for future helm functionality.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Helm features will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
