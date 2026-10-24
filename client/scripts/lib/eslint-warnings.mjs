/*
 * The tally and the comparison behind lint:warnings (scripts/eslint-ratchet.mjs).
 */
import { ESLint } from 'eslint';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import ts from 'typescript';
import {
  countMap,
  lowerCounts,
  readBaseline,
  readText,
  reportStale,
  staleCounts,
  TEST_FILE,
  toKey,
  writeBaseline,
} from './ratchet.mjs';

/**
 * Where a warning is counted: in the app code, in the tests, or, for a
 * message an eslint-disable comment silenced, among the suppressed ones. An
 * inline disable must not be the cheap way under the ratchet, and an inline
 * rule config, which silences without a trace, fails outright (see tally).
 */
export const AREAS = ['src', 'tests', 'suppressed'];

const areaOf = (key) => (key.startsWith('tests/') || TEST_FILE.test(key) ? 'tests' : 'src');

const ruleOf = (message) =>
  message.ruleId ?? (/eslint-disable/.test(message.message) ? 'unused-disable-directive' : '(no rule)');

/** A baseline: each area an object of rule → positive count. */
export function areaCounts(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'it is not an object of area → rule counts';
  for (const area of Object.keys(value))
    if (!AREAS.includes(area)) return `"${area}" is not one of ${AREAS.join(', ')}`;
  for (const area of AREAS) {
    if (!(area in value)) return `the "${area}" area is missing`;
    const problem = countMap(value[area]);
    if (problem) return `in "${area}", ${problem}`;
  }
  return null;
}

const scriptKind = (file) =>
  file.endsWith('.tsx')
    ? ts.ScriptKind.TSX
    : /\.[cm]?ts$/.test(file)
      ? ts.ScriptKind.TS
      : file.endsWith('.jsx')
        ? ts.ScriptKind.JSX
        : ts.ScriptKind.JS;

/** ESLint's label for a block comment that configures rules, as opposed to eslint-disable and the like. */
const INLINE_CONFIG = /^\s*eslint(?:\s|$)/;

/**
 * The block comments in a file that configure ESLint rules, such as
 * `/* eslint no-empty: off *\/`, as `line:column  comment`. Such a comment
 * switches a rule off for the whole file without a single message reaching
 * either the warnings or the suppressed ones, so it would walk past the
 * ratchet unseen. The comments come from the TypeScript parser, so the same
 * text inside a string or a template does not count.
 */
export function inlineConfigsOf(source, file) {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, scriptKind(file));
  const seen = new Set();
  const found = [];
  const collect = (ranges) => {
    for (const range of ranges ?? []) {
      if (seen.has(range.pos)) continue;
      seen.add(range.pos);
      if (range.kind !== ts.SyntaxKind.MultiLineCommentTrivia) continue;
      const text = source.slice(range.pos, range.end);
      if (!INLINE_CONFIG.test(text.slice(2, -2))) continue;
      const { line, character } = sf.getLineAndCharacterOfPosition(range.pos);
      found.push(`${line + 1}:${character + 1}  ${text.replace(/\s+/g, ' ').slice(0, 80)}`);
    }
  };
  const visit = (node) => {
    collect(ts.getLeadingCommentRanges(source, node.pos));
    collect(ts.getTrailingCommentRanges(source, node.pos));
    for (const child of node.getChildren(sf)) visit(child);
  };
  visit(sf);
  return found;
}

/**
 * The warnings per area and rule in ESLint's results, the files behind each
 * count, and every error (an error, a parse failure included, always fails).
 * An inline rule config comment (see inlineConfigsOf) is an error too: the
 * place to change a rule is eslint.config.mjs.
 */
export function tally(results, root) {
  const counts = Object.fromEntries(AREAS.map((area) => [area, {}]));
  const files = Object.fromEntries(AREAS.map((area) => [area, {}]));
  const errors = [];
  const add = (area, rule, key) => {
    counts[area][rule] = (counts[area][rule] ?? 0) + 1;
    const where = (files[area][rule] ??= {});
    where[key] = (where[key] ?? 0) + 1;
  };
  for (const result of results) {
    const key = toKey(root, result.filePath);
    for (const comment of result.inlineConfigs ?? [])
      errors.push(`${key}:${comment}  configures a rule inline; set it in eslint.config.mjs (inline-config)`);
    for (const message of result.messages) {
      if (message.fatal || message.severity === 2)
        errors.push(`${key}:${message.line ?? 0}:${message.column ?? 0}  ${message.message} (${ruleOf(message)})`);
      else add(areaOf(key), ruleOf(message), key);
    }
    for (const message of result.suppressedMessages ?? []) add('suppressed', ruleOf(message), key);
  }
  return { counts, files, errors };
}

/**
 * The part of an ESLint result the tally reads.
 *
 * @typedef {{ ruleId: string | null, severity: number, message: string, fatal?: boolean, line?: number, column?: number }} LintMessage
 * @typedef {{ filePath: string, messages: LintMessage[], suppressedMessages?: LintMessage[], inlineConfigs?: string[] }} LintResult
 */

/**
 * ESLint over the whole client, with its own config, as `npm run lint:check`
 * runs it, each result with the inline rule configs of its file.
 *
 * @param {string} root
 * @returns {Promise<LintResult[]>}
 */
export async function lintClient(root) {
  const results = await new ESLint({ cwd: root }).lintFiles(['.']);
  return results.map((result) => ({
    ...result,
    inlineConfigs: inlineConfigsOf(readText(result.filePath), result.filePath),
  }));
}

/** The ref new warnings are measured against: TREK_LINT_BASE (the CI sets it), else origin/dev. */
const baseRef = () => process.env.TREK_LINT_BASE || 'origin/dev';

/** Git in the workspace: its output, or null when it fails (no repository, no such ref). */
function gitIn(root, args) {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 1 << 28,
    });
  } catch {
    return null;
  }
}

/** The messages of one rule in one area of a single file's lint result. */
function ofRule(results, rule, area) {
  const result = results[0];
  if (!result) return [];
  const pool =
    area === 'suppressed' ? (result.suppressedMessages ?? []) : result.messages.filter((m) => m.severity === 1);
  return pool.filter((m) => ruleOf(m) === rule);
}

/**
 * Where a grown rule's new warnings sit: every file among `keys` (the files
 * holding the rule now) that differs from `ref` and holds more of the rule
 * than it did there, each of its warnings of the rule as `file:line  message`.
 * The count alone names no file, and the files holding the most are old ones;
 * this names the file that tipped it. Null when `ref` is not at hand (a clone
 * without it), and the report then keeps to the files holding the most.
 */
export async function newWarningsOf({ root, rule, area, keys, lintText, ref = baseRef(), git = gitIn }) {
  const changed = git(root, ['diff', '--name-only', '--relative', ref, '--', '.']);
  if (changed === null) return null;
  const differs = new Set(changed.split('\n').filter(Boolean));
  const found = await Promise.all(
    keys
      .filter((key) => differs.has(key))
      .map(async (key) => {
        const path = join(root, key);
        // A typed rule can trip over a text that is not the file on disk (the
        // base version); then the file's own warnings are told, marked so.
        const lint = async (text) => {
          try {
            return { messages: ofRule(await lintText(text, path), rule, area) };
          } catch {
            return null;
          }
        };
        const now = await lint(readText(path));
        if (!now) return [];
        const before = git(root, ['show', `${ref}:./${key}`]);
        const was = before === null ? { messages: [] } : await lint(before);
        if (was && now.messages.length <= was.messages.length) return [];
        const note = was ? '' : '  (the base version could not be linted)';
        return now.messages.map((m) => `${key}:${m.line ?? 0}  ${m.message}${note}`);
      })
  );
  return found.flat();
}

/** Prints, under the grown counts, the files and lines behind each one (see newWarningsOf). */
async function reportNew(grown, { root, files, lintText, error }) {
  if (!grown.length || !lintText) return;
  const found = await Promise.all(
    grown.map(({ area, rule }) => newWarningsOf({ root, rule, area, keys: Object.keys(files[area][rule]), lintText }))
  );
  grown.forEach(({ area, rule }, i) => {
    const lines = found[i];
    if (!lines?.length) return;
    error(`New ${rule} warning(s) in ${area}, against ${baseRef()}:`);
    for (const line of lines) error(`  ${line}`);
  });
}

/** Lints one file's text with the client's own config, for newWarningsOf. */
function lintTextClient(root) {
  const eslint = new ESLint({ cwd: root });
  return (text, filePath) => eslint.lintText(text, { filePath });
}

const sum = (map) => Object.values(map).reduce((a, b) => a + b, 0);

/**
 * Runs ESLint (or lint, in a test) and compares the warnings with the
 * baseline at baselinePath. Returns the exit code.
 */
export async function check({
  root,
  baselinePath = join(root, 'scripts/eslint-baseline.json'),
  update = false,
  lint = lintClient,
  lintText = lint === lintClient ? lintTextClient : null,
  log = console.log,
  error = console.error,
}) {
  let baseline = readBaseline(baselinePath, areaCounts);
  const { counts, files, errors } = tally(await lint(root), root);

  if (update) {
    baseline = Object.fromEntries(AREAS.map((area) => [area, lowerCounts(baseline[area], counts[area])]));
    writeBaseline(baselinePath, baseline);
  }

  for (const line of errors) error(`FAIL  ${line}`);
  const grown = [];
  let stale = 0;
  for (const area of AREAS) {
    for (const [rule, n] of Object.entries(counts[area])) {
      const allowed = baseline[area][rule] ?? 0;
      if (n <= allowed) continue;
      grown.push({ area, rule });
      const top = Object.entries(files[area][rule])
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([key, k]) => `${key} (${k})`);
      error(`FAIL  ${area}: ${n} ${rule} warning(s), baseline ${allowed}. Most in: ${top.join(', ')}`);
    }
    const fallen = staleCounts(baseline[area], counts[area]);
    reportStale(fallen, {
      file: 'eslint-baseline.json',
      command: 'lint:warnings',
      label: (rule) => `${area}: ${rule}`,
      error,
    });
    stale += fallen.length;
  }
  await reportNew(grown, { root, files, lintText: lintText && lintText(root), error });
  if (grown.length) {
    error(
      'Fix the new warning rather than silencing it: an eslint-disable comment is counted under "suppressed". ' +
        'Run npx eslint <file> to see each one.'
    );
  }
  log(
    `eslint: ${errors.length} error(s); warnings ${AREAS.map((area) => `${area} ${sum(counts[area])}/${sum(baseline[area])}`).join(', ')} (now/baseline)`
  );
  return errors.length || grown.length || stale ? 1 : 0;
}
