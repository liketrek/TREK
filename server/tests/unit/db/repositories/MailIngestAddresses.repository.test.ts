/**
 * The forwarding addresses through their repository: a person's own address
 * and a trip's are told apart, renewing revokes instead of deleting so the old
 * token is still recognised, a mail notes the address it came in on, and the
 * people who hold a live address are named for the pause notice.
 */
import { MailIngestAddresses } from '../../../../src/db/entities/MailIngestAddresses.entity';
import type { MailIngestAddressesRepository } from '../../../../src/db/repositories/MailIngestAddresses.repository';
import { dbNow } from '../../../../src/db/types';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let addresses: MailIngestAddressesRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  addresses = t.repo(MailIngestAddresses);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

const AT = dbNow(new Date('2026-11-01T10:00:00Z'));
const LATER = dbNow(new Date('2026-11-02T10:00:00Z'));

describe('MailIngestAddressesRepository', () => {
  it('keeps a person’s own address apart from a trip’s', async () => {
    const { user } = await makeUser(t);
    const trip = await makeTrip(t, user.id);
    const own = await addresses.insertAddress({
      userId: user.id,
      tripId: null,
      tokenHash: 'h-own',
      tokenEnc: 'e-own',
      createdAt: AT,
    });
    const forTrip = await addresses.insertAddress({
      userId: user.id,
      tripId: trip.id,
      tokenHash: 'h-trip',
      tokenEnc: 'e-trip',
      createdAt: AT,
    });

    expect((await addresses.findLive(user.id, null))?.id).toBe(own);
    expect((await addresses.findLive(user.id, trip.id))?.id).toBe(forTrip);
    expect(await addresses.findById(forTrip)).toMatchObject({ trip_id: trip.id, token_enc: 'e-trip' });
    expect(await addresses.findById(forTrip + 100)).toBeNull();
  });

  it('revokes the live address of one scope only, and still finds a revoked token', async () => {
    const { user } = await makeUser(t);
    const trip = await makeTrip(t, user.id);
    const own = await addresses.insertAddress({
      userId: user.id,
      tripId: null,
      tokenHash: 'a',
      tokenEnc: 'x',
      createdAt: AT,
    });
    await addresses.insertAddress({ userId: user.id, tripId: trip.id, tokenHash: 'b', tokenEnc: 'y', createdAt: AT });

    expect(await addresses.revokeLive(user.id, null, LATER)).toBe(1);
    expect(await addresses.findLive(user.id, null)).toBeNull();
    expect(await addresses.findLive(user.id, trip.id)).not.toBeNull();
    expect(await addresses.findByTokenHash('a')).toMatchObject({ id: own, revoked_at: LATER });
    expect(await addresses.findByTokenHash('none')).toBeNull();

    expect(await addresses.revokeLive(user.id, trip.id, LATER)).toBe(1);
    expect(await addresses.findLive(user.id, trip.id)).toBeNull();
  });

  it('notes when a mail came in', async () => {
    const { user } = await makeUser(t);
    const id = await addresses.insertAddress({
      userId: user.id,
      tripId: null,
      tokenHash: 'c',
      tokenEnc: 'z',
      createdAt: AT,
    });
    await addresses.touchUsed(id, LATER);
    expect((await addresses.findById(id))?.last_used_at).toBe(LATER);
  });

  it('names each person who holds an address that is not revoked, once', async () => {
    const { user: mia } = await makeUser(t);
    const { user: noah } = await makeUser(t);
    const trip = await makeTrip(t, mia.id);
    await addresses.insertAddress({ userId: mia.id, tripId: null, tokenHash: 'm1', tokenEnc: 'e', createdAt: AT });
    await addresses.insertAddress({ userId: mia.id, tripId: trip.id, tokenHash: 'm2', tokenEnc: 'e', createdAt: AT });
    await addresses.insertAddress({ userId: noah.id, tripId: null, tokenHash: 'n1', tokenEnc: 'e', createdAt: AT });
    expect(await addresses.listHolders()).toEqual([mia.id, noah.id].sort((a, b) => a - b));

    await addresses.revokeLive(noah.id, null, LATER);
    expect(await addresses.listHolders()).toEqual([mia.id]);
  });
});
