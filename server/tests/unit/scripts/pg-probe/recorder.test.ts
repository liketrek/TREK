/**
 * The statement recorder under the Postgres probe (scripts/pg-probe/recorder.ts),
 * driven through a real Kysely Postgres dialect over a fake `pg` pool that
 * logs what it is sent. What the probe's numbers mean rests on these: each
 * statement runs alone in a rolled-back transaction, a refused one is
 * recorded with its SQLSTATE and answered as an empty table, the callers'
 * own transaction calls do nothing, and statements land on the method that
 * sent them.
 */
import {
  errorLine,
  isTransactionControl,
  ProbePostgresDialect,
  sqlState,
  StatementRecorder,
} from '../../../../scripts/pg-probe/recorder';

import { Kysely, PostgresDialect, type PostgresPool } from 'kysely';
import { describe, expect, it } from 'vitest';

interface ProbeDB {
  t: { v: number };
}

function fakeDatabase(): { db: Kysely<ProbeDB>; log: string[]; recorder: StatementRecorder; released: () => number } {
  const log: string[] = [];
  let released = 0;
  const client = {
    async query(sql: string) {
      log.push(sql);
      if (sql.includes('"boom"')) {
        throw Object.assign(new Error('column "boom" does not exist\nLINE 1: select "boom"'), { code: '42703' });
      }
      return { command: 'SELECT', rowCount: 1, rows: [{ v: 1 }] };
    },
    release() {
      released += 1;
    },
  };
  const pool = { connect: async () => client, end: async () => undefined } as unknown as PostgresPool;
  const recorder = new StatementRecorder();
  const db = new Kysely<ProbeDB>({ dialect: new ProbePostgresDialect(new PostgresDialect({ pool }), recorder, 1234) });
  return { db, log, recorder, released: () => released };
}

describe('pg-probe recorder', () => {
  it('PGPROBE-020: outside a probed method a statement passes straight through', async () => {
    const { db, log, recorder } = fakeDatabase();
    await db.selectFrom('t').select('v').execute();
    expect(log).toEqual(['select "v" from "t"']);
    expect(recorder.entries()).toEqual([]);
  });

  it('PGPROBE-021: inside one it runs alone in a rolled-back transaction with a timeout and is recorded', async () => {
    const { db, log, recorder, released } = fakeDatabase();
    const rows = await recorder.run('A.b', () => db.selectFrom('t').select('v').execute());
    expect(rows).toEqual([{ v: 1 }]);
    expect(log).toEqual(['begin', 'set local statement_timeout = 1234', 'select "v" from "t"', 'rollback']);
    expect(recorder.statementsOf('A.b')).toEqual([{ sql: 'select "v" from "t"', outcome: { ok: true } }]);
    expect(released()).toBe(1);
  });

  it('PGPROBE-022: a refused statement is recorded with its SQLSTATE and answered as an empty table', async () => {
    const { db, log, recorder } = fakeDatabase();
    const rows = await recorder.run('A.b', async () => {
      const first = await db
        .selectFrom('t')
        .select('boom' as 'v')
        .execute();
      await db.selectFrom('t').select('v').execute();
      return first;
    });
    expect(rows).toEqual([]);
    expect(log).toEqual([
      'begin',
      'set local statement_timeout = 1234',
      'select "boom" from "t"',
      'rollback',
      'begin',
      'set local statement_timeout = 1234',
      'select "v" from "t"',
      'rollback',
    ]);
    expect(recorder.statementsOf('A.b')).toEqual([
      { sql: 'select "boom" from "t"', outcome: { ok: false, code: '42703', message: 'column "boom" does not exist' } },
      { sql: 'select "v" from "t"', outcome: { ok: true } },
    ]);
  });

  it("PGPROBE-023: the caller's own transaction and savepoints never reach the database", async () => {
    const { db, log, recorder } = fakeDatabase();
    await recorder.run('A.b', () =>
      db.transaction().execute(async (trx) => {
        await trx.selectFrom('t').select('v').execute();
      }),
    );
    expect(log).toEqual(['begin', 'set local statement_timeout = 1234', 'select "v" from "t"', 'rollback']);

    log.length = 0;
    await recorder.run('A.c', async () => {
      const trx = await db.startTransaction().execute();
      const savepoint = await trx.savepoint('sp1').execute();
      await savepoint.rollbackToSavepoint('sp1').execute();
      await trx.commit().execute();
    });
    expect(log).toEqual([]);
    expect(recorder.statementsOf('A.c')).toEqual([]);
  });

  it('PGPROBE-024: concurrent methods each keep their own statements', async () => {
    const { db, recorder } = fakeDatabase();
    await Promise.all([
      recorder.run('A.one', () => db.selectFrom('t').select('v').execute()),
      recorder.run('B.two', async () => {
        await db.selectFrom('t').select('v').execute();
        await db.selectFrom('t').select('v').where('v', '=', 2).execute();
      }),
    ]);
    expect(recorder.statementsOf('A.one')).toHaveLength(1);
    expect(recorder.statementsOf('B.two').map((s) => s.sql)).toEqual([
      'select "v" from "t"',
      'select "v" from "t" where "v" = $1',
    ]);
    expect(recorder.current()).toBeNull();
  });

  it('PGPROBE-025: classifies transaction control and reads driver errors', () => {
    for (const sql of [
      'begin',
      'COMMIT',
      'rollback',
      'start transaction isolation level serializable',
      'savepoint "trx1"',
      'release savepoint "trx1"',
      'rollback to savepoint "trx1"',
    ]) {
      expect(isTransactionControl(sql)).toBe(true);
    }
    for (const sql of ['select 1', 'insert into "begin_log" values (1)', 'update "t" set "v" = 1']) {
      expect(isTransactionControl(sql)).toBe(false);
    }
    expect(sqlState(Object.assign(new Error('x'), { code: '42P01' }))).toBe('42P01');
    expect(sqlState(Object.assign(new Error('x'), { code: 'ECONNREFUSED' }))).toBe('NOSQLSTATE');
    expect(sqlState('plain')).toBe('NOSQLSTATE');
    expect(errorLine(new Error('first line\nsecond line'))).toBe('first line');
    expect(errorLine('just text')).toBe('just text');
  });
});
