import { admin1AssetPath } from '../../../src/utils/country-borders';

import fs from 'fs';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import zlib from 'zlib';

// The packed admin-1 region cache behind getRegionFromCoords: Int32 ×1000 coordinates, a
// byte budget, least recently used countries out first. Each test imports atlas-geo afresh,
// so it starts from an empty cache.

const freshGeo = async () => {
  vi.resetModules();
  return import('../../../src/nest/atlas/atlas-geo');
};

const regionDir = path.dirname(admin1AssetPath('XX'));
const countryCodes = fs
  .readdirSync(regionDir)
  .filter((name) => name.endsWith('.geojson.gz'))
  .map((name) => name.slice(0, 2))
  .sort();

type Geometry = { type: string; coordinates: unknown };
type Feature = { properties: { iso_3166_2?: string; name?: string; name_en?: string }; geometry: Geometry | null };
const readFeatures = (cc: string) =>
  (JSON.parse(zlib.gunzipSync(fs.readFileSync(admin1AssetPath(cc))).toString('utf8')) as { features: Feature[] })
    .features;

function spyOnReads() {
  const read = vi.spyOn(fs, 'readFileSync');
  return (cc: string) =>
    read.mock.calls.filter(([file]) => String(file).endsWith(`${path.sep}${cc}.geojson.gz`)).length;
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ── The lookup as it was before the packing, kept as the reference ─────────
// Float64 rings, one box tuple per part, the same ray-cast: what getRegionFromCoords did
// before this cache, copied from atlas-geo.ts and country-borders.ts.

type OldRegion = { label: string; rings: Float64Array[]; polyRingCounts: number[]; boxes: number[][] };

function oldPack(f: Feature): OldRegion | null {
  const code = f.properties.iso_3166_2;
  if (!code || !f.geometry) return null;
  const g = f.geometry;
  const parts = (g.type === 'Polygon' ? [g.coordinates] : g.coordinates) as number[][][][];
  const rings: Float64Array[] = [];
  const polyRingCounts: number[] = [];
  const boxes: number[][] = [];
  for (const part of parts) {
    polyRingCounts.push(part.length);
    for (const ring of part) rings.push(Float64Array.from(ring.flat()));
    const lngs = part[0].map(([lng]) => lng);
    const lats = part[0].map(([, lat]) => lat);
    boxes.push([Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)]);
  }
  const name = f.properties.name_en || f.properties.name || code;
  return { label: `${code} ${name}`, rings, polyRingCounts, boxes };
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

function oldPointInGeometry(lng: number, lat: number, r: OldRegion): boolean {
  let ri = 0;
  for (const rc of r.polyRingCounts) {
    if (oldPointInFlatRing(lng, lat, r.rings[ri])) {
      let inHole = false;
      for (let h = 1; h < rc; h++) {
        if (oldPointInFlatRing(lng, lat, r.rings[ri + h])) {
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

function oldLookup(regions: OldRegion[], lat: number, lng: number): string | null {
  const candidates: { r: OldRegion; area: number }[] = [];
  for (const r of regions) {
    for (const [minLng, minLat, maxLng, maxLat] of r.boxes) {
      if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
        candidates.push({ r, area: (maxLng - minLng) * (maxLat - minLat) });
        break;
      }
    }
  }
  candidates.sort((a, b) => a.area - b.area);
  return candidates.find(({ r }) => oldPointInGeometry(lng, lat, r))?.r.label ?? null;
}

// Deterministic points per country: about `perCountry` vertices spread over all its rings,
// each exactly, 1e-7° to either side of it and of the next edge's middle (where a ray-cast
// is most fragile), plus random points in each region's box.
function testPoints(features: Feature[], perCountry: number): [number, number][] {
  let seed = 0x2f6b;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const regions = features.flatMap((f) => {
    if (!f.geometry) return [];
    const g = f.geometry;
    return [((g.type === 'Polygon' ? [g.coordinates] : g.coordinates) as number[][][][]).flat()];
  });
  const total = regions.flat().reduce((n, ring) => n + ring.length, 0);
  const step = Math.max(1, Math.floor(total / perCountry));
  const points: [number, number][] = [];
  let seen = 0;
  for (const rings of regions) {
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
    for (let k = 0; k < 5; k++) {
      points.push([minLat + random() * (maxLat - minLat), minLng + random() * (maxLng - minLng)]);
    }
  }
  return points;
}

// getRegionFromCoords does its work before it returns its promise, so lookups started one
// after another reach the cache in that order even when they are awaited together.
describe('getRegionFromCoords on the packed region cache', () => {
  it('ATLAS-SVC-051: answers every test point the way the Float64 lookup did, in every country', async () => {
    const geo = await freshGeo();
    const checks: { point: string; before: string | null; after: Promise<string | null> }[] = [];
    for (const cc of countryCodes) {
      const features = readFeatures(cc);
      const regions = features.map(oldPack).filter((r): r is OldRegion => r !== null);
      for (const [lat, lng] of testPoints(features, 400)) {
        checks.push({
          point: `${cc} ${lat},${lng}`,
          before: oldLookup(regions, lat, lng),
          after: geo.getRegionFromCoords(cc, lat, lng).then((r) => (r ? `${r.region_code} ${r.region_name}` : null)),
        });
      }
    }
    const answers = await Promise.all(checks.map((c) => c.after));
    const different = checks.flatMap((c, i) =>
      answers[i] === c.before ? [] : [`${c.point}: ${c.before} → ${answers[i]}`],
    );
    expect(checks.length).toBeGreaterThan(300_000);
    expect(checks.filter((c) => c.before).length / checks.length, 'most points are in a region').toBeGreaterThan(0.5);
    expect(different.slice(0, 10)).toEqual([]);
  }, 120_000);

  it('ATLAS-SVC-052: two lookups that miss the same country at once read and parse it once', async () => {
    const geo = await freshGeo();
    const readsOf = spyOnReads();
    const [ottawa, vancouver] = await Promise.all([
      geo.getRegionFromCoords('CA', 45.42, -75.69),
      geo.getRegionFromCoords('ca', 49.28, -123.12),
    ]);
    expect(ottawa?.region_code).toBe('CA-ON');
    expect(vancouver?.region_code).toBe('CA-BC');
    expect(readsOf('CA')).toBe(1);
  });

  it('ATLAS-SVC-053: keeps a country in use while every other one passes through', async () => {
    const geo = await freshGeo();
    const readsOf = spyOnReads();
    const answers = await Promise.all(
      countryCodes.flatMap((cc) => [geo.getRegionFromCoords(cc, 0, 0), geo.getRegionFromCoords('CA', 45.42, -75.69)]),
    );
    expect(new Set(answers.filter((_, i) => i % 2 === 1).map((r) => r?.region_code))).toEqual(new Set(['CA-ON']));
    expect(readsOf('CA')).toBe(1);
    // Not everything stayed: the countries read first had to go to make room.
    await geo.getRegionFromCoords(countryCodes[0], 0, 0);
    expect(readsOf(countryCodes[0])).toBe(2);
  }, 60_000);

  it('ATLAS-SVC-054: drops the least recently used country past the budget and reads it again', async () => {
    const geo = await freshGeo();
    const readsOf = spyOnReads();
    await geo.getRegionFromCoords('CA', 45.42, -75.69);
    await Promise.all(countryCodes.filter((cc) => cc !== 'CA').map((cc) => geo.getRegionFromCoords(cc, 0, 0)));
    expect(readsOf('CA')).toBe(1);
    expect((await geo.getRegionFromCoords('CA', 45.42, -75.69))?.region_code).toBe('CA-ON');
    expect(readsOf('CA')).toBe(2);
  }, 60_000);
});
