import { afterEach, describe, expect, it, vi } from 'vitest';
import { RoadtripHazardsService } from '../../../src/nest/roadtrip/roadtrip-hazards.service';

const polygon = { type: 'Polygon', coordinates: [[[10, 50], [11, 50], [11, 51], [10, 50]]] };
const feed = (features: unknown[]) => new Response(JSON.stringify({ type: 'FeatureCollection', features }));
afterEach(() => vi.unstubAllGlobals());

describe('roadtrip hazard sources', () => {
  it('isolates failed providers and caches concurrent reads', async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url.includes('dwd.de')) throw new Error('down');
      return feed([]);
    });
    vi.stubGlobal('fetch', fetcher);
    const service = new RoadtripHazardsService();
    const [first, second] = await Promise.all([service.read(), service.read()]);
    expect(first).toEqual(second);
    expect(first.sources).toEqual([{ source: 'DWD', status: 'unavailable' }, { source: 'GDACS', status: 'ok' }]);
    await service.read();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('drops expired warnings and marks malformed records as incomplete', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => feed(url.includes('dwd.de') ? [
      { geometry: polygon, properties: { HEADLINE: 'Rain', SENT: '2026-01-01T00:00:00Z', EXPIRES: '2099-01-01T00:00:00Z' } },
      { geometry: polygon, properties: { HEADLINE: 'Old', SENT: '2020-01-01T00:00:00Z', EXPIRES: '2020-01-02T00:00:00Z' } },
      { geometry: null, properties: {} },
    ] : [])));
    const saved = await new RoadtripHazardsService().read();
    expect(saved.hazards).toHaveLength(1);
    expect(saved.hazards[0].title).toBe('Rain');
    expect(saved.sources[0].status).toBe('partial');
  });
  it('uses affected polygons rather than the global event footprint', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('dwd.de')) return feed([]);
      if (url.includes('getgeometry')) return feed([
        { geometry: polygon, properties: { Class: 'Poly_Affected' } },
        { geometry: polygon, properties: { Class: 'Poly_Global' } },
      ]);
      return feed([{ geometry: { type: 'Point', coordinates: [10, 50] }, properties: {
        eventtype: 'FL', eventid: 1, episodeid: 2, name: 'Flood', description: 'Flood report',
        datemodified: '2026-09-12T08:00:00', iscurrent: 'true',
      } }]);
    }));
    const saved = await new RoadtripHazardsService().read();
    expect(saved.hazards[0].geometry).toEqual({ type: 'MultiPolygon', coordinates: [polygon.coordinates] });
    expect(saved.hazards[0].updatedAt).toBe('2026-09-12T08:00:00.000Z');
  });
});
