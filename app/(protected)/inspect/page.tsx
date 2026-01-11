import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function InspectPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Inspect</h1>
        <p className="mt-2 text-muted-foreground">
          Inspect your character and equipment details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inspection View</CardTitle>
          <CardDescription>This page is a placeholder for future inspection functionality.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Inspection features will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
