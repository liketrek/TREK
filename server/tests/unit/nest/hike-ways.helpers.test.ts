/**
 * The pure halves of the round hikes and the ways of a leg the assistant
 * proposes: which way a call asks for, the points a found way runs through,
 * and the keys a search is kept under.
 */
import {
  legEndsOf,
  legWaysKey,
  percentOf,
  pinnedPointsOf,
  roadOf,
  roundPointsOf,
  roundSearchKey,
  rulesOf,
  wayIndexOf,
  wayKeyAt,
  wayMissing,
} from '../../../src/nest/tours/hike-ways.helpers';
import { HIKE_MAX_WAYPOINTS, TOURS_MAX_HIKING_DIFFICULTY } from '@trek/shared';

import { describe, expect, it } from 'vitest';

// HIKE-WAYS-HELP-001 to HIKE-WAYS-HELP-006

const A = { lat: 47.5, lng: 11.1, name: 'Car park' };
const B = { lat: 47.52, lng: 11.14 };
const C = { lat: 47.55, lng: 11.2, name: 'Hut' };

describe('the ways a call asks for', () => {
  it('HIKE-WAYS-HELP-001: a, b and c are the first, second and third way; a when left out', () => {
    expect([wayIndexOf(undefined), wayIndexOf('a'), wayIndexOf('b'), wayIndexOf('c')]).toEqual([0, 0, 1, 2]);
    expect([wayKeyAt(0), wayKeyAt(2), wayKeyAt(7)]).toEqual(['a', 'c', 'a']);
    expect(wayMissing('b', 1, null)).toEqual({ found: false, way: 'b', ways_found: 1, why: 'none_found' });
    expect(wayMissing(undefined, 0, 'no_valhalla')).toEqual({
      found: false,
      way: 'a',
      ways_found: 0,
      why: 'no_valhalla',
    });
  });

  it('HIKE-WAYS-HELP-002: the rules default to the hike’s limit and no preferences; shares read as whole percent', () => {
    expect(rulesOf({})).toEqual({ limit: TOURS_MAX_HIKING_DIFFICULTY, preferences: null });
    expect(rulesOf({ max_hiking_difficulty: 4 }).limit).toBe(4);
    expect([percentOf(0.084), percentOf(-0.05)]).toEqual([8, -5]);
  });
});

describe('the keys a search is kept under', () => {
  it('HIKE-WAYS-HELP-003: one search per user, trip, start to about a metre, length and rules', () => {
    const round = { name: 'Round', start: A, distance_km: 10 };
    expect(roundSearchKey(1, 2, round)).toBe(roundSearchKey(1, 2, { ...round, name: 'Other', round: 'c' }));
    expect(roundSearchKey(1, 2, round)).toBe(roundSearchKey(1, 2, { ...round, start: { ...A, lat: 47.500001 } }));
    expect(roundSearchKey(1, 2, round)).not.toBe(roundSearchKey(3, 2, round));
    expect(roundSearchKey(1, 2, round)).not.toBe(roundSearchKey(1, 2, { ...round, distance_km: 12 }));
    expect(roundSearchKey(1, 2, round)).not.toBe(roundSearchKey(1, 2, { ...round, max_hiking_difficulty: 4 }));
    const leg = { name: 'Hike', waypoints: [A, B, C], leg: 1 };
    expect(legWaysKey(1, 2, leg)).toBe(legWaysKey(1, 2, { ...leg, way: 'b' }));
    expect(legWaysKey(1, 2, leg)).not.toBe(legWaysKey(1, 2, { ...leg, leg: 2 }));
    expect(legWaysKey(1, 2, leg)).not.toBe(legWaysKey(1, 2, { ...leg, round_trip: true }));
  });
});

describe('the points of a way', () => {
  it('HIKE-WAYS-HELP-004: a round runs from its start through the spots its loop was steered through, and back', () => {
    expect(roundPointsOf(A, [B, { lat: 47.6, lng: 11.3 }])).toEqual({
      waypoints: [A, { lat: B.lat, lng: B.lng }, { lat: 47.6, lng: 11.3 }],
      round_trip: true,
    });
  });

  it('HIKE-WAYS-HELP-005: a leg runs between its two points, the way back of a round trip to its start', () => {
    expect(legEndsOf([A, B, C], false, 1)).toEqual({
      from: { lat: A.lat, lng: A.lng },
      to: { lat: B.lat, lng: B.lng },
    });
    expect(legEndsOf([A, B, C], true, 3)).toEqual({ from: { lat: C.lat, lng: C.lng }, to: { lat: A.lat, lng: A.lng } });
    expect(legEndsOf([A, B, C], false, 3)).toBeNull();
  });

  it('HIKE-WAYS-HELP-006: the pins of a leg go right after its first point, those of the way back last', () => {
    const pin = { lat: 47.51, lng: 11.12 };
    expect(pinnedPointsOf([A, B, C], 1, [pin])).toEqual([A, pin, B, C]);
    expect(pinnedPointsOf([A, B, C], 2, [pin])).toEqual([A, B, pin, C]);
    expect(pinnedPointsOf([A, B, C], 3, [pin])).toEqual([A, B, C, pin]);
    const full = Array.from({ length: HIKE_MAX_WAYPOINTS }, (_, index) => ({ lat: 47 + index / 100, lng: 11 }));
    expect(pinnedPointsOf(full, 1, [pin])).toBeNull();
    expect(roadOf([[47, 11]])).toEqual({ coordinates: [[47, 11]], distance: 0, duration: 0 });
  });
});
