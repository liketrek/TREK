import { describe, expect, it } from 'vitest';
import { CORRIDOR_M, compareRoutes, deriveControlPoints, lineLengthMeters, type TrackPoint } from './gpxConversion';

/** About 111 m per 0.001 degree of latitude. */
const north = (lat: number, lng = 11): TrackPoint => ({ lat, lng });

/** A straight line north, one point every ~11 m, `km` long. */
function straightTrack(km: number): TrackPoint[] {
  const steps = Math.round(km * 90);
  return Array.from({ length: steps + 1 }, (_, i) => north(47 + (i * km) / steps / 111.2));
}

/** An L: north for `legKm`, then east for `legKm`. */
function bentTrack(legKm: number): TrackPoint[] {
  const up = straightTrack(legKm);
  const corner = up[up.length - 1];
  const east = Array.from({ length: 90 }, (_, i) => ({
    lat: corner.lat,
    lng: corner.lng + ((i + 1) * legKm) / 90 / 75.8,
  }));
  return [...up, ...east];
}

describe('deriveControlPoints', () => {
  it('PR1-05A: keeps start and end and nothing else on a short straight track', () => {
    const track = straightTrack(1);
    const points = deriveControlPoints(track);
    expect(points).toEqual([track[0], track[track.length - 1]]);
  });

  it('PR1-05A: keeps the bend a track turns at', () => {
    const track = bentTrack(1);
    const points = deriveControlPoints(track);
    expect(points.length).toBe(3);
    const corner = track[90];
    expect(points[1].lat).toBeCloseTo(corner.lat, 3);
    expect(points[1].lng).toBeCloseTo(corner.lng, 3);
  });

  it('PR1-05A: adds a point wherever a track runs on longer than the longest gap', () => {
    const track = straightTrack(10);
    const points = deriveControlPoints(track, { maxGapM: 2_500 });
    expect(points.length).toBeGreaterThanOrEqual(5);
    for (let i = 1; i < points.length; i += 1) {
      expect(lineLengthMeters([points[i - 1], points[i]])).toBeLessThanOrEqual(2_600);
    }
  });

  it('PR1-05A: never keeps more points than asked for, start and end included', () => {
    // A zigzag every point of which is a bend.
    const zigzag = Array.from({ length: 400 }, (_, i) => ({ lat: 47 + i * 0.0009, lng: 11 + (i % 2) * 0.002 }));
    const points = deriveControlPoints(zigzag, { maxPoints: 12 });
    expect(points.length).toBeLessThanOrEqual(12);
    expect(points[0]).toEqual(zigzag[0]);
    expect(points[points.length - 1]).toEqual(zigzag[zigzag.length - 1]);
  });

  it('PR1-05A: merges points closer than the minimum spacing, keeping start and end', () => {
    const track = [north(47), north(47.0002), north(47.0004), north(47.02)];
    const points = deriveControlPoints(track, { minSpacingM: 150 });
    expect(points[0]).toEqual(track[0]);
    expect(points[points.length - 1]).toEqual(track[3]);
    expect(points).not.toContainEqual(track[1]);
  });

  it('PR1-05A: has nothing to offer for a track of fewer than two points', () => {
    expect(deriveControlPoints([])).toEqual([]);
    expect(deriveControlPoints([north(47)])).toEqual([]);
  });
});

describe('compareRoutes', () => {
  it('PR1-05A: a suggestion on the track itself lies wholly in the corridor', () => {
    const track = straightTrack(2);
    const result = compareRoutes(track, [track[0], track[track.length - 1]]);
    expect(result.withinCorridor).toBe(1);
    expect(result.maxDeviationM).toBeLessThan(1);
    expect(result.originalKm).toBeCloseTo(2, 1);
    expect(result.suggestionKm).toBeCloseTo(2, 1);
  });

  it('PR1-05A: a suggestion that cuts a corner says how far it strays and for how much of the track', () => {
    const track = bentTrack(1);
    const shortcut = [track[0], track[track.length - 1]];
    const result = compareRoutes(track, shortcut);
    expect(result.maxDeviationM).toBeGreaterThan(500);
    expect(result.withinCorridor).toBeLessThan(0.5);
    expect(result.suggestionKm).toBeLessThan(result.originalKm);
  });

  it('PR1-05A: counts a stray of exactly the corridor width as followed', () => {
    const track = [north(47), north(47.001)];
    const offset = CORRIDOR_M / 75_800; // degrees of longitude for the corridor width at 47° N
    const beside = track.map((point) => ({ lat: point.lat, lng: point.lng + offset * 0.99 }));
    expect(compareRoutes(track, beside).withinCorridor).toBe(1);
  });

  it('PR1-05A: compares a one-point suggestion by plain distance', () => {
    const result = compareRoutes([north(47), north(47.001)], [north(47)]);
    expect(result.maxDeviationM).toBeGreaterThan(100);
  });
});
