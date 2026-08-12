import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Import pipeline against the real test DB — only the AirTrail client and the
 * per-user credentials are mocked. Covers the joined multi-leg import (#1535):
 * one reservation per connection chain, detached from live sync, with every
 * member id recorded for dedupe; plus the fallbacks when a requested join
 * doesn't actually chain.
 */

vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn() }));
vi.mock('../../../src/services/airtrail/airtrailService', () => ({
  getAirtrailCredentials: vi.fn(() => ({ baseUrl: 'https://at.example', apiKey: 'k', allowInsecureTls: false })),
}));
vi.mock('../../../src/services/airtrail/airtrailClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/services/airtrail/airtrailClient')>();
  return { ...actual, listFlights: vi.fn() };
});

import { db } from '../../../src/db/database';
import { createUser, createTrip } from '../../helpers/factories';
import { listFlights } from '../../../src/services/airtrail/airtrailClient';
import type { AirtrailAirport, AirtrailFlightRaw } from '../../../src/services/airtrail/airtrailClient';
import { importAirtrailFlights } from '../../../src/services/airtrail/airtrailImport';

const BRU: AirtrailAirport = { id: 1, icao: 'EBBR', iata: 'BRU', name: 'Brussels', lat: 50.9014, lon: 4.4844, tz: 'Europe/Brussels', country: 'BE' };
const HEL: AirtrailAirport = { id: 2, icao: 'EFHK', iata: 'HEL', name: 'Helsinki-Vantaa', lat: 60.3172, lon: 24.9633, tz: 'Europe/Helsinki', country: 'FI' };
const JFK: AirtrailAirport = { id: 3, icao: 'KJFK', iata: 'JFK', name: 'John F. Kennedy Intl.', lat: 40.6413, lon: -73.7781, tz: 'America/New_York', country: 'US' };
const LHR: AirtrailAirport = { id: 4, icao: 'EGLL', iata: 'LHR', name: 'London Heathrow', lat: 51.4706, lon: -0.4619, tz: 'Europe/London', country: 'GB' };

function rawFlight(over: Partial<AirtrailFlightRaw> = {}): AirtrailFlightRaw {
  return {
    id: 101,
    from: BRU,
    to: HEL,
    date: '2026-08-01',
    datePrecision: 'day',
    departure: '2026-08-01T06:00:00.000+00:00',
    arrival: '2026-08-01T09:30:00.000+00:00',
    departureScheduled: null,
    arrivalScheduled: null,
    airline: { id: 1, icao: 'FIN', iata: 'AY', name: 'Finnair' },
    flightNumber: 'AY1502',
    aircraft: null,
    aircraftReg: null,
    flightReason: 'leisure',
    note: null,
    seats: [{ userId: 'u1', guestName: null, seat: 'window', seatNumber: '12A', seatClass: 'economy' }],
    ...over,
  };
}

const legBruHel = () => rawFlight();
const legHelJfk = () =>
  rawFlight({
    id: 102,
    from: HEL,
    to: JFK,
    departure: '2026-08-01T11:00:00.000+00:00',
    arrival: '2026-08-01T19:00:00.000+00:00',
    flightNumber: 'AY15',
  });
/** No connection to the BRU→HEL leg — departs LHR. */
const legLhrJfk = () =>
  rawFlight({
    id: 103,
    from: LHR,
    to: JFK,
    departure: '2026-08-02T10:00:00.000+00:00',
    arrival: '2026-08-02T18:00:00.000+00:00',
    flightNumber: 'BA117',
  });

function tripReservations(tripId: number) {
  return db.prepare('SELECT * FROM reservations WHERE trip_id = ? ORDER BY id').all(tripId) as any[];
}

function endpointsOf(reservationId: number) {
  return db
    .prepare('SELECT role, code, sequence FROM reservation_endpoints WHERE reservation_id = ? ORDER BY sequence')
    .all(reservationId) as { role: string; code: string | null; sequence: number }[];
}

let tripId: number;
let userId: number;

beforeEach(() => {
  vi.clearAllMocks();
  const { user } = createUser(db);
  userId = user.id;
  tripId = createTrip(db, userId, { start_date: '2026-08-01', end_date: '2026-08-05' }).id;
});

describe('importAirtrailFlights connection joining (#1535)', () => {
  it('imports a connection chain as ONE multi-leg reservation, detached from live sync', async () => {
    (listFlights as any).mockResolvedValue([legBruHel(), legHelJfk()]);

    // Deliberately unordered — the server orders the chain by departure itself.
    const result = await importAirtrailFlights(tripId, userId, ['101', '102'], undefined, [['102', '101']]);
    expect([...result.imported].sort()).toEqual(['101', '102']);
    expect(result.skipped).toEqual([]);

    const rows = tripReservations(tripId);
    expect(rows).toHaveLength(1);
    const r = rows[0];
    expect(r.type).toBe('flight');
    expect(r.external_source).toBe('airtrail');
    expect(r.external_id).toBe('101');
    expect(r.sync_enabled).toBe(0); // AirTrail has no multi-leg entity to round-trip to

    const meta = JSON.parse(r.metadata);
    expect(meta.airtrail_ids).toEqual(['101', '102']);
    expect(meta.legs).toHaveLength(2);
    expect(endpointsOf(r.id).map(e => [e.role, e.code])).toEqual([
      ['from', 'BRU'],
      ['stop', 'HEL'],
      ['to', 'JFK'],
    ]);

    // Each leg is filed on its own trip day so the day planner renders the
    // legs where they belong (both flights are on Aug 1 here).
    const day1 = db.prepare("SELECT id FROM days WHERE trip_id = ? AND date = '2026-08-01'").get(tripId) as { id: number };
    expect(meta.legs[0]).toMatchObject({ dep_day_id: day1.id, arr_day_id: day1.id });
    expect(meta.legs[1]).toMatchObject({ dep_day_id: day1.id, arr_day_id: day1.id });
  });

  it('resolves overnight-connection legs to their own days', async () => {
    const overnightLeg2 = {
      ...legHelJfk(),
      date: '2026-08-02',
      departure: '2026-08-02T07:00:00.000+00:00',
      arrival: '2026-08-02T15:00:00.000+00:00',
    };
    (listFlights as any).mockResolvedValue([legBruHel(), overnightLeg2]);

    await importAirtrailFlights(tripId, userId, ['101', '102'], undefined, [['101', '102']]);
    const [r] = tripReservations(tripId);
    const dayId = (d: string) => (db.prepare('SELECT id FROM days WHERE trip_id = ? AND date = ?').get(tripId, d) as { id: number }).id;
    const legs = JSON.parse(r.metadata).legs;
    expect(legs[0].dep_day_id).toBe(dayId('2026-08-01'));
    expect(legs[1].dep_day_id).toBe(dayId('2026-08-02'));
    expect(legs[1].arr_day_id).toBe(dayId('2026-08-02'));
  });

  it('refuses to join an out-and-back return as a connection', async () => {
    const returnFlight = {
      ...legBruHel(),
      id: 104,
      from: HEL,
      to: BRU,
      departure: '2026-08-01T18:00:00.000+00:00',
      arrival: '2026-08-01T21:30:00.000+00:00',
      flightNumber: 'AY1503',
    };
    (listFlights as any).mockResolvedValue([legBruHel(), returnFlight]);

    const result = await importAirtrailFlights(tripId, userId, ['101', '104'], undefined, [['101', '104']]);
    expect([...result.imported].sort()).toEqual(['101', '104']);
    expect(tripReservations(tripId)).toHaveLength(2); // two singles, no bogus BRU→HEL→BRU booking
  });

  it('skips every member of a joined booking on a later import attempt', async () => {
    (listFlights as any).mockResolvedValue([legBruHel(), legHelJfk()]);
    await importAirtrailFlights(tripId, userId, ['101', '102'], undefined, [['101', '102']]);

    // Only leg 2 carries no external_id of its own — it must still be recognized
    // via metadata.airtrail_ids.
    const again = await importAirtrailFlights(tripId, userId, ['102'], undefined);
    expect(again.imported).toEqual([]);
    expect(again.skipped).toEqual([{ flightId: '102', reason: 'already-imported' }]);
    expect(tripReservations(tripId)).toHaveLength(1);
  });

  it('recognizes a joined leg imported by another member via its per-leg signature', async () => {
    (listFlights as any).mockResolvedValue([legBruHel(), legHelJfk()]);
    await importAirtrailFlights(tripId, userId, ['101', '102'], undefined, [['101', '102']]);

    // The same physical HEL→JFK flight from another member's AirTrail carries a
    // different id there — the flight-number@date signature must catch it.
    const { user: other } = createUser(db);
    (listFlights as any).mockResolvedValue([{ ...legHelJfk(), id: 999 }]);
    const result = await importAirtrailFlights(tripId, other.id, ['999'], undefined);
    expect(result.imported).toEqual([]);
    expect(result.skipped).toEqual([{ flightId: '999', reason: 'already-in-trip', detail: expect.any(String) }]);
    expect(tripReservations(tripId)).toHaveLength(1);
  });

  it('falls back to individual imports when the requested join does not chain', async () => {
    (listFlights as any).mockResolvedValue([legBruHel(), legLhrJfk()]);

    const result = await importAirtrailFlights(tripId, userId, ['101', '103'], undefined, [['101', '103']]);
    expect([...result.imported].sort()).toEqual(['101', '103']);

    const rows = tripReservations(tripId);
    expect(rows).toHaveLength(2);
    for (const r of rows) {
      expect(r.sync_enabled).toBe(1); // plain imports keep live sync
      expect(endpointsOf(r.id)).toHaveLength(2);
    }
  });

  it('falls back to individual imports when the layover exceeds 24 h', async () => {
    const lateLeg2 = { ...legHelJfk(), departure: '2026-08-03T11:00:00.000+00:00', arrival: '2026-08-03T19:00:00.000+00:00', date: '2026-08-03' };
    (listFlights as any).mockResolvedValue([legBruHel(), lateLeg2]);

    const result = await importAirtrailFlights(tripId, userId, ['101', '102'], undefined, [['101', '102']]);
    expect([...result.imported].sort()).toEqual(['101', '102']);
    expect(tripReservations(tripId)).toHaveLength(2);
  });

  it('imports singles exactly as before when no join is requested', async () => {
    (listFlights as any).mockResolvedValue([legBruHel()]);

    const result = await importAirtrailFlights(tripId, userId, ['101'], undefined);
    expect(result.imported).toEqual(['101']);

    const [r] = tripReservations(tripId);
    expect(r.external_id).toBe('101');
    expect(r.sync_enabled).toBe(1);
    expect(r.external_hash).toBeTruthy();
    expect(JSON.parse(r.metadata).airtrail_ids).toBeUndefined();
  });
});
