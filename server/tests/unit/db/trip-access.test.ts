/**
 * `TripsRepository.findAccessible` (formerly the free-function `canAccessTrip`
 * in `db/database.ts`, retired onto the repository in Plan 3c Task 0b) is the
 * shared trip-access check every domain reads its trip row from. It must
 * return the trip's `currency`: the budget settlement takes its base currency
 * straight off this row, and when the column was missing from the SELECT it
 * silently fell back to 'EUR', inflating balances on every non-EUR trip that
 * had a foreign-currency expense (#1543).
 */
import { Trips } from '../../../src/db/entities/Trips.entity';
import type { TripsRepository } from '../../../src/db/repositories/Trips.repository';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { addTripMember, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { CAN_ACCESS_TRIP_SQL, buildDbMock, resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let trips: TripsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  trips = t.repo(Trips);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

async function seedUser(username: string): Promise<number> {
  return (await makeUser(t, { username, email: `${username}@example.test` })).user.id;
}

describe('TripsRepository.findAccessible (formerly canAccessTrip)', () => {
  it('returns the trip currency for the owner (#1543)', async () => {
    const owner = await seedUser('owner');
    const tripId = (await makeTrip(t, owner, { title: 'Trip', currency: 'RUB' })).id;

    expect(await trips.findAccessible(tripId, owner)).toMatchObject({ id: tripId, user_id: owner, currency: 'RUB' });
  });

  it('returns the trip currency for a member too', async () => {
    const owner = await seedUser('owner2');
    const member = await seedUser('member2');
    const tripId = (await makeTrip(t, owner, { title: 'Trip', currency: 'JPY' })).id;
    await addTripMember(t, tripId, member);

    expect(await trips.findAccessible(tripId, member)).toMatchObject({ currency: 'JPY' });
  });

  it('returns undefined for a user with no access', async () => {
    const owner = await seedUser('owner3');
    const stranger = await seedUser('stranger3');
    const tripId = (await makeTrip(t, owner, { title: 'Trip' })).id;

    expect(await trips.findAccessible(tripId, stranger)).toBeUndefined();
  });

  // Plan 3c Task 0b: the raw-bind id seam (no `Number()`/`toRowId` conversion
  // before the value reaches the statement) survives the repository move —
  // pinned directly here rather than only inferred from the boot matrix.
  it('a non-numeric-looking id finds nothing, the same as the legacy raw-bind statement', async () => {
    const owner = await seedUser('owner4');
    await makeTrip(t, owner, { title: 'Trip' });
    expect(await trips.findAccessible('not-a-number', owner)).toBeUndefined();
  });
});

/**
 * The mock every domain test runs against had the pre-#1543 SELECT, so the very
 * regression the block above pins was invisible to the suites that mock the db.
 */
describe('the buildDbMock stand-in for canAccessTrip', () => {
  it('hands back the trip currency, like the real one', async () => {
    const dbmockDb = createSnapshotTestDb();
    const seeder = await createTestOrm(dbmockDb);
    try {
      const owner = (await makeUser(seeder, { username: 'm', email: 'm@example.test' })).user.id;
      const tripId = (await makeTrip(seeder, owner, { title: 'Trip', currency: 'ISK' })).id;

      expect(await buildDbMock(dbmockDb).canAccessTrip(tripId, owner)).toMatchObject({ id: tripId, currency: 'ISK' });
    } finally {
      await seeder.close();
      dbmockDb.close();
    }
  });

  it('selects the same columns the production statement does', () => {
    const columns = (sql: string) => sql.replace(/\s+/g, ' ').trim();
    expect(columns(CAN_ACCESS_TRIP_SQL)).toBe(
      'SELECT t.id, t.user_id, t.currency FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)',
    );
  });
});
