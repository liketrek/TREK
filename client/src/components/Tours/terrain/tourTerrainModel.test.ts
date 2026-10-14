import { describe, expect, it } from 'vitest';
import type { DistanceIndexedProfileSample } from '../../../utils/routeGeometry';
import {
  bearingDegrees,
  easeBearing,
  GRADE_BANDS,
  gradeBand,
  gradeSegments,
  replayMetresPerSecond,
  terrainStats,
} from './tourTerrainModel';

/** A walk due east from 46 N 7 E, one sample every `step` metres, at the heights `elevation` returns. */
function profile(count: number, step: number, elevation: (distance: number) => number): DistanceIndexedProfileSample[] {
  return Array.from({ length: count }, (_, i) => {
    const distanceMeters = i * step;
    return { distanceMeters, elevationMeters: elevation(distanceMeters), lat: 46, lng: 7 + distanceMeters / 77_000 };
  });
}

describe('gradeBand', () => {
  it('sorts a grade into the band it is below, uphill and downhill alike', () => {
    expect(gradeBand(0).key).toBe('flat');
    expect(gradeBand(4.9).key).toBe('flat');
    expect(gradeBand(5).key).toBe('gentle');
    expect(gradeBand(-12).key).toBe('moderate');
    expect(gradeBand(20).key).toBe('steep');
    expect(gradeBand(-30).key).toBe('verySteep');
  });

  it('falls back to the steepest band for a grade no band holds', () => {
    expect(gradeBand(Number.NaN)).toBe(GRADE_BANDS[GRADE_BANDS.length - 1]);
    expect(gradeBand(Infinity).key).toBe('verySteep');
  });

  it('gives every band its own map paint', () => {
    expect(new Set(GRADE_BANDS.map((band) => band.paint)).size).toBe(GRADE_BANDS.length);
  });
});

describe('gradeSegments', () => {
  it('needs two located samples', () => {
    expect(gradeSegments([])).toEqual([]);
    expect(gradeSegments(profile(1, 100, () => 0))).toEqual([]);
    expect(
      gradeSegments([
        { distanceMeters: 0, elevationMeters: 0 },
        { distanceMeters: 100, elevationMeters: 10 },
      ])
    ).toEqual([]);
  });

  it('cuts the route into one piece per pair of samples, as [lng, lat]', () => {
    const samples = profile(5, 100, (d) => d / 10);
    const segments = gradeSegments(samples);
    expect(segments).toHaveLength(4);
    expect(segments[0].from).toEqual([samples[0].lng, samples[0].lat]);
    expect(segments[0].to).toEqual([samples[1].lng, samples[1].lat]);
    for (const segment of segments) {
      expect(segment.grade).toBeCloseTo(10);
      expect(segment.signedGrade).toBeCloseTo(10);
    }
  });

  it('keeps the sign for a descent and the absolute value for the colour', () => {
    const [segment] = gradeSegments(profile(4, 100, (d) => 500 - d / 5));
    expect(segment.signedGrade).toBeCloseTo(-20);
    expect(segment.grade).toBeCloseTo(20);
  });

  it('skips samples without a position', () => {
    const samples = [...profile(3, 100, () => 0), { distanceMeters: 300, elevationMeters: 0 }];
    expect(gradeSegments(samples)).toHaveLength(2);
  });

  it('reads a window without length as flat instead of dividing by zero', () => {
    const samples = [0, 1, 2].map((i) => ({ distanceMeters: 0, elevationMeters: i * 10, lat: 46, lng: 7 + i / 1000 }));
    expect(gradeSegments(samples).map((segment) => segment.grade)).toEqual([0, 0]);
  });

  it('smooths a single jittery sample over the window', () => {
    const samples = profile(21, 20, (d) => (d === 200 ? 4 : 0));
    const steepest = Math.max(...gradeSegments(samples).map((segment) => segment.grade));
    // 4 m over 20 m would read 20 %; over the 200 m window it stays gentle.
    expect(steepest).toBeLessThan(5);
  });
});

describe('terrainStats', () => {
  it('is empty for a tour without a located profile', () => {
    expect(terrainStats([])).toEqual({
      summit: null,
      lowest: null,
      steepest: null,
      bandMeters: { flat: 0, gentle: 0, moderate: 0, steep: 0, verySteep: 0 },
      totalMeters: 0,
    });
  });

  it('finds the summit, the lowest point and the steepest 200 m', () => {
    // Flat for 500 m, then 20 % up for 500 m.
    const samples = profile(11, 100, (d) => (d <= 500 ? 1000 : 1000 + (d - 500) / 5));
    const stats = terrainStats(samples);
    expect(stats.summit).toEqual({ lat: 46, lng: samples[10].lng, elevationMeters: 1100, distanceMeters: 1000 });
    expect(stats.lowest?.elevationMeters).toBe(1000);
    expect(stats.lowest?.distanceMeters).toBe(0);
    expect(stats.steepest?.grade).toBeCloseTo(20);
    expect(stats.steepest?.startMeters).toBeGreaterThanOrEqual(500);
    expect(stats.totalMeters).toBe(1000);
  });

  it('shares the walked metres out between the bands', () => {
    const stats = terrainStats(profile(11, 100, (d) => (d <= 500 ? 1000 : 1000 + (d - 500) / 5)));
    const walked = Object.values(stats.bandMeters).reduce((sum, metres) => sum + metres, 0);
    expect(walked).toBe(1000);
    expect(stats.bandMeters.flat).toBeGreaterThan(0);
    expect(stats.bandMeters.steep).toBeGreaterThan(0);
  });

  it('names no steepest stretch on a route shorter than 200 m', () => {
    expect(terrainStats(profile(2, 100, (d) => d)).steepest).toBeNull();
  });
});

describe('camera helpers', () => {
  it('measures the compass bearing between two points', () => {
    expect(bearingDegrees({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(0);
    expect(bearingDegrees({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(90);
    expect(bearingDegrees({ lat: 1, lng: 0 }, { lat: 0, lng: 0 })).toBeCloseTo(180);
    expect(bearingDegrees({ lat: 0, lng: 1 }, { lat: 0, lng: 0 })).toBeCloseTo(270);
  });

  it('eases the heading the short way round', () => {
    expect(easeBearing(350, 10, 0.5)).toBeCloseTo(0);
    expect(easeBearing(10, 350, 0.5)).toBeCloseTo(0);
    expect(easeBearing(90, 180, 1)).toBeCloseTo(180);
    expect(easeBearing(90, 180, 0)).toBeCloseTo(90);
  });

  it('plays a route in about 45 seconds, never slower than 20 m a second', () => {
    expect(replayMetresPerSecond(9000)).toBe(200);
    expect(replayMetresPerSecond(450)).toBe(20);
    expect(replayMetresPerSecond(9000, 90)).toBe(100);
  });
});
