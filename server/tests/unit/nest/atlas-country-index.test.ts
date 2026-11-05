import { getAdmin0File, getCountryFromCoords } from '../../../src/utils/country-borders';

import fs from 'fs';
import { describe, expect, it } from 'vitest';
import zlib from 'zlib';

// The packed admin-0 country index behind getCountryFromCoords: Int16 ×100 coordinates in
// place of Float64Array rings.

type Geometry = { type: string; coordinates: unknown };
type Feature = { properties: { ISO_A2?: string | null }; geometry: Geometry | null };
const admin0 = getAdmin0File();
if (!admin0) throw new Error('admin0.geojson.gz missing');
const features = (JSON.parse(zlib.gunzipSync(fs.readFileSync(admin0)).toString('utf8')) as { features: Feature[] })
  .features;

// ── The lookup as it was before the packing, kept as the reference ─────────
// Float64 rings, the same boxes, micro-territories and ranking: what getCountryFromCoords
// did before this index, copied from country-borders.ts.

type OldGeom = { rings: Float64Array[]; polyRingCounts: number[] };
type Box = [number, number, number, number];

const MICRO_TERRITORY_BOXES: Record<string, Box> = {
  HK: [113.83, 22.15, 114.43, 22.56],
  MO: [113.53, 22.1, 113.6, 22.21],
  GI: [-5.36, 36.11, -5.33, 36.16],
  PR: [-67.3, 17.88, -65.22, 18.53],
  PS: [34.2, 29.5, 35.6, 32.6],
  XK: [20.0, 41.9, 21.8, 43.3],
};
const MICRO_BOX_MAX_AREA = 2.0;

function oldIndexes(): { polys: Map<string, OldGeom>; boxes: Map<string, Box[]> } {
  const polys = new Map<string, OldGeom>();
  const boxes = new Map<string, Box[]>();
  for (const f of features) {
    const raw = f.properties?.ISO_A2;
    if (!raw || raw === '-99' || !f.geometry) continue;
    const code = String(raw).toUpperCase();
    const g = f.geometry;
    const parts = (g.type === 'Polygon' ? [g.coordinates] : g.coordinates) as number[][][][];
    const rings: Float64Array[] = [];
    const polyRingCounts: number[] = [];
    const codeBoxes = boxes.get(code) ?? [];
    for (const part of parts) {
      polyRingCounts.push(part.length);
      for (const ring of part) rings.push(Float64Array.from(ring.flat()));
      const lngs = part[0].map(([lng]) => lng);
      const lats = part[0].map(([, lat]) => lat);
      codeBoxes.push([Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)]);
    }
    polys.set(code, { rings, polyRingCounts });
    boxes.set(code, codeBoxes);
  }
  for (const [code, box] of Object.entries(MICRO_TERRITORY_BOXES)) {
    if (!boxes.has(code)) boxes.set(code, [box]);
  }
  return { polys, boxes };
}

function oldPointInFlatRing(lng: number, lat: number, ring: Float64Array): boolean {
  let inside = false;
  const n = ring.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[2 * i],
      yi = ring[2 * i + 1];
    const xj = ring[2 * j],
      yj = ring[2 * j + 1];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function oldPointInGeometry(lng: number, lat: number, geom: OldGeom): boolean {
  let ri = 0;
  for (const rc of geom.polyRingCounts) {
    if (oldPointInFlatRing(lng, lat, geom.rings[ri])) {
      let inHole = false;
      for (let h = 1; h < rc; h++) {
        if (oldPointInFlatRing(lng, lat, geom.rings[ri + h])) {
          inHole = true;
          break;
        }
      }
      if (!inHole) return true;
    }
    ri += rc;
  }
  return false;
}

function oldLookup(old: ReturnType<typeof oldIndexes>, lat: number, lng: number): string | null {
  const candidates: { code: string; area: number }[] = [];
  for (const [code, boxes] of old.boxes) {
    for (const [minLng, minLat, maxLng, maxLat] of boxes) {
      if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
        candidates.push({ code, area: (maxLng - minLng) * (maxLat - minLat) });
        break;
      }
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.area - b.area);
  let looseBoxFallback: string | null = null;
  for (const { code, area } of candidates) {
    const poly = old.polys.get(code);
    if (!poly) {
      if (area <= MICRO_BOX_MAX_AREA) return code;
      if (looseBoxFallback === null) looseBoxFallback = code;
      continue;
    }
    if (oldPointInGeometry(lng, lat, poly)) return code;
  }
  return looseBoxFallback ?? candidates[0].code;
}

// Deterministic points per country: about `perCountry` vertices spread over all its rings,
// each exactly, 1e-7° to either side of it and of the next edge's middle (where a ray-cast
// is most fragile), plus random points in the country's box.
function testPoints(f: Feature, perCountry: number, random: () => number): [number, number][] {
  if (!f.geometry) return [];
  const g = f.geometry;
  const rings = ((g.type === 'Polygon' ? [g.coordinates] : g.coordinates) as number[][][][]).flat();
  const total = rings.reduce((n, ring) => n + ring.length, 0);
  const step = Math.max(1, Math.floor(total / perCountry));
  const points: [number, number][] = [];
  let seen = 0;
  let minLng = Infinity,
    minLat = Infinity,
    maxLng = -Infinity,
    maxLat = -Infinity;
  for (const ring of rings) {
    for (let i = 0; i < ring.length - 1; i++) {
      const [lng, lat] = ring[i];
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      if (seen++ % step !== 0) continue;
      const midLng = (lng + ring[i + 1][0]) / 2;
      const midLat = (lat + ring[i + 1][1]) / 2;
      points.push(
        [lat, lng],
        [lat + 1e-7, lng + 1e-7],
        [lat - 1e-7, lng - 1e-7],
        [midLat + 1e-7, midLng],
        [midLat - 1e-7, midLng],
      );
    }
  }
  for (let k = 0; k < 20; k++) {
    points.push([minLat + random() * (maxLat - minLat), minLng + random() * (maxLng - minLng)]);
  }
  return points;
}

describe('getCountryFromCoords on the packed country index', () => {
  it('ATLAS-SVC-055: answers every test point the way the Float64 lookup did, in every country', () => {
    const old = oldIndexes();
    let seed = 0x2f6b;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    let checked = 0;
    let inCountry = 0;
    const different: string[] = [];
    for (const f of features) {
      // Each point near a border is tested against the big polygons whose boxes cover it
      // (RU, CA, US, CN, ...), so 100 vertices per country already take ~15s.
      for (const [lat, lng] of testPoints(f, 100, random)) {
        const before = oldLookup(old, lat, lng);
        const after = getCountryFromCoords(lat, lng);
        checked++;
        if (before) inCountry++;
        if (after !== before) different.push(`${f.properties.ISO_A2} ${lat},${lng}: ${before} → ${after}`);
      }
    }
    expect(checked).toBeGreaterThan(100_000);
    expect(inCountry / checked, 'most points are in a country').toBeGreaterThan(0.9);
    expect(different.slice(0, 10)).toEqual([]);
  }, 120_000);
});
