/**
 * Characterization tests for the pure transit-itinerary helpers —
 * TRANSIT-ITIN-001 through TRANSIT-ITIN-021. The module moved 1:1 from the
 * legacy services/transitItineraryService.ts, which had no direct suite (its
 * behaviour was pinned only through the MCP transit tools); these cases pin
 * every superRefine error string and path, the ?? time fallbacks, the
 * coordinate tolerances and the reservation endpoint/metadata builder so the
 * relocation is provably byte-identical. Everything under test is pure — no
 * DB, no container; the db mock only satisfies distanceService's module-top
 * import of the connection proxy.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../src/db/database', () => ({ db: {} }));

import {
  buildTransitReservationParts,
  cleanTransitItineraryNames,
  effectiveTransitStopTime,
  transitCoordinatesMatch,
  transitItinerarySchema,
} from '../../../src/nest/transit/transit-itinerary.helpers';
import type { TransitItinerary, TransitLeg, TransitLegStop } from '../../../src/nest/transit/transit.helpers';

// All fixtures sit in Asia/Tokyo (+09:00) so local dates/times are
// deterministic regardless of the host timezone.
const stop = (name: string, lat: number, lng: number, time: string | null, extra: Partial<TransitLegStop> = {}): TransitLegStop => ({
  name,
  lat,
  lng,
  time,
  scheduledTime: null,
  track: null,
  ...extra,
});

const leg = (mode: string, from: TransitLegStop, to: TransitLegStop, duration: number, extra: Partial<TransitLeg> = {}): TransitLeg => ({
  mode,
  from,
  to,
  duration,
  distance: null,
  headsign: null,
  line: null,
  lineColor: null,
  lineTextColor: null,
  agency: null,
  intermediateStops: 0,
  geometry: null,
  geometryPrecision: 6,
  ...extra,
});

const at = (hhmm: string) => `2026-04-01T${hhmm}:00+09:00`;

const namba = { name: 'Namba', lat: 34.667, lng: 135.501 };
const umeda = { name: 'Umeda', lat: 34.702, lng: 135.496 };

/** Canonical valid single-leg itinerary: one RAIL leg spanning the itinerary. */
const singleLeg = (overrides: Partial<TransitItinerary> = {}): TransitItinerary => ({
  startTime: at('09:00'),
  endTime: at('09:30'),
  duration: 1800,
  transfers: 0,
  walkSeconds: 0,
  legs: [leg('RAIL', stop('Namba', 34.667, 135.501, at('09:00')), stop('Umeda', 34.702, 135.496, at('09:30')), 1800)],
  ...overrides,
});

/** Two connected RAIL legs (transfer at Umeda), 09:00 → 09:58. */
const twoLegs = (overrides: Partial<TransitItinerary> = {}): TransitItinerary => ({
  startTime: at('09:00'),
  endTime: at('09:58'),
  duration: 3480,
  transfers: 1,
  walkSeconds: 0,
  legs: [
    leg('RAIL', stop('Namba', 34.667, 135.501, at('09:00')), stop('Umeda', 34.702, 135.496, at('09:26')), 1560),
    leg('RAIL', stop('Umeda', 34.702, 135.496, at('09:30')), stop('Kyoto', 35.0116, 135.7681, at('09:58')), 1680),
  ],
  ...overrides,
});

const issuesOf = (itinerary: TransitItinerary) => {
  const result = transitItinerarySchema.safeParse(itinerary);
  return result.success ? [] : result.error.issues.map((issue) => ({ message: issue.message, path: issue.path }));
};

describe('transitItinerarySchema', () => {
  it('TRANSIT-ITIN-001: accepts a canonical itinerary (single leg and two-leg transfer)', () => {
    expect(transitItinerarySchema.safeParse(singleLeg()).success).toBe(true);
    expect(transitItinerarySchema.safeParse(twoLegs()).success).toBe(true);
  });

  it('TRANSIT-ITIN-002: rejects endTime not after startTime', () => {
    expect(issuesOf(singleLeg({ endTime: at('09:00') }))).toContainEqual({
      message: 'endTime must be after startTime',
      path: ['endTime'],
    });
  });

  it('TRANSIT-ITIN-003: rejects an all-WALK itinerary', () => {
    const walkOnly = singleLeg();
    walkOnly.legs = [{ ...walkOnly.legs[0], mode: 'WALK' }];
    expect(issuesOf(walkOnly)).toContainEqual({
      message: 'At least one scheduled transit leg is required',
      path: ['legs'],
    });
  });

  it('TRANSIT-ITIN-004: rejects transfers exceeding the transit leg count', () => {
    expect(issuesOf(singleLeg({ transfers: 5 }))).toContainEqual({
      message: 'transfers exceeds the number of transit legs',
      path: ['transfers'],
    });
  });

  it('TRANSIT-ITIN-005: caps combined geometry at 60000 chars (per-leg 60000 alone passes)', () => {
    const half = 'x'.repeat(40_000);
    const oversized = twoLegs();
    oversized.legs = [
      { ...oversized.legs[0], geometry: half },
      { ...oversized.legs[1], geometry: half },
    ];
    expect(issuesOf(oversized)).toContainEqual({
      message: 'Combined transit geometry is too large',
      path: ['legs'],
    });

    // Exactly 60000 combined is not "too large" (strict >), and a single leg
    // may carry the full budget without tripping the per-leg max.
    const boundary = singleLeg();
    boundary.legs = [{ ...boundary.legs[0], geometry: 'x'.repeat(60_000) }];
    expect(transitItinerarySchema.safeParse(boundary).success).toBe(true);
  });

  it('TRANSIT-ITIN-006: rejects a leg missing departure or arrival times', () => {
    const timeless = singleLeg();
    timeless.legs = [{ ...timeless.legs[0], from: stop('Namba', 34.667, 135.501, null) }];
    expect(issuesOf(timeless)).toContainEqual({
      message: 'Every leg requires departure and arrival times',
      path: ['legs', 0],
    });
  });

  it('TRANSIT-ITIN-007: rejects a leg arriving before it departs', () => {
    const backwards = singleLeg({ endTime: at('10:00') });
    backwards.legs = [
      leg('RAIL', stop('Namba', 34.667, 135.501, at('09:30')), stop('Umeda', 34.702, 135.496, at('09:10')), 1800),
    ];
    expect(issuesOf(backwards)).toContainEqual({
      message: 'Leg arrival must not precede departure',
      path: ['legs', 0],
    });
  });

  it('TRANSIT-ITIN-008: rejects a duration off by more than the 60s tolerance (exactly 60s passes)', () => {
    const drifted = singleLeg();
    drifted.legs = [{ ...drifted.legs[0], duration: 1919 }]; // 119s off the 1800s wall-clock
    expect(issuesOf(drifted)).toContainEqual({
      message: 'Leg duration does not match its times',
      path: ['legs', 0, 'duration'],
    });

    const withinTolerance = singleLeg();
    withinTolerance.legs = [{ ...withinTolerance.legs[0], duration: 1860 }]; // exactly 60s off
    expect(transitItinerarySchema.safeParse(withinTolerance).success).toBe(true);
  });

  it('TRANSIT-ITIN-009: rejects leg times outside the itinerary window', () => {
    expect(issuesOf(singleLeg({ startTime: at('09:10'), duration: 1200 }))).toContainEqual({
      message: 'Leg times must stay within the itinerary',
      path: ['legs', 0],
    });
  });

  it('TRANSIT-ITIN-010: rejects adjacent legs more than 1km apart', () => {
    const gapped = twoLegs();
    // Second leg departs ~55km away from the first leg's arrival stop.
    gapped.legs = [gapped.legs[0], { ...gapped.legs[1], from: stop('Kobe', 34.69, 135.19, at('09:30')) }];
    expect(issuesOf(gapped)).toContainEqual({
      message: 'Adjacent legs are not connected',
      path: ['legs', 1, 'from'],
    });
  });

  it('TRANSIT-ITIN-011: rejects adjacent legs out of chronological order', () => {
    const overlapping = twoLegs();
    // Second leg departs at 09:20, before the first leg arrives at 09:26.
    overlapping.legs = [
      overlapping.legs[0],
      leg('RAIL', stop('Umeda', 34.702, 135.496, at('09:20')), stop('Kyoto', 35.0116, 135.7681, at('09:48')), 1680),
    ];
    overlapping.endTime = at('09:48');
    overlapping.duration = 2880;
    expect(issuesOf(overlapping)).toContainEqual({
      message: 'Adjacent legs are not chronological',
      path: ['legs', 1, 'from', 'time'],
    });
  });

  it('TRANSIT-ITIN-012: rejects a first leg starting away from the itinerary start', () => {
    expect(issuesOf(singleLeg({ startTime: at('08:50'), duration: 2400 }))).toContainEqual({
      message: 'First leg must start with the itinerary',
      path: ['legs', 0, 'from', 'time'],
    });
  });

  it('TRANSIT-ITIN-013: rejects a last leg ending away from the itinerary end', () => {
    expect(issuesOf(singleLeg({ endTime: at('09:40'), duration: 2400 }))).toContainEqual({
      message: 'Last leg must end with the itinerary',
      path: ['legs', 0, 'to', 'time'],
    });
  });

  it('TRANSIT-ITIN-014: accepts provider modes outside the request whitelist, rejects non-uppercase tokens', () => {
    const airplane = singleLeg();
    airplane.legs = [{ ...airplane.legs[0], mode: 'AIRPLANE' }];
    expect(transitItinerarySchema.safeParse(airplane).success).toBe(true);

    const lowercase = singleLeg();
    lowercase.legs = [{ ...lowercase.legs[0], mode: 'rail' }];
    const result = transitItinerarySchema.safeParse(lowercase);
    expect(result.success).toBe(false);
    expect(result.error!.issues.some((issue) => issue.path.join('.') === 'legs.0.mode')).toBe(true);
  });
});

describe('effectiveTransitStopTime', () => {
  it('TRANSIT-ITIN-015: prefers realtime, falls back to scheduled via ?? (empty string passes through)', () => {
    expect(effectiveTransitStopTime({ time: at('09:00'), scheduledTime: at('08:55') })).toBe(at('09:00'));
    expect(effectiveTransitStopTime({ time: null, scheduledTime: at('08:55') })).toBe(at('08:55'));
    expect(effectiveTransitStopTime({ scheduledTime: at('08:55') })).toBe(at('08:55'));
    expect(effectiveTransitStopTime({ time: null, scheduledTime: null })).toBeNull();
    expect(effectiveTransitStopTime({})).toBeNull();
    // ?? not || — an empty string is a value, not a miss.
    expect(effectiveTransitStopTime({ time: '', scheduledTime: at('08:55') })).toBe('');
  });
});

describe('transitCoordinatesMatch', () => {
  it('TRANSIT-ITIN-016: matches within 100m, rejects beyond', () => {
    expect(transitCoordinatesMatch(namba, { ...namba })).toBe(true);
    // ~55m north — inside the 0.1km tolerance.
    expect(transitCoordinatesMatch(namba, { ...namba, lat: namba.lat + 0.0005 })).toBe(true);
    // ~555m north — outside.
    expect(transitCoordinatesMatch(namba, { ...namba, lat: namba.lat + 0.005 })).toBe(false);
  });
});

describe('cleanTransitItineraryNames', () => {
  it('TRANSIT-ITIN-017: replaces START/END sentinels without mutating the input', () => {
    const itinerary = singleLeg();
    itinerary.legs = [
      leg('RAIL', stop('START', 34.667, 135.501, at('09:00')), stop('END', 34.702, 135.496, at('09:30')), 1800),
    ];
    const cleaned = cleanTransitItineraryNames(itinerary, 'Namba', 'Umeda');
    expect(cleaned.legs[0].from.name).toBe('Namba');
    expect(cleaned.legs[0].to.name).toBe('Umeda');
    // Non-sentinel names pass through untouched.
    const untouched = cleanTransitItineraryNames(singleLeg(), 'A', 'B');
    expect(untouched.legs[0].from.name).toBe('Namba');
    expect(untouched.legs[0].to.name).toBe('Umeda');
    // The input itinerary is not mutated.
    expect(itinerary.legs[0].from.name).toBe('START');
    expect(itinerary.legs[0].to.name).toBe('END');
  });
});

describe('buildTransitReservationParts', () => {
  it('TRANSIT-ITIN-018: builds ordered endpoints and the transit metadata for a walk+rail+rail journey', () => {
    const kyoto = { name: 'Kyoto', lat: 35.0116, lng: 135.7681 };
    const itinerary: TransitItinerary = {
      startTime: at('09:00'),
      endTime: at('09:58'),
      duration: 3480,
      transfers: 1,
      walkSeconds: 300,
      legs: [
        leg('WALK', stop('Namba entrance', 34.667, 135.501, at('09:00')), stop('Namba station', 34.6675, 135.5015, at('09:05')), 300),
        leg(
          'RAIL',
          stop('Namba station', 34.6675, 135.5015, at('09:06')),
          // Realtime-less transfer stop: the scheduledTime must drive both the
          // stop endpoint and the metadata leg times (?? fallback).
          stop('Osaka', 34.702, 135.496, null, { scheduledTime: at('09:26'), track: '3' }),
          1200,
        ),
        leg('RAIL', stop('Osaka', 34.702, 135.496, at('09:30')), stop('Kyoto', 35.0116, 135.7681, at('09:58')), 1680, {
          line: 'Special Rapid',
          geometry: 'abc',
          geometryPrecision: 5,
        }),
      ],
    };

    const { endpoints, metadata } = buildTransitReservationParts(namba, kyoto, itinerary);

    expect(endpoints).toEqual([
      { role: 'from', sequence: 0, name: 'Namba', code: null, lat: 34.667, lng: 135.501, timezone: 'Asia/Tokyo', local_date: '2026-04-01', local_time: '09:00' },
      { role: 'stop', sequence: 1, name: 'Osaka', code: null, lat: 34.702, lng: 135.496, timezone: 'Asia/Tokyo', local_date: '2026-04-01', local_time: '09:26' },
      { role: 'to', sequence: 2, name: 'Kyoto', code: null, lat: 35.0116, lng: 135.7681, timezone: 'Asia/Tokyo', local_date: '2026-04-01', local_time: '09:58' },
    ]);

    expect(metadata).toEqual({
      transit: {
        provider: 'transitous',
        duration: 3480,
        transfers: 1,
        walk_seconds: 300,
        legs: [
          {
            mode: 'WALK', line: null, line_color: null, line_text_color: null, headsign: null, agency: null,
            duration: 300, stops: 0,
            from: { name: 'Namba entrance', time: '09:00', track: null },
            to: { name: 'Namba station', time: '09:05', track: null },
            geometry: null, geometry_precision: 6,
          },
          {
            mode: 'RAIL', line: null, line_color: null, line_text_color: null, headsign: null, agency: null,
            duration: 1200, stops: 0,
            from: { name: 'Namba station', time: '09:06', track: null },
            to: { name: 'Osaka', time: '09:26', track: '3' },
            geometry: null, geometry_precision: 6,
          },
          {
            mode: 'RAIL', line: 'Special Rapid', line_color: null, line_text_color: null, headsign: null, agency: null,
            duration: 1680, stops: 0,
            from: { name: 'Osaka', time: '09:30', track: null },
            to: { name: 'Kyoto', time: '09:58', track: null },
            geometry: 'abc', geometry_precision: 5,
          },
        ],
      },
    });
  });

  it('TRANSIT-ITIN-019: a transfer stop with no times at all yields null local date/time', () => {
    const kyoto = { name: 'Kyoto', lat: 35.0116, lng: 135.7681 };
    const itinerary = twoLegs();
    itinerary.legs = [
      { ...itinerary.legs[0], to: stop('Umeda', 34.702, 135.496, null) },
      itinerary.legs[1],
    ];
    const { endpoints, metadata } = buildTransitReservationParts(namba, kyoto, itinerary);
    expect(endpoints[1]).toEqual({
      role: 'stop', sequence: 1, name: 'Umeda', code: null, lat: 34.702, lng: 135.496,
      timezone: 'Asia/Tokyo', local_date: null, local_time: null,
    });
    expect(metadata.transit.legs[0].to.time).toBeNull();
  });

  it('TRANSIT-ITIN-020: an unresolvable endpoint timezone throws with the coordinates in the message', () => {
    expect(() => buildTransitReservationParts({ name: 'Nowhere', lat: NaN, lng: 135.501 }, umeda, singleLeg())).toThrow(
      'Unable to resolve timezone for NaN,135.501.',
    );
  });

  it('TRANSIT-ITIN-021: an unconvertible itinerary time throws with the ISO string and timezone', () => {
    expect(() => buildTransitReservationParts(namba, umeda, singleLeg({ startTime: 'not-a-date' }))).toThrow(
      'Unable to convert not-a-date to local time in Asia/Tokyo.',
    );
  });
});
