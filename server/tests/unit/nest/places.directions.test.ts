/**
 * Importing a shared Google Maps directions link (PLACES-DIR-*).
 *
 * A real in-memory DB, so the dedupe and the insert are exercised as they run; the SSRF
 * guard and the geocoder are stubbed, because neither a DNS lookup nor Nominatim belongs
 * in a unit test. What is under test is the step between the two: which stops the link
 * yields, which of them get geocoded, and what a partly readable link leaves behind.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  // DatabaseService delegates the joined read straight through to the module, so the
  // mock has to answer it: without this the insert half of every import throws.
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: (placeId: any) => {
      const place: any = db.prepare('SELECT * FROM places WHERE id = ?').get(placeId);
      return place ? { ...place, category: null, tags: [] } : null;
    },
  };
  return { testDb: db, dbMock: mock };
});
vi.mock('../../../src/db/database', () => dbMock);

const { checkSsrf, safeFetchFollow } = vi.hoisted(() => ({
  checkSsrf: vi.fn(async () => ({ allowed: true, resolvedIp: '1.2.3.4' })),
  safeFetchFollow: vi.fn(),
}));
vi.mock('../../../src/utils/ssrfGuard', () => ({
  checkSsrf,
  safeFetchFollow,
  createPinnedDispatcher: vi.fn(() => ({})),
  SsrfBlockedError: class SsrfBlockedError extends Error {},
}));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { createUser, createTrip, createPlace } from '../../helpers/factories';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { PlacesService } from '../../../src/nest/places/places.service';
import type { MapsService } from '../../../src/nest/maps/maps.service';
import { QueryHelpersService } from '../../../src/nest/query-helpers/query-helpers.service';
import { UnsplashService } from '../../../src/nest/unsplash/unsplash.service';
import { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import type { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { TrekPhotosRepository } from '../../../src/nest/photos/trek-photos.repository';
import { makeStorageFixture } from '../../helpers/storage-fixture';

const dbs = new DatabaseService(testDb);
const photoCacheStub = { removeIfUnreferenced: vi.fn() } as unknown as PlacePhotoCacheService;
const storageFx = makeStorageFixture('');

/** Nominatim's answer shape, cut to the fields this path reads. */
const hit = (name: string, lat: number, lng: number) => ({
  google_place_id: null, google_ftid: null, osm_id: `node:${name}`, name, address: name,
  lat, lng, rating: null, website: null, phone: null, source: 'openstreetmap' as const,
});

function svc(searchNominatim: MapsService['searchNominatim']): PlacesService {
  return new PlacesService(
    dbs,
    new PermissionsService(dbs),
    new RealtimeService(),
    // The address backfill runs fire-and-forget after every import, so the stub answers
    // it too — otherwise every passing test prints a rejected promise.
    { searchNominatim, reverseGeocode: vi.fn(async () => null) } as unknown as MapsService,
    new QueryHelpersService(dbs),
    new UnsplashService(dbs, new RuntimeEnvService(), storageFx.storage),
    photoCacheStub,
    new JourneyDomainService(dbs, new RealtimeService(), new TrekPhotosRepository(dbs)),
    storageFx.storage,
  );
}

const geocoder = () => vi.fn(async (query: string) => {
  const known: Record<string, [number, number]> = {
    Berlin: [52.52, 13.405],
    Dresden: [51.05, 13.737],
    Prague: [50.075, 14.437],
  };
  const found = known[query];
  return found ? [hit(query, found[0], found[1])] : [];
}) as unknown as MapsService['searchNominatim'];

let tripId: string;

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  testDb.exec('DELETE FROM places; DELETE FROM trips; DELETE FROM users');
  const { user } = createUser(testDb, { email: 'dir@example.com' });
  tripId = String(createTrip(testDb, user.id, { title: 'Road trip' }).id);
  checkSsrf.mockResolvedValue({ allowed: true, resolvedIp: '1.2.3.4' });
  safeFetchFollow.mockReset();
});

describe('PlacesService.importGoogleDirections', () => {
  it('PLACES-DIR-001: a link whose blob carries every stop needs no geocoder at all', async () => {
    const search = geocoder();
    const url = 'https://www.google.com/maps/dir/Berlin/Dresden/@51.5,13.5,8z/'
      + 'data=!4m14!1m5!1m1!1s0x0:0x0!2m2!1d13.404954!2d52.520008!1m5!1m1!1s0x0:0x0!2m2!1d13.737262!2d51.050409';
    const result = await svc(search).importGoogleDirections(tripId, url);

    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.places.map((p) => p.name)).toEqual(['Berlin', 'Dresden']);
    expect(result.places[0].lat).toBeCloseTo(52.520008, 5);
    expect(result.listName).toBe('Berlin → Dresden');
    expect(search).not.toHaveBeenCalled();
  });

  it('PLACES-DIR-002: a stop that is only a name is geocoded, and keeps the name from the link', async () => {
    const search = geocoder();
    const result = await svc(search).importGoogleDirections(
      tripId,
      'https://www.google.com/maps/dir/Berlin/Dresden/Prague',
    );

    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.places.map((p) => p.name)).toEqual(['Berlin', 'Dresden', 'Prague']);
    expect(search).toHaveBeenCalledTimes(3);
  });

  it('PLACES-DIR-003: a stop nobody can place is left out, not made up, and is counted', async () => {
    const search = geocoder();
    const result = await svc(search).importGoogleDirections(
      tripId,
      'https://www.google.com/maps/dir/Berlin/Somewhere+Nobody+Knows/Prague',
    );

    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.places.map((p) => p.name)).toEqual(['Berlin', 'Prague']);
    // Skipped covers both "already on the trip" and "could not be placed": from the
    // traveller's side they are one number, this many stops did not arrive.
    expect(result.skipped).toBe(1);
  });

  it('PLACES-DIR-004: a geocoder that is down costs its stop, never the import', async () => {
    const search = vi.fn(async (query: string) => {
      if (query === 'Dresden') throw new Error('Nominatim 429');
      return [hit(query, 52.52, 13.405)];
    }) as unknown as MapsService['searchNominatim'];
    const result = await svc(search).importGoogleDirections(tripId, 'https://www.google.com/maps/dir/Berlin/Dresden/Prague');

    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.places).toHaveLength(2);
    expect(result.skipped).toBe(1);
  });

  it('PLACES-DIR-005: a stop already on the trip is skipped rather than doubled', async () => {
    createPlace(testDb, Number(tripId), { name: 'Berlin', lat: 52.520008, lng: 13.404954 });
    const url = 'https://www.google.com/maps/dir/Berlin/Dresden/@51.5,13.5,8z/'
      + 'data=!4m14!1m5!1m1!1s0x0:0x0!2m2!1d13.404954!2d52.520008!1m5!1m1!1s0x0:0x0!2m2!1d13.737262!2d51.050409';
    const result = await svc(geocoder()).importGoogleDirections(tripId, url);

    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.places.map((p) => p.name)).toEqual(['Dresden']);
    expect(result.skipped).toBe(1);
  });

  it('PLACES-DIR-006: a link that is not Google\'s is refused after it is resolved', async () => {
    const result = await svc(geocoder()).importGoogleDirections(tripId, 'https://evil.example.com/maps/dir/Berlin/Dresden');
    expect(result).toEqual({ error: 'That link is not a Google Maps link.', status: 400 });
  });

  it('PLACES-DIR-007: a short link is followed once, through the guard', async () => {
    safeFetchFollow.mockResolvedValue({
      url: 'https://www.google.com/maps/dir/Berlin/Dresden',
    } as unknown as Response);
    const result = await svc(geocoder()).importGoogleDirections(tripId, 'https://maps.app.goo.gl/abc123');

    expect(safeFetchFollow).toHaveBeenCalledTimes(1);
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.places).toHaveLength(2);
  });

  it('PLACES-DIR-008: a blocked URL never reaches the parser', async () => {
    checkSsrf.mockResolvedValue({ allowed: false } as never);
    const result = await svc(geocoder()).importGoogleDirections(tripId, 'https://www.google.com/maps/dir/Berlin/Dresden');
    expect(result).toEqual({ error: 'URL is not allowed', status: 400 });
  });

  it('PLACES-DIR-009: a link with nothing to read says what to do instead', async () => {
    const result = await svc(geocoder()).importGoogleDirections(tripId, 'https://www.google.com/maps/dir/Berlin');
    expect(result).toMatchObject({ status: 400 });
    expect((result as { error: string }).error).toMatch(/Share button/);
  });

  it('PLACES-DIR-010: a route where only one stop can be placed is not half an import', async () => {
    const search = vi.fn(async () => []) as unknown as MapsService['searchNominatim'];
    const url = 'https://www.google.com/maps/dir/52.52,13.405/Nowhere/Nowhere+Else';
    const result = await svc(search).importGoogleDirections(tripId, url);
    expect(result).toEqual({ error: 'None of the stops in that link could be placed on the map.', status: 400 });
  });
});
