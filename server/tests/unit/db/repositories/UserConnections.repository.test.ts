/**
 * The repositories for the third-party connections a user keeps on their own
 * `users` row: Immich, Synology Photos and AirTrail. They share the table with
 * UsersRepository; the Immich cases moved here with their methods, and the rest
 * pin each statement's columns and its missing-user branch.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import { createUser } from '../../../helpers/factories';
import { Users } from '../../../../src/db/entities/Users.entity';
import { updateRows } from '../../../helpers/factories/rows';
import { readUser } from '../../../helpers/factories/users';
import { UserImmichRepository } from '../../../../src/db/repositories/UserImmich.repository';
import { UserSynologyRepository } from '../../../../src/db/repositories/UserSynology.repository';
import { UserAirtrailRepository } from '../../../../src/db/repositories/UserAirtrail.repository';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let immich: UserImmichRepository;
let synology: UserSynologyRepository;
let airtrail: UserAirtrailRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  immich = new UserImmichRepository(t.orm.em);
  synology = new UserSynologyRepository(t.orm.em);
  airtrail = new UserAirtrailRepository(t.orm.em);
});
beforeEach(() => { resetTestDb(testDb); t.clear(); });
afterAll(async () => { await t.close(); testDb.close(); });

/** Counts the queries MikroORM issues over the shared connection while `fn` runs. */
async function withQueryCount<T>(fn: () => Promise<T>): Promise<{ value: T; queries: number }> {
  const connection = t.orm.em.getConnection();
  const spy = vi.spyOn(connection, 'execute');
  try {
    const value = await fn();
    return { value, queries: spy.mock.calls.length };
  } finally {
    spy.mockRestore();
  }
}

describe('UserImmichRepository — reads', () => {
  it('M1: getImmichAutoUpload returns its column, and null for a missing user', async () => {
    const { user } = createUser(testDb);
    await updateRows(t, Users, { id: user.id }, { immich_auto_upload: 1 });
    expect(await immich.getImmichAutoUpload(user.id)).toBe(1);
    expect(await immich.getImmichAutoUpload(999999)).toBeNull();
  });

  it('M1b: getImmichCredentials / getImmichConnectionPrefs carry immich_allow_insecure_tls (#2475), and the missing-user branch', async () => {
    const { user } = createUser(testDb);
    await updateRows(t, Users, { id: user.id }, { immich_url: 'https://immich.test', immich_api_key: 'key-1', immich_auto_upload: 1, immich_allow_insecure_tls: 1 });

    expect(await immich.getImmichCredentials(user.id)).toEqual({
      immich_url: 'https://immich.test',
      immich_api_key: 'key-1',
      immich_allow_insecure_tls: 1,
    });
    expect(await immich.getImmichCredentials(999999)).toBeNull();

    expect(await immich.getImmichConnectionPrefs(user.id)).toEqual({ immich_auto_upload: 1, immich_allow_insecure_tls: 1 });
    expect(await immich.getImmichConnectionPrefs(999999)).toBeNull();
  });
});

// IM4/IM5 (`ImmichService.saveImmichSettings`, #2475): the self-signed switch
// is decided INSIDE the UPDATE by `coalesceOverrideWhileSame`, the way the
// legacy CASE did it. These pin the stored values for every branch against
// the legacy statement's own text, and that the write stays one statement —
// a read-then-write would be an interleaving window the legacy SQL never had.
describe('UserImmichRepository — Immich settings write (IM4/IM5)', () => {
  const read = async (id: number) => {
    const row = await readUser(t, id);
    return {
      immich_url: row.immich_url, immich_api_key: row.immich_api_key, immich_allow_insecure_tls: row.immich_allow_insecure_tls,
    };
  };

  it('USERSREPO-085 (IM4): setImmichSettings keeps the stored switch on a null value while the URL stays the same, and starts a new URL off', async () => {
    const { user } = createUser(testDb);
    await updateRows(t, Users, { id: user.id }, { immich_url: 'https://nas.local', immich_api_key: 'enc-old', immich_allow_insecure_tls: 1 });

    // An older client that does not know the switch cannot clear it by saving.
    await immich.setImmichSettings(user.id, 'https://nas.local', 'enc-new', null);
    expect(await read(user.id)).toEqual({ immich_url: 'https://nas.local', immich_api_key: 'enc-new', immich_allow_insecure_tls: 1 });

    // Sent explicitly, the value wins over the stored one.
    await immich.setImmichSettings(user.id, 'https://nas.local', 'enc-new', 0);
    expect((await read(user.id)).immich_allow_insecure_tls).toBe(0);
    await immich.setImmichSettings(user.id, 'https://nas.local', 'enc-new', 1);
    expect((await read(user.id)).immich_allow_insecure_tls).toBe(1);

    // The switch trusts one server: another URL without it starts off ...
    await immich.setImmichSettings(user.id, 'https://photos.example.com', 'enc-2', null);
    expect(await read(user.id)).toEqual({ immich_url: 'https://photos.example.com', immich_api_key: 'enc-2', immich_allow_insecure_tls: 0 });
    // ... and with it, holds for that server.
    await immich.setImmichSettings(user.id, 'https://other.example.com', 'enc-3', 1);
    expect(await read(user.id)).toEqual({ immich_url: 'https://other.example.com', immich_api_key: 'enc-3', immich_allow_insecure_tls: 1 });

    // A first connection (no stored URL) without the switch starts off too.
    await updateRows(t, Users, { id: user.id }, { immich_url: null, immich_allow_insecure_tls: 1 });
    await immich.setImmichSettings(user.id, 'https://nas.local', 'enc-4', null);
    expect(await read(user.id)).toEqual({ immich_url: 'https://nas.local', immich_api_key: 'enc-4', immich_allow_insecure_tls: 0 });
  });

  it('USERSREPO-086 (IM4): setImmichSettings matches the legacy CASE statement across every (stored url, stored switch, new url, value) combination, in ONE statement', async () => {
    const { user } = createUser(testDb);
    // test-sql-allow: legacy statement run raw as the parity oracle for the repository read.
    const legacy = testDb.prepare(
      `UPDATE users SET immich_url = ?, immich_api_key = ?,
         immich_allow_insecure_tls = CASE WHEN immich_url IS ? THEN COALESCE(?, immich_allow_insecure_tls) ELSE COALESCE(?, 0) END
       WHERE id = ?`,
    );
    for (const storedUrl of [null, 'https://nas.local']) {
      for (const storedFlag of [0, 1]) {
        for (const newUrl of ['https://nas.local', 'https://photos.example.com']) {
          for (const value of [null, 0, 1]) {
            await updateRows(t, Users, { id: user.id }, { immich_url: storedUrl, immich_api_key: null, immich_allow_insecure_tls: storedFlag });
            legacy.run(newUrl, 'enc-key', newUrl, value, value, user.id);
            const expected = await read(user.id);

            await updateRows(t, Users, { id: user.id }, { immich_url: storedUrl, immich_api_key: null, immich_allow_insecure_tls: storedFlag });
            const { queries } = await withQueryCount(() => immich.setImmichSettings(user.id, newUrl, 'enc-key', value));
            expect(queries).toBe(1);
            expect(await read(user.id)).toEqual(expected);
          }
        }
      }
    }
  });

  it('USERSREPO-087 (IM5): clearImmichSettings nulls the URL, stores the key it is handed and always turns the switch off', async () => {
    const { user } = createUser(testDb);
    await updateRows(t, Users, { id: user.id }, { immich_url: 'https://nas.local', immich_api_key: 'enc-old', immich_allow_insecure_tls: 1 });
    await immich.clearImmichSettings(user.id, null);
    expect(await read(user.id)).toEqual({ immich_url: null, immich_api_key: null, immich_allow_insecure_tls: 0 });
  });
});

describe('UserSynologyRepository', () => {
  it('SYNOREPO-001: getSynologyFields reads only the asked columns, and null for a missing user', async () => {
    const { user } = createUser(testDb);
    await updateRows(t, Users, { id: user.id }, {
      synology_url: 'https://nas:5001/photo', synology_username: 'syno-login', synology_password: 'enc-pw',
      synology_sid: 'sid-1', synology_did: 'did-1', synology_skip_ssl: 1,
    });
    expect(await synology.getSynologyFields(user.id, ['synology_url', 'synology_sid'])).toEqual({ synology_url: 'https://nas:5001/photo', synology_sid: 'sid-1' });
    expect(await synology.getSynologyFields(user.id, ['synology_username', 'synology_password', 'synology_did', 'synology_skip_ssl'])).toEqual({
      synology_username: 'syno-login', synology_password: 'enc-pw', synology_did: 'did-1', synology_skip_ssl: 1,
    });
    expect(await synology.getSynologyFields(999999, ['synology_url'])).toBeNull();
  });

  it('SYNOREPO-002: getSynologyUsername returns its column, and null for a missing user', async () => {
    const { user } = createUser(testDb);
    await updateRows(t, Users, { id: user.id }, { synology_username: 'syno-login' });
    expect(await synology.getSynologyUsername(user.id)).toBe('syno-login');
    expect(await synology.getSynologyUsername(999999)).toBeNull();
  });

  it('SYNOREPO-003: the session writes set and clear the sid and did', async () => {
    const { user } = createUser(testDb);
    const session = async () => {
      const row = await readUser(t, user.id);
      return { sid: row.synology_sid, did: row.synology_did };
    };
    await synology.setSynologySid(user.id, 'sid-2');
    await synology.setSynologyDid(user.id, 'did-2');
    expect(await session()).toEqual({ sid: 'sid-2', did: 'did-2' });
    await synology.clearSynologySID(user.id);
    expect(await session()).toEqual({ sid: null, did: 'did-2' });
    await synology.setSynologySid(user.id, 'sid-3');
    await synology.clearSynologySession(user.id);
    expect(await session()).toEqual({ sid: null, did: null });
  });

  it('SYNOREPO-004: setSynologySettings writes the four connection columns as handed in', async () => {
    const { user } = createUser(testDb);
    await synology.setSynologySettings(user.id, 'https://nas', 'me', 'enc', 1);
    const row = await readUser(t, user.id);
    expect([row.synology_url, row.synology_username, row.synology_password, row.synology_skip_ssl]).toEqual(['https://nas', 'me', 'enc', 1]);
  });
});

describe('UserAirtrailRepository', () => {
  const read = async (id: number) => {
    const row = await readUser(t, id);
    return {
      airtrail_url: row.airtrail_url, airtrail_api_key: row.airtrail_api_key,
      airtrail_allow_insecure_tls: row.airtrail_allow_insecure_tls, airtrail_write_enabled: row.airtrail_write_enabled,
    };
  };

  it('AIRTRAILREPO-001: getAirtrailConnRow and getAirtrailWriteEnabled read the connection, and null for a missing user', async () => {
    const { user } = createUser(testDb);
    await updateRows(t, Users, { id: user.id }, { airtrail_url: 'https://at', airtrail_api_key: 'enc', airtrail_allow_insecure_tls: 1, airtrail_write_enabled: 1 });
    expect(await airtrail.getAirtrailConnRow(user.id)).toEqual({ airtrail_url: 'https://at', airtrail_api_key: 'enc', airtrail_allow_insecure_tls: 1, airtrail_write_enabled: 1 });
    expect(await airtrail.getAirtrailConnRow(999999)).toBeNull();
    expect(await airtrail.getAirtrailWriteEnabled(user.id)).toBe(1);
    expect(await airtrail.getAirtrailWriteEnabled(999999)).toBeNull();
  });

  it('AIRTRAILREPO-002: the settings writes, with and without a new key, and the key scrub', async () => {
    const { user } = createUser(testDb);
    await airtrail.setAirtrailSettingsWithKey(user.id, 'https://at', 'enc-1', 0, 1);
    expect(await read(user.id)).toEqual({ airtrail_url: 'https://at', airtrail_api_key: 'enc-1', airtrail_allow_insecure_tls: 0, airtrail_write_enabled: 1 });
    await airtrail.setAirtrailSettings(user.id, 'https://at2', 1, 0);
    expect(await read(user.id)).toEqual({ airtrail_url: 'https://at2', airtrail_api_key: 'enc-1', airtrail_allow_insecure_tls: 1, airtrail_write_enabled: 0 });
    await airtrail.clearAirtrailApiKey(user.id);
    expect((await read(user.id)).airtrail_api_key).toBeNull();
  });
});
