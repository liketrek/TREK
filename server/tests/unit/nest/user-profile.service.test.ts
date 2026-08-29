// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------
import { runMigrations } from '../../../src/db/migrations';
import { createTables } from '../../../src/db/schema';
import { UserProfileService } from '../../../src/nest/auth/user-profile.service';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { SEARCH_TEXT_FIELD_MASK } from '../../../src/nest/maps/maps.helpers';
import { createUser, createAdmin } from '../../helpers/factories';
import { makeStorageFixture } from '../../helpers/storage-fixture';
import { resetTestDb } from '../../helpers/test-db';

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';

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

const avatarsFx = makeStorageFixture('avatars/');
const profile = new UserProfileService(new DatabaseService(testDb), avatarsFx.storage);

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

    const fetchSpy = vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network failure'));

    const result = await profile.validateKeys(user.id);
    expect(result.maps).toBe(false);
    expect(result.maps_details?.error_status).toBe('FETCH_ERROR');
    expect(result.maps_details?.error_message).toBe('Network failure');

    fetchSpy.mockRestore();
  });

  it('AUTH-DB-098: sends Referer from APP_URL so referrer-restricted keys validate like real requests', async () => {
    const { user } = createAdmin(testDb);
    testDb.prepare('UPDATE users SET maps_api_key = ? WHERE id = ?').run('test-key', user.id);

    const prevAppUrl = process.env.APP_URL;
    process.env.APP_URL = 'https://trek.example.com';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      text: async () => '',
    } as Response);

    await profile.validateKeys(user.id);
    const headers = (fetchSpy.mock.calls[0]?.[1]?.headers ?? {}) as Record<string, string>;
    expect(headers.Referer).toBe('https://trek.example.com');

    fetchSpy.mockRestore();
    if (prevAppUrl === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = prevAppUrl;
  });

  it('AUTH-DB-111: probes the operator key on an install where the admin has no column of their own', async () => {
    const prevPlacesKey = process.env.PLACES_API_KEY;
    process.env.PLACES_API_KEY = 'operator-key';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      text: async () => '',
    } as Response);

    try {
      // The admin column stays empty on purpose: on an operator-run install the
      // key belongs to whoever runs the box, and the panel used to answer
      // "no maps key" while every search on that same install worked.
      const { user } = createAdmin(testDb);
      const result = await profile.validateKeys(user.id);
      const headers = (fetchSpy.mock.calls[0]?.[1]?.headers ?? {}) as Record<string, string>;
      expect(headers['X-Goog-Api-Key']).toBe('operator-key');
      expect(result.maps).toBe(true);
    } finally {
      fetchSpy.mockRestore();
      if (prevPlacesKey === undefined) delete process.env.PLACES_API_KEY;
      else process.env.PLACES_API_KEY = prevPlacesKey;
    }
  });

  it('AUTH-DB-112: probes the instance key, not a stale value in the admin own column', async () => {
    const { user } = createAdmin(testDb);
    // What a second admin sees after the instance key was saved by the first
    // one: their column still holds whatever they pasted long ago, while every
    // search on the install runs on the app_settings row.
    testDb.prepare('UPDATE users SET maps_api_key = ? WHERE id = ?').run('stale-personal-key', user.id);
    testDb.prepare("INSERT INTO app_settings (key, value) VALUES ('maps_api_key', 'live-instance-key')").run();

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      text: async () => '',
    } as Response);

    await profile.validateKeys(user.id);
    const headers = (fetchSpy.mock.calls[0]?.[1]?.headers ?? {}) as Record<string, string>;
    expect(headers['X-Goog-Api-Key']).toBe('live-instance-key');
    // And it asks for the fields the real search asks for, so a key restricted
    // to fewer Places SKUs fails the test button instead of passing it.
    expect(headers['X-Goog-FieldMask']).toBe(SEARCH_TEXT_FIELD_MASK);

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

  function writeAvatar(name: string): string {
    const dir = path.join(avatarsFx.root, 'avatars');
    fs.mkdirSync(dir, { recursive: true });
    const fp = path.join(dir, name);
    fs.writeFileSync(fp, 'png-bytes');
    return fp;
  }

  it('AUTH-DB-069b: saveAvatar reclaims the previous uploaded avatar file', async () => {
    const { user } = createUser(testDb);
    const old = writeAvatar('old.png');
    testDb.prepare('UPDATE users SET avatar = ? WHERE id = ?').run('old.png', user.id);

    await profile.saveAvatar(user.id, 'new.png');
    expect(fs.existsSync(old)).toBe(false);
  });

  it('AUTH-DB-070b: deleteAvatar removes the uploaded avatar file', async () => {
    const { user } = createUser(testDb);
    const fp = writeAvatar('mine.png');
    testDb.prepare('UPDATE users SET avatar = ? WHERE id = ?').run('mine.png', user.id);

    expect(await profile.deleteAvatar(user.id)).toEqual({ success: true });
    expect(fs.existsSync(fp)).toBe(false);
  });

  it('AUTH-DB-070c: a hostile stored avatar value is swallowed, never thrown', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET avatar = ? WHERE id = ?').run('../../etc/passwd', user.id);
    // Central key validation rejects the value; the delete swallows it exactly
    // like the old rm().catch did — the DB update still wins.
    expect(await profile.deleteAvatar(user.id)).toEqual({ success: true });
  });
});

describe('profile quirk fixes', () => {
  it('AUTH-DB-093: updateApiKeys degrades gracefully when the user row is gone (no TypeError/500)', () => {
    expect(() => profile.updateApiKeys(999999, { maps_api_key: 'k' })).not.toThrow();
    const result = profile.updateApiKeys(999999, { openweather_api_key: 'w' });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Instance-wide keys + changedKeys (#1939)
//
// apiKeyCrypto is mocked to identity in this file, so nothing here asserts
// anything about encryption — the random-IV half of changedKeys is pinned in
// tests/integration/security.test.ts, which runs with a real ENCRYPTION_KEY.
// ---------------------------------------------------------------------------

const instanceRow = (key: string) =>
  (testDb.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined)?.value;

describe('instance-wide API keys', () => {
  it('AUTH-DB-102: an admin save lands in app_settings AND in their own column', () => {
    const { user } = createAdmin(testDb);
    profile.updateApiKeys(user.id, { maps_api_key: 'instance-google-key', unsplash_api_key: 'instance-unsplash-key' });
    expect(instanceRow('maps_api_key')).toBe('instance-google-key');
    expect(instanceRow('unsplash_api_key')).toBe('instance-unsplash-key');
    // The column stays in step so clearing the field clears both.
    const row = testDb.prepare('SELECT maps_api_key FROM users WHERE id = ?').get(user.id) as { maps_api_key: string };
    expect(row.maps_api_key).toBe('instance-google-key');
  });

  it('AUTH-DB-103: a non-admin save never touches the instance value', () => {
    const { user: admin } = createAdmin(testDb);
    profile.updateApiKeys(admin.id, { maps_api_key: 'admin-set' });
    const { user } = createUser(testDb);
    profile.updateApiKeys(user.id, { maps_api_key: 'members-own' });
    expect(instanceRow('maps_api_key')).toBe('admin-set');
    const row = testDb.prepare('SELECT maps_api_key FROM users WHERE id = ?').get(user.id) as { maps_api_key: string };
    expect(row.maps_api_key).toBe('members-own');
  });

  it('AUTH-DB-104: clearing the field stores an empty instance value rather than dropping the row', () => {
    const { user } = createAdmin(testDb);
    profile.updateApiKeys(user.id, { maps_api_key: 'to-be-removed' });
    profile.updateApiKeys(user.id, { maps_api_key: '' });
    // '' and not a missing row: a missing row would fall through to whatever
    // still sat in the admin's own column.
    expect(instanceRow('maps_api_key')).toBe('');
  });

  it('AUTH-DB-105: getSettings reads the instance value, not the admin own column', () => {
    const { user } = createAdmin(testDb);
    testDb.prepare('UPDATE users SET maps_api_key = ? WHERE id = ?').run('stale-personal-key', user.id);
    testDb.prepare("INSERT INTO app_settings (key, value) VALUES ('maps_api_key', 'live-instance-key')").run();
    expect(profile.getSettings(user.id).settings?.maps_api_key).toBe('live-instance-key');
    // openweather is per-user and unaffected.
    expect(profile.getSettings(user.id).settings?.openweather_api_key).toBeNull();
  });

  it('AUTH-DB-106: updateMapsKey mirrors for an admin and stays personal for a member', () => {
    const { user: admin } = createAdmin(testDb);
    expect(profile.updateMapsKey(admin.id, 'via-maps-key-route').changedKeys).toEqual(['maps_api_key']);
    expect(instanceRow('maps_api_key')).toBe('via-maps-key-route');
    const { user } = createUser(testDb);
    profile.updateMapsKey(user.id, 'members-own');
    expect(instanceRow('maps_api_key')).toBe('via-maps-key-route');
  });

  it('AUTH-DB-107: updateSettings mirrors the key half without touching name/email handling', () => {
    const { user } = createAdmin(testDb);
    const result = profile.updateSettings(user.id, { maps_api_key: 'from-settings-route', username: 'renamed' });
    expect(result.success).toBe(true);
    expect(result.user?.username).toBe('renamed');
    expect(instanceRow('maps_api_key')).toBe('from-settings-route');
    expect(result.changedKeys).toEqual(['maps_api_key']);
  });
});

describe('changedKeys', () => {
  it('AUTH-DB-108: only the names in the body count, and clearing counts as a change', () => {
    const { user } = createAdmin(testDb);
    profile.updateApiKeys(user.id, { maps_api_key: 'k1', openweather_api_key: 'w1' });
    // unsplash was never sent, so it can never be reported.
    expect(profile.updateApiKeys(user.id, { openweather_api_key: 'w2' }).changedKeys).toEqual(['openweather_api_key']);
    expect(profile.updateApiKeys(user.id, { maps_api_key: '' }).changedKeys).toEqual(['maps_api_key']);
  });

  it('AUTH-DB-109: an unchanged value reports nothing, whitespace included', () => {
    const { user } = createAdmin(testDb);
    profile.updateApiKeys(user.id, { maps_api_key: 'unchanged-key' });
    expect(profile.updateApiKeys(user.id, { maps_api_key: 'unchanged-key' }).changedKeys).toEqual([]);
    // maybe_encrypt_api_key trims on the way in, so the comparison has to too.
    expect(profile.updateApiKeys(user.id, { maps_api_key: '  unchanged-key  ' }).changedKeys).toEqual([]);
    // A member is measured against their own column, not the instance value.
    const { user: member } = createUser(testDb);
    expect(profile.updateApiKeys(member.id, { maps_api_key: 'unchanged-key' }).changedKeys).toEqual(['maps_api_key']);
  });

  it('AUTH-DB-110: a managed install reports no change for the names it refuses to write', () => {
    const prev = process.env.TREK_MANAGED;
    process.env.TREK_MANAGED = 'true';
    try {
      const { user } = createAdmin(testDb);
      const result = profile.updateApiKeys(user.id, { maps_api_key: 'operator-owns-this' });
      expect(result.managed_keys).toEqual(['maps_api_key']);
      expect(result.changedKeys).toEqual([]);
      expect(instanceRow('maps_api_key')).toBeUndefined();
      expect(profile.updateMapsKey(user.id, 'operator-owns-this').changedKeys).toEqual([]);
      expect(profile.updateSettings(user.id, { maps_api_key: 'operator-owns-this' }).changedKeys).toEqual([]);
    } finally {
      if (prev === undefined) delete process.env.TREK_MANAGED;
      else process.env.TREK_MANAGED = prev;
    }
  });
});
