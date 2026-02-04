"use client";

import { PageShell } from "@/components/ui/PageShell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { useState } from "react";

export default function StyleguidePage() {
  const [loading, setLoading] = useState(false);

  return (
    <PageShell className="space-y-12 bg-bg">
      <SectionHeader
        title="Styleguide"
        subtitle="Token-driven UI system — cozy fantasy, light parchment"
        as="h1"
      />

      {/* Typography */}
      <section className="space-y-4">
        <SectionHeader title="Typography" subtitle="Display and body scale" />
        <Card className="p-6">
          <div className="space-y-4 font-body text-text">
            <p className="text-base">
              Body text uses Spectral. Readable and warm for UI copy.
            </p>
            <h1 className="font-display text-3xl font-bold">
              Display heading (Spectral SC)
            </h1>
            <h2 className="font-display text-2xl font-semibold">
              Section heading
            </h2>
            <h3 className="font-display text-xl font-medium">
              Subsection
            </h3>
            <p className="text-muted-foreground text-sm">
              Muted secondary text for descriptions.
            </p>
          </div>
        </Card>
      </section>

      {/* Buttons */}
      <section className="space-y-4">
        <SectionHeader title="Buttons" subtitle="Variants, sizes, and states" />
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Variants</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="link">Link</Button>
                <Button variant="outline">Outline</Button>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Sizes</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="icon" aria-label="Icon">
                  →
                </Button>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm text-muted-foreground">States</p>
              <div className="flex flex-wrap gap-2">
                <Button disabled>Disabled</Button>
                <Button
                  loading={loading}
                  onClick={() => {
                    setLoading(true);
                    setTimeout(() => setLoading(false), 1500);
                  }}
                >
                  {loading ? "Loading…" : "Loading state"}
                </Button>
                <Button fullWidth className="max-w-xs">
                  Full width
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Cards & Panels */}
      <section className="space-y-4">
        <SectionHeader title="Cards & Panels" subtitle="Surface styling" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Card (surface)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Token-based border and shadow. Use for primary content blocks.
              </p>
            </CardContent>
          </Card>
          <Panel className="p-6">
            <h3 className="mb-2 font-display font-semibold text-text">
              Panel (surface-2)
            </h3>
            <p className="text-muted-foreground text-sm">
              Slightly elevated surface for nested or secondary blocks.
            </p>
          </Panel>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <SectionHeader title="Badges" subtitle="Status and tags" />
        <Card className="p-6">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="muted">Muted</Badge>
            <Badge variant="danger">Danger</Badge>
          </div>
        </Card>
      </section>

      {/* Input sample */}
      <section className="space-y-4">
        <SectionHeader title="Input (sample)" subtitle="Token-based border and ring" />
        <Card className="p-6">
          <label className="mb-2 block text-sm font-medium text-text">
            Label
          </label>
          <input
            type="text"
            placeholder="Placeholder"
            className="w-full max-w-sm rounded-md border border-border bg-bg px-3 py-2 text-text placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </Card>
      </section>
    </PageShell>
  );
}
