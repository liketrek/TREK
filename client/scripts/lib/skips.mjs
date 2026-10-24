/*
 * The matching and the comparison behind lint:skips (scripts/skip-lint.mjs).
 */
import { join } from 'node:path';
import ts from 'typescript';
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

/** The test functions of vitest and Playwright a modifier can hang off. */
const RUNNERS = new Set(['it', 'test', 'describe', 'suite', 'bench']);
/** The jasmine-style shorthands vitest also knows. */
const SHORTHAND = new Set(['xit', 'xtest', 'xdescribe']);

export const DIRS = ['src', 'tests', 'e2e'];

const accepts = (key) => /\.tsx?$/.test(key) && (key.startsWith('src/') ? TEST_FILE.test(key) : true);

/** The identifier a chain like test.describe.skip.each starts from. */
function rootOf(node) {
  while (ts.isPropertyAccessExpression(node) || ts.isCallExpression(node)) node = node.expression;
  return ts.isIdentifier(node) ? node.text : null;
}

/** Playwright specs live under e2e/; everything else runs under vitest. */
const isPlaywright = (file) => file.startsWith('e2e/');

const isTitle = (node) => Boolean(node) && (ts.isStringLiteralLike(node) || ts.isTemplateExpression(node));
const isFunction = (node) => Boolean(node) && (ts.isArrowFunction(node) || ts.isFunctionExpression(node));

/**
 * Whether a skip or fixme call switches tests off for good. Under vitest it
 * always does: the first argument is the title, a literal or not. Playwright
 * also knows a run-time form, test.skip(condition, 'why'), which only skips
 * when the condition holds. A call counts there unless it is that form: it
 * declares a test (a title first or a test body second), it has no argument
 * (called bare, it skips the test or group it sits in), or its condition is
 * the literal true.
 */
function switchesOff(call, file) {
  const [first, second] = call.arguments;
  if (!isPlaywright(file) || !first || isTitle(first) || isFunction(second)) return true;
  return first.kind === ts.SyntaxKind.TrueKeyword;
}

/**
 * The tests a file switches off or narrows down, as `line: code`.
 *
 * skipped: it.skip / describe.skip / test.todo / test.fixme and the
 * x-shorthands, each switching off a test that never runs. Playwright's
 * test.skip(!seed.id, 'why') decides at run time and does not count (see
 * switchesOff); neither do skipIf and runIf, unless their condition is the
 * literal that always skips: skipIf(true), runIf(false).
 *
 * only: .only anywhere, which silently drops every other test in the file.
 *
 * file is the path from the client root: it decides vitest or Playwright.
 */
export function modifiers(source, file) {
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind);
  const skipped = [];
  const only = [];
  const at = (node) =>
    `${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}: ${node.getText(sf).slice(0, 60)}`;
  const visit = (node) => {
    if (ts.isPropertyAccessExpression(node) && RUNNERS.has(rootOf(node.expression) ?? '')) {
      const name = node.name.text;
      if (name === 'only') only.push(at(node));
      else if (name === 'todo') skipped.push(at(node));
      else if (name === 'skip' || name === 'fixme') {
        const call = ts.isCallExpression(node.parent) && node.parent.expression === node ? node.parent : null;
        // test.skip.each(table)(...) declares skipped tests without being called directly.
        if (!call || switchesOff(call, file)) skipped.push(at(node));
      } else if (name === 'skipIf' || name === 'runIf') {
        // skipIf(true) and runIf(false) are a skip in disguise: the condition can never change.
        const call = ts.isCallExpression(node.parent) && node.parent.expression === node ? node.parent : null;
        const never = name === 'skipIf' ? ts.SyntaxKind.TrueKeyword : ts.SyntaxKind.FalseKeyword;
        if (call?.arguments[0]?.kind === never) skipped.push(at(node));
      }
    } else if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && SHORTHAND.has(node.expression.text)) {
      skipped.push(at(node.expression));
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { skipped, only };
}

/** The skipped and focused tests per file under src/, tests/ and e2e/, keyed by the path from root. */
export function scan(root) {
  const skipped = {};
  const only = {};
  for (const path of listFiles(root, DIRS, accepts)) {
    const key = toKey(root, path);
    const found = modifiers(readText(path), key);
    if (found.skipped.length) skipped[key] = found.skipped;
    if (found.only.length) only[key] = found.only;
  }
  return { skipped, only };
}

/**
 * Runs the check: no .only anywhere, and no file with more skipped tests than
 * its entry in the baseline at baselinePath. Returns the exit code.
 */
export function check({
  root,
  baselinePath = join(root, 'scripts/skip-baseline.json'),
  update = false,
  log = console.log,
  error = console.error,
}) {
  const { skipped, only } = scan(root);
  const counts = Object.fromEntries(Object.entries(skipped).map(([key, list]) => [key, list.length]));
  let baseline = readBaseline(baselinePath, countMap);

  if (update) {
    baseline = lowerCounts(baseline, counts);
    writeBaseline(baselinePath, baseline);
  }

  for (const [key, list] of Object.entries(only)) {
    error(`FAIL  ${key}: .only runs this test alone and drops every other one in the file:`);
    for (const line of list) error(`        ${line}`);
  }
  const grown = Object.entries(counts).filter(([key, n]) => n > (baseline[key] ?? 0));
  for (const [key, n] of grown) {
    error(`FAIL  ${key}: ${n} skipped or todo test(s), baseline ${baseline[key] ?? 0}:`);
    for (const line of skipped[key]) error(`        ${line}`);
  }
  if (grown.length) {
    error('Fix the test, delete it if its feature is gone, or use skipIf/runIf when it depends on the environment.');
  }
  const stale = staleCounts(baseline, counts);
  reportStale(stale, { file: 'skip-baseline.json', command: 'lint:skips', root, error });
  const sum = (map) => Object.values(map).reduce((a, b) => a + b, 0);
  log(
    `skips: ${sum(counts)} skipped or todo test(s), baseline allows ${sum(baseline)}; ${Object.keys(only).length} file(s) with .only`
  );
  return grown.length || stale.length || Object.keys(only).length ? 1 : 0;
}
