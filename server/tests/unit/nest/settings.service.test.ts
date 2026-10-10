/**
 * Unit tests for the DI-native SettingsService — SET-SVC-001 through
 * SET-SVC-034 (001–026 moved 1:1 from the legacy
 * tests/unit/services/settingsService.test.ts; 027–030 pin the post-migration
 * quirk fixes: null-serializes-as-'' and the bulk masked-sentinel skip;
 * 031–034 cover the CARTO basemap key).
 * Uses a real in-memory SQLite DB; apiKeyCrypto is mocked to a passthrough
 * so we don't need real encryption for most tests.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ── DB + apiKeyCrypto mock ────────────────────────────────────────────────────

vi.mock('../../../src/db/database', async () => {

  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: () => null,
    isOwner: () => false,
  };
    return mock;
});

// Passthrough crypto — value comes back unchanged for most tests
vi.mock('../../../src/nest/common/crypto/apiKeyCrypto', () => ({
  maybe_encrypt_api_key: (v: string) => v,
  decrypt_api_key: (v: string) => v,
}));

import { db as testDb } from '../../../src/db/database';
import { resetTestDb } from '../../helpers/test-db';
import { createUser } from '../../helpers/factories';
import type { TestOrm } from '../../helpers/test-orm';
import { SettingsService } from '../../../src/nest/settings/settings.service';
import { sharedTestOrm, createTestUnitOfWork, createTestAppSettingsRepo, createTestSettingsRepo } from '../../helpers/test-uow';
import { findRows } from '../../helpers/factories/rows';
import { Settings } from '../../../src/db/entities/Settings.entity';
import { readUserSetting, setAppSetting, setUserSetting } from '../../helpers/factories/settings';

let svc: SettingsService;
let t: TestOrm;

// `t`, `uow` and the two repositories all derive from the SAME `sharedTestOrm(testDb)`
// (task-2-review.md I2): a second, independent `createTestOrm(testDb)` here would give
// `svc`'s repositories a different Kysely client than the one `uow.transactional(...)`
// opens its transaction on — a repository write inside setAdminUserDefaults/
// bulkUpsertSettings's transaction would then run outside it (or contend on a second
// mutex over the same connection), exactly the trap the shared-ORM helpers exist to avoid.
beforeAll(async () => {
  t = await sharedTestOrm(testDb);
  svc = new SettingsService(
    await createTestUnitOfWork(testDb),
    await createTestAppSettingsRepo(testDb),
    await createTestSettingsRepo(testDb),
  );
});

beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});

afterAll(async () => {
  await t.close();
  testDb.close();
});

// ── getUserSettings ───────────────────────────────────────────────────────────

describe('getUserSettings', () => {
  it('SET-SVC-001 — returns empty object when user has no settings', async () => {
    const { user } = createUser(testDb);
    expect(await svc.getUserSettings(user.id)).toEqual({});
  });

  it('SET-SVC-002 — returns stored plain string values', async () => {
    const { user } = createUser(testDb);
    await setUserSetting(t, user.id, 'theme', 'dark');
    const s = await svc.getUserSettings(user.id);
    expect(s.theme).toBe('dark');
  });

  it('SET-SVC-003 — JSON-parses values that are valid JSON', async () => {
    const { user } = createUser(testDb);
    await setUserSetting(t, user.id, 'count', '42');
    await setUserSetting(t, user.id, 'flag', 'true');
    await setUserSetting(t, user.id, 'obj', '{"x":1}');
    const s = await svc.getUserSettings(user.id);
    expect(s.count).toBe(42);
    expect(s.flag).toBe(true);
    expect(s.obj).toEqual({ x: 1 });
  });

  it('SET-SVC-004 — falls back to raw string when value is not valid JSON', async () => {
    const { user } = createUser(testDb);
    await setUserSetting(t, user.id, 'raw', 'not-json');
    const s = await svc.getUserSettings(user.id);
    expect(s.raw).toBe('not-json');
  });

  it('SET-SVC-005 — webhook_url with a value is masked as ••••••••', async () => {
    const { user } = createUser(testDb);
    await setUserSetting(t, user.id, 'webhook_url', 'https://secret.example.com');
    const s = await svc.getUserSettings(user.id);
    expect(s.webhook_url).toBe('••••••••');
  });

  it('SET-SVC-006 — webhook_url with empty value returns empty string', async () => {
    const { user } = createUser(testDb);
    await setUserSetting(t, user.id, 'webhook_url', '');
    const s = await svc.getUserSettings(user.id);
    expect(s.webhook_url).toBe('');
  });

  it('SET-SVC-007 — only returns settings for the requesting user', async () => {
    const { user: a } = createUser(testDb);
    const { user: b } = createUser(testDb);
    await setUserSetting(t, a.id, 'key_a', '"a"');
    await setUserSetting(t, b.id, 'key_b', '"b"');
    const s = await svc.getUserSettings(a.id);
    expect(s).toHaveProperty('key_a');
    expect(s).not.toHaveProperty('key_b');
  });

  // Admin "user defaults" fall-through (#1634) — a system-wide Mapbox token must
  // reach a user who left their own token blank.
  const setAdminDefault = (settingKey: string, value: string) =>
    setAppSetting(t, `default_user_setting_${settingKey}`, value);

  it('SET-SVC-020 — new user with no rows inherits the admin default token', async () => {
    const { user } = createUser(testDb);
    await setAdminDefault('mapbox_access_token', 'pk.admin');
    expect((await svc.getUserSettings(user.id)).mapbox_access_token).toBe('pk.admin');
  });

  it('SET-SVC-021 — an empty user token falls through to the admin default', async () => {
    const { user } = createUser(testDb);
    await setAdminDefault('mapbox_access_token', 'pk.admin');
    await setUserSetting(t, user.id, 'mapbox_access_token', '');
    expect((await svc.getUserSettings(user.id)).mapbox_access_token).toBe('pk.admin');
  });

  it('SET-SVC-022 — a non-empty user token overrides the admin default', async () => {
    const { user } = createUser(testDb);
    await setAdminDefault('mapbox_access_token', 'pk.admin');
    await setUserSetting(t, user.id, 'mapbox_access_token', 'pk.user');
    expect((await svc.getUserSettings(user.id)).mapbox_access_token).toBe('pk.user');
  });

  it('SET-SVC-023 — an empty value with no admin default stays empty (no regression)', async () => {
    const { user } = createUser(testDb);
    await setUserSetting(t, user.id, 'mapbox_style', '');
    expect((await svc.getUserSettings(user.id)).mapbox_style).toBe('');
  });

  it('SET-SVC-024 — a non-defaultable empty value is preserved even against a same-named default', async () => {
    const { user } = createUser(testDb);
    // 'theme' is not a defaultable key: an empty stored value must be returned as-is.
    await setUserSetting(t, user.id, 'theme', '');
    expect((await svc.getUserSettings(user.id)).theme).toBe('');
  });

  it('SET-SVC-025 — an inherited admin llm_api_key is masked, never returned in cleartext', async () => {
    const { user } = createUser(testDb);
    await setAdminDefault('llm_api_key', 'sk-admin-secret');
    // No user row → the value is inherited from the admin default; it is a secret
    // and must reach the client masked, not in cleartext.
    expect((await svc.getUserSettings(user.id)).llm_api_key).toBe('••••••••');
  });

  it('SET-SVC-026 — an empty user llm_api_key falls back to the admin key, still masked', async () => {
    const { user } = createUser(testDb);
    await setAdminDefault('llm_api_key', 'sk-admin-secret');
    await setUserSetting(t, user.id, 'llm_api_key', '');
    expect((await svc.getUserSettings(user.id)).llm_api_key).toBe('••••••••');
  });

  // carto_api_key (#2054): encrypted at rest like the other credentials, but
  // Leaflet builds the tile URL in the browser, so it must come back readable.
  it('SET-SVC-031 — carto_api_key is stored encrypted and read back in cleartext, never masked', async () => {
    const { user } = createUser(testDb);
    await svc.upsertSetting(user.id, 'carto_api_key', 'carto-user');
    // Passthrough crypto mock: the stored row is whatever maybe_encrypt_api_key returned.
    const raw = { value: await readUserSetting(t, user.id, 'carto_api_key') };
    expect(raw.value).toBe('carto-user');
    expect((await svc.getUserSettings(user.id)).carto_api_key).toBe('carto-user');

    // A digits-only key proves it takes the decrypt branch: a non-encrypted key
    // would come back JSON-parsed, as the number 12345.
    await svc.upsertSetting(user.id, 'carto_api_key', '12345');
    expect((await svc.getUserSettings(user.id)).carto_api_key).toBe('12345');
  });

  it('SET-SVC-032 — an empty user carto_api_key falls back to the admin default', async () => {
    const { user } = createUser(testDb);
    await setAdminDefault('carto_api_key', 'carto-admin');
    await setUserSetting(t, user.id, 'carto_api_key', '');
    expect((await svc.getUserSettings(user.id)).carto_api_key).toBe('carto-admin');
  });

  it('SET-SVC-033 — a managed instance injects the operator key over both the user and the admin value', async () => {
    const { user } = createUser(testDb);
    await setAdminDefault('carto_api_key', 'carto-admin');
    await setUserSetting(t, user.id, 'carto_api_key', 'carto-user');
    vi.stubEnv('TREK_MANAGED', 'true');
    vi.stubEnv('CARTO_API_KEY', 'carto-operator');
    try {
      expect((await svc.getUserSettings(user.id)).carto_api_key).toBe('carto-operator');
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('SET-SVC-034 — the injected CARTO key leaves map_provider alone', async () => {
    const { user } = createUser(testDb);
    vi.stubEnv('TREK_MANAGED', 'true');
    vi.stubEnv('CARTO_API_KEY', 'carto-operator');
    vi.stubEnv('MAPBOX_ACCESS_TOKEN', '');
    try {
      // The Mapbox token flips a managed instance to GL because a token means a
      // renderer. A basemap key says nothing about which renderer the user wants.
      const s = await svc.getUserSettings(user.id);
      expect(s.carto_api_key).toBe('carto-operator');
      expect(s.map_provider).toBeUndefined();
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

// ── upsertSetting ─────────────────────────────────────────────────────────────

describe('upsertSetting', () => {
  it('SET-SVC-008 — inserts a new setting', async () => {
    const { user } = createUser(testDb);
    await svc.upsertSetting(user.id, 'language', 'en');
    const s = await svc.getUserSettings(user.id);
    expect(s.language).toBe('en');
  });

  it('SET-SVC-009 — updates an existing setting (ON CONFLICT)', async () => {
    const { user } = createUser(testDb);
    await svc.upsertSetting(user.id, 'language', 'en');
    await svc.upsertSetting(user.id, 'language', 'fr');
    const s = await svc.getUserSettings(user.id);
    expect(s.language).toBe('fr');
  });

  it('SET-SVC-010 — serializes object values as JSON', async () => {
    const { user } = createUser(testDb);
    await svc.upsertSetting(user.id, 'prefs', { dark: true, size: 14 });
    const raw = { value: await readUserSetting(t, user.id, 'prefs') };
    expect(raw.value).toBe('{"dark":true,"size":14}');
  });

  it('SET-SVC-011 — serializes boolean values as strings', async () => {
    const { user } = createUser(testDb);
    await svc.upsertSetting(user.id, 'notifications', true);
    const raw = { value: await readUserSetting(t, user.id, 'notifications') };
    expect(raw.value).toBe('true');
  });

  it('SET-SVC-012 — webhook_url passes through maybe_encrypt_api_key', async () => {
    const { user } = createUser(testDb);
    await svc.upsertSetting(user.id, 'webhook_url', 'https://hook.example.com');
    // With passthrough mock, value is stored as-is
    const raw = { value: await readUserSetting(t, user.id, 'webhook_url') };
    expect(raw.value).toBe('https://hook.example.com');
    // But getUserSettings masks it
    const s = await svc.getUserSettings(user.id);
    expect(s.webhook_url).toBe('••••••••');
  });
});

// ── bulkUpsertSettings ────────────────────────────────────────────────────────

describe('bulkUpsertSettings', () => {
  it('SET-SVC-013 — inserts multiple settings in one call', async () => {
    const { user } = createUser(testDb);
    await svc.bulkUpsertSettings(user.id, { a: 'alpha', b: 'beta', c: 'gamma' });
    const s = await svc.getUserSettings(user.id);
    expect(s.a).toBe('alpha');
    expect(s.b).toBe('beta');
    expect(s.c).toBe('gamma');
  });

  it('SET-SVC-014 — returns the count of settings processed', async () => {
    const { user } = createUser(testDb);
    const count = await svc.bulkUpsertSettings(user.id, { x: 1, y: 2, z: 3 });
    expect(count).toBe(3);
  });

  it('SET-SVC-015 — updates existing keys (ON CONFLICT)', async () => {
    const { user } = createUser(testDb);
    await svc.upsertSetting(user.id, 'theme', 'light');
    await svc.bulkUpsertSettings(user.id, { theme: 'dark', lang: 'en' });
    const s = await svc.getUserSettings(user.id);
    expect(s.theme).toBe('dark');
    expect(s.lang).toBe('en');
  });

  it('SET-SVC-016 — returns 0 for empty settings object', async () => {
    const { user } = createUser(testDb);
    const count = await svc.bulkUpsertSettings(user.id, {});
    expect(count).toBe(0);
  });

  it('SET-SVC-017 — all changes are committed atomically (transaction)', async () => {
    const { user } = createUser(testDb);
    await svc.bulkUpsertSettings(user.id, { p: '1', q: '2' });
    const rows = await findRows(t, Settings, { user: user.id });
    const keys = rows.map((r) => r.key);
    expect(keys).toContain('p');
    expect(keys).toContain('q');
  });

  it('SET-SVC-018 — settings from different users do not interfere', async () => {
    const { user: a } = createUser(testDb);
    const { user: b } = createUser(testDb);
    await svc.bulkUpsertSettings(a.id, { shared_key: 'from-a' });
    await svc.bulkUpsertSettings(b.id, { shared_key: 'from-b' });
    expect((await svc.getUserSettings(a.id) as any).shared_key).toBe('from-a');
    expect((await svc.getUserSettings(b.id) as any).shared_key).toBe('from-b');
  });

  // Was a `vi.spyOn(testDb, 'prepare').mockImplementationOnce(...)` targeting
  // the legacy raw `INSERT INTO settings ...` statement. Now that
  // bulkUpsertSettings writes through SettingsRepository.upsertForUser
  // (em.upsert, via Kysely), the FIRST `prepare` call inside
  // `uow.transactional(...)` is Kysely's own internal machinery, not the
  // application statement — intercepting it corrupted the connection's
  // transaction/mutex state for the rest of the file (every test after this
  // one timed out). Per the inventory's own note for this test
  // ("narrow enough to become a mockRejectedValueOnce on the specific
  // repository method under test"), this now mocks the repository method
  // itself — no raw connection involved, so no risk of corrupting the shared
  // Kysely client's state for later tests.
  it('SET-SVC-019 — rolls back and re-throws when DB write fails mid-transaction', async () => {
    const { user } = createUser(testDb);
    const settingsRepo = await createTestSettingsRepo(testDb);
    const spy = vi.spyOn(settingsRepo, 'upsertForUser').mockRejectedValueOnce(new Error('forced DB error'));
    await expect(svc.bulkUpsertSettings(user.id, { k: 'v' })).rejects.toThrow('forced DB error');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

// ── post-migration quirk fixes ────────────────────────────────────────────────

describe('legacy quirk fixes', () => {
  it('SET-SVC-027 — null serializes as the empty string, not the string "null"', async () => {
    const { user } = createUser(testDb);
    await svc.upsertSetting(user.id, 'llm_api_key', null);
    const raw = { value: await readUserSetting(t, user.id, 'llm_api_key') };
    expect(raw.value).toBe('');
    // The legacy "null" storage leaked back out of getDecryptedUserSetting as
    // the literal string "null"; a cleared secret must read as null.
    expect(await svc.getDecryptedUserSetting(user.id, 'llm_api_key')).toBeNull();
  });

  it('SET-SVC-035 — a week_start default reaches users without their own, and theirs wins (#2029)', async () => {
    const { user: plain } = createUser(testDb);
    const { user: own } = createUser(testDb);
    await svc.setAdminUserDefaults({ week_start: 'sunday' });
    await svc.upsertSetting(own.id, 'week_start', 'saturday');
    expect((await svc.getUserSettings(plain.id)).week_start).toBe('sunday');
    expect((await svc.getUserSettings(own.id)).week_start).toBe('saturday');
  });

  it('SET-SVC-036 — a week_start default outside monday/sunday/saturday is refused and not stored', async () => {
    await expect(svc.setAdminUserDefaults({ week_start: 'friday' })).rejects.toThrow(/Invalid value for week_start/);
    // Vacay's 0/1 numbers are not this setting's values either.
    await expect(svc.setAdminUserDefaults({ week_start: 0 })).rejects.toThrow(/Invalid value for week_start/);
    expect((await svc.getAdminUserDefaults()).week_start).toBeUndefined();
  });

  it('SET-SVC-028 — a nulled defaultable key falls through to the admin default', async () => {
    const { user } = createUser(testDb);
    await svc.setAdminUserDefaults({ mapbox_style: 'admin-style' });
    await svc.upsertSetting(user.id, 'mapbox_style', null);
    expect((await svc.getUserSettings(user.id)).mapbox_style).toBe('admin-style');
  });

  it('SET-SVC-029 — bulk skips the masked sentinel so a stored secret survives', async () => {
    const { user } = createUser(testDb);
    await svc.upsertSetting(user.id, 'ntfy_token', 'tok-real');
    const count = await svc.bulkUpsertSettings(user.id, { ntfy_topic: 'trek', ntfy_token: '••••••••' });
    expect(count).toBe(1);
    // Passthrough crypto mock: the stored value must still be the real token.
    const raw = { value: await readUserSetting(t, user.id, 'ntfy_token') };
    expect(raw.value).toBe('tok-real');
    expect({ value: await readUserSetting(t, user.id, 'ntfy_topic') }).toEqual({ value: 'trek' });
  });

  it('SET-SVC-030 — bulk returns the count of keys actually written', async () => {
    const { user } = createUser(testDb);
    expect(await svc.bulkUpsertSettings(user.id, { a: '1', b: '••••••••' })).toBe(1);
  });
});
