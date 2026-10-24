/**
 * MAPS-ALONG-010..019: places near a line (PLN-02), from the index in circles
 * along it and from Overpass, in stretches of the whole line, for the kinds
 * the index does not know. After every Overpass mirror failed, its kinds are
 * named unavailable at once for a cooldown instead of after its deadline,
 * unless Overpass answered meanwhile, the stretch is still cached or a probe
 * is due; the answer then says how many seconds until it is asked again.
 *
 * The index is asked through a stub here, Overpass through a spy on the OSM
 * client: these cases are about who is asked for what, and how a source that
 * fails is reported instead of reading as nothing found.
 */
import type { AppSettingsRepository } from '../../../src/db/repositories/AppSettings.repository';
import type { UsersRepository } from '../../../src/db/repositories/Users.repository';
import { ownedByAsked } from '../../../src/nest/maps/maps-index.helpers';
import { OVERPASS_ALONG_COOLDOWN_MS } from '../../../src/nest/maps/providers/osm.client';
import { INDEX_MAX_CATEGORY_CHARS, INDEX_MAX_LIMIT } from '../../../src/nest/maps/trek-places.client';
import type { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';
import { noGoogleQuota } from '../../helpers/google-quota';
import { buildMapsParts } from '../../helpers/maps-service';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockNearby, mockHighlights, logWarn } = vi.hoisted(() => ({
  logWarn: vi.fn(),
  mockHighlights: vi.fn(
    async (
      _lat: number,
      _lng: number,
      _opts?: { radius?: number; limit?: number; lang?: string },
    ): Promise<{ highlights: unknown[]; qrankRelease: string | null }> => ({ highlights: [], qrankRelease: null }),
  ),
  mockNearby: vi.fn(
    async (
      _lat: number,
      _lng: number,
      _opts?: { radius?: number; limit?: number; category?: string },
    ): Promise<unknown[]> => [],
  ),
}));
// The log line is the operator's only trace of a source that failed; the logger itself writes to trek.log.
vi.mock('../../../src/nest/audit/audit-log.logger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/nest/audit/audit-log.logger')>()),
  logWarn,
}));
vi.mock('../../../src/nest/maps/trek-places.client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/nest/maps/trek-places.client')>()),
  trekPlacesNearby: mockNearby,
  trekPlacesHighlights: mockHighlights,
}));

const noAppSettings = { getValue: async () => null } as unknown as AppSettingsRepository;
const noUsers = { getApiKeyColumn: async () => null } as unknown as UsersRepository;

// Just under 3 km due north at 500 m: four circles about a kilometre apart, each reaching 1000 m.
const LINE = [
  { lat: 47, lng: 11 },
  { lat: 47.0269, lng: 11 },
];

/** An index row of one category path. */
function row(gers: string, name: string, categoryPath: string, over: Record<string, unknown> = {}) {
  return {
    gers,
    name,
    lat: 47.01,
    lng: 11.001,
    category: categoryPath.slice(categoryPath.lastIndexOf('>') + 1),
    categoryPath,
    confidence: 0.9,
    address: null,
    contact: null,
    brand: null,
    source: 'overture',
    hours: null,
    distanceMetres: 100,
    ...over,
  };
}

const CAFE = 'food_and_drink>casual_eatery>cafe';
const MUSEUM = 'arts_and_entertainment>museum';

const SPRING = {
  osm_id: 'node:7',
  name: '',
  lat: 47.012,
  lng: 11.002,
  category: 'drinking_water',
  poi_type: 'amenity=drinking_water',
  address: null,
  website: null,
  phone: null,
  opening_hours: null,
  cuisine: null,
  brand: null,
  brand_wikidata: null,
  charging: null,
  source: 'openstreetmap' as const,
};

const ORIGINAL_TREK_PLACES = process.env.TREK_PLACES_ENABLED;

function make(enabled = true) {
  if (enabled) delete process.env.TREK_PLACES_ENABLED;
  else process.env.TREK_PLACES_ENABLED = 'false';
  const { svc, osm } = buildMapsParts(
    {} as PlacePhotoCacheService,
    noAppSettings,
    noUsers,
    {} as never,
    {} as never,
    noGoogleQuota,
  );
  const overpass = vi
    .spyOn(osm, 'searchOverpassPoisAlong')
    .mockResolvedValue({ pois: [SPRING], source: 'openstreetmap', truncated: false, clamped: false });
  return { svc, overpass, osm };
}

/** The lines logged as warnings. */
const mapsWarnings = () => logWarn.mock.calls.map((call) => String(call[0]));

/** What every Overpass mirror answers while it is down. */
const DOWN = { ok: false, status: 504, json: async () => ({}) };

/** How many different Overpass queries a stubbed fetch was sent; each goes to every mirror. */
const queriesSent = (fetchMock: { mock: { calls: unknown[][] } }) =>
  new Set(fetchMock.mock.calls.map((call) => decodeURIComponent(String((call[1] as RequestInit).body)))).size;

/** A line due north from 47°N 11°E, `degrees` of latitude long: about 111 km each. */
const north = (degrees: number) => [
  { lat: 47, lng: 11 },
  { lat: 47 + degrees, lng: 11 },
];

/** Counts the Overpass queries in flight, each answering after a turn of the event loop. */
function inFlight(overpass: ReturnType<typeof make>['overpass']) {
  const seen = { now: 0, most: 0 };
  overpass.mockImplementation(async () => {
    seen.now += 1;
    seen.most = Math.max(seen.most, seen.now);
    await new Promise((resolve) => setTimeout(resolve, 5));
    seen.now -= 1;
    return { pois: [SPRING], source: 'openstreetmap', truncated: false, clamped: false };
  });
  return seen;
}

beforeEach(() => {
  mockNearby.mockReset();
  mockNearby.mockResolvedValue([]);
  mockHighlights.mockReset();
  mockHighlights.mockResolvedValue({ highlights: [], qrankRelease: null });
  logWarn.mockClear();
});

afterEach(() => {
  if (ORIGINAL_TREK_PLACES === undefined) delete process.env.TREK_PLACES_ENABLED;
  else process.env.TREK_PLACES_ENABLED = ORIGINAL_TREK_PLACES;
});

describe('MapsService.poisAlong', () => {
  it('MAPS-ALONG-010: asks the index in every circle for its kinds only, and Overpass once for the rest', async () => {
    const { svc, overpass } = make();

    const out = await svc.poisAlong(['cafe', 'drinking_water'], LINE, 500, 'de', 30);

    expect(mockNearby).toHaveBeenCalledTimes(4);
    const centres = mockNearby.mock.calls.map(([lat, lng]) => [Number(lat.toFixed(3)), Number(lng.toFixed(3))]);
    expect(centres).toEqual([
      [47, 11],
      [47.009, 11],
      [47.018, 11],
      [47.027, 11],
    ]);
    for (const [, , opts] of mockNearby.mock.calls) {
      expect(opts).toEqual({
        radius: 1000,
        limit: 30,
        category: 'food_and_drink>casual_eatery>cafe,food_and_drink>non_alcoholic_beverage_venue>coffee_shop',
      });
    }
    expect(overpass).toHaveBeenCalledTimes(1);
    expect(overpass).toHaveBeenCalledWith('drinking_water', LINE, 500, 'de', 30);
    // The unnamed spring stays: a tap is what a walk looks for.
    expect(out).toEqual({ pois: [SPRING], failed: [], partial: false, truncated: false, capped: false });
  });

  it('MAPS-ALONG-011: a walk asks one request per kind when they would not fit one, each inside the limits', async () => {
    const { svc, overpass } = make();

    await svc.poisAlong(['sights', 'museum', 'park', 'cafe', 'restaurant', 'market'], LINE, 500, 'de', 30);

    // Six kinds in four circles; none of them is asked of Overpass.
    expect(mockNearby).toHaveBeenCalledTimes(24);
    for (const [, , opts] of mockNearby.mock.calls) {
      expect(opts?.limit).toBe(30);
      expect(opts?.limit).toBeLessThanOrEqual(INDEX_MAX_LIMIT);
      expect(opts?.category?.length).toBeLessThanOrEqual(INDEX_MAX_CATEGORY_CHARS);
    }
    expect(mockNearby.mock.calls.slice(0, 6).map(([, , opts]) => opts?.category)).toEqual([
      'cultural_and_historic>historic_site,cultural_and_historic>memorial_site>monument',
      'arts_and_entertainment>museum,arts_and_entertainment>arts_and_crafts_space>art_gallery,arts_and_entertainment>performing_arts_venue,arts_and_entertainment>movie_theater',
      'sports_and_recreation>park,geographic_entities>built_feature>garden',
      'food_and_drink>casual_eatery>cafe,food_and_drink>non_alcoholic_beverage_venue>coffee_shop',
      'food_and_drink>restaurant,food_and_drink>casual_eatery',
      'shopping>market',
    ]);
    // An empty circle is an answer: Overpass is never asked for what the index knows.
    expect(overpass).not.toHaveBeenCalled();
  });

  it('MAPS-ALONG-011b: kinds that would fit one request are still asked one by one, so a market is not crowded out', async () => {
    const { svc } = make();

    await svc.poisAlong(['restaurant', 'cafe', 'market'], LINE, 500, 'de', 30);

    expect(mockNearby).toHaveBeenCalledTimes(12);
    expect(mockNearby.mock.calls.slice(0, 3).map(([, , opts]) => [opts?.category, opts?.limit])).toEqual([
      ['food_and_drink>restaurant,food_and_drink>casual_eatery', 30],
      ['food_and_drink>casual_eatery>cafe,food_and_drink>non_alcoholic_beverage_venue>coffee_shop', 30],
      ['shopping>market', 30],
    ]);
  });

  it('MAPS-ALONG-012: an index that answers no circle hands its kinds to Overpass once, and says why', async () => {
    mockNearby.mockRejectedValue(new Error('places api down'));
    const { svc, overpass } = make();
    const seen = inFlight(overpass);

    const out = await svc.poisAlong(['cafe', 'drinking_water'], LINE, 500, 'de', 30);

    expect(overpass).toHaveBeenCalledTimes(2);
    expect(overpass).toHaveBeenLastCalledWith('cafe', LINE, 500, 'de', 30);
    // The index's kinds are asked while the others still are, not one deadline after the other.
    expect(seen.most).toBe(2);
    expect(out.failed).toEqual([]);
    // Nothing of the line was left out: Overpass searched all of it.
    expect(out.partial).toBe(false);
    expect(mapsWarnings()).toEqual([
      expect.stringContaining('[Maps] TREK places index along a line: 4 of 4 requests failed: places api down'),
    ]);
  });

  it('MAPS-ALONG-013: one circle failing keeps the places of the others and marks the answer partial', async () => {
    mockNearby.mockRejectedValueOnce('timeout').mockResolvedValue([row('c-1', 'Kaffeehaus', CAFE)]);
    const { svc, overpass } = make();

    const out = await svc.poisAlong(['cafe'], LINE, 500, 'de', 30);

    expect(overpass).not.toHaveBeenCalled();
    expect(out.partial).toBe(true);
    // The same cafe in three overlapping circles is one place.
    expect(out.pois.map((poi) => [poi.osm_id, poi.category])).toEqual([['gers:c-1', 'cafe']]);
    expect(mapsWarnings()).toEqual([expect.stringContaining('1 of 4 requests failed: timeout')]);
  });

  it('MAPS-ALONG-014: Overpass failing names its kinds as failed, keeps the index places and is logged once', async () => {
    mockNearby.mockResolvedValue([row('c-1', 'Kaffeehaus', CAFE)]);
    const { svc, overpass } = make();
    overpass.mockRejectedValue(new Error('Could not reach any Overpass endpoint'));

    const out = await svc.poisAlong(['cafe', 'viewpoint', 'drinking_water'], LINE, 500, 'de', 30);

    expect(out.failed).toEqual(['viewpoint', 'drinking_water']);
    expect(out.pois.map((poi) => poi.name)).toEqual(['Kaffeehaus']);
    expect(out.partial).toBe(false);
    expect(mapsWarnings()).toEqual([
      expect.stringContaining(
        '[Maps] OpenStreetMap along a line: viewpoint, drinking_water: 1 of 1 requests failed: Could not reach any',
      ),
    ]);
  });

  it('MAPS-ALONG-015: with the index switched off every kind goes to Overpass in one query', async () => {
    const { svc, overpass } = make(false);

    await svc.poisAlong(['cafe', 'drinking_water'], LINE, 500);

    expect(mockNearby).not.toHaveBeenCalled();
    expect(overpass).toHaveBeenCalledTimes(1);
    expect(overpass).toHaveBeenCalledWith('cafe,drinking_water', LINE, 500, undefined, 30);
  });

  it('MAPS-ALONG-016: each hit is labelled with the kind that produced it, its hours kept; a full page is cut', async () => {
    const hours = { osm: 'Tu-Su 10:00-18:00', source: 'openstreetmap', sourceUrl: null };
    mockNearby.mockImplementation(async (_lat, _lng, opts) =>
      opts?.category?.startsWith('arts')
        ? [
            row('m-1', 'Lenbachhaus', MUSEUM, { hours }),
            ...Array.from({ length: 29 }, (_, i) => row(`m-${i + 2}`, `Museum ${i}`, MUSEUM)),
          ]
        : opts?.category?.startsWith('sports')
          ? [
              row('p-1', 'Englischer Garten', 'sports_and_recreation>park'),
              row('p-2', 'Therme Erding', 'sports_and_recreation>park>water_park'),
            ]
          : [row('s-1', 'Siegestor', 'cultural_and_historic>memorial_site>monument')],
    );
    const { svc } = make();

    const out = await svc.poisAlong(['sights', 'museum', 'park'], LINE, 500, 'de', 30);

    expect(out.truncated).toBe(true);
    const byName = new Map(out.pois.map((poi) => [poi.name, poi]));
    expect(byName.get('Lenbachhaus')).toMatchObject({ category: 'museum', opening_hours: 'Tu-Su 10:00-18:00' });
    expect(byName.get('Siegestor')).toMatchObject({ category: 'sights', opening_hours: null });
    expect(byName.get('Englischer Garten')).toMatchObject({ category: 'park' });
    // A water park lies under the parks' path, but it is the activity pill's: no park of a walk.
    expect(byName.has('Therme Erding')).toBe(false);
  });

  it('MAPS-ALONG-016b: a row goes to the kind that names its path most closely, a row no kind knows is left as it is', () => {
    const waterPark = { category: 'water_park', categoryPath: 'sports_and_recreation>park>water_park' };
    expect(ownedByAsked(waterPark, ['park'])).toBe(false);
    expect(ownedByAsked(waterPark, ['park', 'activity'])).toBe(true);
    expect(ownedByAsked({ category: 'park', categoryPath: 'sports_and_recreation>park' }, ['park'])).toBe(true);
    // Judged by its leaf where the index left the path empty.
    expect(ownedByAsked({ category: 'water_park', categoryPath: null }, ['park'])).toBe(false);
    expect(ownedByAsked({ category: null, categoryPath: null }, ['park'])).toBe(true);
    expect(ownedByAsked({ category: 'pier', categoryPath: 'travel>pier' }, ['park'])).toBe(true);
  });

  it('MAPS-ALONG-017: an index and an Overpass that both fail name every kind as failed', async () => {
    mockNearby.mockRejectedValue(new Error('places api down'));
    const { svc, overpass } = make();
    overpass.mockRejectedValue(new Error('Could not reach any Overpass endpoint'));

    const out = await svc.poisAlong(['cafe', 'viewpoint'], LINE, 500, 'de', 30);

    expect(out).toEqual({ pois: [], failed: ['viewpoint', 'cafe'], partial: false, truncated: false, capped: false });
    expect(mapsWarnings()).toHaveLength(3);
  });

  it('MAPS-ALONG-018: a line longer than the circles reach has its index kinds searched along its start, and says so', async () => {
    const { svc, overpass } = make();
    const long = north(1);

    const out = await svc.poisAlong(['cafe', 'viewpoint'], long, 250, 'de', 30);

    expect(out.capped).toBe(true);
    expect(mockNearby).toHaveBeenCalledTimes(24);
    expect(Math.max(...mockNearby.mock.calls.map(([lat]) => lat))).toBeLessThan(47.32);
    // Overpass searches the whole line in three stretches of about 37 km, the last one ending where the line does.
    expect(overpass).toHaveBeenCalledTimes(3);
    const stretches = overpass.mock.calls.map((call) => call[1]);
    expect(stretches[0]?.[0]).toEqual(long[0]);
    expect(stretches[1]?.[0]).toEqual(stretches[0]?.at(-1));
    expect(stretches[2]?.[0]).toEqual(stretches[1]?.at(-1));
    expect(stretches[2]?.at(-1)).toEqual(long[1]);
  });

  it('MAPS-ALONG-019: the kinds Overpass answers are searched along the whole line, a few stretches at a time', async () => {
    const { svc, overpass } = make();
    const seen = inFlight(overpass);

    const ride = await svc.poisAlong(['drinking_water', 'toilets'], north(1), 500, 'de', 30);

    expect(ride).toMatchObject({ capped: false, partial: false, failed: [] });
    expect(overpass.mock.calls.map((call) => call[0])).toEqual([
      'drinking_water,toilets',
      'drinking_water,toilets',
      'drinking_water,toilets',
    ]);

    // An index that answers nothing leaves its kinds to Overpass, which reaches the whole line.
    overpass.mockClear();
    mockNearby.mockRejectedValue(new Error('places api down'));
    const fallback = await svc.poisAlong(['cafe'], north(1), 500, 'de', 30);
    expect(fallback).toMatchObject({ capped: false, failed: [] });
    expect(overpass).toHaveBeenCalledTimes(3);

    // Past 400 km the line is searched along its start; never more than three stretches are in flight.
    overpass.mockClear();
    seen.most = 0;
    const crossing = await svc.poisAlong(['viewpoint'], north(4.5), 500, 'de', 30);
    expect(crossing.capped).toBe(true);
    expect(overpass).toHaveBeenCalledTimes(8);
    expect(seen.most).toBe(3);
  });

  it('MAPS-ALONG-019c: after every Overpass mirror failed, the next searches name its kinds at once and say when to retry', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-19T10:00:00Z') });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Mirrors that never answer: each request waits out its deadline and is aborted.
    const fetchMock = vi.fn(
      (_url: unknown, init?: RequestInit) =>
        new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))),
    );
    vi.stubGlobal('fetch', fetchMock);
    mockNearby.mockResolvedValue([row('c-1', 'Kaffeehaus', CAFE)]);
    const { svc, overpass } = make();
    overpass.mockRestore();
    try {
      const first = svc.poisAlong(['cafe', 'viewpoint', 'drinking_water'], LINE, 500, 'de', 30);
      // The four mirrors asked a second and a half apart, each waiting out its seventeen seconds.
      await vi.advanceTimersByTimeAsync(25_000);
      expect(await first).toMatchObject({ failed: ['viewpoint', 'drinking_water'], partial: false, retryAfterS: 20 });
      const asked = fetchMock.mock.calls.length;
      expect(asked).toBe(4);

      // Without waiting for any deadline: nothing is asked, the index places stay, the kinds are named.
      const again = await svc.poisAlong(['cafe', 'viewpoint', 'drinking_water'], LINE, 500, 'de', 30);
      const hike = await svc.poisAlong(['viewpoint', 'shelter'], north(0.1), 500, 'de', 30);
      expect(fetchMock).toHaveBeenCalledTimes(asked);
      // Three and a half seconds after the failure, the first probe is due in sixteen and a half.
      expect(again).toMatchObject({ failed: ['viewpoint', 'drinking_water'], partial: false, retryAfterS: 17 });
      expect(again.pois.map((poi) => poi.name)).toEqual(['Kaffeehaus']);
      expect(hike.failed).toEqual(['viewpoint', 'shelter']);
      // The search that waited out its deadline says why; the skips after it are one line for the
      // whole cooldown, three minutes from that failure.
      expect(mapsWarnings()).toEqual([
        expect.stringContaining('[Maps] OpenStreetMap along a line: viewpoint, drinking_water: 1 of 1 requests failed'),
        expect.stringContaining('so only a probe now and then asks it until 2026-10-19T10:03:21.500Z'),
      ]);

      // After the cooldown it is asked again for real, and an answer ends the pause for good.
      vi.advanceTimersByTime(OVERPASS_ALONG_COOLDOWN_MS);
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ elements: [] }) });
      const later = await svc.poisAlong(['viewpoint'], LINE, 500, 'de', 30);
      expect(later.failed).toEqual([]);
      expect(later).not.toHaveProperty('retryAfterS');
      expect(fetchMock.mock.calls.length).toBeGreaterThan(asked);
      const answered = fetchMock.mock.calls.length;
      await svc.poisAlong(['shelter'], LINE, 500, 'de', 30);
      expect(fetchMock.mock.calls.length).toBeGreaterThan(answered);
      expect(mapsWarnings()).toHaveLength(2);
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    }
  });

  it('MAPS-ALONG-019b: one stretch failing keeps the places of the others and marks the answer partial', async () => {
    const { svc, overpass } = make();
    overpass.mockRejectedValueOnce(new Error('rate limited'));

    const out = await svc.poisAlong(['drinking_water'], north(1), 500, 'de', 30);

    expect(out).toMatchObject({ pois: [SPRING], failed: [], partial: true, capped: false });
    expect(mapsWarnings()).toEqual([
      expect.stringContaining(
        '[Maps] OpenStreetMap along a line: drinking_water: 1 of 3 requests failed: rate limited',
      ),
    ]);
  });

  it('MAPS-ALONG-019d: a stretch failing after the others answered starts no cooldown, so the rest of a long line is asked', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // The first of five stretches fails on every mirror, after the two asked beside it answered.
    const fetchMock = vi.fn(async (_url: unknown, init?: RequestInit) => {
      const first = decodeURIComponent(String(init?.body)).includes('47.00000,11.00000');
      await new Promise((resolve) => setTimeout(resolve, first ? 30 : 5));
      return first ? DOWN : { ok: true, json: async () => ({ elements: [] }) };
    });
    vi.stubGlobal('fetch', fetchMock);
    const { svc, overpass, osm } = make();
    overpass.mockRestore();
    try {
      const out = await svc.poisAlong(['viewpoint'], north(2), 500, 'de', 30);

      expect(out).toMatchObject({ failed: [], partial: true });
      // Stretches 4 and 5 are asked as well: Overpass answered while the first one was failing.
      expect(queriesSent(fetchMock)).toBe(5);
      expect(osm.skipsOverpassAlong()).toBe(false);
      expect(mapsWarnings()).toEqual([
        expect.stringContaining('OpenStreetMap along a line: viewpoint: 1 of 5 requests failed: Could not reach any'),
      ]);
    } finally {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    }
  });

  it('MAPS-ALONG-019e: a line answered before the cooldown keeps its Overpass places during it, from the cache', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-19T11:00:00Z'), toFake: ['Date'] });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const view = { type: 'node', id: 77, lat: 47.01, lon: 12, tags: { tourism: 'viewpoint', name: 'Aussicht' } };
    const fetchMock = vi
      .fn<(url: unknown, init?: RequestInit) => Promise<unknown>>()
      .mockResolvedValue({ ok: true, json: async () => ({ elements: [view] }) });
    vi.stubGlobal('fetch', fetchMock);
    const { svc, overpass } = make();
    overpass.mockRestore();
    const at = (lng: number) => [
      { lat: 47, lng },
      { lat: 47.0269, lng },
    ];
    try {
      const first = await svc.poisAlong(['viewpoint'], at(12), 500, 'de', 30);
      expect(first.pois.map((poi) => poi.name)).toEqual(['Aussicht']);

      // A second later every mirror fails another line, and the cooldown starts.
      vi.setSystemTime(new Date('2026-10-19T11:00:01Z'));
      fetchMock.mockResolvedValue(DOWN);
      expect((await svc.poisAlong(['viewpoint'], at(12.5), 500, 'de', 30)).failed).toEqual(['viewpoint']);
      const asked = fetchMock.mock.calls.length;

      // Ten seconds on, before the first probe, the first line is answered from the cache as before; a
      // line not asked yet is named at once.
      vi.setSystemTime(new Date('2026-10-19T11:00:11Z'));
      const again = await svc.poisAlong(['viewpoint'], at(12), 500, 'de', 30);
      expect(again).toMatchObject({ failed: [], partial: false });
      expect(again.pois.map((poi) => poi.name)).toEqual(['Aussicht']);
      expect((await svc.poisAlong(['viewpoint'], at(13), 500, 'de', 30)).failed).toEqual(['viewpoint']);
      expect(fetchMock).toHaveBeenCalledTimes(asked);
      expect(mapsWarnings()).toEqual([
        expect.stringContaining('OpenStreetMap along a line: viewpoint: 1 of 1 requests failed: Could not reach any'),
        expect.stringContaining('so only a probe now and then asks it until 2026-10-19T11:03:01.000Z'),
      ]);
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    }
  });

  it('MAPS-ALONG-019f: the stretches a cooldown leaves out are counted, and the log names why the first ones failed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchMock = vi.fn(async (_url: unknown, _init?: RequestInit) => DOWN);
    vi.stubGlobal('fetch', fetchMock);
    const { svc, overpass } = make();
    overpass.mockRestore();
    try {
      const out = await svc.poisAlong(['shelter'], north(2), 500, 'de', 30);

      expect(out).toMatchObject({ pois: [], failed: ['shelter'], partial: false });
      // Stretches 4 and 5 are not sent: every mirror had just failed the first three.
      expect(queriesSent(fetchMock)).toBe(3);
      expect(mapsWarnings()).toEqual([
        expect.stringContaining('every Overpass endpoint failed, so only a probe now and then asks it until'),
        expect.stringContaining('OpenStreetMap along a line: shelter: 5 of 5 requests failed: Could not reach any'),
      ]);
    } finally {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    }
  });
});

describe('MapsService.highlightsAlong', () => {
  /** A well known place of the index's OpenStreetMap layer. */
  const famous = (osmType: string, osmId: number, qrank: number) => ({
    osmType,
    osmId,
    name: `${osmType} ${osmId}`,
    lat: 47.01,
    lng: 11,
    category: 'sehenswuerdigkeit',
    osmTag: 'place=square',
    wikidata: 'Q1',
    qrank,
    distanceMetres: 10,
  });

  it('MAPS-ALONG-030: asks the best known places in the circles the kinds are asked in, each place once', async () => {
    const { svc } = make();
    mockHighlights
      .mockResolvedValueOnce({ highlights: [famous('way', 1, 900), famous('node', 1, 50)], qrankRelease: null })
      .mockResolvedValueOnce({ highlights: [famous('way', 1, 900), famous('relation', 2, 70)], qrankRelease: null });

    const out = await svc.highlightsAlong(LINE, 500, 'de');

    expect(mockHighlights).toHaveBeenCalledTimes(4);
    for (const [, , opts] of mockHighlights.mock.calls) expect(opts).toEqual({ radius: 1000, limit: 20, lang: 'de' });
    expect(out.map((row) => `${row.osmType}:${row.osmId}`)).toEqual(['way:1', 'node:1', 'relation:2']);
    expect(mockNearby).not.toHaveBeenCalled();
  });

  it('MAPS-ALONG-031: a circle failing keeps the others, an index down or switched off answers none, never an error', async () => {
    const { svc } = make();
    mockHighlights
      .mockRejectedValueOnce(new Error('TREK Places API 503'))
      .mockResolvedValue({ highlights: [famous('way', 1, 900)], qrankRelease: null });
    expect((await svc.highlightsAlong(LINE, 500)).map((row) => row.osmId)).toEqual([1]);
    expect(mapsWarnings()).toEqual(['[Maps] TREK places highlights along a line: TREK Places API 503']);

    mockHighlights.mockReset();
    mockHighlights.mockRejectedValue(new Error('timeout'));
    await expect(svc.highlightsAlong(LINE, 500)).resolves.toEqual([]);

    mockHighlights.mockClear();
    const off = make(false);
    await expect(off.svc.highlightsAlong(LINE, 500)).resolves.toEqual([]);
    expect(mockHighlights).not.toHaveBeenCalled();
  });
});
