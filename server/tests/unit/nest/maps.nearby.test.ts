/**
 * MAPS-NEARBY-001..010 — places around a point, nearest first (#976).
 *
 * Three sources in the search's own order: the index, Google with a key, then
 * OpenStreetMap. What matters is that each answer reads the same (the search
 * record plus `distance_m`, nearest first), and that Google, which bills per
 * call, is asked only when the index had nothing and never twice for one spot.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockNearby } = vi.hoisted(() => ({
  mockNearby: vi.fn(async (_lat: number, _lng: number, _opts?: { radius?: number; limit?: number }): Promise<unknown[]> => []),
}));
vi.mock('../../../src/nest/maps/trek-places.client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/nest/maps/trek-places.client')>()),
  trekPlacesNearby: mockNearby,
}));

vi.mock('../../../src/config', () => ({ JWT_SECRET: 'test-secret', ENCRYPTION_KEY: '0'.repeat(64) }));

import { MapsService } from '../../../src/nest/maps/maps.service';
import {
  nearbyCacheKey,
  nearbyOverpassQuery,
  nearestFirst,
  overpassNearbyRecords,
} from '../../../src/nest/maps/maps-nearby.helpers';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';
import { noGoogleQuota } from '../../helpers/google-quota';

const indexRow = (gers: string, name: string, lat: number, lng: number) => ({
  gers,
  name,
  lat,
  lng,
  category: 'cafe',
  categoryPath: null,
  confidence: 0.9,
  address: { freeform: 'Pariser Platz 1', locality: 'Berlin', postcode: '10117', region: null, country: 'DE' },
  contact: null,
  brand: null,
  source: 'overture',
  hours: null,
  distanceMetres: 0,
});

const ORIGINAL_TREK_PLACES = process.env.TREK_PLACES_ENABLED;
const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
const error = vi.spyOn(console, 'error').mockImplementation(() => {});

// Every case asks about its own spot: the answers are cached per process, and a
// shared point would make the second case read the first one's answer.
let spot = 0;
function nextPoint() {
  spot += 1;
  return { lat: 10 + spot / 10, lng: 20 + spot / 10 };
}

function make(opts: { index?: boolean; google?: boolean } = {}) {
  if (opts.index === false) process.env.TREK_PLACES_ENABLED = 'false';
  else delete process.env.TREK_PLACES_ENABLED;
  const database = { get: vi.fn(() => undefined) } as unknown as DatabaseService;
  const svc = new MapsService(database, {} as PlacePhotoCacheService, noGoogleQuota);
  vi.spyOn(svc, 'keyedProvider').mockReturnValue(
    opts.google ? ({ id: 'google', key: 'test-key', source: 'user-row' } as ReturnType<MapsService['keyedProvider']>) : null,
  );
  return svc;
}

const jsonResponse = (body: unknown, ok = true, status = 200) => ({ ok, status, json: async () => body });

beforeEach(() => {
  mockNearby.mockReset();
  mockNearby.mockResolvedValue([]);
  warn.mockClear();
  error.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  if (ORIGINAL_TREK_PLACES === undefined) delete process.env.TREK_PLACES_ENABLED;
  else process.env.TREK_PLACES_ENABLED = ORIGINAL_TREK_PLACES;
});

describe('MapsService.nearbyPlaces', () => {
  it('MAPS-NEARBY-001: the index answers first, nearest first, with the distance on each record', async () => {
    const p = nextPoint();
    mockNearby.mockResolvedValue([
      indexRow('far', 'Far Cafe', p.lat + 0.003, p.lng),
      indexRow('near', 'Near Cafe', p.lat + 0.0005, p.lng),
    ]);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const out = await make({ google: true }).nearbyPlaces(1, p.lat, p.lng, { radius: 800, limit: 5 });

    expect(mockNearby).toHaveBeenCalledWith(p.lat, p.lng, { radius: 800, limit: 5 });
    expect(out.source).toBe('trek-places');
    expect(out.places.map(r => r.name)).toEqual(['Near Cafe', 'Far Cafe']);
    expect(out.places[0].distance_m).toBe(56);
    expect(out.places[0].osm_id).toBe('gers:near');
    // A key is there, and still not spent.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('MAPS-NEARBY-002: with nothing in the index, Google is asked by distance inside the circle', async () => {
    const p = nextPoint();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      places: [
        { id: 'g-far', displayName: { text: 'Far' }, location: { latitude: p.lat + 0.002, longitude: p.lng } },
        { id: 'g-shut', displayName: { text: 'Shut' }, location: { latitude: p.lat, longitude: p.lng }, businessStatus: 'CLOSED_PERMANENTLY' },
        { id: 'g-near', displayName: { text: 'Near' }, formattedAddress: 'Somewhere 1', location: { latitude: p.lat + 0.0001, longitude: p.lng } },
      ],
    }));
    vi.stubGlobal('fetch', fetchMock);

    const out = await make({ google: true }).nearbyPlaces(1, p.lat, p.lng, { lang: 'de' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('places:searchNearby');
    expect(JSON.parse(init.body as string)).toEqual({
      maxResultCount: 20,
      rankPreference: 'DISTANCE',
      languageCode: 'de',
      locationRestriction: { circle: { center: { latitude: p.lat, longitude: p.lng }, radius: 500 } },
    });
    expect(out.source).toBe('google');
    expect(out.places.map(r => r.google_place_id)).toEqual(['g-near', 'g-far']);
    expect(out.places[0]).toMatchObject({ name: 'Near', address: 'Somewhere 1', distance_m: 11, source: 'google' });
  });

  it('MAPS-NEARBY-003: a Google refusal is an error with its status, not an empty list', async () => {
    const p = nextPoint();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: { message: 'Quota exceeded' } }, false, 429)));

    await expect(make({ google: true }).nearbyPlaces(1, p.lat, p.lng)).rejects.toMatchObject({
      message: 'Quota exceeded',
      status: 429,
    });
    expect(error).toHaveBeenCalledWith(expect.stringContaining('searchNearby failed with 429 userId=1 keySource=user-row'));
  });

  it('MAPS-NEARBY-004: without a key OpenStreetMap answers, in the asked language, nearest first', async () => {
    const p = nextPoint();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      elements: [
        { type: 'node', id: 2, lat: p.lat + 0.001, lon: p.lng, tags: { name: 'Museum', 'name:de': 'Das Museum', tourism: 'museum' } },
        { type: 'way', id: 3, center: { lat: p.lat + 0.0002, lon: p.lng }, tags: { name: 'Bakery', shop: 'bakery' } },
      ],
    }));
    vi.stubGlobal('fetch', fetchMock);

    const out = await make().nearbyPlaces(1, p.lat, p.lng, { radius: 300, lang: 'de' });

    const body = decodeURIComponent(String((fetchMock.mock.calls[0][1] as RequestInit).body));
    expect(body).toContain(`around:300,${p.lat},${p.lng}`);
    expect(out.source).toBe('openstreetmap');
    expect(out.places.map(r => r.name)).toEqual(['Bakery', 'Das Museum']);
    expect(out.places[0]).toMatchObject({ osm_id: 'way:3', category: 'shop_bakery', distance_m: 22 });
  });

  it('MAPS-NEARBY-005: a failing index drops through to the next source and says so', async () => {
    const p = nextPoint();
    mockNearby.mockRejectedValue(new Error('index down'));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ elements: [] })));

    const out = await make().nearbyPlaces(1, p.lat, p.lng);

    expect(out).toEqual({ places: [], source: 'openstreetmap' });
    expect(warn).toHaveBeenCalledWith('TREK Places nearby failed, falling back:', 'index down');
  });

  it('MAPS-NEARBY-006: with the index switched off it is never asked', async () => {
    const p = nextPoint();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ elements: [] })));

    await make({ index: false }).nearbyPlaces(1, p.lat, p.lng);

    expect(mockNearby).not.toHaveBeenCalled();
  });

  it('MAPS-NEARBY-007: the same spot asked twice costs one lookup', async () => {
    const p = nextPoint();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ places: [] }));
    vi.stubGlobal('fetch', fetchMock);
    const svc = make({ google: true });

    await svc.nearbyPlaces(1, p.lat, p.lng);
    await svc.nearbyPlaces(1, p.lat + 0.00001, p.lng);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mockNearby).toHaveBeenCalledTimes(1);
  });
});

describe('nearby helpers', () => {
  it('MAPS-NEARBY-008: the Overpass question is a named place of a visitable kind inside the circle, capped', () => {
    const q = nearbyOverpassQuery(52.5, 13.4, 250.4, 10);
    expect(q).toContain('nwr(around:250,52.5,13.4)[name][~"^(amenity|tourism|shop|leisure|historic)$"~"."];');
    expect(q).toContain('out center tags 30;');
  });

  it('MAPS-NEARBY-009: unnamed, placeless and shut places are left out; the kind reads like a search category', () => {
    const origin = { lat: 0, lng: 0 };
    const out = overpassNearbyRecords([
      { type: 'node', id: 1, lat: 0, lon: 0, tags: { amenity: 'bench' } },
      { type: 'node', id: 2, tags: { name: 'Nowhere', amenity: 'cafe' } },
      { type: 'node', id: 3, lat: 0, lon: 0, tags: { name: 'Gone', amenity: 'bar', disused: 'yes' } },
      { type: 'node', id: 4, lat: 0, lon: 0.001, tags: { int_name: 'Park', leisure: 'park', website: 'park.example', 'addr:street': 'Main', 'addr:housenumber': '5' } },
      { type: 'node', id: 5, lat: 0, lon: 0, tags: { name: 'Shopish', shop: 'yes', tourism: 'artwork' } },
    ], origin, 'en', 10);
    expect(out.map(r => r.name)).toEqual(['Shopish', 'Park']);
    expect(out[0].category).toBe('artwork');
    expect(out[1]).toMatchObject({ address: 'Main 5', website: 'https://park.example', category: 'park', distance_m: 111 });
  });

  it('MAPS-NEARBY-010: records without a position are dropped and the list keeps to the limit; the cache key rounds to ten metres', () => {
    const out = nearestFirst(
      [{ name: 'a', lat: 0, lng: 0.002 }, { name: 'b', lat: null, lng: null }, { name: 'c', lat: 0, lng: 0.001 }],
      { lat: 0, lng: 0 },
      1,
    );
    expect(out).toEqual([{ name: 'c', lat: 0, lng: 0.001, distance_m: 111 }]);
    expect(nearbyCacheKey(52.516312, 13.377712, 500, 20, 'de')).toBe(nearbyCacheKey(52.51634, 13.37768, 500, 20, 'de'));
    expect(nearbyCacheKey(52.5163, 13.3777, 500, 20, 'de')).not.toBe(nearbyCacheKey(52.5163, 13.3777, 500, 20, 'en'));
  });
});
