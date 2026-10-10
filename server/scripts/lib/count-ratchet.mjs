/*
 * The per-file count ratchet shared by lint:mcp-zod and lint:service-http.
 *
 * A check names the tree it walks, which files in it count and how to count one
 * file's text. Every file is held to its entry in the check's baseline JSON
 * ({ "counts": { "<server-relative path>": n } }); a file without an entry may
 * hold none. An entry above what its file holds now, or for a file that is
 * gone, fails as well until --update lowers it, so a fixed hit cannot come back
 * unseen. --update never raises an entry and never adds one.
 *
 * --dir=<path> points a check at another server root (the unit tests use it).
 */
import { existsSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else files.push(path);
  }
  return files;
}

/** Counts keyed by the server-relative POSIX path, files without any left out. */
export function scan(serverDir, check) {
  const dir = join(serverDir, check.root);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    throw new Error(
      `${check.root}/ does not exist under ${serverDir}: the check would pass without looking at anything`,
    );
  }
  const counts = {};
  for (const path of walk(dir)) {
    const file = relative(serverDir, path).split('\\').join('/');
    if (!check.include(file)) continue;
    const n = check.count(readFileSync(path, 'utf8'), file);
    if (n > 0) counts[file] = n;
  }
  return counts;
}

/** The baseline as committed; missing or malformed stops the run instead of reading as empty. */
export function readBaseline(path, name) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new Error(`${name} cannot be read: ${err.message}`);
  }
  const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  if (!isObject(parsed) || !isObject(parsed.counts))
    throw new Error(`${name} must be an object with a "counts" object`);
  for (const [file, n] of Object.entries(parsed.counts)) {
    if (!Number.isInteger(n) || n <= 0) {
      throw new Error(`${name}: ${file} holds ${JSON.stringify(n)}, expected a whole number above 0`);
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

/** Runs a check as its CLI does; answers the exit code. */
export function runCheck(check, argv, serverDirDefault) {
  const dirArg = argv.find((a) => a.startsWith('--dir='));
  const serverDir = dirArg ? resolve(dirArg.slice('--dir='.length)) : serverDirDefault;
  const baselinePath = join(serverDir, check.baseline);

  const counts = scan(serverDir, check);
  const baseline = readBaseline(baselinePath, check.baseline);
  if (argv.includes('--update')) {
    baseline.counts = lowerCounts(baseline, counts);
    writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + '\n');
  }

  const { grown, stale } = compare(baseline, counts);
  for (const [file, n] of grown) {
    const entry = baseline.counts[file];
    console.error(
      `FAIL  ${file}: ${n} ${check.unit}, ` +
        (entry ? `its baseline is ${entry}. ` : 'a file without a baseline entry may hold none. ') +
        check.advice,
    );
  }
  for (const [file, entry] of stale) {
    console.error(
      `FAIL  ${file} is held at ${entry} in ${check.baseline}, ` +
        (file in counts ? `but it has ${counts[file]} now.` : 'but it has none left (or the file is gone).'),
    );
  }
  if (stale.length) {
    console.error(
      `Run npm run ${check.script} -- --update to lower the baseline with the change that made it smaller.`,
    );
  }
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  console.log(`${check.name}: ${total} ${check.unit} in ${Object.keys(counts).length} file(s) held at their baseline`);
  return grown.length || stale.length ? 1 : 0;
}

/** Starts `check` when `moduleUrl` is the script node was started with (compared by real path). */
export function cliMain(check, moduleUrl) {
  const isCli =
    Boolean(process.argv[1]) &&
    existsSync(process.argv[1]) &&
    realpathSync(process.argv[1]) === fileURLToPath(moduleUrl);
  if (!isCli) return;
  try {
    process.exitCode = runCheck(check, process.argv.slice(2), fileURLToPath(new URL('..', moduleUrl)));
  } catch (err) {
    console.error(`FAIL  ${err.message}`);
    process.exitCode = 1;
  }
}
