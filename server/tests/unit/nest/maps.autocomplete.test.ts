/**
 * MAPS-AUTO-001..008 — the suggestion list behind the place search box.
 *
 * This is the path the index was built for. Nominatim's usage policy names
 * autocomplete as unacceptable use in its own words, whatever the rate, and the
 * whole TREK fleet shares one User-Agent there — so before the index, every
 * install was one abusive neighbour away from being blocked. What matters here
 * is that an index answer is shaped the way the details lookup can read back
 * (`gers:` ids), and that nothing about a slow or missing index leaves somebody
 * typing into a box that never answers.
 */
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

vi.mock('../../../src/config', () => ({ JWT_SECRET: 'test-secret', ENCRYPTION_KEY: '0'.repeat(64) }));

import { MapsService } from '../../../src/nest/maps/maps.service';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';

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
 * `enabled` drives the admin kill switch, which is read straight off
 * app_settings; an unset row reads as on, because the switch is fail-open.
 *
 * Keyed on the statement rather than answering everything the same way: the
 * same `get` also resolves the Google key, and a blanket answer would hand
 * `'false'` to the key resolver and send the fallback at Google for real.
 */
function make(enabled = true) {
  trekPlaces.on = enabled;
  const database = { get: vi.fn(() => undefined) } as unknown as DatabaseService;
  return new MapsService(database, {} as PlacePhotoCacheService);
}

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
    expect(result.suggestions[0].secondaryText).toBe('Rostock, DE');
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
    expect(mockSearch).toHaveBeenCalledWith(INPUT,
      { lat: 54.1, lng: 12.2, limit: 8, sources: 'index,osm' });
  });

  it('MAPS-AUTO-004: without a bias the index is asked without coordinates rather than with zeroes', async () => {
    mockSearch.mockResolvedValue([hit()]);

    await make().autocompletePlaces(1, INPUT);

    // A 0/0 bias is a point in the Atlantic, and the index treats a bias as
    // permission to relax the match — which is how the shops around a landmark
    // start outranking the landmark.
    expect(mockSearch).toHaveBeenCalledWith(INPUT,
      { lat: undefined, lng: undefined, limit: 8, sources: 'index,osm' });
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

    expect(suggestions.map(s => s.placeId)).toEqual([
      'gers:abc-123',
      'node:9712313',
      'gers:def-456',
    ]);
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
    expect(suggestions.map(s => s.source)).toEqual(['trek-places', 'openstreetmap']);
  });

  it('MAPS-AUTO-007: the keystroke never leaves for the index while the admin has it off', async () => {
    mockSearch.mockResolvedValue([hit()]);

    const result = await make(false).autocompletePlaces(1, INPUT);

    expect(mockSearch).not.toHaveBeenCalled();
    expect(result.source).not.toBe('trek-places');
  });
});
