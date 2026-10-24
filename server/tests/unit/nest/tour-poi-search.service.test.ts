/**
 * TourPoiSearchService (PLN-02, CW-05): places along a tour's line through
 * the map search. The map search is a stub here: these tests are about what is
 * asked for, what is kept and how the answer says what it missed.
 */
import { Places } from '../../../src/db/entities/Places.entity';
import type { McpContext } from '../../../src/nest-mcp';
import { MapsService } from '../../../src/nest/maps/maps.service';
import { TourPoiSearchService } from '../../../src/nest/tours/tour-poi-search.service';
import { ToursMcp } from '../../../src/nest/tours/tours.mcp';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createPlace, createTrip, createUser } from '../../helpers/factories';
import { updateRows } from '../../helpers/factories/rows';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTestOrm } from '../../helpers/test-orm';
import { createTour } from '../../helpers/tours-repos';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
const poisAlong = vi.fn();
const highlightsAlong = vi.fn();
let t: TestModule;
let service: TourPoiSearchService;

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [ToursModule],
    overrides: [{ provide: MapsService, useValue: { poisAlong, highlightsAlong } }],
  });
  service = t.get(TourPoiSearchService);
});
beforeEach(() => {
  resetTestDb(db);
  poisAlong.mockReset();
  highlightsAlong.mockReset();
  highlightsAlong.mockResolvedValue([]);
});
afterAll(async () => {
  await t.close();
  db.close();
});

// About 2.2 km due north, along one meridian.
const LINE: Array<[number, number]> = [
  [47.4, 11.1],
  [47.42, 11.1],
];

function poi(id: string, lat: number, lng: number, category = 'viewpoint', over: Record<string, unknown> = {}) {
  return {
    osm_id: id,
    name: id,
    lat,
    lng,
    category,
    poi_type: `tourism=${category}`,
    address: null,
    website: null,
    phone: null,
    opening_hours: 'Mo-Su 08:00-18:00',
    cuisine: null,
    brand: null,
    brand_wikidata: null,
    charging: null,
    source: 'openstreetmap',
    ...over,
  };
}

/** A well known place of the index's OpenStreetMap layer, as MapsService.highlightsAlong answers it. */
function famous(
  osmType: string,
  osmId: number,
  name: string,
  lat: number,
  lng: number,
  qrank: number,
  category: string | null = 'sehenswuerdigkeit',
) {
  return {
    osmType,
    osmId,
    name,
    lat,
    lng,
    category,
    osmTag: 'place=square',
    wikidata: `Q${osmId}`,
    qrank,
    distanceMetres: 0,
  };
}

const answer = (list: unknown[], over: Record<string, unknown> = {}) => ({
  pois: list,
  failed: [],
  partial: false,
  truncated: false,
  capped: false,
  ...over,
});

describe('TourPoiSearchService', () => {
  it('TOUR-POI-001: keeps the places within the corridor, once each, nearest the start first, with where they lie', async () => {
    poisAlong.mockResolvedValue(
      answer([
        poi('node:far', 47.41, 11.2),
        poi('node:late', 47.418, 11.1005),
        poi('node:early', 47.402, 11.1003),
        poi('node:early', 47.402, 11.1003),
      ]),
    );
    const result = await service.search({ tour_type: 'hike', categories: ['viewpoint'], corridor_m: 500, line: LINE });
    expect(result.pois.map((found) => found.id)).toEqual(['node:early', 'node:late']);
    expect(result.pois[0]).toMatchObject({
      category: 'viewpoint',
      kind: 'tourism=viewpoint',
      opening_hours: 'Mo-Su 08:00-18:00',
    });
    expect(result.pois[0]?.distance_m).toBeGreaterThan(10);
    expect(result.pois[0]?.distance_m).toBeLessThan(40);
    expect(result.pois[0]?.along_m).toBeLessThan(result.pois[1]?.along_m);
    expect(result).toMatchObject({ truncated: false, partial: false, capped: false });
  });

  it('TOUR-POI-006: one name in one spot is one place, mapped twice as a point and an outline', async () => {
    poisAlong.mockResolvedValue(
      answer([
        poi('node:9', 47.41, 11.1003, 'viewpoint', { name: 'AlpspiX' }),
        poi('way:9', 47.4101, 11.1004, 'viewpoint', { name: 'AlpspiX' }),
        poi('node:10', 47.4102, 11.1003, 'viewpoint', { name: 'Other' }),
      ]),
    );
    const result = await service.search({ tour_type: 'hike', categories: ['viewpoint'], corridor_m: 500, line: LINE });
    expect(result.pois.map((found) => found.id)).toEqual(['node:9', 'node:10']);
  });

  it('TOUR-POI-019: the pins of one mountain under several names are one summit, two mapped summits stay two', async () => {
    const pin = (id: string, name: string, lat: number) =>
      poi(id, lat, 11.1003, 'peak', { name, source: 'trek-places', poi_type: 'mountain' });
    poisAlong.mockResolvedValue(
      answer([
        // Pins at the foot of the mountain and on top, named in two scripts and bridged by one that has both.
        pin('gers:1', 'Mt.Takao', 47.401),
        pin('gers:2', '東京都 高尾山', 47.4011),
        pin('gers:3', '高尾山 (Mt. Takao)', 47.403),
        pin('gers:4', '八王子高尾山', 47.405),
        pin('gers:5', '高尾山', 47.419),
        pin('gers:6', 'Top Of Mt.Takao', 47.4191),
        // Another mountain on the way, and two summits of OpenStreetMap a kilometre apart.
        pin('gers:7', 'Mt.Kagenobu', 47.41),
        poi('node:1', 47.406, 11.1003, 'peak', { name: 'Watzmann' }),
        poi('node:2', 47.415, 11.1003, 'peak', { name: 'Kleiner Watzmann' }),
      ]),
    );
    const result = await service.search({ tour_type: 'hike', categories: ['peak'], corridor_m: 500, line: LINE });
    expect(result.pois.map((found) => found.name)).toEqual(['Watzmann', 'Mt.Kagenobu', 'Kleiner Watzmann', '高尾山']);
  });

  it('TOUR-POI-002: asks the map search along the line for what each category means, and names a hit by the category asked', async () => {
    poisAlong.mockResolvedValue(answer([poi('node:cafe', 47.41, 11.1, 'cafe')]));
    const result = await service.search({
      tour_type: 'hike',
      categories: ['food', 'drinking_water'],
      corridor_m: 250,
      line: LINE,
      lang: 'de',
    });
    expect(poisAlong).toHaveBeenCalledWith(
      ['restaurant', 'cafe', 'drinking_water'],
      [
        { lat: 47.4, lng: 11.1 },
        { lat: 47.42, lng: 11.1 },
      ],
      250,
      'de',
      30,
    );
    expect(result.pois[0]?.category).toBe('food');
  });

  it('TOUR-POI-003: says when parts of the line could not be searched or more places matched than came back', async () => {
    poisAlong.mockResolvedValue(answer([poi('node:a', 47.41, 11.1005)], { partial: true, truncated: true }));
    const result = await service.search({ tour_type: 'hike', categories: ['viewpoint'], corridor_m: 500, line: LINE });
    expect(result).toMatchObject({ partial: true, truncated: true, capped: false, unavailable: [] });
    expect(result.pois.map((found) => found.id)).toEqual(['node:a']);
  });

  it('TOUR-POI-004: a line longer than one search covers says it was searched along its first part', async () => {
    poisAlong.mockResolvedValue(answer([], { capped: true }));
    const result = await service.search({
      tour_type: 'kayak',
      categories: ['slipway'],
      corridor_m: 2000,
      line: [
        [44.0, 8.0],
        [52.0, 14.0],
      ],
    });
    expect(result.capped).toBe(true);
    expect(result.truncated).toBe(false);
  });

  it('TOUR-POI-007: names the kinds no source could search, a kind of two only when both failed', async () => {
    poisAlong.mockResolvedValue(answer([], { failed: ['viewpoint', 'cafe', 'market'] }));
    const walk = await service.search({
      tour_type: 'walk',
      categories: ['market', 'sights', 'viewpoint'],
      corridor_m: 500,
      line: LINE,
    });
    expect(walk.unavailable).toEqual(['market', 'viewpoint']);
    const hike = await service.search({ tour_type: 'hike', categories: ['food'], corridor_m: 500, line: LINE });
    expect(hike.unavailable).toEqual([]);
    poisAlong.mockResolvedValue(answer([], { failed: ['restaurant', 'cafe'] }));
    expect(
      (await service.search({ tour_type: 'hike', categories: ['food'], corridor_m: 500, line: LINE })).unavailable,
    ).toEqual(['food']);
  });

  it('TOUR-POI-017: says when to ask again beside the kinds it could not search, and nothing of it otherwise', async () => {
    poisAlong.mockResolvedValue(answer([], { failed: ['viewpoint'], retryAfterS: 20 }));
    const failed = await service.search({ tour_type: 'hike', categories: ['viewpoint'], corridor_m: 500, line: LINE });
    expect(failed).toMatchObject({ unavailable: ['viewpoint'], retry_after_s: 20 });

    // A wait the map search names for a kind not asked here, or none at all, leaves the field out.
    const other = await service.search({ tour_type: 'hike', categories: ['shelter'], corridor_m: 500, line: LINE });
    expect(other.unavailable).toEqual([]);
    expect(other).not.toHaveProperty('retry_after_s');
    poisAlong.mockResolvedValue(answer([], { failed: ['viewpoint'] }));
    const plain = await service.search({ tour_type: 'hike', categories: ['viewpoint'], corridor_m: 500, line: LINE });
    expect(plain.unavailable).toEqual(['viewpoint']);
    expect(plain).not.toHaveProperty('retry_after_s');
  });

  it('TOUR-POI-018: e-bike charging asks the map search for its own kind and carries what the point states', async () => {
    const charging = {
      sockets: [{ type: 'schuko', count: 2, kw: null }],
      capacity: 2,
      fee: false,
      bicycle: 'designated',
      access: null,
    };
    poisAlong.mockResolvedValue(
      answer([
        poi('node:1', 47.41, 11.1003, 'ebike_charging', {
          name: '',
          poi_type: 'amenity=charging_station&bicycle=designated',
          charging,
        }),
        // A car charger's facts carry no bicycle tag and are never passed on as an e-bike's.
        poi('node:2', 47.412, 11.1003, 'ebike_charging', {
          charging: { sockets: [{ type: 'type2', count: 2, kw: 22 }], capacity: null, fee: null },
        }),
        poi('node:3', 47.414, 11.1003, 'drinking_water', { name: '' }),
      ]),
    );
    const result = await service.search({
      tour_type: 'bike',
      categories: ['ebike_charging', 'drinking_water'],
      corridor_m: 1000,
      line: LINE,
    });
    expect(poisAlong.mock.calls[0]?.[0]).toEqual(['ebike_charging', 'drinking_water']);
    expect(result.pois.map((found) => [found.id, found.category, found.kind])).toEqual([
      ['node:1', 'ebike_charging', 'amenity=charging_station&bicycle=designated'],
      ['node:2', 'ebike_charging', 'tourism=ebike_charging'],
      ['node:3', 'drinking_water', 'tourism=drinking_water'],
    ]);
    expect(result.pois[0]?.charging).toEqual(charging);
    expect(result.pois[1]).not.toHaveProperty('charging');
    expect(result.pois[2]).not.toHaveProperty('charging');
  });

  it('TOUR-POI-008: an unnamed place is kept and never merged with another unnamed one nearby', async () => {
    poisAlong.mockResolvedValue(
      answer([
        poi('node:1', 47.41, 11.1003, 'drinking_water', { name: '' }),
        poi('node:2', 47.4101, 11.1003, 'drinking_water', { name: '' }),
        // Across the line from the first: as far along, a little further off it.
        poi('node:3', 47.41, 11.0995, 'drinking_water', { name: '' }),
      ]),
    );
    const result = await service.search({
      tour_type: 'hike',
      categories: ['drinking_water'],
      corridor_m: 500,
      line: LINE,
    });
    expect(result.pois.map((found) => [found.id, found.name])).toEqual([
      ['node:1', ''],
      ['node:3', ''],
      ['node:2', ''],
    ]);
  });

  it('TOUR-POI-009: of more places than an answer carries, the nearest to the line are listed from the start', async () => {
    // Seventy cafes along the line, every other one a little further off it.
    const many = Array.from({ length: 70 }, (_, i) =>
      poi(`node:${i}`, 47.4 + (i + 1) * 0.0002, 11.1 + (i % 2 === 0 ? 0.0001 : 0.003), 'cafe'),
    );
    poisAlong.mockResolvedValue(answer(many));
    const result = await service.search({ tour_type: 'walk', categories: ['cafe'], corridor_m: 500, line: LINE });
    expect(result.pois).toHaveLength(60);
    expect(result.truncated).toBe(true);
    // All 35 near ones are in, from the start of the line to its end.
    const ids = new Set(result.pois.map((found) => found.id));
    expect(many.filter((_, i) => i % 2 === 0).every((near) => ids.has(near.osm_id))).toBe(true);
    const along = result.pois.map((found) => found.along_m);
    expect(along).toEqual([...along].sort((a, b) => a - b));
  });

  it('TOUR-POI-010: a place of a circle outside the corridor and one of a kind not asked for are left out', async () => {
    poisAlong.mockResolvedValue(
      answer([
        poi('gers:in', 47.41, 11.101, 'park', { source: 'trek-places' }),
        poi('gers:off', 47.41, 11.115, 'park', { source: 'trek-places' }),
        poi('gers:other', 47.41, 11.1001, 'nature', { source: 'trek-places' }),
      ]),
    );
    const result = await service.search({
      tour_type: 'walk',
      categories: ['park', 'museum'],
      corridor_m: 500,
      line: LINE,
    });
    // Parks and gardens alone, museums and galleries alone: not the beaches, theatres and cinemas of the explore pill.
    expect(poisAlong.mock.calls[0]?.[0]).toEqual(['park', 'museum_gallery']);
    expect(result.pois.map((found) => [found.id, found.category, found.source])).toEqual([
      ['gers:in', 'park', 'trek-places'],
    ]);
  });

  it('TOUR-POI-011: a search for sights asks the best known places along the line and adds a square no kind names', async () => {
    poisAlong.mockResolvedValue(answer([poi('node:gate', 47.405, 11.1003, 'sights', { name: 'Town gate' })]));
    highlightsAlong.mockResolvedValue([famous('way', 1, 'Piazza San Marco', 47.41, 11.1004, 900_000)]);
    const result = await service.search({
      tour_type: 'walk',
      categories: ['sights', 'cafe'],
      corridor_m: 500,
      line: LINE,
      lang: 'it',
    });
    expect(highlightsAlong).toHaveBeenCalledWith(
      [
        { lat: 47.4, lng: 11.1 },
        { lat: 47.42, lng: 11.1 },
      ],
      500,
      'it',
    );
    expect(result.pois.map((found) => [found.id, found.highlight])).toEqual([
      ['way:1', true],
      ['node:gate', undefined],
    ]);
    expect(result.pois[0]).toMatchObject({
      name: 'Piazza San Marco',
      category: 'sights',
      kind: 'place=square',
      source: 'openstreetmap',
      address: null,
      opening_hours: null,
    });
    expect(result.pois[0]?.distance_m).toBeGreaterThan(20);
    expect(result.pois[0]?.distance_m).toBeLessThan(40);
    expect(result.pois[0]?.along_m).toBeGreaterThan(1050);
    expect(result.pois[0]?.along_m).toBeLessThan(1180);

    // Without sights nothing of the kind is asked, on a walk or a hike.
    highlightsAlong.mockClear();
    await service.search({ tour_type: 'walk', categories: ['cafe'], corridor_m: 500, line: LINE });
    await service.search({ tour_type: 'hike', categories: ['viewpoint'], corridor_m: 500, line: LINE });
    expect(highlightsAlong).not.toHaveBeenCalled();
  });

  it('TOUR-POI-012: a highlight a row already has marks that row, by object, by name or by a like name in one spot, once', async () => {
    poisAlong.mockResolvedValue(
      answer([
        poi('node:basilica', 47.405, 11.1003, 'sights', { name: 'Basilica di San Marco' }),
        poi('node:museo', 47.41, 11.1003, 'museum_gallery', { name: 'Museo Correr' }),
        poi('way:7', 47.415, 11.1002, 'sights', { name: 'Campanile' }),
        poi('node:cafe', 47.402, 11.1003, 'cafe', { name: 'Caffe Florian' }),
      ]),
    );
    highlightsAlong.mockResolvedValue([
      famous('way', 7, 'Campanile di San Marco', 47.415, 11.1002, 45_000),
      famous('node', 2, 'Piazza San Marco', 47.4102, 11.1004, 80_000),
      famous('way', 1, 'Piazza San Marco', 47.4101, 11.1004, 900_000),
      famous('node', 3, 'Basilica San Marco', 47.4052, 11.1003, 500_000),
      famous('node', 4, 'MUSEO CORRER', 47.4127, 11.1003, 60_000),
      // Far outside the corridor: not along this walk, however well known.
      famous('way', 99, 'Rialto', 47.41, 11.2, 1_000_000),
    ]);
    const result = await service.search({
      tour_type: 'walk',
      categories: ['sights', 'museum', 'cafe'],
      corridor_m: 500,
      line: LINE,
    });
    expect(result.pois.map((found) => [found.id, found.highlight ?? false])).toEqual([
      ['way:1', true],
      ['node:basilica', true],
      ['node:museo', true],
      ['way:7', true],
      ['node:cafe', false],
    ]);
    // The rows a highlight marks keep what their own source said of them.
    expect(result.pois[2]).toMatchObject({ name: 'Museo Correr', category: 'museum', kind: 'tourism=museum_gallery' });
  });

  it('TOUR-POI-013: with fewer than three famous places the best known three are highlights, a lesser one gets no row', async () => {
    poisAlong.mockResolvedValue(answer([]));
    highlightsAlong.mockResolvedValue([
      famous('node', 1, 'Old bridge', 47.402, 11.1002, 4_000),
      famous('node', 2, 'Town hall', 47.404, 11.1002, 6_000),
      famous('node', 3, 'Cathedral', 47.406, 11.1002, 30_000),
      famous('node', 4, 'Castle', 47.408, 11.1002, 8_000),
    ]);
    const result = await service.search({ tour_type: 'hike', categories: ['sights'], corridor_m: 500, line: LINE });
    expect(result.pois.map((found) => [found.name, found.highlight ?? false])).toEqual([
      ['Cathedral', true],
      ['Castle', true],
      ['Town hall', true],
    ]);
  });

  it('TOUR-POI-015: a famous station or hotel ranks a row it matches but is never added as a sight', async () => {
    poisAlong.mockResolvedValue(answer([poi('node:cafe', 47.402, 11.1003, 'cafe', { name: 'Caffe Florian' })]));
    highlightsAlong.mockResolvedValue([
      famous('node', 1, 'Venezia Santa Lucia', 47.404, 11.1002, 300_000, 'verkehr'),
      famous('node', 2, 'Hotel Danieli', 47.406, 11.1002, 90_000, 'uebernachtung'),
      famous('node', 3, 'Mystery', 47.408, 11.1002, 90_000, null),
      famous('node', 4, 'Caffe Florian', 47.402, 11.1003, 70_000, 'gastronomie'),
    ]);
    const result = await service.search({
      tour_type: 'walk',
      categories: ['sights', 'cafe'],
      corridor_m: 500,
      line: LINE,
    });
    expect(result.pois.map((found) => [found.id, found.highlight ?? false])).toEqual([['node:cafe', true]]);
  });

  it('TOUR-POI-016: names are matched by whole words, so a cathedral does not swallow its square or a like-named palace', async () => {
    poisAlong.mockResolvedValue(
      answer([
        poi('node:dom', 47.405, 11.1003, 'sights', { name: 'Dom' }),
        poi('node:reale', 47.41, 11.1003, 'sights', { name: 'Palazzo Reale' }),
      ]),
    );
    highlightsAlong.mockResolvedValue([
      famous('way', 1, 'Domplatz', 47.4052, 11.1003, 120_000),
      famous('way', 2, 'Palazzo Ducale', 47.4101, 11.1003, 380_000),
    ]);
    const result = await service.search({ tour_type: 'walk', categories: ['sights'], corridor_m: 500, line: LINE });
    expect(result.pois.map((found) => [found.id, found.highlight ?? false])).toEqual([
      ['way:2', true],
      ['way:1', true],
      ['node:dom', false],
      ['node:reale', false],
    ]);
  });

  it('TOUR-POI-014: an index that cannot give highlights leaves the search as it was', async () => {
    poisAlong.mockResolvedValue(answer([poi('node:gate', 47.405, 11.1003, 'sights', { name: 'Town gate' })]));
    highlightsAlong.mockRejectedValue(new Error('TREK Places API 503'));
    const result = await service.search({ tour_type: 'walk', categories: ['sights'], corridor_m: 500, line: LINE });
    expect(result.pois.map((found) => [found.id, found.highlight])).toEqual([['node:gate', undefined]]);
    expect(result).toMatchObject({ truncated: false, partial: false, unavailable: [] });
  });

  it('TOUR-POI-005: searches along a saved tour for MCP, and a tour without a line is not found', async () => {
    const { user } = createUser(db);
    const trip = createTrip(db, user.id);
    const ridge = createPlace(db, trip.id, { name: 'Ridge' });
    createTour(db, ridge.id);
    poisAlong.mockResolvedValue(answer([poi('node:x', 47.41, 11.1)]));
    await expect(
      service.searchSavedTour(trip.id, ridge.id, { categories: ['viewpoint'], corridor_m: 500 }),
    ).rejects.toThrow('Tour not found');
    const orm = await createTestOrm(db);
    await updateRows(
      orm,
      Places,
      { id: ridge.id },
      { route_geometry: JSON.stringify(LINE.map(([lat, lng]) => [lat, lng, 600])) },
    );
    await orm.close();
    const result = await service.searchSavedTour(trip.id, ridge.id, { categories: ['viewpoint'], corridor_m: 500 });
    expect(result.pois.map((found) => found.id)).toEqual(['node:x']);

    // The MCP tool reads the same, and only for someone who sees the trip.
    const mcp = t.get(ToursMcp);
    const ctx = (userId: number) => ({ userId }) as McpContext;
    const read = (r: { content: Array<{ text: string }>; isError?: boolean }) =>
      r.isError ? { error: r.content[0]?.text } : JSON.parse(r.content[0]?.text ?? '{}');
    expect(
      read(
        await mcp.searchTourPois(
          { tripId: trip.id, placeId: ridge.id, categories: ['viewpoint'], corridor_m: 500 },
          ctx(user.id),
        ),
      ).pois,
    ).toHaveLength(1);
    const { user: outsider } = createUser(db);
    expect(
      read(
        await mcp.searchTourPois(
          { tripId: trip.id, placeId: ridge.id, categories: ['viewpoint'], corridor_m: 500 },
          ctx(outsider.id),
        ),
      ),
    ).toEqual({ error: 'Trip not found or access denied.' });
    expect(
      read(
        await mcp.searchTourPois(
          { tripId: trip.id, placeId: 999999, categories: ['viewpoint'], corridor_m: 500 },
          ctx(user.id),
        ),
      ),
    ).toEqual({ error: 'Tour not found.' });
  });
});
