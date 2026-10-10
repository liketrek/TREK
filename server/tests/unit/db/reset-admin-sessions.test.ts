/**
 * reset-admin.js and the session rows.
 *
 * The recovery script resets an account an operator is locked out of. Its
 * password_version bump already refuses every token of that account; it also
 * ends the account's rows in `user_sessions`, so the session list shows none
 * of them as live. A database no server tracking sessions has booted yet has
 * no such table, and the script must not trip over that.
 *
 * The script is plain JS run with `node`, so it is run here the way an
 * operator runs it, against a throwaway file holding only the columns it
 * touches.
 */
import Database from 'better-sqlite3';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const SERVER_ROOT = path.resolve(__dirname, '../../..');

let tmpDir: string;
let dbPath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-reset-admin-'));
  dbPath = path.join(tmpDir, 'travel.db');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function seed(withSessions: boolean): void {
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT,
      role TEXT,
      must_change_password INTEGER DEFAULT 0,
      password_version INTEGER NOT NULL DEFAULT 0
    );
    INSERT INTO users (id, username, email, password_hash, role, password_version) VALUES
      (1, 'boss', 'boss@example.com', 'x', 'admin', 2),
      (2, 'member', 'member@example.com', 'x', 'user', 0);
  `);
  if (withSessions) {
    db.exec(`
      CREATE TABLE user_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        revoked_at DATETIME,
        user_agent TEXT
      );
      INSERT INTO user_sessions (id, user_id, expires_at, revoked_at) VALUES
        ('boss-laptop', 1, '2099-01-01 00:00:00', NULL),
        ('boss-phone', 1, '2099-01-01 00:00:00', NULL),
        ('boss-old', 1, '2099-01-01 00:00:00', '2020-01-01 00:00:00'),
        ('member-laptop', 2, '2099-01-01 00:00:00', NULL);
    `);
  }
  db.close();
}

function resetAdmin(email: string): void {
  execFileSync(process.execPath, ['reset-admin.js'], {
    cwd: SERVER_ROOT,
    env: { ...process.env, TREK_DB_FILE: dbPath, RESET_ADMIN_EMAIL: email, RESET_ADMIN_PASSWORD: 'Recovery12345!' },
    stdio: 'pipe',
  });
}

function read<T>(sql: string): T[] {
  const db = new Database(dbPath);
  try {
    // test-sql-allow: reads the throwaway file reset-admin.js ran on, a hand-built two-table database no ORM is bound to.
    return db.prepare(sql).all() as T[];
  } finally {
    db.close();
  }
}

describe('reset-admin.js and user_sessions', () => {
  it("RESETADMIN-SESS-001: ends every live session of the account it resets, and nobody else's", () => {
    seed(true);

    resetAdmin('Boss@Example.com');

    const sessions = read<{ id: string; revoked_at: string | null }>(
      'SELECT id, revoked_at FROM user_sessions ORDER BY id',
    );
    const byId = Object.fromEntries(sessions.map((s) => [s.id, s.revoked_at]));
    expect(byId['boss-laptop']).not.toBeNull();
    expect(byId['boss-phone']).not.toBeNull();
    // An already ended session keeps the time it ended.
    expect(byId['boss-old']).toBe('2020-01-01 00:00:00');
    expect(byId['member-laptop']).toBeNull();
    expect(read('SELECT password_version, must_change_password FROM users WHERE id = 1')).toEqual([
      { password_version: 3, must_change_password: 1 },
    ]);
  }, 60000);

  it('RESETADMIN-SESS-002: a database without the sessions table is reset all the same', () => {
    seed(false);

    resetAdmin('boss@example.com');

    expect(read("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'user_sessions'")).toEqual([]);
    expect(read('SELECT role, password_version, must_change_password FROM users WHERE id = 1')).toEqual([
      { role: 'admin', password_version: 3, must_change_password: 1 },
    ]);
  }, 60000);

  it('RESETADMIN-SESS-003: creating a new admin ends no existing session', () => {
    seed(true);

    resetAdmin('new-admin@example.com');

    expect(read('SELECT COUNT(*) AS n FROM user_sessions WHERE revoked_at IS NULL')).toEqual([{ n: 3 }]);
    expect(read("SELECT role, must_change_password FROM users WHERE email = 'new-admin@example.com'")).toEqual([
      { role: 'admin', must_change_password: 1 },
    ]);
  }, 60000);
});
