import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * What each engine module does on import. Both GL engines shape right-to-left
 * text themselves now (MapLibre since 6.9, Mapbox since 3.33), so neither may
 * register the old plugin, and a maplibre engine that forgot its worker URL
 * would draw no tile at all.
 *
 * The engines are mocked because importing them for real builds a worker pool
 * under jsdom.
 */
const { mapboxSet, maplibreSet, maplibreWorker } = vi.hoisted(() => ({
  mapboxSet: vi.fn(),
  maplibreSet: vi.fn(),
  maplibreWorker: vi.fn(),
}));

vi.mock('mapbox-gl', () => ({ default: { setRTLTextPlugin: mapboxSet } }));
vi.mock('maplibre-gl', () => ({ setRTLTextPlugin: maplibreSet, setWorkerUrl: maplibreWorker }));
vi.mock('mapbox-gl/dist/mapbox-gl.css', () => ({}));
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));
vi.mock('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url', () => ({ default: '/assets/maplibre-worker.js' }));

beforeEach(() => {
  vi.resetModules();
  mapboxSet.mockReset();
  maplibreSet.mockReset();
  maplibreWorker.mockReset();
});

describe('the GL engines on import (#2235)', () => {
  it('FE-MAP-RTL-001: importing the mapbox engine registers no plugin', async () => {
    const engine = await import('./mapbox');

    // Mapbox GL 3.33 shapes right-to-left text itself and dropped the plugin API;
    // calling it would throw on the real engine.
    expect(mapboxSet).not.toHaveBeenCalled();
    expect(engine.default).toBeDefined();
  });

  it('FE-MAP-RTL-002: importing the maplibre engine registers no plugin', async () => {
    await import('./maplibre');

    // MapLibre 6.9 shapes right-to-left text itself. The plugin would replace
    // that, and a v6 worker could only run its UMD build through eval.
    expect(maplibreSet).not.toHaveBeenCalled();
  });

  it('FE-MAP-RTL-004: importing the maplibre engine points it at the bundled worker', async () => {
    const engine = await import('./maplibre');

    // MapLibre 6 looks for its worker next to its own module, which in a bundle
    // is a chunk with no worker beside it. Without this no map draws a tile.
    expect(maplibreWorker).toHaveBeenCalledTimes(1);
    expect(maplibreWorker).toHaveBeenCalledWith('/assets/maplibre-worker.js');
    expect(engine.default.setWorkerUrl).toBe(maplibreWorker);
  });
});
