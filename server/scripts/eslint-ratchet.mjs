#!/usr/bin/env node
/*
 * lint:warnings: ESLint errors fail, warnings may only go down.
 *
 * Several rules in eslint.config.mjs are warnings (no-explicit-any,
 * no-unused-vars, no-require-imports, no-await-in-loop, no-non-null-assertion,
 * no-console and a few js.recommended ones), set that way because the code
 * had hits when they came in, and a warning never fails a build. So this runs
 * ESLint over the server with its own config, as `eslint .` does, and counts
 * the warnings per rule, separately for src/ and tests/, plus the messages an
 * eslint-disable comment silenced as a third group. Each count may not pass
 * its entry in scripts/eslint-baseline.json, and an entry above its count
 * fails as well until --update lowers it, so a fixed warning cannot come back
 * unseen. Any error fails, so the check stands in for `npm run lint:check`,
 * and so does a block comment that configures a rule inline: it leaves no
 * message to count, so it would otherwise be the free way past the ratchet.
 *
 *   npm run lint:warnings              check against the baseline (CI)
 *   npm run lint:warnings -- --update  lower the baseline to today's counts;
 *                                      it never raises an entry
 *
 * The tally lives in scripts/lib/eslint-warnings.mjs at the repository root;
 * ESLint comes from this workspace, so the server lints with the major its
 * config was written for.
 */
import { ESLint } from 'eslint';
import { fileURLToPath } from 'node:url';
import { check, lintWith } from '../../scripts/lib/eslint-warnings.mjs';
import { runCli } from '../../scripts/lib/ratchet.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
await runCli('lint:warnings', (args) => check({ root, update: args.includes('--update'), lint: lintWith(ESLint) }));
