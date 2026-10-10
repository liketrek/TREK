#!/usr/bin/env node
/*
 * lint:query-api: MikroORM QueryBuilder calls in the repositories may only shrink.
 *
 * A repository has three ways to build a statement: the entity methods
 * (findOne/find/insert/nativeUpdate/nativeDelete/upsert/count), Kysely on the
 * generated table types (`this.kysely<Pick<DB, ...>>()`), and MikroORM's
 * QueryBuilder (`this.qb(...)`, `createQueryBuilder(...)`). server/CLAUDE.md
 * ("Which query API") settles which one new code uses: Kysely for a read that
 * joins, aggregates or projects, the entity methods for single-table CRUD,
 * and no QueryBuilder. The ones already written stay until their method is
 * touched; this check makes sure they only recede.
 *
 * Every `.qb(` and `createQueryBuilder(` under src/db/repositories/ is
 * counted per file (the TrekRepository base that defines `qb` is left out).
 * A file may hold at most its entry in scripts/query-api-baseline.json, and a
 * file without an entry none. An entry above what its file holds now, or for
 * a file that is gone, fails too until --update lowers it.
 *
 *   npm run lint:query-api              check against the baseline (CI)
 *   npm run lint:query-api -- --update  lower the counts to what the files hold now;
 *                                       it never raises an entry and never adds one
 *
 * --dir=<path> points the check at another server root (the unit tests use it).
 */
import { existsSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The tree the check walks, relative to the server root. */
export const ROOT = 'src/db/repositories';

/** The baseline, relative to the server root. */
export const BASELINE = 'scripts/query-api-baseline.json';

/** Files that define the QueryBuilder entry point rather than use it. */
export const IGNORED = new Set(['src/db/repositories/_shared/trek-repository.ts']);

const SOURCE = /\.ts$/;
const QB_CALL = /\.qb\(|\bcreateQueryBuilder\(/g;

/** The QueryBuilder calls in one file's text, comments included. */
export function countQueryBuilderCalls(text) {
  return text.match(QB_CALL)?.length ?? 0;
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (SOURCE.test(name)) files.push(path);
  }
  return files;
}

/** QueryBuilder counts keyed by the server-relative POSIX path, files without any left out. */
export function scan(serverDir) {
  const dir = join(serverDir, ROOT);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    throw new Error(`${ROOT}/ does not exist under ${serverDir}: the check would pass without looking at anything`);
  }
  const counts = {};
  for (const path of walk(dir)) {
    const file = relative(serverDir, path).split('\\').join('/');
    if (IGNORED.has(file)) continue;
    const n = countQueryBuilderCalls(readFileSync(path, 'utf8'));
    if (n > 0) counts[file] = n;
  }
  return counts;
}

/** The baseline as committed; missing or malformed stops the run instead of reading as empty. */
export function readBaseline(path) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new Error(`${BASELINE} cannot be read: ${err.message}`);
  }
  const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  if (!isObject(parsed) || !isObject(parsed.counts)) {
    throw new Error(`${BASELINE} must be an object with a "counts" object`);
  }
  for (const [file, n] of Object.entries(parsed.counts)) {
    if (!Number.isInteger(n) || n <= 0) {
      throw new Error(`${BASELINE}: ${file} holds ${JSON.stringify(n)}, expected a whole number above 0`);
    }
  }
  return parsed;
}

/** The counts lowered to what the files hold now. Never raises an entry, never adds one. */
export function lowerCounts(baseline, counts) {
  const lowered = {};
  for (const [file, allowed] of Object.entries(baseline.counts)) {
    const now = counts[file] ?? 0;
    if (now > 0) lowered[file] = Math.min(allowed, now);
  }
  return Object.fromEntries(Object.entries(lowered).sort(([a], [b]) => a.localeCompare(b)));
}

/** Files over their allowance, and entries above what their file holds now. */
export function compare(baseline, counts) {
  const grown = Object.entries(counts).filter(([file, n]) => n > (baseline.counts[file] ?? 0));
  const lowered = lowerCounts(baseline, counts);
  const stale = Object.entries(baseline.counts).filter(([file, n]) => lowered[file] !== n);
  return { grown, stale };
}

function main(argv) {
  const dirArg = argv.find((a) => a.startsWith('--dir='));
  const serverDir = dirArg ? resolve(dirArg.slice('--dir='.length)) : fileURLToPath(new URL('..', import.meta.url));
  const baselinePath = join(serverDir, BASELINE);

  const counts = scan(serverDir);
  const baseline = readBaseline(baselinePath);
  if (argv.includes('--update')) {
    baseline.counts = lowerCounts(baseline, counts);
    writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + '\n');
  }

  const { grown, stale } = compare(baseline, counts);
  for (const [file, n] of grown) {
    const entry = baseline.counts[file];
    console.error(
      `FAIL  ${file}: ${n} QueryBuilder call(s), ` +
        (entry ? `its baseline is ${entry}. ` : 'a file without a baseline entry may hold none. ') +
        'Use Kysely for a join or aggregate read and the entity methods for single-table CRUD (server/CLAUDE.md).',
    );
  }
  for (const [file, entry] of stale) {
    console.error(
      `FAIL  ${file} is held at ${entry} in ${BASELINE}, ` +
        (file in counts ? `but it has ${counts[file]} now.` : 'but it has none left (or the file is gone).'),
    );
  }
  if (stale.length) {
    console.error('Run npm run lint:query-api -- --update to lower the baseline with the change that made it smaller.');
  }
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  console.log(`query-api: ${total} QueryBuilder call(s) in ${Object.keys(counts).length} file(s) held at their baseline`);
  return grown.length || stale.length ? 1 : 0;
}

// Compared by real path, so the check still runs when the script is started through a symlink.
const isCli =
  Boolean(process.argv[1]) && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (err) {
    console.error(`FAIL  ${err.message}`);
    process.exitCode = 1;
  }
}
