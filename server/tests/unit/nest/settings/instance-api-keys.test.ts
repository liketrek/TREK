/**
 * instance-api-keys.test.ts — INSTKEY-001 through INSTKEY-012.
 *
 * The shared resolver behind #1939: the Places/Unsplash credential is instance
 * configuration, so it comes from the env or an encrypted app_settings row, and
 * only then from the caller's own users row. Run against a real in-memory DB
 * with real apiKeyCrypto (ENCRYPTION_KEY comes from tests/setup.ts), because
 * the round trip through the random IV is half of what these functions
 * promise.
 *
 * Plan 3a Task 5: `readInstanceApiKey`/`writeInstanceApiKey`/`resolveApiKey`
 * take a real `AppSettingsRepository`/`UsersRepository` directly now (every
 * real caller — nest/addons, nest/auth × 2, nest/maps, nest/transit,
 * nest/unsplash — constructor-injects its own), so these tests build the same
 * repositories `t.repo(X)` hands any other converted domain's tests, no
 * request-context wrapper needed.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import { createUser, createAdmin } from '../../../helpers/factories';
import { AppSettings } from '../../../../src/db/entities/AppSettings.entity';
import type { AppSettingsRepository } from '../../../../src/db/repositories/AppSettings.repository';
import { Users } from '../../../../src/db/entities/Users.entity';
import type { UsersRepository } from '../../../../src/db/repositories/Users.repository';
import {
  readInstanceApiKey,
  writeInstanceApiKey,
  resolveApiKey,
  operatorKeyVariables,
} from '../../../../src/nest/settings/instance-api-keys';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let appSettings: AppSettingsRepository;
let users: UsersRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  appSettings = t.repo(AppSettings);
  users = t.repo(Users);
});

beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
  delete process.env.PLACES_API_KEY;
});

afterAll(async () => {
  await t.close();
  testDb.close();
});

const storedValue = (key: string) =>
  (testDb.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined)?.value;

describe('instance API keys', () => {
  it('INSTKEY-001: round-trips through encryption at rest', async () => {
    await writeInstanceApiKey(appSettings, 'maps_api_key', 'AIza-instance-key');
    expect(storedValue('maps_api_key')).toMatch(/^enc:v1:/);
    expect(storedValue('maps_api_key')).not.toContain('AIza-instance-key');
    expect(await readInstanceApiKey(appSettings, 'maps_api_key')).toBe('AIza-instance-key');
  });

  it('INSTKEY-002: a second write of the same value replaces the row (no second one)', async () => {
    await writeInstanceApiKey(appSettings, 'maps_api_key', 'same-key');
    const first = storedValue('maps_api_key');
    await writeInstanceApiKey(appSettings, 'maps_api_key', 'same-key');
    // Same plaintext, different blob — the IV is random. That is exactly why
    // "did this change?" is never asked of the stored value.
    expect(storedValue('maps_api_key')).not.toBe(first);
    expect(await readInstanceApiKey(appSettings, 'maps_api_key')).toBe('same-key');
    const rows = testDb.prepare("SELECT COUNT(*) AS n FROM app_settings WHERE key = 'maps_api_key'").get() as { n: number };
    expect(rows.n).toBe(1);
  });

  it('INSTKEY-003: a blank value reads back as unset but keeps the row', async () => {
    await writeInstanceApiKey(appSettings, 'unsplash_api_key', '   ');
    expect(storedValue('unsplash_api_key')).toBe('');
    expect(await readInstanceApiKey(appSettings, 'unsplash_api_key')).toBeNull();
  });

  it('INSTKEY-004: a legacy plaintext row still reads', async () => {
    testDb.prepare("INSERT INTO app_settings (key, value) VALUES ('maps_api_key', 'plain-old-key')").run();
    expect(await readInstanceApiKey(appSettings, 'maps_api_key')).toBe('plain-old-key');
  });

  it('INSTKEY-005: the operator env key wins and the database is never read', async () => {
    process.env.PLACES_API_KEY = 'operator-key';
    await writeInstanceApiKey(appSettings, 'maps_api_key', 'instance-key');
    expect(await resolveApiKey(appSettings, users, 'maps_api_key', 1, process.env.PLACES_API_KEY)).toEqual({
      key: 'operator-key',
      source: 'operator-env',
    });
  });

  it('INSTKEY-006: the instance value wins over the caller own row', async () => {
    const { user } = createAdmin(testDb);
    testDb.prepare('UPDATE users SET maps_api_key = ? WHERE id = ?').run('personal-key', user.id);
    await writeInstanceApiKey(appSettings, 'maps_api_key', 'instance-key');
    expect(await resolveApiKey(appSettings, users, 'maps_api_key', user.id, undefined)).toEqual({
      key: 'instance-key',
      source: 'instance',
    });
  });

  it("INSTKEY-007: without an instance value the caller's own row answers — and nobody else's (#1939)", async () => {
    const { user: admin } = createAdmin(testDb);
    testDb.prepare('UPDATE users SET maps_api_key = ? WHERE id = ?').run('admins-own-key', admin.id);
    const { user: member } = createUser(testDb);

    // The admin gets theirs...
    expect(await resolveApiKey(appSettings, users, 'maps_api_key', admin.id, undefined)).toEqual({
      key: 'admins-own-key',
      source: 'user-row',
    });
    // ...and the member gets nothing rather than the admin's, which is the whole
    // point: they used to get it, and Google answered them with a 403.
    expect(await resolveApiKey(appSettings, users, 'maps_api_key', member.id, undefined)).toEqual({ key: null, source: null });
  });

  it('INSTKEY-009: userId 0 asks about the instance only', async () => {
    const { user } = createAdmin(testDb);
    testDb.prepare('UPDATE users SET maps_api_key = ? WHERE id = ?').run('personal-key', user.id);
    // app-config is optional-auth: with nobody asking there is no own row, and
    // the answer must not be some other row that happens to be first.
    expect(await resolveApiKey(appSettings, users, 'maps_api_key', 0, undefined)).toEqual({ key: null, source: null });
    await writeInstanceApiKey(appSettings, 'maps_api_key', 'instance-key');
    expect(await resolveApiKey(appSettings, users, 'maps_api_key', 0, undefined)).toEqual({
      key: 'instance-key',
      source: 'instance',
    });
  });

  it('INSTKEY-008: an empty instance value does not fall through to the own row', async () => {
    const { user } = createAdmin(testDb);
    testDb.prepare('UPDATE users SET unsplash_api_key = ? WHERE id = ?').run('stale-personal', user.id);
    await writeInstanceApiKey(appSettings, 'unsplash_api_key', 'to-be-cleared');
    await writeInstanceApiKey(appSettings, 'unsplash_api_key', '');
    // The admin who cleared the field cleared their column in the same save, so
    // the fallback finding the old value would only happen on a row nobody
    // touched — here it must not resurrect a cleared instance key for them.
    testDb.prepare('UPDATE users SET unsplash_api_key = NULL WHERE id = ?').run(user.id);
    expect(await resolveApiKey(appSettings, users, 'unsplash_api_key', user.id, undefined)).toEqual({ key: null, source: null });
  });
});

describe('operatorKeyVariables (#1881)', () => {
  const VARS = ['PLACES_API_KEY', 'UNSPLASH_ACCESS_KEY', 'AMAP_API_KEY'] as const;
  const saved: Partial<Record<(typeof VARS)[number], string>> = {};
  beforeEach(() => {
    for (const v of VARS) {
      saved[v] = process.env[v];
      delete process.env[v];
    }
  });
  afterAll(() => {
    for (const v of VARS) {
      if (saved[v] === undefined) delete process.env[v];
      else process.env[v] = saved[v];
    }
  });

  it('INSTKEY-010: names nothing while no variable is set', () => {
    expect(operatorKeyVariables()).toEqual({});
  });

  it('INSTKEY-011: names the variable behind each key that has one, never its value', () => {
    process.env.PLACES_API_KEY = 'google-from-env';
    process.env.UNSPLASH_ACCESS_KEY = 'unsplash-from-env';
    process.env.AMAP_API_KEY = 'amap-from-env';
    const set = operatorKeyVariables();
    expect(set).toEqual({
      maps_api_key: 'PLACES_API_KEY',
      unsplash_api_key: 'UNSPLASH_ACCESS_KEY',
      amap_api_key: 'AMAP_API_KEY',
    });
    expect(JSON.stringify(set)).not.toContain('from-env');
  });

  it('INSTKEY-012: a blank variable does not count as set', () => {
    process.env.PLACES_API_KEY = '';
    process.env.UNSPLASH_ACCESS_KEY = '   ';
    expect(operatorKeyVariables()).toEqual({});
  });
});
