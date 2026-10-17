#!/usr/bin/env node
/*
 * lint:offline: views go through the offline core, not around it.
 *
 * The data path is component, feature hook, store, repo, then api or Dexie,
 * and writes go through the mutation queue. A view that imports src/api/
 * skips the cache, the optimistic write and the idempotent replay, so the
 * feature breaks offline. Such files kept growing, by about fifteen a month.
 * The view files (components/, mobile/, pages/, hooks/) that already import
 * src/api/ for more than types are listed in scripts/offline-baseline.json;
 * no other view file may, and the list only shrinks.
 *
 *   npm run lint:offline              check against the baseline (CI)
 *   npm run lint:offline -- --list    print every view file that imports src/api/
 *   npm run lint:offline -- --update  take the files that stopped off the list;
 *                                     it never adds one
 */
import { fileURLToPath } from 'node:url';
import { check } from './lib/offline.mjs';
import { runCli } from './lib/ratchet.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
await runCli('lint:offline', (args) =>
  check({ root, update: args.includes('--update'), list: args.includes('--list') })
);
