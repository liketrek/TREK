/**
 * MAPS-POIS-001..012 — the explore pill, answered from the index.
 *
 * The pill used to be Overpass and nothing else, and the public mirrors it asks
 * are regularly overloaded. The index answers first now, so the two things that
 * matter here are that a hit is mapped onto the exact record the map renderer
 * already reads, and that everything which is not a hit still lands on Overpass
 * unchanged.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockNearby } = vi.hoisted(() => ({
  mockNearby: vi.fn(
    async (
      _lat: number,
      _lng: number,
      _opts?: { radius?: number; limit?: number; category?: string },
    ): Promise<unknown[]> => [],
  ),
}));
vi.mock('../../../src/nest/maps/trek-places.client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/nest/maps/trek-places.client')>()),
  trekPlacesNearby: mockNearby,
}));

vi.mock('../../../src/config', () => ({ JWT_SECRET: 'test-secret', ENCRYPTION_KEY: '0'.repeat(64) }));

import { MapsService } from '../../../src/nest/maps/maps.service';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';

// 0.1 degrees a side, centred on the equator: cos(lat) is 1 there, so the radius
// the service derives is exactly half the box's diagonal and the numbers below
// are readable rather than incidental.
const BOX = { south: -0.05, west: -0.05, north: 0.05, east: 0.05 };

// A row carrying everything the index can hold.
const FULL = {
  gers: 'a-1',
  name: 'Cafe Central',
  lat: 48.2101,
  lng: 16.3657,
  category: 'coffee_shop',
  categoryPath: 'eat_and_drink>cafe>coffee_shop',
  confidence: 0.94,
  address: { freeform: 'Herrengasse 14', locality: 'Wien', postcode: '1010', region: null, country: 'AT' },
  contact: { website: 'https://cafecentral.wien/', phone: '+43 1 5333763', email: null, socials: null },
  brand: null,
  source: 'overture',
  hours: { osm: 'Mo-Sa 07:30-22:00', source: 'schema.org', sourceUrl: 'https://cafecentral.wien/' },
  distanceMetres: 120,
};

// A row carrying none of it — the index holds plenty of these.
const BARE = {
  gers: 'b-2',
  name: 'Kiosk am Ring',
  lat: 48.2,
  lng: 16.37,
  category: null,
  categoryPath: null,
  confidence: null,
  address: null,
  contact: null,
  brand: null,
  source: 'overture',
  hours: null,
  distanceMetres: 480,
};

// What the Overpass half answers when the index does not. Distinct enough that
// "dropped through" is visible in the returned value, not only in the spy.
const OVERPASS_ANSWER = {
  pois: [
    {
      osm_id: 'node:1',
      name: 'From Overpass',
      lat: 1,
      lng: 2,
      category: 'cafe',
      poi_type: 'amenity=cafe',
      address: null,
      website: null,
      phone: null,
      opening_hours: null,
      brand: null,
      brand_wikidata: null,
      charging: null,
      cuisine: null,
      source: 'openstreetmap' as const,
    },
  ],
  source: 'openstreetmap' as const,
  truncated: false,
  clamped: false,
};

const ORIGINAL_TREK_PLACES = process.env.TREK_PLACES_ENABLED;

afterEach(() => {
  if (ORIGINAL_TREK_PLACES === undefined) delete process.env.TREK_PLACES_ENABLED;
  else process.env.TREK_PLACES_ENABLED = ORIGINAL_TREK_PLACES;
});

// The index is an operator switch, not an admin row, so switching it off means
// moving the env rather than stubbing a settings lookup. The service reads the
// flag per call, which is why the restore above belongs in afterEach.
function make(enabled = true) {
  if (enabled) delete process.env.TREK_PLACES_ENABLED;
  else process.env.TREK_PLACES_ENABLED = 'false';
  const database = { get: vi.fn(() => undefined) } as unknown as DatabaseService;
  return new MapsService(database, {} as PlacePhotoCacheService);
}

// Overpass is the one network call this file must never make; stubbing it is
// also what turns "dropped through" into something a case can assert.
function stubOverpass(svc: MapsService) {
  return vi.spyOn(svc, 'searchOverpassPois').mockResolvedValue(OVERPASS_ANSWER);
}

function rows(n: number) {
  return Array.from({ length: n }, (_, i) => ({ ...BARE, gers: `c-${i}`, name: `Kiosk ${i}` }));
}

// Module-level rather than per-case: MAPS-POIS-012 asserts what gets logged.
const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

beforeEach(() => {
  mockNearby.mockReset();
  mockNearby.mockResolvedValue([]);
  warn.mockClear();
});

describe('MapsService.pois answered from the index', () => {
  it('MAPS-POIS-001: maps a full index row onto the record the map already reads', async () => {
    mockNearby.mockResolvedValue([FULL]);
    const svc = make();
    const overpass = stubOverpass(svc);

    const out = await svc.pois('cafe', BOX);

    expect(overpass).not.toHaveBeenCalled();
    expect(out.pois).toEqual([
      {
        osm_id: 'gers:a-1',
        name: 'Cafe Central',
        lat: 48.2101,
        lng: 16.3657,
        // The pill the caller asked for, not the row's own category: the client
        // switches on this field to colour and group the markers.
        category: 'cafe',
        poi_type: 'coffee_shop',
        address: 'Herrengasse 14',
        website: 'https://cafecentral.wien/',
        phone: '+43 1 5333763',
        opening_hours: 'Mo-Sa 07:30-22:00',
        brand: null,
        brand_wikidata: null,
        charging: null,
        cuisine: null,
        // Named as what it is. Overture is not OpenStreetMap — it carries OSM
        // among other sources under other licences — and this branch argues
        // elsewhere that naming a source is a licence obligation rather than a
        // courtesy. Nothing on the client switches on the field, and the wire
        // contract keeps it an open string, so saying so costs nothing.
        source: 'trek-places',
      },
    ]);
    expect(out.source).toBe('trek-places');
  });

  it('MAPS-POIS-002: a row without address, contact or hours becomes nulls, typed as the pill', async () => {
    mockNearby.mockResolvedValue([BARE]);
    const svc = make();
    stubOverpass(svc);

    const out = await svc.pois('cafe', BOX);

    expect(out.pois[0]).toEqual({
      osm_id: 'gers:b-2',
      name: 'Kiosk am Ring',
      lat: 48.2,
      lng: 16.37,
      category: 'cafe',
      poi_type: 'cafe',
      address: null,
      website: null,
      phone: null,
      opening_hours: null,
      brand: null,
      brand_wikidata: null,
      // Sockets are an OSM thing; a station answered from the index reports
      // "not stated" rather than claiming it offers nothing.
      charging: null,
      cuisine: null,
      source: 'trek-places',
    });
  });

  it('MAPS-POIS-003: an address and contact object of nulls still produces null, never undefined', async () => {
    // JSON.stringify drops an undefined value, so the client would see the key
    // missing rather than empty — different from every other row it gets.
    mockNearby.mockResolvedValue([
      {
        ...FULL,
        address: { freeform: null, locality: 'Wien', postcode: null, region: null, country: 'AT' },
        contact: { website: null, phone: null, email: null, socials: null },
      },
    ]);
    const svc = make();
    const overpass = stubOverpass(svc);

    const out = await svc.pois('cafe', BOX);

    // The whole record rather than the three nulls: the Overpass answer carries
    // those same three, so a subset would still pass with the row dropped.
    expect(overpass).not.toHaveBeenCalled();
    expect(out.pois[0]).toEqual({
      osm_id: 'gers:a-1',
      name: 'Cafe Central',
      lat: 48.2101,
      lng: 16.3657,
      category: 'cafe',
      poi_type: 'coffee_shop',
      address: null,
      website: null,
      phone: null,
      opening_hours: 'Mo-Sa 07:30-22:00',
      brand: null,
      brand_wikidata: null,
      // Sockets are an OSM thing; a station answered from the index reports
      // "not stated" rather than claiming it offers nothing.
      charging: null,
      cuisine: null,
      source: 'trek-places',
    });
  });

  it('MAPS-POIS-004: asks the index for the categories behind the pill, around the viewport centre', async () => {
    mockNearby.mockResolvedValue([FULL]);
    const svc = make();
    const overpass = stubOverpass(svc);

    const out = await svc.pois('cafe', BOX);

    expect(overpass).not.toHaveBeenCalled();
    // 7872 m is half the diagonal of a 0.1 x 0.1 degree box on the equator, so
    // a place in a corner of the viewport is still inside the circle.
    expect(mockNearby).toHaveBeenCalledWith(0, 0, {
      radius: 7872,
      // The caller's budget, per category, the way the Overpass path spends it.
      limit: 60,
      category: 'cafe,coffee_shop',
    });
    expect(out.clamped).toBe(false);
  });

  it('MAPS-POIS-013: a corridor search asks the index once for all its categories', async () => {
    // The corridor sends a comma-separated list. Looking the whole string up as
    // one key missed every time, so every corridor query fell through to
    // Overpass — on the one path where that hurts most, because a single search
    // fans out over sixteen boxes and each races four public mirrors.
    mockNearby.mockResolvedValue([
      { ...FULL, gers: 'f-1', name: 'Aral', category: 'gas_station' },
      { ...FULL, gers: 'c-1', name: 'Ionity', category: 'ev_charging_station' },
    ]);
    const svc = make();
    const overpass = stubOverpass(svc);

    const out = await svc.pois('fuel,charging', BOX);

    expect(overpass).not.toHaveBeenCalled();
    // One request carrying every term the two categories map to.
    expect(mockNearby).toHaveBeenCalledWith(0, 0, expect.objectContaining({
      category: 'gas_station,fueling_station,ev_charging_station',
      // Per category, so a mixed search does not spend the whole allowance on
      // whichever kind happens to be densest.
      limit: 120,
    }));
    // Each hit carries the category that produced it, not the list that was
    // asked for: the client colours and groups its markers by that field, and
    // "fuel,charging" is not a category.
    expect(out.pois.map(p => p.category)).toEqual(['fuel', 'charging']);
  });

  it('MAPS-POIS-014: a category the index has no terms for sends the whole query to Overpass', async () => {
    // All or nothing. Answering the half it knows would silently drop the rest,
    // and the caller counts a finished search either way.
    const svc = make();
    const overpass = stubOverpass(svc);

    await svc.pois('fuel,something-new', BOX, 'de');

    expect(mockNearby).not.toHaveBeenCalled();
    expect(overpass).toHaveBeenCalledWith('fuel,something-new', BOX, 'de', 60);
  });

  it('MAPS-POIS-005: a full page is reported as truncated', async () => {
    mockNearby.mockResolvedValue(rows(60));
    const svc = make();
    stubOverpass(svc);

    const out = await svc.pois('cafe', BOX);

    expect(out.pois).toHaveLength(60);
    // The page asked for is the page compared against — a caller told nothing
    // was cut off will not offer to zoom in for the rest.
    expect(out.truncated).toBe(true);
  });

  it('MAPS-POIS-006: a page short of the limit is the whole answer', async () => {
    mockNearby.mockResolvedValue(rows(59));
    const svc = make();
    const overpass = stubOverpass(svc);

    const out = await svc.pois('cafe', BOX);

    // The Overpass answer is untruncated as well, so the count and the untouched
    // spy are what tell an index answer from a fallback.
    expect(overpass).not.toHaveBeenCalled();
    expect(out.pois).toHaveLength(59);
    expect(out.truncated).toBe(false);
  });

  it('MAPS-POIS-007: a viewport wider than the 20 km cap is narrowed, and says so', async () => {
    mockNearby.mockResolvedValue([FULL]);
    const svc = make();
    stubOverpass(svc);

    const out = await svc.pois('cafe', { south: -5, west: -5, north: 5, east: 5 });

    expect(mockNearby).toHaveBeenCalledWith(0, 0, expect.objectContaining({ radius: 20000 }));
    // Half that diagonal is ~787 km: the answer covers the middle of the view
    // only, and a caller told otherwise renders the empty rim as "no places".
    expect(out.clamped).toBe(true);
  });

  it('MAPS-POIS-008: a viewport under the 300 m floor is widened, which is not clamping', async () => {
    mockNearby.mockResolvedValue([FULL]);
    const svc = make();
    const overpass = stubOverpass(svc);

    const out = await svc.pois('cafe', { south: -0.0005, west: -0.0005, north: 0.0005, east: 0.0005 });

    expect(overpass).not.toHaveBeenCalled();
    expect(mockNearby).toHaveBeenCalledWith(0, 0, expect.objectContaining({ radius: 300 }));
    // Widened, so nothing in view is missing — the opposite of clamped.
    expect(out.clamped).toBe(false);
  });
});

describe('MapsService.pois falls back to Overpass', () => {
  it('MAPS-POIS-009: a pill the index has no categories for never reaches the index', async () => {
    const svc = make();

    // Deliberately unstubbed: an unknown pill has to keep failing in the
    // Overpass path exactly as it did before the index was put in front of it.
    await expect(svc.pois('pharmacy', BOX)).rejects.toMatchObject({
      message: 'Unknown POI category',
      status: 400,
    });
    expect(mockNearby).not.toHaveBeenCalled();
  });

  it('MAPS-POIS-010: the operator switching the index off skips it entirely', async () => {
    const svc = make(false);
    const overpass = stubOverpass(svc);

    expect(await svc.pois('cafe', BOX, 'de')).toEqual(OVERPASS_ANSWER);
    expect(mockNearby).not.toHaveBeenCalled();
    expect(overpass).toHaveBeenCalledWith('cafe', BOX, 'de', 60);
  });

  it('MAPS-POIS-011: an empty index page is a miss, not an empty answer', async () => {
    mockNearby.mockResolvedValue([]);
    const svc = make();
    const overpass = stubOverpass(svc);

    expect(await svc.pois('cafe', BOX, 'de')).toEqual(OVERPASS_ANSWER);
    expect(overpass).toHaveBeenCalledWith('cafe', BOX, 'de', 60);
  });

  it('MAPS-POIS-012: an index failure is logged and dropped through, never surfaced', async () => {
    mockNearby.mockRejectedValue(new Error('places api down'));
    const svc = make();
    const overpass = stubOverpass(svc);

    expect(await svc.pois('cafe', BOX, 'de')).toEqual(OVERPASS_ANSWER);
    expect(overpass).toHaveBeenCalledWith('cafe', BOX, 'de', 60);
    expect(warn).toHaveBeenCalledWith('TREK Places nearby failed, falling back:', 'places api down');
  });
});
