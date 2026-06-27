import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ── DB setup (real in-memory SQLite — same pattern as mcp unit tests) ────────

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: (tripId: any, userId: number) =>
      db.prepare(`
        SELECT t.id, t.user_id FROM trips t
        LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
        WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)
      `).get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip } from '../../helpers/factories';
import { getStats, getCached, setCache, getCountryFromCoords, getCountryFromAddress, reverseGeocodeCountry, getRegionGeo, getCountryGeo, getCountryPlaces, getVisitedRegions } from '../../../src/services/atlasService';

function insertPlace(db: any, tripId: number, name: string, address: string | null = null) {
  const cat = db.prepare('SELECT id FROM categories LIMIT 1').get() as { id: number } | undefined;
  const result = db.prepare(
    'INSERT INTO places (trip_id, name, address, category_id) VALUES (?, ?, ?, ?)'
  ).run(tripId, name, address, cat?.id ?? null);
  return db.prepare('SELECT * FROM places WHERE id = ?').get(result.lastInsertRowid);
}

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  // Stub fetch so reverseGeocodeCountry never makes real HTTP calls
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: false,
    json: async () => ({}),
  }));
});

afterAll(() => {
  vi.unstubAllGlobals();
  testDb.close();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('getStats', () => {
  it('ATLAS-UNIT-001: returns mostVisited null when trips have no resolvable countries (guards reduce on empty array)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Mystery Trip' });
    // Place with no address and no coordinates → can't resolve country
    insertPlace(testDb, trip.id, 'Unknown Place', null);

    const stats = await getStats(user.id);

    expect(stats.mostVisited).toBeNull();
    expect(stats.countries).toEqual([]);
    expect(stats.stats.totalPlaces).toBe(1);
    expect(stats.stats.totalCountries).toBe(0);
  });

  it('ATLAS-UNIT-002: returns the country with the highest placeCount as mostVisited', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Euro Tour' });

    // 3 places in France, 1 in Germany → France should win
    for (let i = 0; i < 3; i++) {
      insertPlace(testDb, trip.id, `Paris Place ${i}`, `Street ${i}, Paris, France`);
    }
    insertPlace(testDb, trip.id, 'Berlin Place', 'Some Street, Berlin, Germany');

    const stats = await getStats(user.id);

    expect(stats.mostVisited).not.toBeNull();
    expect(stats.mostVisited!.code).toBe('FR');
    expect(stats.mostVisited!.placeCount).toBe(3);
    expect(stats.countries).toHaveLength(2);
    expect(stats.stats.totalCountries).toBe(2);
  });

  it('ATLAS-UNIT-003: returns manually marked countries when user has no trips', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('INSERT INTO visited_countries (user_id, country_code) VALUES (?, ?)').run(user.id, 'JP');
    testDb.prepare('INSERT INTO visited_countries (user_id, country_code) VALUES (?, ?)').run(user.id, 'AU');

    const stats = await getStats(user.id);

    expect(stats.countries).toHaveLength(2);
    expect(stats.countries.map((c: { code: string }) => c.code).sort()).toEqual(['AU', 'JP']);
    expect(stats.stats.totalTrips).toBe(0);
    expect(stats.stats.totalCountries).toBe(2);
  });

  it('ATLAS-UNIT-004: single country yields mostVisited equal to that country', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Italy Trip' });
    insertPlace(testDb, trip.id, 'Colosseum', 'Piazza del Colosseo, Rome, Italy');

    const stats = await getStats(user.id);

    expect(stats.mostVisited).not.toBeNull();
    expect(stats.mostVisited!.code).toBe('IT');
    expect(stats.mostVisited!.placeCount).toBe(1);
  });
});

// ── getCached / setCache ────────────────────────────────────────────────────

describe('getCached and setCache', () => {
  it('ATLAS-SVC-001: getCached returns undefined for unknown coordinates', () => {
    // Use uniquely large lat values to guarantee no prior cache entry
    const result = getCached(9001.001, 9001.001);
    expect(result).toBeUndefined();
  });

  it('ATLAS-SVC-002: setCache then getCached returns the stored code', () => {
    setCache(9002.002, 9002.002, 'DE');
    const result = getCached(9002.002, 9002.002);
    expect(result).toBe('DE');
  });

  it('ATLAS-SVC-003: setCache can store null (country unknown)', () => {
    setCache(9003.003, 9003.003, null);
    const result = getCached(9003.003, 9003.003);
    expect(result).toBeNull();
  });

  it('ATLAS-SVC-004: different coordinates return different cached values', () => {
    setCache(9004.004, 9004.004, 'FR');
    setCache(9004.005, 9004.005, 'ES');
    expect(getCached(9004.004, 9004.004)).toBe('FR');
    expect(getCached(9004.005, 9004.005)).toBe('ES');
  });
});

// ── getCountryFromCoords ────────────────────────────────────────────────────

describe('getCountryFromCoords', () => {
  it('ATLAS-SVC-005: returns country code for Paris coordinates (France)', () => {
    // Paris: approximately 48.85°N, 2.35°E — well inside FR bounding box
    const code = getCountryFromCoords(48.85, 2.35);
    expect(code).toBe('FR');
  });

  it('ATLAS-SVC-006: returns country code for NYC coordinates (USA)', () => {
    // New York City: approximately 40.71°N, -74.0°W — inside US bounding box
    const code = getCountryFromCoords(40.71, -74.0);
    expect(code).toBe('US');
  });

  it('ATLAS-SVC-007: returns null for coordinates with no country match (0,0)', () => {
    // Gulf of Guinea — no COUNTRY_BOXES entry covers 0°N, 0°E
    const code = getCountryFromCoords(0.0, 0.0);
    expect(code).toBeNull();
  });

  it('ATLAS-SVC-005b: #1331 a point inside France near the German border resolves to FR, not the smaller overlapping box', () => {
    // Strasbourg (48.573, 7.752) sits inside BOTH the FR and DE bounding boxes; the old
    // smallest-box rule mis-picked DE (its box is smaller). Point-in-polygon picks FR.
    expect(getCountryFromCoords(48.5734, 7.7521)).toBe('FR');
  });

  it('ATLAS-SVC-005c: #1331 a point inside Germany near the French border resolves to DE', () => {
    // Kehl (48.575, 7.815) — the German side of the same border.
    expect(getCountryFromCoords(48.5750, 7.8150)).toBe('DE');
  });

  it('ATLAS-SVC-005d: #1331 a micro-territory without an admin0 polygon keeps the smallest-box win (Hong Kong)', () => {
    // HK is not a separate admin0 polygon (it falls inside CN there), so the smallest
    // bounding box still wins for it.
    expect(getCountryFromCoords(22.30, 114.17)).toBe('HK');
  });
});

// ── getCountryFromAddress ───────────────────────────────────────────────────

describe('getCountryFromAddress', () => {
  it('ATLAS-SVC-008: returns null for null address', () => {
    expect(getCountryFromAddress(null)).toBeNull();
  });

  it('ATLAS-SVC-009: returns null for empty string', () => {
    expect(getCountryFromAddress('')).toBeNull();
  });

  it('ATLAS-SVC-010: parses "France" in last position to "FR"', () => {
    expect(getCountryFromAddress('Eiffel Tower, Paris, France')).toBe('FR');
  });

  it('ATLAS-SVC-011: returns 2-letter ISO code directly when last part is uppercase 2-letter', () => {
    // "US" is uppercase and exactly 2 characters — returned verbatim
    expect(getCountryFromAddress('123 Main St, New York, US')).toBe('US');
  });

  it('ATLAS-SVC-012: returns null for unrecognized country name', () => {
    expect(getCountryFromAddress('Unknown City, Unknown Country')).toBeNull();
  });
});

// ── reverseGeocodeCountry ───────────────────────────────────────────────────

describe('reverseGeocodeCountry', () => {
  it('ATLAS-SVC-013: returns null when fetch fails (ok:false)', async () => {
    // The beforeEach stub already returns ok:false — this is the default path
    const code = await reverseGeocodeCountry(9013.013, 9013.013);
    expect(code).toBeNull();
  });

  it('ATLAS-SVC-014: returns country code when Nominatim returns valid response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ address: { country_code: 'fr' } }),
    }));
    // Berlin-ish coords not used elsewhere — unique to avoid cache collision
    const code = await reverseGeocodeCountry(52.52, 13.40);
    expect(code).toBe('FR');
  });

  it('ATLAS-SVC-015: returns null when fetch throws a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const code = await reverseGeocodeCountry(9015.015, 9015.015);
    expect(code).toBeNull();
  });

  it('ATLAS-SVC-016: returns cached result on second call (fetch called only once)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ address: { country_code: 'gb' } }),
    });
    vi.stubGlobal('fetch', mockFetch);

    // Use unique coords so neither call hits a prior cache entry
    const first = await reverseGeocodeCountry(9016.016, 9016.016);
    const second = await reverseGeocodeCountry(9016.016, 9016.016);

    expect(first).toBe('GB');
    expect(second).toBe('GB');
    // fetch should have been invoked only once; the second call uses the in-memory cache
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

// ── getRegionGeo ────────────────────────────────────────────────────────────

// These read the committed geoBoundaries bundle (server/assets/atlas/admin1.geojson.gz),
// so they double as a guard that the bundle ships current sub-national data (#1119).
describe('getRegionGeo', () => {
  it('ATLAS-SVC-017: returns an empty FeatureCollection for a country with no admin-1 features', async () => {
    const result = await getRegionGeo(['ZZ']);
    expect(result).toEqual({ type: 'FeatureCollection', features: [] });
  });

  it('ATLAS-SVC-018: returns the current geoBoundaries regions for a country, case-insensitively', async () => {
    // Pass lowercase 'no' — getRegionGeo uppercases internally for matching.
    const result = await getRegionGeo(['no']);

    expect(result.type).toBe('FeatureCollection');
    expect(result.features.length).toBeGreaterThan(0);
    expect(result.features.every((f: any) => f.properties.iso_a2 === 'NO')).toBe(true);

    const names = result.features.map((f: any) => f.properties.name);
    const codes = result.features.map((f: any) => f.properties.iso_3166_2);
    // Post-2020 reform is present…
    expect(codes).toContain('NO-34'); // Innlandet
    expect(codes).toContain('NO-46'); // Vestland
    // …and the merged-away pre-2020 counties are gone (the original #1119 bug).
    expect(names).not.toContain('Oppland');
    expect(names).not.toContain('Hordaland');
    expect(names).not.toContain('Sogn og Fjordane');
  });
});

describe('getCountryGeo', () => {
  it('ATLAS-SVC-019: returns the admin-0 FeatureCollection with ISO_A2/ADM0_A3 properties', () => {
    const geo = getCountryGeo();
    expect(geo.type).toBe('FeatureCollection');
    expect(geo.features.length).toBeGreaterThan(0);
    const no = geo.features.find((f: any) => f.properties.ISO_A2 === 'NO');
    expect(no).toBeDefined();
    expect(no.properties.ADM0_A3).toBe('NOR');
    expect(no.properties.NAME).toBe('Norway');
  });

  it('ATLAS-SVC-020: includes territories that the curated list dropped (Greenland + Svalbard)', () => {
    const geo = getCountryGeo();
    // Greenland is its own feature.
    expect(geo.features.some((f: any) => f.properties.ISO_A2 === 'GL')).toBe(true);
    // Svalbard has no separate ISO entity in geoBoundaries; it sits inside Norway's
    // geometry (lat ~74-81°N). Guard that the country polygon reaches those latitudes.
    const no = geo.features.find((f: any) => f.properties.ISO_A2 === 'NO');
    const maxLat = (function max(coords: any): number {
      if (typeof coords[0] === 'number') return coords[1];
      return Math.max(...coords.map(max));
    })(no.geometry.coordinates);
    expect(maxLat).toBeGreaterThan(78);
  });
});

// ── Helpers for new tests ────────────────────────────────────────────────────

function insertPlaceWithCoords(db: any, tripId: number, name: string, lat: number, lng: number, address: string | null = null) {
  const cat = db.prepare('SELECT id FROM categories LIMIT 1').get() as { id: number } | undefined;
  const result = db.prepare(
    'INSERT INTO places (trip_id, name, address, lat, lng, category_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(tripId, name, address, lat, lng, cat?.id ?? null);
  return db.prepare('SELECT * FROM places WHERE id = ?').get(result.lastInsertRowid);
}

// ── getStats — extended ──────────────────────────────────────────────────────

describe('getStats — extended', () => {
  it('ATLAS-UNIT-005: totalDays is calculated when trip has start_date and end_date', async () => {
    const { user } = createUser(testDb);
    createTrip(testDb, user.id, { title: 'Short Trip', start_date: '2024-03-01', end_date: '2024-03-03' });

    const stats = await getStats(user.id);

    // March 1, 2, 3 → diff = 2 + 1 = 3
    expect(stats.stats.totalDays).toBe(3);
  });

  it('ATLAS-UNIT-006: totalDays is 0 when trip has no dates', async () => {
    const { user } = createUser(testDb);
    createTrip(testDb, user.id, { title: 'Dateless' });

    const stats = await getStats(user.id);

    expect(stats.stats.totalDays).toBe(0);
  });

  it('ATLAS-UNIT-007: manually marked country is merged when user has trips but no resolvable places for that country', async () => {
    const { user } = createUser(testDb);
    createTrip(testDb, user.id, { title: 'Japan Trip', start_date: '2024-01-01', end_date: '2024-01-10' });
    testDb.prepare('INSERT INTO visited_countries (user_id, country_code) VALUES (?, ?)').run(user.id, 'JP');

    const stats = await getStats(user.id);

    const codes = stats.countries.map((c: any) => c.code);
    expect(codes).toContain('JP');
    const jp = stats.countries.find((c: any) => c.code === 'JP');
    expect(jp?.placeCount).toBe(0);
  });

  it('ATLAS-UNIT-008: lastTrip is resolved with a country code when its places have an address', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Past France Trip', start_date: '2023-05-01', end_date: '2023-05-10' });
    insertPlace(testDb, trip.id, 'Eiffel Tower', 'Champ de Mars, Paris, France');

    const stats = await getStats(user.id);

    expect(stats.lastTrip).not.toBeNull();
    expect(stats.lastTrip!.countryCode).toBe('FR');
  });

  it('ATLAS-UNIT-009: nextTrip has daysUntil calculated', async () => {
    const { user } = createUser(testDb);
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    createTrip(testDb, user.id, { title: 'Future Trip', start_date: futureDateStr });

    const stats = await getStats(user.id);

    expect(stats.nextTrip).not.toBeNull();
    expect(stats.nextTrip!.daysUntil).toBeGreaterThan(0);
  });

  it('ATLAS-UNIT-010: streak counts consecutive years with trips and firstYear is the earliest', async () => {
    const { user } = createUser(testDb);
    const currentYear = new Date().getFullYear();
    createTrip(testDb, user.id, { title: 'This Year', start_date: `${currentYear}-06-01`, end_date: `${currentYear}-06-10` });
    createTrip(testDb, user.id, { title: 'Last Year', start_date: `${currentYear - 1}-07-01`, end_date: `${currentYear - 1}-07-10` });

    const stats = await getStats(user.id);

    expect(stats.streak).toBeGreaterThanOrEqual(1);
    expect(stats.firstYear).toBe(currentYear - 1);
  });

  it('ATLAS-UNIT-011: tripsThisYear counts only trips whose start_date is in the current year', async () => {
    const { user } = createUser(testDb);
    const currentYear = new Date().getFullYear();
    createTrip(testDb, user.id, { title: 'This Year', start_date: `${currentYear}-03-01` });
    createTrip(testDb, user.id, { title: 'Last Year', start_date: `${currentYear - 1}-03-01` });

    const stats = await getStats(user.id);

    expect(stats.tripsThisYear).toBe(1);
  });

  it('ATLAS-UNIT-012: lastTrip is null when all trips end in the future', async () => {
    const { user } = createUser(testDb);
    const nextYear = new Date().getFullYear() + 1;
    createTrip(testDb, user.id, { title: 'Future', start_date: `${nextYear}-01-01`, end_date: `${nextYear}-01-10` });

    const stats = await getStats(user.id);

    expect(stats.lastTrip).toBeNull();
  });
});

// ── getCountryPlaces ─────────────────────────────────────────────────────────

describe('getCountryPlaces', () => {
  it('ATLAS-UNIT-013: returns empty result when user has no trips', () => {
    const { user } = createUser(testDb);

    const result = getCountryPlaces(user.id, 'FR');

    expect(result.places).toHaveLength(0);
    expect(result.trips).toHaveLength(0);
    expect(result.manually_marked).toBe(false);
  });

  it('ATLAS-UNIT-014: returns matching places when place address resolves to the requested country', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'France Trip' });
    insertPlace(testDb, trip.id, 'Louvre', '75001 Paris, France');
    insertPlace(testDb, trip.id, 'Berlin Wall', 'Bernauer Str., Berlin, Germany');

    const result = getCountryPlaces(user.id, 'FR');

    expect(result.places).toHaveLength(1);
    expect(result.places[0].name).toBe('Louvre');
    expect(result.trips).toHaveLength(1);
    expect(result.trips[0].id).toBe(trip.id);
  });

  it('ATLAS-UNIT-015: manually_marked is true when country is in visited_countries', () => {
    const { user } = createUser(testDb);
    testDb.prepare('INSERT INTO visited_countries (user_id, country_code) VALUES (?, ?)').run(user.id, 'JP');
    createTrip(testDb, user.id, { title: 'Japan' });

    const result = getCountryPlaces(user.id, 'JP');

    expect(result.manually_marked).toBe(true);
  });

  it('ATLAS-UNIT-016: place with coordinates resolves via bbox when address is absent', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Coord Trip' });
    // Paris coordinates (48.85°N, 2.35°E) — falls inside FR bounding box
    insertPlaceWithCoords(testDb, trip.id, 'Secret Paris Spot', 48.85, 2.35);

    const result = getCountryPlaces(user.id, 'FR');

    expect(result.places).toHaveLength(1);
    expect(result.places[0].name).toBe('Secret Paris Spot');
  });
});

// ── getVisitedRegions ────────────────────────────────────────────────────────

describe('getVisitedRegions', () => {
  it('ATLAS-UNIT-017: returns empty regions object when user has no trips', async () => {
    const { user } = createUser(testDb);

    const result = await getVisitedRegions(user.id);

    expect(result.regions).toEqual({});
  });

  it('ATLAS-UNIT-018: returns manually marked regions even when user has no places with coordinates', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('INSERT INTO visited_countries (user_id, country_code) VALUES (?, ?)').run(user.id, 'DE');
    testDb.prepare('INSERT INTO visited_regions (user_id, region_code, region_name, country_code) VALUES (?, ?, ?, ?)').run(user.id, 'DE-BY', 'Bayern', 'DE');

    const result = await getVisitedRegions(user.id);

    expect(result.regions['DE']).toBeDefined();
    const codes = result.regions['DE'].map((r: any) => r.code);
    expect(codes).toContain('DE-BY');
    const bayernRegion = result.regions['DE'].find((r: any) => r.code === 'DE-BY');
    expect(bayernRegion?.manuallyMarked).toBe(true);
  });

  it('ATLAS-UNIT-019: geocodes places with lat/lng using reverseGeocodeRegion via fetch', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        address: {
          country_code: 'fr',
          'ISO3166-2-lvl4': 'FR-75',
          state: 'Île-de-France',
        },
      }),
    }));

    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris Trip' });
    insertPlaceWithCoords(testDb, trip.id, 'Paris Hotel', 48.85, 2.35);

    // First call triggers the background geocoding fire-and-forget
    await getVisitedRegions(user.id);
    // Advance all pending timers (including the 1100ms Nominatim rate-limit delay)
    await vi.runAllTimersAsync();
    // Second call returns now-cached data
    const result = await getVisitedRegions(user.id);

    expect(result.regions['FR']).toBeDefined();

    vi.useRealTimers();
  });

  it('ATLAS-UNIT-020: places already cached in place_regions are not re-geocoded', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Cached Trip' });
    const place = insertPlaceWithCoords(testDb, trip.id, 'Cached Place', 48.85, 2.35);

    // Pre-populate the place_regions cache so the fetch path is never reached
    testDb.prepare(
      'INSERT OR REPLACE INTO place_regions (place_id, country_code, region_code, region_name) VALUES (?, ?, ?, ?)'
    ).run(place.id, 'FR', 'FR-75', 'Île-de-France');

    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal('fetch', mockFetch);

    const result = await getVisitedRegions(user.id);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.regions['FR']).toBeDefined();
    const codes = result.regions['FR'].map((r: any) => r.code);
    expect(codes).toContain('FR-75');
  });

  it('ATLAS-UNIT-021: GB places resolving to a constituent country are re-resolved to the finer admin-1 code', async () => {
    vi.useFakeTimers();
    // A zoom-8 lookup only yields the constituent country (GB-ENG); the zoom-10 lookup
    // exposes the borough code (GB-MAN) that Natural Earth's polygons actually carry.
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => Promise.resolve({
      ok: true,
      json: async () => ({
        address: url.includes('zoom=10')
          ? { country_code: 'gb', 'ISO3166-2-lvl8': 'GB-MAN', city: 'Manchester', state: 'England', 'ISO3166-2-lvl4': 'GB-ENG' }
          : { country_code: 'gb', 'ISO3166-2-lvl4': 'GB-ENG', state: 'England' },
      }),
    })));

    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Manchester Trip' });
    insertPlaceWithCoords(testDb, trip.id, 'Old Trafford', 53.4631, -2.2913);

    await getVisitedRegions(user.id);
    await vi.runAllTimersAsync();
    const result = await getVisitedRegions(user.id);

    expect(result.regions['GB']).toBeDefined();
    const codes = result.regions['GB'].map((r: any) => r.code);
    expect(codes).toContain('GB-MAN');
    expect(codes).not.toContain('GB-ENG');

    vi.useRealTimers();
  });
});
