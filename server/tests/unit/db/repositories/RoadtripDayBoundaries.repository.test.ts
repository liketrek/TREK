/**
 * `RoadtripDayBoundariesRepository` (Plan 3d Task 1). RB1 (`listForTrip`),
 * RB3 (`upsertBoundary`, `ON CONFLICT (trip_id, day_number) DO UPDATE SET
 * from_assignment_id = excluded.from_assignment_id, to_assignment_id =
 * excluded.to_assignment_id, fraction = excluded.fraction`), RB4
 * (`deleteForDay`) and RB7 (`moveDayNumber`).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import { createDay, createDayAssignment, createPlace, createTrip, createUser } from '../../../helpers/factories';
import { RoadtripDayBoundaries } from '../../../../src/db/entities/RoadtripDayBoundaries.entity';
import type { RoadtripDayBoundariesRepository } from '../../../../src/db/repositories/RoadtripDayBoundaries.repository';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: RoadtripDayBoundariesRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(RoadtripDayBoundaries);
});
beforeEach(() => { resetTestDb(testDb); t.clear(); });
afterAll(async () => { await t.close(); testDb.close(); });

function fixture() {
  const { user } = createUser(testDb);
  const trip = createTrip(testDb, user.id);
  const day = createDay(testDb, trip.id);
  const place = createPlace(testDb, trip.id);
  const from = createDayAssignment(testDb, day.id, place.id);
  const to = createDayAssignment(testDb, day.id, place.id);
  return { trip, day, from, to };
}

describe('RoadtripDayBoundariesRepository', () => {
  it('RB1REPO-001: listForTrip is empty for a trip with no boundaries', async () => {
    const { trip } = fixture();
    expect(await repo.listForTrip(trip.id)).toEqual([]);
  });

  it('UPSERTBOUNDARYREPO-001: upsertBoundary inserts a fresh (trip, day_number) row with every column', async () => {
    const { trip, from, to } = fixture();
    await repo.upsertBoundary(trip.id, { day_number: 1, from_assignment_id: from.id, to_assignment_id: to.id, fraction: 0.4 });
    expect(await repo.listForTrip(trip.id)).toEqual([{ day_number: 1, from_assignment_id: from.id, to_assignment_id: to.id, fraction: 0.4 }]);
  });

  it('UPSERTBOUNDARYREPO-002: re-upserting the SAME (trip, day_number) replaces in place — one row, never touching the key', async () => {
    const { trip, from, to } = fixture();
    await repo.upsertBoundary(trip.id, { day_number: 1, from_assignment_id: from.id, to_assignment_id: to.id, fraction: 0.4 });
    await repo.upsertBoundary(trip.id, { day_number: 1, from_assignment_id: to.id, to_assignment_id: null, fraction: 1 });

    const rows = await repo.listForTrip(trip.id);
    expect(rows).toEqual([{ day_number: 1, from_assignment_id: to.id, to_assignment_id: null, fraction: 1 }]);
  });

  it('RB1REPO-002: listForTrip orders by day_number ascending', async () => {
    const { trip, from, to } = fixture();
    await repo.upsertBoundary(trip.id, { day_number: 3, from_assignment_id: from.id, to_assignment_id: to.id, fraction: 0.5 });
    await repo.upsertBoundary(trip.id, { day_number: 1, from_assignment_id: from.id, to_assignment_id: to.id, fraction: 0.5 });
    await repo.upsertBoundary(trip.id, { day_number: 2, from_assignment_id: from.id, to_assignment_id: to.id, fraction: 0.5 });

    expect((await repo.listForTrip(trip.id)).map((b) => b.day_number)).toEqual([1, 2, 3]);
  });

  it('RB4REPO-001: deleteForDay removes only the named day_number, silent on a miss', async () => {
    const { trip, from, to } = fixture();
    await repo.upsertBoundary(trip.id, { day_number: 1, from_assignment_id: from.id, to_assignment_id: to.id, fraction: 0.4 });
    await repo.upsertBoundary(trip.id, { day_number: 2, from_assignment_id: from.id, to_assignment_id: to.id, fraction: 0.4 });

    await expect(repo.deleteForDay(trip.id, 99)).resolves.toBeUndefined();
    expect(await repo.listForTrip(trip.id)).toHaveLength(2);

    await repo.deleteForDay(trip.id, 1);
    expect((await repo.listForTrip(trip.id)).map((b) => b.day_number)).toEqual([2]);
  });

  it('RB7REPO-001: moveDayNumber rewrites only the named day_number of the named trip, silent on a miss', async () => {
    const { trip, from, to } = fixture();
    const { trip: other, from: otherFrom, to: otherTo } = fixture();
    await repo.upsertBoundary(trip.id, { day_number: 1, from_assignment_id: from.id, to_assignment_id: to.id, fraction: 0.4 });
    await repo.upsertBoundary(trip.id, { day_number: 3, from_assignment_id: from.id, to_assignment_id: to.id, fraction: 0.6 });
    await repo.upsertBoundary(other.id, { day_number: 3, from_assignment_id: otherFrom.id, to_assignment_id: otherTo.id, fraction: 0.9 });

    await expect(repo.moveDayNumber(trip.id, 99, 100)).resolves.toBeUndefined();
    await repo.moveDayNumber(trip.id, 3, 2);

    expect(await repo.listForTrip(trip.id)).toEqual([
      { day_number: 1, from_assignment_id: from.id, to_assignment_id: to.id, fraction: 0.4 },
      { day_number: 2, from_assignment_id: from.id, to_assignment_id: to.id, fraction: 0.6 },
    ]);
    expect((await repo.listForTrip(other.id)).map((b) => b.day_number)).toEqual([3]);
  });

  it('boundaries of one trip are never boundaries of another', async () => {
    const { trip: tripA, from: fromA, to: toA } = fixture();
    const { trip: tripB, from: fromB, to: toB } = fixture();
    await repo.upsertBoundary(tripA.id, { day_number: 1, from_assignment_id: fromA.id, to_assignment_id: toA.id, fraction: 0.4 });
    await repo.upsertBoundary(tripB.id, { day_number: 1, from_assignment_id: fromB.id, to_assignment_id: toB.id, fraction: 0.9 });

    expect(await repo.listForTrip(tripA.id)).toEqual([{ day_number: 1, from_assignment_id: fromA.id, to_assignment_id: toA.id, fraction: 0.4 }]);
    expect(await repo.listForTrip(tripB.id)).toEqual([{ day_number: 1, from_assignment_id: fromB.id, to_assignment_id: toB.id, fraction: 0.9 }]);
  });
});
