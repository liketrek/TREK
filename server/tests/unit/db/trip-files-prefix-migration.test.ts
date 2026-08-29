/**
 * Boot migration: strip the legacy 'files/' prefix from trip_files.filename.
 *
 * Collab note attachments historically stored 'files/<name>' while the file
 * manager stored bare names in the same column; the storage layer addresses
 * objects as category + bare name, so existing prefixed rows are normalized
 * once at boot (storage slice 2).
 */
import { runMigrations } from '../../../src/db/migrations';
import { createTables } from '../../../src/db/schema';

import Database from 'better-sqlite3';
import { describe, it, expect } from 'vitest';

function makeDbWithRows(): Database.Database {
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA busy_timeout = 5000');
  db.exec('PRAGMA foreign_keys = ON');
  createTables(db);
  // Minimal FK chain: user → trip → trip_files rows.
  db.prepare("INSERT INTO users (id, username, email, password_hash) VALUES (1, 'u', 'u@example.test', 'x')").run();
  db.prepare("INSERT INTO trips (id, user_id, title) VALUES (1, 1, 'T')").run();
  db.prepare(
    "INSERT INTO trip_files (trip_id, filename, original_name) VALUES (1, 'files/aaa.pdf', 'a.pdf'), (1, 'bbb.pdf', 'b.pdf')",
  ).run();
  return db;
}

describe('trip_files files/-prefix migration', () => {
  it('strips the files/ prefix from legacy collab rows and leaves bare rows alone', () => {
    const db = makeDbWithRows();
    try {
      runMigrations(db);
      const names = db
        .prepare('SELECT filename FROM trip_files ORDER BY id')
        .all()
        .map((r) => (r as { filename: string }).filename);
      expect(names).toEqual(['aaa.pdf', 'bbb.pdf']);
    } finally {
      db.close();
    }
  });
});
