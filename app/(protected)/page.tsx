import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const runtime = "edge";

export default function MainPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome to Arena Triumph</h1>
        <p className="mt-2 text-muted-foreground">
          Your adventure begins here. Choose your path from the navigation above.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Battle</CardTitle>
            <CardDescription>Engage in combat and test your skills</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Obtain Gear</CardTitle>
            <CardDescription>Acquire new equipment for your character</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Manage Inventory</CardTitle>
            <CardDescription>Organize and manage your items</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
