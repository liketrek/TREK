/**
 * The Postgres client tools (src/db/engine/postgres/pg-tools.ts), run against
 * stand-in pg_dump, pg_restore and psql scripts in a temp directory: the exact
 * arguments and environment each call hands the binary, the password kept out
 * of the arguments, the files a dump and a restore leave behind, and the
 * refusal when a tool is missing. The real tools against a real database are
 * exercised by the Postgres lane.
 */
import { PgToolMissingError, pgConnectionEnv, resolvePgTool } from '../../../../../src/db/engine/postgres/pg-process';
import { pgDump, pgDumpMigrations, pgRestore } from '../../../../../src/db/engine/postgres/pg-tools';
import { hasRestrictFix } from '../../../../../src/db/engine/postgres/restore-safety';

import fs, {
  chmodSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const URL_WITH_SECRET = 'postgresql://trek:s3cr%40t@db.example:6543/trek_db?sslmode=require';

let bin: string;
let out: string;

/** pg_restore writing its --file (the fourth argument) as 17.6+ does: opened with a \\restrict line. */
const WRITES_RESTRICTED_SCRIPT =
  "printf '%s\\n' '\\restrict k1' 'CREATE TABLE public.mikro_orm_migrations (' ');' > \"${4#--file=}\"";
/** What psql answers to the current-schema query: the name, a tab, the name as quote_ident writes it. */
const PUBLIC_SCHEMA = 'public\tpublic';

interface FakeOptions {
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  /** Extra shell the tool runs before it exits. */
  body?: string;
  /** What `--version` answers. */
  version?: string;
}

/** A stand-in tool that records its arguments and libpq environment, then prints `stdout`. */
function fakeTool(
  name: string,
  { stdout = '', stderr = '', exitCode = 0, body = '', version = '17.11' }: FakeOptions = {},
): string {
  const log = path.join(bin, `${name}.log`);
  writeFileSync(
    path.join(bin, name),
    [
      '#!/bin/sh',
      `[ "$1" = --version ] && { echo '${name} (PostgreSQL) ${version} (Debian)'; exit 0; }`,
      `printf '%s\\n' "$@" > '${log}'`,
      `env | grep '^PG' | sort >> '${log}'`,
      body,
      `printf '%s' '${stdout}'`,
      `printf '%s' '${stderr}' >&2`,
      `exit ${exitCode}`,
      '',
    ].join('\n'),
  );
  chmodSync(path.join(bin, name), 0o755);
  return log;
}

const argsOf = (log: string): string[] =>
  readFileSync(log, 'utf8')
    .split('\n')
    .filter((line) => !line.startsWith('PG'));

beforeEach(() => {
  bin = mkdtempSync(path.join(tmpdir(), 'trek-pg-bin-'));
  out = mkdtempSync(path.join(tmpdir(), 'trek-pg-out-'));
});
afterEach(() => {
  rmSync(bin, { recursive: true, force: true });
  rmSync(out, { recursive: true, force: true });
});

describe('pg-tools', () => {
  it('PGTOOLS-001: finds a tool by absolute path in the configured directory, and nowhere else', () => {
    fakeTool('pg_dump');
    writeFileSync(path.join(bin, 'psql'), 'not executable');
    expect(resolvePgTool('pg_dump', bin)).toBe(path.join(bin, 'pg_dump'));
    expect(resolvePgTool('pg_restore', bin)).toBeNull();
    expect(resolvePgTool('psql', bin)).toBeNull();
  });

  it('PGTOOLS-002: the connection goes in the libpq environment, the password decoded and never an argument', () => {
    expect(pgConnectionEnv(URL_WITH_SECRET)).toEqual({
      PGHOST: 'db.example',
      PGPORT: '6543',
      PGDATABASE: 'trek_db',
      PGUSER: 'trek',
      PGPASSWORD: 's3cr@t',
      PGCONNECT_TIMEOUT: '10',
      PGSSLMODE: 'verify-full',
      PGSSLROOTCERT: 'system',
    });
    expect(pgConnectionEnv('postgres://u@[::1]/d')).toEqual({
      PGHOST: '::1',
      PGPORT: '5432',
      PGDATABASE: 'd',
      PGUSER: 'u',
      PGCONNECT_TIMEOUT: '10',
    });
  });

  it('PGTOOLS-003: SSL is verified as the app pool verifies it, against the URL root certificate when it names one', () => {
    expect(pgConnectionEnv('postgres://u@h/d?sslmode=disable')).toMatchObject({ PGSSLMODE: 'disable' });
    expect(pgConnectionEnv('postgres://u@h/d?sslmode=disable').PGSSLROOTCERT).toBeUndefined();
    expect(pgConnectionEnv('postgres://u@h/d?sslmode=verify-ca&sslrootcert=%2Fca%2Froot.crt')).toMatchObject({
      PGSSLMODE: 'verify-full',
      PGSSLROOTCERT: '/ca/root.crt',
    });
  });

  it('PGTOOLS-004: pg_dump writes a private custom-format dump beside the target and renames it into place', async () => {
    fakeTool('psql', { stdout: PUBLIC_SCHEMA });
    const log = fakeTool('pg_dump', { body: 'printf dump >> "${4#--file=}"' });
    const target = path.join(out, 'x.pgdump');
    await pgDump(URL_WITH_SECRET, target, bin);
    expect(argsOf(log).slice(0, 5)).toEqual([
      '--format=custom',
      '--no-owner',
      '--no-privileges',
      `--file=${target}.partial`,
      '--schema="public"',
    ]);
    expect(readFileSync(log, 'utf8')).toContain('PGPASSWORD=s3cr@t');
    expect(argsOf(log).join(' ')).not.toContain('s3cr');
    expect(readFileSync(target, 'utf8')).toBe('dump');
    expect(statSync(target).mode & 0o777).toBe(0o600);
    expect(readdirSync(out)).toEqual(['x.pgdump']);
  });

  it('PGTOOLS-005: a restore clears the schema and loads the script in one psql transaction, then removes its work files', async () => {
    const source = path.join(out, 'in.pgdump');
    const restoreLog = fakeTool('pg_restore', { body: WRITES_RESTRICTED_SCRIPT });
    const psqlLog = fakeTool('psql', {
      stdout: PUBLIC_SCHEMA,
      body: `[ -n "$6" ] && cp "\${6#--file=}" '${path.join(bin, 'clear.sql')}'`,
    });
    await pgRestore(URL_WITH_SECRET, source, bin);

    const restoreArgs = argsOf(restoreLog);
    expect(restoreArgs.slice(0, 3)).toEqual(['--no-owner', '--no-privileges', '--schema=public']);
    expect(restoreArgs[3]).toMatch(/^--file=.*\.pg-restore-[^/]+\/restore\.sql$/);
    expect(restoreArgs.slice(4, 6)).toEqual(['--', source]);
    expect(readFileSync(restoreLog, 'utf8')).not.toContain('PGPASSWORD');

    const psqlArgs = argsOf(psqlLog);
    expect(psqlArgs.slice(0, 5)).toEqual([
      '--no-psqlrc',
      '--quiet',
      '--single-transaction',
      '--set=ON_ERROR_STOP=1',
      '--output=/dev/null',
    ]);
    expect(psqlArgs[5]).toMatch(/clear-schema\.sql$/);
    expect(psqlArgs[6]).toBe(restoreArgs[3]);
    expect(readFileSync(psqlLog, 'utf8')).toContain('PGOPTIONS=-c lock_timeout=60s -c client_min_messages=warning');
    expect(readFileSync(path.join(bin, 'clear.sql'), 'utf8')).toMatch(/DROP %s IF EXISTS %s CASCADE/);
    expect(readdirSync(out)).toEqual([]);
  });

  it('PGTOOLS-005b: the restore script is checked line by line, so its COPY data is never read whole', async () => {
    const source = path.join(out, 'in.pgdump');
    fakeTool('pg_restore', {
      body: `printf '%s\\n' '\\restrict k1' 'CREATE TABLE public.mikro_orm_migrations (' > "\${4#--file=}"; seq 1 200000 >> "\${4#--file=}"`,
    });
    fakeTool('psql', { stdout: PUBLIC_SCHEMA });
    const readWhole = vi.spyOn(fs, 'readFileSync');
    try {
      await pgRestore(URL_WITH_SECRET, source, bin);
      expect(readWhole.mock.calls.filter(([file]) => String(file).endsWith('restore.sql'))).toEqual([]);
    } finally {
      readWhole.mockRestore();
    }
  });

  it("PGTOOLS-006: reads the dump's recorded migrations from its COPY block, and none from a dump without them", async () => {
    const copy = [
      'SET statement_timeout = 0;',
      'COPY public.mikro_orm_migrations (id, name, executed_at) FROM stdin;',
      '1\tMigration20200101000000_baseline_schema\t2026-01-01 00:00:00+00',
      '2\tMigration20200101000100_second\t2026-01-01 00:00:00+00',
      '\\.',
      '',
    ].join('\n');
    const log = fakeTool('pg_restore', { stdout: copy });
    await expect(pgDumpMigrations('/data/in.pgdump', bin)).resolves.toEqual([
      'Migration20200101000000_baseline_schema',
      'Migration20200101000100_second',
    ]);
    expect(argsOf(log).slice(0, 5)).toEqual([
      '--data-only',
      '--table=mikro_orm_migrations',
      '--file=-',
      '--',
      '/data/in.pgdump',
    ]);
    fakeTool('pg_restore', { stdout: 'SET statement_timeout = 0;\n' });
    await expect(pgDumpMigrations('/data/in.pgdump', bin)).resolves.toEqual([]);
  });

  it('PGTOOLS-007: a failing tool reports its own message without the lines that quote SQL or rows, and leaves no file', async () => {
    fakeTool('psql', { stdout: PUBLIC_SCHEMA });
    fakeTool('pg_dump', {
      exitCode: 1,
      stderr: 'pg_dump: error: query failed\nCommand was: SELECT secret_row\nDETAIL: Key (email)=(a@b.c)\n',
    });
    const target = path.join(out, 'x.pgdump');
    await expect(pgDump(URL_WITH_SECRET, target, bin)).rejects.toThrow(
      /^pg_dump failed: pg_dump: error: query failed$/,
    );
    expect(readdirSync(out)).toEqual([]);

    fakeTool('pg_dump', { exitCode: 1, stderr: 'x'.repeat(5000) });
    await expect(pgDump(URL_WITH_SECRET, target, bin)).rejects.toThrow(/^pg_dump failed: x{2000}…$/);
  });

  it('PGTOOLS-008: a missing tool says how to install it, and a restore that cannot run leaves no work files', async () => {
    const source = path.join(out, 'in.pgdump');
    await expect(pgRestore(URL_WITH_SECRET, source, bin)).rejects.toThrow(PgToolMissingError);
    await expect(pgDump(URL_WITH_SECRET, path.join(out, 'x.pgdump'), bin)).rejects.toThrow(/TREK_DB_PG_BIN_DIR/);
    fakeTool('pg_restore', { body: WRITES_RESTRICTED_SCRIPT });
    await expect(pgRestore(URL_WITH_SECRET, source, bin)).rejects.toThrow(/psql was not found/);
    expect(existsSync(out) && readdirSync(out)).toEqual([]);
  });

  it('PGTOOLS-009: client tools without the \\restrict fix (CVE-2025-8714) never turn a dump into a script', async () => {
    fakeTool('pg_restore', { version: '16.9', body: `touch '${path.join(bin, 'ran')}'` });
    fakeTool('psql', { body: `touch '${path.join(bin, 'ran')}'` });
    await expect(pgRestore(URL_WITH_SECRET, path.join(out, 'in.pgdump'), bin)).rejects.toThrow(
      /pg_restore is too old to restore safely \(pg_restore \(PostgreSQL\) 16\.9 \(Debian\)\): it must be at least 17\.6/,
    );
    fakeTool('pg_restore', { body: `touch '${path.join(bin, 'ran')}'` });
    fakeTool('psql', { version: '17.5', body: `touch '${path.join(bin, 'ran')}'` });
    await expect(pgRestore(URL_WITH_SECRET, path.join(out, 'in.pgdump'), bin)).rejects.toThrow(/psql is too old/);
    expect(existsSync(path.join(bin, 'ran'))).toBe(false);
    expect(readdirSync(out)).toEqual([]);
  });

  it('PGTOOLS-010: knows which client versions carry the \\restrict fix', () => {
    const fixed = ['14.19', '15.14', '16.10', '17.6', '17.11', '18.0', '19.1'];
    const unfixed = ['13.30', '14.18', '15.13', '16.9', '17.5'];
    for (const v of fixed) expect(hasRestrictFix(`pg_restore (PostgreSQL) ${v}`), v).toBe(true);
    for (const v of unfixed) expect(hasRestrictFix(`pg_restore (PostgreSQL) ${v}`), v).toBe(false);
    expect(hasRestrictFix('not a version')).toBe(false);
  });

  it('PGTOOLS-011: a dump holds the current schema only, matched by its exact name, which psql reads without the password in an argument', async () => {
    const psqlLog = fakeTool('psql', { stdout: 'My"Trek\t"My""Trek"' });
    const log = fakeTool('pg_dump', { body: 'printf dump >> "${4#--file=}"' });
    await pgDump(URL_WITH_SECRET, path.join(out, 'x.pgdump'), bin);
    expect(argsOf(log)[4]).toBe('--schema="My""Trek"');
    expect(argsOf(psqlLog).join(' ')).toContain('current_schema()');
    expect(argsOf(psqlLog).join(' ')).not.toContain('s3cr');

    fakeTool('psql', { stdout: '\n' });
    await expect(pgDump(URL_WITH_SECRET, path.join(out, 'y.pgdump'), bin)).rejects.toThrow(/no current schema/);
    expect(readdirSync(out)).toEqual(['x.pgdump']);
  });

  it('PGTOOLS-012: a restore keeps to the current schema, and refuses a dump without TREK tables there before clearing anything', async () => {
    const source = path.join(out, 'in.pgdump');
    const restoreLog = fakeTool('pg_restore', {
      body: "printf '%s\\n' '\\restrict k1' 'CREATE TABLE auth.users (' ');' > \"${4#--file=}\"",
    });
    const psqlLog = fakeTool('psql', { stdout: 'trek\ttrek' });
    await expect(pgRestore(URL_WITH_SECRET, source, bin)).rejects.toThrow(
      'The backup holds no TREK tables in the schema "trek"; nothing was replaced.',
    );
    expect(argsOf(restoreLog)[2]).toBe('--schema=trek');
    // psql only read the schema: it never ran the clear or the load.
    expect(argsOf(psqlLog).join(' ')).not.toContain('--single-transaction');
    expect(readdirSync(out)).toEqual([]);
  });
});
