/**
 * user-profile.service.test.ts
 *
 * DB-centric unit tests for UserProfileService against a real in-memory SQLite
 * database. The cases moved here with the methods, out of auth.service.test.ts;
 * the AUTH-DB-* case IDs are preserved so the history stays greppable.
 * Constructed directly (no TestingModule, repo convention).
 */

// ---------------------------------------------------------------------------
// vi.hoisted: build the real in-memory DB and the module mock before any import
// ---------------------------------------------------------------------------

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = { db, closeDb: () => {}, reinitialize: () => {}, canAccessTrip: () => undefined, isOwner: () => false };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/nest/common/crypto/apiKeyCrypto', () => ({
  decrypt_api_key: vi.fn((v) => v),
  maybe_encrypt_api_key: vi.fn((v) => v),
  mask_stored_api_key: vi.fn((v: string | null | undefined) => (v ? '••••••••' : null)),
  encrypt_api_key: vi.fn((v) => v),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createAdmin } from '../../helpers/factories';
import { UserProfileService } from '../../../src/nest/auth/user-profile.service';
import { DatabaseService } from '../../../src/nest/database/database.service';

const profile = new UserProfileService(new DatabaseService(testDb));

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  vi.clearAllMocks();
});

afterAll(() => {
  testDb.close();
});

// ---------------------------------------------------------------------------
// updateSettings
// ---------------------------------------------------------------------------

describe('updateSettings', () => {
  it('AUTH-DB-001: updates username successfully', () => {
    const { user } = createUser(testDb);
    const result = profile.updateSettings(user.id, { username: 'newname' });
    expect(result.success).toBe(true);
    expect(result.user?.username).toBe('newname');
  });

  it('AUTH-DB-002: returns 400 when username is too short (< 2 chars)', () => {
    const { user } = createUser(testDb);
    const result = profile.updateSettings(user.id, { username: 'x' });
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/between 2 and 50/i);
  });

  it('AUTH-DB-003: returns 400 when username has invalid characters (spaces)', () => {
    const { user } = createUser(testDb);
    const result = profile.updateSettings(user.id, { username: 'bad name' });
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/only contain/i);
  });

  it('AUTH-DB-004: returns 409 when username is already taken by another user', () => {
    const { user: user1 } = createUser(testDb, { username: 'alice' });
    const { user: user2 } = createUser(testDb, { username: 'bob' });
    const result = profile.updateSettings(user2.id, { username: user1.username });
    expect(result.status).toBe(409);
    expect(result.error).toMatch(/already taken/i);
  });

  it('AUTH-DB-005: updates email successfully', () => {
    const { user } = createUser(testDb);
    const result = profile.updateSettings(user.id, { email: 'new@example.com' });
    expect(result.success).toBe(true);
    expect(result.user?.email).toBe('new@example.com');
  });

  it('AUTH-DB-006: returns 400 for invalid email format', () => {
    const { user } = createUser(testDb);
    const result = profile.updateSettings(user.id, { email: 'not-an-email' });
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/invalid email/i);
  });

  it('AUTH-DB-007: returns 409 when email is already taken by another user', () => {
    const { user: user1 } = createUser(testDb, { email: 'taken@example.com' });
    const { user: user2 } = createUser(testDb);
    const result = profile.updateSettings(user2.id, { email: user1.email });
    expect(result.status).toBe(409);
    expect(result.error).toMatch(/already taken/i);
  });

  it('AUTH-DB-008: returns success with no field changes when empty body is passed', () => {
    const { user } = createUser(testDb);
    const result = profile.updateSettings(user.id, {});
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getSettings
// ---------------------------------------------------------------------------

describe('getSettings', () => {
  it('AUTH-DB-009: returns 403 for non-admin user', () => {
    const { user } = createUser(testDb);
    const result = profile.getSettings(user.id);
    expect(result.status).toBe(403);
    expect(result.error).toMatch(/admin/i);
  });

  it('AUTH-DB-010: returns maps_api_key and openweather_api_key for admin', () => {
    const { user } = createAdmin(testDb);
    testDb
      .prepare('UPDATE users SET maps_api_key = ?, openweather_api_key = ? WHERE id = ?')
      .run('maps-key-value', 'weather-key-value', user.id);
    const result = profile.getSettings(user.id);
    expect(result.status).toBeUndefined();
    expect(result.settings).toBeDefined();
    expect(result.settings).toHaveProperty('maps_api_key');
    expect(result.settings).toHaveProperty('openweather_api_key');
  });

  it('AUTH-DB-010b: round-trips unsplash_api_key through updateApiKeys — masked to the client, readable via getSettings', () => {
    const { user } = createAdmin(testDb);
    const result = profile.updateApiKeys(user.id, { unsplash_api_key: 'unsplash-secret-key' });
    // Returned to the client masked, never in plaintext.
    expect(result.user.unsplash_api_key).toBe('-----key');
    // getSettings returns the stored key to the admin.
    expect(profile.getSettings(user.id).settings?.unsplash_api_key).toBe('unsplash-secret-key');
  });
});

// ---------------------------------------------------------------------------
// listUsers
// ---------------------------------------------------------------------------

describe('listUsers', () => {
  it('AUTH-DB-011: returns all users except self, sorted by username', () => {
    const { user: self } = createUser(testDb, { username: 'zzself' });
    createUser(testDb, { username: 'alice' });
    createUser(testDb, { username: 'charlie' });
    createUser(testDb, { username: 'bob' });
    const result = profile.listUsers(self.id);
    expect(result).toHaveLength(3);
    const names = result.map((u) => u.username);
    expect(names).toEqual([...names].sort());
    expect(names).not.toContain('zzself');
  });

  it('AUTH-DB-012: returns empty array when only one user exists', () => {
    const { user } = createUser(testDb);
    const result = profile.listUsers(user.id);
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// validateKeys
// ---------------------------------------------------------------------------

describe('validateKeys', () => {
  it('AUTH-DB-015: returns 403 for non-admin', async () => {
    const { user } = createUser(testDb);
    const result = await profile.validateKeys(user.id);
    expect(result.status).toBe(403);
    expect(result.error).toMatch(/admin/i);
    expect(result.maps).toBe(false);
    expect(result.weather).toBe(false);
  });

  it('AUTH-DB-016: returns { maps: false, weather: false } when no API keys are stored', async () => {
    const { user } = createAdmin(testDb);
    const result = await profile.validateKeys(user.id);
    expect(result.maps).toBe(false);
    expect(result.weather).toBe(false);
    expect(result.maps_details).toBeNull();
  });

  it('AUTH-DB-017: returns { maps: true } when fetch returns 200', async () => {
    const { user } = createAdmin(testDb);
    testDb.prepare('UPDATE users SET maps_api_key = ? WHERE id = ?').run('test-key', user.id);

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      text: async () => '',
    } as Response);

    const result = await profile.validateKeys(user.id);
    expect(result.maps).toBe(true);
    expect(result.maps_details?.ok).toBe(true);

    fetchSpy.mockRestore();
  });

  it('AUTH-DB-018: returns { maps: false } when fetch throws a network error', async () => {
    const { user } = createAdmin(testDb);
    testDb.prepare('UPDATE users SET maps_api_key = ? WHERE id = ?').run('test-key', user.id);

    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockRejectedValueOnce(new Error('Network failure'));

    const result = await profile.validateKeys(user.id);
    expect(result.maps).toBe(false);
    expect(result.maps_details?.error_status).toBe('FETCH_ERROR');
    expect(result.maps_details?.error_message).toBe('Network failure');

    fetchSpy.mockRestore();
  });
});

describe('updateMapsKey / avatar', () => {
  it('AUTH-DB-068: updateMapsKey stores and answers the masked key', () => {
    const { user } = createUser(testDb);
    const result = profile.updateMapsKey(user.id, 'maps-key-123456');
    expect(result.success).toBe(true);
    expect(result.maps_api_key).toBe('----3456');
  });

  it('AUTH-DB-069: saveAvatar updates the row and answers the public url', async () => {
    const { user } = createUser(testDb);
    const result = await profile.saveAvatar(user.id, 'new.png');
    expect(result).toEqual({ success: true, avatar_url: '/uploads/avatars/new.png' });
  });

  it('AUTH-DB-070: deleteAvatar nulls the column; an OIDC https avatar skips the file rm', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET avatar = ? WHERE id = ?').run('https://idp/pic.jpg', user.id);
    expect(await profile.deleteAvatar(user.id)).toEqual({ success: true });
    const row = testDb.prepare('SELECT avatar FROM users WHERE id = ?').get(user.id) as { avatar: string | null };
    expect(row.avatar).toBeNull();
  });
});

describe('profile quirk fixes', () => {
  it('AUTH-DB-093: updateApiKeys degrades gracefully when the user row is gone (no TypeError/500)', () => {
    expect(() => profile.updateApiKeys(999999, { maps_api_key: 'k' })).not.toThrow();
    const result = profile.updateApiKeys(999999, { openweather_api_key: 'w' });
    expect(result.success).toBe(true);
  });
});
