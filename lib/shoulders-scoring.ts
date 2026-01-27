const CDN_BASE = "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev";

export const DIE_FACES = [
  "Armor",
  "Weapon",
  "Aquatic",
  "Fire",
  "Verdant",
  "Rock",
] as const;

export type DieFace = (typeof DIE_FACES)[number];

export const DIE_FACE_IMAGES: Record<DieFace, string> = {
  Armor: `${CDN_BASE}/slots/chestpiece.jpg`,
  Weapon: `${CDN_BASE}/slots/weapon.jpg`,
  Aquatic: `${CDN_BASE}/affinities/aquatic.jpg`,
  Fire: `${CDN_BASE}/affinities/fire.jpg`,
  Verdant: `${CDN_BASE}/affinities/verdant.jpg`,
  Rock: `${CDN_BASE}/affinities/rock.jpg`,
};

function isDieFace(s: string): s is DieFace {
  return DIE_FACES.includes(s as DieFace);
}

export function parseDieFace(s: string): DieFace {
  if (isDieFace(s)) return s;
  return DIE_FACES[0];
}

export interface ScoringResult {
  valid: boolean;
  score: number;
}

/**
 * Computes the best score for a set of dice faces.
 * Uses greedy application of combos in score-descending order.
 */
export function computeScore(faces: DieFace[]): ScoringResult {
  const count: Record<DieFace, number> = {
    Armor: 0,
    Weapon: 0,
    Aquatic: 0,
    Fire: 0,
    Verdant: 0,
    Rock: 0,
  };
  for (const f of faces) {
    count[f]++;
  }

  let score = 0;

  function c(f: DieFace): number {
    return count[f];
  }
  function use(f: DieFace, n: number): void {
    count[f] -= n;
  }

  // 6 of a kind: 2000
  for (const f of DIE_FACES) {
    if (c(f) >= 6) {
      score += 2000;
      use(f, 6);
      break;
    }
  }

  // 5 of a kind: 1500
  for (const f of DIE_FACES) {
    if (c(f) >= 5) {
      score += 1500;
      use(f, 5);
      break;
    }
  }

  // 4 of a kind: 1000
  for (const f of DIE_FACES) {
    if (c(f) >= 4) {
      score += 1000;
      use(f, 4);
      break;
    }
  }

  // 1 each of all six: 1000
  if (
    c("Armor") >= 1 &&
    c("Weapon") >= 1 &&
    c("Aquatic") >= 1 &&
    c("Fire") >= 1 &&
    c("Verdant") >= 1 &&
    c("Rock") >= 1
  ) {
    score += 1000;
    use("Armor", 1);
    use("Weapon", 1);
    use("Aquatic", 1);
    use("Fire", 1);
    use("Verdant", 1);
    use("Rock", 1);
  }

  // 3 Armor or 3 Weapon: 800
  if (c("Armor") >= 3) {
    score += 800;
    use("Armor", 3);
  }
  if (c("Weapon") >= 3) {
    score += 800;
    use("Weapon", 3);
  }

  // 3 Verdant or 3 Rock: 500
  if (c("Verdant") >= 3) {
    score += 500;
    use("Verdant", 3);
  }
  if (c("Rock") >= 3) {
    score += 500;
    use("Rock", 3);
  }

  // 3 Aquatic or 3 Fire: 250
  if (c("Aquatic") >= 3) {
    score += 250;
    use("Aquatic", 3);
  }
  if (c("Fire") >= 3) {
    score += 250;
    use("Fire", 3);
  }

  // 1 or 2 Weapon: 100 each
  score += Math.min(c("Weapon"), 2) * 100;
  use("Weapon", Math.min(c("Weapon"), 2));

  // 1 or 2 Armor: 50 each
  score += Math.min(c("Armor"), 2) * 50;
  use("Armor", Math.min(c("Armor"), 2));

  return {
    valid: score > 0,
    score,
  };
}
