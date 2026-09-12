import { describe, expect, it, vi } from 'vitest';
import { RoadtripSearchService } from '../../../src/nest/roadtrip/roadtrip-search.service';

vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled: () => true }));
const bbox = { south: 48, north: 49, west: 10, east: 11 };
const place = { id: 'one', name: 'Station', lat: 48.5, lng: 10.5 };

describe('Roadtrip plugin search', () => {
  it('passes category and bounds, keeps sources and rejects out-of-area hits', async () => {
    const maps = { pois: vi.fn().mockResolvedValue({ pois: [], source: 'trek-places', truncated: false, clamped: false }) };
    const hooks = { providersOf: () => ['stations'], searchPlaces: vi.fn().mockResolvedValue([
      place, { ...place, id: 'far', lat: 51 }, { ...place, id: 'other', category: 'hotel' },
    ]) };
    const service = new RoadtripSearchService(maps as never, hooks as never);
    const answer = await service.search({ categories: ['fuel'], bbox }, 7);
    expect(hooks.searchPlaces).toHaveBeenCalledWith('stations', expect.objectContaining({ category: 'fuel', bounds: bbox, limit: 20 }), 7);
    expect(answer.pois).toHaveLength(1);
    expect(answer.pois[0]).toMatchObject({ osm_id: 'plugin:stations:one', source: 'plugin:stations', category: 'fuel' });
    expect(answer.sources).toEqual(['trek-places', 'plugin:stations']);
    expect(answer.failedSources).toEqual([]);
  });

  it('keeps successful providers when core and another provider fail', async () => {
    const maps = { pois: vi.fn().mockRejectedValue(new Error('private detail')) };
    const hooks = { providersOf: () => ['broken', 'working'], searchPlaces: vi.fn(async (id: string) => {
      if (id === 'broken') throw new Error('private plugin failure');
      return [place];
    }) };
    const answer = await new RoadtripSearchService(maps as never, hooks as never).search({ categories: ['fuel'], bbox }, 7);
    expect(answer.pois).toHaveLength(1);
    expect(answer.failedSources).toEqual(['TREK', 'plugin:broken']);
    expect(JSON.stringify(answer)).not.toContain('private');
  });

  it('reports malformed answers and deduplicates repeated provider IDs', async () => {
    const maps = { pois: vi.fn().mockResolvedValue({ pois: [], source: 'trek-places', truncated: false, clamped: true }) };
    const hooks = { providersOf: () => ['bad', 'good'], searchPlaces: vi.fn(async (id: string) => id === 'bad' ? {} : [place, place]) };
    const answer = await new RoadtripSearchService(maps as never, hooks as never).search({ categories: ['fuel', 'fuel'], bbox }, 7);
    expect(answer.failedSources).toEqual(['plugin:bad']);
    expect(answer.pois).toHaveLength(1);
    expect(answer.clamped).toBe(true);
    expect(hooks.searchPlaces).toHaveBeenCalledTimes(2);
  });
});
