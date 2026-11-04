// LONGITUDE-001 to LONGITUDE-004: longitudes from a repeated world copy back onto the real one (#2976).
import { wrapLongitude, wrapOptionalLongitude } from './longitude';

import { describe, expect, it } from 'vitest';

describe('wrapLongitude', () => {
  it('LONGITUDE-001: leaves a real longitude alone, the edges included', () => {
    for (const lng of [0, 13.4, -118.4, 174.8, 180, -180]) expect(wrapLongitude(lng)).toBe(lng);
  });

  it('LONGITUDE-002: brings a point on a neighbouring copy back to where it is', () => {
    expect(wrapLongitude(274.921875)).toBeCloseTo(-85.078125, 9);
    expect(wrapLongitude(-220)).toBeCloseTo(140, 9);
    expect(wrapLongitude(139.7 - 720)).toBeCloseTo(139.7, 9);
    expect(wrapLongitude(360)).toBe(0);
    expect(Object.is(wrapLongitude(-360), 0)).toBe(true);
  });

  it('LONGITUDE-003: hands a non-finite value back for the caller to reject', () => {
    expect(wrapLongitude(Number.NaN)).toBeNaN();
    expect(wrapLongitude(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY);
  });

  it('LONGITUDE-004: passes null and undefined through for optional columns', () => {
    expect(wrapOptionalLongitude(null)).toBeNull();
    expect(wrapOptionalLongitude(undefined)).toBeUndefined();
    expect(wrapOptionalLongitude(-220)).toBeCloseTo(140, 9);
  });
});
