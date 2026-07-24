/**
 * Unit tests for reservation traveler assignment — RES-TRAV-001..005.
 * The #1517 backend: assign trip members / named guests to a booking, with a
 * cross-trip guard so a stale client can't leak a user from another trip.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  return { testDb: db, dbMock: { db } };
});
vi.mock('../../../src/db/database', () => dbMock);

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, createReservation, addTripMember } from '../../helpers/factories';
import { setReservationTravelers, loadTravelers, listReservations } from '../../../src/services/reservationService';

beforeAll(() => { createTables(testDb); runMigrations(testDb); });
beforeEach(() => resetTestDb(testDb));
afterAll(() => testDb.close());

/** Create a named guest user (no credentials) and add it to the trip. */
function addGuest(tripId: number, displayName: string) {
  const { user } = createUser(testDb);
  testDb.prepare('UPDATE users SET is_guest = 1, display_name = ? WHERE id = ?').run(displayName, user.id);
  addTripMember(testDb, tripId, user.id);
  return user;
}

describe('setReservationTravelers / loadTravelers (#1517)', () => {
  it('RES-TRAV-001: assigns trip members and returns them via loadTravelers', () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    const res = createReservation(testDb, trip.id);

    setReservationTravelers(res.id, trip.id, [member.id]);

    const travelers = loadTravelers(res.id);
    expect(travelers).toHaveLength(1);
    expect(travelers[0]).toMatchObject({ user_id: member.id, username: member.username, is_guest: 0 });
  });

  it('RES-TRAV-002: silently drops a user id that is not on the trip (cross-trip guard)', () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    const res = createReservation(testDb, trip.id);

    // An outsider who belongs to a different trip only.
    const { user: outsider } = createUser(testDb);
    const otherTrip = createTrip(testDb, outsider.id);
    addTripMember(testDb, otherTrip.id, outsider.id);

    setReservationTravelers(res.id, trip.id, [member.id, outsider.id]);

    const ids = loadTravelers(res.id).map(t => t.user_id);
    expect(ids).toEqual([member.id]);
    expect(ids).not.toContain(outsider.id);
  });

  it('RES-TRAV-003: assigns a named guest (users.is_guest = 1) joined via trip_members', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const guest = addGuest(trip.id, 'Grandma');
    const res = createReservation(testDb, trip.id);

    setReservationTravelers(res.id, trip.id, [guest.id]);

    const travelers = loadTravelers(res.id);
    expect(travelers).toHaveLength(1);
    expect(travelers[0]).toMatchObject({ user_id: guest.id, username: 'Grandma', is_guest: 1 });
  });

  it('RES-TRAV-004: re-setting replaces the previous set', () => {
    const { user: owner } = createUser(testDb);
    const { user: a } = createUser(testDb);
    const { user: b } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, a.id);
    addTripMember(testDb, trip.id, b.id);
    const res = createReservation(testDb, trip.id);

    setReservationTravelers(res.id, trip.id, [a.id]);
    expect(loadTravelers(res.id).map(t => t.user_id)).toEqual([a.id]);

    setReservationTravelers(res.id, trip.id, [b.id]);
    const ids = loadTravelers(res.id).map(t => t.user_id);
    expect(ids).toEqual([b.id]);
    expect(ids).not.toContain(a.id);

    // Clearing removes everyone.
    setReservationTravelers(res.id, trip.id, []);
    expect(loadTravelers(res.id)).toHaveLength(0);
  });

  it('RES-TRAV-005: listReservations attaches travelers[] per reservation', () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    const withTravelers = createReservation(testDb, trip.id, { title: 'Flight' });
    const withoutTravelers = createReservation(testDb, trip.id, { title: 'Hotel' });

    setReservationTravelers(withTravelers.id, trip.id, [member.id]);

    const list = listReservations(trip.id);
    const assigned = list.find(r => r.id === withTravelers.id);
    const empty = list.find(r => r.id === withoutTravelers.id);

    expect(assigned.travelers).toHaveLength(1);
    expect(assigned.travelers[0]).toMatchObject({ user_id: member.id, username: member.username });
    expect(empty.travelers).toEqual([]);
  });
});
