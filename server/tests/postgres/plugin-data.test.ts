/**
 * PGPLUG-001..021 — a plugin's own data (`db:own`) on Postgres, against the
 * real app on the lane's database: each plugin gets a schema of its own and no
 * SQLite file, its SQL keeps the SQLite store's semantics (migrate once per
 * id, a script's statements committed one by one, an atomic tx, the row cap,
 * the time budget, the quota), it cannot reach TREK's tables or another
 * plugin's schema however it spells the name, every statement runs alone,
 * the pool client a call used goes back without anything the call set, and
 * erasing a plugin drops its schema and nothing else.
 *
 * The lane connects as a superuser, which is exactly the role plugin SQL is
 * refused for (PGPLUG-013). So the stores here run as a role of the test's
 * own that may only create schemas in the database, the role TREK is meant
 * to run as, and the layers behind the role check are also shown to hold on
 * the superuser connection with that check switched off (PGPLUG-014 to 020).
 */
import type { DbSettings } from '../../src/app-config';
import { buildApp } from '../../src/bootstrap';
import { PRIVILEGED_ROLE_PLUGIN_REFUSAL, type PluginRoleGate } from '../../src/db/engine/postgres/plugin-data-checks';
import {
  type ConnectPluginClient,
  PluginDataSlots,
  type PluginSqlClient,
  poolClients,
  PostgresPluginDataStore,
} from '../../src/db/engine/postgres/plugin-data-store';
import { catalogFunctionNames } from '../../src/db/engine/postgres/plugin-sql-functions';
import { TrekPostgreSqlDriver } from '../../src/db/engine/postgres/postgres-driver';
import { putTempSchemaLast } from '../../src/db/engine/postgres/session-search-path';
import { DATABASE_SETTINGS } from '../../src/nest/database/database-engine.module';
import { withRequestContext } from '../../src/nest/database/request-context';
import {
  PLUGIN_DATA,
  PostgresPluginDataBackend,
  type PluginDataBackend,
} from '../../src/nest/plugins/host/plugin-data.backend';
import { closePluginDataDb } from '../../src/nest/plugins/host/plugin-host-state';
import { PluginRpcHostFactory } from '../../src/nest/plugins/host/plugin-rpc-host.factory';
import { withAdmin } from './databases';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import type { DatabaseConnection } from 'kysely';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Cursor from 'pg-cursor';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/** The roles this file creates: cluster-wide, so named after the worker and the process. */
const ROLE = `trek_plugin_lane_${process.env.VITEST_POOL_ID ?? '0'}_${process.pid}`;
const FILE_ROLE = `${ROLE}_files`;
const PASSWORD = 'lane-plugin-role';

let app: INestApplication;
let orm: MikroORM;
/** The app's own backend, on the lane's superuser connection. */
let superData: PluginDataBackend;
/** A backend like the app's, on a pool connected as {@link ROLE}. */
let data: PostgresPluginDataBackend;
let roleOrm: MikroORM;
let fileRoleOrm: MikroORM;
let dataDir: string;

/** The lane's URL for this file's database, as the superuser. */
function superUrl(): string {
  return process.env.TREK_DB_URL as string;
}

/** An ORM on this file's database as `role`, built as the app builds its own (TREK's driver, `pg_temp` last). */
async function ormAs(role: string): Promise<MikroORM> {
  const url = new URL(superUrl());
  url.username = role;
  url.password = PASSWORD;
  return MikroORM.init({
    driver: TrekPostgreSqlDriver,
    clientUrl: url.toString(),
    entities: [],
    discovery: { warnWhenNoEntities: false },
    pool: { min: 0, max: 4 },
    onCreateConnection: (connection: unknown) => putTempSchemaLast(connection as DatabaseConnection),
  });
}

beforeAll(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-pg-plugin-data-'));
  process.env.TREK_PLUGINS_DATA_DIR = dataDir;
  app = await buildApp();
  orm = app.get(MikroORM);
  superData = app.get<PluginDataBackend>(PLUGIN_DATA, { strict: false });
  const database = new URL(superUrl()).pathname.slice(1);
  await withAdmin(superUrl(), (run) =>
    inSequence(
      [
        ...[ROLE, FILE_ROLE].flatMap((role) => [
          `create role "${role}" login password '${PASSWORD}'`,
          `grant create on database "${database}" to "${role}"`,
        ]),
        // Reading server files is one of the privileges the role check counts.
        `grant pg_read_server_files to "${FILE_ROLE}"`,
      ],
      (sql) => run(sql),
    ),
  );
  roleOrm = await ormAs(ROLE);
  fileRoleOrm = await ormAs(FILE_ROLE);
  data = new PostgresPluginDataBackend(roleOrm, app.get<DbSettings>(DATABASE_SETTINGS, { strict: false }));
}, 60_000);

afterAll(async () => {
  await roleOrm?.close(true);
  await fileRoleOrm?.close(true);
  await app?.close();
  await withAdmin(superUrl(), (run) =>
    inSequence(
      [ROLE, FILE_ROLE].flatMap((role) => [`drop owned by "${role}" cascade`, `drop role "${role}"`]),
      (sql) => run(sql),
    ),
  );
  delete process.env.TREK_PLUGINS_DATA_DIR;
  fs.rmSync(dataDir, { recursive: true, force: true });
}, 60_000);

/** `work` for each item, one after the other. */
async function inSequence<T>(items: readonly T[], work: (item: T) => Promise<unknown>): Promise<void> {
  await items.reduce<Promise<unknown>>((previous, item) => previous.then(() => work(item)), Promise.resolve());
}

/** Runs `sql` as the superuser, outside any plugin store. */
async function asSuper<T>(sql: string): Promise<T[]> {
  return withRequestContext(orm, () => orm.em.getConnection().execute<T[]>(sql, [], 'all'));
}

/** The plugin schemas the database holds now. */
async function pluginSchemas(): Promise<string[]> {
  const rows = await asSuper<{ nspname: string }>(
    "select nspname from pg_namespace where starts_with(nspname, 'trek_plugin_') order by nspname",
  );
  return rows.map((row) => row.nspname);
}

/** Clients of the pool connected as {@link ROLE}, as the backend hands them to a store. */
function appClients(): ConnectPluginClient {
  return poolClients(roleOrm.em.getConnection());
}

/** A store as {@link ROLE} with limits small enough to reach in a test. */
function cappedStore(
  id: string,
  limits: { maxRows?: number; timeBudgetMs?: number; quotaBytes?: number; maxObjects?: number },
) {
  return new PostgresPluginDataStore(id, appClients(), new PluginDataSlots(1), limits);
}

/** No role check: what the layers behind it hold on their own. */
const NO_ROLE_CHECK: PluginRoleGate = { refuseIfPrivileged: async () => undefined };

/** A store on the lane's superuser connection with the role check switched off. */
function superuserStore(id: string, limits: { quotaBytes?: number; maxObjects?: number } = {}) {
  return new PostgresPluginDataStore(
    id,
    poolClients(orm.em.getConnection()),
    new PluginDataSlots(1),
    limits,
    NO_ROLE_CHECK,
  );
}

/** `client` for every call of a store, kept checked out by the test: a release only records whether it would close it. */
function keep(client: PluginSqlClient, released: boolean[] = []): ConnectPluginClient {
  return async () =>
    ({
      query: (arg: never) => client.query(arg),
      release: (destroy?: boolean) => released.push(destroy === true),
    }) as unknown as PluginSqlClient;
}

/**
 * Pool clients that hand Postgres `swap[text]` in place of a plugin statement
 * whose text is `text`, as a store would if the guard let a second statement
 * through: as an extended query or as a cursor, whichever the store sends.
 */
function smuggling(swap: Record<string, string>): ConnectPluginClient {
  const connect = appClients();
  return async () => {
    const client = await connect();
    const query = (arg: unknown): unknown => {
      if (arg instanceof Cursor) {
        const cursor = arg as unknown as { text: string };
        cursor.text = swap[cursor.text] ?? cursor.text;
        return client.query(arg);
      }
      const config = arg as { text?: unknown; values: unknown[] };
      if (typeof config.text === 'string' && swap[config.text]) {
        return client.query({ ...config, text: swap[config.text] });
      }
      return client.query(arg as never);
    };
    return { query, release: (destroy?: boolean) => client.release(destroy) } as unknown as PluginSqlClient;
  };
}

/** Whether the catalog type `name` still exists under that name. */
async function catalogType(name: string): Promise<boolean> {
  const rows = await asSuper<{ n: number }>(
    `select count(*) as n from pg_type t join pg_namespace n on n.oid = t.typnamespace ` +
      `where n.nspname = 'pg_catalog' and t.typname = '${name}'`,
  );
  return Number(rows[0].n) === 1;
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
    const [{ n }] = await asSuper<{ n: number }>('select count(*) as n from users');
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

  it('PGPLUG-008: through the RPC host, db.engine says postgres and db.* answers the role refusal on a superuser', async () => {
    const router = { callPlugin: async () => undefined, emitPluginEvent: async () => {} };
    const host = app.get(PluginRpcHostFactory).create('pg-rpc', new Set(['db:own']), router);
    const call = (method: string, params: Record<string, unknown>) =>
      host.dispatch({ k: 'req', id: method, method, params });

    expect(await call('db.engine', {})).toMatchObject({ ok: true, result: { engine: 'postgres' } });
    const answers = await Promise.all([
      call('db.migrate', { id: '001', sql: 'CREATE TABLE t (v text)' }),
      call('db.exec', { sql: 'INSERT INTO t VALUES ($1)', args: ['x'] }),
      call('db.query', { sql: 'SELECT 1' }),
    ]);
    const refused = { ok: false, error: { code: 'HOST_ERROR', message: PRIVILEGED_ROLE_PLUGIN_REFUSAL } };
    expect(answers).toMatchObject([refused, refused, refused]);
    expect(await pluginSchemas()).not.toContain('trek_plugin_pg_rpc');
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
      'select 1 from public.users',
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
    const [{ temps, functions }] = await asSuper<{ temps: number; functions: number }>(
      "select (select count(*) from pg_class where relpersistence = 't') as temps, " +
        "(select count(*) from pg_proc where proname = 'f') as functions",
    );
    expect({ temps, functions }).toEqual({ temps: 0, functions: 0 });
    expect(await store.query('SELECT body FROM notes')).toEqual([{ body: 'x' }]);
  });

  it('PGPLUG-010: every plugin statement runs alone: a second one smuggled into its text is refused by Postgres, not run', async () => {
    const store = data.open('pg-proto');
    await store.migrate('001', 'CREATE TABLE t (x int)');
    const two = 'insert into trek_plugin_pg_proto.t values (1); insert into trek_plugin_pg_proto.t values (2)';

    // What the store would hand Postgres if the guard let a second statement through, as a write and as a read.
    const fooled = new PostgresPluginDataStore(
      'pg-proto',
      smuggling({ 'INSERT INTO t VALUES (7)': two, 'SELECT x FROM t': `select x from t; ${two}` }),
      new PluginDataSlots(1),
    );
    await expect(fooled.exec('INSERT INTO t VALUES (7)')).rejects.toThrow(
      /cannot insert multiple commands into a prepared statement/,
    );
    await expect(fooled.exec('INSERT INTO t VALUES (7)', [])).rejects.toThrow(/cannot insert multiple commands/);
    await expect(fooled.tx([{ sql: 'INSERT INTO t VALUES (7)' }])).rejects.toThrow(/cannot insert multiple commands/);
    await expect(fooled.query('SELECT x FROM t')).rejects.toThrow(/cannot insert multiple commands/);
    expect(await store.query('SELECT count(*) AS n FROM t')).toEqual([{ n: 0 }]);

    // The same text over the simple protocol runs both, which is what sending each statement extended prevents.
    const client = await appClients()();
    try {
      await client.query(two);
    } finally {
      client.release();
    }
    expect(await store.query('SELECT count(*) AS n FROM t')).toEqual([{ n: 2 }]);

    // A single statement runs and reports its rows, with or without args.
    expect(await store.exec('DELETE FROM t WHERE x = $1', [1])).toEqual({ changes: 1 });
    expect(await store.exec('DELETE FROM t')).toEqual({ changes: 0 });
    expect(await store.exec('INSERT INTO t VALUES (5)', [])).toEqual({ changes: 0 });
    expect(await store.tx([{ sql: 'INSERT INTO t VALUES (6)' }, { sql: 'DELETE FROM t' }])).toEqual({
      results: [{ changes: 1 }, { changes: 2 }],
    });
  });

  it("PGPLUG-011: pg_temp is searched last, so a temporary table never stands in for TREK's tables or a plugin's", async () => {
    const [{ path: searchPath, schema }] = await asSuper<{ path: string; schema: string }>(
      "select current_setting('search_path') as path, current_schema() as schema",
    );
    expect(searchPath).toMatch(/, pg_temp$/);
    expect(schema).toBe('public');

    const store = data.open('pg-shadow');
    await store.migrate('001', 'CREATE TABLE notes (body text)');
    await store.exec('INSERT INTO notes VALUES ($1)', ['real']);
    // A pool client holding temporary tables named like TREK's and the plugin's, as one left behind would.
    const client = await appClients()();
    try {
      await client.query("create temp table users as select 'forged'::text as email");
      await client.query("create temp table notes as select 'forged'::text as body");
      const released: boolean[] = [];
      const onClient = new PostgresPluginDataStore('pg-shadow', keep(client, released), new PluginDataSlots(1));
      expect(await onClient.query('SELECT body FROM notes')).toEqual([{ body: 'real' }]);
      // Nor can the plugin reach them, or change them, by naming the temporary schema.
      await expect(onClient.query('SELECT body FROM pg_temp.notes')).rejects.toThrow(/"pg_temp" may not be named/);
      // The call dropped them with the rest of the session's state before it gave the client back.
      const temps = await client.query(
        "select count(*)::int as n from pg_class where relpersistence = 't' and relnamespace = pg_my_temp_schema()",
      );
      expect(temps.rows).toEqual([{ n: 0 }]);
      expect(released).toEqual([false]);
    } finally {
      await client.query('drop table if exists pg_temp.users, pg_temp.notes');
      client.release();
    }
  });

  it('PGPLUG-012: a call leaves nothing it set on the pool client it used, a cancelled one neither', async () => {
    const store = data.open('pg-session');
    await store.migrate('001', 'CREATE TABLE notes (body text)');
    const settings =
      "select current_setting('search_path') as path, current_setting('statement_timeout') as timeout, " +
      "current_setting('standard_conforming_strings') as strings, now() = statement_timestamp() as outside";
    const client = await appClients()();
    try {
      const before = await client.query(settings);
      const released: boolean[] = [];
      const onClient = new PostgresPluginDataStore('pg-session', keep(client, released), new PluginDataSlots(1), {
        timeBudgetMs: 300,
      });
      await onClient.tx([{ sql: "INSERT INTO notes VALUES ('a')" }, { sql: 'SELECT body FROM notes' }]);
      await expect(onClient.query('SELECT count(*) FROM generate_series(1, 2000000000)')).rejects.toThrow(
        'query exceeded its 300 ms time budget',
      );
      await onClient.migrate('002', 'CREATE INDEX notes_body ON notes (body)');
      // Same search_path and settings as before, and no transaction left open (now() moves with each statement).
      expect((await client.query(settings)).rows).toEqual(before.rows);
      expect(released).toEqual([false, false, false]);
    } finally {
      client.release();
    }
  });

  it('PGPLUG-013: on a privileged role every db:own call is refused with the reason, before anything is created', async () => {
    // The lane's own connection is a superuser: the app's backend refuses it.
    const store = superData.open('pg-privileged');
    await Promise.all(
      [
        store.migrate('001', 'CREATE TABLE t (x int)'),
        store.exec('CREATE TABLE t (x int)'),
        store.query('SELECT 1'),
        store.tx([{ sql: 'SELECT 1' }]),
      ].map((call) => expect(call).rejects.toThrow(PRIVILEGED_ROLE_PLUGIN_REFUSAL)),
    );
    // A role that may read the server's files is refused as well.
    const settings = app.get<DbSettings>(DATABASE_SETTINGS, { strict: false });
    const files = new PostgresPluginDataBackend(fileRoleOrm, settings).open('pg-files');
    await expect(files.query('SELECT 1')).rejects.toThrow(/db:own\) are refused on Postgres while TREK_DB_URL/);
    const schemas = await pluginSchemas();
    expect(schemas).not.toContain('trek_plugin_pg_privileged');
    expect(schemas).not.toContain('trek_plugin_pg_files');
  });

  // The re-review's escape: an unqualified ALTER TYPE renamed pg_catalog's types for the whole database.
  const CATALOG_TARGETS = [
    'alter type int4 rename to int4x',
    'alter type text rename to evil',
    'alter type cstring rename to foo',
    'alter type box rename to boxx',
    'ALTER TYPE "int4" RENAME TO x',
    'alter type timestamptz owner to current_user',
    'drop type if exists box cascade',
    'drop type int4, text',
  ];

  it('PGPLUG-014: ALTER and DROP of a catalog type are refused by where Postgres resolves it, on a superuser too', async () => {
    const refused = /schema "pg_catalog"; a plugin changes its own objects only|may not change the owner/;
    await Promise.all(
      [data.open('pg-types'), superuserStore('pg-types-su')].map(async (store) => {
        await Promise.all(CATALOG_TARGETS.map((sql) => expect(store.exec(sql), sql).rejects.toThrow(refused)));
        // TREK's own tables are not on the plugin's path, so a name of theirs resolves to nothing there.
        await expect(store.exec('drop table users')).rejects.toThrow(/does not exist/);
        await expect(store.exec('drop table if exists users, trips cascade')).resolves.toEqual({ changes: 0 });
        await expect(store.exec('truncate users')).rejects.toThrow(/does not exist/);
        await expect(store.exec('create index evil on users (email)')).rejects.toThrow(/does not exist/);
        await expect(store.exec('create table kid (x int) inherits (users)')).rejects.toThrow(/does not exist/);
      }),
    );
    const names = ['int4', 'text', 'cstring', 'box', 'timestamptz'];
    expect(await Promise.all(names.map(catalogType))).toEqual(names.map(() => true));
    expect(await asSuper('select 1::int4 as one, 1::text as two')).toEqual([{ one: 1, two: '1' }]);
    expect((await asSuper<{ n: number }>("select count(*) as n from pg_class where relname = 'users'"))[0].n).toBe(1);
  });

  it('PGPLUG-015: a plugin still changes its own objects of every kind', async () => {
    const own = async (store: PostgresPluginDataStore | ReturnType<PluginDataBackend['open']>) => {
      await store.exec(
        "CREATE TYPE mood AS ENUM ('ok'); ALTER TYPE mood ADD VALUE 'sad'; ALTER TYPE mood RENAME TO feeling; " +
          'CREATE TABLE t (id bigserial PRIMARY KEY, f feeling, temp real); CREATE TABLE kid (y int) INHERITS (t); ' +
          'CREATE TABLE r (t_id bigint REFERENCES t (id)); CREATE INDEX t_f ON t (f); ALTER INDEX t_f RENAME TO t_g; ' +
          'CREATE MATERIALIZED VIEW mv AS SELECT count(*) AS n FROM t; REFRESH MATERIALIZED VIEW mv; ' +
          'ALTER TABLE t ADD COLUMN z int; CREATE SEQUENCE s; ALTER SEQUENCE s RESTART WITH 5; ' +
          'TRUNCATE r, kid; DROP TABLE r; DROP MATERIALIZED VIEW mv; DROP SEQUENCE s',
      );
      await store.exec("INSERT INTO t (f, temp) VALUES ('sad', 21.5)");
      expect(await store.query('SELECT f, temp FROM t ORDER BY temp')).toEqual([{ f: 'sad', temp: 21.5 }]);
      await store.exec('DROP TABLE kid; DROP TABLE t; DROP TYPE feeling');
    };
    await Promise.all([own(data.open('pg-own')), own(superuserStore('pg-own-su'))]);
  });

  it('PGPLUG-016: the quota counts every relation, sequences and TOAST included, and the object cap catalog-only objects', async () => {
    const sequences = cappedStore('pg-seq', { quotaBytes: 64 * 1024 });
    const script = Array.from({ length: 20 }, (_, i) => `CREATE SEQUENCE s${i}`).join('; ');
    await expect(sequences.exec(script)).rejects.toThrow(/past its 0\.0625 MB quota/);
    const [{ made }] = await asSuper<{ made: number }>(
      'select count(*) as made from pg_class c join pg_namespace n on n.oid = c.relnamespace ' +
        "where n.nspname = 'trek_plugin_pg_seq' and c.relkind = 'S'",
    );
    expect(made).toBeGreaterThan(0);
    expect(made).toBeLessThan(20);

    const toast = cappedStore('pg-toast', { quotaBytes: 64 * 1024 });
    await toast.migrate('001', 'CREATE TABLE big (body text)');
    await expect(
      toast.exec("INSERT INTO big SELECT string_agg(md5(random()::text), '') FROM generate_series(1, 8000)"),
    ).rejects.toThrow(/past its 0\.0625 MB quota/);

    const views = Array.from({ length: 30 }, (_, i) => `CREATE VIEW v${i} AS SELECT ${i} AS n`).join('; ');
    const capped = async (store: PostgresPluginDataStore) => {
      await expect(store.exec(views)).rejects.toThrow(/holds more than 40 catalog objects/);
      await expect(store.exec("CREATE TYPE e AS ENUM ('a')")).rejects.toThrow(/holds more than 40 catalog objects/);
      // At the cap, dropping still works.
      await expect(store.exec('DROP VIEW v0')).resolves.toEqual({ changes: 0 });
    };
    await Promise.all([
      capped(cappedStore('pg-objects', { maxObjects: 40 })),
      capped(superuserStore('pg-objects-su', { maxObjects: 40 })),
    ]);
  });

  it('PGPLUG-017: the reg* types and the functions that look objects up by name are refused in every spelling', async () => {
    const payloads = [
      "select 'public.users'::regtype::oid",
      "select cast('public.users' as regtype)",
      "select regtype 'public.users'",
      `select 'public.users'::"regtype"`,
      "select 'english'::regconfig",
      "select 'simple'::regdictionary",
      "select '{public.users}'::_regclass",
      "select has_table_privilege('public.users', 'select')",
      "select currtid2('public.users', '(0,1)')",
      "select to_regtype('public.users')",
    ];
    const stores = [data.open('pg-reg'), superuserStore('pg-reg-su')];
    await Promise.all(
      stores.flatMap((store) =>
        payloads.map((sql) => expect(store.query(sql), sql).rejects.toThrow(/may not be named/)),
      ),
    );
  });

  it('PGPLUG-018: INTO makes no table unless INSERT or MERGE is the verb, whatever a column alias is called', async () => {
    const aliases = ['select 1 insert into t1', 'select 1 merge into t9', 'select 1 insert into unlogged t10'];
    const into = async (store: PostgresPluginDataStore | ReturnType<PluginDataBackend['open']>, schema: string) => {
      await store.migrate('001', 'CREATE TABLE notes (id bigserial PRIMARY KEY, body text)');
      await Promise.all(
        aliases.map((sql) => expect(store.exec(sql), sql).rejects.toThrow(/SELECT \.\.\. INTO is not allowed/)),
      );
      const [{ made }] = await asSuper<{ made: number }>(
        `select count(*) as made from pg_class c join pg_namespace n on n.oid = c.relnamespace ` +
          `where n.nspname = '${schema}' and c.relname in ('t1', 't9', 't10')`,
      );
      expect(made).toBe(0);
      // INSERT INTO as the verb, after a WITH clause and inside one, still writes.
      await store.exec("WITH x AS (SELECT 'a' AS b) INSERT INTO notes (body) SELECT b FROM x");
      expect(
        await store.query("WITH n AS (INSERT INTO notes (body) VALUES ('b') RETURNING id) SELECT count(*) AS n FROM n"),
      ).toEqual([{ n: 1 }]);
      expect(await store.query('SELECT body FROM notes ORDER BY id')).toEqual([{ body: 'a' }, { body: 'b' }]);
    };
    await Promise.all([
      into(data.open('pg-into'), 'trek_plugin_pg_into'),
      into(superuserStore('pg-into-su'), 'trek_plugin_pg_into_su'),
    ]);
  });

  it('PGPLUG-019: TEMP is refused where it makes a temporary object, and a column named temp works again', async () => {
    const store = data.open('pg-temp');
    await Promise.all(
      [
        'CREATE TEMP TABLE t (x int)',
        'CREATE LOCAL TEMPORARY TABLE t (x int)',
        'CREATE OR REPLACE TEMP VIEW v AS SELECT 1',
        'CREATE TEMPORARY SEQUENCE s',
        'select 1 into temp t',
        '(select 1 as id into temporary users)',
      ].map((sql) => expect(store.exec(sql), sql).rejects.toThrow(/not allowed/)),
    );
    await store.migrate('001', 'CREATE TABLE readings (day text, temp real)');
    await store.exec('INSERT INTO readings (day, temp) VALUES ($1, $2), ($3, $4)', ['mon', 21.5, 'tue', 18]);
    expect(await store.query('SELECT day, temp FROM readings WHERE temp > 1 ORDER BY temp')).toEqual([
      { day: 'tue', temp: 18 },
      { day: 'mon', temp: 21.5 },
    ]);
    const [{ temps }] = await asSuper<{ temps: number }>(
      "select count(*) as temps from pg_class where relpersistence = 't'",
    );
    expect(temps).toBe(0);
  });

  it('PGPLUG-020: a NUL in an argument or in the SQL is refused with the reason, and nothing is stored', async () => {
    const store = data.open('pg-nul');
    await store.migrate('001', 'CREATE TABLE kv (k text PRIMARY KEY)');
    const reason = /U\+0000 \(NUL\), which Postgres text cannot store/;
    await expect(store.exec('INSERT INTO kv VALUES ($1)', ['a\u0000b'])).rejects.toThrow(reason);
    await expect(store.query('SELECT k FROM kv WHERE k = $1', ['ab\u0000'])).rejects.toThrow(reason);
    await expect(store.tx([{ sql: 'INSERT INTO kv VALUES ($1)', args: [['x', '\u0000']] }])).rejects.toThrow(reason);
    await expect(store.migrate('002\u0000', 'CREATE TABLE more (x int)')).rejects.toThrow(reason);
    await expect(store.exec("INSERT INTO kv VALUES ('a\u0000b')")).rejects.toThrow(/U\+0000 \(NUL\)/);
    expect(await store.query('SELECT count(*) AS n FROM kv')).toEqual([{ n: 0 }]);
    // Binary data with a zero byte goes to bytea.
    await store.migrate('003', 'CREATE TABLE raw (b bytea)');
    await store.exec('INSERT INTO raw VALUES ($1)', [Buffer.from([1, 0, 2])]);
    expect(await store.query('SELECT length(b) AS n FROM raw')).toEqual([{ n: 3 }]);
  });

  it("PGPLUG-021: a plugin calls only the catalog's functions on the allowlist, and every function of this server is listed", async () => {
    const rows = await asSuper<{ proname: string }>(
      "select distinct proname from pg_proc where pronamespace = 'pg_catalog'::regnamespace",
    );
    const unlisted = rows.map((row) => row.proname).filter((name) => !catalogFunctionNames().has(name));
    expect(
      unlisted,
      'These functions of this Postgres are missing from server/assets/postgres/catalog-functions.txt. ' +
        'Add each name there (one per line, keep it sorted), and to PLUGIN_FUNCTIONS in ' +
        'src/db/engine/postgres/plugin-sql-functions.ts only if it works on its arguments alone ' +
        'and reads neither the catalogs nor the server.',
    ).toEqual([]);

    await asSuper("comment on table users is 'catalog comment the plugin must not read'");
    const [{ oid }] = await asSuper<{ oid: number }>("select 'public.users'::regclass::oid::int8 as oid");
    const store = data.open('pg-catalog');
    await store.migrate('001', 'CREATE TABLE version (id bigserial PRIMARY KEY, body text NOT NULL)');
    await Promise.all(
      [
        `select obj_description(${oid})`,
        `select obj_description(${oid}, 'pg_class')`,
        `select col_description(${oid}, 1)`,
        `select (${oid}::oid).obj_description`,
        `select "obj_description"(${oid})`,
        "select shobj_description(10, 'pg_authid')",
        `select format_type(${oid}, null)`,
        'select version()',
        'select current_database()',
        'select inet_server_addr()',
        'select current_user',
        'select session_user',
        'select current_catalog',
      ].map((sql) => expect(store.query(sql), sql).rejects.toThrow(/a plugin may not (call|read)/)),
    );
    // A table named like a refused function, and the functions a plugin needs, still work.
    await store.exec('INSERT INTO version (body) VALUES ($1), ($2)', ['Alpha', 'beta']);
    expect(
      await store.query(
        "SELECT lower(body) AS b, length(body) AS n, jsonb_build_object('k', id)->>'k' AS k, " +
          "to_char(date_trunc('day', now()), 'YYYY') <> '' AS d, gen_random_uuid() IS NOT NULL AS u " +
          'FROM version ORDER BY id',
      ),
    ).toEqual([
      { b: 'alpha', n: 5, k: '1', d: true, u: true },
      { b: 'beta', n: 4, k: '2', d: true, u: true },
    ]);
    await asSuper('comment on table users is null');
  });
});
