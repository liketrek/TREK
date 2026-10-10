import { haversineMetres } from '../geo/haversine';
import { computeTourMetrics } from './tours.metrics';

import { describe, expect, it } from 'vitest';

describe('computeTourMetrics', () => {
  it('sums distance and both elevation directions over a 3D track', () => {
    const m = computeTourMetrics([
      [47, 11, 1000],
      [47.01, 11, 1100],
      [47.02, 11, 1050],
    ]);
    expect(m.hasElevation).toBe(true);
    expect(m.elevationGainM).toBe(100);
    expect(m.elevationLossM).toBe(50);
    expect(m.distanceKm).toBeCloseTo((haversineMetres(47, 11, 47.01, 11) * 2) / 1000, 6);
  });

  it('reports no elevation when one point lacks it', () => {
    const m = computeTourMetrics([
      [47, 11, 1000],
      [47.01, 11],
    ]);
    expect(m).toMatchObject({ hasElevation: false, elevationGainM: null, elevationLossM: null });
    expect(m.distanceKm).toBeGreaterThan(1);
  });

  it('yields a zero-metric result below two points', () => {
    expect(computeTourMetrics([[47, 11, 1000]])).toEqual({
      distanceKm: 0,
      elevationGainM: null,
      elevationLossM: null,
      hasElevation: false,
    });
  });
});

describe('haversineMetres', () => {
  it('stays finite for antipodal points', () => {
    expect(haversineMetres(0, 0, 0, 180)).toBeCloseTo(Math.PI * 6371000, 0);
  });
});
