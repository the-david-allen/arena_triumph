# UI Audit — Current state

Catalog of existing UI elements to be standardized under the new theme and token system.

## Buttons

- **Location**: `components/ui/button.tsx`
- **Implementation**: shadcn-style, uses `class-variance-authority` (cva)
- **Variants**: default, destructive, outline, secondary, ghost, link
- **Sizes**: default, sm, lg, icon
- **Used in**: NavigationBar, PreLandingPage, obtain-gear (belt, boots, chestpiece, gauntlets, helm, leggings, shoulders, weapon), obtain-gear index, battle, battle/[tier], battle/scout/[tier], inventory, inspect, login
- **Standardization**: Replace with recipe-based Button using theme tokens; map default → primary, destructive → danger; add md size and fullWidth/loading; keep same export and prop surface

## Cards

- **Location**: `components/ui/card.tsx`
- **Exports**: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- **Used in**: MainLandingPage, obtain-gear index, battle/scout/[tier]
- **Standardization**: Apply token classes (bg-surface, border-border); optional Panel alias; keep structure for compatibility

## Dialog

- **Location**: `components/ui/dialog.tsx`
- **Implementation**: Radix-based (Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription)
- **Used in**: leggings (Rules + Strengths), helm, chestpiece, boots, gauntlets, belt, weapon, shoulders, inventory, battle
- **Standardization**: Use token-based styles for content/header; extract shared Affinity Strengths content into reusable component

## Typography

- **Location**: `app/layout.tsx`
- **Current**: Single font (Inter) via next/font
- **Standardization**: Add Spectral SC (display) and Spectral (body); expose as CSS vars; map to Tailwind fontFamily; set base line-height and heading scale in globals.css

## Layout

- **Protected layout**: `app/(protected)/layout.tsx` — `min-h-screen bg-background`, main with `max-w-7xl px-4 py-8 sm:px-6 lg:px-8`
- **NavigationBar**: `components/NavigationBar.tsx` — `border-b`, `bg-card`, `shadow-sm`; link styles with primary/muted-foreground
- **Standardization**: Use bg-bg/surface tokens; PageShell component for consistent page padding and max-width

## Spacing and patterns

- Mixed use of `space-y-*`, `p-6`, `gap-4`, `shadow-sm` / `shadow-lg`
- Some pages use raw `bg-gray-200`, `bg-white` (e.g. leggings completion screen, game area) instead of tokens
- **Standardization**: Prefer token backgrounds (bg-bg, bg-surface, bg-surface-2); keep spacing scale consistent; replace raw grays in touched files during landing/styleguide work; full rollout in later phase

## Summary

| Element     | Current                    | Target                          |
|------------|----------------------------|----------------------------------|
| Buttons    | cva, shadcn variants       | recipe, token variants, same API |
| Cards      | card/foreground tokens     | surface/surface-2, border tokens |
| Dialog     | Radix, existing tokens      | Token styling, shared Affinity UI |
| Typography | Inter only                 | Spectral SC + Spectral, tokens   |
| Layout     | background, card           | bg, surface, PageShell           |
| Colors     | HSL vars + some gray-*     | Full token set, no hex/gray-*    |
