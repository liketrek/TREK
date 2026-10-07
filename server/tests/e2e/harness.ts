import { JWT_SECRET } from '../../src/config';

import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';

/**
 * Shared e2e harness for migrated Nest modules.
 *
 * Gives each module e2e test a throwaway in-memory SQLite db (the same shape the
 * shared connection exposes), a seed helper for demo data, and a session-cookie
 * signer that produces tokens the REAL JwtAuthGuard accepts — so e2e tests cover
 * the actual auth path end-to-end, not a stubbed guard.
 *
 * Wire it in a test with `vi.mock('../../src/db/database', () => ({ db, ... }))`
 * using the db returned here, then build the Nest app under test.
 */

export interface SeededUser {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  password_version: number;
}

/** Fresh in-memory db with the minimal `users` table the auth guard reads. */
export function createTempDb(): Database.Database {
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'user',
      password_version INTEGER NOT NULL DEFAULT 0
    );
  `);
  return db;
}

/** Insert a demo user and return its row. */
export function seedUser(db: Database.Database, overrides: Partial<SeededUser> = {}): SeededUser {
  const user: SeededUser = {
    id: overrides.id ?? 1,
    username: overrides.username ?? 'e2e-user',
    email: overrides.email ?? 'e2e@example.test',
    role: overrides.role ?? 'user',
    password_version: overrides.password_version ?? 0,
  };
  db.prepare('INSERT INTO users (id, username, email, role, password_version) VALUES (?, ?, ?, ?, ?)').run(
    user.id,
    user.username,
    user.email,
    user.role,
    user.password_version,
  );
  return user;
}

export interface SessionSignOptions {
  /** Embed the remember claim (#1927). Omitted when undefined, like the real generateToken. */
  remember?: boolean;
  /** Backdate the token: seconds of its lifetime already consumed. Requires lifetime. */
  consumed?: number;
  /** Token lifetime in seconds. Default: no exp claim (the historical harness token). */
  lifetime?: number;
}

/** Sign a `trek_session` token the real guard will accept (matching JWT_SECRET + pv). */
export function signSession(userId: number, passwordVersion = 0, opts: SessionSignOptions = {}): string {
  const payload: Record<string, unknown> = { id: userId, pv: passwordVersion };
  if (typeof opts.remember === 'boolean') payload.remember = opts.remember;
  // jsonwebtoken computes exp = iat + expiresIn when iat is supplied in the payload.
  if (typeof opts.consumed === 'number') payload.iat = Math.floor(Date.now() / 1000) - opts.consumed;
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    ...(typeof opts.lifetime === 'number' ? { expiresIn: opts.lifetime } : {}),
  });
}

/** Convenience: the Cookie header value for a signed session. */
export function sessionCookie(userId: number, passwordVersion = 0, opts: SessionSignOptions = {}): string {
  return `trek_session=${signSession(userId, passwordVersion, opts)}`;
}
