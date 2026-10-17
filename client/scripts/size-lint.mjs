#!/usr/bin/env node
/*
 * lint:size: keeps files from growing into the next god file.
 *
 * A file past a thousand lines holds several concerns that no longer fit in
 * one reading, and every change to one of them risks the others. Each source
 * file and stylesheet under src/ may hold 1000 lines, each test (under tests/,
 * a Playwright spec or fixture under e2e/, or a co-located *.test.*) 2000. Lines are counted as an editor wraps them
 * at 120 columns, so joining lines does not make a file smaller. The files
 * that were already larger are listed in scripts/size-baseline.json with the
 * size they had, and the check fails when one of them grows past its entry. A
 * file that needs to grow is split by concern instead (the trip planner hook,
 * page and road trip sidebar are the precedent). An entry above the file's
 * size now, or for a file that is gone, fails as well until --update lowers
 * it: otherwise the file could grow back unseen, and a new file at a deleted
 * path would inherit its allowance.
 *
 *   npm run lint:size              check against the baseline (CI)
 *   npm run lint:size -- --update  lower the baseline to what the files hold now;
 *                                  it never raises an entry, and drops a file
 *                                  that is back under its limit
 *
 * The measuring lives in scripts/lib/size.mjs.
 */
import { fileURLToPath } from 'node:url';
import { runCli } from './lib/ratchet.mjs';
import { check } from './lib/size.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
await runCli('lint:size', (args) => check({ root, update: args.includes('--update') }));
