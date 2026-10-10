/**
 * journeyStats() — the SQL half of the journey figures (#1973).
 *
 * A real in-memory SQLite DB, because what is being tested here is the queries:
 * which rows become the route, how a place assigned to three days is counted
 * once, and which source wins when a journey has both entries and trip places.
 * The arithmetic those rows feed into has its own tests in journey-stats.test.ts.
 */
import { db as testDb } from '../../../src/db/database';
import { db as dbConn } from '../../../src/db/database';
import { JourneyContributors } from '../../../src/db/entities/JourneyContributors.entity';
import { JourneyEntries } from '../../../src/db/entities/JourneyEntries.entity';
import { JourneyPhotos } from '../../../src/db/entities/JourneyPhotos.entity';
import { PlaceRegions } from '../../../src/db/entities/PlaceRegions.entity';
import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import { TripPhotos } from '../../../src/db/entities/TripPhotos.entity';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { TrekPhotoRegistrationService } from '../../../src/nest/photos/trek-photo-registration.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import {
  createUser,
  createTrip,
  createJourney,
  createJourneyEntry,
  createPlace,
  createDay,
  createDayAssignment,
  linkTripToJourney,
} from '../../helpers/factories';
import { insertRow, updateRows } from '../../helpers/factories/rows';
import {
  createTestJourneysRepo,
  createTestJourneyContributorsRepo,
  createTestJourneyTripsRepo,
  createTestJourneyEntriesRepo,
  createTestJourneyPhotosRepo,
  createTestJourneyEntryPhotosRepo,
} from '../../helpers/journey-repos';
import { resetTestDb } from '../../helpers/test-db';
import { createTestUnitOfWork, sharedTestOrm, createTestTripsRepo, createTestPlacesRepo } from '../../helpers/test-uow';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  return {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: () => null,
    isOwner: () => false,
  };
});

/*
 * The country lookup is stubbed rather than exercised. The real one loads and
 * indexes 4MB of gzipped admin-0 boundaries on first call — minutes of work
 * across a test suite, to verify a function that belongs to Atlas and has its
 * own tests. What matters here is *which coordinates get asked about* and that
 * the place_regions cache is preferred, both of which the stub shows.
 */
const countryCalls: [number, number][] = [];
vi.mock('../../../src/nest/atlas/atlas-geo', () => ({
  getCountryFromCoords: (lat: number, lng: number) => {
    countryCalls.push([lat, lng]);
    // Rough boxes, enough to tell two countries apart in a fixture.
    if (lat > 63 && lng < -13) return 'IS';
    if (lat > 47 && lat < 55 && lng > 5 && lng < 15) return 'DE';
    if (lat > 42 && lat < 51 && lng > -5 && lng < 8) return 'FR';
    return null;
  },
}));

let svc: JourneyDomainService;

/** The factory has no coordinate fields, and a route is made of coordinates. */
async function placeEntry(
  journeyId: number,
  authorId: number,
  lat: number,
  lng: number,
  overrides: { title?: string; entry_date?: string; stats_excluded?: number } = {},
) {
  const entry = createJourneyEntry(testDb, journeyId, authorId, overrides);
  await updateRows(
    await sharedTestOrm(testDb),
    JourneyEntries,
    { id: entry.id },
    { location_lat: lat, location_lng: lng },
  );
  return entry;
}

beforeAll(async () => {
  const t = await sharedTestOrm(testDb);
  svc = new JourneyDomainService(
    new RealtimeService(),
    new TrekPhotoRegistrationService(t.repo(TrekPhotos), t.repo(TripPhotos), await createTestJourneyPhotosRepo(testDb)),
    await createTestUnitOfWork(testDb),
    await createTestJourneysRepo(testDb),
    await createTestJourneyContributorsRepo(testDb),
    await createTestJourneyTripsRepo(testDb),
    await createTestJourneyEntriesRepo(testDb),
    await createTestTripsRepo(testDb),
    // Plan 3g Task 2 constructor-ripple: JourneyPhotosRepository/JourneyEntryPhotosRepository/PlacesRepository.
    await createTestJourneyPhotosRepo(testDb),
    await createTestJourneyEntryPhotosRepo(testDb),
    await createTestPlacesRepo(testDb),
  );
});

beforeEach(() => {
  resetTestDb(testDb);
  countryCalls.length = 0;
});

afterAll(() => {
  testDb.close();
});

describe('journeyStats access', () => {
  it('is null for a journey the user cannot see', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);

    expect(await svc.journeyStats(journey.id, stranger.id)).toBeNull();
  });

  it('is null for a journey that does not exist', async () => {
    const { user } = createUser(testDb);
    expect(await svc.journeyStats(999_999, user.id)).toBeNull();
  });

  it('answers for the owner', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    const stats = await svc.journeyStats(journey.id, user.id);

    expect(stats).not.toBeNull();
    expect(stats!.journeyId).toBe(journey.id);
  });

  // M4 (task-5-review.md) — `JourneyEntriesRepository.countStatsPlaces`'s
  // `row?.n ?? 0` null arm had no test exercising a journey with zero linked
  // trips at all (worse coverage than base). `places` must still answer 0,
  // not throw or leave the field undefined.
  it('places is 0 for a journey with no trips at all (countStatsPlaces)', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    const stats = await svc.journeyStats(journey.id, user.id);

    expect(stats).not.toBeNull();
    expect(stats!.places).toBe(0);
  });
});

describe('journeyStats route', () => {
  it('builds the route from the entries when they carry coordinates', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    await placeEntry(journey.id, user.id, 64.14, -21.94, { title: 'Reykjavík', entry_date: '2026-06-02' });
    await placeEntry(journey.id, user.id, 65.68, -18.12, { title: 'Akureyri', entry_date: '2026-06-06' });

    const stats = (await svc.journeyStats(journey.id, user.id))!;

    expect(stats.points.map((p) => p.label)).toEqual(['Reykjavík', 'Akureyri']);
    expect(stats.distance).toBeGreaterThan(240_000);
    expect(stats.days).toBe(5);
    expect(stats.steps).toBe(2);
  });

  it('orders the route by entry date, not by insertion', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    await placeEntry(journey.id, user.id, 65.68, -18.12, { title: 'second', entry_date: '2026-06-06' });
    await placeEntry(journey.id, user.id, 64.14, -21.94, { title: 'first', entry_date: '2026-06-02' });

    const stats = (await svc.journeyStats(journey.id, user.id))!;

    expect(stats.points.map((p) => p.label)).toEqual(['first', 'second']);
  });

  it('skips entries without coordinates but still counts them as steps', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    await placeEntry(journey.id, user.id, 64.14, -21.94, { entry_date: '2026-06-02' });
    createJourneyEntry(testDb, journey.id, user.id, { title: 'no place', entry_date: '2026-06-03' });

    const stats = (await svc.journeyStats(journey.id, user.id))!;

    expect(stats.points).toHaveLength(1);
    expect(stats.steps).toBe(2);
  });

  /*
   * The fallback that makes the feature work at all for the common case: a
   * journey built by adding trips, before anyone has written a word.
   */
  it('falls back to the trip places when no entry has coordinates', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id);
    linkTripToJourney(testDb, journey.id, trip.id);

    const day1 = createDay(testDb, trip.id, { date: '2026-06-02' });
    const day2 = createDay(testDb, trip.id, { date: '2026-06-04' });
    const a = createPlace(testDb, trip.id, { name: 'Hallgrímskirkja', lat: 64.14, lng: -21.93 });
    const b = createPlace(testDb, trip.id, { name: 'Goðafoss', lat: 65.68, lng: -17.55 });
    createDayAssignment(testDb, day2.id, b.id);
    createDayAssignment(testDb, day1.id, a.id);

    const stats = (await svc.journeyStats(journey.id, user.id))!;

    expect(stats.points.map((p) => p.label)).toEqual(['Hallgrímskirkja', 'Goðafoss']);
    expect(stats.days).toBe(3);
  });

  it('prefers the entries over the trip places rather than mixing them', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id);
    linkTripToJourney(testDb, journey.id, trip.id);
    createPlace(testDb, trip.id, { name: 'a place', lat: 48.85, lng: 2.35 });
    await placeEntry(journey.id, user.id, 64.14, -21.94, { title: 'an entry', entry_date: '2026-06-02' });

    const stats = (await svc.journeyStats(journey.id, user.id))!;

    expect(stats.points.map((p) => p.label)).toEqual(['an entry']);
  });

  /*
   * A hotel across three nights is one place with three assignments. Left
   * un-aggregated the join would put it on the route three times and charge the
   * journey two extra legs of zero length — harmless — plus two extra stops in
   * the middle of the route, which is not.
   */
  it('visits a place assigned to several days only once', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id);
    linkTripToJourney(testDb, journey.id, trip.id);

    const hotel = createPlace(testDb, trip.id, { name: 'Hotel', lat: 64.14, lng: -21.94 });
    for (const date of ['2026-06-02', '2026-06-03', '2026-06-04']) {
      createDayAssignment(testDb, createDay(testDb, trip.id, { date }).id, hotel.id);
    }

    const stats = (await svc.journeyStats(journey.id, user.id))!;

    expect(stats.points.filter((p) => p.label === 'Hotel')).toHaveLength(1);
    expect(stats.places).toBe(1);
  });

  it('puts unscheduled places after the scheduled ones', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id);
    linkTripToJourney(testDb, journey.id, trip.id);

    const loose = createPlace(testDb, trip.id, { name: 'unscheduled', lat: 64.2, lng: -21.8 });
    const planned = createPlace(testDb, trip.id, { name: 'scheduled', lat: 64.14, lng: -21.94 });
    createDayAssignment(testDb, createDay(testDb, trip.id, { date: '2026-06-02' }).id, planned.id);
    expect(loose.id).toBeGreaterThan(0);

    const stats = (await svc.journeyStats(journey.id, user.id))!;

    expect(stats.points.map((p) => p.label)).toEqual(['scheduled', 'unscheduled']);
  });

  it('counts places across every trip on the journey', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const one = createTrip(testDb, user.id);
    const two = createTrip(testDb, user.id);
    linkTripToJourney(testDb, journey.id, one.id);
    linkTripToJourney(testDb, journey.id, two.id);
    createPlace(testDb, one.id, { lat: 48.85, lng: 2.35 });
    createPlace(testDb, two.id, { lat: 52.52, lng: 13.4 });
    createPlace(testDb, two.id, { lat: 50.11, lng: 8.68 });

    expect((await svc.journeyStats(journey.id, user.id))!.places).toBe(3);
  });
});

describe('journeyStats countries', () => {
  it('resolves each stop to a country and names it', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    await placeEntry(journey.id, user.id, 64.14, -21.94, { entry_date: '2026-06-02' });
    await placeEntry(journey.id, user.id, 52.52, 13.4, { entry_date: '2026-06-20' });

    const stats = (await svc.journeyStats(journey.id, user.id))!;

    expect(stats.countries.map((c) => c.code)).toEqual(['IS', 'DE']);
    expect(stats.countries[0].name).toBe('Iceland');
    expect(stats.countries[1].name).toBe('Germany');
  });

  /*
   * Atlas already resolved these and wrote them down. Reading its cache instead
   * of repeating a point-in-polygon test is the difference between a query and
   * a boundary index.
   */
  it('prefers the place_regions cache over recomputing a place country', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id);
    linkTripToJourney(testDb, journey.id, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'somewhere', lat: 64.14, lng: -21.94 });
    await insertRow(await sharedTestOrm(testDb), PlaceRegions, {
      place: place.id,
      country_code: 'fr',
      region_code: 'FR-75',
      region_name: 'Paris',
    });

    const stats = (await svc.journeyStats(journey.id, user.id))!;

    // The cached answer wins even though the coordinates say Iceland, and the
    // expensive lookup is never reached for that place.
    expect(stats.countries.map((c) => c.code)).toEqual(['FR']);
    expect(countryCalls).toHaveLength(0);
  });

  it('leaves a stop with no country out of the list rather than inventing one', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    await placeEntry(journey.id, user.id, -33.86, 151.2, { entry_date: '2026-06-02' });

    const stats = (await svc.journeyStats(journey.id, user.id))!;

    expect(stats.countries).toEqual([]);
    expect(stats.points).toHaveLength(1);
    expect(stats.points[0].country).toBeNull();
  });
});

describe('journeyStats totals', () => {
  it('counts the gallery photographs', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const photoId = await insertRow(await sharedTestOrm(testDb), TrekPhotos, {
      provider: 'local',
      file_path: 'x.jpg',
      owner: user.id,
    });
    await insertRow(await sharedTestOrm(testDb), JourneyPhotos, {
      journey: journey.id,
      photo: photoId,
      sort_order: 0,
      created_at: Date.now(),
    });

    expect((await svc.journeyStats(journey.id, user.id))!.photos).toBe(1);
  });

  it('falls back to the trip dates when the entries carry none', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, { start_date: '2026-06-01', end_date: '2026-06-10' });
    linkTripToJourney(testDb, journey.id, trip.id);
    createPlace(testDb, trip.id, { lat: 64.14, lng: -21.94 });

    const stats = (await svc.journeyStats(journey.id, user.id))!;

    expect(stats.start).toBe('2026-06-01');
    expect(stats.end).toBe('2026-06-10');
    expect(stats.days).toBe(10);
  });

  it('is all zeroes for an empty journey rather than failing', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    const stats = (await svc.journeyStats(journey.id, user.id))!;

    expect(stats.distance).toBe(0);
    expect(stats.days).toBe(0);
    expect(stats.steps).toBe(0);
    expect(stats.photos).toBe(0);
    expect(stats.places).toBe(0);
    expect(stats.countries).toEqual([]);
    expect(stats.points).toEqual([]);
  });

  it('answers for a contributor, not only the owner', async () => {
    const { user: owner } = createUser(testDb);
    const { user: helper } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    await insertRow(await sharedTestOrm(testDb), JourneyContributors, {
      journey: journey.id,
      user: helper.id,
      role: 'editor',
      added_at: Date.now(),
    });

    expect(await svc.journeyStats(journey.id, helper.id)).not.toBeNull();
  });
});

/*
 * The stop somebody switched off (discussion #2064): the home airport, the
 * stopover, the place the trip was planned from. It stays in the journal and
 * leaves every figure, and it is named under `excluded` so that it can be
 * switched back on.
 */
describe('journeyStats excluded stops', () => {
  it('leaves a switched-off entry out of the route, the distance and the countries', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    await placeEntry(journey.id, user.id, 52.52, 13.4, {
      title: 'Berlin, the airport',
      entry_date: '2026-06-01',
      stats_excluded: 1,
    });
    await placeEntry(journey.id, user.id, 64.14, -21.94, { title: 'Reykjavík', entry_date: '2026-06-02' });
    await placeEntry(journey.id, user.id, 65.68, -18.12, { title: 'Akureyri', entry_date: '2026-06-06' });

    const stats = (await svc.journeyStats(journey.id, user.id))!;

    expect(stats.points.map((p) => p.label)).toEqual(['Reykjavík', 'Akureyri']);
    // Reykjavík to Akureyri and nothing else; the leg in from Berlin is gone.
    expect(stats.distance).toBeLessThan(300_000);
    expect(stats.countries.map((c) => c.code)).toEqual(['IS']);
    expect(stats.start).toBe('2026-06-02');
    expect(stats.days).toBe(5);
  });

  it('names the switched-off stop under excluded so it can be switched back on', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const airport = await placeEntry(journey.id, user.id, 63.98, -22.62, {
      title: 'Keflavík',
      entry_date: '2026-06-01',
      stats_excluded: 1,
    });
    await placeEntry(journey.id, user.id, 64.14, -21.94, { title: 'Reykjavík', entry_date: '2026-06-02' });

    const stats = (await svc.journeyStats(journey.id, user.id))!;

    expect(stats.excluded).toEqual([{ entryId: airport.id, label: 'Keflavík', date: '2026-06-01' }]);
  });

  it('does not count a switched-off entry as a step', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    await placeEntry(journey.id, user.id, 63.98, -22.62, { entry_date: '2026-06-01', stats_excluded: 1 });
    await placeEntry(journey.id, user.id, 64.14, -21.94, { entry_date: '2026-06-02' });

    expect((await svc.journeyStats(journey.id, user.id))!.steps).toBe(1);
  });

  /* An entry without a place was never a stop, so there is nothing to offer back. */
  it('lists nothing under excluded for a switched-off entry without coordinates', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    createJourneyEntry(testDb, journey.id, user.id, {
      title: 'a thought',
      entry_date: '2026-06-03',
      stats_excluded: 1,
    });
    await placeEntry(journey.id, user.id, 64.14, -21.94, { entry_date: '2026-06-02' });

    const stats = (await svc.journeyStats(journey.id, user.id))!;

    expect(stats.excluded).toEqual([]);
    expect(stats.steps).toBe(1);
  });

  it('carries the entry on every stop read from the entries', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const a = await placeEntry(journey.id, user.id, 64.14, -21.94, { entry_date: '2026-06-02' });
    const b = await placeEntry(journey.id, user.id, 65.68, -18.12, { entry_date: '2026-06-06' });

    expect((await svc.journeyStats(journey.id, user.id))!.points.map((p) => p.entryId)).toEqual([a.id, b.id]);
  });

  it('drops the place behind a switched-off skeleton from the place count', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id);
    linkTripToJourney(testDb, journey.id, trip.id);
    const airport = createPlace(testDb, trip.id, { name: 'Keflavík', lat: 63.98, lng: -22.62 });
    const town = createPlace(testDb, trip.id, { name: 'Vík', lat: 63.42, lng: -19.01 });
    createDayAssignment(testDb, createDay(testDb, trip.id, { date: '2026-06-01' }).id, airport.id);
    createDayAssignment(testDb, createDay(testDb, trip.id, { date: '2026-06-02' }).id, town.id);
    await svc.syncTripPlaces(journey.id, trip.id, user.id);
    await updateRows(
      await sharedTestOrm(testDb),
      JourneyEntries,
      { journey: journey.id, sourcePlace: airport.id },
      { stats_excluded: 1 },
    );

    const stats = (await svc.journeyStats(journey.id, user.id))!;

    // The town's skeleton still draws the route, so this is the entries path.
    expect(stats.points.map((p) => p.label)).toEqual(['Vík']);
    expect(stats.excluded.map((s) => s.label)).toEqual(['Keflavík']);
    expect(stats.places).toBe(1);
  });

  /*
   * The fallback honours the switch too. A skeleton is the entry TREK derives
   * from a trip place; switching it off and then drawing the place it came
   * from would put the same stop straight back on the map by its other name.
   */
  it('leaves the place behind a switched-off skeleton out of the fallback route', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id);
    linkTripToJourney(testDb, journey.id, trip.id);
    const airport = createPlace(testDb, trip.id, { name: 'Keflavík', lat: 63.98, lng: -22.62 });
    createPlace(testDb, trip.id, { name: 'Vík', lat: 63.42, lng: -19.01 });
    // Only the airport is on a day, so only the airport gets a skeleton; the
    // town stays a bare trip place that the fallback is there to draw.
    createDayAssignment(testDb, createDay(testDb, trip.id, { date: '2026-06-01' }).id, airport.id);
    await svc.syncTripPlaces(journey.id, trip.id, user.id);
    // Switched off, and its point cleared by hand afterwards, which is what
    // sends the journey down the fallback while the skeleton still names the
    // place it came from.
    await updateRows(
      await sharedTestOrm(testDb),
      JourneyEntries,
      { journey: journey.id, sourcePlace: airport.id },
      {
        stats_excluded: 1,
        location_lat: null,
        location_lng: null,
      },
    );

    const stats = (await svc.journeyStats(journey.id, user.id))!;

    expect(stats.points.map((p) => p.label)).toEqual(['Vík']);
    expect(stats.points[0].entryId).toBeNull();
    expect(stats.steps).toBe(0);
    expect(stats.places).toBe(1);
  });

  /*
   * The pair of cases that decide which source a journey reads from, now that
   * a stop can be taken out of one of them.
   */
  it('draws no route at all when every stop of the journal is switched off', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id);
    linkTripToJourney(testDb, journey.id, trip.id);
    createPlace(testDb, trip.id, { name: 'a trip place', lat: 48.85, lng: 2.35 });
    await placeEntry(journey.id, user.id, 52.52, 13.4, {
      title: 'Berlin, the airport',
      entry_date: '2026-06-01',
      stats_excluded: 1,
    });

    const stats = (await svc.journeyStats(journey.id, user.id))!;

    expect(stats.points).toEqual([]);
    expect(stats.distance).toBe(0);
    expect(stats.excluded.map((s) => s.label)).toEqual(['Berlin, the airport']);
  });

  it('still falls back to the trip places for a journal that never had a point', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id);
    linkTripToJourney(testDb, journey.id, trip.id);
    createPlace(testDb, trip.id, { name: 'a trip place', lat: 48.85, lng: 2.35 });
    createJourneyEntry(testDb, journey.id, user.id, { title: 'written, not placed', stats_excluded: 1 });

    const stats = (await svc.journeyStats(journey.id, user.id))!;

    expect(stats.points.map((p) => p.label)).toEqual(['a trip place']);
  });
});
