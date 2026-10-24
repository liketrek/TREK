import { describe, expect, it } from 'vitest';

import { haversineKm, withinDayTripRange } from './geo';

// FE-UTIL-GEO-001 to FE-UTIL-GEO-005

describe('haversineKm', () => {
  it('FE-UTIL-GEO-001: measures a degree of latitude and nothing between a point and itself', () => {
    expect(haversineKm({ lat: 48.1, lng: 11.6 }, { lat: 48.1, lng: 11.6 })).toBe(0);
    expect(haversineKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(111.19, 1);
  });

  it('FE-UTIL-GEO-002: a near antipodal pair is half the globe, not NaN', () => {
    // Rounding pushes the haversine term a hair past 1 for this pair, where asin is undefined.
    const km = haversineKm({ lat: 47.3812, lng: -10.8827 }, { lat: -47.3812001, lng: 169.1173 });
    expect(km).toBeCloseTo(6371 * Math.PI, 3);
  });

  it('FE-UTIL-GEO-003: is the same both ways', () => {
    const a = { lat: 35.68, lng: 139.69 };
    const b = { lat: 34.05, lng: -118.24 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 9);
    expect(haversineKm(a, b)).toBeGreaterThan(8700);
    expect(haversineKm(a, b)).toBeLessThan(8900);
  });

  it('FE-UTIL-GEO-004: an exact antipodal pair is half the globe', () => {
    expect(haversineKm({ lat: 0, lng: 0 }, { lat: 0, lng: 180 })).toBeCloseTo(6371 * Math.PI, 3);
  });

  it('FE-UTIL-GEO-005: a stop counts as a day trip up to 150 km away', () => {
    expect(withinDayTripRange({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBe(true);
    expect(withinDayTripRange({ lat: 0, lng: 0 }, { lat: 2, lng: 0 })).toBe(false);
  });
});
