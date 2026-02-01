import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const runtime = "edge";

interface BattleTierPageProps {
  params: Promise<{ tier: string }>;
}

export default async function BattleTierPage({ params }: BattleTierPageProps) {
  const { tier } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Battle — Tier {tier}</h1>
        <p className="mt-2 text-muted-foreground">
          Prepare for combat against the Tier {tier} boss. (Placeholder)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Battle Arena</CardTitle>
          <CardDescription>
            This page is a placeholder for future battle functionality for Tier {tier}.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground">
            Battle features will be implemented here.
          </p>
          <Button asChild variant="outline" className="w-fit">
            <Link href="/battle">Back to Boss Line-up</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
