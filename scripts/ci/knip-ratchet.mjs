#!/usr/bin/env node
/*
 * lint:knip: unused files, exports, types and dependencies may only go down.
 *
 * knip (configured in knip.jsonc at the repo root) follows the imports of the
 * client, server and shared workspaces from their entry points and reports
 * what nothing reaches: a file, an export, a type, a dependency in a
 * package.json, an import of a package no package.json lists. Dead code
 * costs every sweep that edits it and every reader who wonders who calls it.
 * The findings per category and file are held in scripts/ci/knip-baseline.json:
 * a file may not gain one, and an entry above what knip finds now, or for a
 * file that is gone, fails until --update lowers it. A false positive (a
 * file loaded by path, a public API surface) is fixed in knip.jsonc, with the
 * reason, never by raising the baseline.
 *
 *   npm run lint:knip              check against the baseline (CI)
 *   npm run lint:knip -- --update  lower the baseline to today's findings;
 *                                  it never raises an entry
 *
 * The comparison lives in scripts/ci/lib/knip.mjs.
 */
import { fileURLToPath } from 'node:url';
import { runCli } from '../../client/scripts/lib/ratchet.mjs';
import { check } from './lib/knip.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));
await runCli('lint:knip', (args) => check({ root, update: args.includes('--update') }));
