// TOUR-ROUND-GEOMETRY-001 to TOUR-ROUND-GEOMETRY-005: where a round hike's loop is steered
// through, and how much of a line covers ground twice or the ground of another (RTE-03).
import { haversineMetres } from '../geo/haversine';
import { loopSpots, retracedShare, sharedShare, spotToward, STRAIGHT_PER_RADIUS_M } from './round-hike-geometry';

import { describe, expect, it } from 'vitest';

const START = { lat: 47.5, lng: 11.1 };
type Spot = { lat: number; lng: number };
const meters = (a: Spot | undefined, b: Spot | undefined) =>
  a && b ? haversineMetres(a.lat, a.lng, b.lat, b.lng) : NaN;
const line = (...spots: { lat: number; lng: number }[]): [number, number][] => spots.map(({ lat, lng }) => [lat, lng]);

describe('spotToward', () => {
  it('TOUR-ROUND-GEOMETRY-001: lies the asked distance away in the asked direction', () => {
    const north = spotToward(START, 0, 1000);
    expect(meters(START, north)).toBeCloseTo(1000, 0);
    expect(north.lat).toBeGreaterThan(START.lat);
    expect(north.lng).toBeCloseTo(START.lng, 9);
    const east = spotToward(START, 90, 2500);
    expect(meters(START, east)).toBeCloseTo(2500, 0);
    expect(east.lng).toBeGreaterThan(START.lng);
    // Across the date line the longitude comes back into range.
    expect(spotToward({ lat: 0, lng: 179.999 }, 90, 1000).lng).toBeLessThan(-179.99);
  });
});

describe('loopSpots', () => {
  it('TOUR-ROUND-GEOMETRY-002: three corners of a square in a circle touching the start, its centre toward the bearing', () => {
    const radius = 1000;
    const spots = loopSpots(START, 90, radius);
    expect(spots).toHaveLength(3);
    const centre = spotToward(START, 90, radius);
    for (const spot of spots) expect(meters(centre, spot)).toBeCloseTo(radius, 0);
    // The far corner lies opposite the start, a diameter away.
    expect(meters(START, spots[1])).toBeCloseTo(2 * radius, 0);
    const corners = [START, ...spots, START];
    let straight = 0;
    for (let i = 1; i < corners.length; i += 1) straight += meters(corners[i - 1], corners[i]);
    expect(straight).toBeCloseTo(STRAIGHT_PER_RADIUS_M * radius, -1);
  });
});

describe('retracedShare', () => {
  it('TOUR-ROUND-GEOMETRY-003: a loop covers little ground twice, a way there and back all of it', () => {
    const loop = line(START, ...loopSpots(START, 0, 800), START);
    expect(retracedShare(loop)).toBeLessThan(0.1);
    const far = spotToward(START, 45, 3000);
    expect(retracedShare(line(START, far, START))).toBeGreaterThan(0.9);
    // A loop with a long way in and out shares that way.
    const gate = spotToward(START, 0, 1500);
    const lollipop = line(START, gate, ...loopSpots(gate, 0, 300), gate, START);
    expect(retracedShare(lollipop)).toBeGreaterThan(0.4);
  });

  it('TOUR-ROUND-GEOMETRY-004: a line too short to sample shares nothing', () => {
    expect(retracedShare([])).toBe(0);
    expect(retracedShare(line(START))).toBe(0);
    expect(retracedShare(line(START, START))).toBe(0);
  });
});

describe('sharedShare', () => {
  it('TOUR-ROUND-GEOMETRY-005: the share of one line on the ground of another', () => {
    const loop = line(START, ...loopSpots(START, 0, 800), START);
    expect(sharedShare(loop, loop)).toBe(1);
    const other = line(START, ...loopSpots(START, 180, 800), START);
    expect(sharedShare(loop, other)).toBeLessThan(0.1);
    // Half of a line lies on the other: the share says so, one way round.
    const half = line(START, spotToward(START, 0, 1000));
    const whole = line(START, spotToward(START, 0, 2000));
    expect(sharedShare(half, whole)).toBe(1);
    expect(sharedShare(whole, half)).toBeCloseTo(0.5, 1);
    expect(sharedShare([], loop)).toBe(0);
    expect(sharedShare(loop, line(START))).toBe(0);
    expect(sharedShare(line(START, START), loop)).toBe(1);
  });
});
