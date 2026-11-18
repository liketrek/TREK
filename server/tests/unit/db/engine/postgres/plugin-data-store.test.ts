/**
 * The Postgres store of a plugin's own data
 * (src/db/engine/postgres/plugin-data-store.ts) against a stand-in `pg`
 * client that records what it is handed: the client every call checks out
 * and releases, the transaction it opens and what it sets first, the schema
 * check before plugin SQL runs, the row cap, the time budget, the quota, a
 * script committed statement by statement, the tx and migrate shapes, one
 * call at a time per plugin, the protocol every plugin statement goes over,
 * and the session cleanup before a client goes back to the pool. The same
 * store on a real database is the Postgres lane's
 * tests/postgres/plugin-data.test.ts.
 */
import {
  PLUGIN_DATA_ERRORS,
  PLUGIN_SQL_NUL_REFUSAL,
  PLUGIN_VALUE_NUL_REFUSAL,
} from '../../../../../src/db/engine/plugin-data-contract';
import { PRIVILEGED_ROLE_PLUGIN_REFUSAL } from '../../../../../src/db/engine/postgres/plugin-data-checks';
import {
  dropPluginSchema,
  END_SESSION,
  PluginDataSlots,
  poolClients,
  PostgresPluginDataStore,
  type PluginSqlClient,
} from '../../../../../src/db/engine/postgres/plugin-data-store';
import { PLUGIN_SESSION_SETTINGS } from '../../../../../src/db/engine/postgres/plugin-session';
import { PRIVILEGED_ROLE_SQL } from '../../../../../src/db/engine/postgres/server-checks';

import type { Kysely } from 'kysely';
import Cursor from 'pg-cursor';
import { describe, expect, it } from 'vitest';

interface FakeOptions {
  /** The schemas pg_namespace answers. */
  schemas?: string[];
  /** The sizes the quota reads answer, in order. */
  sizes?: number[];
  /** The catalog object counts the quota reads answer, in order. */
  objects?: number[];
  /** Whether the role check answers that TREK's role is privileged. */
  privileged?: boolean;
  /** The objects the target check finds outside the plugin's schema. */
  foreign?: Array<{ name: string; nspname: string }>;
  /** Rows a cursor yields, by its statement's text; read two at a time. */
  rows?: Record<string, unknown[]>;
  /** What a write reports as changed. */
  changes?: number;
  /** Whether the migration id is recorded already. */
  migrated?: boolean;
  /** An error for a statement, or undefined to run it. */
  fail?: (sql: string) => Error | undefined;
  /** Called before every chunk a cursor reads, so a test can move its clock. */
  onChunk?: () => void;
  /** Awaited before a cursor's first read. */
  beforeStream?: (sql: string) => Promise<void>;
}

/** What a plugin statement or a query with values was handed to the client as. */
interface QueryConfig {
  text: string;
  values: unknown[];
  queryMode?: 'extended';
}

/**
 * A pool of stand-in `pg` clients. `log` holds every statement's text in the
 * order the clients ran them (`begin`, `commit`, `rollback` and the session
 * cleanup among them), `configs` every query handed over as a config object,
 * `cursors` every cursor submitted, `releases` whether each client was
 * released to be closed.
 */
function fakePool(options: FakeOptions = {}) {
  const log: string[] = [];
  const configs: QueryConfig[] = [];
  const cursors: Array<{ text: string; values: unknown[] | null; closed: boolean }> = [];
  const releases: boolean[] = [];
  let size = 0;
  let objects = 0;
  const run = (sql: string) => {
    log.push(sql);
    const err = options.fail?.(sql);
    if (err) throw err;
  };
  const answer = (sql: string) => {
    if (sql.startsWith('select nspname')) return { rows: (options.schemas ?? []).map((nspname) => ({ nspname })) };
    if (sql.startsWith('select (exists')) return { rows: [{ privileged: options.privileged === true }], rowCount: 1 };
    if (sql.startsWith('select t.name')) return { rows: options.foreign ?? [], rowCount: 0 };
    if (sql.startsWith('select coalesce((select sum(')) {
      return {
        rows: [{ bytes: options.sizes?.[size++] ?? 0, objects: options.objects?.[objects++] ?? 0 }],
        rowCount: 1,
      };
    }
    if (sql.startsWith('select 1 from')) return { rows: options.migrated ? [{ '?column?': 1 }] : [], rowCount: 0 };
    return { rows: [], rowCount: options.changes ?? 0 };
  };
  const cursorOf = (cursor: Cursor) => {
    const { text, values } = cursor as unknown as { text: string; values: unknown[] | null };
    const seen = { text, values, closed: false };
    cursors.push(seen);
    let next: number | null = null;
    return {
      async read(): Promise<unknown[]> {
        if (next === null) {
          await options.beforeStream?.(text);
          run(text);
          next = 0;
        }
        const rows = options.rows?.[text] ?? [];
        if (next >= rows.length) return [];
        options.onChunk?.();
        next += 2;
        return rows.slice(next - 2, next);
      },
      async close(): Promise<void> {
        seen.closed = true;
      },
    };
  };
  const client = {
    query(arg: string | QueryConfig | Cursor): unknown {
      if (arg instanceof Cursor) return cursorOf(arg);
      const sql = typeof arg === 'string' ? arg : arg.text;
      if (typeof arg !== 'string') configs.push(arg);
      return (async () => {
        run(sql);
        return answer(sql);
      })();
    },
    release(destroy?: boolean) {
      releases.push(destroy === true);
    },
  };
  const connect = async () => client as unknown as PluginSqlClient;
  return { connect, log, configs, cursors, releases };
}

function store(options: FakeOptions = {}, limits = {}) {
  const pool = fakePool(options);
  return { ...pool, store: new PostgresPluginDataStore('notes', pool.connect, new PluginDataSlots(4), limits) };
}

/** The role check every first call on a client runs before its transaction. */
const ROLE_CHECK = `select (${PRIVILEGED_ROLE_SQL}) as privileged`;

/** A pg error with its SQLSTATE. */
function pgError(code: string, message: string): Error {
  return Object.assign(new Error(message), { code });
}

describe('Postgres plugin data store', () => {
  it('PGSTORE-001: a query runs in a transaction that makes the schema, scopes the search_path, pins the settings and sets the budget', async () => {
    const { store: s, log } = store({
      rows: { 'SELECT body FROM notes': [{ body: 'a' }, { body: 'b' }, { body: 'c' }] },
    });
    expect(s.engine).toBe('postgres');
    expect(await s.query('SELECT body FROM notes')).toEqual([{ body: 'a' }, { body: 'b' }, { body: 'c' }]);
    expect(log).toEqual([
      ROLE_CHECK,
      'begin',
      [
        'create schema if not exists "trek_plugin_notes"',
        'create table if not exists "trek_plugin_notes"._plugin_migrations (id text primary key, applied_at bigint)',
        'set local search_path to "trek_plugin_notes", pg_temp',
        "set local TimeZone to 'UTC'",
        "set local DateStyle to 'ISO, MDY'",
        "set local IntervalStyle to 'postgres'",
        "set local timezone_abbreviations to 'Default'",
        "set local lc_monetary to 'C'",
        "set local lc_numeric to 'C'",
        "set local lc_time to 'C'",
        "set local extra_float_digits to '1'",
        "set local bytea_output to 'hex'",
        "set local xmlbinary to 'base64'",
        "set local xmloption to 'content'",
        "set local default_text_search_config to 'pg_catalog.simple'",
        "set local standard_conforming_strings to 'on'",
        "set local backslash_quote to 'safe_encoding'",
        "set local array_nulls to 'on'",
        "set local transform_null_equals to 'off'",
        "set local quote_all_identifiers to 'off'",
        "set local gin_fuzzy_search_limit to '0'",
        'set local statement_timeout to 2000',
      ].join(';\n'),
      'SELECT body FROM notes',
      'commit',
      END_SESSION,
    ]);
  });

  it('PGSTORE-020: every pinned setting is a plain name and value, set with SET LOCAL', () => {
    for (const [name, value] of Object.entries(PLUGIN_SESSION_SETTINGS)) {
      expect(name).toMatch(/^[A-Za-z_]+$/);
      expect(value).not.toMatch(/['\\]/);
    }
  });

  it("PGSTORE-002: a qualified name is checked against the database's schemas before the statement runs", async () => {
    const { store: s, log } = store({ schemas: ['public', 'auth', 'trek_plugin_notes'] });
    await expect(s.query('SELECT x FROM auth.secret')).rejects.toThrow(/"auth" is another schema/);
    expect(log).not.toContain('SELECT x FROM auth.secret');
    expect(log.slice(-2)).toEqual(['rollback', END_SESSION]);
    await expect(s.query('SELECT n.body FROM trek_plugin_notes.notes n')).resolves.toEqual([]);
    await expect(s.query('SELECT * FROM public.users')).rejects.toThrow(/another schema/);
  });

  it('PGSTORE-003: a read stops past the row cap, and a tx shares one count over the batch', async () => {
    const rows = Array.from({ length: 7 }, (_, i) => ({ i }));
    const { store: s } = store({ rows: { 'SELECT i FROM t': rows, 'SELECT 1': [{}, {}, {}] } }, { maxRows: 5 });
    await expect(s.query('SELECT i FROM t')).rejects.toThrow('query returned more than 5 rows');
    await expect(s.tx([{ sql: 'SELECT 1' }, { sql: 'SELECT 1' }])).rejects.toThrow(
      'tx returned more than 5 rows in total',
    );
  });

  it('PGSTORE-004: the budget is read between chunks, and a statement cancelled at statement_timeout reports it', async () => {
    let clock = 0;
    const rows = Array.from({ length: 6 }, (_, i) => ({ i }));
    const slow = store(
      { rows: { 'SELECT i FROM t': rows }, onChunk: () => (clock += 60) },
      {
        timeBudgetMs: 100,
        now: () => clock,
      },
    );
    await expect(slow.store.query('SELECT i FROM t')).rejects.toThrow('query exceeded its 100 ms time budget');

    const cancelled = store({
      fail: (sql) =>
        sql.startsWith('UPDATE') ? pgError('57014', 'canceling statement due to statement timeout') : undefined,
    });
    await expect(cancelled.store.exec('UPDATE t SET x = $1', [1])).rejects.toThrow(
      'exec exceeded its 2000 ms time budget',
    );
    const other = store({ fail: (sql) => (sql.startsWith('UPDATE') ? pgError('23505', 'duplicate key') : undefined) });
    await expect(other.store.exec('UPDATE t SET x = $1', [1])).rejects.toThrow('duplicate key');
  });

  it('PGSTORE-005: a write that grows the schema past the quota rolls back; one that does not grow it runs', async () => {
    const grows = store({ sizes: [100, 2048], changes: 1 }, { quotaBytes: 1024 });
    await expect(grows.store.exec('INSERT INTO t VALUES ($1)', ['x'])).rejects.toThrow(
      'the plugin database is past its 0.0009765625 MB quota',
    );
    expect(grows.log.slice(-2)).toEqual(['rollback', END_SESSION]);

    const shrinks = store({ sizes: [4096, 4096], changes: 3 }, { quotaBytes: 1024 });
    expect(await shrinks.store.exec('DELETE FROM t WHERE x = $1', ['x'])).toEqual({ changes: 3 });

    const reads = store({}, { quotaBytes: 1 });
    await reads.store.query('SELECT 1');
    expect(reads.log.some((sql) => sql.startsWith('select coalesce((select sum('))).toBe(false);
  });

  it('PGSTORE-006: a script commits statement by statement and stops at the first that fails', async () => {
    const { store: s, log } = store({
      fail: (sql) => (sql.startsWith('INSERT INTO b') ? new Error('boom') : undefined),
    });
    await expect(
      s.exec('INSERT INTO a VALUES (1); INSERT INTO b VALUES (2); INSERT INTO c VALUES (3)'),
    ).rejects.toThrow('boom');
    const ends = log.filter((sql) => sql === 'commit' || sql === 'rollback');
    expect(ends).toEqual(['commit', 'rollback']);
    expect(log).not.toContain('INSERT INTO c VALUES (3)');

    const ok = store({ changes: 1, rows: { 'SELECT 1 FROM t': [{}, {}] } });
    expect(await ok.store.exec('INSERT INTO a VALUES (1); SELECT 1 FROM t')).toEqual({ changes: 0 });
    expect(await ok.store.exec('INSERT INTO a VALUES ($1)', [1])).toEqual({ changes: 1 });
    expect(await ok.store.exec('SELECT 1 FROM t', [1])).toEqual({ changes: 0 });
  });

  it('PGSTORE-007: a tx returns rows or changes per statement, and gives each later one what is left of the budget', async () => {
    const { store: s, log } = store({ changes: 2, rows: { 'SELECT k FROM kv': [{ k: 'a' }] } });
    const batch = await s.tx([
      { sql: 'UPDATE kv SET n = $1', args: [1] },
      { sql: 'SELECT k FROM kv' },
      { sql: 'UPDATE kv SET n = 2 RETURNING n' },
    ]);
    expect(batch).toEqual({ results: [{ changes: 2 }, { rows: [{ k: 'a' }] }, { rows: [] }] });
    expect(log.filter((sql) => sql.includes("set_config('statement_timeout'"))).toHaveLength(2);
    expect(log.filter((sql) => sql === 'begin')).toHaveLength(1);

    await expect(s.tx([])).resolves.toEqual({ results: [] });
    await expect(s.tx(Array.from({ length: 101 }, () => ({ sql: 'SELECT 1' })))).rejects.toThrow(/at most 100/);
    await expect(s.tx([{ sql: '/* x */ COMMIT' }])).rejects.toThrow(PLUGIN_DATA_ERRORS.txControl);
    await expect(s.tx('nope' as never)).rejects.toThrow(/requires an array/);
  });

  it('PGSTORE-008: migrate runs once per id, in one transaction with no time budget', async () => {
    const fresh = store();
    expect(await fresh.store.migrate('001', 'CREATE TABLE a (x int); CREATE INDEX a_x ON a (x)')).toEqual({
      applied: true,
    });
    expect(fresh.log[1]).not.toContain('statement_timeout');
    expect(fresh.log).toEqual(
      expect.arrayContaining([
        'select 1 from "trek_plugin_notes"._plugin_migrations where id = $1',
        'CREATE TABLE a (x int)',
        'CREATE INDEX a_x ON a (x)',
        'insert into "trek_plugin_notes"._plugin_migrations (id, applied_at) values ($1, $2)',
      ]),
    );

    const done = store({ migrated: true });
    expect(await done.store.migrate('001', 'CREATE TABLE a (x int)')).toEqual({ applied: false });
    expect(done.log).not.toContain('CREATE TABLE a (x int)');
  });

  it('PGSTORE-009: the SQL is checked before anything runs, and a closed store takes no new call', async () => {
    const { store: s, log, releases } = store();
    await expect(s.query(42 as never)).rejects.toThrow('sql must be a string');
    await expect(s.query('x'.repeat(100_001))).rejects.toThrow('sql too long');
    await expect(s.query('-- only a comment')).rejects.toThrow('contains no statements');
    await expect(s.query('SELECT 1; SELECT 2')).rejects.toThrow(PLUGIN_DATA_ERRORS.moreThanOneStatement);
    await expect(s.exec('DO $$ BEGIN END $$')).rejects.toThrow(/dollar-quoted/);
    expect(log).toEqual([]);
    expect(releases).toEqual([]);

    s.close();
    expect(s.isOpen()).toBe(false);
    await expect(s.query('SELECT 1')).rejects.toThrow('The database connection is not open');
  });

  it("PGSTORE-010: one plugin's calls run one after the other", async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const { store: s, log } = store({ beforeStream: (sql) => (sql === 'SELECT 1' ? gate : Promise.resolve()) });
    const first = s.query('SELECT 1');
    const second = s.query('SELECT 2');
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(log.filter((sql) => sql === 'begin')).toHaveLength(1);
    release();
    await Promise.all([first, second]);
    expect(log.filter((sql) => sql === 'begin' || sql === 'commit')).toEqual(['begin', 'commit', 'begin', 'commit']);
  });

  it('PGSTORE-012: every plugin write goes to pg as one extended-protocol query with its own args, even with none', async () => {
    // EXTQ-001 before the store checked out its own clients.
    const { store: s, configs } = store({ changes: 1 });
    await s.exec('INSERT INTO a VALUES (1); UPDATE a SET x = 2 -- note\rWHERE x = 1');
    await s.exec('INSERT INTO a VALUES ($1)', ['x']);
    await s.tx([{ sql: 'DELETE FROM a WHERE x = $1', args: [3] }]);
    await s.migrate('002', 'CREATE TABLE b (y int); CREATE INDEX b_y ON b (y)');
    const plugin = configs.filter((q) => /^(INSERT|UPDATE|DELETE|CREATE)/.test(q.text));
    expect(plugin).toEqual([
      { text: 'INSERT INTO a VALUES (1)', values: [], queryMode: 'extended' },
      { text: 'UPDATE a SET x = 2 -- note\rWHERE x = 1', values: [], queryMode: 'extended' },
      { text: 'INSERT INTO a VALUES ($1)', values: ['x'], queryMode: 'extended' },
      { text: 'DELETE FROM a WHERE x = $1', values: [3], queryMode: 'extended' },
      { text: 'CREATE TABLE b (y int)', values: [], queryMode: 'extended' },
      { text: 'CREATE INDEX b_y ON b (y)', values: [], queryMode: 'extended' },
    ]);
    // TREK's own statements with values are never sent as a plugin's are.
    expect(configs.filter((q) => q.queryMode === 'extended')).toHaveLength(plugin.length);
  });

  it('PGSTORE-013: every read goes through a cursor on the same client, closed however the read ends', async () => {
    // EXTQ-002 before the store checked out its own clients: what is not a plugin write reaches pg as it was.
    const rows = Array.from({ length: 7 }, (_, i) => ({ i }));
    const {
      store: s,
      cursors,
      configs,
    } = store({ rows: { 'SELECT i FROM t WHERE x = $1': rows, 'SELECT 1 FROM t': [{}] } }, { maxRows: 5 });
    await expect(s.query('SELECT i FROM t WHERE x = $1', ['ab'])).rejects.toThrow('more than 5 rows');
    await s.exec('SELECT 1 FROM t', ['x']);
    await s.exec('INSERT INTO t VALUES ($1)', ['cd']);
    expect(cursors).toEqual([
      { text: 'SELECT i FROM t WHERE x = $1', values: ['ab'], closed: true },
      { text: 'SELECT 1 FROM t', values: ['x'], closed: true },
    ]);
    expect(configs.find((q) => q.text.startsWith('INSERT'))?.values).toEqual(['cd']);
  });

  it('PGSTORE-016: SQL, an argument or a migration id holding NUL is refused before a client is taken, never altered', async () => {
    const { store: s, log, releases } = store();
    const nul = PLUGIN_VALUE_NUL_REFUSAL;
    // The same refusal as on SQLite, before the guard reads the SQL.
    await expect(s.exec("INSERT INTO t VALUES ('a\u0000')")).rejects.toThrow(PLUGIN_SQL_NUL_REFUSAL);
    await expect(s.query('SELECT 1 FROM t WHERE k = $1', [{ nested: ['\u0000'] }])).rejects.toThrow(nul);
    await expect(s.query('SELECT 1 FROM t WHERE k = $1', ['a\u0000b'])).rejects.toThrow(nul);
    await expect(s.exec('INSERT INTO t VALUES ($1)', [['x', 'c\u0000d']])).rejects.toThrow(nul);
    await expect(s.tx([{ sql: 'SELECT 1' }, { sql: 'DELETE FROM t WHERE k = $1', args: ['\u0000'] }])).rejects.toThrow(
      nul,
    );
    await expect(s.migrate('001\u0000', 'CREATE TABLE t (k text)')).rejects.toThrow(nul);
    expect({ log, releases }).toEqual({ log: [], releases: [] });
    // A Buffer goes to bytea, which holds any byte.
    await expect(s.exec('INSERT INTO t VALUES ($1)', [Buffer.from([0, 1])])).resolves.toEqual({ changes: 0 });
  });

  it('PGSTORE-017: a privileged role is refused before the transaction opens, and the answer is kept per connection', async () => {
    const privileged = store({ privileged: true });
    await expect(privileged.store.query('SELECT 1')).rejects.toThrow(PRIVILEGED_ROLE_PLUGIN_REFUSAL);
    await expect(privileged.store.exec('CREATE TABLE t (x int)')).rejects.toThrow(/db:own\) are refused on Postgres/);
    // One read for the connection, no transaction, and the client goes back clean.
    expect(privileged.log).toEqual([ROLE_CHECK, END_SESSION, END_SESSION]);
    expect(privileged.releases).toEqual([false, false]);

    const plain = store();
    await plain.store.query('SELECT 1');
    await plain.store.query('SELECT 2');
    expect(plain.log.filter((sql) => sql === ROLE_CHECK)).toHaveLength(1);

    // A read that failed is asked again on the next call.
    let fails = 1;
    const flaky = store({ fail: (sql) => (sql === ROLE_CHECK && fails-- > 0 ? new Error('reset') : undefined) });
    await expect(flaky.store.query('SELECT 1')).rejects.toThrow('reset');
    await expect(flaky.store.query('SELECT 1')).resolves.toEqual([]);
    expect(flaky.log.filter((sql) => sql === ROLE_CHECK)).toHaveLength(2);
  });

  it('PGSTORE-018: the objects a statement changes are resolved right before it runs, and one outside the schema refuses it', async () => {
    const own = store();
    await own.store.migrate('001', 'CREATE TABLE a (x int); ALTER TYPE mood RENAME TO feeling; DROP TABLE "B", c');
    const checks = own.configs.filter((q) => q.text.startsWith('select t.name'));
    expect(checks.map((q) => q.values)).toEqual([
      [['"mood"'], ['type'], 'trek_plugin_notes'],
      [['"B"', '"c"'], ['relation', 'relation'], 'trek_plugin_notes'],
    ]);
    // Each check comes right before its statement, after the ones before it ran.
    const order = own.log
      .filter((sql) => /^(select t\.name|CREATE|ALTER|DROP)/.test(sql))
      .map((sql) => sql.slice(0, 13));
    expect(order).toEqual(['CREATE TABLE ', 'select t.name', 'ALTER TYPE mo', 'select t.name', 'DROP TABLE "B']);

    const foreign = store({ foreign: [{ name: '"int4"', nspname: 'pg_catalog' }] });
    await expect(foreign.store.exec('ALTER TYPE int4 RENAME TO int4x')).rejects.toThrow(
      /"int4" is an object of the schema "pg_catalog"; a plugin changes its own objects only/,
    );
    expect(foreign.log).not.toContain('ALTER TYPE int4 RENAME TO int4x');
    expect(foreign.log.slice(-2)).toEqual(['rollback', END_SESSION]);
    // A statement that changes no existing object asks nothing.
    const plain = store();
    await plain.store.exec('INSERT INTO a VALUES (1)');
    expect(plain.log.some((sql) => sql.startsWith('select t.name'))).toBe(false);
  });

  it('PGSTORE-019: a write that takes the schema past its object cap and adds objects rolls back; a drop still runs', async () => {
    const grows = store({ sizes: [0, 0], objects: [10, 11] }, { maxObjects: 10 });
    await expect(grows.store.exec('CREATE TABLE t (x int)')).rejects.toThrow(
      'the plugin database holds more than 10 catalog objects',
    );
    expect(grows.log.slice(-2)).toEqual(['rollback', END_SESSION]);
    const drops = store({ sizes: [0, 0], objects: [12, 11] }, { maxObjects: 10 });
    await expect(drops.store.exec('DROP TABLE t')).resolves.toEqual({ changes: 0 });
  });

  it('PGSTORE-014: each transaction checks out a client of its own and gives it back clean, or closes it', async () => {
    const ok = store({ changes: 1 });
    await ok.store.exec('INSERT INTO a VALUES (1); INSERT INTO b VALUES (2)');
    await expect(ok.store.query('SELECT 1; SELECT 2')).rejects.toThrow(PLUGIN_DATA_ERRORS.moreThanOneStatement);
    // One client per statement of the script, each after its session state was dropped; the refused read took none.
    expect(ok.releases).toEqual([false, false]);
    expect(ok.log.filter((sql) => sql === END_SESSION)).toHaveLength(2);

    const failed = store({ fail: (sql) => (sql.startsWith('INSERT') ? new Error('boom') : undefined) });
    await expect(failed.store.exec('INSERT INTO a VALUES ($1)', [1])).rejects.toThrow('boom');
    expect(failed.log.slice(-2)).toEqual(['rollback', END_SESSION]);
    expect(failed.releases).toEqual([false]);

    // A client whose rollback fails is in a state nobody knows: it is closed, and the call reports its own error.
    const stuck = store({
      fail: (sql) =>
        sql.startsWith('INSERT') ? new Error('boom') : sql === 'rollback' ? new Error('gone') : undefined,
    });
    await expect(stuck.store.exec('INSERT INTO a VALUES ($1)', [1])).rejects.toThrow('boom');
    expect(stuck.log).not.toContain(END_SESSION);
    expect(stuck.releases).toEqual([true]);

    // So is one whose session state cannot be dropped, after a call that succeeded.
    const dirty = store({ fail: (sql) => (sql === END_SESSION ? new Error('gone') : undefined) });
    expect(await dirty.store.query('SELECT 1')).toEqual([]);
    expect(dirty.releases).toEqual([true]);
  });

  it("PGSTORE-015: poolClients checks a client out of the pool behind the ORM's connection", async () => {
    const client = { query: async () => ({ rows: [], rowCount: 0 }), release: () => undefined };
    const pool = { connect: async () => client };
    const connect = poolClients({ getNativeClient: async () => pool });
    expect(await connect()).toBe(client);
  });

  it('PGSTORE-011: dropping a plugin schema names it quoted, and an id no schema comes from drops nothing', async () => {
    const log: string[] = [];
    const db = {
      executeQuery: async (query: { sql: string }) => {
        log.push(query.sql);
        return { rows: [] };
      },
    } as unknown as Kysely<object>;
    await dropPluginSchema(db, 'trip-notes');
    await dropPluginSchema(db, '../etc');
    expect(log).toEqual(['drop schema if exists "trek_plugin_trip_notes" cascade']);
  });
});
