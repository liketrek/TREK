/**
 * DayAccommodationsRepository — parity tests (Plan 3d Task 7 whole-plan
 * review, item 9/"missing parity tests": this repository had no standalone
 * test file; its methods were only exercised indirectly through
 * `accommodations.service.test.ts`/`reservations.service.test.ts`). ONE
 * seeded world, one `toEqual(<legacy raw>)` test per read method.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import { createDayAccommodation, createPlace, createReservation, createTrip, createUser } from '../../../helpers/factories';
import { DayAccommodations } from '../../../../src/db/entities/DayAccommodations.entity';
import type { DayAccommodationsRepository } from '../../../../src/db/repositories/DayAccommodations.repository';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: DayAccommodationsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(DayAccommodations);
});
beforeEach(() => { resetTestDb(testDb); t.clear(); });
afterAll(async () => { await t.close(); testDb.close(); });

describe('DayAccommodationsRepository — fully seeded world', () => {
  // One seeded world for every test below: a trip with two stays —
  // `named` (a place, a check-in/out, a linked live booking) and `bare`
  // (no place, no booking) — plus a second trip's stay, to prove scoping.
  const seed = () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-01', end_date: '2026-09-05' });
    const otherTrip = createTrip(testDb, user.id, { start_date: '2026-09-01', end_date: '2026-09-02' });
    const days = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number ASC').all(trip.id) as { id: number }[];
    const place = createPlace(testDb, trip.id, { name: 'The Plaza', description: 'Fancy' });
    const named = createDayAccommodation(testDb, trip.id, place.id, days[0].id, days[1].id, { check_in: '15:00', check_out: '11:00', confirmation: 'CONF-1' });
    const booking = createReservation(testDb, trip.id, { title: 'Plaza Stay', type: 'hotel' });
    testDb.prepare('UPDATE reservations SET accommodation_id = ? WHERE id = ?').run(`${named.id}.0`, booking.id);
    const bare = createDayAccommodation(testDb, trip.id, place.id, days[2].id, days[3].id);
    const otherDays = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number ASC').all(otherTrip.id) as { id: number }[];
    const otherPlace = createPlace(testDb, otherTrip.id, { name: 'Elsewhere' });
    const otherStay = createDayAccommodation(testDb, otherTrip.id, otherPlace.id, otherDays[0].id, otherDays[1].id);
    return { trip, otherTrip, days, place, named, booking, bare, otherStay };
  };

  it('AC2 findWithPlace — matches the legacy LEFT JOIN places statement, both with and without a place', async () => {
    const { named, place } = seed();
    const legacySql = `
      SELECT a.*, p.name as place_name, p.address as place_address, p.image_url as place_image, p.lat as place_lat, p.lng as place_lng
      FROM day_accommodations a LEFT JOIN places p ON a.place_id = p.id WHERE a.id = ?`;
    const typed = await repo.findWithPlace(named.id);
    const legacy = testDb.prepare(legacySql).get(named.id);
    expect(typed).toEqual(legacy);
    expect(typed?.place_name).toBe(place.name);
  });

  it('AC3 listForTripWithPlaceAndBooking — matches the legacy LEFT JOIN places/reservations statement, fanning out one row per linked booking', async () => {
    const { trip, named, bare, booking } = seed();
    const legacySql = `
      SELECT a.*, p.name as place_name, p.address as place_address, p.image_url as place_image, p.lat as place_lat, p.lng as place_lng,
        r.title as reservation_title
      FROM day_accommodations a LEFT JOIN places p ON a.place_id = p.id LEFT JOIN reservations r ON r.accommodation_id = a.id
      WHERE a.trip_id = ? ORDER BY a.created_at ASC`;
    const typed = await repo.listForTripWithPlaceAndBooking(trip.id);
    const legacy = testDb.prepare(legacySql).all(trip.id);
    expect(typed).toEqual(legacy);
    expect(typed.map((r) => r.id)).toEqual([named.id, bare.id]);
    expect(typed.find((r) => r.id === named.id)?.reservation_title).toBe(booking.title);
    expect(typed.find((r) => r.id === bare.id)?.reservation_title).toBeNull();
  });

  it('AC34 findInTrip — matches the legacy statement, scoped by trip (a foreign-trip id misses)', async () => {
    const { trip, named, otherStay } = seed();
    const legacy = testDb.prepare('SELECT * FROM day_accommodations WHERE id = ? AND trip_id = ?').get(named.id, trip.id);
    expect(await repo.findInTrip(named.id, trip.id)).toEqual(legacy);
    expect(await repo.findInTrip(otherStay.id, trip.id)).toBeUndefined();
  });

  it('RS37/RS38/RS21 existsInTrip / getCheckIn / getTripId — match the legacy statements', async () => {
    const { trip, named, otherStay } = seed();
    expect(await repo.existsInTrip(named.id, trip.id)).toBe(true);
    expect(await repo.existsInTrip(otherStay.id, trip.id)).toBe(false);
    expect(await repo.getCheckIn(named.id)).toBe('15:00');
    expect(await repo.getTripId(named.id)).toBe(trip.id);
    expect(await repo.getTripId(999999)).toBeUndefined();
  });

  it('DY19 listStartEndDayNumbers — matches the legacy joined day_number statement', async () => {
    const { trip, named, bare } = seed();
    const legacy = testDb.prepare(`
      SELECT a.id, s.day_number as start_no, e.day_number as end_no FROM day_accommodations a
      JOIN days s ON s.id = a.start_day_id JOIN days e ON e.id = a.end_day_id WHERE a.trip_id = ?`).all(trip.id);
    const typed = await repo.listStartEndDayNumbers(trip.id);
    expect(typed).toEqual(legacy);
    expect(typed.map((r) => r.id).sort()).toEqual([named.id, bare.id].sort());
  });

  it('DY20 listForResync — matches the legacy statement, both persist(false) mirror columns present', async () => {
    const { trip, named } = seed();
    const legacy = testDb.prepare('SELECT id, start_day_id, end_day_id, check_in FROM day_accommodations WHERE trip_id = ?').all(trip.id);
    const typed = await repo.listForResync(trip.id);
    expect(typed).toEqual(legacy);
    expect(typed.find((r) => r.id === named.id)).toMatchObject({ start_day_id: named.start_day_id, end_day_id: named.end_day_id, check_in: '15:00' });
  });

  it('DY41 listIdsCheckingInOrOutOn — matches the legacy statement: check-in day, check-out day, not a day only run across', async () => {
    const { trip, days, named, bare } = seed();
    const legacy = (dayId: number) => (testDb.prepare(
      'SELECT id FROM day_accommodations WHERE trip_id = ? AND (start_day_id = ? OR end_day_id = ?) ORDER BY id',
    ).all(trip.id, dayId, dayId) as { id: number }[]).map((r) => r.id);
    for (const day of days) expect(await repo.listIdsCheckingInOrOutOn(trip.id, day.id)).toEqual(legacy(day.id));
    expect(await repo.listIdsCheckingInOrOutOn(trip.id, days[0].id)).toEqual([named.id]);
    expect(await repo.listIdsCheckingInOrOutOn(trip.id, days[1].id)).toEqual([named.id]);
    expect(await repo.listIdsCheckingInOrOutOn(trip.id, days[3].id)).toEqual([bare.id]);
    expect(await repo.listIdsCheckingInOrOutOn(trip.id, days[4].id)).toEqual([]);
  });

  it('DY41 listIdsCheckingInOrOutOn — scoped by trip (another trip\'s day matches nothing here)', async () => {
    const { trip, otherStay } = seed();
    expect(await repo.listIdsCheckingInOrOutOn(trip.id, otherStay.start_day_id)).toEqual([]);
  });

  it('RPL3 listRoadtripStays — matches the legacy LEFT JOIN places + MIN(reservation) statement, id order', async () => {
    const { trip, named, bare, booking } = seed();
    const legacy = testDb.prepare(`
      SELECT a.id, a.place_id, a.start_day_id, a.end_day_id, a.check_in, a.check_out,
        p.name AS place_name, p.lat AS place_lat, p.lng AS place_lng,
        (SELECT MIN(r.id) FROM reservations r WHERE r.accommodation_id = a.id) AS reservation_id
      FROM day_accommodations a LEFT JOIN places p ON p.id = a.place_id WHERE a.trip_id = ? ORDER BY a.id`).all(trip.id);
    const typed = await repo.listRoadtripStays(trip.id);
    expect(typed).toEqual(legacy);
    expect(typed.map((r) => r.id)).toEqual([named.id, bare.id]);
    expect(typed.find((r) => r.id === named.id)?.reservation_id).toBe(booking.id);
    expect(typed.find((r) => r.id === bare.id)?.reservation_id).toBeNull();
  });

  it('PL16 listForPlace — matches the legacy statement, scoped by trip AND place', async () => {
    const { trip, place, named, bare } = seed();
    const legacy = testDb.prepare('SELECT id FROM day_accommodations WHERE trip_id = ? AND place_id = ?').all(trip.id, place.id);
    const typed = await repo.listForPlace(trip.id, place.id);
    expect(typed).toEqual(legacy);
    expect(typed.map((r) => r.id).sort()).toEqual([named.id, bare.id].sort());
  });

  it('TP55 listAllForTrip — matches the legacy SELECT *, no ORDER BY, scoped by trip', async () => {
    const { trip, otherTrip, named, bare, otherStay } = seed();
    const legacy = testDb.prepare('SELECT * FROM day_accommodations WHERE trip_id = ?').all(trip.id);
    const typed = await repo.listAllForTrip(trip.id);
    expect(typed).toEqual(legacy);
    expect(typed.map((r) => r.id).sort()).toEqual([named.id, bare.id].sort());
    expect(await repo.listAllForTrip(otherTrip.id)).toEqual([{ ...otherStay }]);
  });
});
