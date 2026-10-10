#!/usr/bin/env node
/*
 * contracts:open: the request contracts may only get tighter.
 *
 * A write route's body is validated against its *RequestSchema, and the boot
 * gate on the server only checks that one exists. An open shape inside it
 * accepts anything at that spot, so the route is covered on paper while the
 * real shape lives in service code and casts (see CLAUDE.md, "Narrow an
 * existing open object rather than adding a new z.record(...)/passthrough
 * body"). This counts the open shapes in every exported *RequestSchema:
 *
 *   loose    an object that keeps unknown keys (z.looseObject, .passthrough(),
 *            a catchall of unknown or any)
 *   record   a z.record whose values are unknown or any
 *   unknown  a z.unknown() or z.any() anywhere else, a field or the whole body
 *   custom   a z.custom() or z.instanceof(), a predicate rather than a shape
 *
 * and compares the count per schema with scripts/open-request-schemas-baseline.json.
 * A schema over its entry fails, so does a new schema with any open shape;
 * narrowing one is reported so the baseline can follow.
 *
 *   npm run contracts:open              check the built package against the baseline (CI)
 *   npm run contracts:open -- --update  lower the baseline to today's counts; it never
 *                                       raises or adds an entry
 *
 * It reads the built dist/, so run `npm run build` first. The same check runs
 * against src/ in `npm test` (src/open-request-schemas.spec.ts).
 */
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const BASELINE = fileURLToPath(new URL('./open-request-schemas-baseline.json', import.meta.url));
const DIST = fileURLToPath(new URL('../dist/index.cjs', import.meta.url));

/** The exports this ratchet looks at. */
export const REQUEST_SCHEMA = /RequestSchema$/;

const isOpenLeaf = (schema) => {
  const type = schema?._zod?.def?.type;
  return type === 'unknown' || type === 'any';
};

/**
 * The open shapes inside one Zod schema, as a list of `kind@path` strings.
 * An open spot counts once per path it sits at: one z.unknown() instance
 * reused across four fields is four open fields. The same `kind@path` is
 * listed once, so both sides of an intersection naming one field do not
 * count it twice. `ancestors` only stops the walk from looping through a
 * recursive z.lazy().
 */
export function openShapes(root) {
  const found = new Set();
  const ancestors = new Set();
  const visit = (schema, path) => {
    const def = schema?._zod?.def;
    if (!def || ancestors.has(schema)) return;
    ancestors.add(schema);
    try {
      walk(def, schema, path);
    } finally {
      ancestors.delete(schema);
    }
  };
  const walk = (def, schema, path) => {
    switch (def.type) {
      case 'unknown':
      case 'any':
        found.add(`unknown@${path}`);
        return;
      case 'custom':
        // z.custom() and z.instanceof(): a predicate, not a shape, so nothing
        // about the value is described.
        found.add(`custom@${path}`);
        return;
      case 'record':
        if (isOpenLeaf(def.valueType)) {
          found.add(`record@${path}`);
          return;
        }
        visit(def.valueType, `${path}{}`);
        return;
      case 'map':
        visit(def.keyType, `${path}<key>`);
        visit(def.valueType, `${path}{}`);
        return;
      case 'object':
        if (isOpenLeaf(def.catchall)) found.add(`loose@${path}`);
        else if (def.catchall && def.catchall._zod.def.type !== 'never') visit(def.catchall, `${path}.*`);
        for (const [key, value] of Object.entries(def.shape ?? {})) visit(value, `${path}.${key}`);
        return;
      case 'lazy':
        visit(schema._zod.innerType ?? def.getter(), path);
        return;
      default:
        break;
    }
    // Wrappers and combinators: optional, nullable, default, catch, pipe,
    // array, set, tuple, union, intersection, readonly and the like.
    for (const key of ['innerType', 'in', 'out', 'element', 'valueType', 'left', 'right', 'rest']) {
      if (def[key]?._zod) visit(def[key], path);
    }
    for (const key of ['options', 'items']) {
      if (Array.isArray(def[key])) def[key].forEach((option, i) => visit(option, `${path}|${i}`));
    }
  };
  visit(root, '$');
  return [...found];
}

/** Open-shape counts for every exported *RequestSchema of a module namespace, sorted by name. */
export function countOpenShapes(namespace) {
  const counts = {};
  for (const name of Object.keys(namespace).sort()) {
    if (!REQUEST_SCHEMA.test(name) || !namespace[name]?._zod) continue;
    counts[name] = openShapes(namespace[name]).length;
  }
  return counts;
}

/** The baseline as committed. Missing, unreadable or malformed is an error, never an empty baseline. */
export function readBaseline(path = BASELINE) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new Error(`scripts/open-request-schemas-baseline.json cannot be read: ${err.message}`);
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('scripts/open-request-schemas-baseline.json must be an object of schema names to counts');
  }
  for (const [name, n] of Object.entries(parsed)) {
    if (!Number.isInteger(n) || n < 1) {
      throw new Error(`scripts/open-request-schemas-baseline.json: ${name} holds ${JSON.stringify(n)}, expected a whole number above 0`);
    }
  }
  return parsed;
}

/** Schemas over their allowance, and entries the schemas have narrowed below. */
export function compare(baseline, counts) {
  const grown = Object.entries(counts).filter(([name, n]) => n > (baseline[name] ?? 0));
  const lowerable = Object.entries(baseline).filter(([name, n]) => (counts[name] ?? 0) < n);
  return { grown, lowerable };
}

/** The baseline lowered to today's counts. Never raises an entry, never adds one, drops the ones at zero. */
export function lowerBaseline(baseline, counts) {
  const lowered = {};
  for (const [name, allowed] of Object.entries(baseline)) {
    const now = Math.min(allowed, counts[name] ?? 0);
    if (now > 0) lowered[name] = now;
  }
  return Object.fromEntries(Object.entries(lowered).sort(([a], [b]) => a.localeCompare(b)));
}

export function report(baseline, counts, log = console) {
  const { grown, lowerable } = compare(baseline, counts);
  for (const [name, n] of grown) {
    const entry = baseline[name];
    log.error(
      `FAIL  ${name}: ${n} open shape(s), ` +
        (entry ? `its baseline is ${entry}. ` : 'a new schema may hold none. ') +
        'Type the fields instead of accepting any object (shared/CLAUDE.md, "Rules for new contracts").',
    );
  }
  return { grown, lowerable };
}

function main(argv) {
  if (!existsSync(DIST)) {
    throw new Error('dist/index.cjs is missing: run "npm run build" in shared/ first');
  }
  const namespace = createRequire(import.meta.url)(DIST);
  const counts = countOpenShapes(namespace);
  if (Object.keys(counts).length === 0) {
    throw new Error('no *RequestSchema export found in dist/: the check would pass without looking at anything');
  }
  let baseline = readBaseline();
  const update = argv.includes('--update');
  if (update) {
    baseline = lowerBaseline(baseline, counts);
    writeFileSync(BASELINE, JSON.stringify(baseline, null, 2) + '\n');
  }
  const { grown, lowerable } = report(baseline, counts);
  if (lowerable.length && !update) {
    console.log(`${lowerable.length} schema(s) hold fewer open shapes than their baseline now: run with --update to lower it.`);
  }
  const total = Object.values(baseline).reduce((a, b) => a + b, 0);
  console.log(
    `open shapes: ${Object.keys(counts).length} request schema(s), ${Object.keys(baseline).length} still open, ${total} open shape(s) held at their baseline`,
  );
  return grown.length ? 1 : 0;
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
