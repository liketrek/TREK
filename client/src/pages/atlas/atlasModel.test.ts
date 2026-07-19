import { describe, it, expect } from 'vitest';
import { A2_TO_A3, normalizeRegionName } from './atlasModel';

describe('normalizeRegionName', () => {
  it('matches names that only differ by diacritics (Ile-de-France vs Île-de-France)', () => {
    expect(normalizeRegionName('Ile-de-France')).toBe(normalizeRegionName('Île-de-France'));
  });

  it('matches names that only differ by dash style and surrounding spaces', () => {
    expect(normalizeRegionName('Bourgogne – Franche-Comté')).toBe(normalizeRegionName('Bourgogne-Franche-Comté'));
  });

  it('is case-insensitive', () => {
    expect(normalizeRegionName('PROVENCE')).toBe(normalizeRegionName('provence'));
  });

  it('still distinguishes genuinely different names', () => {
    expect(normalizeRegionName('Bretagne')).not.toBe(normalizeRegionName('Brittany'));
  });
});

// Countries whose GeoJSON feature carries no usable ISO_A2 must be hardcoded in
// A2_TO_A3 (see the comment above the table) or they get no map handlers at all.
describe('A2_TO_A3 hardcoded entries (#1609)', () => {
  it('maps Kosovo (XK → XKX)', () => {
    expect(A2_TO_A3.XK).toBe('XKX');
  });

  it('resolves the shipped Kosovo feature (ADM0_A3=XKX, ISO_A2=null) to XK', () => {
    // Mirrors the onEachFeature fallback in useAtlas.ts: reverse lookup by A3,
    // then ISO_A2 — which is null for Kosovo in the bundled geoBoundaries data.
    const feature = { properties: { ADM0_A3: 'XKX', ISO_A2: null as string | null } };
    const a3 = feature.properties.ADM0_A3;
    const a3ToA2Entry = Object.entries(A2_TO_A3).find(([, v]) => v === a3);
    const isoA2 = feature.properties.ISO_A2;
    const countryCode = a3ToA2Entry ? a3ToA2Entry[0] : (isoA2 && isoA2 !== '-99' ? isoA2 : null);
    expect(countryCode).toBe('XK');
  });
});
