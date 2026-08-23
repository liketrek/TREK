/**
 * Boot migration: move the itemized receipt out of budget_items.note (#1658).
 *
 * The costs UI stored the receipt as a `TICKETJSON:` prefix on the note, so the
 * migration lifts it into its own column and clears the note. The match has to
 * be case-SENSITIVE: LIKE is not, which would swallow a hand-written note that
 * happens to start with the same word.
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
