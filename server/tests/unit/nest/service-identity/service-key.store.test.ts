/**
 * ServiceKeyStore over the real SettingsService and a migrated database: the
 * key is stored encrypted, the first of two processes keeps its key, and a
 * row that cannot be opened reads as unreadable rather than failing.
 */
import { AppSettings } from '../../../../src/db/entities/AppSettings.entity';
import { encrypt_api_key } from '../../../../src/nest/common/crypto/apiKeyCrypto';
import { parseServiceKey, type ServiceKey } from '../../../../src/nest/service-identity/service-key.format';
import { EMPTY_KEY_STATE, ServiceKeyStore } from '../../../../src/nest/service-identity/service-key.store';
import { SettingsModule } from '../../../../src/nest/settings/settings.module';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { deleteRows, findRow, upsertRow } from '../../../helpers/factories/rows';
import { serviceKeyTokenFor } from '../../../helpers/service-keys';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestModule;
let orm: TestOrm;
let store: ServiceKeyStore;

const keyFor = (i: string): ServiceKey => {
  const key = parseServiceKey(serviceKeyTokenFor({ i, iat: 1_793_000_000, exp: 1_800_776_000 }));
  if (!key) throw new Error('fixture key does not parse');
  return key;
};

const rawValue = async (key: string) => (await findRow(orm, AppSettings, { key }))?.value ?? null;

beforeAll(async () => {
  t = await createTestModule({ db: testDb, imports: [SettingsModule], providers: [ServiceKeyStore] });
  orm = await createTestOrm(testDb);
  store = t.get(ServiceKeyStore);
});

afterAll(async () => {
  await t.close();
  await orm.close();
  testDb.close();
});

beforeEach(async () => {
  await deleteRows(orm, AppSettings, { key: { $in: ['service_key', 'service_key_state'] } });
});

describe('ServiceKeyStore', () => {
  it('SISTORE-001: reads nothing on a fresh install', async () => {
    expect(await store.read()).toEqual({ key: null, unreadable: false, state: EMPTY_KEY_STATE });
  });

  it('SISTORE-002: keeps the key encrypted at rest and reads it back', async () => {
    const key = keyFor('installation-a');
    const state = { ...EMPTY_KEY_STATE, renewAfter: 1_798_184_000 };
    expect(await store.claim(key, state)).toEqual({ key, unreadable: false, state });
    const raw = await rawValue('service_key');
    expect(raw).toMatch(/^enc:v1:/);
    expect(raw).not.toContain(key.token);
    expect(JSON.parse((await rawValue('service_key_state')) ?? '{}')).toEqual(state);
  });

  it('SISTORE-003: the first of two processes keeps its key', async () => {
    const first = keyFor('installation-a');
    await store.claim(first, EMPTY_KEY_STATE);
    const answer = await store.claim(keyFor('installation-b'), EMPTY_KEY_STATE);
    expect(answer.key?.token).toBe(first.token);
  });

  it('SISTORE-004: a row the encryption key cannot open, or that is no key, reads as unreadable', async () => {
    await upsertRow(orm, AppSettings, { key: 'service_key', value: 'enc:v1:bm90IGEgY2lwaGVydGV4dA==' });
    expect(await store.read()).toMatchObject({ key: null, unreadable: true });
    await upsertRow(orm, AppSettings, { key: 'service_key', value: encrypt_api_key('not a key') });
    expect(await store.read()).toMatchObject({ key: null, unreadable: true });
  });

  it('SISTORE-005: replace overwrites what is there, which claim never does', async () => {
    await upsertRow(orm, AppSettings, { key: 'service_key', value: 'enc:v1:broken' });
    const key = keyFor('installation-c');
    await store.replace(key, EMPTY_KEY_STATE);
    expect((await store.read()).key?.token).toBe(key.token);
  });

  it('SISTORE-006: dropping the key keeps the state that says when to ask again, clear removes both', async () => {
    await store.claim(keyFor('installation-a'), EMPTY_KEY_STATE);
    const state = { ...EMPTY_KEY_STATE, reregisterAt: 1_793_000_000_000 };
    await store.dropKey(state);
    expect(await store.read()).toEqual({ key: null, unreadable: false, state });
    await store.clear();
    expect(await rawValue('service_key_state')).toBeNull();
  });

  it('SISTORE-007: a state row of another shape reads as the empty state, field by field', async () => {
    await upsertRow(orm, AppSettings, { key: 'service_key_state', value: '{"revoked":7,"renewAfter":1}' });
    expect((await store.read()).state).toEqual({ ...EMPTY_KEY_STATE, renewAfter: 1 });
    await upsertRow(orm, AppSettings, { key: 'service_key_state', value: 'not json' });
    expect((await store.read()).state).toEqual(EMPTY_KEY_STATE);
    await store.writeState({ ...EMPTY_KEY_STATE, revoked: 'abc' });
    expect((await store.read()).state.revoked).toBe('abc');
  });
});
