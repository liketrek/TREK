/*
 * The measuring and the comparison behind lint:size (scripts/size-lint.mjs).
 *
 * A file's size is its lines as an editor wraps them at WIDTH columns: a line
 * up to WIDTH characters counts once, a longer one once per WIDTH characters
 * it spans. Counting newlines alone let a file stay under its entry by joining
 * lines, and the trip planner page already held a 3760 character one; WIDTH is
 * the printWidth in .prettierrc, so formatted code counts what it shows.
 */
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

export const WIDTH = 120;

/**
 * The kinds of file the check covers, each with the size a file without a
 * baseline entry may reach. Tests get more room: a spec mirrors the component
 * it covers and holds fixtures, but past LIMIT it is a god file too. The
 * Playwright specs and their fixtures under e2e/ count as tests.
 */
export const GROUPS = [
  {
    name: 'test',
    limit: 2000,
    accepts: (key) =>
      /\.tsx?$/.test(key) && (key.startsWith('tests/') || key.startsWith('e2e/') || TEST_FILE.test(key)),
  },
  {
    name: 'source',
    limit: 1000,
    accepts: (key) => key.startsWith('src/') && /\.tsx?$/.test(key) && !TEST_FILE.test(key),
  },
  { name: 'stylesheet', limit: 1000, accepts: (key) => key.startsWith('src/') && key.endsWith('.css') },
];

export const DIRS = ['src', 'tests', 'e2e'];

export function groupOf(key) {
  return GROUPS.find((group) => group.accepts(key)) ?? null;
}

/** The size of a text as wrapped at WIDTH; a final newline does not start another line. */
export function sizeOf(text) {
  if (text === '') return 0;
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  if (text.endsWith('\n')) lines.pop();
  return lines.reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / WIDTH)), 0);
}

/** Every covered file under root with its size, keyed by its path from root. */
export function measure(root) {
  const sizes = {};
  for (const path of listFiles(root, DIRS, (key) => groupOf(key) !== null))
    sizes[toKey(root, path)] = sizeOf(readText(path));
  return sizes;
}

const limitOf = (key) => groupOf(key)?.limit ?? 0;

/**
 * Runs the check against the baseline at baselinePath. With update, the
 * baseline is lowered first. An entry above the file's size now, or for a
 * file that is gone, fails as well until --update lowers it. Returns the
 * exit code.
 */
export function check({
  root,
  baselinePath = join(root, 'scripts/size-baseline.json'),
  update = false,
  log = console.log,
  error = console.error,
}) {
  const sizes = measure(root);
  let baseline = readBaseline(baselinePath, countMap);

  if (update) {
    baseline = lowerCounts(baseline, sizes, limitOf);
    writeBaseline(baselinePath, baseline);
  }

  const grown = Object.entries(sizes).filter(([key, n]) => n > Math.max(baseline[key] ?? 0, limitOf(key)));
  const stale = staleCounts(baseline, sizes, limitOf);

  for (const [key, n] of grown) {
    const entry = baseline[key];
    error(
      `FAIL  ${key}: ${n} lines (wrapped at ${WIDTH} columns), ` +
        (entry ? `its baseline is ${entry}. ` : `the limit for a ${groupOf(key).name} file is ${limitOf(key)}. `) +
        'Move a concern into a module of its own instead of growing the file or packing its lines.'
    );
  }
  reportStale(stale, { file: 'size-baseline.json', command: 'lint:size', root, error });
  log(
    `size: ${Object.keys(sizes).length} file(s), ${Object.keys(baseline).length} past their limit held at their baseline`
  );
  return grown.length || stale.length ? 1 : 0;
}
