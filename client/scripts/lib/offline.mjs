/*
 * The comparison behind lint:offline (scripts/offline-lint.mjs).
 */
import { join } from 'node:path';
import { sourceGraph } from './imports.mjs';
import { fileList, lowerList, readBaseline, writeBaseline } from './ratchet.mjs';

/** The layers that render or drive a view, and so must not hold a network call. */
export const VIEW_LAYERS = ['components', 'mobile', 'pages', 'hooks'];

/**
 * The view files that import from src/api/ for anything but types, each with
 * the imports that do it. A type-only import is erased from the bundle and
 * carries no request, so it does not count.
 */
export function bypasses(root) {
  const found = {};
  for (const file of sourceGraph(root)) {
    if (!VIEW_LAYERS.includes(file.layer)) continue;
    const direct = file.imports.filter((imp) => imp.layer === 'api' && !imp.typeOnly);
    if (direct.length) found[file.key] = direct.map((imp) => `${imp.line}: '${imp.specifier}'`);
  }
  return found;
}

/**
 * Runs the check against the list at baselinePath. A view file outside the
 * list may not import src/api/. A listed file that no longer does fails the
 * check as well until --update takes it out, so the list only shrinks and
 * the next file at that path does not inherit the exemption. Returns the exit
 * code.
 */
export function check({
  root,
  baselinePath = join(root, 'scripts/offline-baseline.json'),
  update = false,
  list = false,
  log = console.log,
  error = console.error,
}) {
  const found = bypasses(root);
  const offenders = Object.keys(found);
  let baseline = readBaseline(baselinePath, fileList);

  if (update) {
    baseline = lowerList(baseline, offenders);
    writeBaseline(baselinePath, baseline);
  }

  const allowed = new Set(baseline);
  const fresh = offenders.filter((key) => !allowed.has(key));
  const stale = baseline.filter((key) => !found[key]);

  if (list) {
    for (const [key, direct] of Object.entries(found)) {
      log(`${allowed.has(key) ? 'listed' : 'new   '}  ${key}`);
      for (const line of direct) log(`          ${line}`);
    }
  }
  for (const key of fresh) {
    error(`FAIL  ${key} imports src/api/ directly:`);
    for (const line of found[key]) error(`        ${line}`);
  }
  if (fresh.length) {
    error(
      'A view reads through a repo (src/repo/) or a store and writes through the mutation queue, ' +
        'so it keeps working offline. A domain that is online-only on purpose still gets its calls ' +
        'in a store or a repo, not in the view. See client/CLAUDE.md, "Data flow".'
    );
  }
  for (const key of stale) {
    error(`FAIL  ${key} is listed in scripts/offline-baseline.json but no longer imports src/api/ (or is gone).`);
  }
  if (stale.length) error('Run npm run lint:offline -- --update to take it off the list.');
  log(`offline: ${offenders.length} view file(s) import src/api/ directly, ${baseline.length} listed in the baseline`);
  return fresh.length || stale.length ? 1 : 0;
}
