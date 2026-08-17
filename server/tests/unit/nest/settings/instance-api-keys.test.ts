/**
 * instance-api-keys.test.ts — INSTKEY-001 through INSTKEY-008.
 *
 * The shared resolver behind #1939: the Places/Unsplash credential is instance
 * configuration, so it comes from the env or an encrypted app_settings row, and
 * only then from the caller's own users row. Run against a real in-memory DB
 * with real apiKeyCrypto (a fixed ENCRYPTION_KEY), because the round trip
 * through the random IV is half of what these functions promise.
 */

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  return { testDb: db, dbMock: { db, closeDb: () => {}, reinitialize: () => {} } };
});

vi.mock('../../../../src/db/database', () => dbMock);
vi.mock('../../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
}));

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { createTables } from '../../../../src/db/schema';
import { runMigrations } from '../../../../src/db/migrations';
import { createUser, createAdmin } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { DatabaseService } from '../../../../src/nest/database/database.service';
import {
  readInstanceApiKey,
  writeInstanceApiKey,
  resolveApiKey,
} from '../../../../src/nest/settings/instance-api-keys';

const db = new DatabaseService(testDb);

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  delete process.env.PLACES_API_KEY;
});

afterAll(() => {
  testDb.close();
});

const storedValue = (key: string) =>
  (testDb.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined)?.value;

describe('instance API keys', () => {
  it('INSTKEY-001: round-trips through encryption at rest', () => {
    writeInstanceApiKey(db, 'maps_api_key', 'AIza-instance-key');
    expect(storedValue('maps_api_key')).toMatch(/^enc:v1:/);
    expect(storedValue('maps_api_key')).not.toContain('AIza-instance-key');
    expect(readInstanceApiKey(db, 'maps_api_key')).toBe('AIza-instance-key');
  });

  it('INSTKEY-002: a second write of the same value replaces the row (no second one)', () => {
    writeInstanceApiKey(db, 'maps_api_key', 'same-key');
    const first = storedValue('maps_api_key');
    writeInstanceApiKey(db, 'maps_api_key', 'same-key');
    // Same plaintext, different blob — the IV is random. That is exactly why
    // "did this change?" is never asked of the stored value.
    expect(storedValue('maps_api_key')).not.toBe(first);
    expect(readInstanceApiKey(db, 'maps_api_key')).toBe('same-key');
    const rows = testDb.prepare("SELECT COUNT(*) AS n FROM app_settings WHERE key = 'maps_api_key'").get() as { n: number };
    expect(rows.n).toBe(1);
  });

  it('INSTKEY-003: a blank value reads back as unset but keeps the row', () => {
    writeInstanceApiKey(db, 'unsplash_api_key', '   ');
    expect(storedValue('unsplash_api_key')).toBe('');
    expect(readInstanceApiKey(db, 'unsplash_api_key')).toBeNull();
  });

  it('INSTKEY-004: a legacy plaintext row still reads', () => {
    testDb.prepare("INSERT INTO app_settings (key, value) VALUES ('maps_api_key', 'plain-old-key')").run();
    expect(readInstanceApiKey(db, 'maps_api_key')).toBe('plain-old-key');
  });

  it('INSTKEY-005: the operator env key wins and the database is never read', () => {
    process.env.PLACES_API_KEY = 'operator-key';
    writeInstanceApiKey(db, 'maps_api_key', 'instance-key');
    expect(resolveApiKey(db, 'maps_api_key', 1, process.env.PLACES_API_KEY)).toEqual({
      key: 'operator-key',
      source: 'operator-env',
    });
  });

  it('INSTKEY-006: the instance value wins over the caller own row', () => {
    const { user } = createAdmin(testDb);
    testDb.prepare('UPDATE users SET maps_api_key = ? WHERE id = ?').run('personal-key', user.id);
    writeInstanceApiKey(db, 'maps_api_key', 'instance-key');
    expect(resolveApiKey(db, 'maps_api_key', user.id, undefined)).toEqual({ key: 'instance-key', source: 'instance' });
  });

  it("INSTKEY-007: without an instance value the caller's own row answers — and nobody else's (#1939)", () => {
    const { user: admin } = createAdmin(testDb);
    testDb.prepare('UPDATE users SET maps_api_key = ? WHERE id = ?').run('admins-own-key', admin.id);
    const { user: member } = createUser(testDb);

    // The admin gets theirs...
    expect(resolveApiKey(db, 'maps_api_key', admin.id, undefined)).toEqual({
      key: 'admins-own-key',
      source: 'user-row',
    });
    // ...and the member gets nothing rather than the admin's, which is the whole
    // point: they used to get it, and Google answered them with a 403.
    expect(resolveApiKey(db, 'maps_api_key', member.id, undefined)).toEqual({ key: null, source: null });
  });

  it('INSTKEY-009: userId 0 asks about the instance only', () => {
    const { user } = createAdmin(testDb);
    testDb.prepare('UPDATE users SET maps_api_key = ? WHERE id = ?').run('personal-key', user.id);
    // app-config is optional-auth: with nobody asking there is no own row, and
    // the answer must not be some other row that happens to be first.
    expect(resolveApiKey(db, 'maps_api_key', 0, undefined)).toEqual({ key: null, source: null });
    writeInstanceApiKey(db, 'maps_api_key', 'instance-key');
    expect(resolveApiKey(db, 'maps_api_key', 0, undefined)).toEqual({ key: 'instance-key', source: 'instance' });
  });

  it('INSTKEY-008: an empty instance value does not fall through to the own row', () => {
    const { user } = createAdmin(testDb);
    testDb.prepare('UPDATE users SET unsplash_api_key = ? WHERE id = ?').run('stale-personal', user.id);
    writeInstanceApiKey(db, 'unsplash_api_key', 'to-be-cleared');
    writeInstanceApiKey(db, 'unsplash_api_key', '');
    // The admin who cleared the field cleared their column in the same save, so
    // the fallback finding the old value would only happen on a row nobody
    // touched — here it must not resurrect a cleared instance key for them.
    testDb.prepare('UPDATE users SET unsplash_api_key = NULL WHERE id = ?').run(user.id);
    expect(resolveApiKey(db, 'unsplash_api_key', user.id, undefined)).toEqual({ key: null, source: null });
  });
});
