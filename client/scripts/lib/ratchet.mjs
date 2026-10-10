/*
 * The parts every ratchet in scripts/ shares: walking the tree, reading a file
 * the same way on Windows and Linux, and reading, lowering and writing a
 * baseline.
 *
 * A ratchet fails closed. A baseline that is missing, cannot be parsed or has
 * the wrong shape stops the run with its reason instead of reading as empty
 * (as empty, the check would fail with no hint at the cause, and --update
 * would write an empty file over the real one). A directory that should be
 * scanned and is not there, or a scan that finds no file at all, stops it too:
 * a check that looked at nothing must not report green.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';

/** A problem with the check itself rather than a violation it found. */
export class RatchetError extends Error {}

export const TEST_FILE = /\.(?:test|spec)\.[cm]?[jt]sx?$/;

/** Every file under root/<dir> for each dir whose path passes accept, as absolute paths. */
export function listFiles(root, dirs, accept) {
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      if (name === 'node_modules') continue;
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (accept(toKey(root, path))) files.push(path);
    }
  };
  for (const dir of dirs) {
    const path = join(root, dir);
    if (!existsSync(path) || !statSync(path).isDirectory()) {
      throw new RatchetError(`${dir}/ does not exist under ${root}, so there is nothing to check`);
    }
    walk(path);
  }
  if (!files.length) throw new RatchetError(`no file to check under ${dirs.map((d) => `${d}/`).join(', ')}`);
  return files.sort();
}

/** A path relative to root with forward slashes, the form every baseline uses. */
export function toKey(root, path) {
  return relative(root, path).split('\\').join('/');
}

/**
 * A text file as the repository holds it: without a byte order mark and with
 * LF line ends, so a Windows checkout with CRLF counts the same as CI.
 */
export function readText(path) {
  const text = readFileSync(path, 'utf8');
  return (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text).replace(/\r\n?/g, '\n');
}

const isCount = (n) => Number.isInteger(n) && n > 0;

/** A JSON object of file → positive count. */
export function countMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'it is not an object of file → count';
  for (const [key, n] of Object.entries(value))
    if (!isCount(n)) return `"${key}" holds ${JSON.stringify(n)}, not a positive whole number`;
  return null;
}

/** A JSON array of distinct file paths. */
export function fileList(value) {
  if (!Array.isArray(value)) return 'it is not an array of file paths';
  const seen = new Set();
  for (const entry of value) {
    if (typeof entry !== 'string' || !entry) return `${JSON.stringify(entry)} is not a file path`;
    if (seen.has(entry)) return `"${entry}" is listed twice`;
    seen.add(entry);
  }
  return null;
}

/**
 * The baseline as committed, checked against shape (one of the validators
 * above, which returns null when the value fits and the reason otherwise).
 */
export function readBaseline(path, shape) {
  const name = basename(path);
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch (err) {
    throw new RatchetError(`scripts/${name} cannot be read (${err.code ?? err.message}); restore it from git`);
  }
  let value;
  try {
    value = JSON.parse(text);
  } catch (err) {
    throw new RatchetError(`scripts/${name} is not valid JSON (${err.message}); restore it from git`);
  }
  const problem = shape(value);
  if (problem) throw new RatchetError(`scripts/${name} has the wrong shape: ${problem}; restore it from git`);
  return value;
}

/** Writes value as sorted, two-space JSON with a final newline. */
export function writeBaseline(path, value) {
  const sorted = Array.isArray(value)
    ? [...value].sort()
    : Object.fromEntries(Object.entries(value).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  writeFileSync(path, JSON.stringify(sorted, null, 2) + '\n');
}

/**
 * The baseline lowered to the counts measured now. An entry never rises, a
 * file that is not in the baseline never enters it, and an entry whose count
 * fell to floor or below leaves. floor is a number, or a function of the key
 * when the limit differs between files.
 *
 * @param {Record<string, number>} baseline
 * @param {Record<string, number>} counts
 * @param {number | ((key: string) => number)} [floor]
 */
export function lowerCounts(baseline, counts, floor = 0) {
  const lowered = {};
  for (const [key, allowed] of Object.entries(baseline)) {
    const now = counts[key] ?? 0;
    if (now > (typeof floor === 'function' ? floor(key) : floor)) lowered[key] = Math.min(allowed, now);
  }
  return lowered;
}

/**
 * The entries of a count baseline that allow more than is measured now: a
 * count that fell below its entry, one back at floor or under it, or a file
 * that is gone. Exactly the entries lowerCounts would lower or drop. Each one
 * fails its check until --update lowers it, or the count could grow back to
 * the old entry unseen, and a deleted file would hand its allowance to the
 * next file at its path.
 *
 * @param {Record<string, number>} baseline
 * @param {Record<string, number>} counts
 * @param {number | ((key: string) => number)} [floor]
 * @returns {{ key: string, entry: number, now: number }[]}
 */
export function staleCounts(baseline, counts, floor = 0) {
  const lowered = lowerCounts(baseline, counts, floor);
  return Object.entries(baseline)
    .filter(([key, entry]) => lowered[key] !== entry)
    .map(([key, entry]) => ({ key, entry, now: counts[key] ?? 0 }));
}

/**
 * Prints a FAIL line for each stale entry (see staleCounts) of the baseline
 * scripts/<file>, then how to lower them. With root, an entry whose file is
 * not there is called gone; label names an entry that is not a file path.
 *
 * @param {{ key: string, entry: number, now: number }[]} stale
 * @param {{ file: string, command: string, root?: string, label?: (key: string) => string, error: (line: string) => void }} options
 */
export function reportStale(stale, { file, command, root, label = (key) => key, error }) {
  for (const { key, entry, now } of stale) {
    const gone = root !== undefined && !existsSync(join(root, key));
    error(
      `FAIL  ${label(key)} is held at ${entry} in scripts/${file}, ` +
        (gone ? 'but the file is gone.' : `but there are ${now} now.`)
    );
  }
  if (stale.length) {
    error(
      `Run npm run ${command} -- --update to lower the baseline with the change that made it smaller: ` +
        'an entry above the count lets it grow back unseen.'
    );
  }
}

/** The baseline entries that are still offenders: a list only ever loses files. */
export function lowerList(baseline, offenders) {
  const now = new Set(offenders);
  return baseline.filter((file) => now.has(file));
}

/**
 * Runs one ratchet as a command. main returns the exit code; a RatchetError is
 * printed as a failure of the check itself. There is no "am I the entry
 * point" guard to get wrong: the command files only ever run, and the logic
 * they call lives in scripts/lib/ where tests import it.
 */
export async function runCli(name, main) {
  try {
    process.exitCode = await main(process.argv.slice(2));
  } catch (err) {
    if (!(err instanceof RatchetError)) throw err;
    console.error(`FAIL  ${name}: ${err.message}`);
    process.exitCode = 1;
  }
}
