import { Reservations } from '../../../../../src/db/entities/Reservations.entity';
import {
  travelerOwnsCondition,
  travelerOwnsExpr,
  type ReservationTravelersOwnsKyselyDB,
} from '../../../../../src/db/repositories/_shared/reservation-travelers-owns';
import { createSnapshotTestDb } from '../../../../helpers/db-mock';
import { createReservation, createTrip, createUser } from '../../../../helpers/factories';
import { resetTestDb } from '../../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * The legacy fragment this harness proves parity against
 * (`AtlasService`'s `TRAVELER_OWNS`, `atlas.service.ts:1173-1175`), kept
 * here byte-identical to the source text as this test's own oracle — the
 * same "hold the STRING side fixed and independent of the production code
 * it is proving" reasoning `reservation-visibility.test.ts`/
 * `packing-visibility.parity.test.ts` document. Binds the caller's user id
 * once. Expects the reservation aliased `r`, matching every one of
 * AT6/AT45/AT46's own alias.
 */
const TRAVELER_OWNS = `(
    NOT EXISTS (SELECT 1 FROM reservation_travelers rt WHERE rt.reservation_id = r.id)
    OR EXISTS (SELECT 1 FROM reservation_travelers rt WHERE rt.reservation_id = r.id AND rt.user_id = ?)
  )`;

const testDb = createSnapshotTestDb();
let t: TestOrm;

beforeAll(async () => {
  t = await createTestOrm(testDb);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function addTraveler(reservationId: number, userId: number): void {
  testDb
    .prepare('INSERT INTO reservation_travelers (reservation_id, user_id) VALUES (?, ?)')
    .run(reservationId, userId);
}

async function legacyOwnedIds(tripId: number, userId: number): Promise<number[]> {
  const rows = testDb
    .prepare(`SELECT id FROM reservations r WHERE r.trip_id = ? AND ${TRAVELER_OWNS} ORDER BY id ASC`)
    .all(tripId, userId) as { id: number }[];
  return rows.map((row) => row.id);
}

async function typedQbOwnedIds(tripId: number, userId: number): Promise<number[]> {
  const rows = await t.em
    .createQueryBuilder(Reservations, 'r')
    .select(['r.id'])
    .where({ 'r.trip_id': tripId, ...travelerOwnsCondition(userId) })
    .orderBy({ id: 'asc' })
    .execute<{ id: number }[]>('all', false);
  return rows.map((row) => row.id);
}

interface TestDB extends ReservationTravelersOwnsKyselyDB {
  reservations: { id: number; trip_id: number };
}

async function typedKyselyOwnedIds(tripId: number, userId: number): Promise<number[]> {
  const rows = await t.em
    .getKysely<TestDB>()
    .selectFrom('reservations as r')
    .select('r.id')
    .where('r.trip_id', '=', tripId)
    .where((eb) => travelerOwnsExpr(eb, userId))
    .orderBy('r.id', 'asc')
    .execute();
  return rows.map((row) => row.id);
}

describe('reservation-travelers-owns parity (TRAVELER_OWNS: the two cases that matter, #1966)', () => {
  it('TRAVOWNS-001: a reservation with ZERO reservation_travelers rows counts for the WHOLE trip (pre-4.0 backward-compat) — every user sees it', async () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const unassigned = createReservation(testDb, trip.id, { title: 'Pre-4.0 booking, no travelers' });

    for (const userId of [owner.id, other.id]) {
      const legacy = await legacyOwnedIds(trip.id, userId);
      const typedQb = await typedQbOwnedIds(trip.id, userId);
      const typedKysely = await typedKyselyOwnedIds(trip.id, userId);

      expect(legacy).toEqual([unassigned.id]);
      expect(typedQb).toEqual(legacy);
      expect(typedKysely).toEqual(legacy);
    }
  });

  it("TRAVOWNS-002: a reservation WITH assignments narrows to the caller's own — an assigned traveler sees it, a non-traveler does not", async () => {
    const { user: traveler } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, traveler.id);
    const assigned = createReservation(testDb, trip.id, { title: 'Flight with named travelers' });
    addTraveler(assigned.id, traveler.id);

    const legacyForTraveler = await legacyOwnedIds(trip.id, traveler.id);
    const typedQbForTraveler = await typedQbOwnedIds(trip.id, traveler.id);
    const typedKyselyForTraveler = await typedKyselyOwnedIds(trip.id, traveler.id);
    expect(legacyForTraveler).toEqual([assigned.id]);
    expect(typedQbForTraveler).toEqual(legacyForTraveler);
    expect(typedKyselyForTraveler).toEqual(legacyForTraveler);

    const legacyForStranger = await legacyOwnedIds(trip.id, stranger.id);
    const typedQbForStranger = await typedQbOwnedIds(trip.id, stranger.id);
    const typedKyselyForStranger = await typedKyselyOwnedIds(trip.id, stranger.id);
    expect(legacyForStranger).toEqual([]);
    expect(typedQbForStranger).toEqual(legacyForStranger);
    expect(typedKyselyForStranger).toEqual(legacyForStranger);
  });

  it('TRAVOWNS-003: a reservation with MULTIPLE travelers — each assigned traveler sees it, exactly once, a non-traveler does not', async () => {
    const { user: travelerA } = createUser(testDb);
    const { user: travelerB } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, travelerA.id);
    const shared = createReservation(testDb, trip.id, { title: 'Family flight' });
    addTraveler(shared.id, travelerA.id);
    addTraveler(shared.id, travelerB.id);

    for (const userId of [travelerA.id, travelerB.id]) {
      const legacy = await legacyOwnedIds(trip.id, userId);
      const typedQb = await typedQbOwnedIds(trip.id, userId);
      const typedKysely = await typedKyselyOwnedIds(trip.id, userId);
      expect(legacy).toEqual([shared.id]);
      expect(typedQb).toEqual(legacy);
      expect(typedKysely).toEqual(legacy);
    }

    const legacyStranger = await legacyOwnedIds(trip.id, stranger.id);
    const typedQbStranger = await typedQbOwnedIds(trip.id, stranger.id);
    const typedKyselyStranger = await typedKyselyOwnedIds(trip.id, stranger.id);
    expect(legacyStranger).toEqual([]);
    expect(typedQbStranger).toEqual(legacyStranger);
    expect(typedKyselyStranger).toEqual(legacyStranger);
  });

  it('TRAVOWNS-004: a mixed trip — one unassigned booking, one assigned-to-someone-else booking — resolves identically between all three forms', async () => {
    const { user: owner } = createUser(testDb);
    const { user: travelerB } = createUser(testDb);
    const { user: viewer } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const unassigned = createReservation(testDb, trip.id, { title: 'Unassigned' });
    const assignedToOther = createReservation(testDb, trip.id, { title: 'Assigned to someone else' });
    addTraveler(assignedToOther.id, travelerB.id);

    const legacy = await legacyOwnedIds(trip.id, viewer.id);
    const typedQb = await typedQbOwnedIds(trip.id, viewer.id);
    const typedKysely = await typedKyselyOwnedIds(trip.id, viewer.id);

    // `viewer` is nobody's traveler: the unassigned booking still counts
    // (the NOT EXISTS arm), the booking assigned to travelerB does not.
    expect(legacy).toEqual([unassigned.id]);
    expect(typedQb).toEqual(legacy);
    expect(typedKysely).toEqual(legacy);
  });

  // Mutation-sensitive (R7/the plan's own risk list: "getting this wrong
  // either double-counts a shared trip's flights per member or zeroes every
  // pre-4.0 install's flown distance overnight" — a dedicated matrix before
  // any consumer converts). Manually replacing `travelerOwnsCondition`'s
  // `$or` with JUST the `$some` arm (dropping the `$none`/NOT-EXISTS
  // fallback) and re-running this suite: TRAVOWNS-001 goes red (the
  // pre-4.0, zero-traveler `unassigned` booking disappears for every user,
  // including its own owner) while TRAVOWNS-002/003 stay green — proving
  // this case is not redundant with the rest of the matrix and that the
  // `$none` arm is genuinely load-bearing. Restored immediately after
  // observing the failure; the predicate module itself is unchanged in this
  // commit.
  it('TRAVOWNS-005 (mutation-sensitive): dropping the zero-traveler fallback would hide a pre-4.0 booking from its own owner', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const unassigned = createReservation(testDb, trip.id, { title: 'Pre-4.0 booking' });

    const legacy = await legacyOwnedIds(trip.id, owner.id);
    const typedQb = await typedQbOwnedIds(trip.id, owner.id);
    const typedKysely = await typedKyselyOwnedIds(trip.id, owner.id);

    expect(legacy).toEqual([unassigned.id]);
    expect(typedQb).toEqual(legacy);
    expect(typedKysely).toEqual(legacy);
  });
});
