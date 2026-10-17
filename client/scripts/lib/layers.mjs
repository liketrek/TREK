/*
 * The rules and the comparison behind lint:layers (scripts/layer-lint.mjs).
 */
import { join } from 'node:path';
import { sourceGraph } from './imports.mjs';
import { countMap, lowerCounts, readBaseline, reportStale, staleCounts, writeBaseline } from './ratchet.mjs';

const VIEW = ['components', 'mobile', 'pages', 'hooks'];

/**
 * For each directory under src/, the directories its files may not import
 * from. The view layers sit on top: a page composes components, a component
 * may use a shared hook, and the phone screens reuse both. Nothing below the
 * views (stores, repos, sync, api, the Dexie schema and the helpers) knows a
 * view exists, a repo sits under the stores, and the Dexie schema under all
 * of them. help/ (the help center's screen registry, plain data) and vacay/
 * (date helpers) are helpers like utils/. Directories without an entry are
 * free on purpose: mobile and pages sit at the top, the app root wires
 * everything, and managed/ is the slot an operator fills with whole screens
 * at build time. A file directly in src/ is the layer of its name, so
 * src/types.ts falls under types like the src/types/ directory.
 */
export const RULES = {
  components: ['pages', 'mobile'],
  hooks: ['pages', 'mobile', 'components'],
  store: VIEW,
  sync: VIEW,
  api: VIEW,
  utils: VIEW,
  i18n: VIEW,
  theme: VIEW,
  constants: VIEW,
  services: VIEW,
  push: VIEW,
  types: VIEW,
  help: VIEW,
  vacay: VIEW,
  repo: [...VIEW, 'store'],
  db: [...VIEW, 'store', 'repo', 'sync', 'api'],
};

/**
 * Every import that crosses a boundary the wrong way, per file. A type-only
 * import counts too: a type the lower layer needs belongs below it.
 */
export function violations(root, rules = RULES) {
  const found = {};
  for (const file of sourceGraph(root)) {
    const banned = rules[file.layer];
    if (!banned) continue;
    const wrong = file.imports.filter((imp) => imp.layer && banned.includes(imp.layer));
    if (wrong.length)
      found[file.key] = wrong.map((imp) => `${imp.line}: '${imp.specifier}' (${file.layer} into ${imp.layer})`);
  }
  return found;
}

/** Runs the check against the baseline at baselinePath and returns the exit code. */
export function check({
  root,
  baselinePath = join(root, 'scripts/layers-baseline.json'),
  rules = RULES,
  update = false,
  list = false,
  log = console.log,
  error = console.error,
}) {
  const found = violations(root, rules);
  const counts = Object.fromEntries(Object.entries(found).map(([key, list]) => [key, list.length]));
  let baseline = readBaseline(baselinePath, countMap);

  if (list) {
    for (const [key, wrong] of Object.entries(found)) {
      log(`${key} (${wrong.length}, baseline ${baseline[key] ?? 0})`);
      for (const line of wrong) log(`  ${line}`);
    }
  }

  if (update) {
    baseline = lowerCounts(baseline, counts);
    writeBaseline(baselinePath, baseline);
  }

  const grown = Object.entries(counts).filter(([key, n]) => n > (baseline[key] ?? 0));
  const stale = staleCounts(baseline, counts);

  for (const [key, n] of grown) {
    error(`FAIL  ${key}: ${n} import(s) against the layering, baseline ${baseline[key] ?? 0}:`);
    for (const line of found[key]) error(`        ${line}`);
  }
  if (grown.length) {
    error(
      'Move what both sides need down into a layer they may share (a model or helper under utils/, ' +
        'a hook under hooks/, a type under types/) instead of importing upwards.'
    );
  }
  reportStale(stale, { file: 'layers-baseline.json', command: 'lint:layers', root, error });
  const sum = (map) => Object.values(map).reduce((a, b) => a + b, 0);
  log(
    `layers: ${sum(counts)} import(s) against the layering in ${Object.keys(counts).length} file(s), baseline allows ${sum(baseline)}`
  );
  return grown.length || stale.length ? 1 : 0;
}
