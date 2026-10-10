#!/usr/bin/env node
/*
 * lint:response-contracts: route handlers without a @ResponseContract may only shrink.
 *
 * `@ResponseContract(schema)` (src/nest/common/response-contract.ts) names the
 * @trek/shared schema a handler answers with, and under NODE_ENV=test every
 * response is parsed against it, so the e2e suites catch a response that
 * drifted from its contract. This holds the handlers still without one to
 * what they are today.
 *
 * Every method under src/nest/ carrying a route decorator (@Get, @Post, @Put,
 * @Patch, @Delete, @All, @Head, @Options) counts as a handler. One counts as
 * covered when it also carries @ResponseContract(...), or when a comment
 * above it reads `response-contract-exempt: <reason>` (a handler that writes
 * through @Res(), a redirect or a stream, has no return value to check). The
 * uncovered handlers are counted per file against
 * scripts/response-contract-baseline.json: a file may hold at most its entry,
 * a file without one none. An entry above what its file holds now, or for a
 * file that is gone, fails too until --update lowers it.
 *
 *   npm run lint:response-contracts              check against the baseline (CI)
 *   npm run lint:response-contracts -- --update  lower the counts to what the files hold now;
 *                                                it never raises an entry and never adds one
 *
 * --dir=<path> points the check at another server root (the unit tests use it).
 */
import { existsSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');

/** The tree the check walks, relative to the server root. */
export const ROOT = 'src/nest';

/** The baseline, relative to the server root. */
export const BASELINE = 'scripts/response-contract-baseline.json';

/** The decorators that make a method a route handler. */
export const ROUTE_DECORATORS = new Set(['Get', 'Post', 'Put', 'Patch', 'Delete', 'All', 'Head', 'Options']);

/** The comment that excuses a handler with no return value to check. */
export const EXEMPT_MARKER = 'response-contract-exempt:';

const SOURCE = /\.ts$/;

function decoratorName(decorator) {
  const expr = decorator.expression;
  const callee = ts.isCallExpression(expr) ? expr.expression : expr;
  if (ts.isIdentifier(callee)) return callee.text;
  if (ts.isPropertyAccessExpression(callee)) return callee.name.text;
  return null;
}

/** Whether a comment directly above the method (between its decorators or before them) exempts it. */
function isExempt(text, method) {
  const head = text.slice(method.getFullStart(), method.name.getStart());
  return head.split('\n').some((line) => /^\s*(\/\/|\/?\*)/.test(line) && line.includes(EXEMPT_MARKER));
}

/** The route handlers of one file's text: `{ name, covered }` in source order. */
export function handlersOf(text, fileName = 'file.ts') {
  const source = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const handlers = [];
  const visit = (node) => {
    if (ts.isMethodDeclaration(node)) {
      const names = (ts.getDecorators(node) ?? []).map(decoratorName);
      if (names.some((n) => n && ROUTE_DECORATORS.has(n))) {
        const name = node.name && ts.isIdentifier(node.name) ? node.name.text : (node.name?.getText(source) ?? '?');
        handlers.push({ name, covered: names.includes('ResponseContract') || isExempt(text, node) });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return handlers;
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (SOURCE.test(name)) files.push(path);
  }
  return files;
}

/**
 * Handler totals and the uncovered counts keyed by the server-relative POSIX path
 * (files with none left out of `uncovered`).
 */
export function scan(serverDir) {
  const dir = join(serverDir, ROOT);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    throw new Error(`${ROOT}/ does not exist under ${serverDir}: the check would pass without looking at anything`);
  }
  const uncovered = {};
  let total = 0;
  for (const path of walk(dir)) {
    const file = relative(serverDir, path).split('\\').join('/');
    const handlers = handlersOf(readFileSync(path, 'utf8'), file);
    total += handlers.length;
    const n = handlers.filter((h) => !h.covered).length;
    if (n > 0) uncovered[file] = n;
  }
  if (total === 0)
    throw new Error(`no route handler found under ${ROOT}/: the check would pass without looking at anything`);
  return { total, uncovered };
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
  return Object.fromEntries(Object.entries(lowered).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
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

  const { total, uncovered } = scan(serverDir);
  const baseline = readBaseline(baselinePath);
  if (argv.includes('--update')) {
    baseline.counts = lowerCounts(baseline, uncovered);
    writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + '\n');
  }

  const { grown, stale } = compare(baseline, uncovered);
  for (const [file, n] of grown) {
    const entry = baseline.counts[file];
    console.error(
      `FAIL  ${file}: ${n} route handler(s) without @ResponseContract, ` +
        (entry ? `its baseline is ${entry}. ` : 'a file without a baseline entry may hold none. ') +
        'Declare the @trek/shared response schema the handler answers with (src/nest/common/response-contract.ts), ' +
        `or mark a handler that writes through @Res() with a "${EXEMPT_MARKER} <reason>" comment.`,
    );
  }
  for (const [file, entry] of stale) {
    console.error(
      `FAIL  ${file} is held at ${entry} in ${BASELINE}, ` +
        (file in uncovered ? `but it has ${uncovered[file]} now.` : 'but it has none left (or the file is gone).'),
    );
  }
  if (stale.length) {
    console.error(
      'Run npm run lint:response-contracts -- --update to lower the baseline with the change that made it smaller.',
    );
  }
  const open = Object.values(uncovered).reduce((sum, n) => sum + n, 0);
  const share = ((100 * (total - open)) / total).toFixed(1);
  console.log(
    `response-contracts: ${total - open} of ${total} route handler(s) covered (${share} %), the rest held at their baseline`,
  );
  return grown.length || stale.length ? 1 : 0;
}

// Compared by real path, so the check still runs when the script is started through a symlink.
const isCli =
  Boolean(process.argv[1]) &&
  existsSync(process.argv[1]) &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (err) {
    console.error(`FAIL  ${err.message}`);
    process.exitCode = 1;
  }
}
