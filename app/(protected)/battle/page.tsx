import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const runtime = "edge";

export default function BattlePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Battle</h1>
        <p className="mt-2 text-muted-foreground">
          Prepare for combat and test your skills in the arena.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Battle Arena</CardTitle>
          <CardDescription>This page is a placeholder for future battle functionality.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Battle features will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
