/**
 * ROADTRIP-ROUTERUN-001..003: a drive the router answered in pieces reads as one drive.
 *
 * A via cuts a stop-to-stop drive into one leg per waypoint pair. The numbers were summed
 * back together, but the printed texts stayed those of the first piece, and the phone reads
 * a segment's text before its numbers: a 3.9 mi drive into the next day said "1.9 mi in
 * 6 min" (#2461).
 */
import type { RoadtripStop, RouteSegment } from './planning-types';
import { formatDurationShort } from './roadtripModel';
import { foldRouteRun, mergeRouteSegments, roadtripLegKey } from './routeRun';
import { formatDistance } from './units';

import { describe, expect, it } from 'vitest';

const piece = (from: [number, number], to: [number, number], distance: number, duration: number): RouteSegment => ({
  mid: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2],
  from,
  to,
  distance,
  duration,
  distanceText: formatDistance(distance / 1000, 'imperial'),
  durationText: formatDurationShort(duration),
  drivingText: formatDurationShort(duration),
  walkingText: '',
});

const A: [number, number] = [52.37, 4.89];
const VIA: [number, number] = [52.36, 4.9];
const B: [number, number] = [52.35, 4.87];

describe('mergeRouteSegments', () => {
  it('ROADTRIP-ROUTERUN-001: the pieces of one drive add up, and their texts are written from the sums', () => {
    const first = piece(A, VIA, 2996, 417);
    const second = piece(VIA, B, 3280, 423);

    const merged = mergeRouteSegments([first, second], 'imperial');

    expect(merged.distance).toBe(6276);
    expect(merged.duration).toBe(840);
    expect(merged.distanceText).toBe(formatDistance(6.276, 'imperial'));
    expect(merged.distanceText).not.toBe(first.distanceText);
    expect(merged.durationText).toBe('14 min');
    expect(merged.drivingText).toBe('14 min');
    // The drive ends where its last piece does, not at the via.
    expect(merged.from).toEqual(A);
    expect(merged.to).toEqual(B);
  });

  it('ROADTRIP-ROUTERUN-002: a drive the router answered in one piece is handed on as it came', () => {
    const only = piece(A, B, 3000, 600);

    expect(mergeRouteSegments([only], 'metric')).toBe(only);
  });
});

describe('foldRouteRun', () => {
  it('ROADTRIP-ROUTERUN-003: a stop pair bent through a via gets the whole drive and its texts, in the reader unit', () => {
    const stops = [
      { lat: A[0], lng: A[1] },
      { lat: B[0], lng: B[1] },
    ] as unknown as RoadtripStop[];
    const legs = [piece(A, VIA, 2996, 417), piece(VIA, B, 3280, 423)];

    const folded = foldRouteRun(stops, [0, 2], { coordinates: [A, VIA, B], legs }, 'driving', 'metric');
    const seg = folded[roadtripLegKey(stops[0]!, stops[1]!)]!.seg;

    expect(seg.distance).toBe(6276);
    expect(seg.duration).toBe(840);
    expect(seg.distanceText).toBe(formatDistance(6.276, 'metric'));
    expect(seg.durationText).toBe('14 min');
    expect(seg.mode).toBe('driving');
  });
});
