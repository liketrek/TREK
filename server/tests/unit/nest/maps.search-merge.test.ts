/**
 * MAPS-SEARCH-001..008 — the two sources answering one explicit search.
 *
 * mergeSearchResults is tested on its own next door; this is the wiring around
 * it, which had no test at all. What the wiring decides is not cosmetic: which
 * list goes in first (the whole point of the feature is that the landmark lands
 * at position two rather than eleven), and what `source` says — the client
 * switches on it and the search log writes it into the corpus a future index
 * gets scored against.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSearch, mockNominatim } = vi.hoisted(() => ({
  mockSearch: vi.fn(async (_query: string, _opts?: Record<string, unknown>): Promise<unknown> => []),
  mockNominatim: vi.fn(
    async (_endpoint: string, _params: URLSearchParams, _opts?: { lane?: string }): Promise<unknown> => ({
      ok: true,
      json: async () => [],
    }),
  ),
}));
vi.mock('../../../src/nest/maps/trek-places.client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/nest/maps/trek-places.client')>()),
  trekPlacesSearch: mockSearch,
}));
vi.mock('../../../src/nest/geo/nominatim.client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/nest/geo/nominatim.client')>()),
  nominatimFetch: mockNominatim,
}));

vi.mock('../../../src/config', () => ({ JWT_SECRET: 'test-secret', ENCRYPTION_KEY: '0'.repeat(64) }));

import { MapsService } from '../../../src/nest/maps/maps.service';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';

/** An index row, far enough from the OSM one below not to be deduped. */
const indexHit = (name: string, lat = 35.31, lng = 139.53) => ({
  gers: name.toLowerCase().replace(/\W/g, ''),
  name,
  lat,
  lng,
  address: { freeform: null, locality: 'Kamakura', postcode: null, region: null, country: 'JP' },
  contact: { website: null, phone: null, email: null, socials: null },
  source: 'overture',
  hours: null,
});

const osmRow = (name: string, lat = 35.32, lng = 139.55) => ({
  osm_type: 'way',
  osm_id: 1234 + Math.round(lat * 1000),
  lat: String(lat),
  lon: String(lng),
  name,
  display_name: `${name}, Kamakura, Japan`,
});

const osmAnswer = (rows: unknown[]) => ({ ok: true, json: async () => rows });

/**
 * Keyed on the statement so the kill switch can be driven without also handing
 * `'false'` to the API-key resolver, which would send the fallback at Google.
 */
function make(enabled = true) {
  const database = {
    get: vi.fn((sql: string) =>
      sql.includes('trek_places_enabled') && !enabled ? { value: 'false' } : undefined,
    ),
  } as unknown as DatabaseService;
  return new MapsService(database, {} as PlacePhotoCacheService);
}

beforeEach(() => {
  mockSearch.mockReset();
  mockSearch.mockResolvedValue([]);
  mockNominatim.mockReset();
  mockNominatim.mockResolvedValue(osmAnswer([]));
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('MapsService.searchPlaces — the merged path', () => {
  it('MAPS-SEARCH-001: both sources answer, index first, and says so', async () => {
    mockSearch.mockResolvedValue([indexHit('Shop by the gate')]);
    mockNominatim.mockResolvedValue(osmAnswer([osmRow('長谷寺')]));

    const out = await make().searchPlaces(1, 'Hase-dera');

    expect(out.source).toBe('trek-places+openstreetmap');
    expect(out.places).toHaveLength(2);
    // The whole point of the feature: the landmark OpenStreetMap knows lands at
    // position two, not at position eleven behind ten shops.
    expect(out.places[0].name).toBe('Shop by the gate');
    expect(out.places[1].name).toBe('長谷寺');
  });

  it('MAPS-SEARCH-002: an index answer with nothing from OSM is named as index only', async () => {
    mockSearch.mockResolvedValue([indexHit("L'Osteria")]);
    mockNominatim.mockResolvedValue(osmAnswer([]));

    const out = await make().searchPlaces(1, "L'Osteria");

    // `source` is not decoration: the search log writes it into the corpus a
    // candidate index is scored against later, so a wrong label poisons the
    // measurement rather than just the display.
    expect(out.source).toBe('trek-places');
    expect(out.places).toHaveLength(1);
  });

  it('MAPS-SEARCH-003: OpenStreetMap failing costs its half, not the search', async () => {
    mockSearch.mockResolvedValue([indexHit("L'Osteria")]);
    mockNominatim.mockRejectedValue(new Error('nominatim down'));

    const out = await make().searchPlaces(1, "L'Osteria");

    expect(out.source).toBe('trek-places');
    expect(out.places).toHaveLength(1);
    expect(console.warn).toHaveBeenCalledWith('OpenStreetMap search failed, index only:', 'nominatim down');
  });

  it('MAPS-SEARCH-004: the index failing keeps the answer OpenStreetMap already gave', async () => {
    // The index turning a query down is ordinary traffic, not an outage: a
    // common single word without coordinates is refused upstream as too
    // expensive. Discarding the OSM results here and asking Nominatim again
    // cost a second throttled round trip for a list that was already in hand.
    mockSearch.mockRejectedValue(new Error('places api down'));
    mockNominatim.mockResolvedValue(osmAnswer([osmRow('Museum')]));

    const out = await make().searchPlaces(1, 'museum');

    expect(out.places).toHaveLength(1);
    expect(out.places[0].name).toBe('Museum');
    expect(console.warn).toHaveBeenCalledWith('TREK Places search failed, falling back:', 'places api down');
    // One question, asked once.
    expect(mockNominatim).toHaveBeenCalledTimes(1);
  });

  it('MAPS-SEARCH-005: both empty asks nobody a second time', async () => {
    mockSearch.mockResolvedValue([]);
    mockNominatim.mockResolvedValue(osmAnswer([]));

    const out = await make().searchPlaces(1, 'qwertzuiop');

    expect(out.places).toEqual([]);
    expect(out.source).toBe('openstreetmap');
    // The first call carried a viewbox with bounded=0, which orders results
    // without changing which exist — so a second call can only return the same
    // empty list a throttle interval later.
    expect(mockNominatim).toHaveBeenCalledTimes(1);
  });

  it('MAPS-SEARCH-006: ten results at most, alternating so neither source is buried', async () => {
    mockSearch.mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => indexHit(`Index ${i}`, 35.31 + i / 100)),
    );
    mockNominatim.mockResolvedValue(
      osmAnswer(Array.from({ length: 12 }, (_, i) => osmRow(`Osm ${i}`, 36.5 + i / 100))),
    );

    const out = await make().searchPlaces(1, 'anything');

    expect(out.places).toHaveLength(10);
    expect(out.places[0].name).toBe('Index 0');
    expect(out.places[1].name).toBe('Osm 0');
    expect(out.places[2].name).toBe('Index 1');
  });

  it('MAPS-SEARCH-007: with the index switched off the query never leaves for it', async () => {
    mockSearch.mockResolvedValue([indexHit("L'Osteria")]);
    mockNominatim.mockResolvedValue(osmAnswer([osmRow('Steinstrasse')]));

    const out = await make(false).searchPlaces(1, "L'Osteria");

    expect(mockSearch).not.toHaveBeenCalled();
    expect(out.source).toBe('openstreetmap');
  });

  it('MAPS-SEARCH-008: the location bias reaches both sources', async () => {
    mockSearch.mockResolvedValue([indexHit("L'Osteria")]);

    await make().searchPlaces(1, "L'Osteria", 'de', { lat: 54.0879, lng: 12.1408, radius: 5000 });

    expect(mockSearch).toHaveBeenCalledWith("L'Osteria", { lat: 54.0879, lng: 12.1408, limit: 10 });
    // Without the viewbox, "Hase-dera" answers with the temple in Nara rather
    // than the one the user is standing beside in Kamakura.
    const params = mockNominatim.mock.calls[0][1] as URLSearchParams;
    expect(params.get('viewbox')).toBeTruthy();
    expect(params.get('bounded')).toBe('0');
  });
});
