/**
 * Central registry of tutorial event names for discoverability.
 * Naming convention: {context}-{action}
 */

export const TUTORIAL_EVENTS = {
  // Main game
  "main-landing-daily-rewards-clicked": "main-landing-daily-rewards-clicked",
  "main-landing-affinity-clicked": "main-landing-affinity-clicked",
  "main-landing-nav-clicked": "main-landing-nav-clicked",

  // Chestpiece
  "chestpiece-game-started": "chestpiece-game-started",
  "chestpiece-card-drawn": "chestpiece-card-drawn",
  "chestpiece-card-placed": "chestpiece-card-placed",
  "chestpiece-card-discarded": "chestpiece-card-discarded",

  // Scouting
  "scout-started": "scout-started",
  "scout-cell-selected": "scout-cell-selected",

  // Battle
  "battle-pop-the-lock-hit": "battle-pop-the-lock-hit",
  "battle-started": "battle-started",

  // Obtain Gear
  "obtain-gear-tile-clicked": "obtain-gear-tile-clicked",
} as const;

export type TutorialEventName = (typeof TUTORIAL_EVENTS)[keyof typeof TUTORIAL_EVENTS];
