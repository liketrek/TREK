/**
 * scripts/dialect-lint.mjs is the CI gate that holds SQLite-only SQL
 * (INSERT OR IGNORE, datetime(), strftime, json_extract, GLOB, PRAGMA,
 * AUTOINCREMENT, `||` concatenation, insertId) to its baseline. A gate nobody
 * tests passes forever once it breaks, so this runs the real script as a
 * child process against throwaway server roots (--dir): it must fail on each
 * spelling, leave comments and the dialect layer alone, and refuse to run on
 * a broken setup instead of passing silently.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPT = path.join(__dirname, '../../../scripts/dialect-lint.mjs');

interface ExecError {
  status: number | null;
  stdout: string;
  stderr: string;
}

const roots: string[] = [];

function serverRoot(files: Record<string, string>, baseline: unknown = {}): string {
  // null writes no baseline file at all.
  const dir = mkdtempSync(path.join(tmpdir(), 'trek-dialect-lint-'));
  roots.push(dir);
  mkdirSync(path.join(dir, 'src'), { recursive: true });
  mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  for (const [file, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), text);
  }
  if (baseline !== null) {
    writeFileSync(
      path.join(dir, 'scripts/dialect-baseline.json'),
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

const REPO = 'src/db/repositories/Probe.repository.ts';

afterEach(() => {
  for (const dir of roots.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('dialect-lint.mjs', () => {
  it('DIALECT-001: passes a tree with no SQLite-only spelling', () => {
    const { status, out } = run(serverRoot({ [REPO]: "export const q = 'SELECT id FROM trips WHERE id = ?';\n" }));
    expect(status).toBe(0);
    expect(out).toContain('dialect: 0 file(s) hold 0 SQLite-only spelling(s)');
  });

  it.each([
    ['insert-or', "void 'INSERT OR IGNORE INTO t (a) VALUES (?)';"],
    ['insert-or', 'void `INSERT OR REPLACE INTO t (a) VALUES (?)`;'],
    ['datetime', 'void "UPDATE t SET at = datetime(\'now\')";'],
    ['datetime', "declare function fn(name: string, args: string[]): void;\nfn('julianday', ['now']);"],
    ['strftime', "void `SELECT strftime('%s', 'now')`;"],
    ['json', "void 'SELECT json_extract(settings, ?) FROM users';"],
    ['glob', "void 'SELECT id FROM t WHERE name GLOB ?';"],
    ['glob', "declare function where(c: string, op: string, v: string): void;\nwhere('name', 'glob', 'a*');"],
    ['last-insert-rowid', "void 'SELECT last_insert_rowid()';"],
    ['autoincrement', "void 'id INTEGER PRIMARY KEY AUTOINCREMENT';"],
    ['pragma', "void 'PRAGMA foreign_keys = OFF';"],
    ['concat', 'declare const sql: (s: TemplateStringsArray, ...v: unknown[]) => unknown;\nvoid sql`a || b`;'],
    ['concat', 'void "SELECT first || \' \' || last FROM users";'],
    ['insert-id', 'declare const r: { insertId: bigint };\nvoid Number(r.insertId);'],
    ['insert-id', 'declare const r: { insertId: bigint };\nconst { insertId } = r;\nvoid insertId;'],
  ])('DIALECT-002: fails a new %s hit and names the rule', (rule, code) => {
    const { status, out } = run(serverRoot({ [REPO]: `${code}\n` }));
    expect(status).toBe(1);
    expect(out).toContain(`FAIL  ${REPO}: 1 SQLite-only ${rule} hit(s), 0 allowed.`);
  });

  it('DIALECT-003: leaves comments, ordinary strings and the HTTP Pragma header alone', () => {
    const code = [
      "// INSERT OR IGNORE INTO t, datetime('now'), PRAGMA foreign_keys",
      '/** strftime and json_extract and GLOB and AUTOINCREMENT */',
      'declare const res: { set(k: string, v: string): void };',
      "res.set('Pragma', 'no-cache');",
      'export const fallback = (a: string | null, b: string) => a || b;',
      "export const label = 'one || two';",
      '',
    ].join('\n');
    expect(run(serverRoot({ 'src/nest/probe/probe.controller.ts': code })).status).toBe(0);
  });

  it('DIALECT-004: never scans the dialect layer or a migration that has shipped', () => {
    const dir = serverRoot({
      'src/db/dialect/sql-functions.ts': "export const now = `datetime('now')`;\nexport const s = 'strftime';\n",
      'src/db/dialect/kysely-functions.ts': "export const g = 'glob';\nexport const s = 'strftime';\n",
      'src/db/migrations/Migration20200101000000_baseline_schema.ts':
        "export const t = 'CREATE TABLE t (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT DEFAULT (datetime(\\'now\\')))';\n",
    });
    expect(run(dir).status).toBe(0);
  });

  it('DIALECT-005: a newer migration is held to the DML rules but may spell its own DDL and PRAGMA', () => {
    const migration = 'src/db/migrations/Migration20990101000000_probe.ts';
    const ddl =
      "export const t = 'CREATE TABLE t (id INTEGER PRIMARY KEY AUTOINCREMENT)';\nexport const p = 'PRAGMA foreign_keys = OFF';\n";
    expect(run(serverRoot({ [migration]: ddl })).status).toBe(0);

    const dml = "export const s = 'INSERT OR IGNORE INTO t (a) VALUES (1)';\n";
    const { status, out } = run(serverRoot({ [migration]: dml }));
    expect(status).toBe(1);
    expect(out).toContain(`FAIL  ${migration}: 1 SQLite-only insert-or hit(s), 0 allowed.`);
  });

  it('DIALECT-006: PRAGMA is allowed in the src/db lifecycle files, not in a repository or a domain', () => {
    const pragma = "export const p = 'PRAGMA wal_checkpoint(TRUNCATE)';\n";
    expect(run(serverRoot({ 'src/db/durability.ts': pragma })).status).toBe(0);
    expect(run(serverRoot({ [REPO]: pragma })).status).toBe(1);
    expect(run(serverRoot({ 'src/nest/backup/probe.ts': pragma })).status).toBe(1);
  });

  it('DIALECT-007: holds a baselined file at its count, fails a grown one and a stale entry', () => {
    const one = "export const a = 'INSERT OR IGNORE INTO t (a) VALUES (1)';\n";
    const two = `${one}export const b = 'INSERT OR IGNORE INTO t (a) VALUES (2)';\n`;
    expect(run(serverRoot({ [REPO]: one }, { [REPO]: { 'insert-or': 1 } })).status).toBe(0);
    expect(run(serverRoot({ [REPO]: two }, { [REPO]: { 'insert-or': 1 } })).status).toBe(1);

    const stale = run(serverRoot({ [REPO]: one }, { [REPO]: { 'insert-or': 2 } }));
    expect(stale.status).toBe(1);
    expect(stale.out).toContain(
      `FAIL  ${REPO} is held at 2 insert-or hit(s) in scripts/dialect-baseline.json, but has 1 now.`,
    );
    expect(stale.out).toContain('npm run lint:dialect -- --update');
  });

  it('DIALECT-008: --update only lowers, drops what is gone, and never adds an entry', () => {
    const one = "export const a = 'INSERT OR IGNORE INTO t (a) VALUES (1)';\n";
    const dir = serverRoot(
      { [REPO]: one, 'src/nest/new.ts': "export const p = 'PRAGMA user_version';\n" },
      { [REPO]: { 'insert-or': 3, pragma: 1 }, 'src/gone.ts': { strftime: 1 } },
    );
    const { status } = run(dir, '--update');
    const baseline: unknown = JSON.parse(readFileSync(path.join(dir, 'scripts/dialect-baseline.json'), 'utf8'));
    expect(baseline).toEqual({ [REPO]: { 'insert-or': 1 } });
    // The new file's hit is still not allowed after the update.
    expect(status).toBe(1);
  });

  it('DIALECT-009: fails closed on a missing, unparsable or malformed baseline', () => {
    const files = { [REPO]: 'export {};\n' };
    const missing = run(serverRoot(files, null));
    expect(missing.status).toBe(1);
    expect(missing.out).toContain('dialect-baseline.json cannot be read');
    expect(run(serverRoot(files, '{ not json')).status).toBe(1);
    expect(run(serverRoot(files, '[]')).status).toBe(1);
    expect(run(serverRoot(files, { [REPO]: 3 })).status).toBe(1);
    expect(run(serverRoot(files, { [REPO]: { 'no-such-rule': 1 } })).status).toBe(1);
    expect(run(serverRoot(files, { [REPO]: { pragma: 0 } })).status).toBe(1);
  });

  it('DIALECT-010: fails closed when src/ is missing', () => {
    const dir = serverRoot({ [REPO]: 'export {};\n' });
    rmSync(path.join(dir, 'src'), { recursive: true });
    const { status, out } = run(dir);
    expect(status).toBe(1);
    expect(out).toContain('src/ does not exist');
  });
});
