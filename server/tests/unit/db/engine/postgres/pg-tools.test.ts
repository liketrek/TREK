/**
 * The Postgres client tools (src/db/engine/postgres/pg-tools.ts, with
 * pg-process.ts and restore-safety.ts), run against stand-in pg_dump,
 * pg_restore and psql scripts (tests/helpers/fake-pg-tools.ts): the arguments
 * and environment each call hands the binary, the password kept out of the
 * arguments, the files a dump and a restore leave behind, and the refusal when
 * a tool is missing or too old. The real tools against a real database are
 * exercised by the Postgres lane.
 */
import { pgConnectionEnv, PgToolMissingError, resolvePgTool } from '../../../../../src/db/engine/postgres/pg-process';
import { pgDump, pgDumpMigrations, pgRestore } from '../../../../../src/db/engine/postgres/pg-tools';
import { hasRestrictFix } from '../../../../../src/db/engine/postgres/restore-safety';
import {
  answersSchema,
  appendsOutputOf,
  copiesFileEndingWith,
  failsWith,
  flagValues,
  installFakeTool,
  listsMigrations,
  listsSchemas,
  printsWhen,
  readToolCall,
  touches,
  writesFile,
  writesRestrictedScript,
} from '../../../../helpers/fake-pg-tools';

import fs, { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import os, { tmpdir } from 'node:os';
import path from 'node:path';
import { inspect } from 'node:util';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const URL_WITH_SECRET = 'postgresql://trek:s3cr%40t@db.example:6543/trek_db?sslmode=require';
/** The restore's session settings, which psql gets through PGOPTIONS. */
const RESTORE_OPTIONS = '-c lock_timeout=60s -c client_min_messages=warning';
/** The most SQL a restore script may hold in these tests (BACKUP_MAX_DECOMPRESSED_MB in the app). */
const LIMIT = 64 * 1024 * 1024;

let bin: string;
let out: string;

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
    installFakeTool(bin, 'pg_dump');
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
    installFakeTool(bin, 'psql', { snippets: [answersSchema()] });
    const log = installFakeTool(bin, 'pg_dump', { snippets: [writesFile('dump')] });
    const target = path.join(out, 'x.pgdump');
    await pgDump(URL_WITH_SECRET, target, bin);

    const call = readToolCall(log);
    expect(call.args).toHaveLength(5);
    expect(call.args).toEqual(
      expect.arrayContaining([
        '--format=custom',
        '--no-owner',
        '--no-privileges',
        `--file=${target}.partial`,
        '--schema="public"',
      ]),
    );
    expect(call.env.PGPASSWORD).toBe('s3cr@t');
    expect(call.args.join(' ')).not.toContain('s3cr');
    expect(readFileSync(target, 'utf8')).toBe('dump');
    expect(statSync(target).mode & 0o777).toBe(0o600);
    expect(readdirSync(out)).toEqual(['x.pgdump']);
  });

  it('PGTOOLS-005: a restore clears the schema and loads the script in one psql transaction, then removes its work files', async () => {
    const clearCopy = path.join(bin, 'clear.sql');
    const restoreLog = installFakeTool(bin, 'pg_restore', { snippets: [writesRestrictedScript()] });
    const psqlLog = installFakeTool(bin, 'psql', {
      snippets: [answersSchema(), copiesFileEndingWith('clear-schema.sql', clearCopy)],
    });
    const source = path.join(out, 'in.pgdump');
    await pgRestore(URL_WITH_SECRET, source, bin, LIMIT);

    const restore = readToolCall(restoreLog);
    expect(restore.args).toEqual(
      expect.arrayContaining(['--no-owner', '--no-privileges', '--schema=public', '--file=-']),
    );
    expect(restore.args.slice(-2)).toEqual(['--', source]);
    expect(restore.env).toEqual({});

    const psql = readToolCall(psqlLog);
    expect(psql.args).toEqual(
      expect.arrayContaining([
        '--no-psqlrc',
        '--quiet',
        '--single-transaction',
        '--set=ON_ERROR_STOP=1',
        `--output=${os.devNull}`,
      ]),
    );
    // Order is the point here: the schema is cleared before the script loads.
    const [clearFile, loadFile] = flagValues(psql.args, '--file=');
    expect(clearFile).toMatch(/clear-schema\.sql$/);
    expect(loadFile).toMatch(/\.pg-restore-[^/]+\/restore\.sql$/);
    expect(psql.env.PGOPTIONS).toBe(RESTORE_OPTIONS);
    expect(readFileSync(clearCopy, 'utf8')).toMatch(/DROP %s IF EXISTS %s CASCADE/);
    expect(readdirSync(out)).toEqual([]);
  });

  it('PGTOOLS-005b: the restore script is checked line by line, so its COPY data is never read whole', async () => {
    const source = path.join(out, 'in.pgdump');
    installFakeTool(bin, 'pg_restore', {
      snippets: [writesRestrictedScript(), appendsOutputOf('seq 1 200000')],
    });
    installFakeTool(bin, 'psql', { snippets: [answersSchema()] });
    const readWhole = vi.spyOn(fs, 'readFileSync');
    try {
      await pgRestore(URL_WITH_SECRET, source, bin, LIMIT);
      expect(readWhole.mock.calls.filter(([file]) => String(file).endsWith('restore.sql'))).toEqual([]);
    } finally {
      readWhole.mockRestore();
    }
  });

  it("PGTOOLS-006: reads the dump's recorded migrations from its COPY block, and none from a dump without them", async () => {
    const log = installFakeTool(bin, 'pg_restore', {
      snippets: [listsMigrations(['Migration20200101000000_baseline_schema', 'Migration20200101000100_second'])],
    });
    await expect(pgDumpMigrations('/data/in.pgdump', bin)).resolves.toEqual([
      'Migration20200101000000_baseline_schema',
      'Migration20200101000100_second',
    ]);
    const call = readToolCall(log);
    expect(call.args).toEqual(expect.arrayContaining(['--data-only', '--table=mikro_orm_migrations', '--file=-']));
    expect(call.args.slice(-2)).toEqual(['--', '/data/in.pgdump']);

    installFakeTool(bin, 'pg_restore', { snippets: [printsWhen('--data-only', 'SET statement_timeout = 0;\n')] });
    await expect(pgDumpMigrations('/data/in.pgdump', bin)).resolves.toEqual([]);
  });

  it.each([
    {
      id: 'PGTOOLS-007a',
      stderr: 'pg_dump: error: query failed\nCommand was: SELECT secret_row\nDETAIL: Key (email)=(a@b.c)\n',
      message: /^pg_dump failed: pg_dump: error: query failed$/,
    },
    { id: 'PGTOOLS-007b', stderr: 'x'.repeat(5000), message: /^pg_dump failed: x{2000}…$/ },
  ])(
    '$id: a failing tool reports its own message without the lines that quote SQL or rows, and leaves no file',
    async ({ stderr, message }) => {
      installFakeTool(bin, 'psql', { snippets: [answersSchema()] });
      installFakeTool(bin, 'pg_dump', { snippets: [failsWith(stderr)] });
      const target = path.join(out, 'x.pgdump');
      await expect(pgDump(URL_WITH_SECRET, target, bin)).rejects.toThrow(message);
      expect(readdirSync(out)).toEqual([]);
    },
  );

  it('PGTOOLS-008: a missing tool says how to install it, and a restore that cannot run leaves no work files', async () => {
    const source = path.join(out, 'in.pgdump');
    await expect(pgRestore(URL_WITH_SECRET, source, bin, LIMIT)).rejects.toThrow(PgToolMissingError);
    await expect(pgDump(URL_WITH_SECRET, path.join(out, 'x.pgdump'), bin)).rejects.toThrow(/TREK_DB_PG_BIN_DIR/);
    installFakeTool(bin, 'pg_restore', { snippets: [writesRestrictedScript()] });
    await expect(pgRestore(URL_WITH_SECRET, source, bin, LIMIT)).rejects.toThrow(/psql was not found/);
    expect(existsSync(out) && readdirSync(out)).toEqual([]);
  });

  it.each([
    {
      id: 'PGTOOLS-009a',
      tool: 'pg_restore' as const,
      version: '16.9',
      message:
        /pg_restore is too old to restore safely \(pg_restore \(PostgreSQL\) 16\.9 \(Debian\)\): it must be at least 18\.0, 17\.6, 16\.10, 15\.14 or 14\.19/,
    },
    { id: 'PGTOOLS-009b', tool: 'psql' as const, version: '17.5', message: /psql is too old/ },
  ])(
    '$id: client tools without the \\restrict fix (CVE-2025-8714) never turn a dump into a script',
    async ({ tool, version, message }) => {
      const ran = path.join(bin, 'ran');
      installFakeTool(bin, 'pg_restore', { snippets: [touches(ran)] });
      installFakeTool(bin, 'psql', { snippets: [touches(ran)] });
      installFakeTool(bin, tool, { version, snippets: [touches(ran)] });
      await expect(pgRestore(URL_WITH_SECRET, path.join(out, 'in.pgdump'), bin, LIMIT)).rejects.toThrow(message);
      expect(existsSync(ran)).toBe(false);
      expect(readdirSync(out)).toEqual([]);
    },
  );

  it('PGTOOLS-010: knows which client versions carry the \\restrict fix', () => {
    const fixed = ['14.19', '15.14', '16.10', '17.6', '17.11', '18.0', '19.1'];
    const unfixed = ['13.30', '14.18', '15.13', '16.9', '17.5'];
    for (const v of fixed) expect(hasRestrictFix(`pg_restore (PostgreSQL) ${v}`), v).toBe(true);
    for (const v of unfixed) expect(hasRestrictFix(`pg_restore (PostgreSQL) ${v}`), v).toBe(false);
    expect(hasRestrictFix('not a version')).toBe(false);
  });

  it('PGTOOLS-011: a dump holds the current schema only, matched by its exact name, which psql reads without the password in an argument', async () => {
    const psqlLog = installFakeTool(bin, 'psql', { snippets: [answersSchema('My"Trek', '"My""Trek"')] });
    const dumpLog = installFakeTool(bin, 'pg_dump', { snippets: [writesFile('dump')] });
    await pgDump(URL_WITH_SECRET, path.join(out, 'x.pgdump'), bin);
    expect(readToolCall(dumpLog).args).toContain('--schema="My""Trek"');
    const psql = readToolCall(psqlLog);
    expect(psql.args.join(' ')).toContain('current_schema()');
    expect(psql.args.join(' ')).not.toContain('s3cr');

    installFakeTool(bin, 'psql', { snippets: [printsWhen('quote_ident', '\n')] });
    await expect(pgDump(URL_WITH_SECRET, path.join(out, 'y.pgdump'), bin)).rejects.toThrow(/no current schema/);
    expect(readdirSync(out)).toEqual(['x.pgdump']);
  });

  it('PGTOOLS-012: a restore keeps to the current schema, and refuses a dump without TREK tables there before clearing anything', async () => {
    const source = path.join(out, 'in.pgdump');
    const restoreLog = installFakeTool(bin, 'pg_restore', {
      snippets: [writesFile('\\restrict k1\nCREATE TABLE auth.users (\n);\n')],
    });
    const psqlLog = installFakeTool(bin, 'psql', { snippets: [answersSchema('trek')] });
    await expect(pgRestore(URL_WITH_SECRET, source, bin, LIMIT)).rejects.toThrow(
      'The backup holds no TREK tables in the schema "trek"; nothing was replaced.',
    );
    expect(readToolCall(restoreLog).args).toContain('--schema=trek');
    expect(readToolCall(psqlLog).args.join(' ')).not.toContain('--single-transaction');
    expect(readdirSync(out)).toEqual([]);
  });

  it('PGTOOLS-013: a restore refuses a role that could reach the database host, before it writes a script', async () => {
    const ran = path.join(bin, 'ran');
    installFakeTool(bin, 'pg_restore', { snippets: [touches(ran)] });
    const psqlLog = installFakeTool(bin, 'psql', {
      snippets: [answersSchema('public', 'public', { privileged: true })],
    });
    await expect(pgRestore(URL_WITH_SECRET, path.join(out, 'in.pgdump'), bin, LIMIT)).rejects.toThrow(
      /connects as a superuser or a member of a superuser role, a role that may run programs or read or write files/,
    );
    expect(existsSync(ran)).toBe(false);
    expect(readToolCall(psqlLog).args.join(' ')).toContain('pg_execute_server_program');
    expect(readToolCall(psqlLog).args.join(' ')).toContain('pg_read_server_files');
    expect(readdirSync(out)).toEqual([]);
  });

  it('PGTOOLS-014: a script past the limit stops pg_restore, replaces nothing and leaves no work file', async () => {
    installFakeTool(bin, 'pg_restore', {
      snippets: [writesRestrictedScript(), appendsOutputOf('seq 1 200000')],
    });
    const psqlLog = installFakeTool(bin, 'psql', { snippets: [answersSchema()] });
    await expect(pgRestore(URL_WITH_SECRET, path.join(out, 'in.pgdump'), bin, 64 * 1024)).rejects.toThrow(
      /expands to more than 0\.06 MB of SQL, the limit BACKUP_MAX_DECOMPRESSED_MB sets; nothing was replaced/,
    );
    expect(readToolCall(psqlLog).args.join(' ')).not.toContain('--single-transaction');
    expect(readdirSync(out)).toEqual([]);
  });

  it.each([
    {
      id: 'PGTOOLS-015a',
      run: (b: string) => pgDump(URL_WITH_SECRET, path.join(out, 'x.pgdump'), b),
      tool: 'pg_dump',
    },
    {
      id: 'PGTOOLS-015b',
      run: (b: string) => pgRestore(URL_WITH_SECRET, path.join(out, 'in.pgdump'), b, LIMIT),
      tool: 'pg_restore',
    },
  ])('$id: a client older than the server is refused before it runs, naming both versions', async ({ run, tool }) => {
    const ran = path.join(bin, 'ran');
    installFakeTool(bin, 'pg_dump', { snippets: [touches(ran)] });
    installFakeTool(bin, 'pg_restore', { snippets: [touches(ran)] });
    installFakeTool(bin, 'psql', { snippets: [answersSchema('public', 'public', { versionNum: '180001' })] });
    await expect(run(bin)).rejects.toThrow(
      `${tool} is version 17, older than the PostgreSQL 18 server, which it cannot back up or restore.`,
    );
    expect(existsSync(ran)).toBe(false);
    expect(readdirSync(out)).toEqual([]);
  });

  it('PGTOOLS-016: the system CA store is used only by a client that understands sslrootcert=system (16 and later)', async () => {
    const server15 = answersSchema('public', 'public', { versionNum: '150010' });
    installFakeTool(bin, 'psql', { version: '15.14', snippets: [server15] });
    installFakeTool(bin, 'pg_dump', { version: '15.14', snippets: [writesFile('dump')] });
    await expect(pgDump(URL_WITH_SECRET, path.join(out, 'x.pgdump'), bin)).rejects.toThrow(
      /psql \(psql \(PostgreSQL\) 15\.14 \(Debian\)\) cannot verify the server against the system's trusted/,
    );
    // With the CA named in the URL, the same client runs.
    await pgDump(`${URL_WITH_SECRET}&sslrootcert=%2Fca.crt`, path.join(out, 'x.pgdump'), bin);
    const server16 = answersSchema('public', 'public', { versionNum: '160004' });
    installFakeTool(bin, 'psql', { version: '16.10', snippets: [server16] });
    installFakeTool(bin, 'pg_dump', { version: '16.10', snippets: [writesFile('dump')] });
    await pgDump(URL_WITH_SECRET, path.join(out, 'y.pgdump'), bin);
    expect(readdirSync(out).sort()).toEqual(['x.pgdump', 'y.pgdump']);
  });

  it('PGTOOLS-017: a failed tool leaves the rows it quoted out of the error, its cause included', async () => {
    installFakeTool(bin, 'psql', { snippets: [answersSchema()] });
    const stderr =
      'pg_dump: error: COPY failed\nDETAIL: Key (email)=(a@b.c)\nCONTEXT: COPY users, line 2: "secret-row"';
    installFakeTool(bin, 'pg_dump', { snippets: [failsWith(stderr)] });
    const failure = await pgDump(URL_WITH_SECRET, path.join(out, 'x.pgdump'), bin).catch((err: unknown) => err);
    const printed = inspect(failure, { depth: null });
    expect(printed).toContain('pg_dump failed: pg_dump: error: COPY failed');
    expect(printed).toContain('pg_dump ended with code 1');
    expect(printed).not.toContain('secret-row');
    expect(printed).not.toContain('a@b.c');
  });

  it("PGTOOLS-018: a dump holds the plugin schemas TREK's role owns beside its own schema, and nothing else", async () => {
    const plugins = ['trek_plugin_notes', 'trek_plugin_trip_weather'];
    const psqlLog = installFakeTool(bin, 'psql', {
      snippets: [answersSchema('public', 'public', { pluginSchemas: [...plugins, 'auth'] })],
    });
    const dumpLog = installFakeTool(bin, 'pg_dump', { snippets: [writesFile('dump')] });
    await pgDump(URL_WITH_SECRET, path.join(out, 'x.pgdump'), bin);

    const args = readToolCall(dumpLog).args;
    expect(flagValues(args, '--schema=')).toEqual(['"public"', ...plugins]);
    const sql = readToolCall(psqlLog).args.join(' ');
    expect(sql).toContain("starts_with(nspname, 'trek_plugin_')");
    expect(sql).toContain('pg_get_userbyid(nspowner) = current_user');
  });

  it("PGTOOLS-019: a restore loads the dump's plugin schemas, after dropping the role's own and creating the dump's", async () => {
    const clearCopy = path.join(bin, 'clear.sql');
    const restoreLog = installFakeTool(bin, 'pg_restore', {
      snippets: [listsSchemas(['trek_plugin_notes', 'auth', 'public']), writesRestrictedScript()],
    });
    installFakeTool(bin, 'psql', {
      snippets: [answersSchema(), copiesFileEndingWith('clear-schema.sql', clearCopy)],
    });
    const source = path.join(out, 'in.pgdump');
    await pgRestore(URL_WITH_SECRET, source, bin, LIMIT);

    expect(flagValues(readToolCall(restoreLog).args, '--schema=')).toEqual(['public', 'trek_plugin_notes']);
    const clear = readFileSync(clearCopy, 'utf8');
    expect(clear).toMatch(/DROP %s IF EXISTS %s CASCADE/);
    expect(clear).toContain("EXECUTE format('DROP SCHEMA %I CASCADE', r.nspname);");
    expect(clear).toContain('pg_get_userbyid(nspowner) = current_user');
    expect(clear.endsWith('CREATE SCHEMA "trek_plugin_notes";\n')).toBe(true);
    expect(clear).not.toContain('CREATE SCHEMA "auth"');
    expect(readdirSync(out)).toEqual([]);
  });

  it.each([
    { id: 'PGTOOLS-021a', versionNum: '160004', kept: false },
    { id: 'PGTOOLS-021b', versionNum: '170002', kept: true },
  ])(
    '$id: the script psql runs sets transaction_timeout only on a server that knows it',
    async ({ versionNum, kept }) => {
      const scriptCopy = path.join(bin, 'restore.sql');
      installFakeTool(bin, 'pg_restore', {
        snippets: [
          writesFile(
            '\\restrict k1\nSET lock_timeout = 0;\nSET transaction_timeout = 0;\n' +
              'CREATE TABLE public.mikro_orm_migrations (\n);\n',
          ),
        ],
      });
      installFakeTool(bin, 'psql', {
        snippets: [answersSchema('public', 'public', { versionNum }), copiesFileEndingWith('restore.sql', scriptCopy)],
      });
      await pgRestore(URL_WITH_SECRET, path.join(out, 'in.pgdump'), bin, LIMIT);
      const script = readFileSync(scriptCopy, 'utf8');
      expect(script).toContain('\nCREATE TABLE public.mikro_orm_migrations (\n');
      expect(script).toContain('SET lock_timeout = 0;\n');
      expect(script.includes('SET transaction_timeout = 0;')).toBe(kept);
    },
  );

  it("PGTOOLS-020: a plugin's own table named mikro_orm_migrations never passes for TREK's history", async () => {
    const forged =
      'COPY trek_plugin_notes.mikro_orm_migrations (id, name) FROM stdin;\n1\tMigration29990101000000_forged\n\\.\n';
    const real =
      'COPY public.mikro_orm_migrations (id, name, executed_at) FROM stdin;\n1\tMigration20200101000000_baseline_schema\tx\n\\.\n';
    installFakeTool(bin, 'pg_restore', { snippets: [printsWhen('--data-only', forged + real)] });
    await expect(pgDumpMigrations('/data/in.pgdump', bin)).resolves.toEqual([
      'Migration20200101000000_baseline_schema',
    ]);

    installFakeTool(bin, 'pg_restore', { snippets: [printsWhen('--data-only', forged)] });
    await expect(pgDumpMigrations('/data/in.pgdump', bin)).resolves.toEqual([]);
  });

  it('PGTOOLS-022: a dump from a newer server major is refused before anything is cleared, naming both majors', async () => {
    const psqlLog = installFakeTool(bin, 'psql', { version: '18.1', snippets: [answersSchema()] });
    installFakeTool(bin, 'pg_restore', {
      version: '18.1',
      snippets: [listsSchemas([], '18.1 (Debian 18.1-1.pgdg13+2)'), writesRestrictedScript()],
    });
    await expect(pgRestore(URL_WITH_SECRET, path.join(out, 'in.pgdump'), bin, LIMIT)).rejects.toThrow(
      'The backup was dumped from PostgreSQL 18, newer than the PostgreSQL 17 server it would be restored into; ' +
        'nothing was replaced.',
    );
    expect(readToolCall(psqlLog).args.join(' ')).not.toContain('--single-transaction');
    expect(readdirSync(out)).toEqual([]);
  });

  it.each(['17.6', '14.19'])(
    'PGTOOLS-022b: a dump from %s restores into a PostgreSQL 17 server',
    async (dumpedFrom) => {
      const psqlLog = installFakeTool(bin, 'psql', { version: '18.1', snippets: [answersSchema()] });
      installFakeTool(bin, 'pg_restore', {
        version: '18.1',
        snippets: [listsSchemas([], dumpedFrom), writesRestrictedScript()],
      });
      await pgRestore(URL_WITH_SECRET, path.join(out, 'in.pgdump'), bin, LIMIT);
      expect(readToolCall(psqlLog).args).toContain('--single-transaction');
    },
  );
});
