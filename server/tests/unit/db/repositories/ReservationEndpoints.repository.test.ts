/**
 * ReservationEndpointsRepository — parity tests (Plan 3d Task 7 whole-plan
 * review, item 9/"missing parity tests": this repository had no standalone
 * test file). ONE seeded world, one `toEqual(<legacy raw>)` test per read
 * method.
 */
import { ReservationEndpoints } from '../../../../src/db/entities/ReservationEndpoints.entity';
import type { ReservationEndpointsRepository } from '../../../../src/db/repositories/ReservationEndpoints.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createReservation, createTrip, createUser } from '../../../helpers/factories';
import { insertRow } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: ReservationEndpointsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(ReservationEndpoints);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

const insertEndpoint = async (
  reservationId: number,
  role: string,
  sequence: number,
  overrides: Partial<{
    name: string;
    code: string | null;
    lat: number;
    lng: number;
    timezone: string | null;
    local_time: string | null;
    local_date: string | null;
  }> = {},
) => {
  await insertRow(t, ReservationEndpoints, {
    reservation: reservationId,
    role,
    sequence,
    name: overrides.name ?? `${role} endpoint`,
    code: overrides.code ?? null,
    lat: overrides.lat ?? 48.0,
    lng: overrides.lng ?? 11.0,
    timezone: overrides.timezone ?? null,
    local_time: overrides.local_time ?? null,
    local_date: overrides.local_date ?? null,
  });
};

describe('ReservationEndpointsRepository — fully seeded world', () => {
  const seed = async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const flight = createReservation(testDb, trip.id, { title: 'Flight', type: 'flight' });
    const otherFlight = createReservation(testDb, trip.id, { title: 'Return flight', type: 'flight' });
    await insertEndpoint(flight.id, 'from', 0, { name: 'MUC', code: 'MUC', local_date: '2026-09-01' });
    await insertEndpoint(flight.id, 'to', 1, { name: 'JFK', code: 'JFK', local_date: '2026-09-01' });
    await insertEndpoint(otherFlight.id, 'from', 0, { name: 'JFK', code: 'JFK' });

    const otherTrip = createTrip(testDb, user.id);
    const foreignFlight = createReservation(testDb, otherTrip.id, { title: 'Foreign', type: 'flight' });
    await insertEndpoint(foreignFlight.id, 'from', 0, { name: 'LHR', code: 'LHR' });

    return { trip, otherTrip, flight, otherFlight, foreignFlight };
  };

  it('RS3 listForTrip — matches the legacy JOIN reservations statement, ordered by reservation then sequence, scoped by trip', async () => {
    const { trip, flight, otherFlight } = await seed();
    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    const legacy = testDb
      .prepare(
        `
      SELECT e.* FROM reservation_endpoints e JOIN reservations r ON e.reservation_id = r.id
      WHERE r.trip_id = ? ORDER BY e.reservation_id, e.sequence`,
      )
      .all(trip.id);
    const typed = await repo.listForTrip(trip.id);
    expect(typed).toEqual(legacy);
    expect(typed.map((e) => [e.reservation_id, e.sequence])).toEqual([
      [flight.id, 0],
      [flight.id, 1],
      [otherFlight.id, 0],
    ]);
  });

  it('RR2 listForReservation — matches the legacy statement, ordered by sequence, scoped to one reservation', async () => {
    const { flight } = await seed();
    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    const legacy = testDb
      .prepare('SELECT * FROM reservation_endpoints WHERE reservation_id = ? ORDER BY sequence')
      .all(flight.id);
    const typed = await repo.listForReservation(flight.id);
    expect(typed).toEqual(legacy);
    expect(typed.map((e) => e.role)).toEqual(['from', 'to']);
  });

  it('DY17 listIdAndDate — matches the legacy statement', async () => {
    const { flight } = await seed();
    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    const legacy = testDb
      .prepare('SELECT id, local_date FROM reservation_endpoints WHERE reservation_id = ?')
      .all(flight.id);
    const typed = await repo.listIdAndDate(flight.id);
    expect(typed).toEqual(legacy);
    expect(typed.every((r) => r.local_date === '2026-09-01')).toBe(true);
  });

  it('RPL6 listRoadtripTerminals — matches the legacy JOIN reservations statement, ordered by reservation then sequence, scoped by trip', async () => {
    const { trip, flight, otherFlight } = await seed();
    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    const legacy = testDb
      .prepare(
        `
      SELECT e.reservation_id, e.role, e.sequence, e.name, e.code, e.lat, e.lng FROM reservation_endpoints e
      JOIN reservations r ON r.id = e.reservation_id WHERE r.trip_id = ? ORDER BY e.reservation_id, e.sequence`,
      )
      .all(trip.id);
    const typed = await repo.listRoadtripTerminals(trip.id);
    expect(typed).toEqual(legacy);
    expect(typed.map((e) => [e.reservation_id, e.sequence])).toEqual([
      [flight.id, 0],
      [flight.id, 1],
      [otherFlight.id, 0],
    ]);
  });
});
