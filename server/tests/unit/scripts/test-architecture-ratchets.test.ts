/**
 * scripts/test-mocks-ratchet.mjs (lint:test-mocks) and
 * scripts/test-new-service-ratchet.mjs (lint:test-new-service) on the shared
 * rules in scripts/lib/count-ratchet.mjs: the counters, the real scripts
 * against throwaway server roots (--dir), and once on this repository, so the
 * committed baselines are checked by the unit suite as well.
 */
import { countHeldMocks } from '../../../scripts/test-mocks-ratchet.mjs';
import { countNewServices, parseClasses, zeroArgClasses } from '../../../scripts/test-new-service-ratchet.mjs';

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPTS = path.join(__dirname, '../../../scripts');
const SERVER_ROOT = path.join(__dirname, '../../..');

// Spelled in pieces so this file does not count against the checks it tests.
const MOCK = ['vi', '.mock('].join('');
const DO_MOCK = ['vi', '.doMock('].join('');
const NEW = ['ne', 'w '].join('');

const roots: string[] = [];

function serverRoot(files: Record<string, string>, baselineName: string, baseline: unknown = { counts: {} }): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'trek-test-ratchet-'));
  roots.push(dir);
  for (const sub of ['src', 'tests', 'scripts']) mkdirSync(path.join(dir, sub), { recursive: true });
  for (const [file, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), text);
  }
  if (baseline !== null) writeFileSync(path.join(dir, 'scripts', baselineName), JSON.stringify(baseline));
  return dir;
}

function run(script: string, dir: string | null, ...args: string[]): { status: number | null; out: string } {
  const dirArgs = dir ? [`--dir=${dir}`] : [];
  try {
    const stdout = execFileSync(process.execPath, [path.join(SCRIPTS, script), ...dirArgs, ...args], {
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

describe('lint:test-mocks', () => {
  it('TEST-RATCHET-001: counts mocks of the config, realtime and db modules in any spelling', () => {
    const text = [
      `${MOCK}'../../src/config', () => ({}));`,
      `${MOCK}"../../../src/websocket", () => ({}));`,
      `${MOCK}'../../src/db/database', async () => ({}));`,
      `${DO_MOCK}'../../src/db/orm.ts', () => ({}));`,
      `${MOCK}'../../../src/nest/realtime/ws-state', () => ({}));`,
    ].join('\n');
    expect(countHeldMocks(text)).toBe(5);
  });

  it('TEST-RATCHET-002: leaves other module mocks alone, including look-alike paths', () => {
    const text = [
      `${MOCK}'../../src/nest/audit/audit-log.logger', () => ({}));`,
      `${MOCK}'../../src/app-config', () => ({}));`,
      `${MOCK}'../../src/configuration', () => ({}));`,
      `${MOCK}'nodemailer', () => ({}));`,
      `${MOCK}'../../src/utils/db-helpers', () => ({}));`,
    ].join('\n');
    expect(countHeldMocks(text)).toBe(0);
  });

  it('TEST-RATCHET-005: counts the import() form of a mock, and not a mock quoted in a comment', () => {
    const text = [
      `${MOCK}import('../../src/config'), () => ({}));`,
      `${DO_MOCK}import("../../src/db/database"), async () => ({}));`,
      '/**',
      ` * ${MOCK}'../../src/db/database', async () =>`,
      ' */',
      `// ${MOCK}'../../src/config', () => ({}));`,
      `const path = "// not a comment"; ${MOCK}'../../src/nest/realtime/realtime.service', () => ({}));`,
    ].join('\n');
    expect(countHeldMocks(text)).toBe(3);
  });

  it('TEST-RATCHET-003: fails a new mock, passes at the baseline and fails a stale entry until --update', () => {
    const mock = `${MOCK}'../../src/config', () => ({}));\n`;
    const grown = run(
      'test-mocks-ratchet.mjs',
      serverRoot({ 'tests/unit/a.test.ts': mock }, 'test-mocks-baseline.json'),
    );
    expect(grown.status).toBe(1);
    expect(grown.out).toContain('FAIL  tests/unit/a.test.ts: 1 module mock(s) of config, realtime or db');

    const held = { counts: { 'tests/unit/a.test.ts': 1 } };
    expect(
      run('test-mocks-ratchet.mjs', serverRoot({ 'tests/unit/a.test.ts': mock }, 'test-mocks-baseline.json', held))
        .status,
    ).toBe(0);

    const dir = serverRoot({ 'tests/unit/a.test.ts': 'nothing mocked here\n' }, 'test-mocks-baseline.json', held);
    const stale = run('test-mocks-ratchet.mjs', dir);
    expect(stale.status).toBe(1);
    expect(stale.out).toContain('npm run lint:test-mocks -- --update');
    expect(run('test-mocks-ratchet.mjs', dir, '--update').status).toBe(0);
    expect(JSON.parse(readFileSync(path.join(dir, 'scripts/test-mocks-baseline.json'), 'utf8'))).toEqual({
      counts: {},
    });
  });

  it('TEST-RATCHET-004: the committed baseline holds this repository', () => {
    const { status, out } = run('test-mocks-ratchet.mjs', null);
    expect(out).toContain('held at their baseline');
    expect(status).toBe(0);
  });
});

describe('lint:test-new-service', () => {
  it('TEST-RATCHET-010: reads each class, its parent and whether its constructor takes parameters', () => {
    const text = [
      'export class A { constructor(private readonly b: B) {} }',
      'class C extends A {}',
      'export class D { constructor(/* nothing */) {} }',
      'export class E { run() { return 1; } }',
      'export class F<T> extends E { constructor() { super(); } }',
    ].join('\n');
    expect(parseClasses(text)).toEqual([
      { name: 'A', parent: null, ctorHasParams: true },
      { name: 'C', parent: 'A', ctorHasParams: null },
      { name: 'D', parent: null, ctorHasParams: false },
      { name: 'E', parent: null, ctorHasParams: null },
      { name: 'F', parent: 'E', ctorHasParams: false },
    ]);
  });

  it('TEST-RATCHET-011: a class needs no wiring when nothing down its extends chain takes parameters', () => {
    const allowed = zeroArgClasses([
      { name: 'PlainService', parent: null, ctorHasParams: null },
      { name: 'WiredService', parent: null, ctorHasParams: true },
      { name: 'EmptyCtorService', parent: 'WiredService', ctorHasParams: false },
      { name: 'InheritsWiringService', parent: 'WiredService', ctorHasParams: null },
      { name: 'InheritsPlainService', parent: 'PlainService', ctorHasParams: null },
      { name: 'LibraryRepository', parent: 'EntityRepository', ctorHasParams: null },
    ]);
    expect([...allowed].sort()).toEqual(['EmptyCtorService', 'InheritsPlainService', 'PlainService']);
  });

  it('TEST-RATCHET-012: counts hand-built services and repositories, not allowed or other classes', () => {
    const text = [
      `const a = ${NEW}TodoService(permissions, realtime);`,
      `const b = ${NEW}TripsRepository(em);`,
      `const c = ${NEW}Map<string, number>();`,
      `const d = ${NEW}RealtimeService();`,
      `const e = ${NEW}Store<number>(1);`,
      `const f = ${NEW}CacheService<string>(store);`,
    ].join('\n');
    expect(countNewServices(text, new Set(['RealtimeService']))).toBe(3);
  });

  it('TEST-RATCHET-016: an import alias and a parenthesised class count as the service they name, a comment does not', () => {
    const text = [
      "import { DaysService as Days, TodoService } from '../../src/nest/days/days.service';",
      "import { RealtimeService as Rt } from '../../src/nest/realtime/realtime.service';",
      `const a = ${NEW}Days(repo, uow);`,
      `const b = ${['ne', 'w'].join('')}(TodoService)(permissions);`,
      `const c = ${NEW}Rt();`,
      `// const d = ${NEW}DaysService(repo, uow);`,
      `const e = ${NEW}Map<string, Days>();`,
    ].join('\n');
    expect(countNewServices(text, new Set(['RealtimeService']))).toBe(2);
  });

  it('TEST-RATCHET-013: derives the allowlist from src/ and tests/helpers/ when it runs', () => {
    const files = {
      'src/plain.service.ts': 'export class PlainService { ping() {} }',
      'src/wired.service.ts': 'export class WiredService { constructor(private readonly p: PlainService) {} }',
      'tests/helpers/fake.ts':
        'export class FakeWiredService extends WiredService { constructor() { super(null as never); } }',
      'tests/unit/a.test.ts': [
        `${NEW}PlainService();`,
        `${NEW}FakeWiredService();`,
        `${NEW}WiredService(${NEW}PlainService());`,
      ].join('\n'),
    };
    const fails = run('test-new-service-ratchet.mjs', serverRoot(files, 'test-new-service-baseline.json'));
    expect(fails.status).toBe(1);
    expect(fails.out).toContain('FAIL  tests/unit/a.test.ts: 1 hand-built service(s) or repository(ies)');

    const held = { counts: { 'tests/unit/a.test.ts': 1 } };
    expect(run('test-new-service-ratchet.mjs', serverRoot(files, 'test-new-service-baseline.json', held)).status).toBe(
      0,
    );
  });

  it('TEST-RATCHET-014: fails closed on a missing baseline', () => {
    const { status, out } = run('test-new-service-ratchet.mjs', serverRoot({ 'tests/a.test.ts': '' }, 'x.json', null));
    expect(status).toBe(1);
    expect(out).toContain('test-new-service-baseline.json cannot be read');
  });

  it('TEST-RATCHET-015: the committed baseline holds this repository', () => {
    const { status, out } = run('test-new-service-ratchet.mjs', null);
    expect(out).toContain('held at their baseline');
    expect(status).toBe(0);
  });
});

describe('the repository root the scripts default to', () => {
  it('TEST-RATCHET-020: is this server workspace', () => {
    expect(readFileSync(path.join(SERVER_ROOT, 'package.json'), 'utf8')).toContain('"lint:test-mocks"');
  });
});
