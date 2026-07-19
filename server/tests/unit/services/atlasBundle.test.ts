import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
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
  }[];

  it('ATLAS-BUNDLE-003 — Kosovo ships with a resolvable ISO_A2', () => {
    const kosovo = features.filter(f => f.properties.ADM0_A3 === 'XKX');
    expect(kosovo.length, 'exactly one Kosovo feature').toBe(1);
    expect(kosovo[0].properties.ISO_A2).toBe('XK');
  });
});

describe('Atlas admin1 region bundle (#1217)', () => {
  const bundlePath = path.join(__dirname, '..', '..', '..', 'assets', 'atlas', 'admin1.geojson.gz');
  const features = JSON.parse(zlib.gunzipSync(fs.readFileSync(bundlePath)).toString()).features as {
    properties: { iso_a2: string | null; iso_3166_2: string };
  }[];

  const regions = (a2: string) => features.filter(f => f.properties.iso_a2 === a2);

  it('ATLAS-BUNDLE-001 — previously-broken countries now have distinct region codes', () => {
    for (const a2 of ['ES', 'CN', 'CL', 'OM']) {
      const f = regions(a2);
      expect(f.length, `${a2} should ship regions`).toBeGreaterThan(1);
      expect(new Set(f.map(r => r.properties.iso_3166_2)).size, `${a2} region codes must be unique`).toBe(f.length);
    }
  });

  it('ATLAS-BUNDLE-002 — countries with real ISO codes keep them and stay unique', () => {
    for (const a2 of ['DE', 'FR', 'US']) {
      const f = regions(a2);
      expect(f.length).toBeGreaterThan(1);
      // real ISO 3166-2 form, e.g. DE-BW
      expect(f.some(r => /^[A-Z]{2}-[A-Z0-9]+$/.test(r.properties.iso_3166_2))).toBe(true);
      expect(new Set(f.map(r => r.properties.iso_3166_2)).size).toBe(f.length);
    }
  });
});
