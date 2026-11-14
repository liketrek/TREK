/**
 * FlightLiveService: the trip read the REST route and the MCP tool share.
 * The service comes out of FlightLiveModule over the migrated snapshot, with
 * the real airports, settings and repository; only the feed is a stub, and
 * the read must never ask it.
 */
import { AppSettings } from '../../../../src/db/entities/AppSettings.entity';
import { FlightLiveStates } from '../../../../src/db/entities/FlightLiveStates.entity';
import type { FlightLiveStateRow } from '../../../../src/db/repositories/FlightLiveStates.repository';
import { FlightLiveFeedService } from '../../../../src/nest/flight-live/flight-live.feeds';
import { FlightLiveModule } from '../../../../src/nest/flight-live/flight-live.module';
import { FlightLiveService, rowToState, stateKey } from '../../../../src/nest/flight-live/flight-live.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makeReservation, makeReservationEndpoint } from '../../../helpers/factories/reservations';
import { deleteRows, insertRow } from '../../../helpers/factories/rows';
import { makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import { tripFlightLiveResponseSchema } from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let service: FlightLiveService;
let orm: MikroORM;
const feed = {
  lookup: vi.fn(),
  attribution: vi.fn(() => 'Live positions: adsb.lol (ODbL)'),
  sources: vi.fn(() => ['adsb.lol']),
  canAsk: vi.fn(() => true),
  waitMs: vi.fn(() => 0),
};

const MIN = 60_000;
/** 12:00 in Frankfurt on 1 July 2026; the flight lands in Berlin at 13:10. */
const DEP = Date.parse('2026-07-01T10:00:00Z');

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [FlightLiveModule],
    overrides: [{ provide: FlightLiveFeedService, useValue: feed }],
  });
  service = t.get(FlightLiveService);
  orm = t.get(MikroORM);
});
beforeEach(() => {
  resetTestDb(db);
  vi.clearAllMocks();
});
afterAll(async () => {
  await t.close();
  db.close();
});

/** A trip with one flight LH 100 from Frankfurt to Berlin on 1 July 2026. */
async function seedFlight(flightNumber = 'LH 100') {
  const { user } = await makeUser(orm);
  const trip = await makeTrip(orm, user.id, { title: 'Berlin' });
  const flight = await makeReservation(orm, trip.id, {
    title: 'FRA to BER',
    type: 'flight',
    metadata: JSON.stringify({ flight_number: flightNumber, airline: 'Lufthansa' }),
  });
  await makeReservationEndpoint(orm, flight.id, {
    role: 'from',
    sequence: 0,
    name: 'Frankfurt (FRA)',
    code: 'FRA',
    lat: 50.0333,
    lng: 8.5706,
    timezone: 'Europe/Berlin',
    local_date: '2026-07-01',
    local_time: '12:00',
  });
  await makeReservationEndpoint(orm, flight.id, {
    role: 'to',
    sequence: 1,
    name: 'Berlin Brandenburg (BER)',
    code: 'BER',
    lat: 52.3667,
    lng: 13.5033,
    timezone: 'Europe/Berlin',
    local_date: '2026-07-01',
    local_time: '13:10',
  });
  return { user, trip, flight };
}

function storedRow(overrides: Partial<FlightLiveStateRow> = {}): FlightLiveStateRow {
  return {
    callsign: 'DLH100',
    service_date: '2026-07-01',
    origin: 'FRA',
    destination: 'BER',
    phase: 'airborne',
    departed_at: '2026-07-01 10:12:00',
    landed_at: null,
    lat: 51.2,
    lng: 11,
    altitude_ft: 36000,
    ground_speed_kt: 420,
    track_deg: 60,
    vertical_rate_fpm: 0,
    on_ground: 0,
    registration: 'D-AINA',
    aircraft_type: 'A20N',
    source: 'adsb.fi',
    first_seen_at: '2026-07-01 09:50:00',
    last_seen_at: '2026-07-01 10:30:00',
    fetched_at: '2026-07-01 10:30:00',
    next_poll_at: '2026-07-01 10:33:00',
    fail_count: 0,
    departed_notified: 1,
    landed_notified: 0,
    delay_notified: 0,
    ...overrides,
  };
}

describe('FlightLiveService.tripFlights', () => {
  it('FLSVC-001: switched off, it answers nothing and reads no booking', async () => {
    const { trip } = await seedFlight();
    await insertRow(orm, AppSettings, { key: 'flight_live_enabled', value: 'false' });
    expect(await service.isEnabled()).toBe(false);
    expect(await service.tripFlights(trip.id, DEP)).toEqual({ enabled: false, attribution: null, flights: [] });
  });

  it('FLSVC-002: a flight days ahead comes back with its schedule in UTC, and nothing is put up for a poll', async () => {
    const { trip, flight } = await seedFlight();
    const answer = await service.tripFlights(trip.id, DEP - 3 * 24 * 60 * MIN);
    expect(tripFlightLiveResponseSchema.parse(answer)).toEqual(answer);
    expect(answer).toMatchObject({ enabled: true, attribution: 'Live positions: adsb.lol (ODbL)' });
    expect(answer.flights).toHaveLength(1);
    expect(answer.flights[0]).toMatchObject({
      reservation_id: flight.id,
      leg_index: 0,
      callsign: 'DLH100',
      flight_number: 'LH 100',
      service_date: '2026-07-01',
      origin: { code: 'FRA', name: 'Frankfurt', timezone: 'Europe/Berlin' },
      destination: { code: 'BER', name: 'Berlin Brandenburg', timezone: 'Europe/Berlin' },
      phase: 'scheduled',
      scheduled_departure: '2026-07-01T10:00:00.000Z',
      scheduled_arrival: '2026-07-01T11:10:00.000Z',
      source: null,
    });
    expect(service.takeRefreshRequests(DEP)).toEqual(new Set());
    expect(feed.lookup).not.toHaveBeenCalled();
  });

  it('FLSVC-003: an in-window flight without a fresh answer is put up for the next tick, once a minute', async () => {
    const { trip } = await seedFlight();
    const key = stateKey('DLH100', '2026-07-01', 'FRA', 'BER');
    await service.tripFlights(trip.id, DEP - 30 * MIN);
    await service.tripFlights(trip.id, DEP - 29.5 * MIN);
    expect(service.takeRefreshRequests(DEP - 29.4 * MIN)).toEqual(new Set([key]));
    // Within the minute of the first ask: nothing new to hand over.
    await service.tripFlights(trip.id, DEP - 29.2 * MIN);
    expect(service.takeRefreshRequests(DEP - 29.1 * MIN)).toEqual(new Set());
    await service.tripFlights(trip.id, DEP - 28.5 * MIN);
    expect(service.takeRefreshRequests(DEP - 28.5 * MIN)).toEqual(new Set([key]));
    expect(feed.lookup).not.toHaveBeenCalled();
  });

  it('FLSVC-004: a stored state answers on top of the schedule, with the credit of its source', async () => {
    const { trip } = await seedFlight();
    await insertRow(orm, FlightLiveStates, storedRow());
    const now = Date.parse('2026-07-01T10:31:00Z');
    const answer = await service.tripFlights(trip.id, now);
    expect(answer.attribution).toBe('Live positions: adsb.fi');
    expect(answer.flights[0]).toMatchObject({
      phase: 'airborne',
      departed_at: '2026-07-01T10:12:00.000Z',
      departure_delay_min: 12,
      aircraft: { registration: 'D-AINA', type: 'A20N' },
      last_seen_at: '2026-07-01T10:30:00.000Z',
      source: 'adsb.fi',
      stale: false,
    });
    // Fetched a minute ago: fresh enough, nothing to refresh.
    expect(service.takeRefreshRequests(now)).toEqual(new Set());
  });

  it('FLSVC-004b: a flight the poll backs off from, or has given up on, is not put up by a client', async () => {
    const { trip } = await seedFlight();
    const now = Date.parse('2026-07-01T10:31:00Z');
    await insertRow(orm, FlightLiveStates, storedRow({ phase: 'unknown', fetched_at: '2026-07-01 10:20:00' }));
    await service.tripFlights(trip.id, now);
    expect(service.takeRefreshRequests(now)).toEqual(new Set());
    await deleteRows(orm, FlightLiveStates);
    await insertRow(orm, FlightLiveStates, storedRow({ fail_count: 3, fetched_at: '2026-07-01 10:20:00' }));
    await service.tripFlights(trip.id, now + 2 * MIN);
    expect(service.takeRefreshRequests(now + 2 * MIN)).toEqual(new Set());
  });

  it('FLSVC-005: a flight number that maps to no callsign is not listed', async () => {
    const { trip } = await seedFlight('Lufthansa');
    expect((await service.tripFlights(trip.id, DEP)).flights).toEqual([]);
    const { user } = await makeUser(orm);
    const empty = await makeTrip(orm, user.id);
    expect(await service.tripFlights(empty.id, DEP)).toMatchObject({ enabled: true, flights: [] });
  });
});

describe('rowToState', () => {
  it('FLSVC-006: reads the stored text back as instants, and an unknown phase or source falls back', () => {
    const state = rowToState(storedRow());
    expect(state).toMatchObject({
      phase: 'airborne',
      departed_at: Date.parse('2026-07-01T10:12:00Z'),
      source: 'adsb.fi',
      departed_notified: true,
      landed_notified: false,
      position: { lat: 51.2, lng: 11, on_ground: false },
    });
    const odd = rowToState(storedRow({ phase: 'cruising', source: 'radar', lat: null, on_ground: 1 }));
    expect(odd).toMatchObject({ phase: 'scheduled', source: null, position: null });
  });
});
