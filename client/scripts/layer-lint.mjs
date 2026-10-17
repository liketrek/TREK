#!/usr/bin/env node
/*
 * lint:layers: imports follow the layering, downwards only.
 *
 * Components reached up into pages/ for models and helpers, and sideways into
 * mobile/ for phone hooks and sheets, so nothing could be moved or split
 * without touching three trees. scripts/lib/layers.mjs holds the rules: a
 * component imports neither pages/ nor mobile/, a shared hook no view, and
 * nothing under the views (stores, repos, sync, api, db, helpers) a view at
 * all. The imports that already broke a rule are counted per file in
 * scripts/layers-baseline.json, and a file may hold no more of them than its
 * entry (a file without an entry holds none). Type-only imports count: a type
 * the lower layer needs belongs below it. An entry above what its file holds
 * now, or for a file that is gone, fails as well until --update lowers it.
 *
 *   npm run lint:layers              check against the baseline (CI)
 *   npm run lint:layers -- --list    print every import against the layering
 *   npm run lint:layers -- --update  lower the baseline to what the files hold now;
 *                                    it never raises an entry
 */
import { fileURLToPath } from 'node:url';
import { check } from './lib/layers.mjs';
import { runCli } from './lib/ratchet.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
await runCli('lint:layers', (args) =>
  check({ root, update: args.includes('--update'), list: args.includes('--list') })
);
