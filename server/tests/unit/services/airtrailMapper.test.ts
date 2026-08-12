import { describe, it, expect } from 'vitest';
import { canonicalHash, mapFlightToReservation, mapFlightsToMultiLegReservation, normalizeFlight } from '../../../src/services/airtrail/airtrailMapper';
import type { AirtrailFlightRaw } from '../../../src/services/airtrail/airtrailClient';

function airport(over: Partial<AirtrailFlightRaw['from']> = {}): NonNullable<AirtrailFlightRaw['from']> {
  return {
    id: 1,
    icao: 'KJFK',
    iata: 'JFK',
    name: 'John F. Kennedy Intl.',
    lat: 40.6413,
    lon: -73.7781,
    tz: 'America/New_York',
    country: 'US',
    ...over,
  };
}

function flight(over: Partial<AirtrailFlightRaw> = {}): AirtrailFlightRaw {
  return {
    id: 42,
    from: airport(),
    to: airport({ id: 2, icao: 'EGLL', iata: 'LHR', name: 'London Heathrow', lat: 51.4706, lon: -0.4619, tz: 'Europe/London' }),
    date: '2021-09-01',
    datePrecision: 'day',
    // Actual times (delayed) — TREK must IGNORE these and read the scheduled times.
    departure: '2021-09-01T23:42:00.000+00:00',
    arrival: '2021-09-02T07:42:00.000+00:00',
    departureScheduled: '2021-09-01T23:00:00.000+00:00', // 19:00 local at JFK (EDT, UTC-4)
    arrivalScheduled: '2021-09-02T07:00:00.000+00:00', // 08:00 local at LHR (BST, UTC+1)
    airline: { id: 1, icao: 'BAW', iata: 'BA', name: 'British Airways' },
    flightNumber: 'BA178',
    aircraft: { id: 1, icao: 'B772', name: 'Boeing 777' },
    aircraftReg: 'G-VIIL',
    flightReason: 'leisure',
    note: 'window seat',
    seats: [{ userId: 'u1', guestName: null, seat: 'window', seatNumber: '12A', seatClass: 'economy' }],
    ...over,
  };
}

describe('airtrailMapper.normalizeFlight', () => {
  it('prefers IATA codes and exposes the picker fields', () => {
    const n = normalizeFlight(flight());
    expect(n).toMatchObject({
      id: '42',
      fromCode: 'JFK',
      toCode: 'LHR',
      date: '2021-09-01',
      airline: 'British Airways',
      flightNumber: 'BA178',
      seatClass: 'economy',
    });
    // The picker preview prefers the scheduled times over the actual ones.
    expect(n.departure).toBe('2021-09-01T23:00:00.000+00:00');
    expect(n.arrival).toBe('2021-09-02T07:00:00.000+00:00');
  });

  it('#1336 surfaces the primary departure/arrival when there is no scheduled time', () => {
    const n = normalizeFlight(flight({ departureScheduled: null, arrivalScheduled: null }));
    expect(n.departure).toBe('2021-09-01T23:42:00.000+00:00');
    expect(n.arrival).toBe('2021-09-02T07:42:00.000+00:00');
  });

  it('falls back to ICAO when IATA is missing and tolerates null airports', () => {
    const n = normalizeFlight(flight({ from: airport({ iata: null }), to: null }));
    expect(n.fromCode).toBe('KJFK');
    expect(n.toCode).toBeNull();
    expect(n.toName).toBeNull();
  });
});

describe('airtrailMapper.mapFlightToReservation', () => {
  it('composes airport-local times from the SCHEDULED instant + airport tz', () => {
    const m = mapFlightToReservation(flight());
    // Scheduled 23:00 UTC at JFK in September is 19:00 EDT; date stays the AirTrail local date.
    // (The actual times in the fixture are 23:42/07:42 — proving they are ignored.)
    expect(m.reservation_time).toBe('2021-09-01T19:00');
    // Scheduled 07:00 UTC at LHR in September is 08:00 BST.
    expect(m.reservation_end_time).toBe('2021-09-02T08:00');
  });

  it('leaves the clock blank (date only) when the flight has no time at all', () => {
    const m = mapFlightToReservation(flight({ departure: null, arrival: null, departureScheduled: null, arrivalScheduled: null }));
    // Date is preserved from the AirTrail canonical date; no fabricated 00:00.
    expect(m.reservation_time).toBe('2021-09-01');
    expect(m.reservation_end_time).toBeNull();
    expect(m.endpoints.find(e => e.role === 'from')?.local_time).toBeNull();
    expect(m.endpoints.find(e => e.role === 'to')?.local_time).toBeNull();
  });

  it('#1336 falls back to the primary departure/arrival when AirTrail has no scheduled times', () => {
    // Manually-entered AirTrail flights set only departure/arrival; *Scheduled stays null.
    const m = mapFlightToReservation(flight({ departureScheduled: null, arrivalScheduled: null }));
    // departure 23:42 UTC at JFK (EDT) = 19:42 local; arrival 07:42 UTC at LHR (BST) = 08:42.
    expect(m.reservation_time).toBe('2021-09-01T19:42');
    expect(m.reservation_end_time).toBe('2021-09-02T08:42');
    expect(m.endpoints.find(e => e.role === 'from')?.local_time).toBe('19:42');
    expect(m.endpoints.find(e => e.role === 'to')?.local_time).toBe('08:42');
    expect(m.endpoints.find(e => e.role === 'to')?.local_date).toBe('2021-09-02');
  });

  it('builds two endpoints with codes, coords and timezones', () => {
    const m = mapFlightToReservation(flight());
    expect(m.endpoints).toHaveLength(2);
    expect(m.endpoints[0]).toMatchObject({ role: 'from', code: 'JFK', lat: 40.6413, timezone: 'America/New_York', local_date: '2021-09-01', local_time: '19:00' });
    expect(m.endpoints[1]).toMatchObject({ role: 'to', code: 'LHR', timezone: 'Europe/London', local_time: '08:00' });
    expect(m.needs_review).toBe(0);
  });

  it('titles from the flight number, else the route', () => {
    expect(mapFlightToReservation(flight()).title).toBe('BA178');
    expect(mapFlightToReservation(flight({ airline: null, flightNumber: null })).title).toBe('JFK → LHR');
  });

  it('carries flight metadata', () => {
    const m = mapFlightToReservation(flight());
    // #1334: display the airline name, keep the code in airline_code for the writeback.
    expect(m.metadata).toMatchObject({ airline: 'British Airways', airline_code: 'BAW', flight_number: 'BA178', aircraft: 'B772', aircraft_reg: 'G-VIIL', flight_reason: 'leisure', seat: '12A' });
    expect(m.type).toBe('flight');
    expect(m.status).toBe('confirmed');
    expect(m.notes).toBe('window seat');
  });

  it('#1334 falls back to the airline code when AirTrail provides no name', () => {
    const a = { id: 9, icao: 'EWG', iata: 'EW' };
    expect(normalizeFlight(flight({ airline: a })).airline).toBe('EWG');
    expect(mapFlightToReservation(flight({ airline: a })).metadata).toMatchObject({ airline: 'EWG', airline_code: 'EWG' });
  });

  it('uses only the seat number for the seat, not the cabin class (#1246)', () => {
    // AirTrail often has a class but no seat number until check-in; the class
    // must not leak into the seat field.
    const m = mapFlightToReservation(
      flight({ seats: [{ userId: 'u1', guestName: null, seat: null, seatNumber: null, seatClass: 'economy' }] }),
    );
    expect(m.metadata).not.toHaveProperty('seat');
  });

  it('keeps the seat number when present even with no class', () => {
    const m = mapFlightToReservation(
      flight({ seats: [{ userId: 'u1', guestName: null, seat: null, seatNumber: '3F', seatClass: null }] }),
    );
    expect(m.metadata).toMatchObject({ seat: '3F' });
  });

  it('omits the seat for a flight with no seats', () => {
    expect(mapFlightToReservation(flight({ seats: [] })).metadata).not.toHaveProperty('seat');
  });

  it('flags needs_review for a non-day date precision', () => {
    expect(mapFlightToReservation(flight({ datePrecision: 'month' })).needs_review).toBe(1);
  });

  it('flags needs_review and drops the endpoint when an airport has no coordinates', () => {
    const m = mapFlightToReservation(flight({ from: airport({ lat: null, lon: null }) }));
    expect(m.needs_review).toBe(1);
    expect(m.endpoints.find(e => e.role === 'from')).toBeUndefined();
    expect(m.endpoints.find(e => e.role === 'to')).toBeDefined();
  });

  it('leaves the end time null for a partial flight with no arrival time at all', () => {
    const m = mapFlightToReservation(flight({ arrival: null, arrivalScheduled: null }));
    expect(m.reservation_end_time).toBeNull();
    expect(m.reservation_time).toBe('2021-09-01T19:00');
  });
});

describe('airtrailMapper.canonicalHash', () => {
  it('is stable for the same flight', () => {
    expect(canonicalHash(flight())).toBe(canonicalHash(flight()));
  });

  it('changes when a meaningful field changes', () => {
    expect(canonicalHash(flight())).not.toBe(canonicalHash(flight({ flightNumber: 'BA179' })));
    expect(canonicalHash(flight())).not.toBe(canonicalHash(flight({ note: 'aisle seat' })));
  });

  it('tracks the scheduled time and ignores actual-time changes', () => {
    // A scheduled-time change is what TREK imports, so it must re-sync...
    expect(canonicalHash(flight())).not.toBe(
      canonicalHash(flight({ departureScheduled: '2021-09-01T22:00:00.000+00:00' })),
    );
    // ...but a change to the actual time alone must not (TREK shows the scheduled one).
    expect(canonicalHash(flight())).toBe(
      canonicalHash(flight({ departure: '2021-09-01T20:00:00.000+00:00', arrival: '2021-09-02T05:00:00.000+00:00' })),
    );
  });

  it('#1336 tracks the primary departure when there is no scheduled time', () => {
    // With no scheduled time, departure IS what TREK imports, so a change must re-sync.
    const manual = flight({ departureScheduled: null, arrivalScheduled: null });
    expect(canonicalHash(manual)).not.toBe(
      canonicalHash(flight({ departureScheduled: null, arrivalScheduled: null, departure: '2021-09-01T20:00:00.000+00:00' })),
    );
  });

  it('is independent of seat ordering', () => {
    const a = flight({
      seats: [
        { userId: 'u1', guestName: null, seat: null, seatNumber: '1A', seatClass: 'economy' },
        { userId: 'u2', guestName: null, seat: null, seatNumber: '1B', seatClass: 'economy' },
      ],
    });
    const b = flight({
      seats: [
        { userId: 'u2', guestName: null, seat: null, seatNumber: '1B', seatClass: 'economy' },
        { userId: 'u1', guestName: null, seat: null, seatNumber: '1A', seatClass: 'economy' },
      ],
    });
    expect(canonicalHash(a)).toBe(canonicalHash(b));
  });
});

describe('airtrailMapper.mapFlightsToMultiLegReservation (#1535)', () => {
  const BRU = () => airport({ id: 10, icao: 'EBBR', iata: 'BRU', name: 'Brussels', lat: 50.9014, lon: 4.4844, tz: 'Europe/Brussels' });
  const HEL = (over: Partial<AirtrailFlightRaw['from']> = {}) =>
    airport({ id: 11, icao: 'EFHK', iata: 'HEL', name: 'Helsinki-Vantaa', lat: 60.3172, lon: 24.9633, tz: 'Europe/Helsinki', ...over });

  const leg1 = (over: Partial<AirtrailFlightRaw> = {}) =>
    flight({
      id: 101,
      from: BRU(),
      to: HEL(),
      departure: null,
      arrival: null,
      departureScheduled: '2021-09-01T06:00:00.000+00:00', // 08:00 CEST in Brussels
      arrivalScheduled: '2021-09-01T09:30:00.000+00:00', // 12:30 EEST in Helsinki
      airline: { id: 2, icao: 'FIN', iata: 'AY', name: 'Finnair' },
      flightNumber: 'AY1502',
      note: 'first hop',
      seats: [{ userId: 'u1', guestName: null, seat: 'window', seatNumber: '12A', seatClass: 'economy' }],
      ...over,
    });
  const leg2 = (over: Partial<AirtrailFlightRaw> = {}) =>
    flight({
      id: 102,
      from: HEL(),
      to: airport(), // JFK
      departure: null,
      arrival: null,
      departureScheduled: '2021-09-01T11:00:00.000+00:00', // 14:00 EEST in Helsinki
      arrivalScheduled: '2021-09-01T19:00:00.000+00:00', // 15:00 EDT at JFK
      airline: { id: 2, icao: 'FIN', iata: 'AY', name: 'Finnair' },
      flightNumber: 'AY15',
      note: null,
      seats: [{ userId: 'u1', guestName: null, seat: 'aisle', seatNumber: '22C', seatClass: 'economy' }],
      ...over,
    });

  it('builds one from → stop → to chain, the stop carrying the onward departure', () => {
    const m = mapFlightsToMultiLegReservation([leg1(), leg2()]);
    expect(m.endpoints.map(e => [e.role, e.code, e.sequence])).toEqual([
      ['from', 'BRU', 0],
      ['stop', 'HEL', 1],
      ['to', 'JFK', 2],
    ]);
    // The connection endpoint stores the departure of the leg LEAVING it, like
    // the manual multi-leg form; only the final endpoint keeps its arrival.
    expect(m.endpoints[1].local_time).toBe('14:00');
    expect(m.endpoints[1].local_date).toBe('2021-09-01');
    expect(m.endpoints[2].local_time).toBe('15:00');
    expect(m.reservation_time).toBe('2021-09-01T08:00');
    expect(m.reservation_end_time).toBe('2021-09-01T15:00');
    expect(m.title).toBe('BRU → HEL → JFK');
  });

  it('stores per-leg details in metadata.legs and mirrors the first/last leg flat', () => {
    const m = mapFlightsToMultiLegReservation([leg1(), leg2()]);
    expect(m.metadata.legs).toEqual([
      { from: 'BRU', to: 'HEL', airline: 'Finnair', flight_number: 'AY1502', dep_day_id: null, dep_time: '08:00', arr_day_id: null, arr_time: '12:30', seat: '12A' },
      { from: 'HEL', to: 'JFK', airline: 'Finnair', flight_number: 'AY15', dep_day_id: null, dep_time: '14:00', arr_day_id: null, arr_time: '15:00', seat: '22C' },
    ]);
    expect(m.metadata).toMatchObject({
      airline: 'Finnair',
      airline_code: 'FIN',
      flight_number: 'AY1502',
      departure_airport: 'BRU',
      arrival_airport: 'JFK',
      seat: '12A',
      airtrail_ids: ['101', '102'],
    });
    expect(m.notes).toBe('first hop');
  });

  it('flags needs_review but keeps the rest of the chain when the connection airport has no coordinates', () => {
    const m = mapFlightsToMultiLegReservation([leg1({ to: HEL({ lat: null, lon: null }) }), leg2({ from: HEL({ lat: null, lon: null }) })]);
    expect(m.needs_review).toBe(1);
    expect(m.endpoints.map(e => [e.role, e.code])).toEqual([
      ['from', 'BRU'],
      ['to', 'JFK'],
    ]);
  });

  it('files each leg on its own day via the resolver — an overnight connection must not inherit day 1', () => {
    const overnight = leg2({
      date: '2021-09-02',
      departureScheduled: '2021-09-02T06:00:00.000+00:00', // 09:00 EEST next morning
      arrivalScheduled: '2021-09-02T14:00:00.000+00:00', // 10:00 EDT
    });
    const dayIds: Record<string, number> = { '2021-09-01': 11, '2021-09-02': 12 };
    const m = mapFlightsToMultiLegReservation([leg1(), overnight], d => (d ? (dayIds[d] ?? null) : null));
    const legs = m.metadata.legs as any[];
    expect(legs[0]).toMatchObject({ dep_day_id: 11, arr_day_id: 11 });
    expect(legs[1]).toMatchObject({ dep_day_id: 12, arr_day_id: 12 });
  });

  it('falls back to the single-flight mapping for a one-flight chain', () => {
    expect(mapFlightsToMultiLegReservation([flight()])).toEqual(mapFlightToReservation(flight()));
  });
});
