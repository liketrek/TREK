/**
 * scripts/mcp-inline-zod.mjs (lint:mcp-zod) and scripts/service-http-ratchet.mjs
 * (lint:service-http) on their shared rules in scripts/lib/count-ratchet.mjs.
 * Both run as the real scripts against throwaway server roots (--dir) and once
 * on this repository, so the committed baselines are checked by the unit suite.
 */
import { countInlineZod } from '../../../scripts/mcp-inline-zod.mjs';
import { countFile, countResultBranches, countServiceIdioms } from '../../../scripts/service-http-ratchet.mjs';

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPTS = path.join(__dirname, '../../../scripts');
const SERVER_ROOT = path.join(__dirname, '../../..');
const NEST = 'src/nest';

const roots: string[] = [];

function serverRoot(files: Record<string, string>, baselineName: string, baseline: unknown = { counts: {} }): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'trek-envelope-'));
  roots.push(dir);
  mkdirSync(path.join(dir, NEST), { recursive: true });
  mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  for (const [file, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), text);
  }
  if (baseline !== null) {
    writeFileSync(
      path.join(dir, 'scripts', baselineName),
      typeof baseline === 'string' ? baseline : JSON.stringify(baseline),
    );
  }
  return dir;
}

function run(script: string, dir: string, ...args: string[]): { status: number | null; out: string } {
  try {
    const stdout = execFileSync(process.execPath, [path.join(SCRIPTS, script), `--dir=${dir}`, ...args], {
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

// Spelled in pieces so the files read as what they are, fixtures.
const Z = ['z', '.'].join('');
const zodField = (n: number) => `  name: ${Z}string(),\n`.repeat(n);
const STATUS = ['status', ': 404'].join('');
const HTTP = ['new Http', 'Exception('].join('');

describe('the counters', () => {
  it('ENV-RATCHET-001: counts every z. call, and nothing that only ends in z', () => {
    expect(countInlineZod(`${Z}object({ a: ${Z}string(), b: idSchema, c: fizz.x })`)).toBe(2);
  });

  it('ENV-RATCHET-002: counts the result envelope and HTTP in a service, not a 2xx status', () => {
    expect(
      countServiceIdioms(`return { error: 'x', ${STATUS} };\nthrow ${HTTP}{}, 400);\nreturn { status: 200 };`),
    ).toBe(2);
    expect(countServiceIdioms(`return { error: 'x', status: 503 };`)).toBe(1);
  });

  it('ENV-RATCHET-003: counts the branches on a returned error, in each spelling', () => {
    const text = [
      'if (result.error) {',
      "if ('error' in outcome) throw x;",
      'if (res.error) return errorResult(res.error);',
      'if (this.state.last.error) {',
      'if (!parsed.success) {',
      'if (error) {',
    ].join('\n');
    expect(countResultBranches(text)).toBe(4);
  });

  it('ENV-RATCHET-004: counts a comparison, a negation, an optional chain and a ternary on a returned error', () => {
    const text = [
      "if (result.error === 'not_found') {",
      'if (!r.error) return ok(r);',
      'if (res?.error && res.status) {',
      'return outcome.error ? fail() : pass();',
      "const notFound = r.error !== 'gone';",
      'logger.error(r);',
      'const e = res.error;',
      'if (r.errors) {',
    ].join('\n');
    expect(countResultBranches(text)).toBe(5);
  });

  it('ENV-RATCHET-005: counts the envelope in any domain file, not in the HTTP layer or the DomainError itself', () => {
    const envelope = `return { error: 'x', ${STATUS} };`;
    for (const file of ['a.helpers.ts', 'a.impl.ts', 'providers/x.provider.ts', 'a.service.ts']) {
      expect(countFile(envelope, `src/nest/a/${file}`)).toBe(1);
    }
    for (const file of ['a.controller.ts', 'a.guard.ts', 'a.pipe.ts', 'a.filter.ts', 'a.interceptor.ts', 'a.dto.ts']) {
      expect(countFile(envelope, `src/nest/a/${file}`)).toBe(0);
    }
    expect(countFile(envelope, 'src/nest/common/domain-error.ts')).toBe(0);
    expect(countFile('if (r.error) {', 'src/nest/a/a.rpc.ts')).toBe(1);
    expect(countFile('if (r.error) {', 'src/nest/a/a.helpers.ts')).toBe(0);
  });
});

describe('mcp-inline-zod.mjs', () => {
  const BASE = 'mcp-inline-zod-baseline.json';

  it('ENV-RATCHET-010: passes a tree whose tools derive every field', () => {
    const { status, out } = run(
      'mcp-inline-zod.mjs',
      serverRoot({ [`${NEST}/a/a.mcp.ts`]: 'tripId: idSchema,\n' }, BASE),
    );
    expect(status).toBe(0);
    expect(out).toContain('mcp-zod: 0 inline z. call(s) in 0 file(s)');
  });

  it('ENV-RATCHET-011: fails a new tool file spelling a field inline, and leaves other files alone', () => {
    const dir = serverRoot({ [`${NEST}/a/a.mcp.ts`]: zodField(1), [`${NEST}/a/a.service.ts`]: zodField(5) }, BASE);
    const { status, out } = run('mcp-inline-zod.mjs', dir);
    expect(status).toBe(1);
    expect(out).toContain(
      `FAIL  ${NEST}/a/a.mcp.ts: 1 inline z. call(s), a file without a baseline entry may hold none.`,
    );
    expect(out).not.toContain('a.service.ts');
  });

  it('ENV-RATCHET-012: holds a file to its entry, and --update only lowers', () => {
    const file = `${NEST}/a/a.mcp.ts`;
    expect(
      run('mcp-inline-zod.mjs', serverRoot({ [file]: zodField(3) }, BASE, { counts: { [file]: 2 } })).out,
    ).toContain('its baseline is 2.');
    const dir = serverRoot({ [file]: zodField(1) }, BASE, { counts: { [file]: 3, [`${NEST}/gone.mcp.ts`]: 1 } });
    const stale = run('mcp-inline-zod.mjs', dir);
    expect(stale.status).toBe(1);
    expect(stale.out).toContain(`FAIL  ${file} is held at 3`);
    expect(stale.out).toContain('npm run lint:mcp-zod -- --update');
    run('mcp-inline-zod.mjs', dir, '--update');
    expect(JSON.parse(readFileSync(path.join(dir, 'scripts', BASE), 'utf8'))).toEqual({ counts: { [file]: 1 } });
    expect(run('mcp-inline-zod.mjs', dir).status).toBe(0);
  });

  it('ENV-RATCHET-013: a missing or malformed baseline, or no src/nest, stops the run', () => {
    expect(run('mcp-inline-zod.mjs', serverRoot({}, BASE, null)).out).toContain('cannot be read');
    expect(run('mcp-inline-zod.mjs', serverRoot({}, BASE, '{"counts":{"x":0}}')).out).toContain(
      'expected a whole number above 0',
    );
    expect(run('mcp-inline-zod.mjs', serverRoot({}, BASE, '[]')).out).toContain(
      'must be an object with a "counts" object',
    );
    const empty = mkdtempSync(path.join(tmpdir(), 'trek-envelope-'));
    roots.push(empty);
    expect(run('mcp-inline-zod.mjs', empty).out).toContain('does not exist');
  });

  it('ENV-RATCHET-014: this repository holds its committed baseline', () => {
    const { status, out } = run('mcp-inline-zod.mjs', SERVER_ROOT);
    expect(out).toContain('mcp-zod:');
    expect(status).toBe(0);
  });
});

describe('service-http-ratchet.mjs', () => {
  const BASE = 'service-http-baseline.json';

  it('ENV-RATCHET-020: counts domain files, controllers, tools and RPC handlers, not the HTTP layer', () => {
    const dir = serverRoot(
      {
        [`${NEST}/a/a.service.ts`]: `return { error: 'x', ${STATUS} };\n`,
        [`${NEST}/a/a.controller.ts`]: 'if (result.error) {\n',
        [`${NEST}/a/a.mcp.ts`]: "if ('error' in r) return x;\n",
        [`${NEST}/a/a.rpc.ts`]: "if (r.error === 'nope') throw x;\n",
        [`${NEST}/a/a.helpers.ts`]: `return { error: 'x', ${STATUS} };\n`,
        [`${NEST}/a/a.guard.ts`]: `throw ${HTTP}'no', 403);\n`,
      },
      BASE,
    );
    const { status, out } = run('service-http-ratchet.mjs', dir);
    expect(status).toBe(1);
    expect(out).not.toContain('a.guard.ts');
    for (const file of ['a.service.ts', 'a.controller.ts', 'a.mcp.ts', 'a.rpc.ts', 'a.helpers.ts']) {
      expect(out).toContain(
        `FAIL  ${NEST}/a/${file}: 1 error-envelope idiom(s), a file without a baseline entry may hold none.`,
      );
    }
    expect(out).toContain('Throw a DomainError');
  });

  it('ENV-RATCHET-021: a service that throws DomainError passes', () => {
    const dir = serverRoot({ [`${NEST}/a/a.service.ts`]: "throw new DomainError(404, 'Trip not found');\n" }, BASE);
    expect(run('service-http-ratchet.mjs', dir).status).toBe(0);
  });

  it('ENV-RATCHET-022: this repository holds its committed baseline', () => {
    const { status, out } = run('service-http-ratchet.mjs', SERVER_ROOT);
    expect(out).toContain('service-http:');
    expect(status).toBe(0);
  });
});
