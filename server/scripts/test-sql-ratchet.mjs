#!/usr/bin/env node
/*
 * lint:test-sql: raw better-sqlite3 statements in the server tests may only shrink.
 *
 * The suite used to seed and read its database through `.prepare()` on the
 * synchronous better-sqlite3 handle: thousands of hand-written SQLite
 * statements that no other driver can serve, which welds every test to one
 * engine and bypasses the repositories the app goes through. The factories
 * and readers in tests/helpers/factories/ do the same work through MikroORM
 * (see the README there); this check makes sure the old way only recedes.
 *
 * Every `.prepare(` under tests/ is counted per file, mentions in comments
 * included. A file may hold at most its entry in the `counts` of
 * scripts/test-sql-baseline.json, and a file without an entry none at all.
 * An entry above what its file holds now, or for a file that is gone, fails
 * too until --update lowers it, so a converted file cannot grow back unseen.
 *
 * Two ways out, both explicit and reviewed:
 *   - a file whose subject is raw SQL itself (migrations, the legacy
 *     baseline, the dialect functions, PRAGMA introspection) is listed under
 *     `exempt` with the reason; it is not counted, and an exemption for a
 *     file that is gone fails;
 *   - a single statement that has to stay raw carries a comment with
 *     `test-sql-allow:` and a reason, on its own line or the line above
 *     (a statement broken into a method chain stays covered on the chain
 *     lines that continue it). A marker with no reason does not count.
 *
 *   npm run lint:test-sql              check against the baseline (CI)
 *   npm run lint:test-sql -- --update  lower the counts to what the files hold now;
 *                                      it never raises an entry, never adds one,
 *                                      and never touches the exemptions
 *
 * --dir=<path> points the check at another server root (the unit tests use it).
 */
import { existsSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The tree the check walks, relative to the server root. */
export const ROOT = 'tests';

/** The baseline, relative to the server root. */
export const BASELINE = 'scripts/test-sql-baseline.json';

const SOURCE = /\.(?:[cm]?[jt]s)$/;
const PREPARE = /\.prepare\(/g;
const ALLOW = /test-sql-allow:\s*\S/;

/** A line that continues the method chain of the line above it (`.prepare(...)` below `db`). */
const CHAIN = /^\s*\./;

/**
 * The lines an allow marker covers: its own, the line right below it, and the
 * method-chain lines that continue that statement. Prettier breaks a long
 * `db.prepare('...').all()` into `db` on one line and `.prepare(` on the next,
 * which puts the call two lines below the marker without changing what the
 * marker is about.
 */
function allowedLines(lines) {
  const allowed = new Set();
  lines.forEach((line, i) => {
    if (!ALLOW.test(line)) return;
    allowed.add(i);
    allowed.add(i + 1);
    for (let j = i + 2; j < lines.length && CHAIN.test(lines[j]); j++) allowed.add(j);
  });
  return allowed;
}

/**
 * The raw statements in one file's text: every `.prepare(` except those on a
 * line that carries an allow marker with a reason, or in the statement right
 * below one (its first line and the chain lines that continue it).
 */
export function countPrepares(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const allowed = allowedLines(lines);
  let total = 0;
  lines.forEach((line, i) => {
    const hits = line.match(PREPARE)?.length ?? 0;
    if (hits === 0 || allowed.has(i)) return;
    total += hits;
  });
  return total;
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (SOURCE.test(name)) files.push(path);
  }
  return files;
}

/** Raw statement counts keyed by the server-relative POSIX path, files without any left out. */
export function scan(serverDir) {
  const dir = join(serverDir, ROOT);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    throw new Error(`${ROOT}/ does not exist under ${serverDir}: the check would pass without looking at anything`);
  }
  const counts = {};
  for (const path of walk(dir)) {
    const n = countPrepares(readFileSync(path, 'utf8'));
    if (n > 0) counts[relative(serverDir, path).split('\\').join('/')] = n;
  }
  return counts;
}

/**
 * The baseline as committed. Missing, unreadable or malformed stops the run:
 * read as empty, every file would fail with no hint at the cause, and
 * --update would replace it with an empty one.
 */
export function readBaseline(path) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new Error(`${BASELINE} cannot be read: ${err.message}`);
  }
  const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  if (!isObject(parsed) || !isObject(parsed.exempt) || !isObject(parsed.counts)) {
    throw new Error(`${BASELINE} must be an object with an "exempt" and a "counts" object`);
  }
  for (const [file, reason] of Object.entries(parsed.exempt)) {
    if (typeof reason !== 'string' || reason.trim() === '') {
      throw new Error(`${BASELINE}: the exemption for ${file} needs a reason`);
    }
    if (file in parsed.counts) {
      throw new Error(`${BASELINE}: ${file} is both exempt and counted`);
    }
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

/**
 * Files over their allowance; count entries above what their file holds now
 * (exactly the ones lowerCounts would lower or drop); exemptions for files
 * that are gone.
 */
export function compare(baseline, counts, serverDir) {
  const exempt = baseline.exempt;
  const grown = Object.entries(counts).filter(([file, n]) => !(file in exempt) && n > (baseline.counts[file] ?? 0));
  const lowered = lowerCounts(baseline, counts);
  const stale = Object.entries(baseline.counts).filter(([file, n]) => lowered[file] !== n);
  const goneExempt = Object.keys(exempt).filter((file) => !existsSync(join(serverDir, file)));
  return { grown, stale, goneExempt };
}

function main(argv) {
  const dirArg = argv.find((a) => a.startsWith('--dir='));
  const serverDir = dirArg ? resolve(dirArg.slice('--dir='.length)) : fileURLToPath(new URL('..', import.meta.url));
  const baselinePath = join(serverDir, BASELINE);
  const update = argv.includes('--update');

  const counts = scan(serverDir);
  const baseline = readBaseline(baselinePath);
  if (update) {
    baseline.counts = lowerCounts(baseline, counts);
    writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + '\n');
  }

  const { grown, stale, goneExempt } = compare(baseline, counts, serverDir);
  for (const [file, n] of grown) {
    const entry = baseline.counts[file];
    console.error(
      `FAIL  ${file}: ${n} raw statement(s), ` +
        (entry ? `its baseline is ${entry}. ` : 'a file without a baseline entry may hold none. ') +
        'Seed and read through tests/helpers/factories/ instead (see the README there).',
    );
  }
  for (const [file, entry] of stale) {
    console.error(
      `FAIL  ${file} is held at ${entry} in ${BASELINE}, ` +
        (file in counts ? `but it has ${counts[file]} now.` : 'but it has none left (or the file is gone).'),
    );
  }
  for (const file of goneExempt) {
    console.error(`FAIL  ${file} is exempt in ${BASELINE}, but the file is gone: drop the exemption.`);
  }
  if (stale.length) {
    console.error(
      'Run npm run lint:test-sql -- --update to lower the baseline with the change that made it smaller: ' +
        'an entry above the file lets it grow back unseen.',
    );
  }
  const total = Object.entries(counts)
    .filter(([file]) => !(file in baseline.exempt))
    .reduce((sum, [, n]) => sum + n, 0);
  console.log(
    `test-sql: ${total} raw statement(s) in ${Object.keys(baseline.counts).length} baselined file(s), ` +
      `${Object.keys(baseline.exempt).length} file(s) exempt`,
  );
  return grown.length || stale.length || goneExempt.length ? 1 : 0;
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
