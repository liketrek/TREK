/**
 * scripts/test-sql-ratchet.mjs is the CI gate that keeps raw better-sqlite3
 * statements in the server tests from growing back while the suite moves onto
 * the ORM factories (tests/helpers/factories). A gate nobody tests passes
 * forever once it breaks, so this runs the real script as a child process
 * against throwaway server roots (--dir), proves it fails on growth and on
 * stale entries, honours the exemption list and the allow marker, and refuses
 * a broken setup instead of passing silently. The last case runs it on this
 * repository, so the committed baseline is checked by the unit suite too.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPT = path.join(__dirname, '../../../scripts/test-sql-ratchet.mjs');
const SERVER_ROOT = path.join(__dirname, '../../..');

interface ExecError {
  status: number | null;
  stdout: string;
  stderr: string;
}

interface Baseline {
  exempt: Record<string, string>;
  counts: Record<string, number>;
}

// Spelled in pieces so this file holds no raw call of its own for the ratchet to count.
const CALL = ['.', 'prepare('].join('');
const stmt = (n: number) => `db${CALL}'SELECT 1').get();\n`.repeat(n);

const roots: string[] = [];

function serverRoot(files: Record<string, string>, baseline: unknown = { exempt: {}, counts: {} }): string {
  // null writes no baseline file at all.
  const dir = mkdtempSync(path.join(tmpdir(), 'trek-test-sql-'));
  roots.push(dir);
  mkdirSync(path.join(dir, 'tests'), { recursive: true });
  mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  for (const [file, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), text);
  }
  if (baseline !== null) {
    writeFileSync(
      path.join(dir, 'scripts/test-sql-baseline.json'),
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
    const { status, stdout, stderr } = err as ExecError;
    return { status, out: `${stdout}${stderr}` };
  }
}

function readBaseline(dir: string): Baseline {
  return JSON.parse(readFileSync(path.join(dir, 'scripts/test-sql-baseline.json'), 'utf8')) as Baseline;
}

afterEach(() => {
  for (const dir of roots.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('test-sql-ratchet.mjs', () => {
  it('TSQL-001: passes when no test file holds a raw statement', () => {
    const dir = serverRoot({ 'tests/a.test.ts': 'await makeUser(orm);\n' });
    const { status, out } = run(dir);
    expect(status).toBe(0);
    expect(out).toContain('test-sql: 0 raw statement(s) in 0 baselined file(s), 0 file(s) exempt');
  });

  it('TSQL-002: fails a file without a baseline entry that holds one', () => {
    const { status, out } = run(serverRoot({ 'tests/unit/new.test.ts': stmt(1) }));
    expect(status).toBe(1);
    expect(out).toContain(
      'FAIL  tests/unit/new.test.ts: 1 raw statement(s), a file without a baseline entry may hold none.',
    );
  });

  it('TSQL-003: fails a baselined file that grows past its entry, passes at it', () => {
    const baseline = { exempt: {}, counts: { 'tests/a.test.ts': 2 } };
    const grown = run(serverRoot({ 'tests/a.test.ts': stmt(3) }, baseline));
    expect(grown.status).toBe(1);
    expect(grown.out).toContain('FAIL  tests/a.test.ts: 3 raw statement(s), its baseline is 2.');
    expect(run(serverRoot({ 'tests/a.test.ts': stmt(2) }, baseline)).status).toBe(0);
  });

  it('TSQL-004: counts every call on a line, in helpers too, and walks .ts and .mjs alike', () => {
    const dir = serverRoot({
      'tests/helpers/seed.ts': `db${CALL}'a').run(); db${CALL}'b').run();\n`,
      'tests/tools/x.mjs': stmt(1),
      'tests/notes.md': stmt(5),
    });
    const { status, out } = run(dir);
    expect(status).toBe(1);
    expect(out).toContain('tests/helpers/seed.ts: 2 raw');
    expect(out).toContain('tests/tools/x.mjs: 1 raw');
    expect(out).not.toContain('notes.md');
  });

  it('TSQL-005: an allow marker with a reason on the line or the line above takes the statement out of the count', () => {
    const text =
      `// test-sql-allow: PRAGMA introspection has no ORM equivalent\n${stmt(1)}` +
      `db${CALL}'PRAGMA table_info(x)').all(); // test-sql-allow: same reason\n`;
    expect(run(serverRoot({ 'tests/a.test.ts': text })).status).toBe(0);
  });

  it('TSQL-005b: a marker covers the first call of a statement Prettier broke up', () => {
    const marker = '// test-sql-allow: the raw statement is the legacy oracle\n';
    const chained = `${marker}const legacy = testDb\n  ${CALL}'SELECT 1')\n  .all();\n`;
    const wrapped = `${marker}const n = (\n  testDb${CALL}'SELECT 1').get() as { n: number }\n).n;\n`;
    const loop = `${marker}for (const id of ids)\n  testDb${CALL}'DELETE FROM x WHERE id = ?').run(id);\n`;
    expect(run(serverRoot({ 'tests/a.test.ts': chained + wrapped + loop })).status).toBe(0);
  });

  it('TSQL-005c: the cover ends with the statement, after the first call, and REACH lines down', () => {
    const marker = '// test-sql-allow: reason\n';
    // The statement below the marker ends on its first line; the next one is not covered.
    const ended = run(
      serverRoot({ 'tests/a.test.ts': `${marker}const a = 1;\nconst b = testDb\n  ${CALL}'x').get();\n` }),
    );
    expect(ended.out).toContain('tests/a.test.ts: 1 raw statement(s)');
    // Only the first call of the statement is covered.
    const two = `${marker}const rows = [\n  testDb${CALL}'a').get(),\n  testDb${CALL}'b').get(),\n];\n`;
    expect(run(serverRoot({ 'tests/b.test.ts': two })).out).toContain('tests/b.test.ts: 1 raw statement(s)');
    // A call more than REACH (8) lines below the marker is not covered.
    const far = `${marker}const x = f(\n${'  1,\n'.repeat(8)}  testDb${CALL}'c').get(),\n);\n`;
    expect(run(serverRoot({ 'tests/c.test.ts': far })).out).toContain('tests/c.test.ts: 1 raw statement(s)');
  });

  it('TSQL-006: a marker without a reason, or two lines up, does not count', () => {
    const bare = run(serverRoot({ 'tests/a.test.ts': `// test-sql-allow:\n${stmt(1)}` }));
    expect(bare.status).toBe(1);
    const far = run(serverRoot({ 'tests/b.test.ts': `// test-sql-allow: reason\n\n${stmt(1)}` }));
    expect(far.status).toBe(1);
  });

  it('TSQL-007: an exempt file is not counted, and an exemption for a gone file fails', () => {
    const exempt = { 'tests/unit/db/dialect.test.ts': 'pins the SQL each dialect function renders' };
    const ok = run(serverRoot({ 'tests/unit/db/dialect.test.ts': stmt(40) }, { exempt, counts: {} }));
    expect(ok.status).toBe(0);
    expect(ok.out).toContain('1 file(s) exempt');

    const gone = run(serverRoot({ 'tests/a.test.ts': '' }, { exempt, counts: {} }));
    expect(gone.status).toBe(1);
    expect(gone.out).toContain(
      'FAIL  tests/unit/db/dialect.test.ts is exempt in scripts/test-sql-baseline.json, but the file is gone',
    );
  });

  it('TSQL-008: fails an entry above its file, or for a file with none left, until --update lowers it', () => {
    const shrunk = run(serverRoot({ 'tests/a.test.ts': stmt(1) }, { exempt: {}, counts: { 'tests/a.test.ts': 3 } }));
    expect(shrunk.status).toBe(1);
    expect(shrunk.out).toContain(
      'FAIL  tests/a.test.ts is held at 3 in scripts/test-sql-baseline.json, but it has 1 now.',
    );
    expect(shrunk.out).toContain('npm run lint:test-sql -- --update');

    const converted = run(serverRoot({ 'tests/a.test.ts': '' }, { exempt: {}, counts: { 'tests/a.test.ts': 3 } }));
    expect(converted.status).toBe(1);
    expect(converted.out).toContain('but it has none left (or the file is gone)');
  });

  it('TSQL-009: --update only lowers and drops counts, never adds one, never touches the exemptions', () => {
    const exempt = { 'tests/raw.test.ts': 'raw by nature' };
    const dir = serverRoot(
      {
        'tests/shrunk.test.ts': stmt(2),
        'tests/converted.test.ts': '',
        'tests/grown.test.ts': stmt(9),
        'tests/new.test.ts': stmt(1),
        'tests/raw.test.ts': stmt(4),
      },
      {
        exempt,
        counts: {
          'tests/shrunk.test.ts': 5,
          'tests/converted.test.ts': 2,
          'tests/grown.test.ts': 6,
          'tests/gone.test.ts': 1,
        },
      },
    );
    const { status } = run(dir, '--update');
    expect(readBaseline(dir)).toEqual({
      exempt,
      counts: { 'tests/grown.test.ts': 6, 'tests/shrunk.test.ts': 2 },
    });
    // The grown file and the new one still fail after the update.
    expect(status).toBe(1);
  });

  it('TSQL-010: fails closed on a missing, unparsable or malformed baseline', () => {
    const missing = serverRoot({ 'tests/a.test.ts': '' }, null);
    expect(run(missing).status).toBe(1);
    expect(run(missing).out).toContain('test-sql-baseline.json cannot be read');

    expect(run(serverRoot({}, '{ not json')).status).toBe(1);
    expect(run(serverRoot({}, '[]')).status).toBe(1);
    expect(run(serverRoot({}, { counts: {} })).status).toBe(1);
    // A count that is not a whole number above zero, an exemption without a
    // reason, or a file both exempt and counted is a hand edit gone wrong.
    expect(run(serverRoot({}, { exempt: {}, counts: { 'tests/a.test.ts': 0 } })).status).toBe(1);
    expect(run(serverRoot({}, { exempt: {}, counts: { 'tests/a.test.ts': '2' } })).status).toBe(1);
    expect(run(serverRoot({}, { exempt: { 'tests/a.test.ts': ' ' }, counts: {} })).out).toContain('needs a reason');
    expect(
      run(serverRoot({}, { exempt: { 'tests/a.test.ts': 'why' }, counts: { 'tests/a.test.ts': 1 } })).out,
    ).toContain('both exempt and counted');
  });

  it('TSQL-011: fails closed when tests/ is missing', () => {
    const dir = serverRoot({});
    rmSync(path.join(dir, 'tests'), { recursive: true });
    const { status, out } = run(dir);
    expect(status).toBe(1);
    expect(out).toContain('tests/ does not exist');
  });

  it('TSQL-012: the committed tree matches the committed baseline', () => {
    const { status, out } = run(SERVER_ROOT);
    expect(out).not.toContain('FAIL');
    expect(status).toBe(0);
  });
});
