/**
 * The contract a plugin's own database (`db:own`) answers alike on both
 * engines: every call that breaks it, run on the SQLite store
 * (src/db/engine/sqlite/plugin-data-store.ts) and on the Postgres store
 * (src/db/engine/postgres/plugin-data-store.ts), must be refused with the
 * same words, and those words are the ones `plugin-data-contract.ts`
 * holds. A store that answers one case differently, or a
 * text spelled by hand in one store, fails here.
 *
 * The SQLite store runs on a file of its own. The Postgres store runs on a
 * stand-in `pg` client that answers every statement with no rows and every
 * cursor with the rows of the seeded table, which is all these cases reach;
 * the same store on a real database is the Postgres lane's
 * tests/postgres/plugin-data.test.ts.
 */
import type { PluginDataStore } from '../../../../src/db/engine/plugin-data';
import {
  PLUGIN_DATA_CAPS,
  PLUGIN_DATA_ERRORS,
  PLUGIN_SQL_NUL_REFUSAL,
  PLUGIN_VALUE_NUL_REFUSAL,
  refuseTransactionControl,
} from '../../../../src/db/engine/plugin-data-contract';
import {
  PluginDataSlots,
  PostgresPluginDataStore,
  type PluginSqlClient,
} from '../../../../src/db/engine/postgres/plugin-data-store';
import { SqlitePluginDataStore } from '../../../../src/db/engine/sqlite/plugin-data-store';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Cursor from 'pg-cursor';
import { afterAll, describe, expect, it } from 'vitest';

/** The rows of `seq` on both engines: five of them, more than the row cap below. */
const SEQ_ROWS = [1, 2, 3, 4, 5].map((n) => ({ n }));

interface Limits {
  maxRows?: number;
  timeBudgetMs?: number;
  now?: () => number;
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-plugin-contract-'));
let stores = 0;

afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

/** A SQLite store on a file of its own, holding the table `seq`. */
function sqliteStore(limits: Limits): SqlitePluginDataStore {
  const id = `contract-${++stores}`;
  const store = new SqlitePluginDataStore(id, path.join(dir, id, 'plugin.db'), limits);
  store.migrate('seq', 'CREATE TABLE seq (n INTEGER)');
  store.exec(`INSERT INTO seq (n) VALUES ${SEQ_ROWS.map((row) => `(${row.n})`).join(', ')}`);
  return store;
}

/** A Postgres store whose client reads {@link SEQ_ROWS} from every cursor, one row per read. */
function postgresStore(limits: Limits): PostgresPluginDataStore {
  const client = {
    query(arg: unknown): unknown {
      if (arg instanceof Cursor) {
        let next = 0;
        return {
          read: async () => (next < SEQ_ROWS.length ? [SEQ_ROWS[next++]] : []),
          close: async () => undefined,
        };
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    },
    release: () => undefined,
  };
  return new PostgresPluginDataStore(
    'contract',
    async () => client as unknown as PluginSqlClient,
    new PluginDataSlots(1),
    limits,
    { refuseIfPrivileged: async () => undefined },
  );
}

/** A clock that moves `step` ms each time it is read, so a budget runs out on cue. */
function steppingClock(step: number): () => number {
  let t = 0;
  return () => (t += step);
}

/** What a call answered: its result, or the message it was refused with. */
async function outcome(call: () => unknown): Promise<string> {
  try {
    return `answered ${JSON.stringify(await call())}`;
  } catch (err) {
    return `refused: ${err instanceof Error ? err.message : String(err)}`;
  }
}

type Case = [name: string, call: (store: PluginDataStore) => unknown, expected: string];

const refused = (message: string) => `refused: ${message}`;
const tooManyOps = Array.from({ length: PLUGIN_DATA_CAPS.maxTxOps + 1 }, () => ({ sql: 'SELECT 1' }));

/**
 * Transaction control in any call and any statement position, in every spelling
 * either engine knows, refused with one sentence; and the words where they are no
 * statement's verb, which run.
 */
const TX_CONTROL_CASES: Case[] = [
  ...[
    'BEGIN',
    'begin transaction',
    'START TRANSACTION',
    'COMMIT',
    'End',
    'ROLLBACK',
    'ABORT',
    'SAVEPOINT a',
    'RELEASE a',
    '-- a comment first\nCOMMIT',
    '/* x */ROLLBACK',
    '/* a; b */  /* c */ end',
  ].map((sql): Case => [
    `a query of ${JSON.stringify(sql)}`,
    (s) => s.query(sql),
    refused(PLUGIN_DATA_ERRORS.txControl),
  ]),
  [
    'a script that opens a transaction',
    (s) => s.exec('BEGIN; INSERT INTO seq (n) VALUES (6); COMMIT;'),
    refused(PLUGIN_DATA_ERRORS.txControl),
  ],
  [
    'a script that ends with COMMIT',
    (s) => s.exec('INSERT INTO seq (n) VALUES (6);\n-- done\ncommit'),
    refused(PLUGIN_DATA_ERRORS.txControl),
  ],
  ['an exec with args of COMMIT', (s) => s.exec('COMMIT', [1]), refused(PLUGIN_DATA_ERRORS.txControl)],
  [
    'a tx op of transaction control',
    (s) => s.tx([{ sql: 'UPDATE seq SET n = n' }, { sql: ' /* x */ SAVEPOINT a' }]),
    refused(PLUGIN_DATA_ERRORS.txControl),
  ],
  [
    'a migration that commits',
    (s) => s.migrate('m', 'CREATE TABLE t (x INTEGER); COMMIT; CREATE TABLE u (x INTEGER)'),
    refused(PLUGIN_DATA_ERRORS.txControl),
  ],
  ['a CASE ... END expression', (s) => s.exec("SELECT CASE WHEN 1 = 1 THEN 'y' END AS s"), 'answered {"changes":0}'],
  ['the words in a string', (s) => s.exec("SELECT 'BEGIN; COMMIT' AS s"), 'answered {"changes":0}'],
  ['the words in a comment', (s) => s.exec('SELECT 1; -- COMMIT\n/* END; */'), 'answered {"changes":0}'],
];

/** Calls that break the contract, or sit at its edge, on a store that is open. */
const OPEN_CASES: Case[] = [
  ['query with SQL that is no string', (s) => s.query(42 as never), refused(PLUGIN_DATA_ERRORS.sqlNotString)],
  ['exec with SQL that is no string', (s) => s.exec(null as never), refused(PLUGIN_DATA_ERRORS.sqlNotString)],
  ['migrate with SQL that is no string', (s) => s.migrate('m', {} as never), refused(PLUGIN_DATA_ERRORS.sqlNotString)],
  ['a tx op with SQL that is no string', (s) => s.tx([{ sql: 7 as never }]), refused(PLUGIN_DATA_ERRORS.sqlNotString)],
  ['a tx op that is no object', (s) => s.tx([null as never]), refused(PLUGIN_DATA_ERRORS.sqlNotString)],
  [
    'SQL past the length cap',
    (s) => s.query('x'.repeat(PLUGIN_DATA_CAPS.maxSqlLength + 1)),
    refused(PLUGIN_DATA_ERRORS.sqlTooLong),
  ],
  ['SQL holding NUL', (s) => s.query("SELECT 'a\u0000'"), refused(PLUGIN_SQL_NUL_REFUSAL)],
  ['a script holding NUL', (s) => s.exec("SELECT 'a\u0000'"), refused(PLUGIN_SQL_NUL_REFUSAL)],
  ['an argument holding NUL', (s) => s.query('SELECT 1', ['a\u0000']), refused(PLUGIN_VALUE_NUL_REFUSAL)],
  ['a migration id holding NUL', (s) => s.migrate('m\u0000', 'SELECT 1'), refused(PLUGIN_VALUE_NUL_REFUSAL)],
  ['a query without a statement', (s) => s.query(''), refused(PLUGIN_DATA_ERRORS.noStatement)],
  ['a query of a comment only', (s) => s.query('-- nothing'), refused(PLUGIN_DATA_ERRORS.noStatement)],
  ['a query of two statements', (s) => s.query('SELECT 1; SELECT 2'), refused(PLUGIN_DATA_ERRORS.moreThanOneStatement)],
  [
    'an exec with args of two statements',
    (s) => s.exec('SELECT 1; SELECT 2', [1]),
    refused(PLUGIN_DATA_ERRORS.moreThanOneStatement),
  ],
  ['an empty script', (s) => s.exec(''), 'answered {"changes":0}'],
  ['a script of a comment only', (s) => s.exec('-- nothing'), 'answered {"changes":0}'],
  ['a tx that is no array', (s) => s.tx('nope' as never), refused(PLUGIN_DATA_ERRORS.txNotArray)],
  ['an empty tx', (s) => s.tx([]), 'answered {"results":[]}'],
  [
    'a tx past the statement cap',
    (s) => s.tx(tooManyOps),
    refused(PLUGIN_DATA_ERRORS.txTooManyOps(PLUGIN_DATA_CAPS.maxTxOps)),
  ],
  ['a query past the row cap', (s) => s.query('SELECT n FROM seq'), refused(PLUGIN_DATA_ERRORS.queryTooManyRows(3))],
  ['a tx past the row cap', (s) => s.tx([{ sql: 'SELECT n FROM seq' }]), refused(PLUGIN_DATA_ERRORS.txTooManyRows(3))],
  ...TX_CONTROL_CASES,
];

/** Calls on a store whose clock runs out of its time budget while it reads. */
const BUDGET_CASES: Case[] = [
  [
    'a query past its time budget',
    (s) => s.query('SELECT n FROM seq'),
    refused(PLUGIN_DATA_ERRORS.overBudget('query', 100)),
  ],
  [
    'a tx past its time budget',
    (s) => s.tx([{ sql: 'SELECT n FROM seq' }]),
    refused(PLUGIN_DATA_ERRORS.overBudget('tx', 100)),
  ],
];

/** Calls on a store that was closed. */
const CLOSED_CASES: Case[] = [
  ['a query', (s) => s.query('SELECT 1'), refused(PLUGIN_DATA_ERRORS.closed)],
  ['an exec with args', (s) => s.exec('SELECT ?', [1]), refused(PLUGIN_DATA_ERRORS.closed)],
  ['a script', (s) => s.exec('SELECT 1'), refused(PLUGIN_DATA_ERRORS.closed)],
  ['an empty script', (s) => s.exec(''), refused(PLUGIN_DATA_ERRORS.closed)],
  ['a script of a comment only', (s) => s.exec('-- nothing'), refused(PLUGIN_DATA_ERRORS.closed)],
  ['an empty tx', (s) => s.tx([]), refused(PLUGIN_DATA_ERRORS.closed)],
  ['a tx', (s) => s.tx([{ sql: 'SELECT 1' }]), refused(PLUGIN_DATA_ERRORS.closed)],
  ['a migration', (s) => s.migrate('m', 'SELECT 1'), refused(PLUGIN_DATA_ERRORS.closed)],
];

/** What each engine's store answers `call` with, on a store made by `limits` and `prepare`. */
async function bothAnswer(
  call: Case[1],
  limits: () => Limits,
  prepare: (store: PluginDataStore) => void = () => undefined,
): Promise<{ sqlite: string; postgres: string }> {
  const sqlite = sqliteStore(limits());
  const postgres = postgresStore(limits());
  prepare(sqlite);
  prepare(postgres);
  try {
    return { sqlite: await outcome(() => call(sqlite)), postgres: await outcome(() => call(postgres)) };
  } finally {
    sqlite.close();
  }
}

describe('plugin data contract on both engines', () => {
  it.each(OPEN_CASES)('PLUGCONTRACT-001: %s is answered alike', async (_name, call, expected) => {
    const answers = await bothAnswer(call, () => ({ maxRows: 3 }));
    expect(answers).toEqual({ sqlite: expected, postgres: expected });
  });

  it.each(BUDGET_CASES)('PLUGCONTRACT-002: %s is answered alike', async (_name, call, expected) => {
    const answers = await bothAnswer(call, () => ({ timeBudgetMs: 100, now: steppingClock(30) }));
    expect(answers).toEqual({ sqlite: expected, postgres: expected });
  });

  it.each(CLOSED_CASES)('PLUGCONTRACT-003: %s on a closed store is answered alike', async (_name, call, expected) => {
    const answers = await bothAnswer(
      call,
      () => ({}),
      (store) => store.close(),
    );
    expect(answers).toEqual({ sqlite: expected, postgres: expected });
  });
});

/**
 * The scan behind refuseTransactionControl, which the SQLite store and the SDK
 * run (the Postgres guard reads plugin SQL with its own lexer). A SQLite built
 * with Tcl variables (node:sqlite under trek-plugin dev) reads `$a(...)` up to
 * the closing parenthesis as one parameter, quotes and semicolons included.
 */
describe('refuseTransactionControl', () => {
  const hiddenCommit = "INSERT INTO seq (n) VALUES ($a(')); COMMIT; --')";

  it.each([
    hiddenCommit,
    "SELECT @a(')",
    "SELECT :a(')",
    "SELECT #a(')",
    "SELECT $a::b(')",
    "SELECT $::a(')",
    'SELECT $1(1)',
    "SELECT 1; SELECT $a('x')",
  ])('PLUGCONTRACT-004: refuses a parameter name directly followed by "(" in %j', (sql) => {
    expect(() => refuseTransactionControl(sql)).toThrow(new Error(PLUGIN_DATA_ERRORS.parameterBeforeParenthesis));
  });

  it.each([
    'SELECT $a, :b, @c, #d, ?1',
    'SELECT $a (1)',
    'SELECT 1 WHERE $a::b = 1',
    "SELECT '$a(' AS s",
    'SELECT "$a(" FROM seq',
    'SELECT [$a(] FROM seq',
    'SELECT 1 -- $a(\n',
    'SELECT x::numeric(10, 2), y #> $1, z @> $2, w := 1 FROM seq',
    'SELECT $ (1), @(1), :(1)',
  ])('PLUGCONTRACT-005: lets %j through', (sql) => {
    expect(() => refuseTransactionControl(sql)).not.toThrow();
  });

  it.each([
    'EXPLAIN CREATE TRIGGER t AFTER INSERT ON seq BEGIN SELECT 1; END',
    'explain query plan create temp trigger t after insert on seq begin select 1; end;',
    'EXPLAIN CREATE TEMPORARY TRIGGER t AFTER INSERT ON seq BEGIN SELECT 1; SELECT 2; END; SELECT 3',
  ])('PLUGCONTRACT-006: reads the body of %j as a trigger body', (sql) => {
    expect(() => refuseTransactionControl(sql)).not.toThrow();
  });

  it.each([
    'EXPLAIN CREATE TRIGGER t AFTER INSERT ON seq BEGIN SELECT 1; END; COMMIT',
    'EXPLAIN QUERY PLAN CREATE TRIGGER t AFTER INSERT ON seq BEGIN SELECT 1; END; ROLLBACK',
    'EXPLAIN SELECT 1; END',
    'EXPLAIN QUERY SELECT 1; END',
  ])('PLUGCONTRACT-007: refuses the transaction control in %j', (sql) => {
    expect(() => refuseTransactionControl(sql)).toThrow(new Error(PLUGIN_DATA_ERRORS.txControl));
  });

  it('PLUGCONTRACT-008: the SQLite store refuses the hidden COMMIT and runs EXPLAIN CREATE TRIGGER', () => {
    const store = sqliteStore({});
    try {
      expect(() => store.exec(hiddenCommit)).toThrow(new Error(PLUGIN_DATA_ERRORS.parameterBeforeParenthesis));
      expect(store.query('SELECT count(*) AS c FROM seq')).toEqual([{ c: SEQ_ROWS.length }]);
      expect(store.query('EXPLAIN CREATE TRIGGER t AFTER INSERT ON seq BEGIN SELECT 1; END').length).toBeGreaterThan(0);
      expect(
        store.query('EXPLAIN QUERY PLAN CREATE TEMP TRIGGER t AFTER INSERT ON seq BEGIN SELECT 1; END'),
      ).toBeInstanceOf(Array);
      // EXPLAIN only describes the statement: no trigger was made.
      expect(store.query("SELECT count(*) AS c FROM sqlite_master WHERE type = 'trigger'")).toEqual([{ c: 0 }]);
    } finally {
      store.close();
    }
  });
});
