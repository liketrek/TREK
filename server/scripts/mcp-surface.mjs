#!/usr/bin/env node
/*
 * lint:mcp-surface: what `tools/list` costs a client may only shrink.
 *
 * Every conversation with an MCP client starts by paying for the tool list the
 * session advertises. This boots the container on the test database with every
 * addon on, lists the tools of four reference sessions (full access, the core
 * preset, read-only, trips only) and holds them to scripts/mcp-surface-baseline.json:
 * an existing tool may not grow, a new one may not pass 4 KB, and a session may
 * not list more bytes of existing tools than its entry. The rules are in
 * scripts/lib/mcp-surface-compare.mjs.
 *
 *   npm run lint:mcp-surface              check against the baseline (CI)
 *   npm run lint:mcp-surface -- --update  lower the entries, record new tools, drop gone ones
 *
 * It needs shared/ built, like the test suite.
 */
import { compareSurface, describeSessions, updatedBaseline } from './lib/mcp-surface-compare.mjs';

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = join(serverDir, 'scripts/mcp-surface-baseline.json');
const update = process.argv.includes('--update');

function measure() {
  const dir = mkdtempSync(join(tmpdir(), 'trek-mcp-surface-'));
  const out = join(dir, 'surface.json');
  try {
    const run = spawnSync(
      process.execPath,
      [
        join(dirname(createRequire(import.meta.url).resolve('vitest/package.json')), 'vitest.mjs'),
        'run',
        '--config',
        'vitest.surface.config.ts',
      ],
      { cwd: serverDir, env: { ...process.env, TREK_MCP_SURFACE_OUT: out }, encoding: 'utf8' },
    );
    if (run.status !== 0 || !existsSync(out)) {
      process.stderr.write(run.stdout + run.stderr);
      throw new Error('the tools/list measurement failed');
    }
    return JSON.parse(readFileSync(out, 'utf8'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const measured = measure();
console.log(describeSessions(measured).join('\n'));

const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : null;
if (update) {
  writeFileSync(baselinePath, JSON.stringify(updatedBaseline(measured, baseline ?? {}), null, 2) + '\n');
  console.log(`lint:mcp-surface: ${baselinePath} updated`);
  process.exit(0);
}
if (!baseline) {
  console.error('lint:mcp-surface: no baseline; run with --update once to record it');
  process.exit(1);
}
const { problems, stale } = compareSurface(measured, baseline);
for (const p of problems) console.error(`✗ ${p}`);
for (const s of stale) console.error(`↓ ${s}`);
if (problems.length) {
  console.error(
    'lint:mcp-surface: tools/list grew. Shorten the description, move a detailed schema into a help topic ' +
      '(see server/src/nest-mcp/README.md), or split the tool.',
  );
  process.exit(1);
}
if (stale.length) {
  console.error(
    'lint:mcp-surface: the surface shrank; run `npm run lint:mcp-surface -- --update` to lower the baseline.',
  );
  process.exit(1);
}
console.log('lint:mcp-surface: ok');
