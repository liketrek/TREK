/**
 * ReservationTravelersRepository — parity tests (Plan 3d Task 7 whole-plan
 * review, item 9/"missing parity tests": this repository had no standalone
 * test file). ONE seeded world, one `toEqual(<legacy raw>)` test per read
 * method.
 */
import { ReservationTravelers } from '../../../../src/db/entities/ReservationTravelers.entity';
import { Users } from '../../../../src/db/entities/Users.entity';
import type { ReservationTravelersRepository } from '../../../../src/db/repositories/ReservationTravelers.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createReservation, createTrip, createUser } from '../../../helpers/factories';
import { addReservationTraveler } from '../../../helpers/factories/reservations';
import { updateRows } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: ReservationTravelersRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(ReservationTravelers);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

// test-sql-allow: the legacy statement is the parity oracle the repository is compared against.
const legacyListForTrip = (trip_id: number) =>
  testDb
    .prepare(
      `
  SELECT rt.reservation_id, rt.user_id, COALESCE(u.display_name, u.username) AS username, u.avatar, u.is_guest
  FROM reservation_travelers rt JOIN reservations r ON rt.reservation_id = r.id JOIN users u ON rt.user_id = u.id
  WHERE r.trip_id = ? ORDER BY rt.reservation_id`,
    )
    .all(trip_id);

// test-sql-allow: the legacy statement is the parity oracle the repository is compared against.
const legacyListForReservation = (reservation_id: number) =>
  testDb
    .prepare(
      `
  SELECT rt.user_id, COALESCE(u.display_name, u.username) AS username, u.avatar, u.is_guest
  FROM reservation_travelers rt JOIN users u ON rt.user_id = u.id WHERE rt.reservation_id = ?`,
    )
    .all(reservation_id);

describe('ReservationTravelersRepository — fully seeded world', () => {
  const seed = async () => {
    const { user: owner } = createUser(testDb);
    const { user: named } = createUser(testDb);
    await updateRows(t, Users, { id: named.id }, { display_name: 'Named Traveler' });
    const { user: guest } = createUser(testDb);
    await updateRows(t, Users, { id: guest.id }, { is_guest: 1 });
    const trip = createTrip(testDb, owner.id);
    const flight = createReservation(testDb, trip.id, { title: 'Flight', type: 'flight' });
    const hotel = createReservation(testDb, trip.id, { title: 'Hotel', type: 'hotel' });
    await addReservationTraveler(t, flight.id, owner.id);
    await addReservationTraveler(t, flight.id, named.id);
    await addReservationTraveler(t, hotel.id, guest.id);
    return { owner, named, guest, trip, flight, hotel };
  };

  it('RS6 listForTrip — matches the legacy JOIN statement, COALESCE(display_name, username), ordered by reservation', async () => {
    const { trip, flight, hotel } = await seed();
    const legacy = legacyListForTrip(trip.id);
    const typed = await repo.listForTrip(trip.id);
    expect(typed).toEqual(legacy);
    expect(typed.map((r) => r.reservation_id)).toEqual([flight.id, flight.id, hotel.id]);
    expect(typed.find((r) => r.username === 'Named Traveler')).toBeDefined();
    expect(typed.find((r) => r.is_guest === 1)).toBeDefined();
  });

  it('RR3 listForReservation — matches the legacy statement (no ORDER BY, no reservation_id column)', async () => {
    const { flight, owner, named } = await seed();
    const legacy = legacyListForReservation(flight.id);
    const typed = await repo.listForReservation(flight.id);
    expect(typed).toEqual(legacy);
    expect(typed.map((r) => r.user_id).sort((a, b) => a - b)).toEqual([owner.id, named.id].sort((a, b) => a - b));
    expect((typed[0] as Record<string, unknown>).reservation_id).toBeUndefined();
  });
});
