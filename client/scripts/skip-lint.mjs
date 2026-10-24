#!/usr/bin/env node
/*
 * lint:skips: no test is focused, and skipped tests may only go away.
 *
 * A stray .only passes CI while the rest of its file never runs, so it fails
 * this check wherever it appears. A skipped or todo test is coverage that was
 * switched off and then forgotten (JourneyDetailPage.test.tsx has carried 35
 * skipped blocks since April); the files that hold some are listed in
 * scripts/skip-baseline.json with their count, and a file may hold no more.
 * An entry above what its file holds now, or for a file that is gone, fails
 * as well until --update lowers it.
 * Playwright's test.fixme counts as a skip. Only a skip that decides at run
 * time is left out: skipIf and runIf, and in a Playwright spec
 * test.skip(condition, 'why'), unless the condition is a literal that always
 * skips (skipIf(true), runIf(false), test.skip(true, 'why')).
 * Covers the vitest tests under src/ and tests/ and the Playwright specs
 * under e2e/.
 *
 *   npm run lint:skips              check against the baseline (CI)
 *   npm run lint:skips -- --update  lower the baseline to what the files hold now;
 *                                   it never raises an entry
 */
import { fileURLToPath } from 'node:url';
import { runCli } from './lib/ratchet.mjs';
import { check } from './lib/skips.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
await runCli('lint:skips', (args) => check({ root, update: args.includes('--update') }));
