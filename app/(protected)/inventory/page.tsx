import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const runtime = "edge";

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Manage Inventory</h1>
        <p className="mt-2 text-muted-foreground">
          Organize and manage your equipment and items.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
          <CardDescription>This page is a placeholder for future inventory functionality.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Inventory management features will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
