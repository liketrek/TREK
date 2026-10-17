import { describe, expect, it } from 'vitest';
import type { Reservation, ReservationEndpoint } from '../../types';
import { TRANSPORT_META, transportHop } from './transportHops';

function endpoint(over: Partial<ReservationEndpoint>): ReservationEndpoint {
  return {
    role: 'from',
    sequence: 0,
    name: 'X',
    code: null,
    lat: 0,
    lng: 0,
    timezone: null,
    local_time: null,
    local_date: null,
    ...over,
  } as ReservationEndpoint;
}

function booking(type: string, endpoints: ReservationEndpoint[], over: Partial<Reservation> = {}): Reservation {
  return { id: 7, type, status: 'confirmed', endpoints, ...over } as unknown as Reservation;
}

describe('transportHop', () => {
  it('skips a booking that is no transport', () => {
    const r = booking('hotel', [endpoint({ role: 'from' }), endpoint({ role: 'to', sequence: 1 })]);
    expect(transportHop(r, true)).toBeNull();
  });

  it('skips a transport with fewer than two places to connect', () => {
    expect(transportHop(booking('train', [endpoint({ role: 'from' })]), true)).toBeNull();
    expect(
      transportHop(booking('train', [endpoint({ role: 'from' }), endpoint({ role: 'check_in' as never })]), true)
    ).toBeNull();
  });

  it('orders from, stops and to by sequence and draws one straight leg each for ground transport', () => {
    const r = booking('train', [
      endpoint({ role: 'to', sequence: 2, code: 'HND', lat: 3, lng: 3 }),
      endpoint({ role: 'from', sequence: 0, code: 'FRA', lat: 1, lng: 1 }),
      endpoint({ role: 'stop', sequence: 1, code: 'BER', lat: 2, lng: 2 }),
    ]);
    const hop = transportHop(r, true)!;
    expect(hop.waypoints.map((w) => w.code)).toEqual(['FRA', 'BER', 'HND']);
    expect(hop.from.code).toBe('FRA');
    expect(hop.to.code).toBe('HND');
    expect(hop.arcs).toEqual([
      [
        [1, 1],
        [2, 2],
      ],
      [
        [2, 2],
        [3, 3],
      ],
    ]);
    expect(hop.mainLabel).toBe('FRA → BER → HND');
    expect(hop.res).toBe(r);
    expect(hop.type).toBe('train');
  });

  it('falls back to the two end codes when a stop has none, and to no label without them', () => {
    const withEnds = booking('bus', [
      endpoint({ role: 'from', code: 'A' }),
      endpoint({ role: 'stop', sequence: 1 }),
      endpoint({ role: 'to', sequence: 2, code: 'B' }),
    ]);
    expect(transportHop(withEnds, true)!.mainLabel).toBe('A → B');
    const bare = booking('bus', [endpoint({ role: 'from' }), endpoint({ role: 'to', sequence: 1 })]);
    expect(transportHop(bare, true)!.mainLabel).toBeNull();
  });

  it('puts duration and great-circle distance in the sub label', () => {
    const r = booking('car', [
      endpoint({ role: 'from', lat: 0, lng: 0, local_date: '2026-05-01', local_time: '08:00' }),
      endpoint({ role: 'to', sequence: 1, lat: 0, lng: 1, local_date: '2026-05-01', local_time: '09:30' }),
    ]);
    expect(transportHop(r, true)!.subLabel).toBe('1h 30m · 111 km');
  });

  it('copies a flight arc across the antimeridian only when asked to wrap', () => {
    const r = booking('flight', [
      endpoint({ role: 'from', lat: 35, lng: 170 }),
      endpoint({ role: 'to', sequence: 1, lat: 40, lng: -170 }),
    ]);
    expect(transportHop(r, true)!.arcs).toHaveLength(2);
    expect(transportHop(r, false)!.arcs).toHaveLength(1);
    expect(transportHop(r, false)!.arcs[0].length).toBeGreaterThan(2);
  });

  it('draws ferries and cruises as arcs but a cable car as a straight line', () => {
    expect(TRANSPORT_META.ferry.geodesic).toBe(true);
    expect(TRANSPORT_META.cruise.geodesic).toBe(true);
    expect(TRANSPORT_META.cable_car.geodesic).toBe(false);
  });
});

describe('transportHop duration', () => {
  // Both ends sit on the same spot, so the sub label is the duration plus "0 km".
  const at = (date: string | null, time: string | null, timezone: string | null = null) =>
    endpoint({ local_date: date, local_time: time, timezone });
  const subLabel = (
    from: ReservationEndpoint,
    to: ReservationEndpoint,
    start: string | null = null,
    end: string | null = null
  ) =>
    transportHop(
      booking(
        'train',
        [
          { ...from, role: 'from' },
          { ...to, role: 'to', sequence: 1 },
        ],
        {
          reservation_time: start,
          reservation_end_time: end,
        }
      ),
      true
    )!.subLabel;

  it('reads each end in its own time zone', () => {
    expect(subLabel(at('2026-05-01', '10:00', 'Europe/Berlin'), at('2026-05-01', '10:00', 'Europe/London'))).toBe(
      '1h 0m · 0 km'
    );
  });

  it('rolls an arrival before the departure over to the next day', () => {
    expect(subLabel(at('2026-05-01', '23:30'), at('2026-05-01', '00:15'))).toBe('45m · 0 km');
  });

  it('borrows the date of the other end for a bare time from the booking', () => {
    expect(subLabel(at(null, null), at('2026-05-01', '12:00'), '11:00')).toBe('1h 0m · 0 km');
  });

  it('leaves the duration out for missing, malformed or implausible times', () => {
    expect(subLabel(at(null, null), at(null, null))).toBe('0 km');
    expect(subLabel(at(null, null), at(null, null), '10:00', '11:00')).toBe('0 km');
    expect(subLabel(at('2026-05-01', '10', 'Europe/Berlin'), at('2026-05-01', '11:00', 'Europe/Berlin'))).toBe('0 km');
    expect(subLabel(at('2026-05-01', '10:00'), at('2026-05-04', '10:00'))).toBe('0 km');
  });
});
