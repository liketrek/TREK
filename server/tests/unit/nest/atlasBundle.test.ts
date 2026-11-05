import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import zlib from 'zlib';

// Data-integrity guard for the shipped Atlas region bundle. geoBoundaries fills
// shapeISO with the bare country code for some countries (every Spanish region got
// "ESP", every Chinese "CHN", also CL/OM), which made marking one region light up the
// whole country (#1217). build-atlas-geo.mjs now synthesizes a unique per-region code
// for those; this asserts the shipped bundle actually carries distinct codes.
// Countries with user-assigned ISO codes (Kosovo = XK/XKX) are absent from the
// upstream ISO list the builder's A3_TO_A2 map was sourced from, which shipped
// Kosovo with ISO_A2=null — unresolvable by the client, so it had no hover/click
// handlers and never appeared in search (#1609). Guard that the country bundle
// carries the alpha-2 code the client keys on.
describe('Atlas admin0 country bundle (#1609)', () => {
  const bundlePath = path.join(__dirname, '..', '..', '..', 'assets', 'atlas', 'admin0.geojson.gz');
  const features = JSON.parse(zlib.gunzipSync(fs.readFileSync(bundlePath)).toString()).features as {
    properties: { ISO_A2: string | null; ADM0_A3: string; NAME?: string };
    geometry: { type: string; coordinates: number[][][] | number[][][][] } | null;
  }[];

  it('ATLAS-BUNDLE-003 — Kosovo ships with a resolvable ISO_A2', () => {
    const kosovo = features.filter((f) => f.properties.ADM0_A3 === 'XKX');
    expect(kosovo.length, 'exactly one Kosovo feature').toBe(1);
    expect(kosovo[0].properties.ISO_A2).toBe('XK');
  });

  // The server's country index keeps every coordinate in an Int16Array ×100 (ADMIN0_SCALE in
  // country-borders.ts) and divides it back on use. A value with a third decimal comes back
  // changed, and one past ±327.67 wraps around without an error, so a rebuild with more
  // decimals (ADM0_DECIMALS) must fail here, not move borders.
  it('ATLAS-BUNDLE-010 — every admin0 coordinate round-trips through Int16 ×100 unchanged', () => {
    const int16 = new Int16Array(1);
    let values = 0;
    const lossy: string[] = [];
    for (const f of features) {
      const g = f.geometry;
      if (!g) continue;
      const parts = (g.type === 'Polygon' ? [g.coordinates] : g.coordinates) as number[][][][];
      for (const v of parts.flat(3)) {
        values++;
        int16[0] = Math.round(v * 100);
        if (int16[0] / 100 !== v) lossy.push(`${f.properties.ADM0_A3}: ${v} comes back as ${int16[0] / 100}`);
      }
    }
    expect(values / 2, 'coordinate pairs checked').toBeGreaterThan(2_000_000);
    expect(lossy.slice(0, 5)).toEqual([]);
  });
});

describe('Atlas admin1 region bundle (#1217)', () => {
  const dir = path.join(__dirname, '..', '..', '..', 'assets', 'atlas', 'admin1');
  const files = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.geojson.gz'))
    .map((name) => ({ name, text: zlib.gunzipSync(fs.readFileSync(path.join(dir, name))).toString() }));
  const features = files.flatMap(({ text }) => JSON.parse(text).features) as {
    properties: { iso_a2: string | null; iso_3166_2: string };
  }[];

  const regions = (a2: string) => features.filter((f) => f.properties.iso_a2 === a2);

  // The server joins countries for /regions/geo?countries= by cutting each file's
  // features out between these two, and a lookup reads the file its name points at.
  it('ATLAS-BUNDLE-007 — one compact FeatureCollection per country, named by its ISO_A2', () => {
    expect(files.length).toBeGreaterThan(150);
    for (const { name, text } of files) {
      expect(text.startsWith('{"type":"FeatureCollection","features":[{'), name).toBe(true);
      expect(text.endsWith('}]}'), name).toBe(true);
      const a2s = new Set(
        JSON.parse(text).features.map((f: { properties: { iso_a2: string } }) => f.properties.iso_a2),
      );
      expect(
        [...a2s].map((a2) => `${a2}.geojson.gz`),
        name,
      ).toEqual([name]);
    }
  });

  // admin1.geojson.gz stays for the two shipped migrations that read it; the server reads
  // the per-country files. Both have to carry the same regions.
  it('ATLAS-BUNDLE-008 — the per-country files hold exactly the features of admin1.geojson.gz', () => {
    const bundle = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(dir, '..', 'admin1.geojson.gz'))).toString())
      .features as unknown[];
    const key = (f: unknown) => JSON.stringify(f);
    expect(features.map(key).sort()).toEqual(bundle.map(key).sort());
  });

  // The server's region cache keeps every coordinate as an Int32 ×1000 (REGION_SCALE in
  // atlas-geo.ts) and divides it back on use. That is exact only while the bundle has no more
  // than three decimals (ADM1_DECIMALS); a rebuild with more must raise the scale with it.
  it('ATLAS-BUNDLE-009 — every admin1 coordinate round-trips through Int32 ×1000 unchanged', () => {
    type Geometry = { type: string; coordinates: number[][][] | number[][][][] };
    let values = 0;
    const lossy: string[] = [];
    for (const f of features as unknown as { properties: { iso_3166_2: string }; geometry: Geometry }[]) {
      const g = f.geometry;
      const parts = (g.type === 'Polygon' ? [g.coordinates] : g.coordinates) as number[][][][];
      for (const v of parts.flat(3)) {
        values++;
        const packed = Math.round(v * 1000);
        if (packed / 1000 !== v || Math.abs(packed) > 2 ** 31 - 1) lossy.push(`${f.properties.iso_3166_2}: ${v}`);
      }
    }
    expect(values / 2, 'coordinate pairs checked').toBeGreaterThan(3_000_000);
    expect(lossy.slice(0, 5)).toEqual([]);
  });

  it('ATLAS-BUNDLE-001 — previously-broken countries now have distinct region codes', () => {
    for (const a2 of ['ES', 'CN', 'CL', 'OM']) {
      const f = regions(a2);
      expect(f.length, `${a2} should ship regions`).toBeGreaterThan(1);
      expect(new Set(f.map((r) => r.properties.iso_3166_2)).size, `${a2} region codes must be unique`).toBe(f.length);
    }
  });

  it('ATLAS-BUNDLE-002 — countries with real ISO codes keep them and stay unique', () => {
    for (const a2 of ['DE', 'FR', 'US']) {
      const f = regions(a2);
      expect(f.length).toBeGreaterThan(1);
      // real ISO 3166-2 form, e.g. DE-BW
      expect(f.some((r) => /^[A-Z]{2}-[A-Z0-9]+$/.test(r.properties.iso_3166_2))).toBe(true);
      expect(new Set(f.map((r) => r.properties.iso_3166_2)).size).toBe(f.length);
    }
  });

  /*
   * geoBoundaries' GBR ADM1 is the four constituent countries, so a bundle built
   * from it has no polygon below "England" — a London borough marked as visited
   * has nothing to light up, and every English place reports "England" (#1974).
   * The builder ships GB at ADM2 for exactly that reason.
   *
   * This is the guard that would have caught it when it landed in 3.1.0: four
   * features for a whole country is not a region layer, it is a country layer
   * with extra steps.
   */
  it('ATLAS-BUNDLE-004 — Great Britain ships below the constituent-country level (#1974)', () => {
    const gb = regions('GB');
    expect(gb.length, 'GB must ship counties and boroughs, not the four nations').toBeGreaterThan(50);
    expect(new Set(gb.map((r) => r.properties.iso_3166_2)).size, 'GB region codes must be unique').toBe(gb.length);
  });

  it('ATLAS-BUNDLE-005 — the London boroughs are in it (#1974)', () => {
    const names = new Set(
      (features as unknown as { properties: { iso_a2: string | null; name?: string } }[])
        .filter((f) => f.properties.iso_a2 === 'GB')
        .map((f) => (f.properties.name || '').toLowerCase()),
    );
    for (const borough of ['camden', 'westminster', 'hackney', 'islington']) {
      expect(names.has(borough), `${borough} should be a region of its own`).toBe(true);
    }
  });

  it('ATLAS-BUNDLE-006 — China ships Guangdong Province, not Guangzhou Province', () => {
    const cn = (
      features as unknown as { properties: { iso_a2: string | null; name?: string; iso_3166_2: string } }[]
    ).filter((f) => f.properties.iso_a2 === 'CN');
    const names = cn.map((f) => f.properties.name);
    expect(names).toContain('Guangdong Province');
    expect(names).not.toContain('Guangzhou Province');
    expect(cn.some((f) => f.properties.iso_3166_2 === 'CN-GUANGDONGPROVINCE')).toBe(true);
    expect(cn.some((f) => f.properties.iso_3166_2 === 'CN-GUANGZHOUPROVINCE')).toBe(false);
  });
});
