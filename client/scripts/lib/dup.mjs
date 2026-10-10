/*
 * The measuring and the comparison behind lint:dup (scripts/dup-lint.mjs).
 *
 * Copies are found by jscpd's detector at the thresholds SonarCloud applies to
 * TypeScript: a block counts once MIN_TOKENS tokens repeat over at least
 * MIN_LINES lines. Both .ts and .tsx are read as TypeScript, because Sonar
 * treats them as one language and a hook in a .ts file that repeats a view's
 * .tsx code is a copy all the same. A file's count is the number of its lines
 * inside a copied block, the duplicated lines Sonar reports. Which of three
 * copies a block is matched against depends on the order the files are read
 * in, so they are read sorted by path, and with readText, so every machine
 * counts the same.
 */
import { Detector, getModeHandler, MemoryStore } from '@jscpd/core';
import { Tokenizer } from '@jscpd/tokenizer';
import { join } from 'node:path';
import {
  countMap,
  listFiles,
  lowerCounts,
  readBaseline,
  readText,
  reportStale,
  staleCounts,
  TEST_FILE,
  toKey,
  writeBaseline,
} from './ratchet.mjs';

export const MIN_TOKENS = 100;
export const MIN_LINES = 10;

export const DIRS = ['src'];

/** The files SonarCloud analyses as source: tests and declaration files are left out. */
export function accepts(key) {
  return /\.tsx?$/.test(key) && !key.endsWith('.d.ts') && !TEST_FILE.test(key);
}

/**
 * Every copied block under root as a pair of line ranges, one per side. Both
 * sides can be the same file.
 *
 * @returns {Promise<{ key: string, start: number, end: number }[][]>}
 */
export async function findCopies(root) {
  const keys = listFiles(root, DIRS, accepts)
    .map((path) => toKey(root, path))
    .sort();
  const detector = new Detector(new Tokenizer(), new MemoryStore(), [], {
    minTokens: MIN_TOKENS,
    minLines: MIN_LINES,
    mode: getModeHandler('mild'),
  });
  const side = ({ sourceId, start, end }) => ({ key: sourceId, start: start.line, end: end.line });
  const copies = [];
  for (const key of keys) {
    const clones = await detector.detect(key, readText(join(root, key)), 'typescript');
    for (const clone of clones) copies.push([side(clone.duplicationA), side(clone.duplicationB)]);
  }
  return copies;
}

/** Per file in path order, how many of its lines sit inside a copied block. */
export function countLines(copies) {
  const lines = {};
  for (const pair of copies) {
    for (const { key, start, end } of pair) {
      const set = (lines[key] ??= new Set());
      for (let line = start; line <= end; line++) set.add(line);
    }
  }
  return Object.fromEntries(
    Object.entries(lines)
      .filter(([, set]) => set.size > 0)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, set]) => [key, set.size])
  );
}

/** Per file, its copied blocks as "start-end = other:start-end", in line order. */
export function describeCopies(copies) {
  const found = {};
  const range = ({ start, end }) => `${start}-${end}`;
  for (const [a, b] of copies) {
    (found[a.key] ??= []).push({ at: a.start, text: `${range(a)} = ${b.key}:${range(b)}` });
    (found[b.key] ??= []).push({ at: b.start, text: `${range(b)} = ${a.key}:${range(a)}` });
  }
  return Object.fromEntries(
    Object.entries(found).map(([key, list]) => [key, list.sort((x, y) => x.at - y.at).map(({ text }) => text)])
  );
}

/** Runs the check against the baseline at baselinePath and returns the exit code. */
export async function check({
  root,
  baselinePath = join(root, 'scripts/dup-baseline.json'),
  update = false,
  list = false,
  log = console.log,
  error = console.error,
}) {
  const copies = await findCopies(root);
  const counts = countLines(copies);
  const blocks = describeCopies(copies);
  let baseline = readBaseline(baselinePath, countMap);

  if (list) {
    for (const [key, n] of Object.entries(counts)) {
      log(`${key} (${n}, baseline ${baseline[key] ?? 0})`);
      for (const line of blocks[key]) log(`  ${line}`);
    }
  }

  if (update) {
    baseline = lowerCounts(baseline, counts);
    writeBaseline(baselinePath, baseline);
  }

  const grown = Object.entries(counts).filter(([key, n]) => n > (baseline[key] ?? 0));
  const stale = staleCounts(baseline, counts);

  for (const [key, n] of grown) {
    error(`FAIL  ${key}: ${n} line(s) in copied blocks, baseline ${baseline[key] ?? 0}:`);
    for (const line of blocks[key]) error(`        ${line}`);
  }
  if (grown.length) {
    error(
      'Put the code both places need in one shared hook or module and import it from both instead of copying it ' +
        '(useInstanceSettings and useRangeBypass under src/components/Admin/ are the pattern).'
    );
  }
  reportStale(stale, { file: 'dup-baseline.json', command: 'lint:dup', root, error });
  const sum = (map) => Object.values(map).reduce((a, b) => a + b, 0);
  log(
    `dup: ${sum(counts)} line(s) in copied blocks in ${Object.keys(counts).length} file(s), baseline allows ${sum(baseline)}`
  );
  return grown.length || stale.length ? 1 : 0;
}
