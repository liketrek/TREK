/**
 * FlightLiveStatesRepository: the stored state of a flight per callsign and
 * day, and the reads of flight bookings, endpoints, days and travellers the
 * live flight status builds its legs from. FLREPO-001 to FLREPO-007.
 */
import { FlightLiveStates } from '../../../../src/db/entities/FlightLiveStates.entity';
import type {
  FlightLiveStatesRepository,
  FlightLiveStateWrite,
} from '../../../../src/db/repositories/FlightLiveStates.repository';
import type { DbTimestamp } from '../../../../src/db/types';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import {
  addReservationTraveler,
  makeReservation,
  makeReservationEndpoint,
} from '../../../helpers/factories/reservations';
import { findRows } from '../../../helpers/factories/rows';
import { addTripMember, makeDay, makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: FlightLiveStatesRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(FlightLiveStates);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function state(overrides: Partial<FlightLiveStateWrite> = {}): FlightLiveStateWrite {
  return {
    callsign: 'DLH716',
    service_date: '2026-07-01',
    origin: 'FRA',
    destination: 'HND',
    phase: 'airborne',
    departed_at: '2026-07-01 11:52:00' as DbTimestamp,
    landed_at: null,
    lat: 55.1,
    lng: 60.2,
    altitude_ft: 36000,
    ground_speed_kt: 480,
    track_deg: 51,
    vertical_rate_fpm: 0,
    on_ground: 0,
    registration: 'D-AIXA',
    aircraft_type: 'A359',
    source: 'adsb.lol',
    first_seen_at: '2026-07-01 11:40:00' as DbTimestamp,
    last_seen_at: '2026-07-01 14:00:00' as DbTimestamp,
    fetched_at: '2026-07-01 14:00:01' as DbTimestamp,
    next_poll_at: '2026-07-01 14:03:01' as DbTimestamp,
    fail_count: 0,
    departed_notified: 1,
    landed_notified: 0,
    delay_notified: 0,
    ...overrides,
  };
}

describe('FlightLiveStatesRepository: states', () => {
  it('FLREPO-001: writes a whole state and replaces it under the same key', async () => {
    await repo.saveState(state());
    await repo.saveState(state({ phase: 'landed', landed_at: '2026-07-01 23:10:00' as DbTimestamp, lat: 35.5 }));
    await repo.saveState(state({ service_date: '2026-07-02', phase: 'scheduled' }));
    await repo.saveState(state({ callsign: 'BAW12' }));

    const rows = await repo.findForCallsigns(['DLH716']);
    expect(rows.map((r) => [r.service_date, r.phase, r.landed_at, r.lat]).sort()).toEqual([
      ['2026-07-01', 'landed', '2026-07-01 23:10:00', 35.5],
      ['2026-07-02', 'scheduled', null, 55.1],
    ]);
    expect(rows.find((r) => r.service_date === '2026-07-01')).toMatchObject({
      registration: 'D-AIXA',
      departed_notified: 1,
      next_poll_at: '2026-07-01 14:03:01',
    });
    expect(await repo.findForCallsigns([])).toEqual([]);
  });

  it('FLREPO-001b: two sectors of one flight number on one day are two states', async () => {
    await repo.saveState(state({ callsign: 'DLH754', origin: 'FRA', destination: 'BOM' }));
    await repo.saveState(state({ callsign: 'DLH754', origin: 'BOM', destination: 'SIN', phase: 'scheduled' }));
    const rows = await repo.findForCallsigns(['DLH754']);
    expect(rows.map((r) => [r.origin, r.destination, r.phase]).sort()).toEqual([
      ['BOM', 'SIN', 'scheduled'],
      ['FRA', 'BOM', 'airborne'],
    ]);
  });

  it('FLREPO-002: drops the states of flights that departed before a day', async () => {
    await repo.saveState(state({ service_date: '2026-05-30' }));
    await repo.saveState(state({ service_date: '2026-06-01' }));
    expect(await repo.deleteBefore('2026-06-01')).toBe(1);
    expect((await findRows(t, FlightLiveStates)).map((r) => r.service_date)).toEqual(['2026-06-01']);
  });
});

describe('FlightLiveStatesRepository: bookings', () => {
  it('FLREPO-003: the flight bookings of one trip with the trip title, nothing of other types or trips', async () => {
    const { user } = await makeUser(t);
    const trip = await makeTrip(t, user.id, { title: 'Japan' });
    const other = await makeTrip(t, user.id);
    const flight = await makeReservation(t, trip.id, {
      title: 'FRA to HND',
      type: 'flight',
      metadata: '{"flight_number":"LH 716"}',
      reservation_time: '2026-07-01T13:40',
    });
    await makeReservation(t, trip.id, { title: 'Hotel', type: 'hotel' });
    await makeReservation(t, other.id, { title: 'Elsewhere', type: 'flight' });

    expect(await repo.listFlightBookingsForTrip(trip.id)).toEqual([
      {
        id: flight.id,
        trip_id: trip.id,
        trip_title: 'Japan',
        metadata: '{"flight_number":"LH 716"}',
        day_id: null,
        end_day_id: null,
        reservation_time: '2026-07-01T13:40',
        reservation_end_time: null,
      },
    ]);
  });

  it('FLREPO-004: the poll candidates skip archived trips and trips whose dates lie outside the span', async () => {
    const { user } = await makeUser(t);
    const current = await makeTrip(t, user.id, { start_date: '2026-06-28', end_date: '2026-07-05' });
    const undated = await makeTrip(t, user.id);
    const past = await makeTrip(t, user.id, { start_date: '2026-05-01', end_date: '2026-05-03' });
    const future = await makeTrip(t, user.id, { start_date: '2026-09-01', end_date: '2026-09-03' });
    const archived = await makeTrip(t, user.id, { start_date: '2026-06-28', end_date: '2026-07-05', is_archived: 1 });
    await [current, undated, past, future, archived].reduce(async (previous, trip) => {
      await previous;
      await makeReservation(t, trip.id, { title: 'Flight', type: 'flight' });
    }, Promise.resolve());
    const rows = await repo.listFlightBookingsBetween('2026-06-29', '2026-07-03');
    expect(rows.map((r) => r.trip_id).sort((a, b) => a - b)).toEqual([current.id, undated.id].sort((a, b) => a - b));
  });

  it('FLREPO-005: the endpoints of the bookings in their order, and none for no bookings', async () => {
    const { user } = await makeUser(t);
    const trip = await makeTrip(t, user.id);
    const flight = await makeReservation(t, trip.id, { title: 'Flight', type: 'flight' });
    await makeReservationEndpoint(t, flight.id, { role: 'to', sequence: 1, code: 'HND', name: 'Haneda (HND)' });
    await makeReservationEndpoint(t, flight.id, {
      role: 'from',
      sequence: 0,
      code: 'FRA',
      name: 'Frankfurt (FRA)',
      timezone: 'Europe/Berlin',
      local_date: '2026-07-01',
      local_time: '13:40',
    });
    const endpoints = await repo.listEndpoints([flight.id]);
    expect(endpoints.map((e) => [e.sequence, e.code])).toEqual([
      [0, 'FRA'],
      [1, 'HND'],
    ]);
    expect(endpoints[0]).toMatchObject({
      reservation_id: flight.id,
      role: 'from',
      timezone: 'Europe/Berlin',
      local_date: '2026-07-01',
      local_time: '13:40',
    });
    expect(await repo.listEndpoints([])).toEqual([]);
  });

  it('FLREPO-006: the dates of trip days, leaving out a day without one', async () => {
    const { user } = await makeUser(t);
    const trip = await makeTrip(t, user.id);
    const dated = await makeDay(t, trip.id, { day_number: 1, date: '2026-07-01' });
    const undated = await makeDay(t, trip.id, { day_number: 2, date: null });
    expect(await repo.listDayDates([dated.id, undated.id])).toEqual([{ id: dated.id, date: '2026-07-01' }]);
    expect(await repo.listDayDates([])).toEqual([]);
  });

  it('FLREPO-007: the travellers put on a booking who still belong to the trip, never a removed member', async () => {
    const { user } = await makeUser(t);
    const { user: friend } = await makeUser(t);
    const { user: removed } = await makeUser(t);
    const trip = await makeTrip(t, user.id);
    await addTripMember(t, trip.id, friend.id);
    const flight = await makeReservation(t, trip.id, { title: 'Flight', type: 'flight' });
    expect(await repo.listTravelerIds(flight.id)).toEqual([]);
    await addReservationTraveler(t, flight.id, friend.id);
    await addReservationTraveler(t, flight.id, user.id);
    // On the traveller list from before, but no longer on the trip.
    await addReservationTraveler(t, flight.id, removed.id);
    expect(await repo.listTravelerIds(flight.id)).toEqual([user.id, friend.id].sort((a, b) => a - b));
  });
});
