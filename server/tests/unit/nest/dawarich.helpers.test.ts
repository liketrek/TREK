/**
 * The pure half of the Dawarich integration — DAWARICH-TIME-001 through
 * DAWARICH-CITIES-006. Everything under test is a free function over plain
 * fixtures: no DB, no container, and no client. `dawarich.client` appears here
 * only as a type-only import (erased at compile time), so nothing in this file
 * can reach the network even by accident — there is no DawarichClient instance
 * to mock because the helpers never construct one.
 *
 * Every timestamp is written with an explicit offset (`Z` or `+HH:MM`) so the
 * cases mean the same thing on a CI runner in UTC and on a laptop in Berlin.
 */
import { describe, it, expect } from 'vitest';

import {
  bucketPointsByDay,
  bucketTracksByDay,
  capPoints,
  countPoints,
  distanceMeters,
  geoJsonToLatLng,
  localDateOf,
  mergeVisitedCountries,
  minutesBetween,
  normalizeVisit,
  offsetMinutesOf,
  simplify,
  splitWindow,
  syncWindow,
  toNumber,
  visitHash,
} from '../../../src/nest/integrations/dawarich.helpers';
import type {
  DawarichSlimPoint,
  DawarichTrackFeature,
  DawarichVisitRaw,
} from '../../../src/nest/integrations/dawarich.client';
import type { DawarichTrackDay } from '@trek/shared';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_VISIT: DawarichVisitRaw = {
  id: 42,
  area_id: null,
  started_at: '2024-06-15T18:30:00+02:00',
  ended_at: '2024-06-15T20:00:00+02:00',
  duration: 5400,
  name: '  Cafe Kranzler  ',
  status: 'confirmed',
  confidence: '0.87',
  confidence_band: 'high',
  place: { latitude: '52.5', longitude: '13.4', id: 7, country_code: 'de' },
};

const visit = (over: Partial<DawarichVisitRaw> = {}): DawarichVisitRaw => ({ ...BASE_VISIT, ...over });

/** A fixture whose shape is deliberately wrong — the payload is a stranger's JSON. */
const malformedVisit = (over: Record<string, unknown>): DawarichVisitRaw =>
  ({ ...BASE_VISIT, ...over }) as unknown as DawarichVisitRaw;

const point = (iso: string, lat: number | string, lng: number | string): DawarichSlimPoint => ({
  latitude: lat,
  longitude: lng,
  timestamp: Date.parse(iso) / 1000,
});

const track = (
  startAt: string | undefined,
  endAt: string | undefined,
  coordinates: unknown,
  props: { distance?: number | null; dominant_mode?: string | null } = {},
): DawarichTrackFeature => ({
  geometry: { coordinates },
  properties: { start_at: startAt, end_at: endAt, distance: null, dominant_mode: null, ...props },
});

// ── localDateOf / offsetMinutesOf ────────────────────────────────────────────

describe('localDateOf / offsetMinutesOf', () => {
  it('DAWARICH-TIME-001: reads the local date off the string rather than converting it', () => {
    // 23:30 in Tokyo is still the 15th there and the 15th in Dawarich, even
    // though the same instant is the 15th 14:30 UTC.
    expect(localDateOf('2024-06-15T23:30:00+09:00')).toBe('2024-06-15');
  });

  it('DAWARICH-TIME-002: takes a UTC instant as given — there is no local meaning to recover', () => {
    expect(localDateOf('2024-06-15T23:30:00Z')).toBe('2024-06-15');
  });

  it('DAWARICH-TIME-003: reads a positive offset as minutes', () => {
    expect(offsetMinutesOf('2024-06-15T10:00:00+02:00')).toBe(120);
  });

  it('DAWARICH-TIME-004: reads a negative half-hour offset as minutes', () => {
    expect(offsetMinutesOf('2024-06-15T10:00:00-05:30')).toBe(-330);
  });

  it('DAWARICH-TIME-005: accepts the colon-less form', () => {
    expect(offsetMinutesOf('2024-06-15T10:00:00+0200')).toBe(120);
  });

  it('DAWARICH-TIME-006: Z, a bare date and junk are all zero', () => {
    expect(offsetMinutesOf('2024-06-15T10:00:00Z')).toBe(0);
    // A bare date ends in `-15`, which must not be mistaken for an offset.
    expect(offsetMinutesOf('2024-06-15')).toBe(0);
    expect(offsetMinutesOf('not a timestamp')).toBe(0);
  });
});

// ── minutesBetween ───────────────────────────────────────────────────────────

describe('minutesBetween', () => {
  it('DAWARICH-TIME-007: whole minutes across a span', () => {
    expect(minutesBetween('2024-06-15T10:00:00Z', '2024-06-15T11:30:00Z')).toBe(90);
  });

  it('DAWARICH-TIME-008: rounds to the nearest minute in both directions', () => {
    expect(minutesBetween('2024-06-15T10:00:00Z', '2024-06-15T10:00:29Z')).toBe(0);
    expect(minutesBetween('2024-06-15T10:00:00Z', '2024-06-15T10:00:31Z')).toBe(1);
  });

  it('DAWARICH-TIME-009: compares instants, not wall clocks', () => {
    // 10:00+02:00 is 08:00Z; 11:00+01:00 is 10:00Z — two hours apart.
    expect(minutesBetween('2024-06-15T10:00:00+02:00', '2024-06-15T11:00:00+01:00')).toBe(120);
  });

  it('DAWARICH-TIME-010: a backwards or zero-length span is zero, never negative', () => {
    expect(minutesBetween('2024-06-15T11:00:00Z', '2024-06-15T10:00:00Z')).toBe(0);
    expect(minutesBetween('2024-06-15T10:00:00Z', '2024-06-15T10:00:00Z')).toBe(0);
  });

  it('DAWARICH-TIME-011: an unparsable timestamp is zero rather than NaN', () => {
    expect(minutesBetween('2024-06-15T10:00:00Z', 'nope')).toBe(0);
    expect(minutesBetween('nope', '2024-06-15T10:00:00Z')).toBe(0);
  });
});

// ── syncWindow ───────────────────────────────────────────────────────────────

describe('syncWindow', () => {
  it('DAWARICH-WINDOW-001: widens backwards by the lookback and forwards by the lookahead', () => {
    const window = syncWindow('2024-06-15', '2024-06-17', new Date('2026-01-01T00:00:00Z'), 2, 3);
    expect(window?.from.toISOString()).toBe('2024-06-13T00:00:00.000Z');
    expect(window?.to.toISOString()).toBe('2024-06-20T23:59:59.000Z');
  });

  it('DAWARICH-WINDOW-002: a zero lookback/lookahead still spans the trip itself', () => {
    const window = syncWindow('2024-06-15', '2024-06-17', new Date('2026-01-01T00:00:00Z'), 0, 0);
    expect(window?.from.toISOString()).toBe('2024-06-15T00:00:00.000Z');
    expect(window?.to.toISOString()).toBe('2024-06-17T23:59:59.000Z');
  });

  it('DAWARICH-WINDOW-003: never asks past now — the lookahead is clamped', () => {
    const now = new Date('2024-06-16T08:00:00Z');
    const window = syncWindow('2024-06-15', '2024-06-17', now, 1, 5);
    expect(window?.to.toISOString()).toBe(now.toISOString());
  });

  it('DAWARICH-WINDOW-004: an open-ended trip gets the lookback and stops at now', () => {
    const now = new Date('2024-06-20T12:00:00Z');
    const window = syncWindow('2024-06-15', null, now, 1, 7);
    expect(window?.from.toISOString()).toBe('2024-06-14T00:00:00.000Z');
    expect(window?.to.toISOString()).toBe(now.toISOString());
  });

  it('DAWARICH-WINDOW-005: an unparsable end date is treated as open-ended, not as a failure', () => {
    const now = new Date('2024-06-20T12:00:00Z');
    const window = syncWindow('2024-06-15', 'whenever', now, 1, 7);
    expect(window?.to.toISOString()).toBe(now.toISOString());
  });

  it('DAWARICH-WINDOW-006: a missing start date yields no window at all', () => {
    expect(syncWindow(null, '2024-06-17', new Date('2026-01-01T00:00:00Z'), 1, 1)).toBeNull();
  });

  it('DAWARICH-WINDOW-007: an unparsable or empty start date yields no window at all', () => {
    expect(syncWindow('gibberish', '2024-06-17', new Date('2026-01-01T00:00:00Z'), 1, 1)).toBeNull();
    expect(syncWindow('', null, new Date('2026-01-01T00:00:00Z'), 1, 1)).toBeNull();
  });

  it('DAWARICH-WINDOW-008: a trip that has not started yet collapses to nothing', () => {
    // `now` is before the (already widened) start, so there is no recorded
    // stretch to ask about: to <= from.
    expect(syncWindow('2024-06-15', null, new Date('2024-06-10T00:00:00Z'), 1, 1)).toBeNull();
  });
});

// ── visitHash ────────────────────────────────────────────────────────────────

describe('visitHash', () => {
  it('DAWARICH-HASH-001: is a sha256 hex digest', () => {
    expect(visitHash(BASE_VISIT)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('DAWARICH-HASH-002: is stable for the same input — a re-run that changed nothing stays quiet', () => {
    expect(visitHash(visit())).toBe(visitHash(visit()));
  });

  it('DAWARICH-HASH-003: changes when the visit is renamed', () => {
    expect(visitHash(visit({ name: 'Cafe Einstein' }))).not.toBe(visitHash(BASE_VISIT));
  });

  it('DAWARICH-HASH-004: changes when either timestamp moves', () => {
    expect(visitHash(visit({ started_at: '2024-06-15T18:45:00+02:00' }))).not.toBe(visitHash(BASE_VISIT));
    expect(visitHash(visit({ ended_at: '2024-06-15T21:00:00+02:00' }))).not.toBe(visitHash(BASE_VISIT));
  });

  it('DAWARICH-HASH-005: changes when the place moves or is re-identified', () => {
    const moved = visit({ place: { ...BASE_VISIT.place!, latitude: '52.6' } });
    const shifted = visit({ place: { ...BASE_VISIT.place!, longitude: '13.5' } });
    const reidentified = visit({ place: { ...BASE_VISIT.place!, id: 8 } });
    expect(visitHash(moved)).not.toBe(visitHash(BASE_VISIT));
    expect(visitHash(shifted)).not.toBe(visitHash(BASE_VISIT));
    expect(visitHash(reidentified)).not.toBe(visitHash(BASE_VISIT));
  });

  it('DAWARICH-HASH-006: changes when the status changes', () => {
    expect(visitHash(visit({ status: 'suggested' }))).not.toBe(visitHash(BASE_VISIT));
  });

  it('DAWARICH-HASH-007: ignores fields TREK does not show — a re-scored confidence is not a change', () => {
    expect(visitHash(visit({ confidence: '0.11', confidence_band: 'low' }))).toBe(visitHash(BASE_VISIT));
    expect(visitHash(visit({ area_id: 99, user_id: 3 }))).toBe(visitHash(BASE_VISIT));
  });

  it('DAWARICH-HASH-008: a missing name and an empty name are the same visit', () => {
    expect(visitHash(visit({ name: null }))).toBe(visitHash(visit({ name: '' })));
  });

  it('DAWARICH-HASH-009: a missing place does not throw', () => {
    expect(visitHash(visit({ place: null }))).toMatch(/^[0-9a-f]{64}$/);
  });

  it('DAWARICH-HASH-010: a missing status and an empty status are the same visit', () => {
    // `status` is nullable in the payload, so it is folded to the same blank a
    // visit with an empty one gets. Without that, a null would hash as the
    // literal "null" and a provider filling the field in with "" later would
    // look like every unscored visit changing at once.
    expect(visitHash(visit({ status: null }))).toBe(visitHash(visit({ status: '' })));
    expect(visitHash(visit({ status: null }))).not.toBe(visitHash(BASE_VISIT));
  });
});

// ── toNumber ─────────────────────────────────────────────────────────────────

describe('toNumber', () => {
  it('DAWARICH-NUM-001: passes finite numbers through and rejects the rest', () => {
    expect(toNumber(52.5)).toBe(52.5);
    expect(toNumber(0)).toBe(0);
    expect(toNumber(Number.NaN)).toBeNull();
    expect(toNumber(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it('DAWARICH-NUM-002: parses numeric strings, rejecting blank and non-numeric ones', () => {
    expect(toNumber('13.4')).toBe(13.4);
    expect(toNumber('  ')).toBeNull();
    expect(toNumber('north')).toBeNull();
  });

  it('DAWARICH-NUM-003: null, undefined and objects are not numbers', () => {
    expect(toNumber(null)).toBeNull();
    expect(toNumber(undefined)).toBeNull();
    expect(toNumber({})).toBeNull();
  });
});

// ── normalizeVisit ───────────────────────────────────────────────────────────

describe('normalizeVisit', () => {
  it('DAWARICH-VISIT-001: reduces a full visit to what TREK stores', () => {
    expect(normalizeVisit(BASE_VISIT)).toEqual({
      sourceVisitId: '42',
      name: 'Cafe Kranzler',
      lat: 52.5,
      lng: 13.4,
      startedAt: '2024-06-15T18:30:00+02:00',
      endedAt: '2024-06-15T20:00:00+02:00',
      durationMinutes: 90,
      localDate: '2024-06-15',
      status: 'confirmed',
      confidence: 0.87,
      confidenceBand: 'high',
      countryCodeFromSource: 'DE',
    });
  });

  it('DAWARICH-VISIT-002: an empty visit keeps every optional field null instead of guessing', () => {
    const sparse = visit({
      id: '9',
      started_at: '2024-06-15T18:30:00Z',
      ended_at: '2024-06-15T19:15:00Z',
      duration: null,
      name: null,
      status: null,
      confidence: null,
      confidence_band: null,
      place: null,
    });
    expect(normalizeVisit(sparse)).toEqual({
      sourceVisitId: '9',
      name: 'Unnamed stay',
      lat: null,
      lng: null,
      startedAt: '2024-06-15T18:30:00Z',
      endedAt: '2024-06-15T19:15:00Z',
      durationMinutes: 45,
      localDate: '2024-06-15',
      status: 'suggested',
      confidence: null,
      confidenceBand: null,
      countryCodeFromSource: null,
    });
  });

  it('DAWARICH-VISIT-003: a whitespace-only name falls back to the placeholder', () => {
    expect(normalizeVisit(visit({ name: '   ' }))?.name).toBe('Unnamed stay');
  });

  it('DAWARICH-VISIT-004: a place without coordinates yields null lat/lng, not zeros', () => {
    const result = normalizeVisit(visit({ place: { latitude: null, longitude: null, id: null } }));
    expect(result?.lat).toBeNull();
    expect(result?.lng).toBeNull();
  });

  it('DAWARICH-VISIT-005: "confirmed" is the only status taken at face value', () => {
    expect(normalizeVisit(visit({ status: 'confirmed' }))?.status).toBe('confirmed');
    expect(normalizeVisit(visit({ status: 'suggested' }))?.status).toBe('suggested');
  });

  it('DAWARICH-VISIT-006: an unknown status falls to "suggested" — the side that asks, not the side that acts', () => {
    // "declined" stopped existing in Dawarich 1.12.0; a future value must not
    // silently become a confirmation.
    expect(normalizeVisit(visit({ status: 'declined' }))?.status).toBe('suggested');
    expect(normalizeVisit(visit({ status: 'something_new' }))?.status).toBe('suggested');
    expect(normalizeVisit(visit({ status: null }))?.status).toBe('suggested');
  });

  it('DAWARICH-VISIT-007: the span between the timestamps is the length, whatever duration says', () => {
    // 18:30 to 20:00. The reported figure is ignored while there are two usable
    // timestamps, because that is the pair shown beside it in the panel. It used
    // to win and to be read as seconds, which divided Dawarich's minutes by sixty
    // a second time and turned an eighteen-minute stop into "0 min".
    expect(normalizeVisit(visit({ duration: 5400 }))?.durationMinutes).toBe(90);
    expect(normalizeVisit(visit({ duration: '120' }))?.durationMinutes).toBe(90);
    expect(normalizeVisit(visit({ duration: 18 }))?.durationMinutes).toBe(90);
  });

  it('DAWARICH-VISIT-008: a missing or zero duration is recomputed from the two timestamps', () => {
    // 18:30 → 20:00 is 90 minutes whichever way it is derived.
    expect(normalizeVisit(visit({ duration: null }))?.durationMinutes).toBe(90);
    expect(normalizeVisit(visit({ duration: 0 }))?.durationMinutes).toBe(90);
    expect(normalizeVisit(visit({ duration: -60 }))?.durationMinutes).toBe(90);
    expect(normalizeVisit(visit({ duration: 'unknown' }))?.durationMinutes).toBe(90);
  });

  it('DAWARICH-VISIT-009: a two-letter country code from the source is upper-cased', () => {
    expect(normalizeVisit(visit())?.countryCodeFromSource).toBe('DE');
    const upper = visit({ place: { ...BASE_VISIT.place!, country_code: 'FR' } });
    expect(normalizeVisit(upper)?.countryCodeFromSource).toBe('FR');
  });

  it('DAWARICH-VISIT-010: anything that is not a two-letter code is dropped', () => {
    const three = visit({ place: { ...BASE_VISIT.place!, country_code: 'deu' } });
    const empty = visit({ place: { ...BASE_VISIT.place!, country_code: '' } });
    const absent = visit({ place: { latitude: '52.5', longitude: '13.4', id: 7 } });
    expect(normalizeVisit(three)?.countryCodeFromSource).toBeNull();
    expect(normalizeVisit(empty)?.countryCodeFromSource).toBeNull();
    expect(normalizeVisit(absent)?.countryCodeFromSource).toBeNull();
  });

  it('DAWARICH-VISIT-011: the local date comes from the source offset, not from the host clock', () => {
    const tokyoLateNight = visit({
      started_at: '2024-06-15T23:30:00+09:00',
      ended_at: '2024-06-16T00:30:00+09:00',
    });
    expect(normalizeVisit(tokyoLateNight)?.localDate).toBe('2024-06-15');
  });

  it('DAWARICH-VISIT-012: a visit without an id is unusable', () => {
    expect(normalizeVisit(malformedVisit({ id: null }))).toBeNull();
    expect(normalizeVisit(malformedVisit({ id: undefined }))).toBeNull();
  });

  it('DAWARICH-VISIT-013: non-string timestamps are unusable', () => {
    expect(normalizeVisit(malformedVisit({ started_at: 1_718_476_200 }))).toBeNull();
    expect(normalizeVisit(malformedVisit({ ended_at: null }))).toBeNull();
  });

  it('DAWARICH-VISIT-014: an unparsable start timestamp is unusable', () => {
    expect(normalizeVisit(visit({ started_at: 'last Tuesday' }))).toBeNull();
  });

  it('DAWARICH-VISIT-015: an unreadable end collapses onto the arrival rather than staying unreadable', () => {
    // The guard checks `started_at` alone, so an unreadable end does not drop
    // the visit. It is repaired instead of passed through: kept as-is it would
    // render as "Invalid Date" beside a perfectly good arrival time.
    const result = normalizeVisit(visit({ duration: null, ended_at: 'sometime' }));
    expect(result?.endedAt).toBe(new Date(Date.parse(result!.startedAt)).toISOString());
    expect(result?.durationMinutes).toBe(0);
  });

  it('DAWARICH-VISIT-016: an unreadable end falls back to the reported duration', () => {
    // With a duration to go on, the end is the arrival plus that span — which is
    // what the stay actually was, and what the two timestamps then agree on.
    // Minutes: Dawarich writes `duration_minutes = ((ended_at - started_at) / 60)`
    // into this column (app/services/visits/create.rb).
    const result = normalizeVisit(visit({ duration: 30, ended_at: 'sometime' }));
    expect(Date.parse(result!.endedAt) - Date.parse(result!.startedAt)).toBe(1_800_000);
    expect(result?.durationMinutes).toBe(30);
  });

  it('DAWARICH-VISIT-017: an unreadable end plus a duration of zero or less collapses onto the arrival', () => {
    // A reported duration is only usable as a repair while it is positive: zero
    // is "the detector had nothing", and a negative one is the same accident
    // that produced the unreadable end. Either way the end moves to the
    // arrival, which is the one timestamp that was actually readable. It never
    // moves backwards from it.
    for (const duration of [0, -45, '0'] as const) {
      const result = normalizeVisit(visit({ duration, ended_at: 'sometime' }));
      expect(result?.endedAt).toBe(new Date(Date.parse(result!.startedAt)).toISOString());
      expect(result?.durationMinutes).toBe(0);
    }
  });
});

// ── distanceMeters ───────────────────────────────────────────────────────────

describe('distanceMeters', () => {
  it('DAWARICH-GEO-001: a point is zero metres from itself', () => {
    expect(distanceMeters(52.52, 13.405, 52.52, 13.405)).toBe(0);
  });

  it('DAWARICH-GEO-002: a small north-south step measures in metres', () => {
    // 0.0009° of latitude is almost exactly 100 m anywhere on earth.
    expect(distanceMeters(52.52, 13.405, 52.5209, 13.405)).toBeCloseTo(100, 0);
  });

  it('DAWARICH-GEO-003: a degree of longitude is ~111 km at the equator', () => {
    expect(distanceMeters(0, 0, 0, 1)).toBeCloseTo(111_195, -2);
  });

  it('DAWARICH-GEO-004: a degree of longitude shrinks with the cosine of the latitude', () => {
    // At 60° north a degree of longitude is half what it is at the equator.
    expect(distanceMeters(60, 0, 60, 1)).toBeCloseTo(111_195 / 2, -2);
  });

  it('DAWARICH-GEO-005: distance is symmetric', () => {
    const there = distanceMeters(48.85, 2.35, 52.52, 13.405);
    const back = distanceMeters(52.52, 13.405, 48.85, 2.35);
    expect(there).toBeCloseTo(back, 6);
  });
});

// ── simplify ─────────────────────────────────────────────────────────────────

describe('simplify', () => {
  it('DAWARICH-GEO-006: a straight line collapses to its two ends', () => {
    expect(simplify([[0, 0], [0, 0.5], [0, 1]], 0.00005)).toEqual([[0, 0], [0, 1]]);
  });

  it('DAWARICH-GEO-007: a long straight run collapses no matter how many points it has', () => {
    const straight: Array<[number, number]> = Array.from({ length: 500 }, (_, i) => [0, i / 500]);
    expect(simplify(straight, 0.00005)).toEqual([[0, 0], [0, 499 / 500]]);
  });

  it('DAWARICH-GEO-008: a corner survives', () => {
    expect(simplify([[0, 0], [0, 1], [1, 1]], 0.00005)).toEqual([[0, 0], [0, 1], [1, 1]]);
  });

  it('DAWARICH-GEO-009: a deviation under the tolerance is dropped, one over it is kept', () => {
    const jitter: Array<[number, number]> = [[0, 0], [0.00001, 0.5], [0, 1]];
    const corner: Array<[number, number]> = [[0, 0], [0.001, 0.5], [0, 1]];
    expect(simplify(jitter, 0.00005)).toHaveLength(2);
    expect(simplify(corner, 0.00005)).toHaveLength(3);
  });

  it('DAWARICH-GEO-010: two points or fewer are returned untouched', () => {
    const pair: Array<[number, number]> = [[0, 0], [1, 1]];
    expect(simplify(pair, 0.00005)).toBe(pair);
    expect(simplify([], 0.00005)).toEqual([]);
  });

  it('DAWARICH-GEO-024: a loop back to the start is measured from the point, not from a zero-length baseline', () => {
    // A day that ends where it began gives the algorithm a segment whose two
    // ends are the same coordinate. The gradient it normally projects onto does
    // not exist there, so the distance has to fall back to "how far is this
    // point from that one". Without it the division is 0/0 and every detour on
    // a round trip would simplify away as NaN.
    const loop: Array<[number, number]> = [[0, 0], [0, 1], [0, 0]];
    expect(simplify(loop, 0.00005)).toEqual(loop);
    // And the same shape, a metre wide instead of a degree, still collapses.
    expect(simplify([[0, 0], [0, 0.00001], [0, 0]], 0.00005)).toEqual([[0, 0], [0, 0]]);
  });

  it('DAWARICH-GEO-025: an unreadable latitude cannot collapse the longitude scale', () => {
    // The metric scales longitude by the cosine of the latitude, and guards
    // that scale so it is never zero. A latitude that is not a real number
    // gives no cosine at all, and the fallback keeps the scale at 1 rather
    // than multiplying every longitude by nothing. The bad point measures as
    // no deviation and is dropped; the ends of the line still come back.
    expect(simplify([[0, 0], [NaN, 0.5], [0, 1]], 0.00005)).toEqual([[0, 0], [0, 1]]);
  });

  it('DAWARICH-GEO-011: the first and last point are always kept', () => {
    const zigzag: Array<[number, number]> = [[0, 0], [1, 0.25], [0, 0.5], [1, 0.75], [0, 1]];
    const out = simplify(zigzag, 0.00005);
    expect(out[0]).toEqual([0, 0]);
    expect(out[out.length - 1]).toEqual([0, 1]);
  });
});

// ── capPoints ────────────────────────────────────────────────────────────────

describe('capPoints', () => {
  it('DAWARICH-GEO-012: a line already under the cap is untouched', () => {
    const line: Array<[number, number]> = [[0, 0], [1, 1], [2, 2]];
    expect(capPoints(line, 5)).toBe(line);
    expect(capPoints(line, 3)).toBe(line);
  });

  it('DAWARICH-GEO-013: thins to the cap on an even stride', () => {
    const line: Array<[number, number]> = [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]];
    expect(capPoints(line, 3)).toEqual([[0, 0], [2, 2], [4, 4]]);
  });

  it('DAWARICH-GEO-014: the line still starts and ends where the day did', () => {
    const line: Array<[number, number]> = Array.from({ length: 1000 }, (_, i) => [i / 1000, 0]);
    const out = capPoints(line, 100);
    expect(out).toHaveLength(100);
    expect(out[0]).toEqual(line[0]);
    expect(out[out.length - 1]).toEqual(line[line.length - 1]);
  });

  it('DAWARICH-GEO-015: a cap below two is refused rather than producing a degenerate line', () => {
    const line: Array<[number, number]> = [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]];
    expect(capPoints(line, 1)).toBe(line);
    expect(capPoints(line, 0)).toBe(line);
  });
});

// ── geoJsonToLatLng ──────────────────────────────────────────────────────────

describe('geoJsonToLatLng', () => {
  it('DAWARICH-GEO-016: swaps GeoJSON [lng, lat] into TREK [lat, lng]', () => {
    expect(geoJsonToLatLng([[13.4, 52.5]])).toEqual([[52.5, 13.4]]);
  });

  it('DAWARICH-GEO-017: parses numeric strings as coordinates', () => {
    expect(geoJsonToLatLng([['13.4', '52.5']])).toEqual([[52.5, 13.4]]);
  });

  it('DAWARICH-GEO-018: skips pairs that are not pairs', () => {
    expect(geoJsonToLatLng([[13.4], 'nope', null, {}, []])).toEqual([]);
  });

  it('DAWARICH-GEO-019: skips pairs that are not numbers', () => {
    expect(geoJsonToLatLng([['east', 'north'], [null, 52.5], [13.4, undefined]])).toEqual([]);
  });

  it('DAWARICH-GEO-020: keeps the exact range limits and drops anything past them', () => {
    expect(geoJsonToLatLng([[180, 90], [-180, -90]])).toEqual([[90, 180], [-90, -180]]);
    expect(geoJsonToLatLng([[180.1, 10], [-180.1, 10], [10, 90.1], [10, -90.1]])).toEqual([]);
  });

  it('DAWARICH-GEO-021: keeps the usable pairs out of a mixed list', () => {
    expect(geoJsonToLatLng([[13.4, 52.5], 'nope', [999, 999], [2.35, 48.85]])).toEqual([
      [52.5, 13.4],
      [48.85, 2.35],
    ]);
  });

  it('DAWARICH-GEO-022: a non-array is an empty line, not a throw', () => {
    expect(geoJsonToLatLng('nope')).toEqual([]);
    expect(geoJsonToLatLng(null)).toEqual([]);
    expect(geoJsonToLatLng(undefined)).toEqual([]);
  });

  it('DAWARICH-GEO-023: ignores anything past the first two entries of a pair', () => {
    // GeoJSON positions may carry an elevation; TREK draws in two dimensions.
    expect(geoJsonToLatLng([[13.4, 52.5, 34]])).toEqual([[52.5, 13.4]]);
  });
});

// ── bucketPointsByDay ────────────────────────────────────────────────────────

describe('bucketPointsByDay', () => {
  const acrossMidnight = (): DawarichSlimPoint[] => [
    point('2024-06-15T10:00:00Z', 10, 10),
    point('2024-06-15T23:59:59Z', 10, 11),
    point('2024-06-16T00:00:00Z', 11, 11),
    point('2024-06-16T10:00:00Z', 11, 12),
  ];

  it('DAWARICH-BUCKET-001: midnight is exact — a point at 00:00:00 belongs to the new day', () => {
    const days = bucketPointsByDay(acrossMidnight(), 0);
    expect(days.map((d) => d.date)).toEqual(['2024-06-15', '2024-06-16']);
    expect(days[0]!.segments[0]!.startedAt).toBe('2024-06-15T10:00:00.000Z');
    expect(days[0]!.segments[0]!.endedAt).toBe('2024-06-15T23:59:59.000Z');
    expect(days[1]!.segments[0]!.startedAt).toBe('2024-06-16T00:00:00.000Z');
    expect(days[1]!.segments[0]!.endedAt).toBe('2024-06-16T10:00:00.000Z');
  });

  it('DAWARICH-BUCKET-002: the seam is stitched — a day starts where the previous one ended', () => {
    const days = bucketPointsByDay(acrossMidnight(), 0);
    const previousLast = days[0]!.segments[0]!.points.at(-1);
    // The stitched point is drawn but does not move the day's own times.
    expect(days[1]!.segments[0]!.points[0]).toEqual(previousLast);
    expect(days[1]!.segments[0]!.points).toEqual([[10, 11], [11, 11], [11, 12]]);
  });

  it('DAWARICH-BUCKET-003: the first day is not stitched to anything', () => {
    const days = bucketPointsByDay(
      [point('2024-06-15T10:00:00Z', 10, 10), point('2024-06-15T12:00:00Z', 10, 11)],
      0,
    );
    expect(days[0]!.segments[0]!.points).toEqual([[10, 10], [10, 11]]);
  });

  it('DAWARICH-BUCKET-004: the offset decides the day — an early UTC point is still yesterday in New York', () => {
    const days = bucketPointsByDay(
      [point('2024-06-15T02:00:00Z', 10, 10), point('2024-06-15T03:00:00Z', 11, 11)],
      -300,
    );
    expect(days).toHaveLength(1);
    expect(days[0]!.date).toBe('2024-06-14');
    // The segment times stay the real instants; only the bucket is local.
    expect(days[0]!.segments[0]!.startedAt).toBe('2024-06-15T02:00:00.000Z');
  });

  it('DAWARICH-BUCKET-005: a positive offset pushes a late UTC point into tomorrow', () => {
    const days = bucketPointsByDay(
      [point('2024-06-15T22:00:00Z', 10, 10), point('2024-06-15T23:00:00Z', 11, 11)],
      540,
    );
    expect(days.map((d) => d.date)).toEqual(['2024-06-16']);
  });

  it('DAWARICH-BUCKET-006: points arriving out of order are sorted by time', () => {
    const days = bucketPointsByDay(
      [
        point('2024-06-15T18:00:00Z', 11, 11),
        point('2024-06-15T06:00:00Z', 10, 10),
        point('2024-06-15T12:00:00Z', 10, 11),
      ],
      0,
    );
    expect(days[0]!.segments[0]!.startedAt).toBe('2024-06-15T06:00:00.000Z');
    expect(days[0]!.segments[0]!.endedAt).toBe('2024-06-15T18:00:00.000Z');
    expect(days[0]!.segments[0]!.points[0]).toEqual([10, 10]);
  });

  it('DAWARICH-BUCKET-007: unusable points are dropped and a day that loses its line is not emitted', () => {
    const days = bucketPointsByDay(
      [
        { latitude: 'north', longitude: 10, timestamp: 1_718_445_600 },
        { latitude: 95, longitude: 10, timestamp: 1_718_445_601 },
        { latitude: 10, longitude: 200, timestamp: 1_718_445_602 },
        { latitude: 10, longitude: 10, timestamp: null } as unknown as DawarichSlimPoint,
        point('2024-06-15T10:00:00Z', 10, 10),
      ],
      0,
    );
    // Only one usable point survived, so there is no line to draw.
    expect(days).toEqual([]);
  });

  it('DAWARICH-BUCKET-008: an empty recording is an empty result', () => {
    expect(bucketPointsByDay([], 0)).toEqual([]);
  });

  it('DAWARICH-BUCKET-009: honours the per-day cap and the tolerance', () => {
    const days = bucketPointsByDay(
      [
        point('2024-06-15T00:00:00Z', 0, 0),
        point('2024-06-15T01:00:00Z', 1, 0),
        point('2024-06-15T02:00:00Z', 0, 1),
        point('2024-06-15T03:00:00Z', 1, 1),
        point('2024-06-15T04:00:00Z', 0, 2),
      ],
      0,
      { maxPointsPerDay: 3, epsilon: 0.00005 },
    );
    const line = days[0]!.segments[0]!.points;
    expect(line).toHaveLength(3);
    expect(line[0]).toEqual([0, 0]);
    expect(line.at(-1)).toEqual([0, 2]);
  });

  it('DAWARICH-BUCKET-010: a recorded day carries no mode and no measured distance', () => {
    const days = bucketPointsByDay(
      [point('2024-06-15T10:00:00Z', 10, 10), point('2024-06-15T12:00:00Z', 10, 11)],
      0,
    );
    expect(days[0]!.segments[0]!.mode).toBeNull();
    expect(days[0]!.segments[0]!.distanceMeters).toBeNull();
  });
});

// ── bucketTracksByDay ────────────────────────────────────────────────────────

describe('bucketTracksByDay', () => {
  it('DAWARICH-TRACK-001: a track inside one day stays whole and keeps its measured distance', () => {
    const days = bucketTracksByDay([
      track('2024-06-15T10:00:00Z', '2024-06-15T12:00:00Z', [[10, 10], [11, 11], [11, 12]], {
        distance: 4321,
        dominant_mode: 'car',
      }),
    ]);
    expect(days).toEqual([
      {
        date: '2024-06-15',
        segments: [
          {
            // GeoJSON [lng, lat] in, TREK [lat, lng] out.
            points: [[10, 10], [11, 11], [12, 11]],
            mode: 'car',
            startedAt: '2024-06-15T10:00:00Z',
            endedAt: '2024-06-15T12:00:00Z',
            distanceMeters: 4321,
          },
        ],
      },
    ]);
  });

  it('DAWARICH-TRACK-002: the local day comes from the offset the track carries', () => {
    // 00:30+02:00 is still 22:30Z the day before, but the recording user saw
    // the 16th, which is the day TREK must file it under.
    const days = bucketTracksByDay([
      track('2024-06-16T00:30:00+02:00', '2024-06-16T01:30:00+02:00', [[10, 10], [11, 11], [11, 12]]),
    ]);
    expect(days.map((d) => d.date)).toEqual(['2024-06-16']);
  });

  it('DAWARICH-TRACK-003: a track over midnight is split, and the two halves meet at midnight', () => {
    const days = bucketTracksByDay([
      track(
        '2024-06-15T23:00:00Z',
        '2024-06-16T01:00:00Z',
        [[10, 10], [10.5, 10.5], [11, 11], [11.5, 10.5], [12, 11]],
        { distance: 9000, dominant_mode: 'walk' },
      ),
    ]);
    expect(days.map((d) => d.date)).toEqual(['2024-06-15', '2024-06-16']);

    const first = days[0]!.segments[0]!;
    const second = days[1]!.segments[0]!;
    expect(first.startedAt).toBe('2024-06-15T23:00:00.000Z');
    expect(first.endedAt).toBe('2024-06-16T00:00:00.000Z');
    expect(second.startedAt).toBe('2024-06-16T00:00:00.000Z');
    expect(second.endedAt).toBe('2024-06-16T01:00:00Z');
    // The cut point belongs to both halves, so the line has no gap.
    expect(second.points[0]).toEqual(first.points.at(-1));
    expect(first.mode).toBe('walk');
    expect(second.mode).toBe('walk');
  });

  it('DAWARICH-TRACK-004: a split piece reports no distance — only a whole track measured one', () => {
    const days = bucketTracksByDay([
      track(
        '2024-06-15T23:00:00Z',
        '2024-06-16T01:00:00Z',
        [[10, 10], [10.5, 10.5], [11, 11], [11.5, 10.5], [12, 11]],
        { distance: 9000 },
      ),
    ]);
    expect(days.flatMap((d) => d.segments).map((s) => s.distanceMeters)).toEqual([null, null]);
  });

  it('DAWARICH-TRACK-005: a track spanning three days is cut twice, by index proportion of its span', () => {
    const days = bucketTracksByDay([
      track(
        '2024-06-15T12:00:00Z',
        '2024-06-17T12:00:00Z',
        [[10, 10], [10.5, 11], [11, 10], [11.5, 11], [12, 10], [12.5, 11], [13, 10]],
        { distance: 100 },
      ),
    ]);
    expect(
      days.map((d) => ({ date: d.date, from: d.segments[0]!.startedAt, to: d.segments[0]!.endedAt })),
    ).toEqual([
      { date: '2024-06-15', from: '2024-06-15T12:00:00.000Z', to: '2024-06-16T00:00:00.000Z' },
      { date: '2024-06-16', from: '2024-06-16T00:00:00.000Z', to: '2024-06-17T00:00:00.000Z' },
      { date: '2024-06-17', from: '2024-06-17T00:00:00.000Z', to: '2024-06-17T12:00:00Z' },
    ]);
  });

  it('DAWARICH-TRACK-006: days come back in calendar order however the features arrived', () => {
    const days = bucketTracksByDay([
      track('2024-06-17T08:00:00Z', '2024-06-17T09:00:00Z', [[10, 10], [11, 11], [11, 12]]),
      track('2024-06-15T18:00:00Z', '2024-06-15T19:00:00Z', [[20, 20], [21, 21], [21, 22]]),
      track('2024-06-16T06:00:00Z', '2024-06-16T07:00:00Z', [[30, 30], [31, 31], [31, 32]]),
    ]);
    expect(days.map((d) => d.date)).toEqual(['2024-06-15', '2024-06-16', '2024-06-17']);
  });

  it('DAWARICH-TRACK-007: segments within a day come back in start order', () => {
    const days = bucketTracksByDay([
      track('2024-06-15T18:00:00Z', '2024-06-15T19:00:00Z', [[20, 20], [21, 21], [21, 22]]),
      track('2024-06-15T06:00:00Z', '2024-06-15T07:00:00Z', [[30, 30], [31, 31], [31, 32]]),
      track('2024-06-15T12:00:00Z', '2024-06-15T13:00:00Z', [[40, 40], [41, 41], [41, 42]]),
    ]);
    expect(days).toHaveLength(1);
    expect(days[0]!.segments.map((s) => s.startedAt)).toEqual([
      '2024-06-15T06:00:00Z',
      '2024-06-15T12:00:00Z',
      '2024-06-15T18:00:00Z',
    ]);
  });

  it('DAWARICH-TRACK-008: a track without both timestamps is skipped', () => {
    const days = bucketTracksByDay([
      track(undefined, '2024-06-15T12:00:00Z', [[10, 10], [11, 11], [11, 12]]),
      track('2024-06-15T10:00:00Z', undefined, [[10, 10], [11, 11], [11, 12]]),
      { geometry: { coordinates: [[10, 10], [11, 11]] }, properties: null },
    ]);
    expect(days).toEqual([]);
  });

  it('DAWARICH-TRACK-009: a track without a drawable line is skipped', () => {
    const days = bucketTracksByDay([
      track('2024-06-15T10:00:00Z', '2024-06-15T12:00:00Z', [[10, 10]]),
      track('2024-06-15T10:00:00Z', '2024-06-15T12:00:00Z', 'nope'),
      { geometry: null, properties: { start_at: '2024-06-15T10:00:00Z', end_at: '2024-06-15T12:00:00Z' } },
    ]);
    expect(days).toEqual([]);
  });

  it('DAWARICH-TRACK-010: a backwards or zero-length track is treated as whole, on its start day', () => {
    const days = bucketTracksByDay([
      track('2024-06-16T01:00:00Z', '2024-06-15T23:00:00Z', [[10, 10], [11, 11], [11, 12]], {
        distance: 50,
      }),
    ]);
    expect(days.map((d) => d.date)).toEqual(['2024-06-16']);
    expect(days[0]!.segments[0]!.distanceMeters).toBe(50);
  });

  it('DAWARICH-TRACK-011: a two-point track over midnight is not split at all', () => {
    // One segment cannot become two drawable pieces: cutting it would hand one
    // day a single point and the other nothing, and the tail would vanish. So
    // the whole track goes on the day it started, with its real times intact —
    // the split is declined rather than faked.
    const days = bucketTracksByDay([
      track('2024-06-15T23:00:00Z', '2024-06-16T01:00:00Z', [[10, 10], [11, 12]], { distance: 100 }),
    ]);
    expect(days.map((d) => d.date)).toEqual(['2024-06-15']);
    expect(days[0]!.segments[0]!.endedAt).toBe('2024-06-16T01:00:00Z');
    // Whole, so it still reports the distance Dawarich actually measured.
    expect(days[0]!.segments[0]!.distanceMeters).toBe(100);
  });

  it('DAWARICH-TRACK-014: enough points to split across midnight still splits', () => {
    // The counterpart to 011: three segments over one midnight leave both days
    // a drawable line, so the approximation is applied.
    const days = bucketTracksByDay([
      track('2024-06-15T22:00:00Z', '2024-06-16T02:00:00Z', [[10, 10], [10.5, 10.5], [11, 11], [11.5, 11.5]]),
    ]);
    expect(days.map((d) => d.date)).toEqual(['2024-06-15', '2024-06-16']);
    for (const day of days) expect(day.segments[0]!.points.length).toBeGreaterThanOrEqual(2);
  });

  it('DAWARICH-TRACK-012: honours the per-day cap and the tolerance', () => {
    const zigzag = Array.from(
      { length: 40 },
      (_, i): [number, number] => [10 + i / 10, i % 2 === 0 ? 10 : 11],
    );
    const days = bucketTracksByDay([track('2024-06-15T10:00:00Z', '2024-06-15T12:00:00Z', zigzag)], {
      maxPointsPerDay: 5,
      epsilon: 0.00005,
    });
    expect(days[0]!.segments[0]!.points).toHaveLength(5);
  });

  it('DAWARICH-TRACK-015: a cut that lands on the last point ends the walk instead of emitting an empty tail', () => {
    // Midnight falls at 98% of this track's time span, so the proportional cut
    // puts every point before it. What is left afterwards is one point, which
    // is not a line: the loop stops there rather than pushing a tail piece that
    // would render as nothing and carry a start after its own end.
    const days = bucketTracksByDay([
      track('2024-06-15T00:00:00Z', '2024-06-16T00:30:00Z', [[10, 10], [11, 12], [12, 10]], {
        distance: 7000,
      }),
    ]);

    expect(days.map((d) => d.date)).toEqual(['2024-06-15']);
    const segment = days[0]!.segments[0]!;
    expect(segment.points).toEqual([[10, 10], [12, 11], [10, 12]]);
    expect(segment.startedAt).toBe('2024-06-15T00:00:00.000Z');
    expect(segment.endedAt).toBe('2024-06-16T00:00:00.000Z');
    // It was cut, even though only one piece came out, so the measured distance
    // no longer describes it.
    expect(segment.distanceMeters).toBeNull();
  });

  it('DAWARICH-TRACK-013: an empty feature list is an empty result', () => {
    expect(bucketTracksByDay([])).toEqual([]);
  });
});

// ── countPoints ──────────────────────────────────────────────────────────────

describe('countPoints', () => {
  const day = (...segments: Array<Array<[number, number]>>): DawarichTrackDay => ({
    date: '2024-06-15',
    segments: segments.map((points) => ({
      points,
      mode: null,
      startedAt: '2024-06-15T10:00:00Z',
      endedAt: '2024-06-15T12:00:00Z',
      distanceMeters: null,
    })),
  });

  it('DAWARICH-COUNT-001: nothing drawn is zero', () => {
    expect(countPoints([])).toBe(0);
    expect(countPoints([day()])).toBe(0);
  });

  it('DAWARICH-COUNT-002: sums every segment of every day', () => {
    const days = [day([[0, 0], [1, 1]], [[0, 0], [1, 1], [2, 2]]), day([[0, 0], [1, 1]])];
    expect(countPoints(days)).toBe(7);
  });

  it('DAWARICH-COUNT-003: agrees with what the bucketing actually produced', () => {
    const days = bucketTracksByDay([
      track('2024-06-15T10:00:00Z', '2024-06-15T12:00:00Z', [[10, 10], [11, 11], [11, 12]]),
      track('2024-06-16T10:00:00Z', '2024-06-16T12:00:00Z', [[20, 20], [21, 21], [21, 22]]),
    ]);
    expect(countPoints(days)).toBe(6);
  });
});

describe('visited cities over a long range', () => {
  const DAY = 86_400_000;

  it('DAWARICH-CITIES-001: a range within one window stays one request, bounds untouched', () => {
    const from = new Date('2026-09-01T00:00:00Z');
    const to = new Date('2026-09-02T00:00:00Z');
    expect(splitWindow(from, to, 30)).toEqual([{ from, to }]);
  });

  it('DAWARICH-CITIES-002: a year becomes months that cover it without a gap or an overlap', () => {
    // Dawarich reads start_at..end_at as inclusive on both ends, so touching
    // bounds would hand the point on the seam to two windows.
    const from = new Date('2025-09-14T20:00:00Z');
    const to = new Date(from.getTime() + 365 * DAY);
    const windows = splitWindow(from, to, 30);

    expect(windows).toHaveLength(13);
    expect(windows[0].from).toEqual(from);
    expect(windows[windows.length - 1].to).toEqual(to);
    for (let i = 1; i < windows.length; i++) {
      expect(windows[i].from.getTime() - windows[i - 1].to.getTime()).toBe(1000);
    }
    for (const window of windows) {
      expect(window.to.getTime() - window.from.getTime()).toBeLessThanOrEqual(30 * DAY);
    }
  });

  it('DAWARICH-CITIES-003: bounds are whole seconds, the unit that goes on the wire', () => {
    const windows = splitWindow(new Date('2026-01-01T00:00:00.750Z'), new Date('2026-03-01T00:00:00.250Z'), 30);
    for (const window of windows) {
      expect(window.from.getMilliseconds()).toBe(0);
      expect(window.to.getMilliseconds()).toBe(0);
    }
  });

  it('DAWARICH-CITIES-004: a range that ends before it starts asks nothing', () => {
    expect(splitWindow(new Date('2026-09-02T00:00:00Z'), new Date('2026-09-01T00:00:00Z'), 30)).toEqual([]);
  });

  it('DAWARICH-CITIES-005: a city seen in two months adds up its time and keeps the later visit', () => {
    const merged = mergeVisitedCountries([
      [{ country: 'Germany', cities: [{ city: 'Rostock', points: 10, stayed_for: 90, timestamp: 1_700_000_000 }] }],
      [
        { country: 'Germany', cities: [{ city: 'Rostock', points: 5, stayed_for: 60, timestamp: 1_702_000_000 }, { city: 'Berlin', stayed_for: 120 }] },
        { country: 'Poland', cities: [{ city: 'Szczecin', stayed_for: 75, timestamp: 1_701_000_000 }] },
      ],
    ]);

    expect(merged).toEqual([
      {
        country: 'Germany',
        cities: [
          { city: 'Rostock', points: 15, stayed_for: 150, timestamp: 1_702_000_000 },
          { city: 'Berlin', stayed_for: 120 },
        ],
      },
      { country: 'Poland', cities: [{ city: 'Szczecin', stayed_for: 75, timestamp: 1_701_000_000 }] },
    ]);
  });

  it('DAWARICH-CITIES-006: an unvalidated payload loses its unnamed entries, not its countries', () => {
    const merged = mergeVisitedCountries([
      [
        null as never,
        { country: 42 as never, cities: [] },
        { country: 'Denmark', cities: null as never },
      ],
      [{ country: 'Denmark', cities: [null as never, {} as never, { city: 'Gedser', points: '7' as never }] }],
    ]);

    // A count that arrived as a string is still a count; a timestamp nobody sent
    // stays absent instead of turning into -Infinity.
    expect(merged).toEqual([{ country: 'Denmark', cities: [{ city: 'Gedser', points: '7' }] }]);

    const again = mergeVisitedCountries([
      [{ country: 'Denmark', cities: [{ city: 'Gedser', points: '7' as never }] }],
      [{ country: 'Denmark', cities: [{ city: 'Gedser', points: 3 }] }],
    ]);
    expect(again[0].cities[0]).toEqual({ city: 'Gedser', points: 10, stayed_for: undefined, timestamp: undefined });
  });
});
