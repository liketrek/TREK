#!/usr/bin/env node
/*
 * lint:size: keeps server source files from growing into the next god service.
 *
 * The same ratchet as client/scripts/size-lint.mjs. A file past a thousand
 * lines holds several concerns that no longer fit in one reading (maps,
 * places and journey are the cautionary tales), and every change to one of
 * them risks the others. Each source file under src/ and scripts/ may hold
 * LIMIT lines; the files that were already longer are listed in
 * scripts/size-baseline.json with the length they had, and the check fails
 * when one of them grows past its entry. A file that needs to grow is split
 * by concern instead (trips into trips/trip-members/trip-membership/
 * trip-invite/trip-read-model/calendar is the precedent). An entry above what
 * its file holds now, or for a file that is gone, fails as well until
 * --update lowers it: otherwise the file could grow back unseen, and a new
 * file at a deleted path would inherit its allowance.
 *
 * Lines are counted the way they read, not the way they are stored: a line
 * longer than LINE_WIDTH (prettier's printWidth) counts once per LINE_WIDTH
 * columns it spans, so joining lines does not buy room under the limit.
 *
 *   npm run lint:size              check against the baseline (CI)
 *   npm run lint:size -- --update  lower the baseline to what the files hold now;
 *                                  it never raises an entry, and drops a file
 *                                  that is back under the limit
 *
 * --dir=<path> points the check at another server root (the unit tests use it).
 * Walking the tree and handling the baseline live in scripts/lib/ratchet.mjs
 * at the repository root.
 */
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  listFiles,
  lowerCounts,
  RatchetError,
  readBaseline,
  readText,
  runCli,
  staleCounts,
  toKey,
  writeBaseline,
} from '../../scripts/lib/ratchet.mjs';

/** The most lines a file without a baseline entry may hold. */
const LIMIT = 1000;

/** prettier's printWidth for the server: a line past it counts once per width it spans. */
const LINE_WIDTH = 120;

/** The trees the check walks, relative to the server root. Each one must exist. */
const ROOTS = ['src', 'scripts'];

const SOURCE = /\.(?:[cm]?[jt]s)$/;
const TEST = /\.(?:test|spec)\./;

const accepts = (key) => {
  const name = key.slice(key.lastIndexOf('/') + 1);
  return SOURCE.test(name) && !TEST.test(name);
};

/**
 * Lines as an editor numbers them (a final newline does not start another),
 * with every line longer than LINE_WIDTH weighted by the widths it spans.
 */
function lineCount(text) {
  if (text === '') return 0;
  const lines = text.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  let total = 0;
  for (const line of lines) total += Math.max(1, Math.ceil(line.length / LINE_WIDTH));
  return total;
}

/** Weighted line counts keyed by the server-relative POSIX path. A missing root is an error. */
function scan(serverDir) {
  const counts = {};
  for (const path of listFiles(serverDir, ROOTS, accepts)) counts[toKey(serverDir, path)] = lineCount(readText(path));
  return counts;
}

/** Every entry must be a whole number above the limit: anything else is a hand edit gone wrong. */
function sizeEntries(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return 'it must be an object of file paths to line counts';
  }
  for (const [file, n] of Object.entries(value)) {
    if (!Number.isInteger(n) || n <= LIMIT) return `${file} holds ${JSON.stringify(n)}, expected an integer above ${LIMIT}`;
  }
  return null;
}

function check(argv) {
  const dirArg = argv.find((a) => a.startsWith('--dir='));
  const serverDir = dirArg ? resolve(dirArg.slice('--dir='.length)) : fileURLToPath(new URL('..', import.meta.url));
  const baselinePath = join(serverDir, 'scripts', 'size-baseline.json');

  const counts = scan(serverDir);
  let baseline = readBaseline(baselinePath, sizeEntries);
  if (argv.includes('--update')) {
    baseline = lowerCounts(baseline, counts, LIMIT);
    writeBaseline(baselinePath, baseline);
  }

  const grown = Object.entries(counts).filter(([file, n]) => n > Math.max(baseline[file] ?? 0, LIMIT));
  const stale = staleCounts(baseline, counts, LIMIT);
  for (const [file, n] of grown) {
    const entry = baseline[file];
    console.error(
      `FAIL  ${file}: ${n} lines, ` +
        (entry ? `its baseline is ${entry}. ` : `the limit is ${LIMIT}. `) +
        'Split a concern into a service, helper or module of its own instead of growing the file.',
    );
  }
  for (const { key, entry } of stale) {
    console.error(
      `FAIL  ${key} is held at ${entry} in scripts/size-baseline.json, ` +
        (key in counts ? `but it has ${counts[key]} lines now.` : 'but the file is gone.'),
    );
  }
  if (stale.length) {
    console.error(
      'Run npm run lint:size -- --update to lower the baseline with the change that made it smaller: ' +
        'an entry above the file lets it grow back unseen.',
    );
  }
  console.log(
    `size: ${Object.keys(counts).length} file(s), ${Object.keys(baseline).length} over ${LIMIT} lines held at their baseline`,
  );
  return grown.length || stale.length ? 1 : 0;
}

await runCli('lint:size', (argv) => {
  try {
    return check(argv);
  } catch (err) {
    // A scan or baseline problem the lib reports as a plain Error is still a failure of the check itself.
    if (err instanceof RatchetError) throw err;
    throw new RatchetError(err.message);
  }
});
