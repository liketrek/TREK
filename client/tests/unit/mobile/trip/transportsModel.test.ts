import { describe, it, expect } from 'vitest';
import {
  TRANSPORT_TYPE_COLOR,
  groupTransports,
  orderedEndpoints,
  parseTransportMeta,
} from '../../../../src/mobile/screens/trip/tabs/transportsModel';
import { buildDay, buildReservation } from '../../../helpers/factories';
import type { Day, Reservation } from '../../../../src/types';

// FE-MOB-TRPM-001 to FE-MOB-TRPM-014

function res(overrides: Partial<Reservation> = {}): Reservation {
  return buildReservation({ type: 'flight', status: 'confirmed', ...overrides });
}

describe('transportsModel — metadata', () => {
  it('FE-MOB-TRPM-001: exposes a chip colour per transport type', () => {
    expect(TRANSPORT_TYPE_COLOR.flight).toBe('#3b82f6');
    expect(TRANSPORT_TYPE_COLOR.transit).toBe('#7c3aed');
    expect(TRANSPORT_TYPE_COLOR.transport_other).toBe(TRANSPORT_TYPE_COLOR.car);
    expect(TRANSPORT_TYPE_COLOR.nope).toBeUndefined();
  });

  it('FE-MOB-TRPM-002: parses a JSON metadata string', () => {
    const meta = parseTransportMeta(
      res({ metadata: '{"airline":"LH","flight_number":"LH123","seat":"14A"}' }),
    );
    expect(meta).toEqual({ airline: 'LH', flight_number: 'LH123', seat: '14A' });
  });

  it('FE-MOB-TRPM-003: passes an already-parsed metadata object through', () => {
    const parsed = { transit: { legs: [{ mode: 'subway', line: 'U2' }] } };
    expect(parseTransportMeta({ ...res(), metadata: parsed } as unknown as Reservation)).toEqual(parsed);
  });

  it('FE-MOB-TRPM-004: returns an empty object for missing or broken metadata', () => {
    expect(parseTransportMeta(res({ metadata: null }))).toEqual({});
    expect(parseTransportMeta(res({ metadata: '' }))).toEqual({});
    expect(parseTransportMeta(res({ metadata: '{not json' }))).toEqual({});
  });

  it('FE-MOB-TRPM-005: orderedEndpoints sorts waypoints by sequence without mutating', () => {
    const endpoints = [
      { role: 'to' as const, sequence: 2, name: 'Rome', code: null, lat: 0, lng: 0, timezone: null, local_time: null, local_date: null },
      { role: 'from' as const, sequence: 0, name: 'Berlin', code: null, lat: 0, lng: 0, timezone: null, local_time: null, local_date: null },
      { role: 'stop' as const, sequence: 1, name: 'Munich', code: null, lat: 0, lng: 0, timezone: null, local_time: null, local_date: null },
    ];
    const r = res({ endpoints });

    expect(orderedEndpoints(r).map(e => e.name)).toEqual(['Berlin', 'Munich', 'Rome']);
    expect(endpoints.map(e => e.name)).toEqual(['Rome', 'Berlin', 'Munich']);
    expect(orderedEndpoints(res({ endpoints: undefined }))).toEqual([]);
  });

  it('FE-MOB-TRPM-006: orderedEndpoints treats a missing sequence as zero', () => {
    const rome = { role: 'to' as const, sequence: 1, name: 'Rome', code: null, lat: 0, lng: 0, timezone: null, local_time: null, local_date: null };
    const berlin = { role: 'from' as const, name: 'Berlin', code: null, lat: 0, lng: 0, timezone: null, local_time: null, local_date: null };
    const pair = (list: unknown[]) =>
      orderedEndpoints(res({ endpoints: list as unknown as Reservation['endpoints'] })).map(e => e.name);

    expect(pair([rome, berlin])).toEqual(['Berlin', 'Rome']);
    expect(pair([berlin, rome])).toEqual(['Berlin', 'Rome']);
  });
});

describe('transportsModel — groupTransports', () => {
  const days: Day[] = [
    buildDay({ id: 100, date: '2026-07-01' }),
    buildDay({ id: 101, date: '2026-07-02' }),
    buildDay({ id: 102, date: '2026-07-03' }),
  ];

  it('FE-MOB-TRPM-007: sorts by reservation date and time', () => {
    const late = res({ id: 1, reservation_time: '2026-07-02T18:00' });
    const early = res({ id: 2, reservation_time: '2026-07-02T06:30' });
    const first = res({ id: 3, reservation_time: '2026-07-01T23:00' });

    expect(groupTransports([late, early, first], days).confirmed.map(r => r.id)).toEqual([3, 2, 1]);
  });

  it('FE-MOB-TRPM-008: falls back to the linked day date, treating a date-only value as midnight', () => {
    const viaDay = res({ id: 1, reservation_time: null, day_id: 100 });
    const dateOnly = res({ id: 2, reservation_time: '2026-07-01' });
    const withTime = res({ id: 3, reservation_time: '2026-07-01T08:00' });

    // both undated-but-day-linked entries key on 00:00, so created_at breaks the tie
    const sorted = groupTransports(
      [
        withTime,
        { ...dateOnly, created_at: '2025-01-02T00:00:00.000Z' },
        { ...viaDay, created_at: '2025-01-01T00:00:00.000Z' },
      ],
      days,
    ).confirmed;
    expect(sorted.map(r => r.id)).toEqual([1, 2, 3]);
  });

  it('FE-MOB-TRPM-009: a hotel keys on its accommodation start day, not its day_id', () => {
    const hotel = res({
      id: 1,
      type: 'hotel',
      reservation_time: null,
      day_id: 102,
      accommodation_start_day_id: 100,
    });
    const flight = res({ id: 2, reservation_time: '2026-07-02T09:00' });

    expect(groupTransports([flight, hotel], days).confirmed.map(r => r.id)).toEqual([1, 2]);
  });

  it('FE-MOB-TRPM-010: a hotel without an accommodation start day still uses day_id', () => {
    const hotel = res({ id: 1, type: 'hotel', reservation_time: null, day_id: 102 });
    const flight = res({ id: 2, reservation_time: '2026-07-02T09:00' });

    expect(groupTransports([flight, hotel], days).confirmed.map(r => r.id)).toEqual([2, 1]);
  });

  it('FE-MOB-TRPM-011: undated entries and entries on unknown days sink to the bottom', () => {
    const dated = res({ id: 1, reservation_time: '2026-07-02T09:00' });
    const undated = res({ id: 2, reservation_time: null, day_id: null, created_at: '2025-01-01T00:00:00.000Z' });
    const unknownDay = res({ id: 3, reservation_time: null, day_id: 999, created_at: '2025-01-02T00:00:00.000Z' });

    expect(groupTransports([undated, unknownDay, dated], days).confirmed.map(r => r.id)).toEqual([1, 2, 3]);
    // same result whichever side of the comparison the undated entry lands on
    expect(groupTransports([undated, dated], days).confirmed.map(r => r.id)).toEqual([1, 2]);
    expect(groupTransports([dated, undated], days).confirmed.map(r => r.id)).toEqual([1, 2]);
  });

  it('FE-MOB-TRPM-012: splits confirmed, pending and automated transit', () => {
    const confirmed = res({ id: 1, reservation_time: '2026-07-01T08:00' });
    const pending = res({ id: 2, status: 'pending', reservation_time: '2026-07-01T09:00' });
    const cancelled = res({ id: 3, status: 'cancelled', reservation_time: '2026-07-01T07:00' });
    const transitConfirmed = res({ id: 4, type: 'transit', reservation_time: '2026-07-01T10:00' });
    const transitPending = res({ id: 5, type: 'transit', status: 'pending', reservation_time: '2026-07-01T06:00' });

    const groups = groupTransports([confirmed, pending, cancelled, transitConfirmed, transitPending], days);

    expect(groups.confirmed.map(r => r.id)).toEqual([1]);
    // anything not confirmed lands in pending, still chronological
    expect(groups.pending.map(r => r.id)).toEqual([3, 2]);
    // transit is peeled off regardless of status
    expect(groups.transit.map(r => r.id)).toEqual([5, 4]);
  });

  it('FE-MOB-TRPM-013: an empty list yields three empty groups', () => {
    expect(groupTransports([], days)).toEqual({ confirmed: [], pending: [], transit: [] });
    expect(groupTransports([res({ id: 1, reservation_time: '2026-07-01T08:00' })], []).confirmed).toHaveLength(1);
  });

  it('FE-MOB-TRPM-014: entries without a created_at still sort deterministically', () => {
    const a = { ...res({ id: 1, reservation_time: '2026-07-02T09:00' }), created_at: undefined };
    const b = { ...res({ id: 2, reservation_time: '2026-07-02T09:00' }), created_at: undefined };

    expect(groupTransports([a, b], days).confirmed.map(r => r.id)).toEqual([1, 2]);
  });
});
