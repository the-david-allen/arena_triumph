// ─── Types ──────────────────────────────────────────────────────────

export interface ItemRef {
  row: number;
  item: number;
}

export type Clue =
  | { type: "before"; a: ItemRef; b: ItemRef }
  | { type: "adjacent"; a: ItemRef; b: ItemRef }
  | { type: "hTrio"; a: ItemRef; b: ItemRef; c: ItemRef }
  | { type: "vTrio"; a: ItemRef; b: ItemRef; c: ItemRef }
  | { type: "above"; a: ItemRef; b: ItemRef };

/** solution[row][col] = item index assigned to that cell */
export type Solution = [number[], number[], number[], number[]];

export interface ScoutingPuzzle {
  solution: Solution;
  clues: Clue[];
}

// ─── Item Constants ─────────────────────────────────────────────────

export const ROW_LABELS = ["Weapons", "Affinities", "Dice", "Armor"] as const;

export const ITEM_NAMES: readonly (readonly string[])[] = [
  ["Bow", "Staff", "Axe", "Sword"],
  ["Aquatic", "Fire", "Verdant", "Mystic"],
  ["1", "2", "3", "4"],
  ["Helm", "Chest", "Gauntlets", "Boots"],
];

export const ITEM_IMAGES: readonly (readonly string[])[] = [
  [
    "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/weapons/Copper%20Bow.png",
    "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/weapons/Bronze%20Staff.png",
    "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/weapons/Crystalline%20Battle%20Axe.png",
    "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/weapons/Copper%20Shortsword.png",
  ],
  [
    "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/affinities/aquatic.jpg",
    "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/affinities/fire.jpg",
    "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/affinities/verdant.jpg",
    "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/affinities/mystic.jpg",
  ],
  [
    "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/bling/dice/one.png",
    "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/bling/dice/two.png",
    "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/bling/dice/three.png",
    "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/bling/dice/four.png",
  ],
  [
    "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/slots/helm.jpg",
    "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/slots/chestpiece.jpg",
    "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/slots/gauntlets.jpg",
    "https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/slots/boots.jpg",
  ],
];

export function getItemImage(ref: ItemRef): string {
  return ITEM_IMAGES[ref.row][ref.item];
}

export function getItemName(ref: ItemRef): string {
  return ITEM_NAMES[ref.row][ref.item];
}

// ─── Internal: Permutation Table ────────────────────────────────────

const ALL_PERMS: number[][] = [];

(function initPerms() {
  function permute(arr: number[], start: number): void {
    if (start === arr.length) {
      ALL_PERMS.push([...arr]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      [arr[start], arr[i]] = [arr[i], arr[start]];
      permute(arr, start + 1);
      [arr[start], arr[i]] = [arr[i], arr[start]];
    }
  }
  permute([0, 1, 2, 3], 0);
})();

// ─── Internal: Helpers ──────────────────────────────────────────────

function shuffle<T>(arr: readonly T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getCol(perm: number[], item: number): number {
  return perm.indexOf(item);
}

// ─── Internal: Clue Validation ──────────────────────────────────────

function isClueTrue(solution: Solution, clue: Clue): boolean {
  switch (clue.type) {
    case "before": {
      const colA = getCol(solution[clue.a.row], clue.a.item);
      const colB = getCol(solution[clue.b.row], clue.b.item);
      return colA < colB;
    }
    case "adjacent": {
      const colA = getCol(solution[clue.a.row], clue.a.item);
      const colB = getCol(solution[clue.b.row], clue.b.item);
      return Math.abs(colA - colB) === 1;
    }
    case "hTrio": {
      const colA = getCol(solution[clue.a.row], clue.a.item);
      const colB = getCol(solution[clue.b.row], clue.b.item);
      const colC = getCol(solution[clue.c.row], clue.c.item);
      const d = colB - colA;
      return Math.abs(d) === 1 && colC - colB === d;
    }
    case "vTrio": {
      const colA = getCol(solution[clue.a.row], clue.a.item);
      const colB = getCol(solution[clue.b.row], clue.b.item);
      const colC = getCol(solution[clue.c.row], clue.c.item);
      return colA === colB && colB === colC;
    }
    case "above": {
      const colA = getCol(solution[clue.a.row], clue.a.item);
      const colB = getCol(solution[clue.b.row], clue.b.item);
      return colA === colB;
    }
  }
}

// ─── Internal: Enumerate All True Clues ─────────────────────────────

function enumerateTrueClues(solution: Solution): Clue[] {
  const clues: Clue[] = [];
  const colOf = (row: number, item: number) => getCol(solution[row], item);

  // Before: item A is in a column to the left of item B
  for (let rA = 0; rA < 4; rA++) {
    for (let iA = 0; iA < 4; iA++) {
      for (let rB = 0; rB < 4; rB++) {
        for (let iB = 0; iB < 4; iB++) {
          if (rA === rB && iA === iB) continue;
          if (colOf(rA, iA) < colOf(rB, iB)) {
            clues.push({
              type: "before",
              a: { row: rA, item: iA },
              b: { row: rB, item: iB },
            });
          }
        }
      }
    }
  }

  // Adjacent: items are in adjacent columns (unordered pairs)
  for (let rA = 0; rA < 4; rA++) {
    for (let iA = 0; iA < 4; iA++) {
      for (let rB = rA; rB < 4; rB++) {
        const startIB = rA === rB ? iA + 1 : 0;
        for (let iB = startIB; iB < 4; iB++) {
          if (Math.abs(colOf(rA, iA) - colOf(rB, iB)) === 1) {
            clues.push({
              type: "adjacent",
              a: { row: rA, item: iA },
              b: { row: rB, item: iB },
            });
          }
        }
      }
    }
  }

  // hTrio: 3 items in consecutive columns (left-to-right only to avoid dupes)
  for (let startCol = 0; startCol <= 1; startCol++) {
    for (let rA = 0; rA < 4; rA++) {
      for (let rB = 0; rB < 4; rB++) {
        for (let rC = 0; rC < 4; rC++) {
          clues.push({
            type: "hTrio",
            a: { row: rA, item: solution[rA][startCol] },
            b: { row: rB, item: solution[rB][startCol + 1] },
            c: { row: rC, item: solution[rC][startCol + 2] },
          });
        }
      }
    }
  }

  // vTrio: 3 items in the same column with ascending row order
  for (let r1 = 0; r1 < 4; r1++) {
    for (let r2 = r1 + 1; r2 < 4; r2++) {
      for (let r3 = r2 + 1; r3 < 4; r3++) {
        for (let col = 0; col < 4; col++) {
          clues.push({
            type: "vTrio",
            a: { row: r1, item: solution[r1][col] },
            b: { row: r2, item: solution[r2][col] },
            c: { row: r3, item: solution[r3][col] },
          });
        }
      }
    }
  }

  // Above: 2 items in the same column, top item in a higher row
  for (let r1 = 0; r1 < 4; r1++) {
    for (let r2 = r1 + 1; r2 < 4; r2++) {
      for (let col = 0; col < 4; col++) {
        clues.push({
          type: "above",
          a: { row: r1, item: solution[r1][col] },
          b: { row: r2, item: solution[r2][col] },
        });
      }
    }
  }

  return clues;
}

// ─── Internal: Uniqueness Check ─────────────────────────────────────

function isUnique(clues: Clue[]): boolean {
  let found = 0;
  const candidate: number[][] = [[], [], [], []];
  for (const p0 of ALL_PERMS) {
    candidate[0] = p0;
    for (const p1 of ALL_PERMS) {
      candidate[1] = p1;
      for (const p2 of ALL_PERMS) {
        candidate[2] = p2;
        for (const p3 of ALL_PERMS) {
          candidate[3] = p3;
          let valid = true;
          for (const clue of clues) {
            if (!isClueTrue(candidate as Solution, clue)) {
              valid = false;
              break;
            }
          }
          if (valid) {
            found++;
            if (found > 1) return false;
          }
        }
      }
    }
  }
  return found === 1;
}

// ─── Internal: Interleaved Shuffle ──────────────────────────────────
// Ensures diverse clue types in the forward pass ordering.

function shuffleInterleaved(clues: Clue[]): Clue[] {
  const byType: Record<string, Clue[]> = {};
  for (const clue of clues) {
    (byType[clue.type] ??= []).push(clue);
  }
  for (const type of Object.keys(byType)) {
    byType[type] = shuffle(byType[type]);
  }

  const types = shuffle(Object.keys(byType));
  const result: Clue[] = [];
  let round = 0;
  let added = true;
  while (added) {
    added = false;
    for (const type of types) {
      if (round < byType[type].length) {
        result.push(byType[type][round]);
        added = true;
      }
    }
    round++;
  }
  return result;
}

// ─── Internal: Clue Height (for layout sorting) ────────────────────
// 1 = short (single horizontal row): before, adjacent
// 2 = medium (two rows or items+arrows): above, hTrio
// 3 = tall (three stacked items): vTrio

function clueHeight(clue: Clue): number {
  switch (clue.type) {
    case "before":
    case "adjacent":
      return 1;
    case "above":
    case "hTrio":
      return 2;
    case "vTrio":
      return 3;
  }
}

/** Reorder clues so same-height clues sit in the same row in a 2-column grid. */
function orderCluesForTwoColumnGrid(clues: Clue[]): Clue[] {
  if (clues.length === 0) return [];
  const byHeight = new Map<number, Clue[]>();
  for (const c of clues) {
    const h = clueHeight(c);
    if (!byHeight.has(h)) byHeight.set(h, []);
    byHeight.get(h)!.push(c);
  }
  const ordered: Clue[] = [];
  const orphans: Clue[] = [];
  for (const h of [1, 2, 3]) {
    const group = byHeight.get(h) ?? [];
    for (let i = 0; i + 1 < group.length; i += 2) {
      ordered.push(group[i], group[i + 1]);
    }
    if (group.length % 2 === 1) {
      orphans.push(group[group.length - 1]);
    }
  }
  ordered.push(...orphans);
  return ordered;
}

function clueKey(clue: Clue): string {
  const refKey = (r: ItemRef) => `${r.row}-${r.item}`;
  if ("c" in clue) return `${clue.type}:${refKey(clue.a)},${refKey(clue.b)},${refKey(clue.c)}`;
  return `${clue.type}:${refKey(clue.a)},${refKey(clue.b)}`;
}

// ─── Internal: Bonus Clue Count ─────────────────────────────────────
// Target total clues = minimal count + BONUS_CLUES (capped at MAX_TOTAL).
const BONUS_CLUES = 5;
const MAX_TOTAL_CLUES = 16;

// ─── Public: Puzzle Generator ───────────────────────────────────────

export function generateScoutingPuzzle(): ScoutingPuzzle {
  const solution: Solution = [
    shuffle([0, 1, 2, 3]),
    shuffle([0, 1, 2, 3]),
    shuffle([0, 1, 2, 3]),
    shuffle([0, 1, 2, 3]),
  ] as Solution;

  const allClues = enumerateTrueClues(solution);
  const ordered = shuffleInterleaved(allClues);

  // Forward pass: add clues one-by-one until the solution is unique
  const selected: Clue[] = [];
  for (const clue of ordered) {
    selected.push(clue);
    if (isUnique(selected)) break;
  }

  // Backward pass: remove any clue whose removal preserves uniqueness
  for (let i = selected.length - 1; i >= 0; i--) {
    const without = [...selected.slice(0, i), ...selected.slice(i + 1)];
    if (isUnique(without)) {
      selected.splice(i, 1);
    }
  }

  // Bonus pass: add extra redundant clues to lower difficulty
  const selectedKeys = new Set(selected.map(clueKey));
  const remaining = shuffle(
    allClues.filter((c) => !selectedKeys.has(clueKey(c)))
  );
  const bonusTarget = Math.min(
    selected.length + BONUS_CLUES,
    MAX_TOTAL_CLUES
  );
  for (const clue of remaining) {
    if (selected.length >= bonusTarget) break;
    selected.push(clue);
  }

  // Sort by visual height, then reorder so same-height clues share a row in the 2-col grid
  selected.sort((a, b) => clueHeight(a) - clueHeight(b));
  const cluesForGrid = orderCluesForTwoColumnGrid(selected);

  return { solution, clues: cluesForGrid };
}
