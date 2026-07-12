/**
 * The per-plugin sqlite file (#plugins, M1, db:own). Proves migrations are
 * idempotent, reads/writes work against the plugin's OWN file, and the guard
 * blocks statements that would let a plugin escape its file (ATTACH/PRAGMA).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PluginDataDb, removePluginData, snapshotAllPluginDataDbs } from '../../../src/nest/plugins/host/plugin-data.service';

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
    expect(() => db.query('WITH RECURSIVE r(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM r) SELECT x FROM r')).toThrow(/not allowed/);
    expect(() => db.exec('WITH RECURSIVE r(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM r) INSERT INTO t SELECT x FROM r')).toThrow(/not allowed/);
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
    expect(out.results[2]).toEqual({ rows: [{ id: 1, bal: 60 }, { id: 2, bal: 40 }] });

    // failure path: a later statement throws → the earlier write must NOT persist
    expect(() => db.tx([
      { sql: 'UPDATE acct SET bal = 0 WHERE id = ?', args: [1] },
      { sql: 'INSERT INTO nonexistent (x) VALUES (1)' },
    ])).toThrow();
    expect(db.query('SELECT bal FROM acct WHERE id = 1')).toEqual([{ bal: 60 }]); // unchanged

    // guard + caps apply inside a batch too
    expect(() => db.tx([{ sql: "ATTACH DATABASE 'x' AS y" }])).toThrow(/not allowed/);
    expect(() => db.tx(Array.from({ length: 101 }, () => ({ sql: 'SELECT 1' })))).toThrow(/at most/);
    expect(db.tx([]).results).toEqual([]);

    // a raw COMMIT inside the batch must be refused (else it breaks atomicity), but a
    // CASE ... END expression (END not at statement start) stays allowed
    expect(() => db.tx([
      { sql: 'UPDATE acct SET bal = 0 WHERE id = ?', args: [1] },
      { sql: 'COMMIT' },
    ])).toThrow(/transaction-control/);
    expect(db.tx([{ sql: "SELECT CASE WHEN bal > 0 THEN 'y' ELSE 'n' END AS s FROM acct WHERE id = 1" }]).results[0])
      .toEqual({ rows: [{ s: 'y' }] });
    // the row cap is now for the WHOLE batch, not per statement
    db.exec('CREATE TABLE big (n INTEGER)');
    db.exec('INSERT INTO big (n) VALUES ' + Array.from({ length: 400 }, (_, i) => `(${i})`).join(','));
    expect(() => db.tx([{ sql: 'SELECT a.n FROM big a, big b' }])).toThrow(/more than/); // 160k > 100k
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
