import { describe, it, expect } from 'vitest';
import {
  A2_TO_A3,
  countryStatus,
  findBucketDuplicate,
  isBucketDuplicateError,
  isCountryVisible,
  normalizeRegionName,
  regionCacheEvictions,
  withCountryMarkedVisited,
  wishlistA3Codes,
  countryColor,
  COUNTRY_COLORS,
  REGION_CACHE_MAX,
  type AtlasData,
  type BucketItem,
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

function bucketItem(overrides: Partial<BucketItem>): BucketItem {
  return { id: 1, name: 'Somewhere', lat: null, lng: null, country_code: null, notes: null, target_date: null, ...overrides };
}

describe('countryColor', () => {
  it('always returns a color from the shared palette', () => {
    expect(COUNTRY_COLORS).toContain(countryColor('FRA'));
  });

  it('is stable for the same code across repeated calls', () => {
    expect(countryColor('JPN')).toBe(countryColor('JPN'));
  });

  it('is independent of how many other codes have been resolved before it (#reshuffle-bug)', () => {
    // Regression guard: an earlier order-index-based scheme reassigned every
    // country's color whenever one more country was visited/wishlisted.
    const before = countryColor('JPN');
    countryColor('FRA'); countryColor('DEU'); countryColor('ESP'); countryColor('ITA');
    expect(countryColor('JPN')).toBe(before);
  });

  it('gives different codes different colors in the common case', () => {
    expect(countryColor('FRA')).not.toBe(countryColor('JPN'));
  });
});

describe('wishlistA3Codes', () => {
  it('resolves a bucket-list country to its A3 code', () => {
    const result = wishlistA3Codes([bucketItem({ country_code: 'JP' })], new Set());
    expect(result).toEqual(new Set(['JPN']));
  });

  it('excludes a bucket-list country that is already visited', () => {
    const result = wishlistA3Codes([bucketItem({ country_code: 'JP' })], new Set(['JPN']));
    expect(result.size).toBe(0);
  });

  it('ignores bucket-list items with no country_code (POI-only entries)', () => {
    const result = wishlistA3Codes([bucketItem({ country_code: null, lat: 35.6, lng: 139.7 })], new Set());
    expect(result.size).toBe(0);
  });

  it('dedupes multiple bucket-list items in the same country', () => {
    const result = wishlistA3Codes(
      [bucketItem({ id: 1, country_code: 'JP' }), bucketItem({ id: 2, country_code: 'JP' })],
      new Set(),
    );
    expect(result).toEqual(new Set(['JPN']));
  });
});

// The client half of #1898 — the same identity the server enforces, checked
// before the request so the refusal arrives translated and instantly.
describe('findBucketDuplicate (#1898)', () => {
  const candidate = { name: 'Japan', country_code: 'JP', target_date: null, lat: null, lng: null };

  it('finds an entry with the same name, country and target date', () => {
    const existing = bucketItem({ id: 5, name: 'Japan', country_code: 'JP' });
    expect(findBucketDuplicate([existing], candidate)).toBe(existing);
  });

  it('lets the same place through for a different target date', () => {
    const existing = bucketItem({ name: 'Japan', country_code: 'JP', target_date: '2027-05' });
    expect(findBucketDuplicate([existing], candidate)).toBeUndefined();
    expect(findBucketDuplicate([existing], { ...candidate, target_date: '2028-09' })).toBeUndefined();
    expect(findBucketDuplicate([existing], { ...candidate, target_date: '2027-05' })).toBe(existing);
  });

  it('treats an empty string and null as the same "not set"', () => {
    const undated = bucketItem({ name: 'Japan', country_code: 'JP', target_date: null });
    expect(findBucketDuplicate([undated], { ...candidate, target_date: '' })).toBe(undated);
    const blankCountry = bucketItem({ name: 'Japan', country_code: '' });
    expect(findBucketDuplicate([blankCountry], { ...candidate, country_code: null })).toBe(blankCountry);
  });

  it('ignores surrounding whitespace and ASCII case in the name', () => {
    const existing = bucketItem({ name: 'Kyoto', country_code: 'JP' });
    expect(findBucketDuplicate([existing], { ...candidate, name: '  kyoto ' })).toBe(existing);
  });

  it('keeps non-ASCII case apart, matching SQLite lower()', () => {
    // The server folds ASCII only, so folding more here would block a name the
    // server would have accepted.
    const existing = bucketItem({ name: 'Ísland', country_code: 'IS' });
    expect(findBucketDuplicate([existing], { ...candidate, name: 'ísland', country_code: 'IS' })).toBeUndefined();
  });

  it('separates the same name in another country or at other coordinates', () => {
    const existing = bucketItem({ name: 'Altstadt', country_code: 'DE', lat: 48.13, lng: 11.57 });
    expect(findBucketDuplicate([existing], { ...candidate, name: 'Altstadt', country_code: 'AT', lat: 48.13, lng: 11.57 }))
      .toBeUndefined();
    expect(findBucketDuplicate([existing], { ...candidate, name: 'Altstadt', country_code: 'DE', lat: 50.94, lng: 6.96 }))
      .toBeUndefined();
    expect(findBucketDuplicate([existing], { ...candidate, name: 'Altstadt', country_code: 'DE', lat: 48.13, lng: 11.57 }))
      .toBe(existing);
  });
});

// The region cache used to grow for the whole session (#1950). The eviction order is
// pure arithmetic, so it is decided here rather than inside the Leaflet effect.
describe('regionCacheEvictions (#1950)', () => {
  it('drops nothing while the cache is within its cap', () => {
    expect(regionCacheEvictions(['FR', 'IT'], new Set(), REGION_CACHE_MAX)).toEqual([]);
    expect(regionCacheEvictions(['FR', 'IT'], new Set(), 2)).toEqual([]);
  });

  it('drops the least recently viewed countries first, and only as many as needed', () => {
    expect(regionCacheEvictions(['FR', 'IT', 'ES', 'PT'], new Set(), 2)).toEqual(['FR', 'IT']);
    expect(regionCacheEvictions(['FR', 'IT', 'ES', 'PT'], new Set(), 3)).toEqual(['FR']);
  });

  it('never drops a country that has to stay', () => {
    // FR is the oldest entry but still on screen, so the next-oldest ones go instead.
    expect(regionCacheEvictions(['FR', 'IT', 'ES', 'PT'], new Set(['FR']), 2)).toEqual(['IT', 'ES']);
  });

  it('stays over the cap rather than dropping what is in view', () => {
    // Three countries on screen with room for two: evicting one would only make the
    // next pan fetch it straight back.
    expect(regionCacheEvictions(['FR', 'IT', 'ES'], new Set(['FR', 'IT', 'ES']), 2)).toEqual([]);
    expect(regionCacheEvictions(['FR', 'IT', 'ES', 'PT'], new Set(['IT', 'ES', 'PT']), 2)).toEqual(['FR']);
  });
});

describe('isBucketDuplicateError (#1898)', () => {
  it('recognises the 409 and nothing else', () => {
    expect(isBucketDuplicateError({ response: { status: 409 } })).toBe(true);
    expect(isBucketDuplicateError({ response: { status: 500 } })).toBe(false);
    expect(isBucketDuplicateError(new Error('offline'))).toBe(false);
    expect(isBucketDuplicateError(null)).toBe(false);
  });
});
