import { db as testDb } from '../../../src/db/database';
import { PlaceRegions } from '../../../src/db/entities/PlaceRegions.entity';
import { Places } from '../../../src/db/entities/Places.entity';
import { VisitedCountries } from '../../../src/db/entities/VisitedCountries.entity';
import { AtlasService } from '../../../src/nest/atlas/atlas.service';
import {
  createTestBucketListRepo,
  createTestHiddenCountriesRepo,
  createTestHiddenRegionsRepo,
  createTestVisitedCountriesRepo,
  createTestVisitedRegionsRepo,
  createTestPlaceRegionsRepo,
} from '../../helpers/atlas-repos';
import { createUser, createTrip, createPlace, createReservation, addTripMember } from '../../helpers/factories';
import { addReservationTraveler, makeReservationEndpoint } from '../../helpers/factories/reservations';
import { insertRow, upsertRow } from '../../helpers/factories/rows';
import { resetTestDb } from '../../helpers/test-db';
import {
  createTestUnitOfWork,
  createTestTripsRepo,
  createTestPlacesRepo,
  createTestReservationEndpointsRepo,
  sharedTestOrm,
} from '../../helpers/test-uow';

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';

/**
 * travel-stats.service.test.ts
 *
 * getTravelStats lives on AtlasService, but its cases get their own file rather
 * than joining atlas.service.test.ts. That file carries the admin1 GeoJSON
 * bundle warm-up in beforeAll (issue #48) and its ATLAS-UNIT-021..024 cases sit
 * close to the 15s limit under a fully parallel run; adding eighteen more cases
 * to the same file pushed them over. Same DB-per-file pattern, no shared state.
 *
 * The cases moved from auth.service.test.ts with the method; AUTH-DB-* case IDs
 * are preserved so the history stays greppable.
 */

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  const mock = { db, closeDb: () => {}, reinitialize: () => {}, canAccessTrip: () => undefined, isOwner: () => false };
  return mock;
});

let atlas: AtlasService;

beforeAll(async () => {
  atlas = new AtlasService(
    await createTestBucketListRepo(testDb),
    await createTestHiddenCountriesRepo(testDb),
    await createTestHiddenRegionsRepo(testDb),
    await createTestVisitedCountriesRepo(testDb),
    await createTestVisitedRegionsRepo(testDb),
    await createTestPlaceRegionsRepo(testDb),
    await createTestTripsRepo(testDb),
    await createTestPlacesRepo(testDb),
    await createTestReservationEndpointsRepo(testDb),
    await createTestUnitOfWork(testDb),
    (await sharedTestOrm(testDb)).orm,
  );
});
beforeEach(() => {
  resetTestDb(testDb);
  vi.clearAllMocks();
});
afterAll(() => {
  testDb.close();
});

// ---------------------------------------------------------------------------
// getTravelStats — moved here from auth.service.test.ts together with the
// method itself. Case IDs preserved so the history stays greppable.
// ---------------------------------------------------------------------------
// ── getTravelStats — dashboard passport card ────────────────────────────────

describe('getTravelStats', () => {
  async function endpoint(
    reservationId: number,
    role: 'from' | 'to' | 'stop',
    sequence: number,
    lat: number,
    lng: number,
    code: string | null = null,
    localDate: string | null = null,
    localTime: string | null = null,
  ) {
    await makeReservationEndpoint(await sharedTestOrm(testDb), reservationId, {
      role,
      sequence,
      name: `Endpoint ${sequence}`,
      lat,
      lng,
      code,
      local_date: localDate,
      local_time: localTime,
    });
  }

  // Every trip below is dated in the past: since #1048 the passport card only counts
  // countries from trips that have already started, so a dateless fixture would make
  // these role-filter/tombstone assertions vacuous.
  const PAST_START = '2023-05-01';
  const PAST_END = '2023-05-10';

  it('AUTH-DB-047: #1486 counts the from/to countries of a flight', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Tokyo Trip', start_date: PAST_START, end_date: PAST_END });
    const res = createReservation(testDb, trip.id, { type: 'flight' });
    await endpoint(res.id, 'from', 0, 50.9014, 4.4844); // Brussels
    await endpoint(res.id, 'to', 1, 35.6762, 139.6503); // Tokyo

    const stats = await atlas.getTravelStats(user.id);
    expect(stats.countries).toContain('BE');
    expect(stats.countries).toContain('JP');
  });

  it('AUTH-DB-048: #1486 a connecting-flight layover does NOT count as visited', async () => {
    // The Atlas query grew a role filter for #1486 but this copy of it did not, so the
    // dashboard passport card still counted a plane change as a visited country.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Connection Trip', start_date: PAST_START, end_date: PAST_END });
    const res = createReservation(testDb, trip.id, { type: 'flight' });
    await endpoint(res.id, 'from', 0, 50.9014, 4.4844); // Brussels
    await endpoint(res.id, 'stop', 1, 35.6762, 139.6503); // Tokyo — never leaves the airport
    await endpoint(res.id, 'to', 2, -33.8688, 151.2093); // Sydney

    const stats = await atlas.getTravelStats(user.id);
    expect(stats.countries).toContain('BE');
    expect(stats.countries).toContain('AU');
    expect(stats.countries).not.toContain('JP');
  });

  it('AUTH-DB-049: #1490 a country removed in Atlas is not counted on the dashboard either', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Tokyo Trip', start_date: PAST_START, end_date: PAST_END });
    const res = createReservation(testDb, trip.id, { type: 'flight' });
    await endpoint(res.id, 'from', 0, 50.9014, 4.4844);
    await endpoint(res.id, 'to', 1, 35.6762, 139.6503);

    expect((await atlas.getTravelStats(user.id)).countries).toContain('JP');

    await atlas.unmarkCountry(user.id, 'JP');

    const after = await atlas.getTravelStats(user.id);
    expect(after.countries).not.toContain('JP');
    expect(after.countries).toContain('BE');
  });

  // ── #1048: the passport card only stamps trips that have happened ──────────
  // Relative offsets, not literal dates — a hardcoded "future" date expires.
  const iso = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

  async function placeInRegion(tripId: number, countryCode: string, regionCode: string) {
    const place = createPlace(testDb, tripId, { name: `Place in ${countryCode}` });
    await upsertRow(await sharedTestOrm(testDb), PlaceRegions, {
      place: place.id,
      country_code: countryCode,
      region_code: regionCode,
      region_name: regionCode,
    });
  }

  it('AUTH-DB-094: #1048 a place in a future trip does not stamp its country; a past trip does', async () => {
    const { user } = createUser(testDb);
    const past = createTrip(testDb, user.id, { title: 'Paris, last month', start_date: iso(-40), end_date: iso(-30) });
    const future = createTrip(testDb, user.id, { title: 'Tokyo, next month', start_date: iso(30), end_date: iso(40) });
    await placeInRegion(past.id, 'FR', 'FR-75');
    await placeInRegion(future.id, 'JP', 'JP-13');

    const stats = await atlas.getTravelStats(user.id);

    expect(stats.countries).toContain('FR');
    expect(stats.countries).not.toContain('JP');
  });

  it('AUTH-DB-095: #1048 a trip with no dates at all stamps nothing', async () => {
    const { user } = createUser(testDb);
    const dateless = createTrip(testDb, user.id, { title: 'Someday: Japan' });
    await placeInRegion(dateless.id, 'JP', 'JP-13');
    const res = createReservation(testDb, dateless.id, { type: 'flight' });
    await endpoint(res.id, 'from', 0, 50.9014, 4.4844); // Brussels

    const stats = await atlas.getTravelStats(user.id);

    expect(stats.countries).toEqual([]);
  });

  it('AUTH-DB-096: #1048 a flight booked for a future trip does not stamp its endpoints', async () => {
    const { user } = createUser(testDb);
    const future = createTrip(testDb, user.id, { title: 'Tokyo, next month', start_date: iso(30), end_date: iso(40) });
    const res = createReservation(testDb, future.id, { type: 'flight' });
    await endpoint(res.id, 'from', 0, 50.9014, 4.4844); // Brussels
    await endpoint(res.id, 'to', 1, 35.6762, 139.6503); // Tokyo

    const stats = await atlas.getTravelStats(user.id);

    expect(stats.countries).not.toContain('BE');
    expect(stats.countries).not.toContain('JP');
  });

  // ── #1535: the layover split over two bookings ─────────────────────────────
  // The passport card derives its countries from the same endpoints, so it needs the
  // same pairing: a hub stored as the 'to' of one booking and the 'from' of the next
  // slips past the #1486 role filter. Brussels → Helsinki → New York.

  async function splitChainThroughHelsinki(tripId: number, onwardDate: string, onwardTime: string) {
    const inbound = createReservation(testDb, tripId, { type: 'flight', title: 'BRU-HEL' });
    await endpoint(inbound.id, 'from', 0, 50.9014, 4.4844, 'BRU', '2023-05-01', '07:00');
    await endpoint(inbound.id, 'to', 1, 60.3172, 24.9633, 'HEL', '2023-05-01', '09:30');
    const onward = createReservation(testDb, tripId, { type: 'flight', title: 'HEL-JFK' });
    await endpoint(onward.id, 'from', 0, 60.3172, 24.9633, 'HEL', onwardDate, onwardTime);
    await endpoint(onward.id, 'to', 1, 40.6413, -73.7781, 'JFK', onwardDate, '15:00');
  }

  it('AUTH-DB-099: #1535 a plane change booked as two flights does not stamp the hub country', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, {
      title: 'New York via Helsinki',
      start_date: PAST_START,
      end_date: PAST_END,
    });
    await splitChainThroughHelsinki(trip.id, '2023-05-01', '11:00');

    const stats = await atlas.getTravelStats(user.id);
    expect(stats.countries).toContain('BE');
    expect(stats.countries).toContain('US');
    expect(stats.countries).not.toContain('FI');
  });

  it('AUTH-DB-100: #1535 a stopover of two days still stamps the hub country', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, {
      title: 'Helsinki stopover',
      start_date: PAST_START,
      end_date: PAST_END,
    });
    await splitChainThroughHelsinki(trip.id, '2023-05-03', '11:00');

    expect((await atlas.getTravelStats(user.id)).countries).toContain('FI');
  });

  it('AUTH-DB-101: #1490 removing a country still subtracts it around the layover pairing', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, {
      title: 'New York via Helsinki',
      start_date: PAST_START,
      end_date: PAST_END,
    });
    await splitChainThroughHelsinki(trip.id, '2023-05-01', '11:00');

    await atlas.unmarkCountry(user.id, 'BE');

    const stats = await atlas.getTravelStats(user.id);
    expect(stats.countries).not.toContain('BE');
    expect(stats.countries).toContain('US');
  });

  it('AUTH-DB-097: #1048 a manually marked country stays stamped regardless of trip dates', async () => {
    // The manual list is the user's own word, not derived from a trip — the date
    // filter must not reach it.
    const { user } = createUser(testDb);
    const future = createTrip(testDb, user.id, { title: 'Tokyo, next month', start_date: iso(30), end_date: iso(40) });
    await placeInRegion(future.id, 'JP', 'JP-13');
    await insertRow(await sharedTestOrm(testDb), VisitedCountries, { user: user.id, country_code: 'JP' });

    const stats = await atlas.getTravelStats(user.id);

    expect(stats.countries).toContain('JP');
  });
});

/**
 * The passport card counted a place's country only once its region sat in
 * place_regions, while the Atlas map falls back to the borders. A place in
 * Vatican City never gets a region row (the region bundle has none for it, and
 * Nominatim names no region there), so the map showed VA and the card did not.
 */
describe('place countries without a cached region (#2875)', () => {
  const PAST_START = '2023-05-01';
  const PAST_END = '2023-05-10';
  const VATICAN = { lat: 41.9022, lng: 12.4539 };

  async function addPlace(
    tripId: number,
    name: string,
    values: { lat?: number | null; lng?: number | null; address?: string | null },
  ) {
    return insertRow(await sharedTestOrm(testDb), Places, { trip: tripId, name }, { lat: null, lng: null, ...values });
  }

  async function cacheRegion(placeId: number, countryCode: string, regionCode: string) {
    await upsertRow(await sharedTestOrm(testDb), PlaceRegions, {
      place: placeId,
      country_code: countryCode,
      region_code: regionCode,
      region_name: regionCode,
    });
  }

  it('AUTH-DB-123: a place in Vatican City stamps VA on the passport card', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Rome', start_date: PAST_START, end_date: PAST_END });
    await addPlace(trip.id, "St. Peter's Basilica", VATICAN);

    expect((await atlas.getTravelStats(user.id)).countries).toContain('VA');
  });

  it('AUTH-DB-124: any place still waiting for its region lookup counts by its borders', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris', start_date: PAST_START, end_date: PAST_END });
    await addPlace(trip.id, 'Louvre', { lat: 48.8606, lng: 2.3376 });

    expect((await atlas.getTravelStats(user.id)).countries).toEqual(['FR']);
  });

  it('AUTH-DB-125: the passport card and the Atlas map list the same visited countries', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Rome', start_date: PAST_START, end_date: PAST_END });
    await addPlace(trip.id, "St. Peter's Basilica", VATICAN);
    const colosseumId = await addPlace(trip.id, 'Colosseum', { lat: 41.8902, lng: 12.4922 });
    await cacheRegion(colosseumId, 'IT', 'IT-62');

    const atlasVisited = (await atlas.stats(user.id)).countries
      .filter((c) => !('status' in c) || c.status === 'visited')
      .map((c) => c.code)
      .sort();
    expect(atlasVisited).toEqual(['IT', 'VA']);
    expect([...(await atlas.getTravelStats(user.id)).countries].sort()).toEqual(atlasVisited);
  });

  it('AUTH-DB-126: a Vatican place on a trip that has not started stays off the card (#1048)', async () => {
    const { user } = createUser(testDb);
    const start = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
    const trip = createTrip(testDb, user.id, { title: 'Rome, next month', start_date: start, end_date: start });
    await addPlace(trip.id, "St. Peter's Basilica", VATICAN);

    expect((await atlas.getTravelStats(user.id)).countries).not.toContain('VA');
  });

  it('AUTH-DB-127: a place without coordinates counts by a country its address spells out, never by a bare code (#2111)', async () => {
    const { user } = createUser(testDb);
    const named = createTrip(testDb, user.id, { title: 'Named', start_date: PAST_START, end_date: PAST_END });
    await addPlace(named.id, 'Vatican Museums', { address: 'Viale Vaticano, Vatican City' });

    expect((await atlas.getTravelStats(user.id)).countries).toEqual(['VA']);

    const { user: other } = createUser(testDb);
    const bare = createTrip(testDb, other.id, { title: 'Bare', start_date: PAST_START, end_date: PAST_END });
    await addPlace(bare.id, 'Somewhere in Virginia', { address: 'Richmond, VA' });

    expect((await atlas.getTravelStats(other.id)).countries).toEqual([]);
  });

  it('AUTH-DB-128: the last trip names Vatican City when that is all it went to', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, {
      title: 'Day in the Vatican',
      start_date: PAST_START,
      end_date: PAST_END,
    });
    await addPlace(trip.id, "St. Peter's Basilica", VATICAN);
    await addPlace(trip.id, 'Sistine Chapel', VATICAN);

    expect((await atlas.lastTrip(user.id))?.countries).toEqual(['VA']);
  });

  it('AUTH-DB-129: the last trip ranks cached and resolved places together, most places first', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Rome', start_date: PAST_START, end_date: PAST_END });
    const colosseumId = await addPlace(trip.id, 'Colosseum', { lat: 41.8902, lng: 12.4922 });
    await cacheRegion(colosseumId, 'it', 'IT-62');
    await addPlace(trip.id, 'Pantheon', { lat: 41.8986, lng: 12.4769 });
    await addPlace(trip.id, "St. Peter's Basilica", VATICAN);
    await addPlace(trip.id, 'Sistine Chapel', VATICAN);
    await addPlace(trip.id, 'Vatican Museums', VATICAN);

    // The cached lower-case "it" and the resolved IT are one country with two places.
    expect((await atlas.lastTrip(user.id))?.countries).toEqual(['VA', 'IT']);
  });
});

describe('travel-stats quirk fixes', () => {
  it('AUTH-DB-089: getTravelStats keeps a place at lat 0 / lng 0 (equator, prime meridian)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Null Island' });
    await insertRow(await sharedTestOrm(testDb), Places, { trip: trip.id, name: 'Null Island', lat: 0, lng: 0 });
    const stats = await atlas.getTravelStats(user.id);
    expect(stats.coords).toContainEqual({ lat: 0, lng: 0 });
  });
});

/**
 * Whose trip it is, and whose flight (#1966).
 *
 * 4.0 lets a booking name the people it is for (#1517), and the figures never
 * read that: they scoped by trip membership, so on a shared trip everyone was
 * credited with everyone's flights. Two people flying to the same place from
 * different cities each got both departures, and the countries each of them had
 * "visited" included the other's.
 *
 * The rule has a second half that matters more than the first: a booking with
 * nobody named on it still counts for everyone. Every reservation made before
 * 4.0 looks exactly like that, so without it this would have taken the flown
 * distance of every existing install to zero.
 */
describe('personal figures on a shared trip (#1966)', () => {
  const PAST_START = '2023-05-01';
  const PAST_END = '2023-05-10';

  const endpoint = async (
    reservationId: number,
    role: 'from' | 'to',
    sequence: number,
    lat: number,
    lng: number,
    code: string,
  ) =>
    makeReservationEndpoint(await sharedTestOrm(testDb), reservationId, {
      role,
      sequence,
      name: `Endpoint ${sequence}`,
      lat,
      lng,
      code,
    });

  const assignTo = async (reservationId: number, userId: number) =>
    addReservationTraveler(await sharedTestOrm(testDb), reservationId, userId);

  /** A shared trip: A flies Rome→New York, B flies Mexico City→New York. */
  async function sharedTrip() {
    const { user: alice } = createUser(testDb);
    const { user: bob } = createUser(testDb);
    const trip = createTrip(testDb, alice.id, { title: 'Shared', start_date: PAST_START, end_date: PAST_END });
    addTripMember(testDb, trip.id, bob.id);

    const fromRome = createReservation(testDb, trip.id, { type: 'flight', title: 'FCO-JFK' });
    await endpoint(fromRome.id, 'from', 0, 41.8003, 12.2389, 'FCO');
    await endpoint(fromRome.id, 'to', 1, 40.6413, -73.7781, 'JFK');

    const fromMexico = createReservation(testDb, trip.id, { type: 'flight', title: 'MEX-JFK' });
    await endpoint(fromMexico.id, 'from', 0, 19.4363, -99.0721, 'MEX');
    await endpoint(fromMexico.id, 'to', 1, 40.6413, -73.7781, 'JFK');

    return { alice, bob, trip, fromRome, fromMexico };
  }

  it('credits each traveler with their own flight only', async () => {
    const { alice, bob, fromRome, fromMexico } = await sharedTrip();
    await assignTo(fromRome.id, alice.id);
    await assignTo(fromMexico.id, bob.id);

    const a = await atlas.getTravelStats(alice.id);
    const b = await atlas.getTravelStats(bob.id);

    // Rome to New York is a good deal further than Mexico City to New York, so
    // equal distances would mean both are still counting both flights.
    expect(a.totalDistanceKm).toBeGreaterThan(0);
    expect(b.totalDistanceKm).toBeGreaterThan(0);
    expect(a.totalDistanceKm).not.toBe(b.totalDistanceKm);
  });

  it('does not stamp another traveler s departure country on your passport', async () => {
    const { alice, bob, fromRome, fromMexico } = await sharedTrip();
    await assignTo(fromRome.id, alice.id);
    await assignTo(fromMexico.id, bob.id);

    // Alice never went through Mexico.
    expect((await atlas.getTravelStats(alice.id)).countries).not.toContain('MX');
    expect((await atlas.getTravelStats(bob.id)).countries).not.toContain('IT');
  });

  /*
   * The case that keeps this from being a breaking change. The assignment table
   * is empty on every install upgrading from 3.4.1.
   */
  it('still counts a booking nobody is named on, for everyone on the trip', async () => {
    const { alice, bob } = await sharedTrip();

    const a = await atlas.getTravelStats(alice.id);
    const b = await atlas.getTravelStats(bob.id);
    expect(a.totalDistanceKm).toBeGreaterThan(0);
    expect(a.totalDistanceKm).toBe(b.totalDistanceKm);
  });

  it('counts a booking they are both named on, once for each of them', async () => {
    const { alice, bob, fromRome, fromMexico } = await sharedTrip();
    await assignTo(fromRome.id, alice.id);
    await assignTo(fromRome.id, bob.id);
    await assignTo(fromMexico.id, alice.id);
    await assignTo(fromMexico.id, bob.id);

    const a = await atlas.getTravelStats(alice.id);
    const b = await atlas.getTravelStats(bob.id);
    expect(a.totalDistanceKm).toBe(b.totalDistanceKm);
    expect(a.countries).toEqual(b.countries);
  });

  it('leaves a traveler assigned nothing with the unassigned bookings only', async () => {
    const { alice, bob, fromRome } = await sharedTrip();
    await assignTo(fromRome.id, bob.id);

    // Alice keeps the Mexico flight (nobody named) but loses the Rome one.
    const a = await atlas.getTravelStats(alice.id);
    expect(a.countries).not.toContain('IT');
    expect(a.totalDistanceKm).toBeGreaterThan(0);
  });
});
