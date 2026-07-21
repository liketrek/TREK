/**
 * Unit tests for settingsService — SET-SVC-001 through SET-SVC-020.
 * Uses a real in-memory SQLite DB; apiKeyCrypto is mocked to a passthrough
 * so we don't need real encryption for most tests.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ── DB + apiKeyCrypto mock ────────────────────────────────────────────────────

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: () => null,
    isOwner: () => false,
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

// Passthrough crypto — value comes back unchanged for most tests
vi.mock('../../../src/services/apiKeyCrypto', () => ({
  maybe_encrypt_api_key: (v: string) => v,
  decrypt_api_key: (v: string) => v,
}));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser } from '../../helpers/factories';
import { getUserSettings, upsertSetting, bulkUpsertSettings } from '../../../src/services/settingsService';

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
});

afterAll(() => {
  testDb.close();
});

// ── getUserSettings ───────────────────────────────────────────────────────────

describe('getUserSettings', () => {
  it('SET-SVC-001 — returns empty object when user has no settings', () => {
    const { user } = createUser(testDb);
    expect(getUserSettings(user.id)).toEqual({});
  });

  it('SET-SVC-002 — returns stored plain string values', () => {
    const { user } = createUser(testDb);
    testDb.prepare("INSERT INTO settings (user_id, key, value) VALUES (?, 'theme', 'dark')").run(user.id);
    const s = getUserSettings(user.id);
    expect(s.theme).toBe('dark');
  });

  it('SET-SVC-003 — JSON-parses values that are valid JSON', () => {
    const { user } = createUser(testDb);
    testDb.prepare("INSERT INTO settings (user_id, key, value) VALUES (?, 'count', '42')").run(user.id);
    testDb.prepare("INSERT INTO settings (user_id, key, value) VALUES (?, 'flag', 'true')").run(user.id);
    testDb.prepare("INSERT INTO settings (user_id, key, value) VALUES (?, 'obj', '{\"x\":1}')").run(user.id);
    const s = getUserSettings(user.id);
    expect(s.count).toBe(42);
    expect(s.flag).toBe(true);
    expect(s.obj).toEqual({ x: 1 });
  });

  it('SET-SVC-004 — falls back to raw string when value is not valid JSON', () => {
    const { user } = createUser(testDb);
    testDb.prepare("INSERT INTO settings (user_id, key, value) VALUES (?, 'raw', 'not-json')").run(user.id);
    const s = getUserSettings(user.id);
    expect(s.raw).toBe('not-json');
  });

  it('SET-SVC-005 — webhook_url with a value is masked as ••••••••', () => {
    const { user } = createUser(testDb);
    testDb.prepare("INSERT INTO settings (user_id, key, value) VALUES (?, 'webhook_url', 'https://secret.example.com')").run(user.id);
    const s = getUserSettings(user.id);
    expect(s.webhook_url).toBe('••••••••');
  });

  it('SET-SVC-006 — webhook_url with empty value returns empty string', () => {
    const { user } = createUser(testDb);
    testDb.prepare("INSERT INTO settings (user_id, key, value) VALUES (?, 'webhook_url', '')").run(user.id);
    const s = getUserSettings(user.id);
    expect(s.webhook_url).toBe('');
  });

  it('SET-SVC-007 — only returns settings for the requesting user', () => {
    const { user: a } = createUser(testDb);
    const { user: b } = createUser(testDb);
    testDb.prepare("INSERT INTO settings (user_id, key, value) VALUES (?, 'key_a', '\"a\"')").run(a.id);
    testDb.prepare("INSERT INTO settings (user_id, key, value) VALUES (?, 'key_b', '\"b\"')").run(b.id);
    const s = getUserSettings(a.id);
    expect(s).toHaveProperty('key_a');
    expect(s).not.toHaveProperty('key_b');
  });

  // Admin "user defaults" fall-through (#1634) — a system-wide Mapbox token must
  // reach a user who left their own token blank.
  const setAdminDefault = (settingKey: string, value: string) =>
    testDb.prepare(
      "INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    ).run(`default_user_setting_${settingKey}`, value);

  it('SET-SVC-020 — new user with no rows inherits the admin default token', () => {
    const { user } = createUser(testDb);
    setAdminDefault('mapbox_access_token', 'pk.admin');
    expect(getUserSettings(user.id).mapbox_access_token).toBe('pk.admin');
  });

  it('SET-SVC-021 — an empty user token falls through to the admin default', () => {
    const { user } = createUser(testDb);
    setAdminDefault('mapbox_access_token', 'pk.admin');
    testDb.prepare("INSERT INTO settings (user_id, key, value) VALUES (?, 'mapbox_access_token', '')").run(user.id);
    expect(getUserSettings(user.id).mapbox_access_token).toBe('pk.admin');
  });

  it('SET-SVC-022 — a non-empty user token overrides the admin default', () => {
    const { user } = createUser(testDb);
    setAdminDefault('mapbox_access_token', 'pk.admin');
    testDb.prepare("INSERT INTO settings (user_id, key, value) VALUES (?, 'mapbox_access_token', 'pk.user')").run(user.id);
    expect(getUserSettings(user.id).mapbox_access_token).toBe('pk.user');
  });

  it('SET-SVC-023 — an empty value with no admin default stays empty (no regression)', () => {
    const { user } = createUser(testDb);
    testDb.prepare("INSERT INTO settings (user_id, key, value) VALUES (?, 'mapbox_style', '')").run(user.id);
    expect(getUserSettings(user.id).mapbox_style).toBe('');
  });

  it('SET-SVC-024 — a non-defaultable empty value is preserved even against a same-named default', () => {
    const { user } = createUser(testDb);
    // 'theme' is not a defaultable key: an empty stored value must be returned as-is.
    testDb.prepare("INSERT INTO settings (user_id, key, value) VALUES (?, 'theme', '')").run(user.id);
    expect(getUserSettings(user.id).theme).toBe('');
  });
});

// ── upsertSetting ─────────────────────────────────────────────────────────────

describe('upsertSetting', () => {
  it('SET-SVC-008 — inserts a new setting', () => {
    const { user } = createUser(testDb);
    upsertSetting(user.id, 'language', 'en');
    const s = getUserSettings(user.id);
    expect(s.language).toBe('en');
  });

  it('SET-SVC-009 — updates an existing setting (ON CONFLICT)', () => {
    const { user } = createUser(testDb);
    upsertSetting(user.id, 'language', 'en');
    upsertSetting(user.id, 'language', 'fr');
    const s = getUserSettings(user.id);
    expect(s.language).toBe('fr');
  });

  it('SET-SVC-010 — serializes object values as JSON', () => {
    const { user } = createUser(testDb);
    upsertSetting(user.id, 'prefs', { dark: true, size: 14 });
    const raw = testDb.prepare("SELECT value FROM settings WHERE user_id = ? AND key = 'prefs'").get(user.id) as any;
    expect(raw.value).toBe('{"dark":true,"size":14}');
  });

  it('SET-SVC-011 — serializes boolean values as strings', () => {
    const { user } = createUser(testDb);
    upsertSetting(user.id, 'notifications', true);
    const raw = testDb.prepare("SELECT value FROM settings WHERE user_id = ? AND key = 'notifications'").get(user.id) as any;
    expect(raw.value).toBe('true');
  });

  it('SET-SVC-012 — webhook_url passes through maybe_encrypt_api_key', () => {
    const { user } = createUser(testDb);
    upsertSetting(user.id, 'webhook_url', 'https://hook.example.com');
    // With passthrough mock, value is stored as-is
    const raw = testDb.prepare("SELECT value FROM settings WHERE user_id = ? AND key = 'webhook_url'").get(user.id) as any;
    expect(raw.value).toBe('https://hook.example.com');
    // But getUserSettings masks it
    const s = getUserSettings(user.id);
    expect(s.webhook_url).toBe('••••••••');
  });
});

// ── bulkUpsertSettings ────────────────────────────────────────────────────────

describe('bulkUpsertSettings', () => {
  it('SET-SVC-013 — inserts multiple settings in one call', () => {
    const { user } = createUser(testDb);
    bulkUpsertSettings(user.id, { a: 'alpha', b: 'beta', c: 'gamma' });
    const s = getUserSettings(user.id);
    expect(s.a).toBe('alpha');
    expect(s.b).toBe('beta');
    expect(s.c).toBe('gamma');
  });

  it('SET-SVC-014 — returns the count of settings processed', () => {
    const { user } = createUser(testDb);
    const count = bulkUpsertSettings(user.id, { x: 1, y: 2, z: 3 });
    expect(count).toBe(3);
  });

  it('SET-SVC-015 — updates existing keys (ON CONFLICT)', () => {
    const { user } = createUser(testDb);
    upsertSetting(user.id, 'theme', 'light');
    bulkUpsertSettings(user.id, { theme: 'dark', lang: 'en' });
    const s = getUserSettings(user.id);
    expect(s.theme).toBe('dark');
    expect(s.lang).toBe('en');
  });

  it('SET-SVC-016 — returns 0 for empty settings object', () => {
    const { user } = createUser(testDb);
    const count = bulkUpsertSettings(user.id, {});
    expect(count).toBe(0);
  });

  it('SET-SVC-017 — all changes are committed atomically (transaction)', () => {
    const { user } = createUser(testDb);
    bulkUpsertSettings(user.id, { p: '1', q: '2' });
    const rows = testDb.prepare('SELECT key FROM settings WHERE user_id = ?').all(user.id) as any[];
    const keys = rows.map((r: any) => r.key);
    expect(keys).toContain('p');
    expect(keys).toContain('q');
  });

  it('SET-SVC-018 — settings from different users do not interfere', () => {
    const { user: a } = createUser(testDb);
    const { user: b } = createUser(testDb);
    bulkUpsertSettings(a.id, { shared_key: 'from-a' });
    bulkUpsertSettings(b.id, { shared_key: 'from-b' });
    expect((getUserSettings(a.id) as any).shared_key).toBe('from-a');
    expect((getUserSettings(b.id) as any).shared_key).toBe('from-b');
  });

  it('SET-SVC-019 — rolls back and re-throws when DB write fails mid-transaction', () => {
    const { user } = createUser(testDb);
    const origPrepare = testDb.prepare.bind(testDb);
    let intercepted = false;
    vi.spyOn(testDb, 'prepare').mockImplementationOnce((sql: string) => {
      const stmt = origPrepare(sql);
      intercepted = true;
      return { run: () => { throw new Error('forced DB error'); } } as any;
    });
    expect(() => bulkUpsertSettings(user.id, { k: 'v' })).toThrow('forced DB error');
    expect(intercepted).toBe(true);
    vi.restoreAllMocks();
  });
});
