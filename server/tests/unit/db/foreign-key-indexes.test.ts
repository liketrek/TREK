import { createSnapshotTestDb } from '../../helpers/db-mock';

import type Database from 'better-sqlite3';
import { afterAll, describe, expect, it } from 'vitest';

/**
 * Migration20200101042200 added 86 indexes by hand so that deleting a trip or a
 * user stops scanning every child table while it holds the one connection. A
 * hand-written list is a one-off, though: the next table with a trip_id or a
 * user_id foreign key would bring the full scans back without a signal, and
 * gen:entities regenerates entities without an @Index just as happily.
 *
 * This runs against the database the migrations build (the same snapshot every
 * test opens) and requires that the columns of every foreign key lead some
 * index or the primary key, in order, so SQLite can find the child rows of a
 * parent by seeking instead of scanning. A foreign key that deliberately goes
 * without one is listed in UNINDEXED_ALLOWED with the reason.
 */

/** `table.column` (comma-joined for a composite key) that may stay unindexed, each with its reason. */
const UNINDEXED_ALLOWED: Record<string, string> = {};

interface ForeignKeyRow {
  id: number;
  seq: number;
  table: string;
  from: string;
}

interface IndexListRow {
  name: string;
  partial: number;
}

interface IndexInfoRow {
  seqno: number;
  name: string | null;
}

interface TableInfoRow {
  name: string;
  pk: number;
}

const testDb = createSnapshotTestDb();

afterAll(() => {
  testDb.close();
});

function tables(db: Database.Database): string[] {
  const rows = db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`).all() as {
    name: string;
  }[];
  return rows.map((r) => r.name).sort();
}

/** Each foreign key of a table as its ordered child columns. */
function foreignKeys(db: Database.Database, table: string): string[][] {
  const rows = db.prepare(`PRAGMA foreign_key_list("${table}")`).all() as ForeignKeyRow[];
  const byId = new Map<number, ForeignKeyRow[]>();
  for (const row of rows) byId.set(row.id, [...(byId.get(row.id) ?? []), row]);
  return [...byId.values()].map((group) => group.sort((a, b) => a.seq - b.seq).map((r) => r.from));
}

/** The leading columns of an index, and the columns its WHERE clause requires to be non-null. */
interface IndexPrefix {
  cols: string[];
  notNull: string[];
}

/**
 * The columns a partial index's predicate requires to be non-null, or null when
 * the predicate says anything else. SQLite proves `col = ?` implies `col IS NOT
 * NULL`, so only such an index serves the parent's cascade lookup; one filtered
 * on another predicate (`WHERE state = 'open'`) leaves the lookup scanning.
 */
function notNullPredicate(sql: string | null): string[] | null {
  const where = /\bWHERE\b([\s\S]*)$/i.exec(sql ?? '');
  if (!where) return null;
  const cols: string[] = [];
  for (const term of where[1].trim().split(/\s+AND\s+/i)) {
    const m = /^\(?\s*["`[]?(\w+)["`\]]?\s+IS\s+NOT\s+NULL\s*\)?$/i.exec(term.trim());
    if (!m) return null;
    cols.push(m[1]);
  }
  return cols;
}

/** Every index of a table, and its primary key, as ordered column lists. */
function indexedPrefixes(db: Database.Database, table: string): IndexPrefix[] {
  const lists: IndexPrefix[] = [];
  for (const { name, partial } of db.prepare(`PRAGMA index_list("${table}")`).all() as IndexListRow[]) {
    let notNull: string[] = [];
    if (partial) {
      const row = db.prepare(`SELECT sql FROM sqlite_master WHERE type = 'index' AND name = ?`).get(name) as
        { sql: string | null } | undefined;
      const required = notNullPredicate(row?.sql ?? null);
      // A predicate other than IS NOT NULL on key columns hides rows from the lookup.
      if (required === null) continue;
      notNull = required;
    }
    const cols = (db.prepare(`PRAGMA index_info("${name}")`).all() as IndexInfoRow[])
      .sort((a, b) => a.seqno - b.seqno)
      // An expression column has no name and ends the usable prefix.
      .map((c) => c.name);
    const usable: string[] = [];
    for (const c of cols) {
      if (c === null) break;
      usable.push(c);
    }
    lists.push({ cols: usable, notNull });
  }
  const pk = (db.prepare(`PRAGMA table_info("${table}")`).all() as TableInfoRow[])
    .filter((c) => c.pk > 0)
    .sort((a, b) => a.pk - b.pk)
    .map((c) => c.name);
  if (pk.length) lists.push({ cols: pk, notNull: [] });
  return lists;
}

/**
 * True when the foreign key's columns, in any order, are the leading columns of
 * one index, and a partial index filters only on those columns being non-null.
 */
function isLedByIndex(fk: string[], indexes: IndexPrefix[]): boolean {
  const want = [...fk].sort().join(',');
  return indexes.some(
    ({ cols, notNull }) =>
      cols.length >= fk.length &&
      [...cols.slice(0, fk.length)].sort().join(',') === want &&
      notNull.every((c) => fk.includes(c)),
  );
}

function unindexed(db: Database.Database): string[] {
  const missing: string[] = [];
  for (const table of tables(db)) {
    const indexes = indexedPrefixes(db, table);
    for (const fk of foreignKeys(db, table)) {
      if (!isLedByIndex(fk, indexes)) missing.push(`${table}.${fk.join(',')}`);
    }
  }
  return missing;
}

describe('foreign key indexes', () => {
  it('FKIDX-001: every foreign key in the migrated schema leads an index or the primary key', () => {
    const missing = unindexed(testDb).filter((key) => !(key in UNINDEXED_ALLOWED));
    expect(missing, 'add a CREATE INDEX for each in a new migration, and an @Index on the entity').toEqual([]);
  });

  it('FKIDX-002: UNINDEXED_ALLOWED holds only keys that exist and are still unindexed', () => {
    const now = new Set(unindexed(testDb));
    expect(Object.keys(UNINDEXED_ALLOWED).filter((key) => !now.has(key))).toEqual([]);
  });

  it('FKIDX-003: the check fails on an unindexed foreign key and passes once it is indexed', () => {
    const Sqlite = testDb.constructor as unknown as new (path: string) => Database.Database;
    const db = new Sqlite(':memory:');
    try {
      db.exec(`
        CREATE TABLE parent (id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, UNIQUE (a, b));
        CREATE TABLE child (id INTEGER PRIMARY KEY, parent_id INTEGER REFERENCES parent(id), note TEXT);
        CREATE TABLE pair (x INTEGER, y INTEGER, z INTEGER, FOREIGN KEY (x, y) REFERENCES parent(a, b));
        CREATE TABLE owned (parent_id INTEGER REFERENCES parent(id), slot INTEGER, PRIMARY KEY (parent_id, slot));
      `);
      // owned is covered by its primary key; child and pair are not.
      expect(unindexed(db)).toEqual(['child.parent_id', 'pair.x,y']);

      // An index that holds the column second does not help a lookup by it.
      db.exec('CREATE INDEX idx_child_note_parent ON child(note, parent_id)');
      expect(unindexed(db)).toContain('child.parent_id');

      // A partial index on another predicate leaves the cascade lookup scanning.
      db.exec(`CREATE INDEX idx_child_parent_open ON child(parent_id) WHERE note = 'open'`);
      expect(db.prepare('EXPLAIN QUERY PLAN SELECT 1 FROM child WHERE parent_id = ?').get(1)).toMatchObject({
        detail: 'SCAN child',
      });
      expect(unindexed(db)).toContain('child.parent_id');

      // One filtered only on the key being non-null still serves `parent_id = ?`.
      db.exec('CREATE INDEX idx_child_parent ON child(parent_id) WHERE parent_id IS NOT NULL');
      expect(
        (db.prepare('EXPLAIN QUERY PLAN SELECT 1 FROM child WHERE parent_id = ?').get(1) as { detail: string }).detail,
      ).toContain('idx_child_parent');
      db.exec('CREATE INDEX idx_pair_yx ON pair(y, x, z)');
      expect(unindexed(db)).toEqual([]);
    } finally {
      db.close();
    }
  });

  it('FKIDX-004: a partial index counts only when its predicate is IS NOT NULL on its columns', () => {
    expect(notNullPredicate('CREATE INDEX i ON c(p_id) WHERE p_id IS NOT NULL')).toEqual(['p_id']);
    expect(notNullPredicate('CREATE INDEX i ON c(a, b) WHERE "a" IS NOT NULL AND (b IS NOT NULL)')).toEqual(['a', 'b']);
    expect(notNullPredicate("CREATE INDEX i ON c(p_id) WHERE state = 'open'")).toBeNull();
    expect(notNullPredicate('CREATE INDEX i ON c(p_id) WHERE p_id IS NOT NULL OR x = 1')).toBeNull();
    expect(notNullPredicate('CREATE INDEX i ON c(p_id) WHERE p_id IS NULL')).toBeNull();
    expect(notNullPredicate(null)).toBeNull();
  });
});
