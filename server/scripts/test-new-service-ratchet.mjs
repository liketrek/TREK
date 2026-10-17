#!/usr/bin/env node
/*
 * lint:test-new-service: hand-built services and repositories in tests/ may
 * only shrink.
 *
 * `new XService(a, b, c, ...)` in a test pins the constructor's parameter
 * order: every dependency a service gains is a change to every suite that
 * builds it (and to every suite that builds one of its consumers), which is
 * why the harness files are among the most churned in the repository. A suite
 * takes its subject from a Nest testing module instead (tests/helpers/
 * test-module.ts: createTestModule with overrides), and a booted app hands
 * the rest out through `app.get(...)`.
 *
 * Every `new <Name>Service(` and `new <Name>Repository(` under tests/ outside a
 * comment counts (an import alias or `new (Name)(` counts as the class it
 * names), per file, against scripts/test-new-service-baseline.json; a file without an
 * entry may hold none (scripts/lib/count-ratchet.mjs has the rules). The
 * allowlist is derived, not kept by hand: a class whose constructor takes no
 * parameters (no constructor of its own, or an empty one, down its chain of
 * `extends` inside src/ and tests/helpers/) has no wiring to pin, so building
 * it with `new` does not count. RealtimeService and FakeRealtimeService are
 * the common case.
 *
 *   npm run lint:test-new-service              check against the baseline (CI)
 *   npm run lint:test-new-service -- --update  lower the counts; never raises or adds an entry
 */
import { cliMain, stripComments } from './lib/count-ratchet.mjs';

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const CLASS_DECL = /\bclass\s+([A-Za-z_$][\w$]*)(?:\s*<[^{]*?>)?(?:\s+extends\s+([A-Za-z_$][\w$.]*))?[^{]*\{/g;

/** The trees whose classes the allowlist is derived from, relative to the server root. */
const CLASS_ROOTS = ['src', 'tests/helpers'];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (/\.[cm]?ts$/.test(name)) files.push(path);
  }
  return files;
}

/** The index just past the bracket that closes the one at `open`, skipping strings and comments. */
function closeOf(text, open) {
  const pairs = { '(': ')', '{': '}', '[': ']' };
  const stack = [];
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (c === '/' && text[i + 1] === '/') {
      i = text.indexOf('\n', i);
      if (i < 0) return text.length;
      continue;
    }
    if (c === '/' && text[i + 1] === '*') {
      i = text.indexOf('*/', i + 2) + 1;
      if (i <= 0) return text.length;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      for (i++; i < text.length && text[i] !== c; i++) if (text[i] === '\\') i++;
      continue;
    }
    if (pairs[c]) stack.push(pairs[c]);
    else if (c === stack[stack.length - 1]) {
      stack.pop();
      if (!stack.length) return i + 1;
    }
  }
  return text.length;
}

/**
 * Every class declared in `text`: its parent, and whether its own constructor
 * takes parameters (`null` when it declares none).
 */
export function parseClasses(text) {
  const classes = [];
  for (const match of text.matchAll(CLASS_DECL)) {
    const bodyOpen = match.index + match[0].length - 1;
    const body = text.slice(bodyOpen, closeOf(text, bodyOpen));
    const ctor = /\bconstructor\s*\(/.exec(body);
    let ctorHasParams = null;
    if (ctor) {
      const open = ctor.index + ctor[0].length - 1;
      const params = body
        .slice(open + 1, closeOf(body, open) - 1)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .trim();
      ctorHasParams = params.length > 0;
    }
    classes.push({ name: match[1], parent: match[2] ?? null, ctorHasParams });
  }
  return classes;
}

/**
 * The names whose constructor takes no parameters, resolved down the extends
 * chain. A parent declared outside the scanned trees (a library class) is
 * taken to need arguments, so a subclass without a constructor of its own counts.
 */
export function zeroArgClasses(classes) {
  const byName = new Map();
  for (const c of classes) if (!byName.has(c.name)) byName.set(c.name, c);
  const memo = new Map();
  const resolve = (name, seen = new Set()) => {
    if (memo.has(name)) return memo.get(name);
    const c = byName.get(name);
    let zero;
    if (!c || seen.has(name)) zero = false;
    else if (c.ctorHasParams !== null) zero = !c.ctorHasParams;
    else zero = c.parent === null ? true : resolve(c.parent, new Set([...seen, name]));
    memo.set(name, zero);
    return zero;
  };
  return new Set([...byName.keys()].filter((name) => resolve(name)));
}

// `new X(`, `new X<T>(` and `new (X)(`: the name is checked after aliases resolve.
const ANY_NEW = /\bnew(?:\s+|\s*\(\s*)([A-Za-z_$][\w$]*)\s*\)?\s*[(<]/g;
// `import { DaysService as Days }` (and `type`-less re-imports of the same shape).
const IMPORT_BLOCK = /\bimport\s+(?:type\s+)?\{([^}]*)\}\s*from\b/g;
const ALIAS = /\b([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)/g;
const SERVICE_NAME = /^[A-Z][A-Za-z0-9_]*(?:Service|Repository)$/;

/** Local name -> imported name, for every renamed import in the text. */
function importAliases(text) {
  const aliases = new Map();
  for (const block of text.matchAll(IMPORT_BLOCK)) {
    for (const m of block[1].matchAll(ALIAS)) aliases.set(m[2], m[1]);
  }
  return aliases;
}

/**
 * The hand-built services and repositories in one file's text, `allowed` left
 * out. Comments do not count; an import alias (`DaysService as Days`) and a
 * parenthesised class (`new (DaysService)(`) count as the class they name.
 */
export function countNewServices(text, allowed = new Set()) {
  const code = stripComments(text);
  const aliases = importAliases(code);
  let n = 0;
  for (const match of code.matchAll(ANY_NEW)) {
    const name = aliases.get(match[1]) ?? match[1];
    if (SERVICE_NAME.test(name) && !allowed.has(name)) n++;
  }
  return n;
}

export const check = {
  name: 'test-new-service',
  script: 'lint:test-new-service',
  root: 'tests',
  baseline: 'scripts/test-new-service-baseline.json',
  unit: 'hand-built service(s) or repository(ies)',
  advice:
    'Take the subject from createTestModule (tests/helpers/test-module.ts) with overrides for its ' +
    'collaborators, or from a booted app with app.get(), instead of calling its constructor.',
  prepare: (serverDir) => {
    const classes = [];
    for (const root of CLASS_ROOTS) {
      const dir = join(serverDir, root);
      if (!existsSync(dir)) continue;
      for (const path of walk(dir)) classes.push(...parseClasses(readFileSync(path, 'utf8')));
    }
    return zeroArgClasses(classes);
  },
  include: (file) => /\.[cm]?[jt]s$/.test(file),
  count: (text, _file, allowed) => countNewServices(text, allowed),
};

cliMain(check, import.meta.url);
