/**
 * Unit tests for the DI-native AtlasService and the atlas-geo helper module —
 * ATLAS-UNIT-001..028 and ATLAS-SVC-001..028 moved 1:1 from the legacy
 * tests/unit/services/atlasService.test.ts (case IDs preserved), plus
 * Uses a real in-memory SQLite DB so the SQL
 * logic is exercised faithfully; the pure-geo functions are imported straight
 * from atlas-geo (their caches are module-scoped there on purpose).
 */
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
import { getCountryFromCoords, getCountryFromAddress, isPointInCountryBox, reverseGeocodeCountry, getRegionGeo, getCountryGeo } from '../../../src/nest/atlas/atlas-geo';
import { cacheKeyFor, getCached, setCached } from '../../../src/nest/geo/nominatim.client';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { AtlasService, BucketItemExistsError } from '../../../src/nest/atlas/atlas.service';

// Direct construction over the shared test connection — no TestingModule (repo
// convention for DI-native service unit tests).
const atlas = new AtlasService(new DatabaseService(testDb));

function insertReservationEndpoint(
  db: any,
  reservationId: number,
  role: 'from' | 'to' | 'stop',
  sequence: number,
  lat: number,
  lng: number,
  code: string | null = null,
  localDate: string | null = null,
  localTime: string | null = null
) {
  db.prepare(
    'INSERT INTO reservation_endpoints (reservation_id, role, sequence, name, lat, lng, code, local_date, local_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(reservationId, role, sequence, `Endpoint ${sequence}`, lat, lng, code, localDate, localTime);
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

    const stats = await atlas.stats(user.id);

    expect(stats.mostVisited).toBeNull();
    expect(stats.countries).toEqual([]);
    expect(stats.stats.totalPlaces).toBe(1);
    expect(stats.stats.totalCountries).toBe(0);
  });

  it('ATLAS-UNIT-002: returns the country with the highest placeCount as mostVisited', async () => {
    const { user } = createUser(testDb);
    // Dated in the past on purpose: since #1048 only a trip that has already started
    // counts as visited, and mostVisited/totalCountries only look at visited countries.
    const trip = createTrip(testDb, user.id, { title: 'Euro Tour', start_date: '2023-05-01', end_date: '2023-05-10' });

    // 3 places in France, 1 in Germany → France should win
    for (let i = 0; i < 3; i++) {
      insertPlace(testDb, trip.id, `Paris Place ${i}`, `Street ${i}, Paris, France`);
    }
    insertPlace(testDb, trip.id, 'Berlin Place', 'Some Street, Berlin, Germany');

    const stats = await atlas.stats(user.id);

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

    const stats = await atlas.stats(user.id);

    expect(stats.countries).toHaveLength(2);
    expect(stats.countries.map((c: { code: string }) => c.code).sort()).toEqual(['AU', 'JP']);
    expect(stats.stats.totalTrips).toBe(0);
    expect(stats.stats.totalCountries).toBe(2);
  });

  it('ATLAS-UNIT-004: single country yields mostVisited equal to that country', async () => {
    const { user } = createUser(testDb);
    // Past dates — see ATLAS-UNIT-002; a dateless trip is an 'idea' and never mostVisited.
    const trip = createTrip(testDb, user.id, { title: 'Italy Trip', start_date: '2023-05-01', end_date: '2023-05-10' });
    insertPlace(testDb, trip.id, 'Colosseum', 'Piazza del Colosseo, Rome, Italy');

    const stats = await atlas.stats(user.id);

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

    const stats = await atlas.stats(user.id);

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

    const stats = await atlas.stats(user.id);

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

    const stats = await atlas.stats(user.id);

    const codes = stats.countries.map((c: { code: string }) => c.code);
    expect(codes).toContain('ES');
    expect(codes).not.toContain('DZ');
  });
});

// ── #1535: the layover the role filter can't see ─────────────────────────────

/**
 * When the legs of one journey arrive as two separate bookings (an AirTrail import
 * whose flights never chained), the connection airport is the legitimate 'to' of the
 * first and the legitimate 'from' of the second, so the role filter from #1486 lets
 * it through. Brussels to Helsinki to New York throughout: BE and US were reached,
 * Finland was a plane change.
 */
describe('getStats layover pairs across two bookings', () => {
  const BRU = { lat: 50.9014, lng: 4.4844, code: 'BRU' };
  const HEL = { lat: 60.3172, lng: 24.9633, code: 'HEL' };
  const JFK = { lat: 40.6413, lng: -73.7781, code: 'JFK' };

  type Clock = { date: string | null; time: string | null };

  function inboundToHelsinki(tripId: number, arrival: Clock) {
    const res = createReservation(testDb, tripId, { type: 'flight', title: 'BRU-HEL' });
    insertReservationEndpoint(testDb, res.id, 'from', 0, BRU.lat, BRU.lng, BRU.code, arrival.date, '07:00');
    insertReservationEndpoint(testDb, res.id, 'to', 1, HEL.lat, HEL.lng, HEL.code, arrival.date, arrival.time);
    return res;
  }

  function onwardFromHelsinki(tripId: number, departure: Clock, type = 'flight') {
    const res = createReservation(testDb, tripId, { type, title: 'HEL-JFK' });
    insertReservationEndpoint(testDb, res.id, 'from', 0, HEL.lat, HEL.lng, HEL.code, departure.date, departure.time);
    insertReservationEndpoint(testDb, res.id, 'to', 1, JFK.lat, JFK.lng, JFK.code, departure.date, '15:00');
    return res;
  }

  const codesFor = async (userId: number) =>
    (await atlas.stats(userId)).countries.map((c: { code: string }) => c.code);

  it('ATLAS-UNIT-044 (#1535): a hub arrived at and left again the same day is not visited', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'New York via Helsinki' });
    inboundToHelsinki(trip.id, { date: '2026-08-01', time: '09:30' });
    onwardFromHelsinki(trip.id, { date: '2026-08-01', time: '11:00' });

    const codes = await codesFor(user.id);
    expect(codes).toContain('BE');
    expect(codes).toContain('US');
    expect(codes).not.toContain('FI');
  });

  it('ATLAS-UNIT-045 (#1535): a hub the traveler left two days later stays visited', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Helsinki stopover' });
    inboundToHelsinki(trip.id, { date: '2026-08-01', time: '09:30' });
    onwardFromHelsinki(trip.id, { date: '2026-08-03', time: '11:00' });

    expect(await codesFor(user.id)).toContain('FI');
  });

  it('ATLAS-UNIT-046 (#1535): a pair with no clocks pairs on the booking dates', async () => {
    // The case the reporter actually has: a date-only AirTrail flight leaves the
    // endpoints without local parts, so only reservation_time carries the day.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'New York via Helsinki' });
    const inbound = inboundToHelsinki(trip.id, { date: null, time: null });
    const onward = onwardFromHelsinki(trip.id, { date: null, time: null });
    const setTime = testDb.prepare('UPDATE reservations SET reservation_time = ? WHERE id = ?');
    setTime.run('2026-08-01', inbound.id);
    setTime.run('2026-08-01', onward.id);

    const codes = await codesFor(user.id);
    expect(codes).toContain('BE');
    expect(codes).toContain('US');
    expect(codes).not.toContain('FI');
  });

  it('ATLAS-UNIT-047 (#1535): clockless bookings two days apart keep the hub visited', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Helsinki stopover' });
    const inbound = inboundToHelsinki(trip.id, { date: null, time: null });
    const onward = onwardFromHelsinki(trip.id, { date: null, time: null });
    const setTime = testDb.prepare('UPDATE reservations SET reservation_time = ? WHERE id = ?');
    setTime.run('2026-08-01', inbound.id);
    setTime.run('2026-08-03', onward.id);

    expect(await codesFor(user.id)).toContain('FI');
  });

  it('ATLAS-UNIT-048 (#1535): a place in the layover country keeps it visited', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'New York via Helsinki' });
    inboundToHelsinki(trip.id, { date: '2026-08-01', time: '09:30' });
    onwardFromHelsinki(trip.id, { date: '2026-08-01', time: '11:00' });
    insertPlace(testDb, trip.id, 'Kamppi Chapel', 'Simonkatu 7, Helsinki, Finland');

    expect(await codesFor(user.id)).toContain('FI');
  });

  it('ATLAS-UNIT-049 (#1366 guard): a car rental picked up where the flight landed keeps the country', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Driving Finland' });
    inboundToHelsinki(trip.id, { date: '2026-08-01', time: '09:30' });
    onwardFromHelsinki(trip.id, { date: '2026-08-01', time: '11:00' }, 'car_rental');

    expect(await codesFor(user.id)).toContain('FI');
  });

  it('ATLAS-UNIT-050 (#1535): a cancelled onward flight is no connection', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Helsinki, stuck' });
    inboundToHelsinki(trip.id, { date: '2026-08-01', time: '09:30' });
    const onward = onwardFromHelsinki(trip.id, { date: '2026-08-01', time: '11:00' });
    testDb.prepare('UPDATE reservations SET status = ? WHERE id = ?').run('cancelled', onward.id);

    expect(await codesFor(user.id)).toContain('FI');
  });

  it('ATLAS-UNIT-051 (#1535): an onward flight on another trip is another journey', async () => {
    // Landing home from one trip and leaving on the next within a day is not a plane
    // change, and the pairing spans every trip the user can see.
    const { user } = createUser(testDb);
    const arriving = createTrip(testDb, user.id, { title: 'Back from Brussels' });
    const leaving = createTrip(testDb, user.id, { title: 'Off to New York' });
    inboundToHelsinki(arriving.id, { date: '2026-08-01', time: '09:30' });
    onwardFromHelsinki(leaving.id, { date: '2026-08-01', time: '11:00' });

    expect(await codesFor(user.id)).toContain('FI');
  });

  it('ATLAS-UNIT-052 (#1535): a same-day out-and-back is a day in the country, not a transfer', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'A day in Helsinki' });
    inboundToHelsinki(trip.id, { date: '2026-08-01', time: '09:30' });
    const back = createReservation(testDb, trip.id, { type: 'flight', title: 'HEL-BRU' });
    insertReservationEndpoint(testDb, back.id, 'from', 0, HEL.lat, HEL.lng, HEL.code, '2026-08-01', '18:00');
    insertReservationEndpoint(testDb, back.id, 'to', 1, BRU.lat, BRU.lng, BRU.code, '2026-08-01', '20:30');

    expect(await codesFor(user.id)).toContain('FI');
  });

  it('ATLAS-UNIT-053 (#1535): a return into the other airport of the same city is still a day away', async () => {
    // Same day trip as ATLAS-UNIT-052, but home into Charleroi instead of Zaventem, the
    // way a cheap return is booked. Comparing the airports alone reads that as flying
    // onwards and drops Finland, though the traveler spent the day in Helsinki.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'A day in Helsinki' });
    inboundToHelsinki(trip.id, { date: '2026-08-01', time: '09:30' });
    const back = createReservation(testDb, trip.id, { type: 'flight', title: 'HEL-CRL' });
    insertReservationEndpoint(testDb, back.id, 'from', 0, HEL.lat, HEL.lng, HEL.code, '2026-08-01', '18:00');
    insertReservationEndpoint(testDb, back.id, 'to', 1, 50.4592, 4.4538, 'CRL', '2026-08-01', '20:30');

    const codes = await codesFor(user.id);
    expect(codes).toContain('FI');
    expect(codes).toContain('BE');
  });
});

// ── the shared geocode cache ──────────────────────────────────────

/**
 * The cache moved to geo/ with the client, and its key gained the query shape.
 * That is not cosmetic: atlas asks at zoom 3 and 8, maps at zoom 18, and a key
 * of coordinates alone would answer a street lookup with a country name.
 */
const countryKey = (lat: number, lng: number) => cacheKeyFor(lat, lng, 'country');

describe('the shared geocode cache', () => {
  it('ATLAS-SVC-001: a miss is undefined, not null', () => {
    // Uniquely large lat values guarantee no prior entry.
    expect(getCached(countryKey(9001.001, 9001.001))).toBeUndefined();
  });

  it('ATLAS-SVC-002: what goes in comes back out', () => {
    setCached(countryKey(9002.002, 9002.002), 'DE');
    expect(getCached(countryKey(9002.002, 9002.002))).toBe('DE');
  });

  it('ATLAS-SVC-003: null is a stored value, meaning "asked, nobody knows"', () => {
    setCached(countryKey(9003.003, 9003.003), null);
    expect(getCached(countryKey(9003.003, 9003.003))).toBeNull();
  });

  it('ATLAS-SVC-004: different coordinates stay separate', () => {
    setCached(countryKey(9004.004, 9004.004), 'FR');
    setCached(countryKey(9004.005, 9004.005), 'ES');
    expect(getCached(countryKey(9004.004, 9004.004))).toBe('FR');
    expect(getCached(countryKey(9004.005, 9004.005))).toBe('ES');
  });

  it('ATLAS-SVC-004b: the same coordinates under different query shapes do not collide', () => {
    setCached(cacheKeyFor(9005.005, 9005.005, 'country'), 'IT');
    setCached(cacheKeyFor(9005.005, 9005.005, 'region'), 'Tuscany');
    expect(getCached(cacheKeyFor(9005.005, 9005.005, 'country'))).toBe('IT');
    expect(getCached(cacheKeyFor(9005.005, 9005.005, 'region'))).toBe('Tuscany');
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

    const before = await atlas.stats(user.id);
    expect(before.countries.map((c: { code: string }) => c.code)).toContain('JP');

    atlas.unmarkCountry(user.id, 'JP');

    const after = await atlas.stats(user.id);
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

    atlas.unmarkCountry(user.id, 'JP');
    expect((await atlas.stats(user.id)).countries.map((c: { code: string }) => c.code)).not.toContain('JP');

    atlas.markCountry(user.id, 'JP');
    expect((await atlas.stats(user.id)).countries.map((c: { code: string }) => c.code)).toContain('JP');
  });

  it('ATLAS-SVC-023: #1490 a removed country reappears once it has a real place', async () => {
    // The tombstone only suppresses zero-count derivations. Planning an actual place in
    // the country is an unambiguous signal it was visited, so it should show again.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Japan Trip' });
    const reservation = createReservation(testDb, trip.id, { type: 'flight' });
    insertReservationEndpoint(testDb, reservation.id, 'from', 0, 50.9014, 4.4844);
    insertReservationEndpoint(testDb, reservation.id, 'to', 1, 35.6762, 139.6503);

    atlas.unmarkCountry(user.id, 'JP');
    expect((await atlas.stats(user.id)).countries.map((c: { code: string }) => c.code)).not.toContain('JP');

    insertPlace(testDb, trip.id, 'Senso-ji', 'Asakusa, Tokyo, Japan');

    const after = await atlas.stats(user.id);
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
  // The first call streams the multi-MB admin1.geojson.gz through the brace-depth
  // splitter and caches the result for the process. That build alone takes ~2.5s on a
  // quiet machine and more when every vitest worker is busy, so whichever test called
  // getRegionGeo first used to pay for it and blow the 5s default. Warm the store here
  // with a budget that fits the build; the tests below then measure only the lookup.
  beforeAll(async () => {
    await getRegionGeo(['ZZ']);
  }, 60_000);

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

    const stats = await atlas.stats(user.id);

    // March 1, 2, 3 → diff = 2 + 1 = 3
    expect(stats.stats.totalDays).toBe(3);
  });

  it('ATLAS-UNIT-006: totalDays is 0 when trip has no dates', async () => {
    const { user } = createUser(testDb);
    createTrip(testDb, user.id, { title: 'Dateless' });

    const stats = await atlas.stats(user.id);

    expect(stats.stats.totalDays).toBe(0);
  });

  it('ATLAS-UNIT-007: manually marked country is merged when user has trips but no resolvable places for that country', async () => {
    const { user } = createUser(testDb);
    createTrip(testDb, user.id, { title: 'Japan Trip', start_date: '2024-01-01', end_date: '2024-01-10' });
    testDb.prepare('INSERT INTO visited_countries (user_id, country_code) VALUES (?, ?)').run(user.id, 'JP');

    const stats = await atlas.stats(user.id);

    const codes = stats.countries.map((c: any) => c.code);
    expect(codes).toContain('JP');
    const jp = stats.countries.find((c: any) => c.code === 'JP');
    expect(jp?.placeCount).toBe(0);
  });

  it('ATLAS-UNIT-008: lastTrip is resolved with a country code when its places have an address', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Past France Trip', start_date: '2023-05-01', end_date: '2023-05-10' });
    insertPlace(testDb, trip.id, 'Eiffel Tower', 'Champ de Mars, Paris, France');

    const stats = await atlas.stats(user.id);

    expect(stats.lastTrip).not.toBeNull();
    expect(stats.lastTrip!.countryCode).toBe('FR');
  });

  it('ATLAS-UNIT-009: nextTrip has daysUntil calculated', async () => {
    const { user } = createUser(testDb);
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    createTrip(testDb, user.id, { title: 'Future Trip', start_date: futureDateStr });

    const stats = await atlas.stats(user.id);

    expect(stats.nextTrip).not.toBeNull();
    expect(stats.nextTrip!.daysUntil).toBeGreaterThan(0);
  });

  it('ATLAS-UNIT-010: streak counts consecutive years with trips and firstYear is the earliest', async () => {
    const { user } = createUser(testDb);
    const currentYear = new Date().getFullYear();
    createTrip(testDb, user.id, { title: 'This Year', start_date: `${currentYear}-06-01`, end_date: `${currentYear}-06-10` });
    createTrip(testDb, user.id, { title: 'Last Year', start_date: `${currentYear - 1}-07-01`, end_date: `${currentYear - 1}-07-10` });

    const stats = await atlas.stats(user.id);

    expect(stats.streak).toBeGreaterThanOrEqual(1);
    expect(stats.firstYear).toBe(currentYear - 1);
  });

  it('ATLAS-UNIT-011: tripsThisYear counts only trips whose start_date is in the current year', async () => {
    const { user } = createUser(testDb);
    const currentYear = new Date().getFullYear();
    createTrip(testDb, user.id, { title: 'This Year', start_date: `${currentYear}-03-01` });
    createTrip(testDb, user.id, { title: 'Last Year', start_date: `${currentYear - 1}-03-01` });

    const stats = await atlas.stats(user.id);

    expect(stats.tripsThisYear).toBe(1);
  });

  it('ATLAS-UNIT-012: lastTrip is null when all trips end in the future', async () => {
    const { user } = createUser(testDb);
    const nextYear = new Date().getFullYear() + 1;
    createTrip(testDb, user.id, { title: 'Future', start_date: `${nextYear}-01-01`, end_date: `${nextYear}-01-10` });

    const stats = await atlas.stats(user.id);

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

    const stats = await atlas.stats(user.id);

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

    const stats = await atlas.stats(user.id);

    expect(stats.lastTrip).not.toBeNull();
    expect(stats.lastTrip!.countryCode).toBe('US');
  });
});

// ── getCountryPlaces ─────────────────────────────────────────────────────────

describe('getCountryPlaces', () => {
  it('ATLAS-UNIT-013: returns empty result when user has no trips', () => {
    const { user } = createUser(testDb);

    const result = atlas.countryPlaces(user.id, 'FR');

    expect(result.places).toHaveLength(0);
    expect(result.trips).toHaveLength(0);
    expect(result.manually_marked).toBe(false);
  });

  it('ATLAS-UNIT-014: returns matching places when place address resolves to the requested country', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'France Trip' });
    insertPlace(testDb, trip.id, 'Louvre', '75001 Paris, France');
    insertPlace(testDb, trip.id, 'Berlin Wall', 'Bernauer Str., Berlin, Germany');

    const result = atlas.countryPlaces(user.id, 'FR');

    expect(result.places).toHaveLength(1);
    expect(result.places[0].name).toBe('Louvre');
    expect(result.trips).toHaveLength(1);
    expect(result.trips[0].id).toBe(trip.id);
  });

  it('ATLAS-UNIT-015: manually_marked is true when country is in visited_countries', () => {
    const { user } = createUser(testDb);
    testDb.prepare('INSERT INTO visited_countries (user_id, country_code) VALUES (?, ?)').run(user.id, 'JP');
    createTrip(testDb, user.id, { title: 'Japan' });

    const result = atlas.countryPlaces(user.id, 'JP');

    expect(result.manually_marked).toBe(true);
  });

  it('ATLAS-UNIT-016: place with coordinates resolves via bbox when address is absent', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Coord Trip' });
    // Paris coordinates (48.85°N, 2.35°E) — falls inside FR bounding box
    insertPlaceWithCoords(testDb, trip.id, 'Secret Paris Spot', 48.85, 2.35);

    const result = atlas.countryPlaces(user.id, 'FR');

    expect(result.places).toHaveLength(1);
    expect(result.places[0].name).toBe('Secret Paris Spot');
  });
});

// ── getVisitedRegions ────────────────────────────────────────────────────────

describe('getVisitedRegions', () => {
  it('ATLAS-UNIT-017: returns empty regions object when user has no trips', async () => {
    const { user } = createUser(testDb);

    const result = await atlas.visitedRegions(user.id);

    expect(result.regions).toEqual({});
  });

  it('ATLAS-UNIT-018: returns manually marked regions even when user has no places with coordinates', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('INSERT INTO visited_countries (user_id, country_code) VALUES (?, ?)').run(user.id, 'DE');
    testDb.prepare('INSERT INTO visited_regions (user_id, region_code, region_name, country_code) VALUES (?, ?, ?, ?)').run(user.id, 'DE-BY', 'Bayern', 'DE');

    const result = await atlas.visitedRegions(user.id);

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
    await atlas.visitedRegions(user.id);
    // Advance all pending timers (including the 1100ms Nominatim rate-limit delay)
    await vi.runAllTimersAsync();
    // Second call returns now-cached data
    const result = await atlas.visitedRegions(user.id);

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

    const result = await atlas.visitedRegions(user.id);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.regions['FR']).toBeDefined();
    const codes = result.regions['FR'].map((r: any) => r.code);
    expect(codes).toContain('FR-75');
  });

  it('ATLAS-UNIT-021: a GB place resolves against the bundled admin1 polygon without calling Nominatim', async () => {
    // GB ships at ADM2 since #1974 — the 216 counties and unitary authorities,
    // rather than the four constituent countries geoBoundaries calls ADM1.
    // Old Trafford's coordinates therefore land on Trafford itself, which is
    // both the feature the client highlights and the level a person thinks in;
    // still with no reverse-geocode round trip at all.
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Manchester Trip' });
    insertPlaceWithCoords(testDb, trip.id, 'Old Trafford', 53.4631, -2.2913);

    await atlas.visitedRegions(user.id);
    // The background geocode is fire-and-forget; give its microtasks a turn to settle
    // before reading the now-cached result back.
    await new Promise(resolve => setTimeout(resolve, 10));
    const result = await atlas.visitedRegions(user.id);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.regions['GB']).toBeDefined();
    const names = result.regions['GB'].map((r: any) => (r.name || '').toLowerCase());
    // Below the constituent-country level: the borough, not the nation.
    expect(names).not.toContain('england');
    expect(names.some((n: string) => n.includes('trafford'))).toBe(true);
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

    await atlas.visitedRegions(user.id);
    // The background geocode is fire-and-forget; give its microtasks a turn to settle
    // before reading the now-cached result back.
    await new Promise(resolve => setTimeout(resolve, 10));
    const result = await atlas.visitedRegions(user.id);

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

    await atlas.visitedRegions(user.id);
    await new Promise(resolve => setTimeout(resolve, 10));
    const result = await atlas.visitedRegions(user.id);

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

    await atlas.visitedRegions(user.id);
    await new Promise(resolve => setTimeout(resolve, 10));
    const result = await atlas.visitedRegions(user.id);

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

    await atlas.visitedRegions(user.id);
    await vi.runAllTimersAsync();
    const result = await atlas.visitedRegions(user.id);

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

    await atlas.visitedRegions(user.id);
    await vi.runAllTimersAsync();
    const result = await atlas.visitedRegions(user.id);

    expect(mockFetch).toHaveBeenCalledTimes(1); // fell through to Nominatim, not a fabricated JP match
    expect(result.regions['JP']).toBeUndefined();

    vi.useRealTimers();
  });
});

// ── unmarkRegionVisited — tombstones + country cascade ──────────────────────

// Places are region-resolved by a fire-and-forget background task (see reverseGeocodeRegion
// callers); a single atlas.visitedRegions() call returns before it settles. Populate the cache
// deterministically before asserting against it or calling unmarkRegionVisited (which reads
// place_regions directly, not through this function).
async function primeRegionCache(userId: number): Promise<void> {
  await atlas.visitedRegions(userId);
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

    const before = await atlas.visitedRegions(user.id);
    expect(before.regions['US']?.map((r: any) => r.code)).toContain('US-CA');

    atlas.unmarkRegion(user.id, 'US-CA');

    const after = await atlas.visitedRegions(user.id);
    expect(after.regions['US']?.map((r: any) => r.code) ?? []).not.toContain('US-CA');
  });

  it('ATLAS-SVC-025: re-marking a hidden region brings it back', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'SF Trip' });
    insertPlaceWithCoords(testDb, trip.id, 'Golden Gate Park', 37.7694, -122.4862);
    await primeRegionCache(user.id);

    atlas.unmarkRegion(user.id, 'US-CA');
    expect((await atlas.visitedRegions(user.id)).regions['US']?.map((r: any) => r.code) ?? []).not.toContain('US-CA');

    atlas.markRegion(user.id, 'US-CA', 'California', 'US');
    expect((await atlas.visitedRegions(user.id)).regions['US']?.map((r: any) => r.code)).toContain('US-CA');
  });

  it('ATLAS-SVC-026: hiding a country\'s only visible region also hides the country', async () => {
    // Uses a manually-marked region rather than a real place: getStats' places-derived
    // country entries are never suppressed by hidden_countries (#1490 — a country with a
    // real place always reappears, see ATLAS-SVC-023), so the cascade can only ever have a
    // visible effect on a country with no real place backing it, exactly like
    // unmarkCountryVisited's own tombstone tests above use flight-endpoint-derived
    // countries rather than real places for the same reason.
    const { user } = createUser(testDb);
    atlas.markRegion(user.id, 'JP-13', 'Tokyo', 'JP'); // also auto-marks JP visited

    const beforeStats = await atlas.stats(user.id);
    expect(beforeStats.countries.map((c: any) => c.code)).toContain('JP');

    atlas.unmarkRegion(user.id, 'JP-13');

    const afterStats = await atlas.stats(user.id);
    expect(afterStats.countries.map((c: any) => c.code)).not.toContain('JP');
  });

  it('ATLAS-SVC-027: hiding one of a country\'s several regions does NOT cascade-hide the country', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'NY road trip' });
    insertPlaceWithCoords(testDb, trip.id, 'Boston hotel', 42.3588336, -71.0578303); // MA
    insertPlaceWithCoords(testDb, trip.id, 'Philly hotel', 39.9527237, -75.1635262); // PA
    await primeRegionCache(user.id);

    atlas.unmarkRegion(user.id, 'US-MA');

    const stats = await atlas.stats(user.id);
    expect(stats.countries.map((c: any) => c.code)).toContain('US');
    const regions = (await atlas.visitedRegions(user.id)).regions['US'].map((r: any) => r.code);
    expect(regions).not.toContain('US-MA');
    expect(regions).toContain('US-PA');
  });

  it('ATLAS-SVC-028: re-marking a region whose country was cascade-hidden brings the country back too', async () => {
    const { user } = createUser(testDb);
    atlas.markRegion(user.id, 'JP-13', 'Tokyo', 'JP');

    atlas.unmarkRegion(user.id, 'JP-13');
    expect((await atlas.stats(user.id)).countries.map((c: any) => c.code)).not.toContain('JP');

    atlas.markRegion(user.id, 'JP-13', 'Tokyo', 'JP');

    const stats = await atlas.stats(user.id);
    expect(stats.countries.map((c: any) => c.code)).toContain('JP');
  });
});

// ── atlas.bridge.ts delegation ───────────────────────────────────────────────
// ATLAS-SVC-029/030 retired with atlas.bridge.ts itself: the sole consumer
// (legacy authService) went DI-native and injects AtlasService now. 030's
// coordinate pin lives on in ATLAS-SVC-030b below.

describe('getCountryFromCoords coordinate pin', () => {
  it('ATLAS-SVC-030b: resolves Paris coordinates to FR (shared atlas-geo indexes)', () => {
    expect(getCountryFromCoords(48.85, 2.35)).toBe('FR');
  });
});

// ── Quirks fixed after the DI fold (trailing fix(server) commit) ─────────────

describe('atlas quirk fixes', () => {
  it('ATLAS-SVC-031: countryPlaces reports manually_marked for a trip-less user', () => {
    // The legacy early return hardcoded manually_marked: false, so a user who
    // marked a country visited before creating any trip saw it as unmarked.
    const { user } = createUser(testDb);
    testDb.prepare('INSERT INTO visited_countries (user_id, country_code) VALUES (?, ?)').run(user.id, 'JP');

    const result = atlas.countryPlaces(user.id, 'JP');

    // status rides along since #1048 — a manual mark is a visit even with no trips.
    expect(result).toEqual({ places: [], trips: [], manually_marked: true, status: 'visited' });
    expect(atlas.countryPlaces(user.id, 'FR').manually_marked).toBe(false);
  });

  it('ATLAS-SVC-032: updateBucketItem persists lat/lng of exactly 0 (equator/prime meridian)', () => {
    const { user } = createUser(testDb);
    const item = atlas.createBucketItem(user.id, { name: 'Null Island', lat: 10, lng: 10 }) as { id: number };

    const updated = atlas.updateBucketItem(user.id, item.id, { lat: 0, lng: 0 }) as { lat: number; lng: number };

    // The legacy `|| null` binding read 0 as "clear" and wrote NULL.
    expect(updated.lat).toBe(0);
    expect(updated.lng).toBe(0);
  });

  it('ATLAS-SVC-033: updateBucketItem persists an explicit empty-string notes value', () => {
    const { user } = createUser(testDb);
    const item = atlas.createBucketItem(user.id, { name: 'Kyoto', notes: 'old notes' }) as { id: number };

    const updated = atlas.updateBucketItem(user.id, item.id, { notes: '' }) as { notes: string | null };

    // The legacy `|| null` binding collapsed '' to NULL.
    expect(updated.notes).toBe('');
  });

  it("ATLAS-SVC-034: bucket update/delete cannot touch another user's row (user-scoped SQL)", () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const item = atlas.createBucketItem(user.id, { name: 'Mine' }) as { id: number; name: string };

    expect(atlas.updateBucketItem(other.id, item.id, { name: 'Stolen' })).toBeNull();
    expect(atlas.deleteBucketItem(other.id, item.id)).toBe(false);
    const row = testDb.prepare('SELECT name FROM bucket_list WHERE id = ?').get(item.id) as { name: string };
    expect(row.name).toBe('Mine');
  });

  it('ATLAS-SVC-035: unmarkRegion is atomic — a failure mid-flow rolls the region delete back', () => {
    const { user } = createUser(testDb);
    atlas.markRegion(user.id, 'JP-13', 'Tokyo', 'JP');

    // Force the tombstone insert (statement 2 of the flow) to fail by hiding
    // the hidden_regions table; the visited_regions DELETE must roll back.
    testDb.exec('ALTER TABLE hidden_regions RENAME TO hidden_regions_gone');
    try {
      expect(() => atlas.unmarkRegion(user.id, 'JP-13')).toThrow();
    } finally {
      testDb.exec('ALTER TABLE hidden_regions_gone RENAME TO hidden_regions');
    }

    const row = testDb
      .prepare('SELECT 1 FROM visited_regions WHERE user_id = ? AND region_code = ?')
      .get(user.id, 'JP-13');
    expect(row).toBeDefined();
  });

  it('ATLAS-SVC-036: markCountry is atomic — a failure on the tombstone lift rolls the insert back', () => {
    const { user } = createUser(testDb);

    testDb.exec('ALTER TABLE hidden_countries RENAME TO hidden_countries_gone');
    try {
      expect(() => atlas.markCountry(user.id, 'DE')).toThrow();
    } finally {
      testDb.exec('ALTER TABLE hidden_countries_gone RENAME TO hidden_countries');
    }

    const row = testDb
      .prepare('SELECT 1 FROM visited_countries WHERE user_id = ? AND country_code = ?')
      .get(user.id, 'DE');
    expect(row).toBeUndefined();
  });
});

// ── #1898: one bucket-list entry per wish ────────────────────────────────────
//
// Clicking "add to bucket list" twice used to append a second identical row. The
// identity a row is checked against is (user, name, country, target date,
// coordinates) — a different target date is a different wish and stays allowed,
// which is exactly what the report asks for.

describe('bucket-list duplicates (#1898)', () => {
  const countRows = (userId: number): number =>
    (testDb.prepare('SELECT COUNT(*) AS n FROM bucket_list WHERE user_id = ?').get(userId) as { n: number }).n;

  it('ATLAS-SVC-037: adding the same wish twice is refused and writes no second row', () => {
    const { user } = createUser(testDb);
    atlas.createBucketItem(user.id, { name: 'Japan', country_code: 'JP' });

    expect(() => atlas.createBucketItem(user.id, { name: 'Japan', country_code: 'JP' })).toThrow(BucketItemExistsError);
    expect(countRows(user.id)).toBe(1);
  });

  it('ATLAS-SVC-038: the same place with another target date is a separate entry', () => {
    const { user } = createUser(testDb);
    atlas.createBucketItem(user.id, { name: 'Japan', country_code: 'JP' });

    atlas.createBucketItem(user.id, { name: 'Japan', country_code: 'JP', target_date: '2027-05' });
    atlas.createBucketItem(user.id, { name: 'Japan', country_code: 'JP', target_date: '2028-09' });

    expect(countRows(user.id)).toBe(3);
    // ...but each of those dates only once.
    expect(() => atlas.createBucketItem(user.id, { name: 'Japan', country_code: 'JP', target_date: '2027-05' })).toThrow(
      BucketItemExistsError,
    );
  });

  it('ATLAS-SVC-039: the name matches case- and whitespace-insensitively', () => {
    const { user } = createUser(testDb);
    atlas.createBucketItem(user.id, { name: 'Kyoto' });

    expect(() => atlas.createBucketItem(user.id, { name: '  kyoto  ' })).toThrow(BucketItemExistsError);
    expect(countRows(user.id)).toBe(1);
  });

  it('ATLAS-SVC-040: an empty string and NULL are the same "not set"', () => {
    const { user } = createUser(testDb);
    atlas.createBucketItem(user.id, { name: 'Lisbon', country_code: '', target_date: '' });

    // The forms send '' where the map dialogs send null — both must land on the
    // same identity, and the row itself is stored normalised.
    const row = testDb.prepare('SELECT country_code, target_date FROM bucket_list WHERE user_id = ?').get(user.id);
    expect(row).toEqual({ country_code: null, target_date: null });
    expect(() => atlas.createBucketItem(user.id, { name: 'Lisbon', country_code: null, target_date: null })).toThrow(
      BucketItemExistsError,
    );
  });

  it('ATLAS-SVC-041: the same name in another country, at other coordinates or for another user still goes through', () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    atlas.createBucketItem(user.id, { name: 'Altstadt', country_code: 'DE', lat: 48.13, lng: 11.57 });

    atlas.createBucketItem(user.id, { name: 'Altstadt', country_code: 'AT', lat: 48.13, lng: 11.57 });
    atlas.createBucketItem(user.id, { name: 'Altstadt', country_code: 'DE', lat: 50.94, lng: 6.96 });
    atlas.createBucketItem(other.id, { name: 'Altstadt', country_code: 'DE', lat: 48.13, lng: 11.57 });

    expect(countRows(user.id)).toBe(3);
    expect(countRows(other.id)).toBe(1);
  });

  it('ATLAS-SVC-042: a coordinate-less wish does not collide with the same name pinned to a place', () => {
    const { user } = createUser(testDb);
    atlas.createBucketItem(user.id, { name: 'Kyoto', country_code: 'JP' });

    atlas.createBucketItem(user.id, { name: 'Kyoto', country_code: 'JP', lat: 35.01, lng: 135.76 });

    expect(countRows(user.id)).toBe(2);
  });

  it('ATLAS-SVC-043: an update may not move a row onto another wish', () => {
    const { user } = createUser(testDb);
    atlas.createBucketItem(user.id, { name: 'Japan', country_code: 'JP', target_date: '2027-05' });
    const second = atlas.createBucketItem(user.id, { name: 'Japan', country_code: 'JP', target_date: '2028-09' }) as {
      id: number;
      target_date: string;
    };

    expect(() => atlas.updateBucketItem(user.id, second.id, { target_date: '2027-05' })).toThrow(BucketItemExistsError);
    const row = testDb.prepare('SELECT target_date FROM bucket_list WHERE id = ?').get(second.id) as {
      target_date: string;
    };
    expect(row.target_date).toBe('2028-09');
  });

  it('ATLAS-SVC-044: an update of a row against itself is not a collision', () => {
    const { user } = createUser(testDb);
    const item = atlas.createBucketItem(user.id, { name: 'Kyoto', country_code: 'JP', target_date: '2027-05' }) as {
      id: number;
    };

    // Same values again, plus a notes-only edit: neither may trip the guard.
    expect(atlas.updateBucketItem(user.id, item.id, { name: 'Kyoto', target_date: '2027-05' })).toBeTruthy();
    const updated = atlas.updateBucketItem(user.id, item.id, { notes: 'temples' }) as { notes: string };
    expect(updated.notes).toBe('temples');
  });

  it('ATLAS-SVC-045: a legacy duplicate already in the table stays readable and deletable', () => {
    const { user } = createUser(testDb);
    // Rows written before the guard existed are left alone on purpose — no
    // migration deletes user data for this.
    const insert = testDb.prepare('INSERT INTO bucket_list (user_id, name, country_code) VALUES (?, ?, ?)');
    insert.run(user.id, 'Japan', 'JP');
    const legacy = insert.run(user.id, 'Japan', 'JP');

    expect(atlas.bucketList(user.id)).toHaveLength(2);
    expect(atlas.deleteBucketItem(user.id, Number(legacy.lastInsertRowid))).toBe(true);
    expect(countRows(user.id)).toBe(1);
  });
});

// ── #1048: visited vs planned vs idea ────────────────────────────────────────
//
// Before this, every trip painted its countries as visited — a flight booked for
// next summer coloured the map as if the traveller had already been there. The
// trip's dates now decide, and countries[] carries that verdict as `status`.

// Offsets from "now", never literal dates: a hardcoded 2026 date stops being the
// future at some point and would silently flip these assertions to green-for-the-
// wrong-reason (or red) months after the fact.
function isoOffsetDays(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}
const PAST_START = isoOffsetDays(-40);
const PAST_END = isoOffsetDays(-30);
const FUTURE_START = isoOffsetDays(30);
const FUTURE_END = isoOffsetDays(40);

describe('getStats — visited vs planned vs idea (#1048)', () => {
  it('ATLAS-UNIT-029: a country from a trip that already happened is visited', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Rome, last month', start_date: PAST_START, end_date: PAST_END });
    insertPlace(testDb, trip.id, 'Colosseum', 'Piazza del Colosseo, Rome, Italy');

    const stats = await atlas.stats(user.id);

    expect(stats.countries).toEqual([expect.objectContaining({ code: 'IT', status: 'visited' })]);
    expect(stats.stats.totalCountries).toBe(1);
    expect(stats.stats.totalCountriesPlanned).toBe(0);
    expect(stats.stats.totalCountriesIdea).toBe(0);
  });

  it('ATLAS-UNIT-030: a country from a future trip is planned — listed, but not counted as visited', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Japan, next month', start_date: FUTURE_START, end_date: FUTURE_END });
    insertPlace(testDb, trip.id, 'Senso-ji', 'Asakusa, Tokyo, Japan');

    const stats = await atlas.stats(user.id);

    // Still in countries[] — the client needs it to draw the dashed outline — but it
    // must not inflate the "countries visited" counter.
    expect(stats.countries.find((c: any) => c.code === 'JP')).toMatchObject({ status: 'planned' });
    expect(stats.stats.totalCountries).toBe(0);
    expect(stats.stats.totalCountriesPlanned).toBe(1);
    expect(stats.countries.length).toBeGreaterThan(stats.stats.totalCountries);
  });

  it('ATLAS-UNIT-031: a trip that has started but not ended counts as visited — you are there now', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, {
      title: 'Currently in Berlin',
      start_date: isoOffsetDays(-2),
      end_date: isoOffsetDays(5),
    });
    insertPlace(testDb, trip.id, 'Brandenburger Tor', 'Pariser Platz, Berlin, Germany');

    const stats = await atlas.stats(user.id);

    expect(stats.countries.find((c: any) => c.code === 'DE')).toMatchObject({ status: 'visited' });
    expect(stats.stats.totalCountries).toBe(1);
  });

  it('ATLAS-UNIT-032: a trip starting today is already visited (the <= boundary)', async () => {
    const { user } = createUser(testDb);
    const today = isoOffsetDays(0);
    const trip = createTrip(testDb, user.id, { title: 'Flying out today', start_date: today, end_date: isoOffsetDays(6) });
    insertPlace(testDb, trip.id, 'Louvre', '75001 Paris, France');

    const stats = await atlas.stats(user.id);

    expect(stats.countries.find((c: any) => c.code === 'FR')).toMatchObject({ status: 'visited' });
    expect(stats.stats.totalCountriesPlanned).toBe(0);
  });

  it('ATLAS-UNIT-033: a trip with no dates at all is an idea, not a plan', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Someday: Japan' });
    insertPlace(testDb, trip.id, 'Senso-ji', 'Asakusa, Tokyo, Japan');

    const stats = await atlas.stats(user.id);

    expect(stats.countries.find((c: any) => c.code === 'JP')).toMatchObject({ status: 'idea' });
    expect(stats.stats.totalCountries).toBe(0);
    expect(stats.stats.totalCountriesPlanned).toBe(0);
    expect(stats.stats.totalCountriesIdea).toBe(1);
  });

  it('ATLAS-UNIT-034: a country with both a past and a future trip takes the stronger status', async () => {
    const { user } = createUser(testDb);
    const past = createTrip(testDb, user.id, { title: 'Munich 2023', start_date: PAST_START, end_date: PAST_END });
    const future = createTrip(testDb, user.id, { title: 'Munich again', start_date: FUTURE_START, end_date: FUTURE_END });
    insertPlace(testDb, past.id, 'Marienplatz', 'Marienplatz, Munich, Germany');
    insertPlace(testDb, future.id, 'Englischer Garten', 'Englischer Garten, Munich, Germany');

    const stats = await atlas.stats(user.id);

    const de = stats.countries.find((c: any) => c.code === 'DE');
    expect(de).toMatchObject({ status: 'visited', tripCount: 2, placeCount: 2 });
    expect(stats.stats.totalCountries).toBe(1);
    expect(stats.stats.totalCountriesPlanned).toBe(0);
  });

  it('ATLAS-UNIT-035: marking a country by hand outranks a future trip going there', async () => {
    // "I have been to Japan" is a statement of fact; a booking for next month cannot
    // downgrade it back to a plan.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Japan, next month', start_date: FUTURE_START, end_date: FUTURE_END });
    insertPlace(testDb, trip.id, 'Senso-ji', 'Asakusa, Tokyo, Japan');
    testDb.prepare('INSERT INTO visited_countries (user_id, country_code) VALUES (?, ?)').run(user.id, 'JP');

    const stats = await atlas.stats(user.id);

    const jp = stats.countries.filter((c: any) => c.code === 'JP');
    expect(jp).toHaveLength(1); // upgraded in place, not appended a second time
    expect(jp[0]).toMatchObject({ status: 'visited', placeCount: 1 });
    expect(stats.stats.totalCountries).toBe(1);
    expect(stats.stats.totalCountriesPlanned).toBe(0);
  });

  it('ATLAS-UNIT-036: removing a country hides it even while it is only planned (#1490 tombstone)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Tokyo, next month', start_date: FUTURE_START, end_date: FUTURE_END });
    const reservation = createReservation(testDb, trip.id, { type: 'flight' });
    insertReservationEndpoint(testDb, reservation.id, 'from', 0, 50.9014, 4.4844); // Brussels
    insertReservationEndpoint(testDb, reservation.id, 'to', 1, 35.6762, 139.6503); // Tokyo

    const before = await atlas.stats(user.id);
    expect(before.countries.find((c: any) => c.code === 'JP')).toMatchObject({ status: 'planned' });

    atlas.unmarkCountry(user.id, 'JP');

    const after = await atlas.stats(user.id);
    expect(after.countries.map((c: any) => c.code)).not.toContain('JP');
    expect(after.countries.map((c: any) => c.code)).toContain('BE');
    expect(after.stats.totalCountriesPlanned).toBe(1);
  });

  it('ATLAS-UNIT-037: continents counts visited only; the planned ones live in continentsPlanned', async () => {
    const { user } = createUser(testDb);
    const past = createTrip(testDb, user.id, { title: 'Paris 2023', start_date: PAST_START, end_date: PAST_END });
    const future = createTrip(testDb, user.id, { title: 'Tokyo soon', start_date: FUTURE_START, end_date: FUTURE_END });
    insertPlace(testDb, past.id, 'Louvre', '75001 Paris, France');
    insertPlace(testDb, future.id, 'Senso-ji', 'Asakusa, Tokyo, Japan');

    const stats = await atlas.stats(user.id);

    expect(stats.continents).toEqual({ Europe: 1 });
    expect(stats.continentsPlanned).toEqual({ Asia: 1 });
  });

  it('ATLAS-UNIT-038: mostVisited ignores planned countries even when they have more places', async () => {
    const { user } = createUser(testDb);
    const past = createTrip(testDb, user.id, { title: 'Rome 2023', start_date: PAST_START, end_date: PAST_END });
    const future = createTrip(testDb, user.id, { title: 'Japan soon', start_date: FUTURE_START, end_date: FUTURE_END });
    insertPlace(testDb, past.id, 'Colosseum', 'Piazza del Colosseo, Rome, Italy');
    for (let i = 0; i < 3; i++) insertPlace(testDb, future.id, `Tokyo Place ${i}`, `Street ${i}, Tokyo, Japan`);

    const stats = await atlas.stats(user.id);

    // JP has 3 places to IT's 1, but you have not been there yet.
    expect(stats.mostVisited).not.toBeNull();
    expect(stats.mostVisited!.code).toBe('IT');
    expect(stats.mostVisited!.placeCount).toBe(1);
  });

  it('ATLAS-UNIT-039: countries reached only by a future flight leg are planned, not visited (#1366 path)', async () => {
    // Endpoint-derived countries go through their own dedupe-per-coordinate branch,
    // so they need their own guard that the trip's dates still decide.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Tokyo, next month', start_date: FUTURE_START, end_date: FUTURE_END });
    const reservation = createReservation(testDb, trip.id, { type: 'flight' });
    insertReservationEndpoint(testDb, reservation.id, 'from', 0, 50.9014, 4.4844); // Brussels
    insertReservationEndpoint(testDb, reservation.id, 'to', 1, 35.6762, 139.6503); // Tokyo

    const stats = await atlas.stats(user.id);

    expect(stats.countries.find((c: any) => c.code === 'BE')).toMatchObject({ status: 'planned' });
    expect(stats.countries.find((c: any) => c.code === 'JP')).toMatchObject({ status: 'planned' });
    expect(stats.stats.totalCountries).toBe(0);
    expect(stats.stats.totalCountriesPlanned).toBe(2);
  });
});

describe('getCountryPlaces — status (#1048)', () => {
  it('ATLAS-UNIT-040: the country sheet reports the same status the map paints', async () => {
    const { user } = createUser(testDb);
    const past = createTrip(testDb, user.id, { title: 'Paris 2023', start_date: PAST_START, end_date: PAST_END });
    const future = createTrip(testDb, user.id, { title: 'Tokyo soon', start_date: FUTURE_START, end_date: FUTURE_END });
    insertPlace(testDb, past.id, 'Louvre', '75001 Paris, France');
    insertPlace(testDb, future.id, 'Senso-ji', 'Asakusa, Tokyo, Japan');

    expect(atlas.countryPlaces(user.id, 'FR').status).toBe('visited');
    expect(atlas.countryPlaces(user.id, 'JP').status).toBe('planned');
    // A country with no trip and no manual mark has nothing behind it at all.
    expect(atlas.countryPlaces(user.id, 'BR').status).toBe('idea');
  });

  it('ATLAS-UNIT-041: a manual mark makes the sheet visited even for a future-only country', async () => {
    const { user } = createUser(testDb);
    const future = createTrip(testDb, user.id, { title: 'Tokyo soon', start_date: FUTURE_START, end_date: FUTURE_END });
    insertPlace(testDb, future.id, 'Senso-ji', 'Asakusa, Tokyo, Japan');
    atlas.markCountry(user.id, 'JP');

    const result = atlas.countryPlaces(user.id, 'JP');

    expect(result.manually_marked).toBe(true);
    expect(result.status).toBe('visited');
    expect(result.places).toHaveLength(1);
  });
});

describe('getVisitedRegions — status (#1048)', () => {
  it('ATLAS-UNIT-042: a region inherits its trip status; a manually marked one is visited', async () => {
    const { user } = createUser(testDb);
    const future = createTrip(testDb, user.id, { title: 'Paris soon', start_date: FUTURE_START, end_date: FUTURE_END });
    const place = insertPlaceWithCoords(testDb, future.id, 'Paris Hotel', 48.85, 2.35);
    // Pre-seed the region cache so nothing geocodes in the background (see ATLAS-UNIT-020).
    testDb
      .prepare('INSERT OR REPLACE INTO place_regions (place_id, country_code, region_code, region_name) VALUES (?, ?, ?, ?)')
      .run(place.id, 'FR', 'FR-75', 'Île-de-France');
    testDb
      .prepare('INSERT INTO visited_regions (user_id, region_code, region_name, country_code) VALUES (?, ?, ?, ?)')
      .run(user.id, 'DE-BY', 'Bayern', 'DE');

    const result = await atlas.visitedRegions(user.id);

    // Zooming into a merely planned country must not reveal regions painted as visited.
    expect(result.regions['FR']).toEqual([expect.objectContaining({ code: 'FR-75', status: 'planned' })]);
    expect(result.regions['DE']).toEqual([expect.objectContaining({ code: 'DE-BY', status: 'visited' })]);
  });

  it('ATLAS-UNIT-043: marking a planned region by hand upgrades it to visited', async () => {
    const { user } = createUser(testDb);
    const future = createTrip(testDb, user.id, { title: 'Paris soon', start_date: FUTURE_START, end_date: FUTURE_END });
    const place = insertPlaceWithCoords(testDb, future.id, 'Paris Hotel', 48.85, 2.35);
    testDb
      .prepare('INSERT OR REPLACE INTO place_regions (place_id, country_code, region_code, region_name) VALUES (?, ?, ?, ?)')
      .run(place.id, 'FR', 'FR-75', 'Île-de-France');

    expect((await atlas.visitedRegions(user.id)).regions['FR'][0].status).toBe('planned');

    atlas.markRegion(user.id, 'FR-75', 'Île-de-France', 'FR');

    const after = await atlas.visitedRegions(user.id);
    // Still one entry — the manual mark upgrades the derived region rather than duplicating it.
    expect(after.regions['FR']).toHaveLength(1);
    expect(after.regions['FR'][0].status).toBe('visited');
  });
});
