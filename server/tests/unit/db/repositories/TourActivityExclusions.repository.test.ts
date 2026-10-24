/**
 * `TourActivityExclusionsRepository` (STA-02): the tours a user left out of
 * their own activity sums. Personal throughout: one user's rows never reach
 * another's reads or writes. Seeded through the ORM factories over the
 * migrated snapshot schema.
 */
import { Places } from '../../../../src/db/entities/Places.entity';
import { TourActivityExclusions } from '../../../../src/db/entities/TourActivityExclusions.entity';
import { Users } from '../../../../src/db/entities/Users.entity';
import type { TourActivityExclusionsRepository } from '../../../../src/db/repositories/TourActivityExclusions.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makePlace } from '../../../helpers/factories/places';
import { countRows, deleteRows, findRow } from '../../../helpers/factories/rows';
import { makeTour } from '../../../helpers/factories/tours';
import { makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: TourActivityExclusionsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(TourActivityExclusions);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

/** Two users, one trip with two tours. */
async function fixture() {
  const { user } = await makeUser(t);
  const { user: friend } = await makeUser(t);
  const trip = await makeTrip(t, user.id);
  const ridge = await makePlace(t, trip.id, { name: 'Ridge' });
  await makeTour(t, ridge.id);
  const lake = await makePlace(t, trip.id, { name: 'Lake' });
  await makeTour(t, lake.id, { tourTypeRef: 'kayak' });
  return { user, friend, ridge, lake };
}

describe('TourActivityExclusionsRepository', () => {
  it('STA2-REPO-001: exclude writes one row per user and tour, a second call changes nothing', async () => {
    const { user, ridge, lake } = await fixture();
    await repo.exclude(user.id, lake.id);
    await repo.exclude(user.id, ridge.id);
    await repo.exclude(user.id, ridge.id);
    expect(await repo.listPlaceIds(user.id)).toEqual([ridge.id, lake.id].sort((a, b) => a - b));
    expect(await countRows(t, TourActivityExclusions, { user: user.id })).toBe(2);
    expect((await findRow(t, TourActivityExclusions, { user: user.id, place: ridge.id }))?.excluded_at).toMatch(
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
    );
  });

  it('STA2-REPO-002: one user leaving a tour out leaves it in for everybody else', async () => {
    const { user, friend, ridge } = await fixture();
    await repo.exclude(user.id, ridge.id);
    expect(await repo.listPlaceIds(friend.id)).toEqual([]);
    await repo.include(friend.id, ridge.id);
    expect(await repo.listPlaceIds(user.id)).toEqual([ridge.id]);
  });

  it('STA2-REPO-003: include counts the tour again, and is a no-op for a tour never left out', async () => {
    const { user, ridge, lake } = await fixture();
    await repo.exclude(user.id, ridge.id);
    await repo.include(user.id, lake.id);
    await repo.include(user.id, ridge.id);
    expect(await repo.listPlaceIds(user.id)).toEqual([]);
  });

  it('STA2-REPO-004: deleting the tour or the user takes the row along', async () => {
    const { user, friend, ridge, lake } = await fixture();
    await repo.exclude(user.id, ridge.id);
    await repo.exclude(friend.id, lake.id);
    await deleteRows(t, Places, { id: ridge.id });
    expect(await repo.listPlaceIds(user.id)).toEqual([]);
    await deleteRows(t, Users, { id: friend.id });
    expect(await countRows(t, TourActivityExclusions, {})).toBe(0);
  });
});
