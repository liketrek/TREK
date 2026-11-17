/**
 * The legs of a flight booking with their schedule in UTC, read the way the
 * client's flightLegs.ts reads them: a single leg from the endpoints and the
 * flat metadata, a chain from `metadata.legs` with the days it names, and
 * the local clocks turned into instants with each airport's own zone.
 */
import {
  legsOfBooking,
  localToUtc,
  type AirportFacts,
  type FlightBookingRow,
  type FlightEndpointRow,
} from '../../../../src/nest/flight-live/flight-live.schedule';

import { describe, expect, it } from 'vitest';

const AIRLINES = new Map([
  ['LH', 'DLH'],
  ['NH', 'ANA'],
]);

const AIRPORTS: Record<string, AirportFacts> = {
  FRA: { name: 'Frankfurt am Main Airport', city: 'Frankfurt', lat: 50.0333, lng: 8.5706, tz: 'Europe/Berlin' },
  MUC: { name: 'Munich Airport', city: 'Munich', lat: 48.3538, lng: 11.7861, tz: 'Europe/Berlin' },
  HND: { name: 'Tokyo Haneda Airport', city: 'Tokyo', lat: 35.5523, lng: 139.7798, tz: 'Asia/Tokyo' },
  JFK: {
    name: 'John F Kennedy International Airport',
    city: 'New York',
    lat: 40.6398,
    lng: -73.7789,
    tz: 'America/New_York',
  },
};
const lookup = (code: string) => AIRPORTS[code] ?? null;

function booking(overrides: Partial<FlightBookingRow> = {}): FlightBookingRow {
  return {
    id: 10,
    trip_id: 3,
    metadata: {},
    day_id: null,
    end_day_id: null,
    reservation_time: null,
    reservation_end_time: null,
    ...overrides,
  };
}

function endpoint(overrides: Partial<FlightEndpointRow>): FlightEndpointRow {
  return {
    reservation_id: 10,
    role: 'from',
    sequence: 0,
    name: 'Frankfurt (FRA)',
    code: 'FRA',
    lat: 50.0333,
    lng: 8.5706,
    timezone: 'Europe/Berlin',
    local_date: null,
    local_time: null,
    ...overrides,
  };
}

const NO_DAYS = new Map<number, string>();

describe('localToUtc', () => {
  it('FLSCH-001: reads a local clock in its zone, summer time included, and needs all three parts', () => {
    expect(localToUtc('2026-07-01', '10:30', 'Europe/Berlin')).toBe(Date.parse('2026-07-01T08:30:00Z'));
    expect(localToUtc('2026-01-15', '10:30', 'Europe/Berlin')).toBe(Date.parse('2026-01-15T09:30:00Z'));
    expect(localToUtc('2026-07-01', '10:30', 'Asia/Tokyo')).toBe(Date.parse('2026-07-01T01:30:00Z'));
    expect(localToUtc(null, '10:30', 'Europe/Berlin')).toBeNull();
    expect(localToUtc('2026-07-01', null, 'Europe/Berlin')).toBeNull();
    expect(localToUtc('2026-07-01', '10:30', null)).toBeNull();
    expect(localToUtc('2026-07-01', '10:30', 'Not/AZone')).toBeNull();
  });
});

describe('legsOfBooking', () => {
  it('FLSCH-002: a single leg from its endpoints, with each end in its own zone', () => {
    const legs = legsOfBooking(
      booking({ metadata: { flight_number: 'LH 716', airline: 'Lufthansa' } }),
      [
        endpoint({ local_date: '2026-07-01', local_time: '13:40' }),
        endpoint({
          role: 'to',
          sequence: 1,
          name: 'Tokyo Haneda (HND)',
          code: 'HND',
          lat: 35.5523,
          lng: 139.7798,
          timezone: 'Asia/Tokyo',
          local_date: '2026-07-02',
          local_time: '08:15',
        }),
      ],
      NO_DAYS,
      lookup,
      AIRLINES,
    );
    expect(legs).toEqual([
      {
        reservation_id: 10,
        trip_id: 3,
        leg_index: 0,
        callsign: 'DLH716',
        flight_number: 'LH 716',
        service_date: '2026-07-01',
        origin: { code: 'FRA', name: 'Frankfurt', lat: 50.0333, lng: 8.5706, timezone: 'Europe/Berlin' },
        destination: { code: 'HND', name: 'Tokyo Haneda', lat: 35.5523, lng: 139.7798, timezone: 'Asia/Tokyo' },
        scheduled_departure: Date.parse('2026-07-01T11:40:00Z'),
        scheduled_arrival: Date.parse('2026-07-01T23:15:00Z'),
      },
    ]);
  });

  it('FLSCH-003: a chain of legs takes its days and times from metadata.legs and its airports from the dataset', () => {
    const days = new Map([
      [1, '2026-07-01'],
      [2, '2026-07-02'],
    ]);
    const legs = legsOfBooking(
      booking({
        metadata: {
          legs: [
            {
              from: 'MUC',
              to: 'FRA',
              flight_number: 'LH 101',
              dep_day_id: 1,
              dep_time: '07:00',
              arr_day_id: 1,
              arr_time: '08:00',
            },
            {
              from: 'FRA',
              to: 'HND',
              airline: 'NH',
              flight_number: '204',
              dep_day_id: 1,
              dep_time: '21:00',
              arr_time: '16:00',
            },
          ],
        },
      }),
      [],
      days,
      lookup,
      AIRLINES,
    );
    expect(legs.map((l) => [l.leg_index, l.callsign, l.service_date, l.origin.code, l.destination.code])).toEqual([
      [0, 'DLH101', '2026-07-01', 'MUC', 'FRA'],
      [1, 'ANA204', '2026-07-01', 'FRA', 'HND'],
    ]);
    expect(legs[0].origin).toEqual({
      code: 'MUC',
      name: 'Munich Airport',
      lat: 48.3538,
      lng: 11.7861,
      timezone: 'Europe/Berlin',
    });
    expect(legs[0].scheduled_departure).toBe(Date.parse('2026-07-01T05:00:00Z'));
    expect(legs[0].scheduled_arrival).toBe(Date.parse('2026-07-01T06:00:00Z'));
    // No arrival day: 16:00 Tokyo on the departure day is before 21:00 Frankfurt, so it lands the next day.
    expect(legs[1].scheduled_departure).toBe(Date.parse('2026-07-01T19:00:00Z'));
    expect(legs[1].scheduled_arrival).toBe(Date.parse('2026-07-02T07:00:00Z'));
  });

  it('FLSCH-004: a leg without a mappable number, a known airport or a departure day is left out', () => {
    const days = new Map([[1, '2026-07-01']]);
    const legs = legsOfBooking(
      booking({
        metadata: {
          legs: [
            { from: 'FRA', to: 'HND', flight_number: 'Lufthansa', dep_day_id: 1 },
            { from: 'FRA', to: 'XYZ', flight_number: 'LH 1', dep_day_id: 1 },
            { from: 'FRA', to: 'HND', flight_number: 'LH 2', dep_day_id: 99 },
            { from: 'FRA', to: 'HND', flight_number: 'LH 3', dep_day_id: 1 },
            'not a leg',
          ],
        },
      }),
      [],
      days,
      lookup,
      AIRLINES,
    );
    expect(legs.map((l) => [l.leg_index, l.callsign, l.scheduled_departure, l.scheduled_arrival])).toEqual([
      [3, 'DLH3', null, null],
    ]);
  });

  it('FLSCH-005: the flat metadata and the booking times stand in for missing endpoints', () => {
    const legs = legsOfBooking(
      booking({
        metadata: { departure_airport: 'JFK', arrival_airport: 'FRA', flight_number: 'LH0401' },
        reservation_time: '2026-03-10T17:30',
        reservation_end_time: '2026-03-11T07:45',
      }),
      [],
      NO_DAYS,
      lookup,
      AIRLINES,
    );
    expect(legs).toHaveLength(1);
    expect(legs[0].callsign).toBe('DLH401');
    expect(legs[0].service_date).toBe('2026-03-10');
    expect(legs[0].origin.name).toBe('John F Kennedy International Airport');
    expect(legs[0].scheduled_departure).toBe(Date.parse('2026-03-10T21:30:00Z'));
    expect(legs[0].scheduled_arrival).toBe(Date.parse('2026-03-11T06:45:00Z'));
  });

  it('FLSCH-006: a booking day stands in for an endpoint without a date, and an arrival before departure on its own date is dropped', () => {
    const days = new Map([
      [5, '2026-07-01'],
      [6, '2026-07-01'],
    ]);
    const legs = legsOfBooking(
      booking({ metadata: { flight_number: 'LH 716' }, day_id: 5, end_day_id: 6 }),
      [
        endpoint({ local_time: '13:40:00' }),
        endpoint({
          role: 'to',
          sequence: 1,
          code: 'HND',
          name: 'Haneda',
          lat: 35.55,
          lng: 139.78,
          timezone: null,
          local_time: '08:15',
        }),
      ],
      days,
      lookup,
      AIRLINES,
    );
    expect(legs[0].service_date).toBe('2026-07-01');
    expect(legs[0].destination.timezone).toBe('Asia/Tokyo');
    expect(legs[0].scheduled_departure).toBe(Date.parse('2026-07-01T11:40:00Z'));
    expect(legs[0].scheduled_arrival).toBeNull();
  });

  it('FLSCH-007: a booking with no airports at all has no legs', () => {
    expect(legsOfBooking(booking({ metadata: { flight_number: 'LH 1' } }), [], NO_DAYS, lookup, AIRLINES)).toEqual([]);
  });
});
