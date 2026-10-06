/**
 * TRAVELER_OWNS consumers — full-row parity (L6, task-7-review.md item 11).
 *
 * `reservation-travelers-owns.parity.test.ts` (this directory) proves the
 * predicate fragment itself against ids only. AT6 (`listOwnedEndpointsForTrips`),
 * AT45 (`listOwnedEndpointsForUser`) and AT46 (`listOwnedFlightLegsForUser`,
 * ordered) are its three ACTUAL production consumers and had no full-row
 * `toEqual` against the legacy statement before this. One seeded world
 * covering zero-traveler, caller-assigned, foreign-only, cancelled and
 * multi-traveler bookings across a past trip, a future trip and a dateless
 * trip; every row of every method compared byte-for-byte against the legacy
 * SQL text (kept fixed here, independent of the repository under test, per
 * `reservation-visibility.test.ts`'s own oracle reasoning).
 */
import type { ReservationEndpointsRepository } from '../../../../../src/db/repositories/ReservationEndpoints.repository';
import { createSnapshotTestDb } from '../../../../helpers/db-mock';
import { createReservation, createTrip, createUser, addTripMember } from '../../../../helpers/factories';
import { resetTestDb } from '../../../../helpers/test-db';
import { createTestReservationEndpointsRepo } from '../../../../helpers/test-uow';
import { todayUtc } from '@trek/shared';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const TRAVELER_OWNS = `
    (NOT EXISTS (SELECT 1 FROM reservation_travelers rt WHERE rt.reservation_id = r.id)
     OR EXISTS (SELECT 1 FROM reservation_travelers rt WHERE rt.reservation_id = r.id AND rt.user_id = ?))`;

const AT6 = (n: number) => `
    SELECT DISTINCT e.id, e.reservation_id, r.trip_id, e.role, e.code, e.lat, e.lng, e.local_date, e.local_time,
           r.type AS reservation_type, r.status AS reservation_status,
           CASE e.role
             WHEN 'to' THEN COALESCE(r.reservation_end_time, r.reservation_time)
             ELSE COALESCE(r.reservation_time, r.reservation_end_time)
           END AS fallback_time
    FROM reservation_endpoints e
    JOIN reservations r ON e.reservation_id = r.id
    WHERE r.trip_id IN (${Array(n).fill('?').join(',')}) AND e.role IN ('from', 'to')
      AND ${TRAVELER_OWNS}`;

const AT45 = `
    SELECT DISTINCT e.id, e.reservation_id, r.trip_id, e.role, e.code, e.lat, e.lng, e.local_date, e.local_time,
           r.type AS reservation_type, r.status AS reservation_status,
           CASE e.role
             WHEN 'to' THEN COALESCE(r.reservation_end_time, r.reservation_time)
             ELSE COALESCE(r.reservation_time, r.reservation_end_time)
           END AS fallback_time
    FROM reservation_endpoints e
    JOIN reservations r ON e.reservation_id = r.id
    JOIN trips t ON r.trip_id = t.id
    LEFT JOIN trip_members tm ON t.id = tm.trip_id
    WHERE (t.user_id = ? OR tm.user_id = ?) AND e.role IN ('from', 'to')
      AND COALESCE(t.start_date, t.end_date) IS NOT NULL
      AND COALESCE(t.start_date, t.end_date) <= date('now')
      AND ${TRAVELER_OWNS}`;

const AT46 = `
      SELECT re.reservation_id, re.lat, re.lng
      FROM reservation_endpoints re
      JOIN reservations r ON r.id = re.reservation_id
      JOIN trips t ON t.id = r.trip_id
      LEFT JOIN trip_members tm ON tm.trip_id = t.id AND tm.user_id = ?
      WHERE (t.user_id = ? OR tm.user_id IS NOT NULL)
        AND r.type = 'flight'
        AND r.status != 'cancelled'
        AND ${TRAVELER_OWNS}
      ORDER BY re.reservation_id, re.sequence`;

const db = createSnapshotTestDb();
let repo: ReservationEndpointsRepository;
const users: number[] = [];
const trips: number[] = [];
const sortRows = (rows: unknown[]) => [...rows].sort((a, b) => (a as { id: number }).id - (b as { id: number }).id);

beforeAll(async () => {
  resetTestDb(db);
  repo = await createTestReservationEndpointsRepo(db);
  const A = createUser(db).user.id,
    B = createUser(db).user.id,
    C = createUser(db).user.id,
    D = createUser(db).user.id;
  users.push(A, B, C, D);
  const past = createTrip(db, A, { start_date: '2020-01-01', end_date: '2020-01-05' }).id;
  const future = createTrip(db, A, { start_date: '2099-01-01', end_date: '2099-01-02' }).id;
  const dateless = createTrip(db, B).id;
  trips.push(past, future, dateless);
  addTripMember(db, past, B);
  addTripMember(db, past, C);
  addTripMember(db, future, B);
  const ep = db.prepare(
    'INSERT INTO reservation_endpoints (reservation_id, role, sequence, name, code, lat, lng, local_date, local_time) VALUES (?,?,?,?,?,?,?,?,?)',
  );
  const trv = db.prepare('INSERT INTO reservation_travelers (reservation_id, user_id) VALUES (?, ?)');
  let k = 0;
  for (const tid of [past, future, dateless]) {
    const shapes: [string, string | null, number[]][] = [
      ['flight', null, []], // zero travelers
      ['flight', null, [A]], // assigned to A
      ['flight', null, [C]], // foreign-only (C)
      ['flight', 'cancelled', []],
      ['train', 'confirmed', [A, B]],
      ['flight', 'confirmed', [B, C]],
    ];
    for (const [type, status, tr] of shapes) {
      const r = createReservation(db, tid, { type }).id;
      db.prepare('UPDATE reservations SET status = ?, reservation_time = ?, reservation_end_time = ? WHERE id = ?').run(
        status ?? 'pending',
        k % 2 ? '2020-01-01T10:00' : null,
        k % 3 ? '2020-01-01T14:00' : null,
        r,
      );
      k++;
      ep.run(r, 'from', 0, 'X', 'FRA', 50.03 + k, 8.57, k % 2 ? '2020-01-01' : null, k % 2 ? '10:00' : null);
      ep.run(r, 'stop', 1, 'X', 'DXB', 25.25, 55.36, null, null);
      ep.run(r, 'to', 2, 'X', 'SIN', 1.36, 103.99 + k, '2020-01-02', null);
      for (const u of tr) trv.run(r, u);
    }
  }
});
afterAll(() => db.close());

describe('TRAVELER_OWNS consumers: repository vs legacy raw SQL, full rows', () => {
  it('AT6 — listOwnedEndpointsForTrips', async () => {
    for (const u of users) {
      const legacy = db.prepare(AT6(trips.length)).all(...trips, u);
      expect(sortRows(await repo.listOwnedEndpointsForTrips(trips, u))).toEqual(sortRows(legacy));
    }
  });

  it('AT45 — listOwnedEndpointsForUser', async () => {
    for (const u of users) {
      const legacy = db.prepare(AT45).all(u, u, u);
      expect(sortRows(await repo.listOwnedEndpointsForUser(u, todayUtc()))).toEqual(sortRows(legacy));
    }
  });

  it('AT46 — listOwnedFlightLegsForUser (ordered)', async () => {
    for (const u of users) {
      const legacy = db.prepare(AT46).all(u, u, u);
      expect(await repo.listOwnedFlightLegsForUser(u)).toEqual(legacy);
    }
  });

  it('seeded cases are non-trivial (C sees foreign-only; A does not; D has no access at all)', () => {
    const [A, , C, D] = users;
    const ids = (u: number) =>
      JSON.stringify(
        [
          ...new Set(
            (db.prepare(AT6(trips.length)).all(...trips, u) as { reservation_id: number }[]).map(
              (r) => r.reservation_id,
            ),
          ),
        ].sort(),
      );
    const a = ids(A).length;
    const c = ids(C).length;
    const d = db.prepare(AT45).all(D, D, D).length;
    expect(a).toBeGreaterThan(0);
    expect(c).toBeGreaterThan(0);
    expect(d).toBe(0);
    expect(ids(A)).not.toBe(ids(C));
  });
});
