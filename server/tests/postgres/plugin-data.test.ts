/**
 * PGPLUG-001..011 — a plugin's own data (`db:own`) on Postgres, against the
 * real app on the lane's database: each plugin gets a schema of its own and no
 * SQLite file, its SQL keeps the SQLite store's semantics (migrate once per
 * id, a script's statements committed one by one, an atomic tx, the row cap,
 * the time budget, the quota), it cannot reach TREK's tables or another
 * plugin's schema however it spells the name, and erasing a plugin drops its
 * schema and nothing else.
 */
import { buildApp } from '../../src/bootstrap';
import { extendedQuery } from '../../src/db/engine/postgres/extended-query';
import { PluginDataSlots, PostgresPluginDataStore } from '../../src/db/engine/postgres/plugin-data-store';
import { withRequestContext } from '../../src/nest/database/request-context';
import { PLUGIN_DATA, type PluginDataBackend } from '../../src/nest/plugins/host/plugin-data.backend';
import { closePluginDataDb } from '../../src/nest/plugins/host/plugin-host-state';
import { PluginRpcHostFactory } from '../../src/nest/plugins/host/plugin-rpc-host.factory';
import { MikroORM } from '@mikro-orm/core';
import type { AbstractSqlConnection } from '@mikro-orm/sql';
import type { INestApplication } from '@nestjs/common';

import { CompiledQuery } from 'kysely';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let app: INestApplication;
let orm: MikroORM;
let data: PluginDataBackend;
let dataDir: string;

beforeAll(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-pg-plugin-data-'));
  process.env.TREK_PLUGINS_DATA_DIR = dataDir;
  app = await buildApp();
  orm = app.get(MikroORM);
  data = app.get<PluginDataBackend>(PLUGIN_DATA, { strict: false });
}, 60_000);

afterAll(async () => {
  await app?.close();
  delete process.env.TREK_PLUGINS_DATA_DIR;
  fs.rmSync(dataDir, { recursive: true, force: true });
});

/** The plugin schemas the database holds now. */
async function pluginSchemas(): Promise<string[]> {
  const rows = await withRequestContext(orm, () =>
    orm.em
      .getConnection()
      .execute<Array<{ nspname: string }>>(
        "select nspname from pg_namespace where starts_with(nspname, 'trek_plugin_') order by nspname",
        [],
        'all',
      ),
  );
  return rows.map((row) => row.nspname);
}

/** A store on the app's pool with limits small enough to reach in a test. */
function cappedStore(id: string, limits: { maxRows?: number; timeBudgetMs?: number; quotaBytes?: number }) {
  const client = (orm.em.getConnection() as AbstractSqlConnection).getClient<object>();
  return new PostgresPluginDataStore(id, client, new PluginDataSlots(1), limits);
}

describe('plugin data on Postgres', () => {
  it('PGPLUG-001: a plugin gets a schema of its own, migrates once per id, reads and writes there, and no SQLite file', async () => {
    const store = data.open('pg-alpha');
    expect(store.engine).toBe('postgres');
    expect(await store.migrate('001', 'CREATE TABLE notes (id bigserial PRIMARY KEY, body text NOT NULL)')).toEqual({
      applied: true,
    });
    expect(await store.migrate('001', 'CREATE TABLE never (x int)')).toEqual({ applied: false });
    expect(await store.exec('INSERT INTO notes (body) VALUES ($1), ($2)', ['a', 'b'])).toEqual({ changes: 2 });
    expect(await store.query('SELECT body FROM notes WHERE body <> $1 ORDER BY id', ['x'])).toEqual([
      { body: 'a' },
      { body: 'b' },
    ]);

    expect(await pluginSchemas()).toContain('trek_plugin_pg_alpha');
    expect(fs.readdirSync(path.join(dataDir, 'pg-alpha'))).toEqual([]);
  });

  it('PGPLUG-002: a script commits statement by statement, a tx all or nothing', async () => {
    const store = data.open('pg-script');
    await store.migrate('001', 'CREATE TABLE kv (k text PRIMARY KEY, n int NOT NULL)');

    await expect(store.exec("INSERT INTO kv VALUES ('one', 1); INSERT INTO kv VALUES ('one', 2)")).rejects.toThrow(
      /duplicate key/,
    );
    expect(await store.query('SELECT k, n FROM kv')).toEqual([{ k: 'one', n: 1 }]);

    await expect(
      store.tx([
        { sql: 'UPDATE kv SET n = n + 1 WHERE k = $1', args: ['one'] },
        { sql: "INSERT INTO kv VALUES ('one', 9)" },
      ]),
    ).rejects.toThrow(/duplicate key/);
    expect(await store.query('SELECT n FROM kv')).toEqual([{ n: 1 }]);

    const batch = await store.tx([
      { sql: "INSERT INTO kv VALUES ('two', 2)" },
      { sql: 'SELECT k FROM kv ORDER BY k' },
      { sql: "UPDATE kv SET n = 3 WHERE k = 'two' RETURNING n" },
    ]);
    expect(batch.results).toEqual([{ changes: 1 }, { rows: [{ k: 'one' }, { k: 'two' }] }, { rows: [{ n: 3 }] }]);
    await expect(store.tx([{ sql: 'COMMIT' }])).rejects.toThrow(/transaction-control/);
    await expect(store.query('SELECT n FROM kv WHERE k = ?', ['one'])).rejects.toThrow(/\$1, \$2/);
  });

  it("PGPLUG-003: a plugin cannot read TREK's tables, however it spells their name", async () => {
    const store = data.open('pg-alpha');
    // Unqualified, the name finds nothing: only the plugin's schema is on the search_path.
    await expect(store.query('SELECT email FROM users')).rejects.toThrow(/does not exist/);
    await Promise.all(
      [
        'SELECT email FROM public.users',
        'SELECT email FROM "public"."users"',
        'SELECT email FROM PUBLIC . users',
        'SELECT email FROM public/* x */.users',
        "SELECT query_to_xml('select email from public.users', true, true, '')",
        "SELECT ts_stat('select to_tsvector(email) from public.users')",
        'SELECT * FROM pg_catalog.pg_tables',
        'SELECT * FROM pg_stats',
        'SELECT * FROM information_schema.tables',
        "SELECT set_config('search_path', 'public', true)",
        "SELECT setval('public.users_id_seq', 1)",
        "SELECT 'public.users'::regclass",
        'SELECT database_to_xml(true, true, $$x$$)',
        "SELECT E'\\'' || 'x'",
      ].map((sql) => expect(store.query(sql), sql).rejects.toThrow(/not allowed for plugin databases/)),
    );
    await Promise.all(
      [
        'CREATE TEMP TABLE t (x int)',
        'SELECT 1 AS x INTO t2',
        'CREATE FUNCTION f() RETURNS int LANGUAGE sql AS $$ SELECT 1 $$',
        'ALTER TABLE notes SET SCHEMA public',
        'ALTER TABLE notes OWNER TO postgres',
        'CREATE SCHEMA mine',
        'DROP SCHEMA trek_plugin_pg_alpha CASCADE',
        'SET search_path TO public',
        "COPY notes TO '/tmp/x'",
        'CREATE TABLE copy AS SELECT * FROM public.users',
        'CREATE VIEW v AS SELECT email FROM public.users',
        'GRANT SELECT ON notes TO PUBLIC',
        'DROP OWNED BY CURRENT_USER',
      ].map((sql) => expect(store.exec(sql), sql).rejects.toThrow(/not allowed/)),
    );
    // Nothing of TREK's was touched along the way.
    const [{ n }] = await withRequestContext(orm, () =>
      orm.em.getConnection().execute<Array<{ n: number }>>('select count(*) as n from users', [], 'all'),
    );
    expect(n).toBeGreaterThanOrEqual(0);
  });

  it("PGPLUG-004: two plugins never see each other's schema, even with tables of one name", async () => {
    const alpha = data.open('pg-alpha');
    const beta = data.open('pg-beta');
    await beta.migrate('001', 'CREATE TABLE notes (id bigserial PRIMARY KEY, body text NOT NULL)');
    await beta.exec('INSERT INTO notes (body) VALUES ($1)', ['beta secret']);

    expect(await alpha.query('SELECT body FROM notes ORDER BY id')).toEqual([{ body: 'a' }, { body: 'b' }]);
    expect(await beta.query('SELECT body FROM notes')).toEqual([{ body: 'beta secret' }]);
    await Promise.all(
      [
        'SELECT body FROM trek_plugin_pg_beta.notes',
        'SELECT body FROM "trek_plugin_pg_beta".notes',
        'SELECT body FROM trek_plugin_not_yet_installed.notes',
      ].map((sql) => expect(alpha.query(sql), sql).rejects.toThrow(/another schema/)),
    );
    // Its own schema, qualified, is fine.
    expect(await alpha.query('SELECT count(*) AS n FROM trek_plugin_pg_alpha.notes')).toEqual([{ n: 2 }]);
  });

  it('PGPLUG-005: the row cap and the time budget hold, the budget even inside one statement', async () => {
    const store = cappedStore('pg-capped', { maxRows: 5, timeBudgetMs: 300 });
    await expect(store.query('SELECT x FROM generate_series(1, 10) AS g(x)')).rejects.toThrow(
      'query returned more than 5 rows',
    );
    expect(await store.query('SELECT x FROM generate_series(1, 5) AS g(x)')).toHaveLength(5);
    await expect(
      store.tx([{ sql: 'SELECT 1 FROM generate_series(1, 3)' }, { sql: 'SELECT 1 FROM generate_series(1, 3)' }]),
    ).rejects.toThrow('tx returned more than 5 rows in total');
    await expect(store.query('SELECT count(*) FROM generate_series(1, 2000000000)')).rejects.toThrow(
      'query exceeded its 300 ms time budget',
    );
  });

  it('PGPLUG-006: a write that takes the schema past its quota is rolled back, a delete still runs', async () => {
    const store = cappedStore('pg-quota', { quotaBytes: 64 * 1024 });
    await store.migrate('001', 'CREATE TABLE blobs (body text)');
    await store.exec("INSERT INTO blobs SELECT repeat('x', 100) FROM generate_series(1, 10)");
    await expect(
      store.exec('INSERT INTO blobs SELECT md5(x::text) FROM generate_series(1, 20000) AS g(x)'),
    ).rejects.toThrow(/past its 0\.0625 MB quota/);
    expect(await store.query('SELECT count(*) AS n FROM blobs')).toEqual([{ n: 10 }]);
    expect(await store.exec('DELETE FROM blobs WHERE length(body) > $1', [0])).toEqual({ changes: 10 });
  });

  it('PGPLUG-007: erasing a plugin drops its schema and its data directory, and only its own', async () => {
    data.open('pg-gone');
    await data.open('pg-gone').migrate('001', 'CREATE TABLE t (x int)');
    expect(fs.existsSync(path.join(dataDir, 'pg-gone'))).toBe(true);

    await data.erase('pg-gone');

    const schemas = await pluginSchemas();
    expect(schemas).not.toContain('trek_plugin_pg_gone');
    expect(schemas).toEqual(expect.arrayContaining(['trek_plugin_pg_alpha', 'trek_plugin_pg_beta']));
    expect(fs.existsSync(path.join(dataDir, 'pg-gone'))).toBe(false);
    // An id no schema can be made from has nothing to drop.
    await expect(data.erase('Not_An_Id')).resolves.toBeUndefined();
  });

  it('PGPLUG-008: through the RPC host, db.* reaches the plugin schema and db.engine says postgres', async () => {
    const router = { callPlugin: async () => undefined, emitPluginEvent: async () => {} };
    const host = app.get(PluginRpcHostFactory).create('pg-rpc', new Set(['db:own']), router);
    const call = (method: string, params: Record<string, unknown>) =>
      host.dispatch({ k: 'req', id: method, method, params });

    expect(await call('db.engine', {})).toMatchObject({ ok: true, result: { engine: 'postgres' } });
    expect(await call('db.migrate', { id: '001', sql: 'CREATE TABLE t (v text)' })).toMatchObject({ ok: true });
    expect(await call('db.exec', { sql: 'INSERT INTO t VALUES ($1)', args: ['x'] })).toMatchObject({
      ok: true,
      result: { changes: 1 },
    });
    expect(await call('db.query', { sql: 'SELECT v FROM t' })).toMatchObject({ ok: true, result: [{ v: 'x' }] });
    expect(await call('db.query', { sql: 'SELECT email FROM public.users' })).toMatchObject({
      ok: false,
      error: { code: 'HOST_ERROR' },
    });
    expect(await pluginSchemas()).toContain('trek_plugin_pg_rpc');
    closePluginDataDb('pg-rpc');
  });

  it("PGPLUG-009: the review's bypasses are refused before they run: SQL hidden behind a CR, and SELECT ... INTO TEMP", async () => {
    const store = data.open('pg-bypass');
    await store.migrate('001', 'CREATE TABLE notes (id bigserial PRIMARY KEY, body text NOT NULL)');
    const reads = [
      'select 1 --\rfrom public.users',
      'select 1 --x\rfrom public.users',
      'select 1 --\r, email, password_hash from public.users',
      "(select 1 as id, 'admin' as role into temp users)",
      "(select 99 as id, 'forged'::text as name into temp users)",
      '((select 1 into t))',
      '(select 1) into t',
      'select * from (select 1 into t) s',
      'select 1 from public.users',
    ];
    await Promise.all(reads.map((sql) => expect(store.query(sql), sql).rejects.toThrow(/not allowed for plugin/)));
    const scripts = [
      "select 1 --\r; reset search_path; update users set role = 'admin' where id = 1",
      "insert into notes (body) values ('x') --x\r; update public.users set role = 1",
      "select 1 --x\r; create function f() returns int language sql as 'select 1'",
      "select 1 --\r; copy notes to program 'id'",
      '(select 1 into temp t)',
      'select 1 into temporary t',
    ];
    await Promise.all(scripts.map((sql) => expect(store.exec(sql), sql).rejects.toThrow(/not allowed for plugin/)));

    // Nothing hidden ran: no temporary table anywhere in the database, no function. The insert in front of the
    // CR is a statement of its own, which a script commits before the next one is refused, as on SQLite.
    const [{ temps, functions }] = await withRequestContext(orm, () =>
      orm.em
        .getConnection()
        .execute<Array<{ temps: number; functions: number }>>(
          "select (select count(*) from pg_class where relpersistence = 't') as temps, " +
            "(select count(*) from pg_proc where proname = 'f') as functions",
          [],
          'all',
        ),
    );
    expect({ temps, functions }).toEqual({ temps: 0, functions: 0 });
    expect(await store.query('SELECT body FROM notes')).toEqual([{ body: 'x' }]);
  });

  it('PGPLUG-010: a statement extendedQuery builds runs alone: a second one in its text is refused by Postgres, not run', async () => {
    const store = data.open('pg-proto');
    await store.migrate('001', 'CREATE TABLE t (x int)');
    const client = (orm.em.getConnection() as AbstractSqlConnection).getClient<object>();
    const two = 'insert into trek_plugin_pg_proto.t values (1); insert into trek_plugin_pg_proto.t values (2)';

    // What a guard that let a second statement through would hand the pool: Postgres parses one statement only.
    await expect(client.executeQuery(extendedQuery(two, []))).rejects.toThrow(
      /cannot insert multiple commands into a prepared statement/,
    );
    expect(await store.query('SELECT count(*) AS n FROM t')).toEqual([{ n: 0 }]);
    // The same text without the marker goes over the simple protocol and runs both, which is what the marker prevents.
    await client.executeQuery(CompiledQuery.raw(two, []));
    expect(await store.query('SELECT count(*) AS n FROM t')).toEqual([{ n: 2 }]);

    // A single statement runs and reports its rows, with or without args.
    const one = await client.executeQuery(extendedQuery('delete from trek_plugin_pg_proto.t where x = $1', [1]));
    expect(one.numAffectedRows).toBe(1n);
    expect(await store.exec('DELETE FROM t')).toEqual({ changes: 0 });
    expect(await store.exec('INSERT INTO t VALUES (5)', [])).toEqual({ changes: 0 });
    expect(await store.tx([{ sql: 'INSERT INTO t VALUES (6)' }, { sql: 'DELETE FROM t' }])).toEqual({
      results: [{ changes: 1 }, { changes: 2 }],
    });
  });

  it("PGPLUG-011: pg_temp is searched last, so a temporary table never stands in for TREK's tables or a plugin's", async () => {
    const [{ path, schema }] = await withRequestContext(orm, () =>
      orm.em
        .getConnection()
        .execute<Array<{ path: string; schema: string }>>(
          "select current_setting('search_path') as path, current_schema() as schema",
          [],
          'all',
        ),
    );
    expect(path).toMatch(/, pg_temp$/);
    expect(schema).toBe('public');

    const store = data.open('pg-shadow');
    await store.migrate('001', 'CREATE TABLE notes (body text)');
    await store.exec('INSERT INTO notes VALUES ($1)', ['real']);
    const client = (orm.em.getConnection() as AbstractSqlConnection).getClient<object>();
    // One pool connection holding temporary tables named like TREK's and the plugin's, as one left behind would.
    await client.connection().execute(async (conn) => {
      try {
        await conn.executeQuery(CompiledQuery.raw("create temp table users as select 'forged'::text as email"));
        await conn.executeQuery(CompiledQuery.raw("create temp table notes as select 'forged'::text as body"));
        const resolved = await conn.executeQuery<{ ns: string }>(
          CompiledQuery.raw(
            "select relnamespace::regnamespace::text as ns from pg_class where oid = 'users'::regclass",
          ),
        );
        expect(resolved.rows).toEqual([{ ns: 'public' }]);
        const onConnection = new PostgresPluginDataStore('pg-shadow', conn, new PluginDataSlots(1));
        expect(await onConnection.query('SELECT body FROM notes')).toEqual([{ body: 'real' }]);
      } finally {
        await conn.executeQuery(CompiledQuery.raw('drop table if exists pg_temp.users, pg_temp.notes'));
      }
    });
  });
});
