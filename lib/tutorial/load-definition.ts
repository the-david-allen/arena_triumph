/**
 * Load tutorial definitions from JSON. Start with static imports;
 * can later switch to Supabase fetch for remote config.
 */

import type { TutorialDefinition } from "./types";

import mainGame from "@/data/tutorials/main-game.json";
import chestpiece from "@/data/tutorials/chestpiece.json";
import helm from "@/data/tutorials/helm.json";
import boots from "@/data/tutorials/boots.json";
import gauntlets from "@/data/tutorials/gauntlets.json";
import leggings from "@/data/tutorials/leggings.json";
import belt from "@/data/tutorials/belt.json";
import shoulders from "@/data/tutorials/shoulders.json";
import weapon from "@/data/tutorials/weapon.json";
import scouting from "@/data/tutorials/scouting.json";
import battle from "@/data/tutorials/battle.json";

const DEFINITIONS: Record<string, TutorialDefinition> = {
  "main-game": mainGame as TutorialDefinition,
  chestpiece: chestpiece as TutorialDefinition,
  helm: helm as TutorialDefinition,
  boots: boots as TutorialDefinition,
  gauntlets: gauntlets as TutorialDefinition,
  leggings: leggings as TutorialDefinition,
  belt: belt as TutorialDefinition,
  shoulders: shoulders as TutorialDefinition,
  weapon: weapon as TutorialDefinition,
  scouting: scouting as TutorialDefinition,
  battle: battle as TutorialDefinition,
};

export async function loadTutorialDefinition(
  tutorialId: string
): Promise<TutorialDefinition | null> {
  return DEFINITIONS[tutorialId] ?? null;
}

export function getTutorialDefinitionSync(
  tutorialId: string
): TutorialDefinition | null {
  return DEFINITIONS[tutorialId] ?? null;
}
