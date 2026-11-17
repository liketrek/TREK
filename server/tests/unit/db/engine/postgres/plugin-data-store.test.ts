/**
 * The Postgres store of a plugin's own data
 * (src/db/engine/postgres/plugin-data-store.ts) against a stand-in Kysely
 * client that records what it is handed: the transaction every call opens and
 * what it sets first, the schema check before plugin SQL runs, the row cap,
 * the time budget, the quota, a script committed statement by statement, the
 * tx and migrate shapes, and one call at a time per plugin. The same store on
 * a real database is the Postgres lane's tests/postgres/plugin-data.test.ts.
 */
import { unmarkedValues } from '../../../../../src/db/engine/postgres/extended-query';
import {
  dropPluginSchema,
  PluginDataSlots,
  PostgresPluginDataStore,
} from '../../../../../src/db/engine/postgres/plugin-data-store';

import type { Kysely } from 'kysely';
import { describe, expect, it } from 'vitest';

interface FakeOptions {
  /** The schemas pg_namespace answers. */
  schemas?: string[];
  /** The sizes the quota reads answer, in order. */
  sizes?: number[];
  /** Rows a streamed statement yields, by its text; streamed two at a time. */
  rows?: Record<string, unknown[]>;
  /** What a write reports as changed. */
  changes?: number;
  /** Whether the migration id is recorded already. */
  migrated?: boolean;
  /** An error for a statement, or undefined to run it. */
  fail?: (sql: string) => Error | undefined;
  /** Called before every streamed chunk, so a test can move its clock. */
  onChunk?: () => void;
  /** Awaited before a stream starts. */
  beforeStream?: (sql: string) => Promise<void>;
}

/** A Kysely client that records each statement, and `begin`/`commit`/`rollback` around each transaction. */
function fakeDb(options: FakeOptions = {}) {
  const log: string[] = [];
  /** Every statement handed to executeQuery, with its parameters as Kysely passes them to pg. */
  const executed: Array<{ sql: string; parameters: readonly unknown[] }> = [];
  let size = 0;
  const run = (sql: string) => {
    log.push(sql);
    const err = options.fail?.(sql);
    if (err) throw err;
  };
  const trx = {
    executeQuery: async (query: { sql: string; parameters: readonly unknown[] }) => {
      executed.push(query);
      run(query.sql);
      if (query.sql.startsWith('select nspname'))
        return { rows: (options.schemas ?? []).map((nspname) => ({ nspname })) };
      if (query.sql.startsWith('select coalesce(sum(')) return { rows: [{ bytes: options.sizes?.[size++] ?? 0 }] };
      if (query.sql.startsWith('select 1 from')) return { rows: options.migrated ? [{ '?column?': 1 }] : [] };
      return { rows: [], numAffectedRows: BigInt(options.changes ?? 0) };
    },
    getExecutor: () => ({
      async *stream(query: { sql: string }) {
        await options.beforeStream?.(query.sql);
        run(query.sql);
        const rows = options.rows?.[query.sql] ?? [];
        for (let i = 0; i < rows.length; i += 2) {
          options.onChunk?.();
          yield { rows: rows.slice(i, i + 2) };
        }
      },
    }),
  };
  const db = {
    transaction: () => ({
      execute: async <T>(work: (t: typeof trx) => Promise<T>): Promise<T> => {
        log.push('begin');
        try {
          const result = await work(trx);
          log.push('commit');
          return result;
        } catch (err) {
          log.push('rollback');
          throw err;
        }
      },
    }),
    executeQuery: trx.executeQuery,
  };
  return { db: db as unknown as Kysely<object>, log, executed };
}

function store(options: FakeOptions = {}, limits = {}) {
  const fake = fakeDb(options);
  return { ...fake, store: new PostgresPluginDataStore('notes', fake.db, new PluginDataSlots(4), limits) };
}

/** A pg error with its SQLSTATE. */
function pgError(code: string, message: string): Error {
  return Object.assign(new Error(message), { code });
}

describe('Postgres plugin data store', () => {
  it('PGSTORE-001: a query runs in a transaction that makes the schema, scopes the search_path and sets the budget', async () => {
    const { store: s, log } = store({
      rows: { 'SELECT body FROM notes': [{ body: 'a' }, { body: 'b' }, { body: 'c' }] },
    });
    expect(s.engine).toBe('postgres');
    expect(await s.query('SELECT body FROM notes')).toEqual([{ body: 'a' }, { body: 'b' }, { body: 'c' }]);
    expect(log).toEqual([
      'begin',
      [
        'create schema if not exists "trek_plugin_notes"',
        'create table if not exists "trek_plugin_notes"._plugin_migrations (id text primary key, applied_at bigint)',
        'set local search_path to "trek_plugin_notes", pg_temp',
        'set local standard_conforming_strings to on',
        'set local statement_timeout to 2000',
      ].join(';\n'),
      'SELECT body FROM notes',
      'commit',
    ]);
  });

  it("PGSTORE-002: a qualified name is checked against the database's schemas before the statement runs", async () => {
    const { store: s, log } = store({ schemas: ['public', 'auth', 'trek_plugin_notes'] });
    await expect(s.query('SELECT x FROM auth.secret')).rejects.toThrow(/"auth" is another schema/);
    expect(log).not.toContain('SELECT x FROM auth.secret');
    expect(log.at(-1)).toBe('rollback');
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
    expect(grows.log.at(-1)).toBe('rollback');

    const shrinks = store({ sizes: [4096, 4096], changes: 3 }, { quotaBytes: 1024 });
    expect(await shrinks.store.exec('DELETE FROM t WHERE x = $1', ['x'])).toEqual({ changes: 3 });

    const reads = store({}, { quotaBytes: 1 });
    await reads.store.query('SELECT 1');
    expect(reads.log.some((sql) => sql.startsWith('select coalesce(sum('))).toBe(false);
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
    await expect(s.tx([{ sql: '/* x */ COMMIT' }])).rejects.toThrow(/transaction-control/);
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
    const { store: s, log } = store();
    await expect(s.query(42 as never)).rejects.toThrow('sql must be a string');
    await expect(s.query('x'.repeat(100_001))).rejects.toThrow('sql too long');
    await expect(s.query('-- only a comment')).rejects.toThrow('contains no statements');
    await expect(s.query('SELECT 1; SELECT 2')).rejects.toThrow(/exactly one statement/);
    await expect(s.exec('DO $$ BEGIN END $$')).rejects.toThrow(/dollar-quoted/);
    expect(log).toEqual([]);

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

  it('PGSTORE-012: every plugin statement it executes goes over the extended protocol, alone and with its own args', async () => {
    const { store: s, executed } = store({ changes: 1 });
    await s.exec('INSERT INTO a VALUES (1); UPDATE a SET x = 2 -- note\rWHERE x = 1');
    await s.exec('INSERT INTO a VALUES ($1)', ['x']);
    await s.tx([{ sql: 'DELETE FROM a WHERE x = $1', args: [3] }]);
    await s.migrate('002', 'CREATE TABLE b (y int); CREATE INDEX b_y ON b (y)');
    const plugin = executed.filter((q) => /^(INSERT|UPDATE|DELETE|CREATE)/.test(q.sql));
    expect(plugin.map((q) => [q.sql, unmarkedValues(q.parameters)])).toEqual([
      ['INSERT INTO a VALUES (1)', []],
      ['UPDATE a SET x = 2 -- note\rWHERE x = 1', []],
      ['INSERT INTO a VALUES ($1)', ['x']],
      ['DELETE FROM a WHERE x = $1', [3]],
      ['CREATE TABLE b (y int)', []],
      ['CREATE INDEX b_y ON b (y)', []],
    ]);
  });

  it('PGSTORE-011: dropping a plugin schema names it quoted, and an id no schema comes from drops nothing', async () => {
    const { db, log } = fakeDb();
    await dropPluginSchema(db, 'trip-notes');
    await dropPluginSchema(db, '../etc');
    expect(log).toEqual(['drop schema if exists "trek_plugin_trip_notes" cascade']);
  });
});
