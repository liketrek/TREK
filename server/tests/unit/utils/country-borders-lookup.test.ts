import { getCountryFromCoords, pointInPackedGeometry, type PackedGeom } from '../../../src/utils/country-borders';

import { describe, expect, it } from 'vitest';

const SCALE = 100;

/** Packs polygons given as rings of [lng, lat] the way both bundles are packed. */
function pack(polygons: [number, number][][][]): PackedGeom {
  const rings = polygons.flat();
  const coords = new Int16Array(rings.reduce((n, ring) => n + ring.length, 0) * 2);
  const ringStarts = new Uint32Array(rings.length + 1);
  let p = 0;
  for (const [r, ring] of rings.entries()) {
    ringStarts[r] = p;
    for (const [lng, lat] of ring) {
      coords[2 * p] = Math.round(lng * SCALE);
      coords[2 * p + 1] = Math.round(lat * SCALE);
      p++;
    }
  }
  ringStarts[rings.length] = p;
  return { coords, ringStarts, polyRingCounts: Uint32Array.from(polygons.map((polygon) => polygon.length)) };
}

const square = (minLng: number, minLat: number, size: number): [number, number][] => [
  [minLng, minLat],
  [minLng + size, minLat],
  [minLng + size, minLat + size],
  [minLng, minLat + size],
  [minLng, minLat],
];

describe('pointInPackedGeometry', () => {
  // An island at the origin, and a second one far east of it with a lake in the middle.
  const geom = pack([[square(0, 0, 2)], [square(10, 10, 6), square(12, 12, 2)]]);
  const inside = (lng: number, lat: number) => pointInPackedGeometry(lng, lat, geom, SCALE);

  it('BORDERS-001: finds a point in any polygon of the geometry, not only the first', () => {
    expect(inside(1, 1)).toBe(true);
    expect(inside(11, 11)).toBe(true);
    expect(inside(15.5, 15.5)).toBe(true);
  });

  it('BORDERS-002: a point in a hole is outside, a point between the polygons too', () => {
    expect(inside(13, 13)).toBe(false);
    expect(inside(5, 5)).toBe(false);
    expect(inside(1, 11)).toBe(false);
    expect(inside(11, 1)).toBe(false);
  });

  it('BORDERS-003: answers a point on or beside a box edge as the ray-cast alone does', () => {
    // The even-odd rule counts the west and south edges in and the east and north ones out.
    expect(inside(0, 1)).toBe(true);
    expect(inside(1, 0)).toBe(true);
    expect(inside(2, 1)).toBe(false);
    expect(inside(1, 2)).toBe(false);
    expect(inside(-1e-7, 1)).toBe(false);
    expect(inside(2 - 1e-7, 1)).toBe(true);
    expect(inside(16 + 1e-7, 11)).toBe(false);
    expect(inside(10, 16 - 1e-7)).toBe(true);
  });

  it('BORDERS-004: gives the same answers on a second pass over the same geometry', () => {
    const points: [number, number][] = [
      [1, 1],
      [13, 13],
      [15, 11],
      [9.99, 11],
      [30, 30],
    ];
    const first = points.map(([lng, lat]) => inside(lng, lat));
    expect(points.map(([lng, lat]) => inside(lng, lat))).toEqual(first);
    expect(first).toEqual([true, false, true, false, false]);
  });
});

describe('getCountryFromCoords', () => {
  it('BORDERS-005: answers a pair it has seen before the same way, a pair in no country included', () => {
    const tokyo = getCountryFromCoords(35.68, 139.76);
    const midPacific = getCountryFromCoords(-48.5, -128.5);

    expect(tokyo).toBe('JP');
    expect(midPacific).toBeNull();
    expect(getCountryFromCoords(35.68, 139.76)).toBe(tokyo);
    expect(getCountryFromCoords(-48.5, -128.5)).toBeNull();
    // Latitude and longitude are not interchangeable in the remembered pair.
    expect(getCountryFromCoords(139.76, 35.68)).not.toBe('JP');
  });

  it('BORDERS-006: still answers right after more pairs than it remembers have passed through', () => {
    expect(getCountryFromCoords(48.86, 2.35)).toBe('FR');
    // Open ocean south-east of Pitcairn: in no country's box, so each lookup is cheap.
    for (let i = 0; i < 20_500; i++) getCountryFromCoords(-50 + (i % 100) * 0.01, -130 + Math.floor(i / 100) * 0.01);

    expect(getCountryFromCoords(48.86, 2.35)).toBe('FR');
    expect(getCountryFromCoords(-50, -130)).toBeNull();
  });
});
