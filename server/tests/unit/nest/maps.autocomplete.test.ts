/**
 * MAPS-AUTO-001..016: the suggestion list behind the place search box.
 *
 * This is the path the index was built for. Nominatim's usage policy names
 * autocomplete as unacceptable use in its own words, whatever the rate, and the
 * whole TREK fleet shares one User-Agent there — so before the index, every
 * install was one abusive neighbour away from being blocked. What matters here
 * is that an index answer is shaped the way the details lookup can read back
 * (`gers:` ids), and that nothing about a slow or missing index leaves somebody
 * typing into a box that never answers.
 */
import type { AppSettingsRepository } from '../../../src/db/repositories/AppSettings.repository';
import type { UsersRepository } from '../../../src/db/repositories/Users.repository';
import type { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';
import { noGoogleQuota } from '../../helpers/google-quota';
import { buildMapsService } from '../../helpers/maps-service';

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSearch } = vi.hoisted(() => ({
  mockSearch: vi.fn(
    async (_query: string, _opts?: { lat?: number; lng?: number; limit?: number }): Promise<unknown> => [],
  ),
}));
vi.mock('../../../src/nest/maps/trek-places.client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/nest/maps/trek-places.client')>()),
  trekPlacesSearch: mockSearch,
}));

// keyedProvider/resolveMapsKey (maps.service.ts) go through instance-api-keys.ts
// on every call now. No per-user key is configured anywhere here; the instance
// rows a case needs come from make()'s `rows`, read through AppSettingsRepository.
const noUsers = { getApiKeyColumn: async () => null } as unknown as UsersRepository;

// The index switch is an environment variable now, not an admin row: it decides
// whether a search leaves the instance at all, so it is pinned by the operator
// rather than flippable from a browser. `setTrekPlaces()` below drives it.
const trekPlaces = vi.hoisted(() => ({ on: true }));
vi.mock('../../../src/app-config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/app-config')>();
  return {
    ...actual,
    readEnv: () => {
      const env = actual.readEnv();
      return { ...env, maps: { ...env.maps, trekPlacesEnabled: trekPlaces.on } };
    },
  };
});

const INPUT = 'Café Kröpel';

const hit = (over: Record<string, unknown> = {}) => ({
  gers: 'abc-123',
  name: 'Café Kröpeliner',
  lat: 54.0879,
  lng: 12.1408,
  address: { locality: 'Rostock', country: 'DE' },
  ...over,
});

/**
 * A row from the service's OpenStreetMap layer. A different shape from the
 * index rows above, which is the whole point of the two tests below: no `gers`,
 * no address block, and an id in the service's own `osm:<type>/<id>` form.
 */
const osmHit = (over: Record<string, unknown> = {}) => ({
  id: 'osm:node/9712313',
  osm_type: 'node',
  osm_id: 9712313,
  name: 'Tokio Hauptbahnhof',
  local_name: '東京駅丸の内駅舎',
  lat: 35.6811816,
  lng: 139.76598265,
  category: 'sehenswuerdigkeit',
  source: 'openstreetmap',
  ...over,
});

/**
 * `enabled` drives the index switch, an environment variable; `rows` are the
 * app_settings the instance holds, by key: a Google key, the provider choice,
 * the Google-only switch. Anything else reads as absent.
 *
 * Keyed on the setting rather than answering everything the same way: the
 * same `getValue` also resolves the Google key (`maps_api_key`), and a blanket
 * answer would hand `'false'` to the key resolver and send the fallback at
 * Google for real.
 */
function make(enabled = true, rows: Record<string, string> = {}) {
  trekPlaces.on = enabled;
  const appSettings = {
    getValue: async (key: string) => (rows[key] !== undefined ? rows[key] : null),
  } as unknown as AppSettingsRepository;
  return buildMapsService({} as PlacePhotoCacheService, appSettings, noUsers, {} as never, {} as never, noGoogleQuota);
}

/** Google's autocomplete envelope, which is not the shape its text search answers in. */
const googleSuggestions = (name: string) => ({
  ok: true,
  json: async () => ({
    suggestions: [
      {
        placePrediction: {
          placeId: 'g1',
          structuredFormat: { mainText: { text: name }, secondaryText: { text: 'Chiyoda' } },
        },
      },
    ],
  }),
});

beforeEach(() => {
  mockSearch.mockReset();
  mockSearch.mockResolvedValue([]);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('MapsService.autocompletePlaces', () => {
  it('MAPS-AUTO-001: index hits answer the box, tagged so the details lookup can read them back', async () => {
    mockSearch.mockResolvedValue([hit(), hit({ gers: 'def-456', name: 'Café Central' })]);

    const result = await make().autocompletePlaces(1, INPUT);

    expect(result.source).toBe('trek-places');
    expect(result.suggestions).toHaveLength(2);
    // The `gers:` prefix is the contract with getPlaceDetails, which branches on
    // it. A suggestion without it lands in the generic colon branch and asks
    // Overpass for an OSM element that does not exist, so the place comes back
    // empty after the user has already picked it.
    expect(result.suggestions[0].placeId).toBe('gers:abc-123');
    expect(result.suggestions[1].placeId).toBe('gers:def-456');
    expect(result.suggestions[0].mainText).toBe('Café Kröpeliner');
    // The country by name, not its ISO code (#2592).
    expect(result.suggestions[0].secondaryText).toBe('Rostock, Germany');
  });

  it('MAPS-AUTO-002: a place with no locality gets an empty line, not the word "undefined"', async () => {
    mockSearch.mockResolvedValue([hit({ address: null }), hit({ gers: 'x', address: { locality: 'Rostock' } })]);

    const { suggestions } = await make().autocompletePlaces(1, INPUT);

    expect(suggestions[0].secondaryText).toBe('');
    // One half present is still one half: no stray comma either.
    expect(suggestions[1].secondaryText).toBe('Rostock');
  });

  it('MAPS-AUTO-003: a location bias is sent as the centre of the box the client drew', async () => {
    mockSearch.mockResolvedValue([hit()]);

    await make().autocompletePlaces(1, INPUT, undefined, {
      low: { lat: 54, lng: 12 },
      high: { lat: 54.2, lng: 12.4 },
    });

    // Eight, not ten: the suggestion list is what a person reads while typing.
    expect(mockSearch).toHaveBeenCalledWith(INPUT, { lat: 54.1, lng: 12.2, limit: 8, sources: 'index,osm' });
  });

  it('MAPS-AUTO-004: without a bias the index is asked without coordinates rather than with zeroes', async () => {
    mockSearch.mockResolvedValue([hit()]);

    await make().autocompletePlaces(1, INPUT);

    // A 0/0 bias is a point in the Atlantic, and the index treats a bias as
    // permission to relax the match — which is how the shops around a landmark
    // start outranking the landmark.
    expect(mockSearch).toHaveBeenCalledWith(INPUT, { lat: undefined, lng: undefined, limit: 8, sources: 'index,osm' });
  });

  it('MAPS-AUTO-005: an index that found nothing falls through instead of answering empty', async () => {
    mockSearch.mockResolvedValue([]);

    const result = await make().autocompletePlaces(1, INPUT);

    expect(mockSearch).toHaveBeenCalledTimes(1);
    // Whatever the fallback answers, it must not claim to be the index.
    expect(result.source).not.toBe('trek-places');
  });

  it('MAPS-AUTO-006: an index failure is a warning and a fallback, not a dead search box', async () => {
    mockSearch.mockRejectedValue(new Error('places api down'));

    const result = await make().autocompletePlaces(1, INPUT);

    expect(console.warn).toHaveBeenCalledWith('TREK Places autocomplete failed, falling back:', 'places api down');
    expect(result.source).not.toBe('trek-places');
  });

  it('MAPS-AUTO-008: a hit from the OpenStreetMap layer carries an id the details lookup can read', async () => {
    mockSearch.mockResolvedValue([osmHit()]);

    const { suggestions } = await make().autocompletePlaces(1, INPUT);

    // `osm:node/9712313` is the service's form; this file resolves `node:123`.
    // Passing the service's form through would hand the client an id nothing
    // downstream recognises, and it would fail after the user had picked it.
    expect(suggestions[0].placeId).toBe('node:9712313');
    expect(suggestions[0].mainText).toBe('Tokio Hauptbahnhof');
    // The layer has no address. The name written on the building is more use
    // under a translated label than an empty second line.
    expect(suggestions[0].secondaryText).toBe('東京駅丸の内駅舎');
  });

  it('MAPS-AUTO-009: index and layer hits keep their own id form in one list', async () => {
    mockSearch.mockResolvedValue([hit(), osmHit(), hit({ gers: 'def-456' })]);

    const { suggestions } = await make().autocompletePlaces(1, INPUT);

    expect(suggestions.map((s) => s.placeId)).toEqual(['gers:abc-123', 'node:9712313', 'gers:def-456']);
    // A local name equal to the label would be a repeated line, not a hint.
    const same = osmHit({ local_name: 'Tokio Hauptbahnhof' });
    mockSearch.mockResolvedValue([same]);
    const second = await make().autocompletePlaces(1, INPUT);
    expect(second.suggestions[0].secondaryText).toBe('');
  });

  it('MAPS-AUTO-010: each row says which index it came from, because the list is two', async () => {
    mockSearch.mockResolvedValue([hit(), osmHit()]);

    const { suggestions, source } = await make().autocompletePlaces(1, INPUT);

    // The name above the list describes the call, and the call asked both. Only
    // the row can say which of the two answered it — without that the reader is
    // told a place from OpenStreetMap came out of the TREK index, which is the
    // one thing the mark beside a suggestion exists to answer.
    expect(source).toBe('trek-places');
    expect(suggestions.map((s) => s.source)).toEqual(['trek-places', 'openstreetmap']);
  });

  it('MAPS-AUTO-011: a suggestion carries the coordinates the index already gave, so the pick needs no second hop', async () => {
    mockSearch.mockResolvedValue([hit(), osmHit()]);

    const { suggestions } = await make().autocompletePlaces(1, INPUT);

    // Without these the client, when the details lookup cannot answer, searches
    // for the label instead — and for a layer row that label is a name plus its
    // local spelling, which is not a query anybody typed.
    expect(suggestions[0]).toMatchObject({ lat: 54.0879, lng: 12.1408 });
    expect(suggestions[1]).toMatchObject({ lat: 35.6811816, lng: 139.76598265 });
  });

  it('MAPS-AUTO-007: the keystroke never leaves for the index while the admin has it off', async () => {
    mockSearch.mockResolvedValue([hit()]);

    const result = await make(false).autocompletePlaces(1, INPUT);

    expect(mockSearch).not.toHaveBeenCalled();
    expect(result.source).not.toBe('trek-places');
  });

  it('MAPS-AUTO-012: the Google-only switch sends the keystroke to Google and skips the index', async () => {
    // The admin row promises every search AND every suggestion. The search half
    // is pinned next door (MAPS-SEARCH-011); this is the other call site.
    mockSearch.mockResolvedValue([hit()]);
    const fetchMock = vi.fn().mockResolvedValue(googleSuggestions('Tokyo Station'));
    vi.stubGlobal('fetch', fetchMock);

    const result = await make(true, { maps_api_key: 'key', places_google_only: 'true' }).autocompletePlaces(1, INPUT);

    expect(mockSearch).not.toHaveBeenCalled();
    expect(result.source).toBe('google');
    expect(result.suggestions[0]).toMatchObject({ placeId: 'g1', mainText: 'Tokyo Station' });
    expect(String(fetchMock.mock.calls[0][0])).toContain('places:autocomplete');
    vi.unstubAllGlobals();
  });

  it('MAPS-AUTO-013: the switch changes nothing without a Google key, or when Google does not hold the slot', async () => {
    mockSearch.mockResolvedValue([hit()]);

    // No key at all: the index answers, as before.
    const keyless = await make(true, { places_google_only: 'true' }).autocompletePlaces(1, INPUT);
    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect(keyless.source).toBe('trek-places');

    // A key, but the admin picked OpenStreetMap: Google holds no slot, so
    // there is nothing for the switch to hand the keystroke to.
    mockSearch.mockClear();
    const osmOnly = await make(true, {
      maps_api_key: 'key',
      places_google_only: 'true',
      places_provider: 'openstreetmap',
    }).autocompletePlaces(1, INPUT);
    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect(osmOnly.source).toBe('trek-places');

    // A key and the switch off: the index still answers first.
    mockSearch.mockClear();
    const off = await make(true, { maps_api_key: 'key', places_google_only: 'false' }).autocompletePlaces(1, INPUT);
    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect(off.source).toBe('trek-places');
  });

  it('MAPS-AUTO-014: the country is named in the language the search was made in (#2592)', async () => {
    const hakata = hit({ name: 'Kirby Cafe Hakata', address: { locality: '福岡市博多区', country: 'JP' } });
    mockSearch.mockResolvedValue([hakata]);

    const named = async (lang?: string) =>
      (await make().autocompletePlaces(1, INPUT, lang)).suggestions[0].secondaryText;

    expect(await named('en')).toBe('福岡市博多区, Japan');
    expect(await named('de')).toBe('福岡市博多区, Japan');
    expect(await named('fr')).toBe('福岡市博多区, Japon');
    expect(await named('ja')).toBe('福岡市博多区, 日本');
    // TREK's own codes for Brazilian Portuguese and Greek are not BCP 47 tags.
    expect(await named('br')).toBe('福岡市博多区, Japão');
    expect(await named('gr')).toBe('福岡市博多区, Ιαπωνία');
    expect(await named(undefined)).toBe('福岡市博多区, Japan');
  });

  it('MAPS-AUTO-015: a country the runtime cannot name stays as the index sent it', async () => {
    mockSearch.mockResolvedValue([
      hit({ address: { locality: 'Rostock', country: 'JPN' } }),
      hit({ gers: 'x', address: { locality: 'Rostock', country: '' } }),
    ]);

    const { suggestions } = await make().autocompletePlaces(1, INPUT, 'not a locale!');

    expect(suggestions[0].secondaryText).toBe('Rostock, JPN');
    expect(suggestions[1].secondaryText).toBe('Rostock');
  });

  it('MAPS-AUTO-016: a layer row for a place the index already listed is dropped, as the search list does (#2592)', async () => {
    // The reported case: the index's Kirby Cafe Hakata and the layer's Kirby
    // Cafe six metres away are one shop, and the list showed it twice. The
    // layer's Kirby Cafe in Tokyo is another shop and stays.
    mockSearch.mockResolvedValue([
      hit({
        gers: 'hakata',
        name: 'Kirby Cafe Hakata',
        lat: 33.59052848815918,
        lng: 130.4105987548828,
        address: { locality: '福岡市博多区', country: 'JP' },
      }),
      osmHit({
        id: 'osm:node/1',
        osm_id: 1,
        name: 'Kirby Cafe',
        local_name: 'カービィカフェ',
        lat: 35.7103685,
        lng: 139.8118977,
      }),
      hit({ gers: 'emmetsburg', name: "Kirby's Cafe", lat: 43.11215019226074, lng: -94.69049072265625 }),
      osmHit({
        id: 'osm:node/2',
        osm_id: 2,
        name: 'Kirby Cafe',
        local_name: 'カービィカフェ',
        lat: 33.5905723,
        lng: 130.4106152,
      }),
      // The same name a hundred metres off is kept, exactly as the search
      // list keeps it: index coordinates are not that precise, but a chain's
      // second branch round the corner is not a duplicate either.
      osmHit({
        id: 'osm:node/3',
        osm_id: 3,
        name: "Kirby's Café",
        local_name: null,
        lat: 43.1122282,
        lng: -94.6917042,
      }),
      // The index carries the local name, the layer labels it with the exonym
      // that matched: compared on the name written on the building instead.
      hit({ gers: 'hasedera', name: '長谷寺', lat: 35.3124, lng: 139.5333 }),
      osmHit({
        id: 'osm:way/4',
        osm_type: 'way',
        osm_id: 4,
        name: 'Hase-dera',
        local_name: '長谷寺',
        lat: 35.31245,
        lng: 139.53335,
      }),
    ]);

    const { suggestions } = await make().autocompletePlaces(1, INPUT, 'en');

    expect(suggestions.map((s) => s.placeId)).toEqual([
      'gers:hakata',
      'node:1',
      'gers:emmetsburg',
      'node:3',
      'gers:hasedera',
    ]);
  });
  it('MAPS-AUTO-017: the search language goes to the index, which names localities in it (#2592)', async () => {
    mockSearch.mockResolvedValue([hit()]);

    await make().autocompletePlaces(1, INPUT, 'br');

    expect(mockSearch).toHaveBeenCalledWith(INPUT, expect.objectContaining({ sources: 'index,osm', lang: 'br' }));
  });

  it('MAPS-AUTO-018: a layer row reads as its town and country, like an index row (#2592)', async () => {
    // What the service answers for "kirby cafe" with a language: the two layer
    // rows used to repeat カービィカフェ under "Kirby Cafe" with no place at all.
    const tokyo = osmHit({ name: 'Kirby Cafe', local_name: 'カービィカフェ', lat: 35.7103685, lng: 139.8118977 });
    const rows = (locality: string) => [
      { ...tokyo, locality },
      hit({ gers: 'emmetsburg', name: "Kirby's Cafe", lat: 43.11215, lng: -94.69049 }),
    ];

    mockSearch.mockResolvedValue(rows('Sumida'));
    expect((await make().autocompletePlaces(1, INPUT, 'en')).suggestions[0].secondaryText).toBe('Sumida, Japan');

    mockSearch.mockResolvedValue(rows('Sumida'));
    expect((await make().autocompletePlaces(1, INPUT, 'fr')).suggestions[0].secondaryText).toBe('Sumida, Japon');

    mockSearch.mockResolvedValue(rows('Tokio'));
    expect((await make().autocompletePlaces(1, INPUT, 'de')).suggestions[0].secondaryText).toBe('Tokio, Japan');
  });

  it('MAPS-AUTO-019: without a locality the layer row keeps its local name, and never prints a blank', async () => {
    mockSearch.mockResolvedValue([
      osmHit({ id: 'osm:node/1', osm_id: 1, locality: null }),
      osmHit({ id: 'osm:node/2', osm_id: 2, name: 'Same', local_name: 'Same', lat: 1, lng: 1, locality: null }),
      osmHit({ id: 'osm:node/3', osm_id: 3, name: 'Old service', local_name: '旧', lat: 2, lng: 2 }),
    ]);

    const { suggestions } = await make().autocompletePlaces(1, INPUT, 'en');

    expect(suggestions.map((s) => s.secondaryText)).toEqual(['東京駅丸の内駅舎', '', '旧']);
  });

  it('MAPS-AUTO-020: a locality out at sea, where no country is, stands alone', async () => {
    mockSearch.mockResolvedValue([osmHit({ lat: 0.5, lng: -30, locality: 'Somewhere' })]);

    const { suggestions } = await make().autocompletePlaces(1, INPUT, 'en');

    expect(suggestions[0].secondaryText).toBe('Somewhere');
  });
});
