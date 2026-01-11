import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account and application settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <CardDescription>This page is a placeholder for future settings functionality.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Settings features will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
