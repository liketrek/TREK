#!/usr/bin/env node
/*
 * lint:format: new code is formatted with Prettier.
 *
 * Client code was never Prettier-checked, and almost every file differs from
 * what .prettierrc asks for. Formatting all of it at once would bury the
 * history under one commit, so the files that were unformatted when this
 * check came in are listed in scripts/format-baseline.json and the list only
 * shrinks: every file outside it, a new one in particular, must be formatted,
 * and a listed file leaves the list once it has been formatted. The check
 * covers .ts, .tsx, .mjs and .css under src/, tests/, e2e/ and scripts/.
 *
 *   npm run lint:format              check against the baseline (CI)
 *   npm run lint:format -- --list    print every unformatted file
 *   npm run lint:format -- --update  take formatted and deleted files off the list;
 *                                    it never adds one
 *
 * To format a file: npx prettier --write <file>. The comparison lives in
 * scripts/lib/format.mjs.
 */
import { fileURLToPath } from 'node:url';
import { check } from './lib/format.mjs';
import { runCli } from './lib/ratchet.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
await runCli('lint:format', (args) =>
  check({ root, update: args.includes('--update'), list: args.includes('--list') })
);
