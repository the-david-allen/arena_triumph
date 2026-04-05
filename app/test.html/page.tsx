"use client";

import { useState } from "react";
import { PageShell } from "@/components/ui/PageShell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

const PALETTE_TABS = [
  "current",
  "alt1",
  "alt2",
  "alt3",
  "alt4",
  "alt5",
  "alt6",
  "alt7",
  "alt8",
] as const;
type PaletteId = (typeof PALETTE_TABS)[number];

const TAB_LABELS: Record<PaletteId, string> = {
  current: "Current",
  alt1: "Alternative 1",
  alt2: "Alternative 2",
  alt3: "Alternative 3",
  alt4: "Alternative 4",
  alt5: "Alternative 5",
  alt6: "Alternative 6",
  alt7: "Alternative 7",
  alt8: "Alternative 8",
};

export default function TestPage() {
  const [loading, setLoading] = useState(false);
  const [activePalette, setActivePalette] = useState<PaletteId>("current");

  return (
    <div
      data-palette={activePalette}
      className="min-h-screen bg-page"
    >
      <nav
        className="border-b border-border bg-surface-2 px-4 py-2"
        aria-label="Palette tabs"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap gap-1 sm:gap-2">
          {PALETTE_TABS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activePalette === id}
              aria-controls="palette-content"
              id={`tab-${id}`}
              onClick={() => setActivePalette(id)}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                activePalette === id
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-text hover:bg-surface-2"
              )}
            >
              {TAB_LABELS[id]}
            </button>
          ))}
        </div>
      </nav>
      <div id="palette-content" role="tabpanel" aria-labelledby={`tab-${activePalette}`}>
      <PageShell className="space-y-12">
      <SectionHeader
        title="UI test page"
        subtitle="Test color palettes and UI settings — standard and custom elements"
        as="h1"
      />

      {/* ========== PART 1: Standard UI ========== */}

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

      <section className="space-y-4">
        <SectionHeader title="Buttons" subtitle="Variants, sizes, and states" />
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Variants</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="default">Default</Button>
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="link">Link</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="destructive">Destructive</Button>
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

      <section className="space-y-4">
        <SectionHeader title="Cards & Panels" subtitle="Surface styling" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Card (surface)</CardTitle>
              <CardDescription>
                Optional description for the card block.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Token-based border and shadow. Use for primary content blocks.
              </p>
            </CardContent>
            <CardFooter>
              <span className="text-muted-foreground text-xs">Card footer</span>
            </CardFooter>
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

      <section className="space-y-4">
        <SectionHeader title="Section headers" subtitle="Title and optional subtitle" />
        <Card className="p-6 space-y-6">
          <SectionHeader title="With subtitle" subtitle="This is the subtitle text." />
          <SectionHeader title="Title only" />
        </Card>
      </section>

      <section className="space-y-4">
        <SectionHeader title="Input" subtitle="Token-based border and ring" />
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

      <section className="space-y-4">
        <SectionHeader title="Scrollable area" subtitle="Scrollbar styling test" />
        <Card className="p-6">
          <div className="max-h-48 overflow-auto rounded-md border border-border bg-surface p-3">
            {Array.from({ length: 20 }, (_, i) => (
              <p key={i} className="text-sm text-text">
                Line {i + 1} — scroll to see more content and test scrollbar appearance.
              </p>
            ))}
          </div>
        </Card>
      </section>

      {/* ========== PART 2: Custom / page-specific UI ========== */}

      <SectionHeader
        title="Custom / page-specific UI elements"
        subtitle="Patterns defined on individual pages — same classes as source"
        as="h2"
      />

      <section className="space-y-4">
        <p className="text-sm font-medium text-text">1. Game completion screen (obtain-gear pages)</p>
        <div className="min-h-[200px] rounded-lg bg-gray-200 p-6 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center space-y-4">
            <h3 className="font-display text-xl font-semibold">Game Complete!</h3>
            <p className="text-sm text-gray-600">You have been rewarded with:</p>
            <div className="h-24 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
              Reward image placeholder
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-sm font-medium text-text">2. Game board / content containers (helm, shoulders, weapon, belt, boots)</p>
        <div className="flex flex-wrap gap-4">
          <div className="border-2 border-game-board-border rounded-lg p-4 bg-surface-2 shadow-lg min-w-[200px] text-text">
            <p className="text-sm">Game board panel</p>
          </div>
          <div className="border-2 border-game-board-border rounded-lg p-4 bg-surface-2 shadow-lg min-w-[200px] text-text">
            <p className="text-sm">Game board panel (same as Panel)</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-sm font-medium text-text">3. Dashed drop zone (shoulders, chestpiece)</p>
        <div className="min-h-[100px] w-full rounded-md border-2 border-dashed border-gray-400 bg-muted/30 flex flex-wrap gap-2 p-3 items-center justify-center">
          <span className="text-muted-foreground text-sm">Drop zone</span>
        </div>
        <div className="min-h-[80px] w-full rounded-md border-2 border-dashed border-gray-400 bg-gray-100/50 flex items-center justify-center">
          <span className="text-gray-500 text-sm">Alternate: bg-gray-100/50</span>
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-sm font-medium text-text">4. Scoring reference box (Shoulders)</p>
        <div className="rounded-lg border-2 border-gray-700 bg-card p-4 shadow-md w-full max-w-sm">
          <h3 className="font-semibold text-sm mb-3">Valid Scoring Combinations</h3>
          <ul className="space-y-2 text-sm text-text">
            <li>1–2: 50 each</li>
            <li>1–2: 100 each</li>
            <li>×3: 800</li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-sm font-medium text-text">5. Tile / cell (belt, boots, leggings)</p>
        <div className="flex flex-wrap gap-2">
          <div className="w-10 h-10 border border-gray-400 bg-white flex items-center justify-center text-xs rounded">1</div>
          <div className="w-10 h-10 border border-gray-400 bg-gray-300 flex items-center justify-center text-xs rounded">2</div>
          <div className="w-10 h-10 border-2 border-gray-400 bg-white hover:border-gray-600 flex items-center justify-center text-xs rounded cursor-pointer">3</div>
          <div className="w-10 h-10 border-2 border-gray-400 bg-white hover:border-gray-600 flex items-center justify-center text-xs rounded cursor-pointer">4</div>
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-sm font-medium text-text">6. Error / alert (chestpiece, shoulders, PreLanding)</p>
        <div className="space-y-2">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            Error or warning message (chestpiece style).
          </div>
          <p className="text-red-600 font-bold text-lg">Strike!</p>
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-sm font-medium text-text">7. Inventory panel (inventory page)</p>
        <div className="rounded-lg border border-border shadow-sm p-4 max-w-xs bg-[var(--inventory-panel-bg)] text-[var(--inventory-panel-fg)]">
          <p className="text-sm">Inventory panel — backpack/knapsack style</p>
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-sm font-medium text-text">8. Leggings submit (leggings page)</p>
        <button
          type="button"
          className="bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900 shadow-lg px-4 py-2 rounded-md border font-medium text-sm"
        >
          Submit guess
        </button>
      </section>

      <section className="space-y-4">
        <p className="text-sm font-medium text-text">9. Battle tier / stat (battle page)</p>
        <div className="space-y-2">
          <p className="text-white drop-shadow-md font-semibold bg-primary/80 px-2 py-1 rounded inline-block">
            Tier label
          </p>
          <p className="text-6xl font-bold text-gray-500">42</p>
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-sm font-medium text-text">10. Chestpiece card and slot</p>
        <div className="flex flex-wrap gap-4">
          <div className="relative w-24 h-32 rounded-lg border-2 border-gray-800 shadow-lg flex items-center justify-center bg-surface">
            <span className="text-xs text-muted-foreground">Card</span>
          </div>
          <div className="relative min-w-[100px] min-h-[140px] rounded-lg border-2 border-dashed border-gray-400 flex items-center justify-center bg-gray-100/50">
            <span className="text-xs text-gray-500">Slot</span>
          </div>
        </div>
      </section>
    </PageShell>
      </div>
    </div>
  );
}
