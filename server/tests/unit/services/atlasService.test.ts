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
import { createUser, createTrip, createReservation } from '../../helpers/factories';
import { getStats, getCached, setCache, getCountryFromCoords, getCountryFromAddress, isPointInCountryBox, reverseGeocodeCountry, getRegionGeo, getCountryGeo, getCountryPlaces, getVisitedRegions, markCountryVisited, unmarkCountryVisited, markRegionVisited, unmarkRegionVisited } from '../../../src/services/atlasService';

function insertReservationEndpoint(
  db: any,
  reservationId: number,
  role: 'from' | 'to' | 'stop',
  sequence: number,
  lat: number,
  lng: number
) {
  db.prepare(
    'INSERT INTO reservation_endpoints (reservation_id, role, sequence, name, lat, lng) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(reservationId, role, sequence, `Endpoint ${sequence}`, lat, lng);
}

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

  it('ATLAS-UNIT-022 (#1366): a country reached only via a real flight leg (from/to) counts as visited', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Tokyo Layover Trip' });
    const reservation = createReservation(testDb, trip.id, { type: 'flight' });
    // Tokyo: 35.6762°N, 139.6503°E — inside the JP bounding box, no place row.
    insertReservationEndpoint(testDb, reservation.id, 'from', 0, 35.6762, 139.6503);
    insertReservationEndpoint(testDb, reservation.id, 'to', 1, 51.4700, -0.4543);

    const stats = await getStats(user.id);

    const codes = stats.countries.map((c: { code: string }) => c.code);
    expect(codes).toContain('JP');
    expect(codes).toContain('GB');
  });

  it('ATLAS-UNIT-023 (#1366 regression): a country only touched as a connecting-flight stop does NOT count as visited', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Tokyo Connection Trip' });
    const reservation = createReservation(testDb, trip.id, { type: 'flight' });
    // Departs Belgium, connects through Tokyo (role: stop — never leaves the airport),
    // lands in Australia. Only BE/AU were actually reached.
    insertReservationEndpoint(testDb, reservation.id, 'from', 0, 50.9014, 4.4844);
    insertReservationEndpoint(testDb, reservation.id, 'stop', 1, 35.6762, 139.6503);
    insertReservationEndpoint(testDb, reservation.id, 'to', 2, -33.8688, 151.2093);

    const stats = await getStats(user.id);

    const codes = stats.countries.map((c: { code: string }) => c.code);
    expect(codes).toContain('BE');
    expect(codes).toContain('AU');
    expect(codes).not.toContain('JP');
  });

  it('ATLAS-UNIT-024 (#1490): a flight endpoint in southern Spain counts as ES, not DZ', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Malaga Trip' });
    const reservation = createReservation(testDb, trip.id, { type: 'flight' });
    // Brussels -> Malaga airport (36.6749, -4.4991). The destination sits inside both
    // the ES and DZ bounding boxes; without the ES entry it geocoded to Algeria.
    insertReservationEndpoint(testDb, reservation.id, 'from', 0, 50.9014, 4.4844);
    insertReservationEndpoint(testDb, reservation.id, 'to', 1, 36.6749, -4.4991);

    const stats = await getStats(user.id);

    const codes = stats.countries.map((c: { code: string }) => c.code);
    expect(codes).toContain('ES');
    expect(codes).not.toContain('DZ');
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

  it('ATLAS-SVC-005e: #1490 a point in southern Spain resolves to ES, not the overlapping Algeria box', () => {
    // The ES entry was dropped when the lookup tables were expanded, leaving DZ as the
    // only box covering Malaga (36.72, -4.42) — so flights into southern Spain marked
    // Algeria as visited, and it could not be removed because it was re-derived on
    // every Atlas load.
    expect(getCountryFromCoords(36.7213, -4.4215)).toBe('ES');
  });

  it('ATLAS-SVC-005f: #1490 Barcelona resolves to ES, not the overlapping FR box', () => {
    // Barcelona sits inside the FR box too (lat > 41.3); with no ES entry it was
    // assigned to France outright.
    expect(getCountryFromCoords(41.3874, 2.1686)).toBe('ES');
  });

  it('ATLAS-SVC-005g: #1490 a country the hand-written box table omitted resolves correctly (Nigeria)', () => {
    // NG had no bounding box at all, so Lagos fell into Benin's box as the only
    // candidate and phantom-marked BJ as visited. Same class for Kano -> CM.
    expect(getCountryFromCoords(6.5244, 3.3792)).toBe('NG');   // Lagos
    expect(getCountryFromCoords(12.0022, 8.5920)).toBe('NG');  // Kano
    expect(getCountryFromCoords(9.0765, 7.3986)).toBe('NG');   // Abuja
  });

  it('ATLAS-SVC-005h: #1490 other previously box-less countries resolve (BY, GL, KP, TD, SS)', () => {
    expect(getCountryFromCoords(53.9006, 27.5590)).toBe('BY');   // Minsk (was RU)
    expect(getCountryFromCoords(64.1836, -51.7214)).toBe('GL');  // Nuuk
    expect(getCountryFromCoords(39.0392, 125.7625)).toBe('KP');  // Pyongyang
    expect(getCountryFromCoords(12.1348, 15.0557)).toBe('TD');   // N'Djamena
    expect(getCountryFromCoords(4.8594, 31.5713)).toBe('SS');    // Juba
  });

  it('ATLAS-SVC-005i: #1490 countries straddling the antimeridian resolve per-part, not to a globe-spanning box', () => {
    // Boxes are derived one-per-geometry-part. A single box around RU/US/FJ would span
    // nearly the whole globe and swallow unrelated points.
    expect(getCountryFromCoords(61.2181, -149.9003)).toBe('US'); // Anchorage
    expect(getCountryFromCoords(64.4230, -173.2260)).toBe('RU'); // Provideniya, east of 180
    expect(getCountryFromCoords(-18.1416, 178.4419)).toBe('FJ'); // Suva
  });

  it('ATLAS-SVC-005j: a loose polygon-less box (PS) does not steal Israeli points inside the IL polygon', () => {
    // PS has no admin0 polygon and its box sprawls across most of Israel. It must NOT win
    // the smallest-box tie-break over IL's real polygon: Tel Aviv, Jerusalem, Eilat and
    // Beersheba all lie in the IL polygon and must resolve to IL, not PS.
    expect(getCountryFromCoords(32.0853, 34.7818)).toBe('IL'); // Tel Aviv
    expect(getCountryFromCoords(31.7683, 35.2137)).toBe('IL'); // Jerusalem
    expect(getCountryFromCoords(29.5577, 34.9519)).toBe('IL'); // Eilat
    expect(getCountryFromCoords(31.2518, 34.7913)).toBe('IL'); // Beersheba
  });

  it('ATLAS-SVC-005k: a genuine West Bank / Gaza point still resolves to PS via the deferred box', () => {
    // The fix only defers the loose box behind real polygons; a point that lies in NO
    // sovereign polygon (the West Bank / Gaza are excluded from the IL polygon) still
    // lands on the PS box.
    expect(getCountryFromCoords(31.9038, 35.2034)).toBe('PS'); // Ramallah
    expect(getCountryFromCoords(31.5017, 34.4668)).toBe('PS'); // Gaza City
  });

  it('ATLAS-SVC-005l: the loose XK box does not steal North Macedonian points inside the MK polygon', () => {
    // Same mechanism as PS: XK is polygon-less and its box overlaps North Macedonia.
    // Skopje and Tetovo lie in the MK polygon and must resolve to MK, not XK — while
    // Pristina (in no neighbouring polygon) still resolves to XK.
    expect(getCountryFromCoords(41.9973, 21.4280)).toBe('MK'); // Skopje
    expect(getCountryFromCoords(42.0106, 20.9714)).toBe('MK'); // Tetovo
    expect(getCountryFromCoords(42.6629, 21.1655)).toBe('XK'); // Pristina
  });
});

// ── isPointInCountryBox — sanity gate for the address-derived region fallback ──────

describe('isPointInCountryBox', () => {
  it('ATLAS-SVC-006a: accepts a country whose box genuinely covers the point, even where the exact border excludes it', () => {
    // Bollendorf-Pont: on the Luxembourg side of the border, but outside LU's exact
    // simplified polygon (see getCountryFromCoords returning DE for this same point in
    // atlasService.test.ts's region-resolution tests). The box gate must stay loose
    // enough to admit this, or the Luxembourg address-fallback fix would regress.
    expect(isPointInCountryBox('LU', 49.8502458, 6.3576404)).toBe(true);
  });

  it('ATLAS-SVC-006b: rejects a country whose box is nowhere near the point', () => {
    // Mid-Atlantic, nowhere close to Japan under any simplification.
    expect(isPointInCountryBox('JP', 20, -35)).toBe(false);
  });

  it('ATLAS-SVC-006c: returns false for an unknown/garbage country code', () => {
    expect(isPointInCountryBox('ZZ', 48.85, 2.35)).toBe(false);
  });
});

// ── Removing a visited country sticks (#1490) ───────────────────────────────

describe('unmarkCountryVisited — tombstones', () => {
  it('ATLAS-SVC-021: #1490 a country derived from a flight endpoint stays removed across reloads', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Layover Trip' });
    const reservation = createReservation(testDb, trip.id, { type: 'flight' });
    // Brussels -> Tokyo. JP is derived from the endpoint; it has no visited_countries
    // row, so the DELETE in unmarkCountryVisited used to affect nothing and getStats
    // re-derived JP on the very next call.
    insertReservationEndpoint(testDb, reservation.id, 'from', 0, 50.9014, 4.4844);
    insertReservationEndpoint(testDb, reservation.id, 'to', 1, 35.6762, 139.6503);

    const before = await getStats(user.id);
    expect(before.countries.map((c: { code: string }) => c.code)).toContain('JP');

    unmarkCountryVisited(user.id, 'JP');

    const after = await getStats(user.id);
    expect(after.countries.map((c: { code: string }) => c.code)).not.toContain('JP');
    // BE is untouched — removal is scoped to the one country.
    expect(after.countries.map((c: { code: string }) => c.code)).toContain('BE');
  });

  it('ATLAS-SVC-022: #1490 re-marking a removed country brings it back', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Layover Trip' });
    const reservation = createReservation(testDb, trip.id, { type: 'flight' });
    insertReservationEndpoint(testDb, reservation.id, 'from', 0, 50.9014, 4.4844);
    insertReservationEndpoint(testDb, reservation.id, 'to', 1, 35.6762, 139.6503);

    unmarkCountryVisited(user.id, 'JP');
    expect((await getStats(user.id)).countries.map((c: { code: string }) => c.code)).not.toContain('JP');

    markCountryVisited(user.id, 'JP');
    expect((await getStats(user.id)).countries.map((c: { code: string }) => c.code)).toContain('JP');
  });

  it('ATLAS-SVC-023: #1490 a removed country reappears once it has a real place', async () => {
    // The tombstone only suppresses zero-count derivations. Planning an actual place in
    // the country is an unambiguous signal it was visited, so it should show again.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Japan Trip' });
    const reservation = createReservation(testDb, trip.id, { type: 'flight' });
    insertReservationEndpoint(testDb, reservation.id, 'from', 0, 50.9014, 4.4844);
    insertReservationEndpoint(testDb, reservation.id, 'to', 1, 35.6762, 139.6503);

    unmarkCountryVisited(user.id, 'JP');
    expect((await getStats(user.id)).countries.map((c: { code: string }) => c.code)).not.toContain('JP');

    insertPlace(testDb, trip.id, 'Senso-ji', 'Asakusa, Tokyo, Japan');

    const after = await getStats(user.id);
    const jp = after.countries.find((c: { code: string }) => c.code === 'JP');
    expect(jp).toBeDefined();
    expect(jp!.placeCount).toBe(1);
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

  it('ATLAS-UNIT-027: a US place whose address ends in a state abbreviation resolves to US, not the colliding ISO country', async () => {
    // getCountryFromAddress()'s "2-letter uppercase last segment = ISO code" heuristic
    // parses "..., CA" as Canada (a real ISO code), not California. resolveCountryCodeSync
    // used to try the address FIRST, so a place with coordinates that plainly resolve to the
    // US via getCountryFromCoords would still get bucketed under Canada. Mirrors the
    // region-level fix (ATLAS-UNIT-024) at the country level.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'San Francisco Trip' });
    insertPlaceWithCoords(testDb, trip.id, 'Hotel Pickwick', 37.7830549, -122.4066689, '85 5th St, San Francisco, CA');

    const stats = await getStats(user.id);

    const codes = stats.countries.map((c: any) => c.code);
    expect(codes).toContain('US');
    expect(codes).not.toContain('CA');
  });

  it('ATLAS-UNIT-028: lastTrip.countryCode resolves via coordinates, not a misparsed state-abbreviation address', async () => {
    // lastTrip.countryCode calls resolveCountryCodeSync directly (not through the
    // place_regions cache), so this exercises the fix independently of ATLAS-UNIT-027.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Past NY Trip', start_date: '2023-05-01', end_date: '2023-05-10' });
    insertPlaceWithCoords(testDb, trip.id, 'Imperial Court Hotel', 40.7848394, -73.981643, '307 W 79th Street, New York, NY');

    const stats = await getStats(user.id);

    expect(stats.lastTrip).not.toBeNull();
    expect(stats.lastTrip!.countryCode).toBe('US');
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

  it('ATLAS-UNIT-021: a GB place resolves against the bundled admin1 polygon without calling Nominatim', async () => {
    // The shipped geoBoundaries bundle only carries GB's 4 constituent countries
    // (England/Scotland/Wales/Northern Ireland) — no county/borough level. Resolving
    // Old Trafford's coordinates directly against those polygons lands on GB-ENG, the
    // same feature the client highlights, with no reverse-geocode round trip at all.
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Manchester Trip' });
    insertPlaceWithCoords(testDb, trip.id, 'Old Trafford', 53.4631, -2.2913);

    await getVisitedRegions(user.id);
    // The background geocode is fire-and-forget; give its microtasks a turn to settle
    // before reading the now-cached result back.
    await new Promise(resolve => setTimeout(resolve, 10));
    const result = await getVisitedRegions(user.id);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.regions['GB']).toBeDefined();
    const codes = result.regions['GB'].map((r: any) => r.code);
    expect(codes).toContain('GB-ENG');
  });

  it('ATLAS-UNIT-022: a place whose Nominatim region level is finer than the bundle (Spain province vs autonomous community) still resolves to a bundle-matching feature', async () => {
    // Regression for the Barcelona/Madrid bug: Nominatim's ISO3166-2-lvl6 gives the
    // *province* (ES-B), but the bundle only has the *autonomous-community* level
    // (Catalonia). Resolving by coordinates instead of trusting the geocoder's level
    // guarantees a code the client bundle actually carries.
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Barcelona Trip' });
    insertPlaceWithCoords(testDb, trip.id, 'Sagrada Familia', 41.4036, 2.1744);

    await getVisitedRegions(user.id);
    // The background geocode is fire-and-forget; give its microtasks a turn to settle
    // before reading the now-cached result back.
    await new Promise(resolve => setTimeout(resolve, 10));
    const result = await getVisitedRegions(user.id);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.regions['ES']).toBeDefined();
    expect(result.regions['ES'][0].code).not.toBe('ES-B');
  });

  it('ATLAS-UNIT-023: a place address disambiguates a border point the simplified admin0 polygon puts in the wrong country', async () => {
    // A real Airbnb at Bollendorf-Pont sits on the Luxembourg side of the Sauer river,
    // but the coordinates alone fall inside Germany's simplified admin0 polygon
    // (border-simplification slop) — getCountryFromCoords(lat, lng) returns DE, so a
    // coordinate-only region lookup finds nothing in DE. The place's own stored address
    // says Luxembourg, so it is retried as a fallback before ever reaching Nominatim.
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Luxembourg Trip' });
    insertPlaceWithCoords(
      testDb, trip.id, 'Airbnb - Welcome Home', 49.8502458, 6.3576404,
      '4 Gruusswiss, Bollendorf-Pont, Distrikt Gréiwemaacher 6555, Luxembourg'
    );

    await getVisitedRegions(user.id);
    await new Promise(resolve => setTimeout(resolve, 10));
    const result = await getVisitedRegions(user.id);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.regions['LU']).toBeDefined();
    expect(result.regions['DE']).toBeUndefined();
  });

  it('ATLAS-UNIT-024: a US place whose address ends in a state abbreviation still resolves by coordinates, ignoring the address', async () => {
    // getCountryFromAddress() treats any 2-letter uppercase last address segment as an
    // ISO country code — "...CA" parses as Canada, not California. Trusting the address
    // FIRST (as ATLAS-UNIT-023 might suggest) would send a San Francisco hotel's region
    // lookup to Canada and fail to find one, costing a needless Nominatim round trip (or
    // worse, a wrong match) for every US place whose address ends in a state code.
    // Coordinates resolve this correctly on their own, so the address must only be
    // consulted when the coordinate-only lookup finds nothing.
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'San Francisco Trip' });
    insertPlaceWithCoords(
      testDb, trip.id, 'Hotel Pickwick', 37.7830549, -122.4066689,
      '85 5th St, San Francisco, CA'
    );

    await getVisitedRegions(user.id);
    await new Promise(resolve => setTimeout(resolve, 10));
    const result = await getVisitedRegions(user.id);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.regions['US']).toBeDefined();
    expect(result.regions['CA']).toBeUndefined();
  });

  it('ATLAS-UNIT-025: when the bundle-only lookup finds nothing, the Nominatim fallback keeps the coarse GB constituent-country code instead of rescuing to a finer one', async () => {
    // Mid-Atlantic open ocean — getCountryFromCoords finds no country and there's no
    // address, so this always falls through to the Nominatim path. That path used to re-query at a
    // finer zoom for GB and swap in a county/borough code (GB-MAN, GB-LND, …) that targeted
    // Natural Earth's old, finer GB polygons — the current geoBoundaries bundle only has the
    // 4 constituent countries, so that rescued code could never match anything and the
    // region would never highlight. The coarse Nominatim result (GB-ENG) IS a real bundle
    // feature and must be kept as-is, with a single geocode call (no zoom=10 re-query).
    vi.useFakeTimers();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ address: { country_code: 'gb', 'ISO3166-2-lvl4': 'GB-ENG', state: 'England' } }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Middle of the ocean' });
    insertPlaceWithCoords(testDb, trip.id, 'Buoy', 10, -40);

    await getVisitedRegions(user.id);
    await vi.runAllTimersAsync();
    const result = await getVisitedRegions(user.id);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.regions['GB']).toBeDefined();
    const codes = result.regions['GB'].map((r: any) => r.code);
    expect(codes).toContain('GB-ENG');

    vi.useRealTimers();
  });

  it('ATLAS-UNIT-026: an address country nowhere near the coordinates is rejected before it can produce a bogus region match', async () => {
    // Coordinates in the open mid-Atlantic (no country polygon contains them) paired
    // with a stored address ending in "JP" — getCountryFromAddress()'s 2-letter-uppercase
    // heuristic returns 'JP' regardless of how implausible that is for these coordinates.
    // Without a sanity check, getRegionFromCoords('JP', ...) would only return null because
    // no Japanese region polygon happens to reach the mid-Atlantic — but that's incidental,
    // not a guarantee, for some other coordinate/bogus-code combination. The admin0 box
    // gate rejects JP outright (its bounding box is nowhere near these coordinates) so the
    // address is never even tried against JP's regions, and resolution correctly falls
    // through to Nominatim instead of risking a wrong match.
    vi.useFakeTimers();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ address: {} }), // Nominatim finds nothing here either
    });
    vi.stubGlobal('fetch', mockFetch);

    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Mid-Atlantic buoy' });
    // Different coordinates than ATLAS-UNIT-025's mid-Atlantic point — reverseGeocodeRegion's
    // regionCache is an in-memory Map keyed by rounded lat/lng and persists across tests in
    // this file, so reusing the same point would silently hit that cached result instead of
    // exercising this test's fetch/gate path.
    insertPlaceWithCoords(testDb, trip.id, 'Weather buoy', 20, -35, '123 Nowhere Rd, JP');

    await getVisitedRegions(user.id);
    await vi.runAllTimersAsync();
    const result = await getVisitedRegions(user.id);

    expect(mockFetch).toHaveBeenCalledTimes(1); // fell through to Nominatim, not a fabricated JP match
    expect(result.regions['JP']).toBeUndefined();

    vi.useRealTimers();
  });
});

// ── unmarkRegionVisited — tombstones + country cascade ──────────────────────

// Places are region-resolved by a fire-and-forget background task (see reverseGeocodeRegion
// callers); a single getVisitedRegions() call returns before it settles. Populate the cache
// deterministically before asserting against it or calling unmarkRegionVisited (which reads
// place_regions directly, not through this function).
async function primeRegionCache(userId: number): Promise<void> {
  await getVisitedRegions(userId);
  await new Promise(resolve => setTimeout(resolve, 10));
}

describe('unmarkRegionVisited — tombstones + country cascade', () => {
  it('ATLAS-SVC-024: hides a region derived from a real place, not just a manually-marked one', async () => {
    // Unlike unmarkCountryVisited (ATLAS-SVC-023), a region hide is NOT lifted just
    // because it has a real place — that is exactly the case this feature exists for (a
    // real place that resolved to a region the user doesn't want highlighted, e.g. a
    // border-simplification misassignment), so it must stay hidden regardless of
    // placeCount until explicitly re-marked.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'SF Trip' });
    insertPlaceWithCoords(testDb, trip.id, 'Golden Gate Park', 37.7694, -122.4862);
    await primeRegionCache(user.id);

    const before = await getVisitedRegions(user.id);
    expect(before.regions['US']?.map((r: any) => r.code)).toContain('US-CA');

    unmarkRegionVisited(user.id, 'US-CA');

    const after = await getVisitedRegions(user.id);
    expect(after.regions['US']?.map((r: any) => r.code) ?? []).not.toContain('US-CA');
  });

  it('ATLAS-SVC-025: re-marking a hidden region brings it back', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'SF Trip' });
    insertPlaceWithCoords(testDb, trip.id, 'Golden Gate Park', 37.7694, -122.4862);
    await primeRegionCache(user.id);

    unmarkRegionVisited(user.id, 'US-CA');
    expect((await getVisitedRegions(user.id)).regions['US']?.map((r: any) => r.code) ?? []).not.toContain('US-CA');

    markRegionVisited(user.id, 'US-CA', 'California', 'US');
    expect((await getVisitedRegions(user.id)).regions['US']?.map((r: any) => r.code)).toContain('US-CA');
  });

  it('ATLAS-SVC-026: hiding a country\'s only visible region also hides the country', async () => {
    // Uses a manually-marked region rather than a real place: getStats' places-derived
    // country entries are never suppressed by hidden_countries (#1490 — a country with a
    // real place always reappears, see ATLAS-SVC-023), so the cascade can only ever have a
    // visible effect on a country with no real place backing it, exactly like
    // unmarkCountryVisited's own tombstone tests above use flight-endpoint-derived
    // countries rather than real places for the same reason.
    const { user } = createUser(testDb);
    markRegionVisited(user.id, 'JP-13', 'Tokyo', 'JP'); // also auto-marks JP visited

    const beforeStats = await getStats(user.id);
    expect(beforeStats.countries.map((c: any) => c.code)).toContain('JP');

    unmarkRegionVisited(user.id, 'JP-13');

    const afterStats = await getStats(user.id);
    expect(afterStats.countries.map((c: any) => c.code)).not.toContain('JP');
  });

  it('ATLAS-SVC-027: hiding one of a country\'s several regions does NOT cascade-hide the country', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'NY road trip' });
    insertPlaceWithCoords(testDb, trip.id, 'Boston hotel', 42.3588336, -71.0578303); // MA
    insertPlaceWithCoords(testDb, trip.id, 'Philly hotel', 39.9527237, -75.1635262); // PA
    await primeRegionCache(user.id);

    unmarkRegionVisited(user.id, 'US-MA');

    const stats = await getStats(user.id);
    expect(stats.countries.map((c: any) => c.code)).toContain('US');
    const regions = (await getVisitedRegions(user.id)).regions['US'].map((r: any) => r.code);
    expect(regions).not.toContain('US-MA');
    expect(regions).toContain('US-PA');
  });

  it('ATLAS-SVC-028: re-marking a region whose country was cascade-hidden brings the country back too', async () => {
    const { user } = createUser(testDb);
    markRegionVisited(user.id, 'JP-13', 'Tokyo', 'JP');

    unmarkRegionVisited(user.id, 'JP-13');
    expect((await getStats(user.id)).countries.map((c: any) => c.code)).not.toContain('JP');

    markRegionVisited(user.id, 'JP-13', 'Tokyo', 'JP');

    const stats = await getStats(user.id);
    expect(stats.countries.map((c: any) => c.code)).toContain('JP');
  });
});
