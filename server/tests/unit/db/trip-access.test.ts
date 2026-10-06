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

function seedUser(username: string): number {
  return Number(
    testDb
      .prepare("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, 'x', 'user')")
      .run(username, `${username}@example.test`).lastInsertRowid,
  );
}

describe('TripsRepository.findAccessible (formerly canAccessTrip)', () => {
  it('returns the trip currency for the owner (#1543)', async () => {
    const owner = seedUser('owner');
    const tripId = Number(
      testDb.prepare("INSERT INTO trips (user_id, title, currency) VALUES (?, 'Trip', 'RUB')").run(owner)
        .lastInsertRowid,
    );

    expect(await trips.findAccessible(tripId, owner)).toMatchObject({ id: tripId, user_id: owner, currency: 'RUB' });
  });

  it('returns the trip currency for a member too', async () => {
    const owner = seedUser('owner2');
    const member = seedUser('member2');
    const tripId = Number(
      testDb.prepare("INSERT INTO trips (user_id, title, currency) VALUES (?, 'Trip', 'JPY')").run(owner)
        .lastInsertRowid,
    );
    testDb.prepare('INSERT INTO trip_members (trip_id, user_id) VALUES (?, ?)').run(tripId, member);

    expect(await trips.findAccessible(tripId, member)).toMatchObject({ currency: 'JPY' });
  });

  it('returns undefined for a user with no access', async () => {
    const owner = seedUser('owner3');
    const stranger = seedUser('stranger3');
    const tripId = Number(
      testDb.prepare("INSERT INTO trips (user_id, title) VALUES (?, 'Trip')").run(owner).lastInsertRowid,
    );

    expect(await trips.findAccessible(tripId, stranger)).toBeUndefined();
  });

  // Plan 3c Task 0b: the raw-bind id seam (no `Number()`/`toRowId` conversion
  // before the value reaches the statement) survives the repository move —
  // pinned directly here rather than only inferred from the boot matrix.
  it('a non-numeric-looking id finds nothing, the same as the legacy raw-bind statement', async () => {
    const owner = seedUser('owner4');
    testDb.prepare("INSERT INTO trips (user_id, title) VALUES (?, 'Trip')").run(owner);
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
    try {
      const owner = Number(
        dbmockDb
          .prepare(
            "INSERT INTO users (username, email, password_hash, role) VALUES ('m', 'm@example.test', 'x', 'user')",
          )
          .run().lastInsertRowid,
      );
      const tripId = Number(
        dbmockDb.prepare("INSERT INTO trips (user_id, title, currency) VALUES (?, 'Trip', 'ISK')").run(owner)
          .lastInsertRowid,
      );

      expect(await buildDbMock(dbmockDb).canAccessTrip(tripId, owner)).toMatchObject({ id: tripId, currency: 'ISK' });
    } finally {
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
