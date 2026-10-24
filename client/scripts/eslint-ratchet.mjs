#!/usr/bin/env node
/*
 * lint:warnings: ESLint warnings may only go down.
 *
 * Most rules in eslint.config.mjs are warnings, set that way to keep CI green
 * on code that was never linted, and a warning never fails a build. So they
 * piled up: unused variables hiding dead props, missing effect dependencies
 * of the kind that has already shown stale money. This runs ESLint over the
 * client and counts the warnings per rule, separately for app code and
 * tests, and the messages an eslint-disable comment silenced as a third
 * group. Each count may not pass its entry in scripts/eslint-baseline.json,
 * and an entry above its count fails as well until --update lowers it, so a
 * fixed warning cannot come back unseen.
 * Any error fails as well, so the check can stand in for `npm run lint:check`,
 * and so does a block comment that configures a rule inline (such as one that
 * turns no-explicit-any off): it leaves no message to count, so it would
 * otherwise be the free way past the ratchet.
 *
 *   npm run lint:warnings              check against the baseline (CI)
 *   npm run lint:warnings -- --update  lower the baseline to today's counts;
 *                                      it never raises an entry
 */
import { fileURLToPath } from 'node:url';
import { check } from './lib/eslint-warnings.mjs';
import { runCli } from './lib/ratchet.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
await runCli('lint:warnings', (args) => check({ root, update: args.includes('--update') }));
