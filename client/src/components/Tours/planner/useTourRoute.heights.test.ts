import { describe, expect, it } from 'vitest';
import { interpolatedHeights } from './useTourRoute';

// FE-TOUR-ROUTE-HEIGHTS-001 to FE-TOUR-ROUTE-HEIGHTS-003

describe('interpolatedHeights (SKI-02)', () => {
  it('FE-TOUR-ROUTE-HEIGHTS-001: fills the points the elevation source missed straight between the known ones', () => {
    const line: Array<[number, number] | [number, number, number]> = [
      [47, 11],
      [47.001, 11, 1000],
      [47.002, 11],
      [47.003, 11],
      [47.004, 11, 1300],
      [47.005, 11],
    ];
    expect(interpolatedHeights(line)?.map((point) => point[2])).toEqual([1000, 1000, 1100, 1200, 1300, 1300]);
  });

  it('FE-TOUR-ROUTE-HEIGHTS-003: walks a long line once, gap after gap, each filled from its own two ends', () => {
    const at = (index: number): [number, number] | [number, number, number] =>
      index % 1000 === 0 ? [47 + index / 1e6, 11, index] : [47 + index / 1e6, 11];
    const line = Array.from({ length: 20_001 }, (_, index) => at(index));
    const heights = interpolatedHeights(line)?.map((point) => point[2]) ?? [];
    expect(heights).toHaveLength(20_001);
    expect(heights.every((height, index) => Math.abs(height - index) < 1e-6)).toBe(true);
    const ends: Array<[number, number] | [number, number, number]> = [
      [47, 11],
      [47.001, 11, 500],
      [47.002, 11],
      [47.003, 11, 700],
      [47.004, 11, 600],
      [47.005, 11],
    ];
    expect(interpolatedHeights(ends)?.map((point) => point[2])).toEqual([500, 500, 600, 700, 600, 600]);
  });

  it('FE-TOUR-ROUTE-HEIGHTS-002: a line without one known height has none to estimate from', () => {
    expect(
      interpolatedHeights([
        [47, 11],
        [47.001, 11],
      ])
    ).toBeNull();
  });
});
