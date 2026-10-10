/**
 * The per-plugin sqlite file (#plugins, M1, db:own). Proves migrations are
 * idempotent, reads/writes work against the plugin's OWN file, and the guard
 * blocks statements that would let a plugin escape its file (ATTACH/PRAGMA).
 */
import {
  PluginDataDb,
  removePluginData,
  snapshotAllPluginDataDbs,
} from '../../../src/nest/plugins/host/plugin-data.service';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

let tmp: string;
beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'trekplug-data-'));
  process.env.TREK_PLUGINS_DATA_DIR = tmp;
});
afterAll(() => {
  delete process.env.TREK_PLUGINS_DATA_DIR;
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('PluginDataDb', () => {
  it('migrates once (idempotent by id), then reads and writes its own data', () => {
    const db = new PluginDataDb('notes');
    expect(db.migrate('001', 'CREATE TABLE notes (id INTEGER PRIMARY KEY, body TEXT)').applied).toBe(true);
    expect(db.migrate('001', 'CREATE TABLE notes (x)').applied).toBe(false); // same id -> skipped

    db.exec('INSERT INTO notes (body) VALUES (?)', ['hello']);
    // exec without bound args runs the multi-statement path
    db.exec("INSERT INTO notes (body) VALUES ('second')");
    const rows = db.query('SELECT body FROM notes ORDER BY id') as Array<{ body: string }>;
    expect(rows).toEqual([{ body: 'hello' }, { body: 'second' }]);
    db.close();

    // The data lives in its own file, not trek.db
    expect(fs.existsSync(path.join(tmp, 'notes', 'plugin.db'))).toBe(true);
  });

  it('rejects statements that would escape the plugin file, DoS, or exceed limits', () => {
    const db = new PluginDataDb('guard');
    expect(() => db.exec("ATTACH DATABASE 'trek.db' AS core")).toThrow(/not allowed/);
    expect(() => db.query('PRAGMA table_info(x)')).toThrow(/not allowed/);
    // WITH RECURSIVE is the unbounded-CPU vector on the synchronous host — refused
    expect(() => db.query('WITH RECURSIVE r(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM r) SELECT x FROM r')).toThrow(
      /not allowed/,
    );
    expect(() =>
      db.exec('WITH RECURSIVE r(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM r) INSERT INTO t SELECT x FROM r'),
    ).toThrow(/not allowed/);
    expect(() => db.exec(123 as unknown as string)).toThrow(/must be a string/);
    expect(() => db.query('x'.repeat(100_001))).toThrow(/too long/);
    db.close();
  });

  it('row-caps a query so it cannot materialize an unbounded result set', () => {
    const db = new PluginDataDb('rowcap');
    db.exec('CREATE TABLE seq (n INTEGER)');
    // Insert a modest table and a self-cross-join that would explode past the cap.
    const insert = 'INSERT INTO seq (n) VALUES ' + Array.from({ length: 400 }, (_, i) => `(${i})`).join(',');
    db.exec(insert);
    // 400 * 400 = 160k rows > MAX_ROWS (100k) → must throw, not return them all
    expect(() => db.query('SELECT a.n FROM seq a, seq b')).toThrow(/more than/);
    db.close();
  });

  it('tx runs a batch atomically — reads see earlier writes, and any error rolls the whole batch back', () => {
    const db = new PluginDataDb('txn');
    db.migrate('001', 'CREATE TABLE acct (id INTEGER PRIMARY KEY, bal INTEGER)');
    db.exec('INSERT INTO acct (id, bal) VALUES (1, 100), (2, 0)');

    // happy path: a transfer as one atomic batch; the SELECT sees the batch's writes
    const out = db.tx([
      { sql: 'UPDATE acct SET bal = bal - 40 WHERE id = ?', args: [1] },
      { sql: 'UPDATE acct SET bal = bal + 40 WHERE id = ?', args: [2] },
      { sql: 'SELECT id, bal FROM acct ORDER BY id' },
    ]);
    expect(out.results[0]).toEqual({ changes: 1 });
    expect(out.results[2]).toEqual({
      rows: [
        { id: 1, bal: 60 },
        { id: 2, bal: 40 },
      ],
    });

    // failure path: a later statement throws → the earlier write must NOT persist
    expect(() =>
      db.tx([
        { sql: 'UPDATE acct SET bal = 0 WHERE id = ?', args: [1] },
        { sql: 'INSERT INTO nonexistent (x) VALUES (1)' },
      ]),
    ).toThrow();
    expect(db.query('SELECT bal FROM acct WHERE id = 1')).toEqual([{ bal: 60 }]); // unchanged

    // guard + caps apply inside a batch too
    expect(() => db.tx([{ sql: "ATTACH DATABASE 'x' AS y" }])).toThrow(/not allowed/);
    expect(() => db.tx(Array.from({ length: 101 }, () => ({ sql: 'SELECT 1' })))).toThrow(/at most/);
    expect(db.tx([]).results).toEqual([]);

    // a raw COMMIT inside the batch must be refused (else it breaks atomicity), but a
    // CASE ... END expression (END not at statement start) stays allowed
    expect(() => db.tx([{ sql: 'UPDATE acct SET bal = 0 WHERE id = ?', args: [1] }, { sql: 'COMMIT' }])).toThrow(
      /transaction-control/,
    );
    expect(
      db.tx([{ sql: "SELECT CASE WHEN bal > 0 THEN 'y' ELSE 'n' END AS s FROM acct WHERE id = 1" }]).results[0],
    ).toEqual({ rows: [{ s: 'y' }] });
    // the row cap is now for the WHOLE batch, not per statement
    db.exec('CREATE TABLE big (n INTEGER)');
    db.exec('INSERT INTO big (n) VALUES ' + Array.from({ length: 400 }, (_, i) => `(${i})`).join(','));
    expect(() => db.tx([{ sql: 'SELECT a.n FROM big a, big b' }])).toThrow(/more than/); // 160k > 100k
    db.close();
  });

  /** A clock that moves `step` ms each time it is read, so a budget runs out on cue. */
  const steppingClock = (step: number) => {
    let t = 0;
    return () => (t += step);
  };

  /**
   * A clock that answers `reads` in order and repeats the last value after that. Set
   * `reads` right before a call to say what each of its clock reads sees.
   */
  const scriptedClock = () => {
    const clock = {
      reads: [0] as number[],
      now: () => (clock.reads.length > 1 ? (clock.reads.shift() as number) : (clock.reads[0] ?? 0)),
    };
    return clock;
  };

  it('stops a query at the first row past its time budget', () => {
    const db = new PluginDataDb('budget-query', { timeBudgetMs: 100, now: steppingClock(30) });
    db.exec('CREATE TABLE seq (n INTEGER)');
    db.exec('INSERT INTO seq (n) VALUES ' + Array.from({ length: 50 }, (_, i) => `(${i})`).join(','));
    // The start reads the clock and every row after the first reads it again, 30 ms
    // later every time: at the fifth row the call is 120 ms in, past the budget.
    expect(() => db.query('SELECT n FROM seq')).toThrow('query exceeded its 100 ms time budget');
    // A query that finishes inside the budget is untouched.
    expect(db.query('SELECT n FROM seq WHERE n < 2 ORDER BY n')).toEqual([{ n: 0 }, { n: 1 }]);
    db.close();
  });

  it('holds a whole tx batch to one time budget and rolls it back when it runs out', () => {
    const db = new PluginDataDb('budget-tx', { timeBudgetMs: 80, now: steppingClock(30) });
    db.exec('CREATE TABLE acct (id INTEGER PRIMARY KEY, bal INTEGER)');
    db.exec('INSERT INTO acct (id, bal) VALUES (1, 100)');
    // The clock is read at the start and after each statement: 30 ms, 60 ms, then
    // 90 ms after the third write, past the budget. The two writes that did run are
    // rolled back with the rest.
    expect(() =>
      db.tx([
        { sql: 'UPDATE acct SET bal = 1 WHERE id = 1' },
        { sql: 'UPDATE acct SET bal = 2 WHERE id = 1' },
        { sql: 'UPDATE acct SET bal = 3 WHERE id = 1' },
      ]),
    ).toThrow('tx exceeded its 80 ms time budget');
    expect(db.query('SELECT bal FROM acct WHERE id = 1')).toEqual([{ bal: 100 }]);
    // The rows a batch reads move the same clock: row, end of statement, row is 90 ms.
    expect(() => db.tx([{ sql: 'SELECT id FROM acct' }, { sql: 'SELECT bal FROM acct' }])).toThrow(/time budget/);
    db.close();
  });

  it('holds an exec script to the time budget between its statements', () => {
    const db = new PluginDataDb('budget-exec', { timeBudgetMs: 80, now: steppingClock(30) });
    db.exec('CREATE TABLE log (n INTEGER)');
    // Start, then one read before each statement after the first: 30, 60, then 90 ms
    // before the fourth insert. The script stops there and the fourth insert never
    // runs. Each statement committed on its own, as Database#exec ran them, so the
    // three stay.
    expect(() =>
      db.exec(
        'INSERT INTO log VALUES (1); INSERT INTO log VALUES (2); INSERT INTO log VALUES (3); INSERT INTO log VALUES (4);',
      ),
    ).toThrow('exec exceeded its 80 ms time budget');
    // One row back, so the check itself reads the clock only at its start.
    expect(db.query('SELECT group_concat(n) AS ns FROM (SELECT n FROM log ORDER BY n)')).toEqual([{ ns: '1,2,3' }]);
    // A script that opened its own transaction and ran out of time inside it is rolled
    // back, so the connection is not left in that transaction.
    expect(() =>
      db.exec('BEGIN; INSERT INTO log VALUES (5); INSERT INTO log VALUES (6); INSERT INTO log VALUES (7); COMMIT;'),
    ).toThrow(/time budget/);
    expect(db.query('SELECT count(*) AS c FROM log WHERE n > 4')).toEqual([{ c: 0 }]);
    db.exec('INSERT INTO log VALUES (8)');
    expect(db.query('SELECT count(*) AS c FROM log WHERE n > 4')).toEqual([{ c: 1 }]);
    db.close();
  });

  it('reports a call whose last statement or row ran past the budget as done', () => {
    const clock = scriptedClock();
    const db = new PluginDataDb('budget-last', { timeBudgetMs: 100, now: clock.now });
    db.exec('CREATE TABLE log (n INTEGER)');
    // A single statement without args: the clock is read at the start only, so a
    // slow insert that has run and committed is not reported as failed.
    clock.reads = [0, 1000];
    expect(db.exec('INSERT INTO log VALUES (1)')).toEqual({ changes: 0 });
    // A script whose closing COMMIT is what takes the time: the reads before the
    // INSERT and before the COMMIT are in budget, and nothing is read after it.
    clock.reads = [0, 0, 0, 1000];
    expect(db.exec('BEGIN; INSERT INTO log VALUES (2); COMMIT;')).toEqual({ changes: 0 });
    clock.reads = [0];
    expect(db.query('SELECT n FROM log ORDER BY n')).toEqual([{ n: 1 }, { n: 2 }]);
    // The same budget running out before the COMMIT still stops the script and rolls
    // the transaction back.
    clock.reads = [0, 0, 1000];
    expect(() => db.exec('BEGIN; INSERT INTO log VALUES (3); COMMIT;')).toThrow('exec exceeded its 100 ms time budget');
    clock.reads = [0];
    expect(db.query('SELECT count(*) AS c FROM log')).toEqual([{ c: 2 }]);
    // A query read to its end is returned, even when its last row came in late: the
    // clock is read after the second row only, and not again once the rows run out.
    clock.reads = [0, 0, 1000];
    expect(db.query('SELECT n FROM log ORDER BY n')).toEqual([{ n: 1 }, { n: 2 }]);
    // A query stopped early leaves the connection free for the next call.
    db.exec('INSERT INTO log VALUES (3)');
    clock.reads = [0, 1000];
    expect(() => db.query('SELECT n FROM log ORDER BY n')).toThrow('query exceeded its 100 ms time budget');
    clock.reads = [0];
    db.exec('INSERT INTO log VALUES (4)');
    expect(db.query('SELECT count(*) AS c FROM log')).toEqual([{ c: 4 }]);
    db.close();
  });

  it('runs an exec script statement by statement with the semantics Database#exec had', () => {
    const db = new PluginDataDb('exec-script');
    db.exec(`
      -- a setup script: comments, a semicolon in a string, and a trigger body
      CREATE TABLE notes (id INTEGER PRIMARY KEY, body TEXT); /* one; two */
      CREATE TABLE audit (note_id INTEGER, what TEXT);
      CREATE TRIGGER notes_ai AFTER INSERT ON notes BEGIN
        INSERT INTO audit (note_id, what) VALUES (new.id, 'added;');
        INSERT INTO audit (note_id, what) VALUES (new.id, 'twice');
      END;
      INSERT INTO notes (body) VALUES ('it''s; fine');
    `);
    expect(db.query('SELECT body FROM notes')).toEqual([{ body: "it's; fine" }]);
    expect(db.query('SELECT what FROM audit ORDER BY rowid')).toEqual([{ what: 'added;' }, { what: 'twice' }]);
    // A script without a trailing semicolon, an empty one, and one of comments only.
    db.exec("INSERT INTO notes (body) VALUES ('last')");
    db.exec('');
    db.exec('  -- nothing to run\n/* nor here */');
    expect(db.query('SELECT count(*) AS n FROM notes')).toEqual([{ n: 2 }]);
    // The statements before a failing one have run, and the failure is SQLite's own.
    expect(() => db.exec("INSERT INTO notes (body) VALUES ('x'); INSERT INTO missing VALUES (1);")).toThrow(
      /no such table/,
    );
    expect(db.query('SELECT count(*) AS n FROM notes')).toEqual([{ n: 3 }]);
    // A statement left open at the end reports what Database#exec reported.
    expect(() => db.exec('CREATE TRIGGER t AFTER INSERT ON notes BEGIN SELECT 1;')).toThrow('incomplete input');
    db.close();
  });

  it('applies an overridden row cap to query and tx alike', () => {
    const db = new PluginDataDb('budget-rows', { maxRows: 3 });
    db.exec('CREATE TABLE seq (n INTEGER)');
    db.exec('INSERT INTO seq (n) VALUES (1), (2), (3), (4)');
    expect(() => db.query('SELECT n FROM seq')).toThrow('query returned more than 3 rows');
    expect(() => db.tx([{ sql: 'SELECT n FROM seq' }])).toThrow('tx returned more than 3 rows in total');
    expect(db.query('SELECT n FROM seq WHERE n <= 3')).toHaveLength(3);
    db.close();
  });

  it('removePluginData deletes the whole data dir', () => {
    const db = new PluginDataDb('temp');
    db.migrate('001', 'CREATE TABLE t (id INTEGER)');
    db.close();
    expect(fs.existsSync(path.join(tmp, 'temp'))).toBe(true);
    removePluginData('temp');
    expect(fs.existsSync(path.join(tmp, 'temp'))).toBe(false);
  });

  it('snapshots a closed plugin.db together with its -wal/-shm sidecars (no data loss after an unclean shutdown)', () => {
    const srcDir = path.join(tmp, 'wal-plugin'); // no open PluginDataDb handle → treated as closed
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'plugin.db'), 'DB');
    fs.writeFileSync(path.join(srcDir, 'plugin.db-wal'), 'WAL-committed');
    fs.writeFileSync(path.join(srcDir, 'plugin.db-shm'), 'SHM');
    const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'trekplug-snap-'));
    try {
      snapshotAllPluginDataDbs(dest);
      const outDir = path.join(dest, 'wal-plugin');
      expect(fs.existsSync(path.join(outDir, 'plugin.db'))).toBe(true);
      // No writer, so the WAL is a consistent set with the .db and must be copied —
      // otherwise committed-but-uncheckpointed rows in the WAL are lost from the backup.
      expect(fs.readFileSync(path.join(outDir, 'plugin.db-wal'), 'utf8')).toBe('WAL-committed');
      expect(fs.existsSync(path.join(outDir, 'plugin.db-shm'))).toBe(true);
    } finally {
      fs.rmSync(dest, { recursive: true, force: true });
      fs.rmSync(srcDir, { recursive: true, force: true });
    }
  });
});
