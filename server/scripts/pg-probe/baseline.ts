/**
 * The Postgres probe's ratchet: how many statements of each repository method
 * Postgres may still refuse, and which methods the probe may still leave
 * unmeasured.
 *
 * `scripts/pg-probe-baseline.json` maps `Class.method` to the number of
 * distinct statements of that method that failed on Postgres when the entry
 * was written. A method may fail no more statements than its entry (none
 * without one), and an entry above what its method fails now fails the check
 * too, so the change that fixes a statement lowers the baseline with it.
 * `--update` lowers entries and drops the ones that reach zero or whose
 * method is gone; it never raises or adds one.
 *
 * Only statements Postgres refuses as SQL count here (SQLSTATE classes 42
 * and 0A, see `countsTowardRatchet`). A value the sample arguments got wrong
 * (class 22, a sample string in a date column) says nothing about the
 * dialect and is reported without being held.
 *
 * `uncovered` lists the methods whose SQL the probe did not see: the ones it
 * could not call, the ones that sent no SQL (they threw first, or never
 * reach the database) and the ones that timed out. A method outside that
 * list that ends up uncovered (a new method the sampler cannot build
 * arguments for, or an old one that starts throwing before its first
 * statement) fails the run, and so does an entry whose method is measured
 * now or gone, so the list only shrinks and the part of the code the probe
 * reaches cannot quietly shrink with it.
 *
 * The only exception is the first run: a baseline whose `failing` or
 * `uncovered` is `null` has never been measured, so there is nothing to
 * compare and the run fails (scripts/pg-probe.ts) until the first
 * measurement, written by `--update` or taken from the CI artifact, is
 * committed.
 */
import { readFileSync } from 'node:fs';

export interface ProbeBaseline {
  /** `Class.method` → failing statements allowed; `null` until the first measurement is written. */
  failing: Record<string, number> | null;
  /** `Class.method` names the probe may leave unmeasured; `null` until the first measurement is written. */
  uncovered: string[] | null;
}

export interface BaselineVerdict {
  /** The baseline has never been measured: nothing to compare, and the run fails until it is seeded. */
  unseeded: boolean;
  /** Methods failing more statements than their entry allows. */
  grown: { method: string; allowed: number; now: number }[];
  /** Entries above what their method fails now (the method may be gone). */
  stale: { method: string; allowed: number; now: number }[];
  /** Methods the probe did not measure that the baseline does not list. */
  newlyUncovered: string[];
  /** Entries in `uncovered` whose method is measured now, or gone. */
  nowCovered: string[];
}

/**
 * Whether a refused statement counts toward the ratchet: SQLSTATE class 42
 * (syntax error, unknown function, operator or column, datatype mismatch)
 * and class 0A (feature not supported) are what a SQLite-only spelling gets.
 * Anything else (a data exception such as 22P02 or 22007, a constraint, a
 * timeout) comes from the sample values or the empty tables, not the SQL.
 */
export function countsTowardRatchet(code: string): boolean {
  return /^(42|0A)/.test(code);
}

const METHOD_KEY = /^[A-Za-z_$][\w$]*\.[A-Za-z_$][\w$]*$/;

export function parseBaseline(text: string, source: string): ProbeBaseline {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error(`${source} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data) || !('failing' in data)) {
    throw new Error(`${source} must be an object with a "failing" key`);
  }
  return {
    failing: parseFailing((data as { failing: unknown }).failing, source),
    uncovered: parseUncovered((data as { uncovered?: unknown }).uncovered, source),
  };
}

function parseFailing(failing: unknown, source: string): Record<string, number> | null {
  if (failing === null) return null;
  if (typeof failing !== 'object' || Array.isArray(failing)) {
    throw new Error(`${source}: "failing" must be null or an object of Class.method to counts`);
  }
  const entries: Record<string, number> = {};
  for (const [method, count] of Object.entries(failing as Record<string, unknown>)) {
    if (!METHOD_KEY.test(method)) {
      throw new Error(`${source}: "${method}" is not a Class.method key`);
    }
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 1) {
      throw new Error(`${source}: ${method} holds ${JSON.stringify(count)}, expected a positive integer`);
    }
    entries[method] = count;
  }
  return entries;
}

/** A missing `uncovered` key reads as unmeasured, so a baseline written before the list existed gets it seeded. */
function parseUncovered(uncovered: unknown, source: string): string[] | null {
  if (uncovered === undefined || uncovered === null) return null;
  if (!Array.isArray(uncovered))
    throw new Error(`${source}: "uncovered" must be null or an array of Class.method names`);
  const seen = new Set<string>();
  for (const method of uncovered as unknown[]) {
    if (typeof method !== 'string' || !METHOD_KEY.test(method)) {
      throw new Error(`${source}: "uncovered" holds ${JSON.stringify(method)}, expected a Class.method name`);
    }
    if (seen.has(method)) throw new Error(`${source}: "uncovered" lists ${method} twice`);
    seen.add(method);
  }
  return [...seen];
}

export function readBaseline(path: string): ProbeBaseline {
  return parseBaseline(readFileSync(path, 'utf8'), path);
}

/**
 * Compares what failed now (`Class.method` → failing statements, zero counts
 * allowed) and which methods went unmeasured now with the baseline.
 */
export function compareWithBaseline(
  baseline: ProbeBaseline,
  failingNow: ReadonlyMap<string, number>,
  uncoveredNow: ReadonlySet<string>,
): BaselineVerdict {
  if (baseline.failing === null || baseline.uncovered === null) {
    return { unseeded: true, grown: [], stale: [], newlyUncovered: [], nowCovered: [] };
  }
  const allowedFor = baseline.failing;
  const grown: BaselineVerdict['grown'] = [];
  const stale: BaselineVerdict['stale'] = [];
  for (const [method, now] of [...failingNow.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const allowed = allowedFor[method] ?? 0;
    if (now > allowed) grown.push({ method, allowed, now });
  }
  for (const method of Object.keys(allowedFor).sort()) {
    const allowed = allowedFor[method]!;
    const now = failingNow.get(method) ?? 0;
    if (now < allowed) stale.push({ method, allowed, now });
  }
  const listed = new Set(baseline.uncovered);
  const newlyUncovered = [...uncoveredNow].filter((method) => !listed.has(method)).sort((a, b) => a.localeCompare(b));
  const nowCovered = [...listed].filter((method) => !uncoveredNow.has(method)).sort((a, b) => a.localeCompare(b));
  return { unseeded: false, grown, stale, newlyUncovered, nowCovered };
}

/**
 * The baseline `--update` writes: every entry lowered to what its method
 * fails now, zeros dropped, `uncovered` cut to the methods still unmeasured,
 * nothing added. An unseeded part is seeded with what the run saw.
 */
export function lowerBaseline(
  baseline: ProbeBaseline,
  failingNow: ReadonlyMap<string, number>,
  uncoveredNow: ReadonlySet<string>,
): ProbeBaseline {
  const next: Record<string, number> = {};
  if (baseline.failing === null) {
    for (const [method, now] of failingNow) if (now > 0) next[method] = now;
  } else {
    for (const [method, allowed] of Object.entries(baseline.failing)) {
      const now = Math.min(allowed, failingNow.get(method) ?? 0);
      if (now > 0) next[method] = now;
    }
  }
  const uncovered =
    baseline.uncovered === null ? [...uncoveredNow] : baseline.uncovered.filter((method) => uncoveredNow.has(method));
  return {
    failing: Object.fromEntries(Object.entries(next).sort(([a], [b]) => a.localeCompare(b))),
    uncovered: [...new Set(uncovered)].sort((a, b) => a.localeCompare(b)),
  };
}

export function formatBaseline(baseline: ProbeBaseline): string {
  return `${JSON.stringify(baseline, null, 2)}\n`;
}
