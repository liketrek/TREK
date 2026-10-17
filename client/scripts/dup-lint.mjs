#!/usr/bin/env node
/*
 * lint:dup: keeps copied code from coming back.
 *
 * Most features have a desktop view and a phone view, and each used to carry
 * its own copy of the feature's logic, so a fix reached one of them and the
 * other kept the bug. The logic now lives in one shared hook or module per
 * feature, and this check holds the copies that remain to what they are. It
 * counts, per file under src/, the lines inside a block of code that repeats
 * elsewhere (or in the same file), at the thresholds SonarCloud uses on a
 * pull request. The files that still hold such lines are listed in
 * scripts/dup-baseline.json with their count, and a file may hold no more
 * than its entry (a file without an entry holds none). An entry above what
 * its file holds now, or for a file that is gone, fails as well until
 * --update lowers it.
 *
 *   npm run lint:dup              check against the baseline (CI)
 *   npm run lint:dup -- --list    print every copied block with its other side
 *   npm run lint:dup -- --update  lower the baseline to what the files hold now;
 *                                 it never raises an entry
 *
 * The measuring lives in scripts/lib/dup.mjs.
 */
import { fileURLToPath } from 'node:url';
import { check } from './lib/dup.mjs';
import { runCli } from './lib/ratchet.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
await runCli('lint:dup', (args) => check({ root, update: args.includes('--update'), list: args.includes('--list') }));
