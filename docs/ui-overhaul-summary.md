# UI Overhaul — Summary and Verification

## Files created

- `docs/ui-brief.md` — Theme intent, principles, do/don’t, priority
- `docs/ui-audit.md` — Current UI elements and standardization notes
- `lib/cn.ts` — Class name merger (clsx + tailwind-merge)
- `lib/recipe.ts` — Variant recipe helper (base, variants, defaultVariants, compoundVariants)
- `components/ui/PageShell.tsx` — Page wrapper (padding, max-width)
- `components/ui/SectionHeader.tsx` — Title + optional subtitle
- `components/ui/Badge.tsx` — Status/tag component
- `components/ui/Panel.tsx` — Elevated surface (surface-2)
- `components/AffinityStrengthsDialog.tsx` — Shared Affinity Strengths popup
- `app/(protected)/styleguide/page.tsx` — Visual QA (typography, buttons, cards, badges, input)
- `app/(protected)/daily-rewards/page.tsx` — Placeholder for forthcoming Daily Rewards
- `docs/ui-overhaul-summary.md` — This file

## Files edited

- `app/globals.css` — Theme tokens (--bg, --surface, --surface-2, --text, --muted, --border, --ring, --primary, --primary-foreground, --secondary, --secondary-foreground, --danger); base typography (font-body, heading font-display, line-height)
- `tailwind.config.ts` — Colors (bg, surface, surface-2, text, danger); fontFamily (display, body)
- `app/layout.tsx` — Spectral + Spectral SC via next/font, CSS variables for fonts
- `components/ui/button.tsx` — Recipe-based, token-only variants/sizes, fullWidth/loading, backward-compatible variant names (default, destructive, outline)
- `components/ui/card.tsx` — Token classes (bg-surface, border-border, text-text); cn from lib/cn
- `components/MainLandingPage.tsx` — Hero “Welcome to the Arena”, flow line, Daily Rewards link, Affinity Reference button, PageShell, Card, tokens, responsive
- `app/(protected)/layout.tsx` — bg-bg for app background
- `app/(protected)/obtain-gear/leggings/page.tsx` — Inline Strengths dialog replaced with AffinityStrengthsDialog; buildMatchupTable removed (moved into shared component)

## How to verify

1. **Styleguide** — Visit `/styleguide` (while logged in). Check:
   - Typography: display vs body font; heading scale
   - Buttons: all variants (primary, secondary, ghost, danger, link, outline) and sizes (sm, md, lg, icon); disabled and loading states
   - Cards and Panel: token surfaces and borders
   - Badges: default, primary, muted, danger
   - Input sample: token border/ring

2. **Landing (desktop)** — Visit `/` (logged in). Check:
   - “Welcome to the Arena” centered in display font
   - “Obtain Gear → Manage Your Inventory → Battle Bosses” below
   - “Daily Rewards” (left) links to `/daily-rewards`
   - “Affinity Reference” (right) opens the same Affinity Strengths popup as Leggings “Strengths”
   - Light parchment background; no layout or logic regressions

3. **Landing (mobile)** — Same URL on narrow viewport. Check:
   - Content stacks; CTAs are easy to tap (min touch target)
   - Typography scales; no horizontal scroll

4. **Leggings** — Visit `/obtain-gear/leggings`. Open “Strengths”; confirm the table matches the previous behavior (same data and layout).

5. **Daily Rewards** — Visit `/daily-rewards`. Placeholder “Daily Rewards — Coming soon” with PageShell/SectionHeader.

## Follow-up (Phase 4 — not done in this pass)

- Apply PageShell, SectionHeader, Card/Panel, Button, Badge and token classes to: obtain-gear pages, battle, inventory, inspect, login, PreLandingPage.
- Replace remaining raw `bg-gray-*` / `bg-white` (e.g. leggings game/completion screens) with `bg-bg` / `bg-surface`.
- Optionally add dark theme tokens and a theme switcher later.
