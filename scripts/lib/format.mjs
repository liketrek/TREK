/*
 * The comparison behind a workspace's lint:format (server/scripts/format-lint.mjs,
 * shared/scripts/format-lint.mjs): which files Prettier would rewrite, against
 * the list of files that were unformatted when the check came in.
 *
 * The same logic as client/scripts/lib/format.mjs, with the directories, the
 * file kinds and Prettier itself handed in by the caller: each workspace
 * formats with the Prettier it installs and the .prettierrc next to it.
 */
import { join } from 'node:path';
import {
  fileList,
  listFiles,
  lowerList,
  RatchetError,
  readBaseline,
  readText,
  toKey,
  writeBaseline,
} from './ratchet.mjs';

/**
 * Whether Prettier leaves the file as it is, with the config that applies to
 * it. The text is read with LF line ends, so a Windows checkout agrees with CI
 * about endOfLine. A file Prettier cannot parse is not formatted.
 *
 * @param {{ resolveConfig(path: string): Promise<object | null>, check(text: string, options: object): Promise<boolean> }} prettier
 * @param {string} path
 */
export async function isFormatted(prettier, path) {
  const options = await prettier.resolveConfig(path);
  if (!options) throw new RatchetError(`no Prettier config applies to ${path}`);
  try {
    return await prettier.check(readText(path), { ...options, filepath: path });
  } catch {
    return false;
  }
}

/** The files under root/<dirs> that accepts takes and Prettier would rewrite, keyed by their path from root. */
async function unformatted({ prettier, root, dirs, accepts }) {
  const found = [];
  for (const path of listFiles(root, dirs, accepts)) {
    if (!(await isFormatted(prettier, path))) found.push(toKey(root, path));
  }
  return found;
}

/**
 * Runs the check against the list at baselinePath. A file outside the list
 * must be formatted. A listed file that is formatted now, or gone, fails the
 * check as well until --update takes it out: the list only shrinks, and a
 * stale entry would let the next file at that path in unformatted. Once the
 * whole workspace has been formatted, --update empties the list and the check
 * is a plain prettier --check. Returns the exit code.
 */
export async function check({
  prettier,
  root,
  dirs,
  accepts,
  baselinePath = join(root, 'scripts/format-baseline.json'),
  update = false,
  list = false,
  log = console.log,
  error = console.error,
}) {
  const found = await unformatted({ prettier, root, dirs, accepts });
  let baseline = readBaseline(baselinePath, fileList);

  if (update) {
    baseline = lowerList(baseline, found);
    writeBaseline(baselinePath, baseline);
  }

  const allowed = new Set(baseline);
  const fresh = found.filter((key) => !allowed.has(key));
  const now = new Set(found);
  const stale = baseline.filter((key) => !now.has(key));

  if (list) for (const key of found) log(`${allowed.has(key) ? 'listed' : 'new   '}  ${key}`);
  for (const key of fresh) {
    error(`FAIL  ${key} is not formatted. Run: npx prettier --write ${key}`);
  }
  for (const key of stale) {
    error(`FAIL  ${key} is listed in scripts/format-baseline.json but is formatted now or gone.`);
  }
  if (stale.length) error('Run npm run lint:format -- --update to take the formatted files off the list.');
  log(`format: ${found.length} unformatted file(s), ${baseline.length} listed in the baseline`);
  return fresh.length || stale.length ? 1 : 0;
}
