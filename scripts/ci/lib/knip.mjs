/*
 * The tally and the comparison behind lint:knip (scripts/ci/knip-ratchet.mjs).
 *
 * Built on the client's ratchet helpers, which hold the baseline rules every
 * ratchet in the repo shares: fail closed on a broken baseline, lower only,
 * fail on an entry above its count.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  countMap,
  lowerCounts,
  RatchetError,
  readBaseline,
  reportStale,
  staleCounts,
  writeBaseline,
} from '../../../client/scripts/lib/ratchet.mjs';

/**
 * The kinds of finding knip reports per file, as its JSON reporter names them.
 * Each is held apart in the baseline, so an unused export removed does not pay
 * for an unused dependency added.
 */
const CATEGORIES = [
  'files',
  'dependencies',
  'devDependencies',
  'optionalPeerDependencies',
  'unlisted',
  'binaries',
  'unresolved',
  'exports',
  'types',
  'enumMembers',
  'namespaceMembers',
  'duplicates',
  'catalog',
];

/** A baseline: each category an object of file → positive count. */
export function categoryCounts(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'it is not an object of category → file counts';
  for (const [category, counts] of Object.entries(value)) {
    if (!CATEGORIES.includes(category)) return `"${category}" is not one of ${CATEGORIES.join(', ')}`;
    const problem = countMap(counts);
    if (problem) return `in "${category}", ${problem}`;
  }
  return null;
}

const entries = (value) => (Array.isArray(value) ? value : value && typeof value === 'object' ? Object.values(value) : []);
const nameOf = (item) =>
  Array.isArray(item) ? item.map(nameOf).join(' = ') : typeof item === 'string' ? item : (item?.name ?? '?');

/**
 * knip's JSON report as counts per category and file, with the names behind
 * each count. A report knip did not produce (no `issues` array) is an error of
 * the check, not an empty result.
 */
export function tally(report) {
  if (!report || !Array.isArray(report.issues)) throw new RatchetError('knip printed no issues array; see its output above');
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, {}]));
  const names = Object.fromEntries(CATEGORIES.map((c) => [c, {}]));
  for (const issue of report.issues) {
    for (const category of CATEGORIES) {
      const found = entries(issue[category]);
      if (!found.length) continue;
      counts[category][issue.file] = found.length;
      names[category][issue.file] = found.map(nameOf);
    }
  }
  return { counts, names };
}

/** knip over the repository, as its parsed JSON report. */
function runKnip(root) {
  // knip is a root devDependency, so npm installs it at the top of node_modules.
  const bin = join(root, 'node_modules', 'knip', 'bin', 'knip.js');
  if (!existsSync(bin)) throw new RatchetError(`knip is not installed at ${bin}; run npm ci at the repo root`);
  const result = spawnSync(process.execPath, [bin, '--reporter', 'json', '--no-exit-code', '--no-progress'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });
  if (result.error) throw new RatchetError(`knip did not run: ${result.error.message}`);
  if (result.status !== 0) throw new RatchetError(`knip stopped with exit code ${result.status}: ${result.stderr.slice(0, 800)}`);
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new RatchetError(`knip's output is not JSON: ${result.stdout.slice(0, 300)} ${result.stderr.slice(0, 300)}`);
  }
}

/** The baseline with each category's files in order too, so a diff of it shows only what changed. */
const sortedFiles = (baseline) =>
  Object.fromEntries(
    Object.entries(baseline).map(([category, counts]) => [
      category,
      Object.fromEntries(Object.entries(counts).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
    ])
  );

const sum = (counts) => Object.values(counts).reduce((a, b) => a + b, 0);

/**
 * Runs knip (or knip, in a test) and compares its findings with the baseline
 * at baselinePath. Returns the exit code.
 */
export function check({
  root,
  baselinePath = join(root, 'scripts/ci/knip-baseline.json'),
  update = false,
  knip = runKnip,
  log = console.log,
  error = console.error,
}) {
  let baseline = readBaseline(baselinePath, categoryCounts);
  const { counts, names } = tally(knip(root));

  if (update) {
    baseline = Object.fromEntries(
      Object.entries(baseline)
        .map(([category, allowed]) => [category, lowerCounts(allowed, counts[category] ?? {})])
        .filter(([, allowed]) => Object.keys(allowed).length)
    );
    writeBaseline(baselinePath, sortedFiles(baseline));
  }

  let grown = 0;
  let stale = 0;
  for (const category of CATEGORIES) {
    const allowed = baseline[category] ?? {};
    for (const [file, n] of Object.entries(counts[category])) {
      if (n <= (allowed[file] ?? 0)) continue;
      grown++;
      error(
        `FAIL  ${category}: ${file} has ${n}, baseline ${allowed[file] ?? 0}: ${names[category][file].slice(0, 8).join(', ')}`
      );
    }
    const fallen = staleCounts(allowed, counts[category]);
    reportStale(fallen, {
      file: 'ci/knip-baseline.json',
      command: 'lint:knip',
      label: (file) => `${category}: ${file}`,
      error,
    });
    stale += fallen.length;
  }
  if (grown) {
    error(
      'Delete what nothing uses, or list the dependency it needs. If knip is wrong (a file loaded by path, ' +
        'a public API), say so in knip.jsonc with the reason; the baseline is not the place for it.'
    );
  }
  const now = CATEGORIES.map((c) => sum(counts[c])).reduce((a, b) => a + b, 0);
  const held = Object.values(baseline)
    .map(sum)
    .reduce((a, b) => a + b, 0);
  log(`knip: ${now} finding(s), baseline allows ${held}`);
  return grown || stale ? 1 : 0;
}
