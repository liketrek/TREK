/*
 * The manifest and the checks behind lint:pairs (scripts/pairs-lint.mjs).
 */
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { importsOf } from './imports.mjs';
import { listFiles, readBaseline, readText, TEST_FILE, toKey } from './ratchet.mjs';

/** The phone screens every entry of the manifest is weighed against. */
export const SCREENS = 'src/mobile/screens';

/**
 * Where a shared hook may live: below the views that both import it, or next
 * to a page in its folder under pages/ (use<Page> and its models), which the
 * phone shell of that page imports as well. Never in a view itself.
 */
const SHARED = /^src\/(?:components|hooks|utils)\/|^src\/pages\/[^/]+\//;

const SOURCE = /\.tsx?$/;
const isPath = (value) => typeof value === 'string' && SOURCE.test(value) && !value.includes('\\');
const isPathList = (value) => Array.isArray(value) && value.length > 0 && value.every(isPath);

/**
 * scripts/feature-pairs.json: pairs is a list of features, each with the
 * shared hooks or models that hold its logic and the desktop and phone files
 * that run on them; mobileOnly maps each phone screen file that has no
 * desktop twin, or no logic a twin could share, to the reason.
 */
export function manifestShape(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'it is not an object';
  const keys = Object.keys(value).sort().join(',');
  if (keys !== 'mobileOnly,pairs') return 'it needs exactly the keys "pairs" and "mobileOnly"';
  if (!Array.isArray(value.pairs)) return '"pairs" is not a list';
  const names = new Set();
  for (const pair of value.pairs) {
    if (!pair || typeof pair !== 'object' || typeof pair.feature !== 'string' || !pair.feature.trim())
      return `a pair without a feature name: ${JSON.stringify(pair)}`;
    if (names.has(pair.feature)) return `the feature "${pair.feature}" is listed twice`;
    names.add(pair.feature);
    for (const field of ['hooks', 'desktop', 'mobile'])
      if (!isPathList(pair[field]))
        return `"${pair.feature}" needs "${field}" as a list of source files from the client root`;
  }
  const only = value.mobileOnly;
  if (!only || typeof only !== 'object' || Array.isArray(only)) return '"mobileOnly" is not an object of file → reason';
  for (const [key, reason] of Object.entries(only)) {
    if (!isPath(key)) return `"${key}" in "mobileOnly" is not a source file from the client root`;
    if (typeof reason !== 'string' || !reason.trim()) return `"${key}" in "mobileOnly" has no reason`;
  }
  return null;
}

/** The path a relative import lands on from the client root, without its extension. */
function targetOf(root, fromFile, specifier) {
  if (!specifier.startsWith('.')) return null;
  return toKey(root, resolve(dirname(fromFile), specifier)).replace(/(?:\/index)?(?:\.[cm]?[jt]sx?)?$/, '');
}

const stem = (key) => key.replace(/\.[cm]?[jt]sx?$/, '');

/** The modules a file imports for more than types, as paths from the root without extensions. */
function runtimeImports(root, key) {
  const path = join(root, key);
  return new Set(
    importsOf(readText(path), path)
      .filter((imp) => !imp.typeOnly)
      .map((imp) => targetOf(root, path, imp.specifier))
      .filter(Boolean)
  );
}

/**
 * Everything wrong with the manifest against the tree, as lines to print:
 * a listed file that is gone, a hook outside the shared layers, a view of a
 * pair that does not import every hook of the pair, a phone screen listed
 * both as a pair and as phone only, and a phone screen that is in neither.
 */
export function problems(root, manifest) {
  const found = [];
  const listed = new Set();
  const present = (key, where) => {
    if (existsSync(join(root, key))) return true;
    found.push(`${key} is listed under ${where} but does not exist`);
    return false;
  };

  for (const pair of manifest.pairs) {
    const where = `"${pair.feature}"`;
    const hooks = pair.hooks.filter((key) => present(key, where));
    for (const key of hooks)
      if (!SHARED.test(key))
        found.push(`${key}, the hook of ${where}, is not under src/components, src/hooks, src/utils or a page folder`);
    for (const key of [...pair.desktop, ...pair.mobile]) {
      if (pair.mobile.includes(key)) listed.add(key);
      if (!present(key, where)) continue;
      const imported = runtimeImports(root, key);
      const missing = hooks.filter((hook) => !imported.has(stem(hook)));
      for (const hook of missing) found.push(`${key} is a view of ${where} but does not import ${hook}`);
    }
  }

  for (const key of Object.keys(manifest.mobileOnly)) {
    if (!present(key, 'mobileOnly')) continue;
    if (listed.has(key)) found.push(`${key} is listed in a pair and under mobileOnly; it is one or the other`);
    listed.add(key);
  }

  const screens = listFiles(
    root,
    [SCREENS],
    (key) => SOURCE.test(key) && !TEST_FILE.test(key) && !key.endsWith('.d.ts')
  );
  for (const path of screens) {
    const key = toKey(root, path);
    if (!listed.has(key)) found.push(`${key} is a phone screen file that scripts/feature-pairs.json does not list`);
  }
  return found;
}

/** Runs the check against the manifest at manifestPath and returns the exit code. */
export function check({
  root,
  manifestPath = join(root, 'scripts/feature-pairs.json'),
  list = false,
  log = console.log,
  error = console.error,
}) {
  const manifest = readBaseline(manifestPath, manifestShape);
  const found = problems(root, manifest);

  if (list) {
    for (const pair of manifest.pairs) log(`${pair.feature}: ${pair.hooks.join(', ')}`);
  }
  for (const line of found) error(`FAIL  ${line}`);
  if (found.length) {
    error(
      'A feature that has a desktop view and a phone view keeps its logic in one shared hook both import. ' +
        'Add a new phone screen to scripts/feature-pairs.json: as a view of the pair whose hook it runs on, ' +
        'or under mobileOnly with the reason it has no twin. See client/CLAUDE.md, "Desktop and phone views".'
    );
  }
  const only = Object.keys(manifest.mobileOnly).length;
  log(
    `pairs: ${manifest.pairs.length} shared feature(s), ${only} phone-only screen file(s), ${found.length} problem(s)`
  );
  return found.length ? 1 : 0;
}
