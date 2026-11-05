/**
 * The names a search of OpenStreetMap places shows (#1655): the language of the
 * traveller before the native name, places closed for good left out, and an
 * unnamed e-bike charging point kept where nothing else unnamed is (BIK-07).
 * Moved out of maps.service.test.ts as they were, under the describe name they
 * had there.
 */
import { OsmClient } from '../../../src/nest/maps/providers/osm.client';
import { photonOff } from '../../helpers/photon';

import { describe, it, expect, vi, afterEach } from 'vitest';

const osm = new OsmClient(photonOff());

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('searchOverpassPois localized names (#1655)', () => {
  // Elephant and Obelisk in Rome: OSM ships the native name plus localized tags.
  const tags = {
    name: 'Obelisco della Minerva',
    'name:en': 'Elephant and Obelisk',
    'name:de': 'Minerva-Obelisk',
    int_name: 'Elephant Obelisk',
    tourism: 'attraction',
  };
  const stubOverpass = (elementTags: Record<string, string>) =>
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ elements: [{ type: 'node', id: 1, lat: 41.9, lon: 12.48, tags: elementTags }] }),
      }),
    );
  // Distinct bboxes per case so the module-level POI_CACHE (keyed by lang+bbox)
  // never serves one case's names to another.
  const bbox = (n: number) => ({ south: 41 + n / 100, west: 12, north: 42 + n / 100, east: 13 });

  it('prefers name:<lang> for the user language over the native name', async () => {
    stubOverpass(tags);
    const { pois } = await osm.searchOverpassPois('sights', bbox(1), 'en-US');
    expect(pois[0].name).toBe('Elephant and Obelisk');
  });

  it('localizes to a non-English language too', async () => {
    stubOverpass(tags);
    const { pois } = await osm.searchOverpassPois('sights', bbox(2), 'de-DE');
    expect(pois[0].name).toBe('Minerva-Obelisk');
  });

  it('falls back to int_name when the language tag is absent', async () => {
    stubOverpass({ name: tags.name, int_name: tags.int_name, tourism: 'attraction' });
    const { pois } = await osm.searchOverpassPois('sights', bbox(3), 'fr-FR');
    expect(pois[0].name).toBe('Elephant Obelisk');
  });

  it('skips POIs tagged as closed for good (#1341)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          elements: [
            {
              type: 'node',
              id: 1,
              lat: 41.9,
              lon: 12.48,
              tags: { name: 'Gone Forever', tourism: 'attraction', disused: 'yes' },
            },
            {
              type: 'node',
              id: 2,
              lat: 41.9,
              lon: 12.49,
              tags: { name: 'Ruin', tourism: 'attraction', abandoned: 'yes' },
            },
            {
              type: 'node',
              id: 3,
              lat: 41.9,
              lon: 12.5,
              tags: { name: 'Shut', tourism: 'attraction', opening_hours: 'closed' },
            },
            { type: 'node', id: 4, lat: 41.9, lon: 12.51, tags: { name: 'Open For Business', tourism: 'attraction' } },
          ],
        }),
      }),
    );
    const { pois } = await osm.searchOverpassPois('sights', bbox(5), 'en-US');
    expect(pois.map((p) => p.name)).toEqual(['Open For Business']);
  });

  it('falls back to the native name when no localized tag exists', async () => {
    stubOverpass({ name: tags.name, tourism: 'attraction' });
    const { pois } = await osm.searchOverpassPois('sights', bbox(4), 'fr-FR');
    expect(pois[0].name).toBe('Obelisco della Minerva');
  });

  it('keeps an unnamed e-bike charging point, as the search along a tour does (BIK-07)', async () => {
    stubOverpass({ amenity: 'charging_station', bicycle: 'yes', 'socket:schuko': '2' });
    const { pois } = await osm.searchOverpassPois('ebike_charging', bbox(6), 'en-US');
    expect(pois.map((p) => [p.name, p.category])).toEqual([['', 'ebike_charging']]);
  });

  it('still drops an unnamed place of any other kind', async () => {
    stubOverpass({ tourism: 'attraction' });
    const { pois } = await osm.searchOverpassPois('sights', bbox(7), 'en-US');
    expect(pois).toEqual([]);
  });
});
