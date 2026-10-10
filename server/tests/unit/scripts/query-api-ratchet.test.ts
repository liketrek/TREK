/**
 * scripts/query-api-ratchet.mjs holds the MikroORM QueryBuilder calls in the
 * repositories to their baseline (server/CLAUDE.md, "Which query API"). It
 * runs the real script against throwaway server roots (--dir) and once on this
 * repository, so the committed baseline is checked by the unit suite too.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPT = path.join(__dirname, '../../../scripts/query-api-ratchet.mjs');
const SERVER_ROOT = path.join(__dirname, '../../..');
const REPOS = 'src/db/repositories';

// Spelled in pieces so this file reads as what it is, a fixture.
const QB = ['this.', 'qb(', "'r')"].join('');
const calls = (n: number) => `await ${QB}.select('*').execute();\n`.repeat(n);

const roots: string[] = [];

function serverRoot(files: Record<string, string>, baseline: unknown = { counts: {} }): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'trek-query-api-'));
  roots.push(dir);
  mkdirSync(path.join(dir, REPOS), { recursive: true });
  mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  for (const [file, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), text);
  }
  if (baseline !== null) {
    writeFileSync(
      path.join(dir, 'scripts/query-api-baseline.json'),
      typeof baseline === 'string' ? baseline : JSON.stringify(baseline),
    );
  }
  return dir;
}

function run(dir: string, ...args: string[]): { status: number | null; out: string } {
  try {
    const stdout = execFileSync(process.execPath, [SCRIPT, `--dir=${dir}`, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { status: 0, out: stdout };
  } catch (err) {
    const { status, stdout, stderr } = err as { status: number | null; stdout: string; stderr: string };
    return { status, out: `${stdout}${stderr}` };
  }
}

afterEach(() => {
  for (const dir of roots.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('query-api-ratchet.mjs', () => {
  it('QAPI-001: passes when no repository builds through the QueryBuilder', () => {
    const { status, out } = run(serverRoot({ [`${REPOS}/A.repository.ts`]: 'await this.findOne({ id });\n' }));
    expect(status).toBe(0);
    expect(out).toContain('query-api: 0 QueryBuilder call(s) in 0 file(s)');
  });

  it('QAPI-002: fails a new file holding one, and counts createQueryBuilder too', () => {
    const { status, out } = run(
      serverRoot({ [`${REPOS}/New.repository.ts`]: `${calls(1)}em.createQueryBuilder(X);\n` }),
    );
    expect(status).toBe(1);
    expect(out).toContain(
      `FAIL  ${REPOS}/New.repository.ts: 2 QueryBuilder call(s), a file without a baseline entry may hold none.`,
    );
  });

  it('QAPI-003: holds a baselined file to its entry', () => {
    const baseline = { counts: { [`${REPOS}/A.repository.ts`]: 2 } };
    const grown = run(serverRoot({ [`${REPOS}/A.repository.ts`]: calls(3) }, baseline));
    expect(grown.status).toBe(1);
    expect(grown.out).toContain('its baseline is 2.');
    expect(run(serverRoot({ [`${REPOS}/A.repository.ts`]: calls(2) }, baseline)).status).toBe(0);
  });

  it('QAPI-004: the base class that defines qb is not counted', () => {
    expect(run(serverRoot({ [`${REPOS}/_shared/trek-repository.ts`]: 'return super.qb(alias);\n' })).status).toBe(0);
  });

  it('QAPI-005: an entry above its file fails until --update lowers it, and --update never raises or adds one', () => {
    const dir = serverRoot(
      { [`${REPOS}/A.repository.ts`]: calls(1), [`${REPOS}/B.repository.ts`]: calls(4) },
      {
        counts: {
          [`${REPOS}/A.repository.ts`]: 3,
          [`${REPOS}/Gone.repository.ts`]: 1,
          [`${REPOS}/B.repository.ts`]: 2,
        },
      },
    );
    const stale = run(dir);
    expect(stale.status).toBe(1);
    expect(stale.out).toContain(`FAIL  ${REPOS}/A.repository.ts is held at 3`);
    expect(stale.out).toContain(`FAIL  ${REPOS}/Gone.repository.ts is held at 1`);

    run(dir, '--update');
    const lowered = JSON.parse(readFileSync(path.join(dir, 'scripts/query-api-baseline.json'), 'utf8')) as {
      counts: Record<string, number>;
    };
    expect(lowered.counts).toEqual({ [`${REPOS}/A.repository.ts`]: 1, [`${REPOS}/B.repository.ts`]: 2 });
  });

  it('QAPI-006: a missing or malformed baseline, or no repositories folder, stops the run', () => {
    expect(run(serverRoot({}, null)).out).toContain('cannot be read');
    expect(run(serverRoot({}, '{"counts":{"x":0}}')).out).toContain('expected a whole number above 0');
    expect(run(serverRoot({}, '[]')).out).toContain('must be an object with a "counts" object');
    const empty = mkdtempSync(path.join(tmpdir(), 'trek-query-api-'));
    roots.push(empty);
    expect(run(empty).out).toContain('does not exist');
  });

  it('QAPI-007: this repository holds its committed baseline', () => {
    const { status, out } = run(SERVER_ROOT);
    expect(out).toContain('query-api:');
    expect(status).toBe(0);
  });
});
