/**
 * The per-plugin sqlite file (#plugins, M1, db:own). Proves migrations are
 * idempotent, reads/writes work against the plugin's OWN file, and the guard
 * blocks statements that would let a plugin escape its file (ATTACH/PRAGMA).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PluginDataDb, removePluginData } from '../../../src/nest/plugins/host/plugin-data.service';

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

  it('removePluginData deletes the whole data dir', () => {
    const db = new PluginDataDb('temp');
    db.migrate('001', 'CREATE TABLE t (id INTEGER)');
    db.close();
    expect(fs.existsSync(path.join(tmp, 'temp'))).toBe(true);
    removePluginData('temp');
    expect(fs.existsSync(path.join(tmp, 'temp'))).toBe(false);
  });
});
