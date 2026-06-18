import { describe, it, expect } from 'vitest';
import { buildSavePayload } from '../../../src/services/airtrail/airtrailSync';
import type { AirtrailAirport, AirtrailFlightRaw } from '../../../src/services/airtrail/airtrailClient';

function airport(over: Partial<AirtrailAirport> = {}): AirtrailAirport {
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

/**
 * An AirTrail flight as GET returns it, including the fields TREK doesn't model.
 * Typed as the raw object (known shape + arbitrary passthrough keys) because the
 * push spreads it wholesale rather than mapping each field — see buildSavePayload.
 */
function existingFlight(
  over: Partial<AirtrailFlightRaw> & Record<string, unknown> = {},
): AirtrailFlightRaw & Record<string, unknown> {
  return {
    id: 42,
    from: airport(),
    to: airport({ id: 2, icao: 'EGLL', iata: 'LHR', name: 'London Heathrow', tz: 'Europe/London' }),
    date: '2021-09-01',
    datePrecision: 'day',
    departure: '2021-09-01T23:00:00.000+00:00',
    arrival: '2021-09-02T07:00:00.000+00:00',
    airline: { id: 1, icao: 'BAW', iata: 'BA', name: 'British Airways' },
    flightNumber: 'BA178',
    aircraft: { id: 1, icao: 'B772', name: 'Boeing 777' },
    aircraftReg: 'G-VIIL',
    flightReason: 'leisure',
    note: 'window seat',
    seats: [{ userId: 'u1', guestName: null, seat: 'window', seatNumber: '12A', seatClass: 'economy' }],
    // AirTrail-owned detail TREK never surfaces — must survive a writeback (#1240).
    departureScheduled: '2021-09-01',
    departureScheduledTime: '18:45',
    arrivalScheduled: '2021-09-02',
    arrivalScheduledTime: '08:10',
    takeoffActual: '2021-09-01',
    takeoffActualTime: '19:12',
    landingActual: '2021-09-02',
    landingActualTime: '07:55',
    departureTerminal: '7',
    departureGate: 'B22',
    arrivalTerminal: '5',
    arrivalGate: 'A10',
    customFields: { confirmation: 'ABC123' },
    track: [{ lat: 40.6, lon: -73.7 }],
    ...over,
  };
}

/** A linked TREK reservation (the shape getReservationWithJoins returns). */
function reservation(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    external_id: '42',
    reservation_time: '2021-09-01T19:00',
    reservation_end_time: '2021-09-02T08:00',
    notes: 'window seat',
    metadata: JSON.stringify({ airline: 'BAW', flight_number: 'BA178', aircraft: 'B772', aircraft_reg: 'G-VIIL', flight_reason: 'leisure', seat: '12A' }),
    endpoints: [
      { role: 'from', code: 'JFK' },
      { role: 'to', code: 'LHR' },
    ],
    ...over,
  };
}

describe('airtrailSync.buildSavePayload', () => {
  it('round-trips the AirTrail-owned fields TREK does not model (issue #1240)', () => {
    const payload = buildSavePayload(reservation(), existingFlight());
    expect(payload).not.toBeNull();
    expect(payload).toMatchObject({
      takeoffActual: '2021-09-01',
      takeoffActualTime: '19:12',
      landingActual: '2021-09-02',
      landingActualTime: '07:55',
      departureTerminal: '7',
      departureGate: 'B22',
      arrivalTerminal: '5',
      arrivalGate: 'A10',
      customFields: { confirmation: 'ABC123' },
      track: [{ lat: 40.6, lon: -73.7 }],
    });
  });

  it('writes the TREK time to the SCHEDULED fields so it round-trips on the next pull', () => {
    // Import reads the scheduled time, so a TREK edit must be pushed back there
    // (mirroring the read), overwriting AirTrail's stored scheduled value.
    const payload = buildSavePayload(reservation(), existingFlight());
    expect(payload).toMatchObject({
      departureScheduled: '2021-09-01T00:00:00.000Z',
      departureScheduledTime: '19:00',
      arrivalScheduled: '2021-09-02T00:00:00.000Z',
      arrivalScheduledTime: '08:00',
    });
  });

  it('blanks the scheduled time when the TREK reservation has only a date', () => {
    const payload = buildSavePayload(reservation({ reservation_time: '2021-09-01', reservation_end_time: null }), existingFlight());
    // A date carrier with no HH:MM leaves AirTrail's scheduled instant unset.
    expect(payload?.departureScheduledTime).toBeNull();
    expect(payload?.arrivalScheduled).toBeNull();
    expect(payload?.arrivalScheduledTime).toBeNull();
  });

  it('preserves a non-day date precision instead of resetting it to day', () => {
    const payload = buildSavePayload(reservation(), existingFlight({ datePrecision: 'month' }));
    expect(payload?.datePrecision).toBe('month');
  });

  it('still applies the TREK-owned edits on top of the preserved fields', () => {
    const payload = buildSavePayload(
      reservation({
        reservation_time: '2021-09-01T20:30',
        notes: 'changed in TREK',
        metadata: JSON.stringify({ airline: 'BAW', flight_number: 'BA999', seat: '3C' }),
      }),
      existingFlight(),
    );
    expect(payload).toMatchObject({
      id: 42,
      from: 'JFK',
      to: 'LHR',
      departure: '2021-09-01',
      departureTime: '20:30',
      departureScheduled: '2021-09-01T00:00:00.000Z',
      departureScheduledTime: '20:30',
      flightNumber: 'BA999',
      note: 'changed in TREK',
    });
    // The user's seat number is pushed onto their own AirTrail seat.
    expect(payload?.seats[0].seatNumber).toBe('3C');
    // …without disturbing the preserved AirTrail detail.
    expect(payload?.departureTerminal).toBe('7');
  });

  it('preserves AirTrail aircraft/airline/reason when TREK metadata omits them (#1240)', () => {
    // A TREK edit can drop these AirTrail-owned fields from metadata; the writeback
    // must fall back to AirTrail's current values rather than nulling them.
    const payload = buildSavePayload(reservation({ metadata: JSON.stringify({}) }), existingFlight());
    expect(payload).toMatchObject({
      airline: 'BAW', // entityCode(existing.airline) — icao preferred
      aircraft: 'B772',
      aircraftReg: 'G-VIIL',
      flightReason: 'leisure',
      flightNumber: 'BA178',
      note: 'window seat',
    });
  });

  it('keeps the existing seat manifest rather than replacing it', () => {
    const payload = buildSavePayload(
      reservation({ metadata: JSON.stringify({}) }),
      existingFlight({
        seats: [
          { userId: 'u1', guestName: null, seat: 'window', seatNumber: '12A', seatClass: 'business' },
          { userId: null, guestName: 'Guest', seat: 'aisle', seatNumber: '12B', seatClass: 'business' },
        ],
      }),
    );
    expect(payload?.seats).toHaveLength(2);
    expect(payload?.seats[1]).toMatchObject({ guestName: 'Guest', seatNumber: '12B' });
  });

  it('returns null when an endpoint code is missing and no fallback exists', () => {
    const payload = buildSavePayload(reservation({ endpoints: [] }), existingFlight({ from: airport({ iata: null, icao: null }) }));
    expect(payload).toBeNull();
  });
});
