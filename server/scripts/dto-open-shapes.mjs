#!/usr/bin/env node
/*
 * contracts:dto-open: runs tests/unit/contracts/dto-open-shapes.test.ts, the
 * ratchet over the open shapes in every createZodDto class under src/.
 *
 * The check has to import the TypeScript DTO files, so it lives in that test
 * and runs with the unit tests in CI; this wrapper only gives it a command and
 * the lowering mode:
 *
 *   npm run contracts:dto-open              check against scripts/dto-open-shapes-baseline.json
 *   npm run contracts:dto-open -- --update  lower the baseline to today's counts; it never
 *                                           raises or adds an entry
 *
 * The shared package must be built first (the DTOs import @trek/shared).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SERVER_ROOT = fileURLToPath(new URL('..', import.meta.url));
const TEST = 'tests/unit/contracts/dto-open-shapes.test.ts';

function main(argv) {
  const unknown = argv.filter((arg) => arg !== '--update');
  if (unknown.length) throw new Error(`unknown argument(s): ${unknown.join(' ')}`);
  if (!existsSync(join(SERVER_ROOT, TEST))) throw new Error(`${TEST} is missing`);
  const vitest = join(dirname(createRequire(import.meta.url).resolve('vitest/package.json')), 'vitest.mjs');
  const env = { ...process.env, DTO_OPEN_SHAPES_UPDATE: argv.includes('--update') ? '1' : '0' };
  const result = spawnSync(process.execPath, [vitest, 'run', TEST], { cwd: SERVER_ROOT, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

// Compared by real path, so the check still runs when the script is started through a symlink.
const isCli =
  Boolean(process.argv[1]) &&
  existsSync(process.argv[1]) &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (err) {
    console.error(`FAIL  ${err.message}`);
    process.exitCode = 1;
  }
}
