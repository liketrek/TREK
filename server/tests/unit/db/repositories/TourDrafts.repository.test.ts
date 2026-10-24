/**
 * `TourDraftsRepository`: the Tours planner's unsaved draft, one per user and
 * trip. Seeded through the ORM factories over the migrated snapshot schema.
 */
import { TourDrafts } from '../../../../src/db/entities/TourDrafts.entity';
import { Trips } from '../../../../src/db/entities/Trips.entity';
import type { TourDraftsRepository } from '../../../../src/db/repositories/TourDrafts.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { countRows, deleteRows, updateRows } from '../../../helpers/factories/rows';
import { makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: TourDraftsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(TourDrafts);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

/** Two users and two trips of the first one. */
async function fixture() {
  const { user } = await makeUser(t);
  const { user: other } = await makeUser(t);
  const trip = await makeTrip(t, user.id);
  const second = await makeTrip(t, user.id);
  return { user, other, trip, second };
}

describe('TourDraftsRepository', () => {
  it('TDRAFTREPO-001: findFor answers nothing before a draft is kept, then the kept draft with its time', async () => {
    const { user, trip } = await fixture();
    expect(await repo.findFor(trip.id, user.id)).toBeUndefined();

    const kept = await repo.put(trip.id, user.id, '{"version":11,"name":"Ridge"}');
    expect(kept).toEqual({ payload: '{"version":11,"name":"Ridge"}', updated_at: expect.any(String) });
    expect(await repo.findFor(trip.id, user.id)).toEqual(kept);
  });

  it('TDRAFTREPO-002: put replaces the draft of the same user and trip, with a fresh time, and keeps one row', async () => {
    const { user, trip } = await fixture();
    await repo.put(trip.id, user.id, '{"name":"First"}');
    await updateRows(t, TourDrafts, { trip: trip.id }, { updated_at: '2020-01-01 00:00:00' });

    const replaced = await repo.put(trip.id, user.id, '{"name":"Second"}');
    expect(replaced.payload).toBe('{"name":"Second"}');
    expect(replaced.updated_at).not.toBe('2020-01-01 00:00:00');
    expect(await countRows(t, TourDrafts)).toBe(1);
    expect(await repo.findFor(trip.id, user.id)).toEqual(replaced);
  });

  it('TDRAFTREPO-003: a draft belongs to one user in one trip; nobody else reads or replaces it', async () => {
    const { user, other, trip, second } = await fixture();
    await repo.put(trip.id, user.id, '{"name":"Mine"}');
    await repo.put(trip.id, other.id, '{"name":"Theirs"}');
    await repo.put(second.id, user.id, '{"name":"Other trip"}');

    expect((await repo.findFor(trip.id, user.id))?.payload).toBe('{"name":"Mine"}');
    expect((await repo.findFor(trip.id, other.id))?.payload).toBe('{"name":"Theirs"}');
    expect((await repo.findFor(second.id, user.id))?.payload).toBe('{"name":"Other trip"}');
    expect(await repo.findFor(second.id, other.id)).toBeUndefined();
    expect(await countRows(t, TourDrafts)).toBe(3);
  });

  it('TDRAFTREPO-004: remove forgets only that draft and says whether there was one', async () => {
    const { user, other, trip } = await fixture();
    await repo.put(trip.id, user.id, '{"name":"Mine"}');
    await repo.put(trip.id, other.id, '{"name":"Theirs"}');

    expect(await repo.remove(trip.id, user.id)).toBe(true);
    expect(await repo.remove(trip.id, user.id)).toBe(false);
    expect(await repo.findFor(trip.id, user.id)).toBeUndefined();
    expect((await repo.findFor(trip.id, other.id))?.payload).toBe('{"name":"Theirs"}');
  });

  it('TDRAFTREPO-005: deleting the trip takes its drafts with it', async () => {
    const { user, trip, second } = await fixture();
    await repo.put(trip.id, user.id, '{"name":"Gone"}');
    await repo.put(second.id, user.id, '{"name":"Stays"}');

    await deleteRows(t, Trips, { id: trip.id });
    expect(await repo.findFor(trip.id, user.id)).toBeUndefined();
    expect((await repo.findFor(second.id, user.id))?.payload).toBe('{"name":"Stays"}');
    expect(await countRows(t, TourDrafts)).toBe(1);
  });
});
