/**
 * Belt nonogram generator (12x12).
 * Ported from reference: deterministic, no-guessing, 75–85 filled cells, medium–hard.
 * Uses bitmask representation and precomputed clue→patterns lookup.
 * A "pattern" is a 12-bit mask (one row or one column); a "run" is a maximal contiguous block of 1s.
 */

const N = 12;
const FULL_MASK = (1 << N) - 1;
const MAX_RUNS_PER_LINE = 3;

export interface GeneratorParams {
  minFilled: number;
  maxFilled: number;
  maxAttempts: number;
  rowAmbiguityMin: number;
  rowAmbiguityMax: number;
  rowForcedMax: number;
  colAmbiguityMin: number;
  colAmbiguityMax: number;
  colForcedMax: number;
  minRounds: number;
  minLineUpdates: number;
  maxFirstRoundCellsSet: number;
  minMaxLineCandidatesSeen: number;
  maxRounds: number;
  maxLineUpdates: number;
  minFirstRoundCellsSet: number;
  maxMaxLineCandidatesSeen: number;
  requireUniqueCheck: boolean;
}

export const DEFAULT_PARAMS: GeneratorParams = {
  minFilled: 80,
  maxFilled: 90,
  maxAttempts: 150000,
  rowAmbiguityMin: 4,
  rowAmbiguityMax: 90,
  rowForcedMax: 8,
  colAmbiguityMin: 4,
  colAmbiguityMax: 95,
  colForcedMax: 8,
  
  // The following parameters ensure the puzzle doesn't get too easy
  minRounds: 4,
  minLineUpdates: 15,
  maxFirstRoundCellsSet:80,
  minMaxLineCandidatesSeen: 10,

  // The following parameters ensure the puzzle doesn't get too hard
  maxRounds: 6,
  maxLineUpdates: 60,
  minFirstRoundCellsSet: 40,
  maxMaxLineCandidatesSeen: 85,

  requireUniqueCheck: true,
};

interface ClueStats {
  ambiguity: number;
  forcedCount: number;
  clueArr: number[];
  ones: number;
}

interface PatternInfo {
  bits: number;
  clue: number[];
  key: string;
  ambiguity: number;
  forcedCount: number;
  ones: number;
}

interface SolveMetrics {
  rounds: number;
  lineUpdates: number;
  cellsSet: number;
  firstRoundCellsSet: number;
  maxLineCandidatesSeen: number;
  stuck: boolean;
  contradiction: boolean;
}

/** Seeded RNG (XorShift32) */
class XorShift32 {
  private s: number;

  constructor(seed: number) {
    this.s = seed >>> 0;
    if (this.s === 0) this.s = 0x9e3779b9;
  }

  nextU32(): number {
    let x = this.s;
    x ^= (x << 13) >>> 0;
    x ^= (x >>> 17) >>> 0;
    x ^= (x << 5) >>> 0;
    this.s = x >>> 0;
    return this.s;
  }

  int(max: number): number {
    return (this.nextU32() % max) | 0;
  }

  pick<T>(arr: T[]): T {
    return arr[this.int(arr.length)];
  }
}

/** String -> 32-bit hash (FNV-1a) for RNG seed */
function seedFromString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Popcount LUT for 0..4095 (12-bit patterns). */
const POPCOUNT = new Uint8Array(1 << N);
for (let x = 0; x < 1 << N; x++) {
  let v = x;
  let c = 0;
  while (v) {
    v &= v - 1;
    c++;
  }
  POPCOUNT[x] = c;
}

/**
 * Number of contiguous filled runs in a 12-bit row/column pattern (0..MAX_RUNS_PER_LINE allowed).
 * Run start at bit i when bit i === 1 and bit i-1 === 0 (i === 0 uses implicit 0).
 */
const RUNCOUNT = new Uint8Array(1 << N);
for (let x = 0; x < 1 << N; x++) {
  const runStarts = (x & ~((x << 1) & FULL_MASK)) & FULL_MASK;
  RUNCOUNT[x] = POPCOUNT[runStarts];
}

/**
 * Sanity-check RUNCOUNT LUT on known patterns. Throws if any check fails.
 * For tests/debug; call at module load.
 */
export function runCountLUTSanityCheck(): boolean {
  if (RUNCOUNT[0b000000000000] !== 0) throw new Error("RUNCOUNT[0] expected 0");
  if (RUNCOUNT[0b111111111111] !== 1) throw new Error("RUNCOUNT[FULL_MASK] expected 1");
  if (RUNCOUNT[0b101010101010] !== 6) throw new Error("RUNCOUNT[0b101010101010] expected 6");
  if (RUNCOUNT[0b001110011100] !== 2) throw new Error("RUNCOUNT[0b001110011100] expected 2");
  return true;
}
runCountLUTSanityCheck();

function bitIndex(lsb: number): number {
  return 31 - Math.clz32(lsb >>> 0);
}

function clueFromBits(bits: number): number[] {
  const clue: number[] = [];
  let run = 0;
  for (let i = 0; i < N; i++) {
    if ((bits >>> i) & 1) run++;
    else if (run) {
      clue.push(run);
      run = 0;
    }
  }
  if (run) clue.push(run);
  return clue;
}

function clueKey(clue: number[]): string {
  return clue.length ? clue.join(",") : "";
}

function sumClue(clue: number[]): number {
  let s = 0;
  for (const k of clue) s += k;
  return s;
}

function buildClueMaps(): {
  clueToPatterns: Map<string, number[]>;
  clueStats: Map<string, ClueStats>;
  patternInfo: PatternInfo[];
} {
  const clueToPatterns = new Map<string, number[]>();
  for (let bits = 0; bits < 1 << N; bits++) {
    const key = clueKey(clueFromBits(bits));
    let arr = clueToPatterns.get(key);
    if (!arr) {
      arr = [];
      clueToPatterns.set(key, arr);
    }
    arr.push(bits);
  }

  const clueStats = new Map<string, ClueStats>();
  for (const [key, patterns] of clueToPatterns.entries()) {
    let forcedOn = FULL_MASK;
    let forcedOff = FULL_MASK;
    for (const p of patterns) {
      forcedOn &= p;
      forcedOff &= ~p & FULL_MASK;
    }
    const forcedCount = POPCOUNT[(forcedOn | forcedOff) & FULL_MASK];
    const clueArr = key === "" ? [] : key.split(",").map(Number);
    const ones = sumClue(clueArr);
    clueStats.set(key, {
      ambiguity: patterns.length,
      forcedCount,
      clueArr,
      ones,
    });
  }

  const patternInfo: PatternInfo[] = new Array(1 << N);
  for (let bits = 0; bits < 1 << N; bits++) {
    const clue = clueFromBits(bits);
    const key = clueKey(clue);
    const st = clueStats.get(key)!;
    patternInfo[bits] = {
      bits: bits & FULL_MASK,
      clue,
      key,
      ambiguity: st.ambiguity,
      forcedCount: st.forcedCount,
      ones: POPCOUNT[bits & FULL_MASK],
    };
  }

  return { clueToPatterns, clueStats, patternInfo };
}

const { clueToPatterns, clueStats, patternInfo } = buildClueMaps();

function patternsForClue(clue: number[]): number[] {
  return clueToPatterns.get(clueKey(clue)) ?? [];
}

function gridColsFromRows(rowBits: number[]): number[] {
  const colBits = new Array<number>(N).fill(0);
  for (let r = 0; r < N; r++) {
    const rb = rowBits[r] >>> 0;
    for (let c = 0; c < N; c++) {
      if ((rb >>> c) & 1) colBits[c] |= 1 << r;
    }
  }
  return colBits;
}

/**
 * Verifies that no row or column has more than MAX_RUNS_PER_LINE runs.
 * For tests/debug; rowBits are 12-bit row patterns.
 */
export function validateRunCountConstraint(rowBits: number[]): boolean {
  for (let r = 0; r < N; r++) {
    if (RUNCOUNT[rowBits[r] & FULL_MASK] > MAX_RUNS_PER_LINE) return false;
  }
  const colBits = gridColsFromRows(rowBits);
  for (let c = 0; c < N; c++) {
    if (RUNCOUNT[colBits[c] & FULL_MASK] > MAX_RUNS_PER_LINE) return false;
  }
  return true;
}

function cluesFromRowBits(rowBits: number[]): { rowClues: number[][]; colClues: number[][] } {
  const rowClues = rowBits.map(clueFromBits);
  const colBits = gridColsFromRows(rowBits);
  const colClues = colBits.map(clueFromBits);
  return { rowClues, colClues };
}

function totalFilled(rowBits: number[]): number {
  let s = 0;
  for (const rb of rowBits) s += POPCOUNT[rb & FULL_MASK];
  return s;
}

function rowBitsToGrid(rowBits: number[]): boolean[][] {
  const grid: boolean[][] = [];
  for (let r = 0; r < N; r++) {
    const rb = rowBits[r] >>> 0;
    const row: boolean[] = new Array(N);
    for (let c = 0; c < N; c++) row[c] = Boolean((rb >>> c) & 1);
    grid.push(row);
  }
  return grid;
}

function deterministicSolve(
  rowClues: number[][],
  colClues: number[][]
): { solved: boolean; rowBits: number[] | null; metrics: SolveMetrics } {
  const rowOn = new Array<number>(N).fill(0);
  const rowOff = new Array<number>(N).fill(0);
  const colOn = new Array<number>(N).fill(0);
  const colOff = new Array<number>(N).fill(0);

  const metrics: SolveMetrics = {
    rounds: 0,
    lineUpdates: 0,
    cellsSet: 0,
    firstRoundCellsSet: 0,
    maxLineCandidatesSeen: 0,
    stuck: false,
    contradiction: false,
  };

  function setCell(r: number, c: number, val: 0 | 1): boolean {
    const bitR = 1 << c;
    const bitC = 1 << r;

    if (val === 1) {
      if (rowOff[r] & bitR) return false;
      if (rowOn[r] & bitR) return true;
      rowOn[r] |= bitR;
      colOn[c] |= bitC;
      metrics.cellsSet++;
      return true;
    } else {
      if (rowOn[r] & bitR) return false;
      if (rowOff[r] & bitR) return true;
      rowOff[r] |= bitR;
      colOff[c] |= bitC;
      metrics.cellsSet++;
      return true;
    }
  }

  function filterCandidates(cands: number[], mustOn: number, mustOff: number): number[] {
    const out: number[] = [];
    for (let i = 0; i < cands.length; i++) {
      const p = cands[i];
      if ((p & mustOn) !== mustOn) continue;
      if (p & mustOff) continue;
      out.push(p);
    }
    return out;
  }

  function deduceFromCandidates(cands: number[]): { forcedOn: number; forcedOff: number } {
    let forcedOn = FULL_MASK;
    let forcedOff = FULL_MASK;
    for (let i = 0; i < cands.length; i++) {
      const p = cands[i];
      forcedOn &= p;
      forcedOff &= ~p & FULL_MASK;
    }
    return { forcedOn, forcedOff };
  }

  const rowBase = rowClues.map(patternsForClue);
  const colBase = colClues.map(patternsForClue);
  for (let i = 0; i < N; i++) {
    if (rowBase[i].length === 0 || colBase[i].length === 0) {
      metrics.contradiction = true;
      return { solved: false, rowBits: null, metrics };
    }
  }

  for (;;) {
    let changed = false;
    metrics.rounds++;

    for (let r = 0; r < N; r++) {
      const cands = filterCandidates(rowBase[r], rowOn[r], rowOff[r]);
      if (cands.length === 0) {
        metrics.contradiction = true;
        return { solved: false, rowBits: null, metrics };
      }
      if (cands.length > metrics.maxLineCandidatesSeen)
        metrics.maxLineCandidatesSeen = cands.length;

      const { forcedOn, forcedOff } = deduceFromCandidates(cands);
      const unknown = ~(rowOn[r] | rowOff[r]) & FULL_MASK;
      const newOn = forcedOn & unknown;
      const newOff = forcedOff & unknown;

      if (newOn || newOff) metrics.lineUpdates++;

      if (newOn) {
        let bits = newOn;
        while (bits) {
          const lsb = bits & -bits;
          const c = bitIndex(lsb);
          if (!setCell(r, c, 1)) {
            metrics.contradiction = true;
            return { solved: false, rowBits: null, metrics };
          }
          bits ^= lsb;
        }
        changed = true;
      }
      if (newOff) {
        let bits = newOff;
        while (bits) {
          const lsb = bits & -bits;
          const c = bitIndex(lsb);
          if (!setCell(r, c, 0)) {
            metrics.contradiction = true;
            return { solved: false, rowBits: null, metrics };
          }
          bits ^= lsb;
        }
        changed = true;
      }
    }

    for (let c = 0; c < N; c++) {
      const cands = filterCandidates(colBase[c], colOn[c], colOff[c]);
      if (cands.length === 0) {
        metrics.contradiction = true;
        return { solved: false, rowBits: null, metrics };
      }
      if (cands.length > metrics.maxLineCandidatesSeen)
        metrics.maxLineCandidatesSeen = cands.length;

      const { forcedOn, forcedOff } = deduceFromCandidates(cands);
      const unknown = ~(colOn[c] | colOff[c]) & FULL_MASK;
      const newOn = forcedOn & unknown;
      const newOff = forcedOff & unknown;

      if (newOn || newOff) metrics.lineUpdates++;

      if (newOn) {
        let bits = newOn;
        while (bits) {
          const lsb = bits & -bits;
          const r = bitIndex(lsb);
          if (!setCell(r, c, 1)) {
            metrics.contradiction = true;
            return { solved: false, rowBits: null, metrics };
          }
          bits ^= lsb;
        }
        changed = true;
      }
      if (newOff) {
        let bits = newOff;
        while (bits) {
          const lsb = bits & -bits;
          const r = bitIndex(lsb);
          if (!setCell(r, c, 0)) {
            metrics.contradiction = true;
            return { solved: false, rowBits: null, metrics };
          }
          bits ^= lsb;
        }
        changed = true;
      }
    }

    if (metrics.rounds === 1) metrics.firstRoundCellsSet = metrics.cellsSet;

    let allKnown = true;
    for (let r = 0; r < N; r++) {
      if (((rowOn[r] | rowOff[r]) & FULL_MASK) !== FULL_MASK) {
        allKnown = false;
        break;
      }
    }
    if (allKnown) {
      return {
        solved: true,
        rowBits: rowOn.map((x) => x & FULL_MASK),
        metrics,
      };
    }

    if (!changed) {
      metrics.stuck = true;
      return { solved: false, rowBits: null, metrics };
    }
  }
}

function countSolutions(
  rowClues: number[][],
  colClues: number[][],
  limit: number = 2
): number {
  const rowCands0 = rowClues.map(patternsForClue);
  const colCands0 = colClues.map(patternsForClue);

  for (let i = 0; i < N; i++) {
    if (rowCands0[i].length === 0) return 0;
    if (colCands0[i].length === 0) return 0;
  }

  let solutions = 0;

  function clone2D(arr2d: number[][]): number[][] {
    return arr2d.map((a) => a.slice());
  }

  function filterByCell(list: number[], bitIdx: number, val: number): number[] {
    const out: number[] = [];
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      if (((p >>> bitIdx) & 1) === val) out.push(p);
    }
    return out;
  }

  function propagate(
    rowCands: number[][],
    colCands: number[][]
  ): boolean {
    let changed = true;
    while (changed) {
      changed = false;

      for (let r = 0; r < N; r++) {
        if (rowCands[r].length !== 1) continue;
        const rb = rowCands[r][0];
        for (let c = 0; c < N; c++) {
          const v = (rb >>> c) & 1;
          const before = colCands[c].length;
          const after = filterByCell(colCands[c], r, v);
          if (after.length === 0) return false;
          if (after.length !== before) {
            colCands[c] = after;
            changed = true;
          }
        }
      }

      for (let c = 0; c < N; c++) {
        if (colCands[c].length !== 1) continue;
        const cb = colCands[c][0];
        for (let r = 0; r < N; r++) {
          const v = (cb >>> r) & 1;
          const before = rowCands[r].length;
          const after = filterByCell(rowCands[r], c, v);
          if (after.length === 0) return false;
          if (after.length !== before) {
            rowCands[r] = after;
            changed = true;
          }
        }
      }
    }
    return true;
  }

  function isDone(rowCands: number[][], colCands: number[][]): boolean {
    for (let i = 0; i < N; i++) {
      if (rowCands[i].length !== 1) return false;
      if (colCands[i].length !== 1) return false;
    }
    return true;
  }

  function pickBranch(
    rowCands: number[][],
    colCands: number[][]
  ): { bestType: "row" | "col" | null; bestIdx: number } {
    let bestType: "row" | "col" | null = null;
    let bestIdx = -1;
    let bestLen = Infinity;
    for (let r = 0; r < N; r++) {
      const len = rowCands[r].length;
      if (len > 1 && len < bestLen) {
        bestLen = len;
        bestType = "row";
        bestIdx = r;
      }
    }
    for (let c = 0; c < N; c++) {
      const len = colCands[c].length;
      if (len > 1 && len < bestLen) {
        bestLen = len;
        bestType = "col";
        bestIdx = c;
      }
    }
    return { bestType, bestIdx };
  }

  function dfs(rowCands: number[][], colCands: number[][]): void {
    if (solutions >= limit) return;
    if (!propagate(rowCands, colCands)) return;

    if (isDone(rowCands, colCands)) {
      solutions++;
      return;
    }

    const { bestType, bestIdx } = pickBranch(rowCands, colCands);
    if (!bestType) return;

    if (bestType === "row") {
      const opts = rowCands[bestIdx];
      for (let i = 0; i < opts.length; i++) {
        const r2 = clone2D(rowCands);
        const c2 = clone2D(colCands);
        r2[bestIdx] = [opts[i]];
        dfs(r2, c2);
        if (solutions >= limit) return;
      }
    } else {
      const opts = colCands[bestIdx];
      for (let i = 0; i < opts.length; i++) {
        const r2 = clone2D(rowCands);
        const c2 = clone2D(colCands);
        c2[bestIdx] = [opts[i]];
        dfs(r2, c2);
        if (solutions >= limit) return;
      }
    }
  }

  dfs(
    rowCands0.map((a) => a.slice()),
    colCands0.map((a) => a.slice())
  );
  return Math.min(solutions, limit);
}

export interface PuzzleDifficulty {
  rounds: number;
  lineUpdates: number;
  firstRoundCellsSet: number;
  maxLineCandidatesSeen: number;
}

export interface GeneratorResult {
  puzzle: boolean[][];
  rowHints: number[][];
  columnHints: number[][];
  difficulty: PuzzleDifficulty;
}

export interface GenerateDeterministicResult {
  dateStr: string;
  filled: number;
  rowClues: number[][];
  colClues: number[][];
  solutionRowBits: number[];
  solutionGrid: boolean[][];
  difficulty: {
    rounds: number;
    lineUpdates: number;
    firstRoundCellsSet: number;
    maxLineCandidatesSeen: number;
  };
}

function generateDeterministicMediumHard(
  seedStr: string,
  overrides: Partial<GeneratorParams> = {}
): GenerateDeterministicResult {
  const P: GeneratorParams = { ...DEFAULT_PARAMS, ...overrides };
  const rng = new XorShift32(seedFromString(seedStr));

  const rowPool: number[] = [];
  for (let bits = 0; bits < 1 << N; bits++) {
    if (RUNCOUNT[bits] > MAX_RUNS_PER_LINE) continue;
    const info = patternInfo[bits];
    if (info.ones < 3 || info.ones > 11) continue;
    if (info.ambiguity < P.rowAmbiguityMin || info.ambiguity > P.rowAmbiguityMax) continue;
    if (info.forcedCount > P.rowForcedMax) continue;
    rowPool.push(info.bits);
  }
  if (rowPool.length === 0) {
    throw new Error("Row pool is empty. Relax rowAmbiguityMin/Max or rowForcedMax.");
  }

  for (let attempt = 0; attempt < P.maxAttempts; attempt++) {
    const rowBits: number[] = [];
    let filled = 0;
    // Column run state for incremental max-3-runs check (per attempt).
    const colRuns = new Array<number>(N).fill(0);
    const colInRun = new Array<number>(N).fill(0);
    const colLockedZero = new Array<number>(N).fill(0);

    let attemptAborted = false;
    for (let r = 0; r < N; r++) {
      let picked: number | null = null;

      for (let tries = 0; tries < 80; tries++) {
        const cand = rng.pick(rowPool) & FULL_MASK;
        const ones = POPCOUNT[cand];
        const newFilled = filled + ones;
        const remaining = N - (r + 1);
        const minPossible = newFilled + remaining * 5;
        const maxPossible = newFilled + remaining * 8;
        if (minPossible > P.maxFilled || maxPossible < P.minFilled) continue;

        // Trial column-run update on copies; reject if any column would exceed 3 runs.
        const colRunsTmp = colRuns.slice();
        const colInRunTmp = colInRun.slice();
        const colLockedZeroTmp = colLockedZero.slice();
        let reject = false;
        for (let c = 0; c < N; c++) {
          const bit = (cand >>> c) & 1;
          if (colLockedZeroTmp[c] && bit === 1) {
            reject = true;
            break;
          }
          if (bit === 1) {
            if (colInRunTmp[c] === 0) {
              colRunsTmp[c]++;
              if (colRunsTmp[c] > MAX_RUNS_PER_LINE) {
                reject = true;
                break;
              }
              colInRunTmp[c] = 1;
            }
          } else {
            if (colInRunTmp[c] === 1) {
              colInRunTmp[c] = 0;
              if (colRunsTmp[c] === MAX_RUNS_PER_LINE) colLockedZeroTmp[c] = 1;
            }
          }
        }
        if (reject) continue;

        // Commit trackers and accept row.
        for (let c = 0; c < N; c++) {
          colRuns[c] = colRunsTmp[c];
          colInRun[c] = colInRunTmp[c];
          colLockedZero[c] = colLockedZeroTmp[c];
        }
        picked = cand;
        filled = newFilled;
        break;
      }

      if (picked === null) {
        attemptAborted = true;
        break;
      }

      rowBits.push(picked);
    }

    if (attemptAborted) continue;
    if (filled < P.minFilled || filled > P.maxFilled) continue;

    // Final sanity: every column must have at most 3 runs.
    const colBits = gridColsFromRows(rowBits);
    let colRunsBad = false;
    for (let c = 0; c < N; c++) {
      if (RUNCOUNT[colBits[c]] > MAX_RUNS_PER_LINE) {
        colRunsBad = true;
        break;
      }
    }
    if (colRunsBad) continue;

    const { rowClues, colClues } = cluesFromRowBits(rowBits);

    let badCols = false;
    for (let c = 0; c < N; c++) {
      const st = clueStats.get(clueKey(colClues[c]));
      if (!st) {
        badCols = true;
        break;
      }
      if (
        st.ambiguity < P.colAmbiguityMin ||
        st.ambiguity > P.colAmbiguityMax ||
        st.forcedCount > P.colForcedMax
      ) {
        badCols = true;
        break;
      }
    }
    if (badCols) continue;

    const det = deterministicSolve(rowClues, colClues);
    if (!det.solved) continue;

    if (P.requireUniqueCheck) {
      if (countSolutions(rowClues, colClues, 2) !== 1) continue;
    }

    const m = det.metrics;
    if (m.rounds < P.minRounds || m.rounds > P.maxRounds) continue;
    if (m.lineUpdates < P.minLineUpdates || m.lineUpdates > P.maxLineUpdates) continue;
    if (m.firstRoundCellsSet > P.maxFirstRoundCellsSet || m.firstRoundCellsSet < P.minFirstRoundCellsSet) continue;
    if (m.maxLineCandidatesSeen < P.minMaxLineCandidatesSeen || m.maxLineCandidatesSeen > P.maxMaxLineCandidatesSeen) continue;

    // Hard gate: never return a grid that violates max 3 runs per line (safety net).
    if (!validateRunCountConstraint(rowBits)) continue;

    return {
      dateStr: seedStr,
      filled,
      rowClues,
      colClues,
      solutionRowBits: rowBits,
      solutionGrid: rowBitsToGrid(rowBits),
      difficulty: {
        rounds: m.rounds,
        lineUpdates: m.lineUpdates,
        firstRoundCellsSet: m.firstRoundCellsSet,
        maxLineCandidatesSeen: m.maxLineCandidatesSeen,
      },
    };
  }

  throw new Error(
    "Failed to generate within maxAttempts. " +
      "Relax difficulty gates or ambiguity constraints, or increase maxAttempts."
  );
}

/**
 * Generate a single 12x12 belt nonogram puzzle.
 * Each call uses a new seed (timestamp) so "Play Game" gets a fresh puzzle.
 * Throws if no valid puzzle is found within maxAttempts.
 */
export function generateBeltPuzzle(seed?: string): GeneratorResult {
  const seedStr = seed ?? Date.now().toString();
  const result = generateDeterministicMediumHard(seedStr);
  return {
    puzzle: result.solutionGrid,
    rowHints: result.rowClues,
    columnHints: result.colClues,
    difficulty: result.difficulty,
  };
}
