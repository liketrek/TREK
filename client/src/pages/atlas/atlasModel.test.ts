import { describe, it, expect } from 'vitest';
import {
  A2_TO_A3,
  countryStatus,
  isCountryVisible,
  normalizeRegionName,
  withCountryMarkedVisited,
  type AtlasData,
} from './atlasModel';

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

// Trip-date driven visit status (#1048). The three helpers below are the only place
// the client decides what "been there" means, so every mark flow shares one answer.
describe('countryStatus', () => {
  it('treats a country without a status as visited (older server, no #1048 field)', () => {
    expect(countryStatus({})).toBe('visited');
  });

  it('passes an explicit status through', () => {
    expect(countryStatus({ status: 'visited' })).toBe('visited');
    expect(countryStatus({ status: 'planned' })).toBe('planned');
    expect(countryStatus({ status: 'idea' })).toBe('idea');
  });
});

describe('isCountryVisible', () => {
  it('always shows visited countries', () => {
    expect(isCountryVisible({ status: 'visited' }, false)).toBe(true);
    expect(isCountryVisible({ status: 'visited' }, true)).toBe(true);
  });

  it('hides planned and dateless countries until the layer is switched on', () => {
    expect(isCountryVisible({ status: 'planned' }, false)).toBe(false);
    expect(isCountryVisible({ status: 'idea' }, false)).toBe(false);
    expect(isCountryVisible({ status: 'planned' }, true)).toBe(true);
    expect(isCountryVisible({ status: 'idea' }, true)).toBe(true);
  });

  it('keeps a status-less country on the map with the toggle off', () => {
    expect(isCountryVisible({}, false)).toBe(true);
  });
});

describe('withCountryMarkedVisited', () => {
  const base = (over: Partial<AtlasData> = {}): AtlasData => ({
    countries: [{ code: 'FR', tripCount: 2, placeCount: 5, status: 'visited' }],
    stats: { totalTrips: 3, totalPlaces: 10, totalCountries: 1, totalDays: 14, totalCountriesPlanned: 0 },
    continents: { Europe: 1 },
    continentsPlanned: {},
    ...over,
  });

  it('appends an unknown country as visited and counts it once', () => {
    const next = withCountryMarkedVisited(base(), 'JP');

    expect(next.countries).toHaveLength(2);
    expect(next.countries[1]).toEqual({
      code: 'JP', placeCount: 0, tripCount: 0, firstVisit: null, lastVisit: null, status: 'visited',
    });
    expect(next.stats.totalCountries).toBe(2);
    expect(next.continents).toEqual({ Europe: 1, Asia: 1 });
    // Nothing was planned, so the planned tallies stay untouched.
    expect(next.stats.totalCountriesPlanned).toBe(0);
    expect(next.continentsPlanned).toEqual({});
  });

  it('returns the very same object when the country is already visited', () => {
    const prev = base();
    expect(withCountryMarkedVisited(prev, 'FR')).toBe(prev);
  });

  it('promotes a planned country instead of adding a second entry', () => {
    const prev = base({
      countries: [
        { code: 'FR', tripCount: 2, placeCount: 5, status: 'visited' },
        { code: 'JP', tripCount: 1, placeCount: 0, status: 'planned' },
      ],
      stats: { totalTrips: 3, totalPlaces: 10, totalCountries: 1, totalDays: 14, totalCountriesPlanned: 1 },
      continents: { Europe: 1 },
      continentsPlanned: { Asia: 1 },
    });

    const next = withCountryMarkedVisited(prev, 'JP');

    expect(next.countries).toHaveLength(2);
    expect(next.countries.find((c) => c.code === 'JP')?.status).toBe('visited');
    expect(next.stats.totalCountries).toBe(2);
    expect(next.stats.totalCountriesPlanned).toBe(0);
    expect(next.continents).toEqual({ Europe: 1, Asia: 1 });
    expect(next.continentsPlanned).toEqual({ Asia: 0 });
  });

  it('promotes a dateless country the same way', () => {
    const prev = base({
      countries: [{ code: 'JP', tripCount: 1, placeCount: 0, status: 'idea' }],
      stats: { totalTrips: 3, totalPlaces: 10, totalCountries: 0, totalDays: 14, totalCountriesPlanned: 1 },
      continents: {},
      continentsPlanned: { Asia: 1 },
    });

    const next = withCountryMarkedVisited(prev, 'JP');

    expect(next.countries).toHaveLength(1);
    expect(next.countries[0].status).toBe('visited');
    expect(next.stats.totalCountries).toBe(1);
    expect(next.stats.totalCountriesPlanned).toBe(0);
  });

  it('never lets the planned tallies fall below zero', () => {
    const prev = base({
      countries: [{ code: 'JP', tripCount: 1, placeCount: 0, status: 'planned' }],
      stats: { totalTrips: 0, totalPlaces: 0, totalCountries: 0, totalDays: 0 },
      continents: {},
    });

    const next = withCountryMarkedVisited(prev, 'JP');

    expect(next.stats.totalCountriesPlanned).toBe(0);
    expect(next.continentsPlanned).toEqual({ Asia: 0 });
  });
});
