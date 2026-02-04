# UI Brief — Arena Triumph

## Theme intent

- **Cozy old-school fantasy RPG** meets **clean modern dashboard intro**
- **Light parchment** as the base: warm, readable, inviting
- Feels like a fantasy game without looking dated or cluttered

## UI principles

- **Readable** — Strong contrast, clear hierarchy, legible type
- **Warm** — Parchment/cream tones, subtle fantasy accents (primary/secondary)
- **Tactile** — Buttons and cards have clear affordances (hover, focus, states)
- **Consistent** — Shared tokens, components, and spacing across the app
- **Performant** — No heavy effects; minimal DOM; token-driven styles

## Do

- Use theme tokens (CSS variables) and semantic Tailwind colors for all UI
- Use existing armor/boss art assets where relevant
- Maintain clear visual hierarchy (display vs body type, spacing scale)
- Keep contrast high for accessibility
- Implement reusable components (Button, Card, PageShell, etc.) instead of ad-hoc styles

## Don’t

- **No heavy skeuomorphism** — Avoid leather textures, heavy bevels, or noisy decoration
- **No low contrast** — Text and interactive elements must stay readable
- **Don’t hardcode colors** — No hex/rgb in components; use tokens only
- Don’t add new external dependencies for this UI pass

## Priority

- **Landing page first** — Establish the look and feel here
- Roll out to other pages (obtain-gear, battle, inventory, etc.) in a later phase
