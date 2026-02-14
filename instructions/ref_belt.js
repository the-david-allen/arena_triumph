/**
 * nonogram12_deterministic_generator.js
 *
 * Copy/paste into your Node.js web app.
 *
 * Generates 12x12 nonogram puzzles that:
 *  - Have 75–85 filled cells (true cells)
 *  - Are solvable with ZERO guessing (pure deterministic forced-cell propagation)
 *  - Have a unique solution (deterministic completion implies uniqueness; optional explicit check included)
 *
 * Approach (fast):
 *  - Represent each row/col as a 12-bit integer mask (0..4095)
 *  - Precompute: clueKey -> all 12-bit patterns matching that clue
 *  - Generate a random solution grid (rows chosen from a constrained pool)
 *  - Derive clues from the solution
 *  - Run deterministic solver; accept only puzzles fully solved without guessing
 *  - Enforce human-ish “medium/hard” via solver metrics thresholds
 */

"use strict";

const N = 12;
const FULL_MASK = (1 << N) - 1;

/* ============================================================================
 * DIFFICULTY + GENERATION PARAMETERS (tune these)
 * ============================================================================
 *
 * The deterministic solver works in rounds:
 *  - It repeatedly deduces forced cells in each row/column by:
 *      candidates = patternsMatchingClue AND consistentWithKnownCells
 *      forcedOn  = intersection (AND) of candidates
 *      forcedOff = intersection (AND) of (~candidate)
 *
 * Difficulty heuristics:
 *  - maxFirstRoundCellsSet: lower => fewer freebies up front => harder
 *  - minRounds: more rounds => more interlocking deductions => harder
 *  - minLineUpdates: more “useful deductions” across lines => typically harder
 *  - minMaxLineCandidatesSeen: ensures at least one line remained fairly ambiguous
 *
 * Pool shaping:
 *  - row/col ambiguity ranges and forcedMax help avoid trivially forced lines.
 */

const DEFAULT_PARAMS = {
  // Filled cells target
  minFilled: 75,
  maxFilled: 85,

  // Attempts for generation loop (increase if you tighten difficulty gates)
  maxAttempts: 40000,

  // Pool constraints for selecting solution rows (controls clue ambiguity & forcedness)
  rowAmbiguityMin: 8,
  rowAmbiguityMax: 250,
  rowForcedMax: 5,

  // Column clue shaping (reject solutions with too-forced or too-floppy column clues)
  colAmbiguityMin: 8,
  colAmbiguityMax: 300,
  colForcedMax: 5,

  // Deterministic difficulty gates (medium->hard defaults)
  minRounds: 8,
  minLineUpdates: 40,
  maxFirstRoundCellsSet: 25,
  minMaxLineCandidatesSeen: 40,

  // Uniqueness: deterministic completion implies uniqueness if deductions are sound.
  // Keep this true if you want an extra safety check (still fast for 12x12).
  requireUniqueCheck: true,
};

/* ----------------------------- Seeded RNG ----------------------------- */
class XorShift32 {
  constructor(seed) {
    this.s = seed >>> 0;
    if (this.s === 0) this.s = 0x9e3779b9;
  }
  nextU32() {
    let x = this.s;
    x ^= (x << 13) >>> 0;
    x ^= (x >>> 17) >>> 0;
    x ^= (x << 5) >>> 0;
    this.s = x >>> 0;
    return this.s;
  }
  int(max) {
    return (this.nextU32() % max) | 0;
  }
  pick(arr) {
    return arr[this.int(arr.length)];
  }
}

// "YYYY-MM-DD" -> 32-bit hash (FNV-1a)
function seedFromDate(dateStr) {
  let h = 0x811c9dc5;
  for (let i = 0; i < dateStr.length; i++) {
    h ^= dateStr.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function formatDateYYYYMMDD(date = new Date()) {
  // Uses server-local time. If you want strict America/New_York daily rollover,
  // compute the date string in that timezone before calling this.
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/* ----------------------------- Popcount LUT ----------------------------- */
const POPCOUNT = new Uint8Array(1 << N);
for (let x = 0; x < (1 << N); x++) {
  let v = x, c = 0;
  while (v) { v &= (v - 1); c++; }
  POPCOUNT[x] = c;
}

function bitIndex(lsb) {
  // lsb is power-of-two within 32-bit
  return 31 - Math.clz32(lsb >>> 0);
}

/* ----------------------------- Clues ----------------------------- */
function clueFromBits(bits) {
  const clue = [];
  let run = 0;
  for (let i = 0; i < N; i++) {
    if ((bits >>> i) & 1) run++;
    else if (run) { clue.push(run); run = 0; }
  }
  if (run) clue.push(run);
  return clue;
}

function clueKey(clue) {
  return clue.length ? clue.join(",") : "";
}

function sumClue(clue) {
  let s = 0;
  for (const k of clue) s += k;
  return s;
}

/* ------------------- Precompute: clueKey -> patterns ------------------- */
function buildClueMaps() {
  const clueToPatterns = new Map(); // key -> int[]
  for (let bits = 0; bits < (1 << N); bits++) {
    const key = clueKey(clueFromBits(bits));
    let arr = clueToPatterns.get(key);
    if (!arr) { arr = []; clueToPatterns.set(key, arr); }
    arr.push(bits);
  }

  const clueStats = new Map(); // key -> { ambiguity, forcedCount, clueArr, ones }
  for (const [key, patterns] of clueToPatterns.entries()) {
    let forcedOn = FULL_MASK;
    let forcedOff = FULL_MASK;
    for (const p of patterns) {
      forcedOn &= p;
      forcedOff &= (~p) & FULL_MASK;
    }
    const forcedCount = POPCOUNT[(forcedOn | forcedOff) & FULL_MASK];
    const clueArr = key === "" ? [] : key.split(",").map(Number);
    const ones = sumClue(clueArr);
    clueStats.set(key, { ambiguity: patterns.length, forcedCount, clueArr, ones });
  }

  // patternInfo for fast pool building
  const patternInfo = new Array(1 << N);
  for (let bits = 0; bits < (1 << N); bits++) {
    const clue = clueFromBits(bits);
    const key = clueKey(clue);
    const st = clueStats.get(key);
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

function patternsForClue(clue) {
  return clueToPatterns.get(clueKey(clue)) || [];
}

/* ------------------------- Grid / clue helpers ------------------------- */
function gridColsFromRows(rowBits) {
  const colBits = new Array(N).fill(0);
  for (let r = 0; r < N; r++) {
    const rb = rowBits[r] >>> 0;
    for (let c = 0; c < N; c++) {
      if ((rb >>> c) & 1) colBits[c] |= (1 << r);
    }
  }
  return colBits;
}

function cluesFromRowBits(rowBits) {
  const rowClues = rowBits.map(clueFromBits);
  const colBits = gridColsFromRows(rowBits);
  const colClues = colBits.map(clueFromBits);
  return { rowClues, colClues };
}

function totalFilled(rowBits) {
  let s = 0;
  for (const rb of rowBits) s += POPCOUNT[rb & FULL_MASK];
  return s;
}

function rowBitsToGrid(rowBits) {
  const grid = [];
  for (let r = 0; r < N; r++) {
    const rb = rowBits[r] >>> 0;
    const row = new Array(N);
    for (let c = 0; c < N; c++) row[c] = Boolean((rb >>> c) & 1);
    grid.push(row);
  }
  return grid;
}

/* ============================================================================
 * Deterministic solver (NO guessing)
 * ============================================================================
 *
 * Returns { solved, rowBits, metrics }.
 * - solved=true means the puzzle is fully solved by forced-cell propagation alone.
 * - rowBits is the solved grid (rows as 12-bit masks) when solved=true.
 */
function deterministicSolve(rowClues, colClues) {
  const rowOn  = new Array(N).fill(0);
  const rowOff = new Array(N).fill(0);
  const colOn  = new Array(N).fill(0);
  const colOff = new Array(N).fill(0);

  const metrics = {
    rounds: 0,
    lineUpdates: 0,
    cellsSet: 0,
    firstRoundCellsSet: 0,
    maxLineCandidatesSeen: 0,
    stuck: false,
    contradiction: false,
  };

  function setCell(r, c, val) {
    const bitR = 1 << c;
    const bitC = 1 << r;

    if (val === 1) {
      if (rowOff[r] & bitR) return false; // contradiction
      if (rowOn[r] & bitR) return true;   // already set
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

  function filterCandidates(cands, mustOn, mustOff) {
    const out = [];
    for (let i = 0; i < cands.length; i++) {
      const p = cands[i];
      if ((p & mustOn) !== mustOn) continue;
      if ((p & mustOff) !== 0) continue;
      out.push(p);
    }
    return out;
  }

  function deduceFromCandidates(cands) {
    let forcedOn = FULL_MASK;
    let forcedOff = FULL_MASK;
    for (let i = 0; i < cands.length; i++) {
      const p = cands[i];
      forcedOn &= p;
      forcedOff &= (~p) & FULL_MASK;
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

  while (true) {
    let changed = false;
    metrics.rounds++;

    // Rows
    for (let r = 0; r < N; r++) {
      const cands = filterCandidates(rowBase[r], rowOn[r], rowOff[r]);
      if (cands.length === 0) {
        metrics.contradiction = true;
        return { solved: false, rowBits: null, metrics };
      }
      if (cands.length > metrics.maxLineCandidatesSeen) metrics.maxLineCandidatesSeen = cands.length;

      const { forcedOn, forcedOff } = deduceFromCandidates(cands);
      const unknown = (~(rowOn[r] | rowOff[r])) & FULL_MASK;
      const newOn  = forcedOn & unknown;
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

    // Cols
    for (let c = 0; c < N; c++) {
      const cands = filterCandidates(colBase[c], colOn[c], colOff[c]);
      if (cands.length === 0) {
        metrics.contradiction = true;
        return { solved: false, rowBits: null, metrics };
      }
      if (cands.length > metrics.maxLineCandidatesSeen) metrics.maxLineCandidatesSeen = cands.length;

      const { forcedOn, forcedOff } = deduceFromCandidates(cands);
      const unknown = (~(colOn[c] | colOff[c])) & FULL_MASK;
      const newOn  = forcedOn & unknown;
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

    // solved?
    let allKnown = true;
    for (let r = 0; r < N; r++) {
      if (((rowOn[r] | rowOff[r]) & FULL_MASK) !== FULL_MASK) { allKnown = false; break; }
    }
    if (allKnown) {
      return { solved: true, rowBits: rowOn.map(x => x & FULL_MASK), metrics };
    }

    // no more progress => would require guessing
    if (!changed) {
      metrics.stuck = true;
      return { solved: false, rowBits: null, metrics };
    }
  }
}

/* ============================================================================
 * Optional explicit uniqueness checker (early exit at 2 solutions)
 * ============================================================================
 *
 * Deterministic completion strongly implies uniqueness in practice and by logic
 * (a differing second solution would keep some cell non-forced).
 * Keep this if you want an extra layer of “guarantee”.
 */
function countSolutions(rowClues, colClues, limit = 2) {
  const rowCands0 = rowClues.map(patternsForClue);
  const colCands0 = colClues.map(patternsForClue);

  for (let i = 0; i < N; i++) {
    if (rowCands0[i].length === 0) return 0;
    if (colCands0[i].length === 0) return 0;
  }

  let solutions = 0;

  function clone2D(arr2d) { return arr2d.map(a => a.slice()); }

  function filterByCell(list, bitIndex, val) {
    const out = [];
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      if (((p >>> bitIndex) & 1) === val) out.push(p);
    }
    return out;
  }

  function propagate(rowCands, colCands) {
    let changed = true;
    while (changed) {
      changed = false;

      // Fixed rows filter columns
      for (let r = 0; r < N; r++) {
        if (rowCands[r].length !== 1) continue;
        const rb = rowCands[r][0];
        for (let c = 0; c < N; c++) {
          const v = (rb >>> c) & 1;
          const before = colCands[c].length;
          const after = filterByCell(colCands[c], r, v);
          if (after.length === 0) return false;
          if (after.length !== before) { colCands[c] = after; changed = true; }
        }
      }

      // Fixed cols filter rows
      for (let c = 0; c < N; c++) {
        if (colCands[c].length !== 1) continue;
        const cb = colCands[c][0];
        for (let r = 0; r < N; r++) {
          const v = (cb >>> r) & 1;
          const before = rowCands[r].length;
          const after = filterByCell(rowCands[r], c, v);
          if (after.length === 0) return false;
          if (after.length !== before) { rowCands[r] = after; changed = true; }
        }
      }
    }
    return true;
  }

  function isDone(rowCands, colCands) {
    for (let i = 0; i < N; i++) {
      if (rowCands[i].length !== 1) return false;
      if (colCands[i].length !== 1) return false;
    }
    return true;
  }

  function pickBranch(rowCands, colCands) {
    let bestType = null, bestIdx = -1, bestLen = Infinity;
    for (let r = 0; r < N; r++) {
      const len = rowCands[r].length;
      if (len > 1 && len < bestLen) { bestLen = len; bestType = "row"; bestIdx = r; }
    }
    for (let c = 0; c < N; c++) {
      const len = colCands[c].length;
      if (len > 1 && len < bestLen) { bestLen = len; bestType = "col"; bestIdx = c; }
    }
    return { bestType, bestIdx };
  }

  function dfs(rowCands, colCands) {
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

  dfs(rowCands0.map(a => a.slice()), colCands0.map(a => a.slice()));
  return Math.min(solutions, limit);
}

/* ============================================================================
 * Generator: deterministic (no guess), medium->hard, 75–85 filled
 * ============================================================================
 */
function generateDeterministicMediumHard(dateStr = formatDateYYYYMMDD(new Date()), overrides = {}) {
  const P = { ...DEFAULT_PARAMS, ...overrides };
  const rng = new XorShift32(seedFromDate(dateStr));

  // Build a pool of row patterns that tend to create medium/hard clues (not too forced)
  const rowPool = [];
  for (let bits = 0; bits < (1 << N); bits++) {
    const info = patternInfo[bits];
    if (info.ones < 3 || info.ones > 11) continue; // avoid extreme rows
    if (info.ambiguity < P.rowAmbiguityMin || info.ambiguity > P.rowAmbiguityMax) continue;
    if (info.forcedCount > P.rowForcedMax) continue;
    rowPool.push(info.bits);
  }
  if (rowPool.length === 0) {
    throw new Error("Row pool is empty. Relax rowAmbiguityMin/Max or rowForcedMax.");
  }

  for (let attempt = 0; attempt < P.maxAttempts; attempt++) {
    // Build candidate solution grid (rowBits)
    const rowBits = [];
    let filled = 0;

    for (let r = 0; r < N; r++) {
      let picked = null;

      // Try to keep the total filled in range via a rough feasibility check
      for (let tries = 0; tries < 80; tries++) {
        const cand = rng.pick(rowPool);
        const ones = POPCOUNT[cand];
        const newFilled = filled + ones;
        const remaining = N - (r + 1);

        // For 75–85 across 12 rows, future rows typically average ~6–7 ones.
        // Use loose bounds to reduce dead-ends.
        const minPossible = newFilled + remaining * 5;
        const maxPossible = newFilled + remaining * 8;
        if (minPossible > P.maxFilled || maxPossible < P.minFilled) continue;

        picked = cand;
        filled = newFilled;
        break;
      }

      if (picked === null) {
        picked = rng.pick(rowPool);
        filled += POPCOUNT[picked];
      }

      rowBits.push(picked & FULL_MASK);
    }

    if (filled < P.minFilled || filled > P.maxFilled) continue;

    const { rowClues, colClues } = cluesFromRowBits(rowBits);

    // Column clue shaping: reject too-forced or too-floppy columns
    let badCols = false;
    for (let c = 0; c < N; c++) {
      const st = clueStats.get(clueKey(colClues[c]));
      if (!st) { badCols = true; break; }
      if (st.ambiguity < P.colAmbiguityMin || st.ambiguity > P.colAmbiguityMax) { badCols = true; break; }
      if (st.forcedCount > P.colForcedMax) { badCols = true; break; }
    }
    if (badCols) continue;

    // Deterministic solvability test
    const det = deterministicSolve(rowClues, colClues);
    if (!det.solved) continue;

    // Optional explicit uniqueness check
    if (P.requireUniqueCheck) {
      if (countSolutions(rowClues, colClues, 2) !== 1) continue;
    }

    // Difficulty gates
    const m = det.metrics;
    if (m.rounds < P.minRounds) continue;
    if (m.lineUpdates < P.minLineUpdates) continue;
    if (m.firstRoundCellsSet > P.maxFirstRoundCellsSet) continue;
    if (m.maxLineCandidatesSeen < P.minMaxLineCandidatesSeen) continue;

    // Success
    return {
      dateStr,
      filled,
      rowClues,
      colClues,

      // optional: include solution if you want to verify client-side or show “reveal”
      // solutionRowBits: rowBits,
      // solutionGrid: rowBitsToGrid(rowBits),

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

/* ----------------------------- Exports ----------------------------- */
module.exports = {
  N,
  DEFAULT_PARAMS,
  generateDeterministicMediumHard,
  deterministicSolve,
  countSolutions,
  // helpers (optional)
  seedFromDate,
  formatDateYYYYMMDD,
  rowBitsToGrid,
  cluesFromRowBits,
};
