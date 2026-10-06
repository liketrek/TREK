/**
 * ReservationDayPositionsRepository — parity test (Plan 3d Task 7 whole-plan
 * review, item 9/"missing parity tests": this repository had no standalone
 * test file). ONE seeded world, one `toEqual(<legacy raw>)` test for the
 * read method (RS19); RS31 (`upsertScoped`, a write) already has coverage
 * through `reservations.service.test.ts`'s `updatePositions` cases.
 */
import { ReservationDayPositions } from '../../../../src/db/entities/ReservationDayPositions.entity';
import type { ReservationDayPositionsRepository } from '../../../../src/db/repositories/ReservationDayPositions.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createDay, createReservation, createTrip, createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: ReservationDayPositionsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(ReservationDayPositions);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('ReservationDayPositionsRepository — fully seeded world', () => {
  const seed = () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day1 = createDay(testDb, trip.id);
    const day2 = createDay(testDb, trip.id);
    const multiDay = createReservation(testDb, trip.id, { title: 'Rental car', type: 'car' });
    testDb
      .prepare('INSERT INTO reservation_day_positions (reservation_id, day_id, position) VALUES (?, ?, ?)')
      .run(multiDay.id, day1.id, 0);
    testDb
      .prepare('INSERT INTO reservation_day_positions (reservation_id, day_id, position) VALUES (?, ?, ?)')
      .run(multiDay.id, day2.id, 1);

    const otherTrip = createTrip(testDb, user.id);
    const otherDay = createDay(testDb, otherTrip.id);
    const foreignRes = createReservation(testDb, otherTrip.id, { title: 'Foreign rental', type: 'car' });
    testDb
      .prepare('INSERT INTO reservation_day_positions (reservation_id, day_id, position) VALUES (?, ?, ?)')
      .run(foreignRes.id, otherDay.id, 0);

    return { trip, otherTrip, multiDay, day1, day2 };
  };

  it('RS19 listForTrip — matches the legacy JOIN statement, scoped by trip, both persist(false) mirror columns present', async () => {
    const { trip, multiDay, day1, day2 } = seed();
    const legacy = testDb
      .prepare(
        `
      SELECT rdp.reservation_id, rdp.day_id, rdp.position FROM reservation_day_positions rdp
      JOIN reservations r ON rdp.reservation_id = r.id WHERE r.trip_id = ?`,
      )
      .all(trip.id);
    const typed = await repo.listForTrip(trip.id);
    expect(typed).toEqual(legacy);
    expect(typed.map((r) => [r.reservation_id, r.day_id, r.position]).sort()).toEqual(
      [
        [multiDay.id, day1.id, 0],
        [multiDay.id, day2.id, 1],
      ].sort(),
    );
  });

  it('RS19 listForTrip — an empty trip returns an empty array, not a throw', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await repo.listForTrip(trip.id)).toEqual([]);
  });
});
