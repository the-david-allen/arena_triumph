import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const runtime = "edge";

interface ScoutPageProps {
  params: Promise<{ tier: string }>;
}

export default async function ScoutPage({ params }: ScoutPageProps) {
  const { tier } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Scout — Tier {tier}</h1>
        <p className="mt-2 text-muted-foreground">
          Scout the Tier {tier} boss before battling. (Placeholder)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scout</CardTitle>
          <CardDescription>
            This page is a placeholder for future scout functionality for Tier {tier}.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground">
            Scout features will be implemented here.
          </p>
          <Button asChild variant="outline" className="w-fit">
            <Link href="/battle">Back to Boss Line-up</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
