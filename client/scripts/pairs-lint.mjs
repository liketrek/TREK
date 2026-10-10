#!/usr/bin/env node
/*
 * lint:pairs: a desktop view and its phone twin run on the same logic.
 *
 * Most features have a desktop view under components/ or pages/ and a phone
 * view under mobile/, and each used to carry its own copy of the feature's
 * state, loading and handlers, so a fix on one side drifted away from the
 * other. The logic now lives in one shared hook per feature, and
 * scripts/feature-pairs.json names, for every feature, the hooks and the
 * desktop and phone files that run on them. The check fails when a listed
 * view stops importing one of its pair's hooks, when a listed file is gone,
 * when a hook sits in a view layer, and when a file under src/mobile/screens
 * is in no pair and not under mobileOnly with the reason it has no twin. A
 * new phone screen is so either wired to the desktop feature's hook or marked
 * as phone only on purpose, never a quiet second copy. lint:dup catches the
 * copies that look alike; this catches the ones written anew.
 *
 *   npm run lint:pairs              check the manifest against the tree (CI)
 *   npm run lint:pairs -- --list    print every pair with its hooks
 */
import { fileURLToPath } from 'node:url';
import { check } from './lib/pairs.mjs';
import { runCli } from './lib/ratchet.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
await runCli('lint:pairs', (args) => check({ root, list: args.includes('--list') }));
