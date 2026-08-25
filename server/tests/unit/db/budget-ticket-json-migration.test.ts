/**
 * Boot migration: move the itemized receipt out of budget_items.note (#1658).
 *
 * The costs UI stored the receipt as a `TICKETJSON:` prefix on the note, so the
 * migration lifts it into its own column and clears the note. The match has to
 * be case-SENSITIVE: LIKE is not, which would swallow a hand-written note that
 * happens to start with the same word.
 *
 * The second half covers the databases that ran the LIKE version before it was
 * repaired — a fixed step never replays, so the damage is undone by a migration
 * of its own at the end of the array.
 */
import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';

function makeDbWithNotes(): Database.Database {
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA busy_timeout = 5000');
  db.exec('PRAGMA foreign_keys = ON');
  createTables(db);
  // Minimal FK chain: user -> trip -> budget_items rows.
  db.prepare("INSERT INTO users (id, username, email, password_hash) VALUES (1, 'u', 'u@example.test', 'x')").run();
  db.prepare("INSERT INTO trips (id, user_id, title) VALUES (1, 1, 'T')").run();
  db.prepare(
    'INSERT INTO budget_items (id, trip_id, name, note) VALUES (1, 1, ?, ?), (2, 1, ?, ?)',
  ).run('Dinner', 'TICKETJSON:{"items":[]}', 'Museum', 'ticketjson: buy at the door');
  return db;
}

describe('budget_items ticket_json migration', () => {
  it('moves a real receipt into ticket_json and clears the note', () => {
    const db = makeDbWithNotes();
    try {
      runMigrations(db);
      const row = db.prepare('SELECT note, ticket_json FROM budget_items WHERE id = 1').get() as {
        note: string | null;
        ticket_json: string | null;
      };
      expect(row).toEqual({ note: null, ticket_json: '{"items":[]}' });
    } finally {
      db.close();
    }
  });

  it('leaves a lowercase note alone (LIKE would have eaten it)', () => {
    const db = makeDbWithNotes();
    try {
      runMigrations(db);
      const row = db.prepare('SELECT note, ticket_json FROM budget_items WHERE id = 2').get() as {
        note: string | null;
        ticket_json: string | null;
      };
      expect(row).toEqual({ note: 'ticketjson: buy at the door', ticket_json: null });
    } finally {
      db.close();
    }
  });
});

describe('recovering what the case-insensitive match destroyed', () => {
  /**
   * A database that already ran the buggy step: migrated to the tip, then wound
   * back to just before the recovery step so it runs again — which is exactly
   * what an existing install does on the next boot. The wind-back target is the
   * recovery step's ABSOLUTE version (the array is append-only and
   * index-addressed, so it never moves); anything appended after it replays too,
   * which every later migration must tolerate anyway.
   */
  function makeDamagedDb(): Database.Database {
    const db = new Database(':memory:');
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA busy_timeout = 5000');
    db.exec('PRAGMA foreign_keys = ON');
    createTables(db);
    runMigrations(db);
    db.prepare("INSERT INTO users (id, username, email, password_hash) VALUES (1, 'u', 'u@example.test', 'x')").run();
    db.prepare("INSERT INTO trips (id, user_id, title) VALUES (1, 1, 'T')").run();
    // Row 1: what the LIKE match left behind for "ticketjson: buy at the door".
    // Row 2: an actual receipt. Row 3: a receipt on a row whose owner has since
    // written a note.
    db.prepare('INSERT INTO budget_items (id, trip_id, name, note, ticket_json) VALUES (?, ?, ?, ?, ?)')
      .run(1, 1, 'Museum', null, ' buy at the door');
    db.prepare('INSERT INTO budget_items (id, trip_id, name, note, ticket_json) VALUES (?, ?, ?, ?, ?)')
      .run(2, 1, 'Dinner', null, '{"items":[{"name":"Beer","price":"4.50","parts":[1]}]}');
    db.prepare('INSERT INTO budget_items (id, trip_id, name, note, ticket_json) VALUES (?, ?, ?, ?, ?)')
      .run(3, 1, 'Taxi', 'split at the hotel', '{"items":[]}');

    // 196 = the version just before the recovery step (migration #197).
    db.prepare('UPDATE schema_version SET version = ?').run(196);
    return db;
  }

  const read = (db: Database.Database, id: number) =>
    db.prepare('SELECT note, ticket_json FROM budget_items WHERE id = ?').get(id) as {
      note: string | null;
      ticket_json: string | null;
    };

  it('puts a chopped note back where it came from', () => {
    const db = makeDamagedDb();
    try {
      runMigrations(db);
      expect(read(db, 1)).toEqual({ note: ' buy at the door', ticket_json: null });
    } finally {
      db.close();
    }
  });

  it('leaves a genuine receipt alone', () => {
    const db = makeDamagedDb();
    try {
      runMigrations(db);
      expect(read(db, 2)).toEqual({
        note: null,
        ticket_json: '{"items":[{"name":"Beer","price":"4.50","parts":[1]}]}',
      });
      // A note written since the damage means the row was not chopped, so it is
      // not a candidate at all.
      expect(read(db, 3)).toEqual({ note: 'split at the hotel', ticket_json: '{"items":[]}' });
    } finally {
      db.close();
    }
  });
});
