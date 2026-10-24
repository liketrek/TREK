#!/usr/bin/env node
/*
 * lint:strict: the errors strict null checks would raise may only go down.
 *
 * The client compiles with strict: false, so a `.nullable()` field from
 * @trek/shared arrives as if it were always there and an untyped parameter is
 * an `any` nobody sees. Turning strict on at once would mean fixing hundreds
 * of files in one go. Instead tsconfig.strict.json is the same program with
 * strictNullChecks and noImplicitAny on, and this counts its errors per file
 * against scripts/strict-baseline.json: a file may not gain one, and a file
 * without an entry, which every new file is, has to be clean. An entry above
 * its count, or for a file that is gone, fails until --update lowers it, so a
 * file brought down stays down. When a whole directory reaches zero, it can
 * move into the main tsconfig's strict settings for good.
 *
 *   npm run lint:strict              check against the baseline (CI)
 *   npm run lint:strict -- --list    print every error, file by file
 *   npm run lint:strict -- --update  lower the baseline to today's counts;
 *                                    it never raises an entry
 *
 * The parsing and the comparison live in scripts/lib/strict.mjs.
 */
import { fileURLToPath } from 'node:url';
import { runCli } from './lib/ratchet.mjs';
import { check } from './lib/strict.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
await runCli('lint:strict', (args) =>
  check({ root, update: args.includes('--update'), list: args.includes('--list') })
);
