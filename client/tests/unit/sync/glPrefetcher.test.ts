/**
 * glPrefetcher unit tests.
 *
 * Covers: style/sprite/glyph warming, the TileJSON indirection, the cors
 * requirement, the offline and cancellation guards, cache reuse, and clearing.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import {
  prefetchStyleAssets,
  prefetchVectorForPlaces,
  clearVectorCache,
} from '../../../src/sync/glPrefetcher';
import { buildPlace } from '../../helpers/factories';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
const TILE_TEMPLATE = 'https://tiles.openfreemap.org/planet/20260101_001001055/{z}/{x}/{y}.pbf';

const STYLE_DOC = {
  sprite: 'https://tiles.openfreemap.org/sprites/ofm_f384/ofm',
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: { openmaptiles: { url: 'https://tiles.openfreemap.org/planet' } },
  layers: [
    { layout: { 'text-font': ['Noto Sans Regular'] } },
    { layout: { 'text-font': ['Noto Sans Regular'] } }, // same stack, must dedupe
    { layout: { 'text-font': ['Noto Sans Italic'] } },
    { layout: {} },
    {},
  ],
};

/** Cache Storage stand-in: jsdom has none, and we want to inspect what landed. */
class FakeCache {
  store = new Map<string, unknown>();
  match(url: string) {
    return Promise.resolve(this.store.get(url));
  }
  put(url: string, res: unknown) {
    this.store.set(url, res);
    return Promise.resolve();
  }
}

let cache: FakeCache;
let deleted: string[];
let requested: { url: string; mode?: string }[];

/** Answers the style URL and the TileJSON as JSON, everything else as a body-less 200. */
function respond(url: string) {
  if (url === STYLE_URL) return { ok: true, json: () => Promise.resolve(STYLE_DOC), clone: () => ({}) };
  if (url === 'https://tiles.openfreemap.org/planet') {
    return { ok: true, json: () => Promise.resolve({ tiles: [TILE_TEMPLATE] }), clone: () => ({}) };
  }
  return { ok: true, json: () => Promise.resolve({}), clone: () => ({}) };
}

beforeEach(() => {
  cache = new FakeCache();
  deleted = [];
  requested = [];
  Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
  vi.stubGlobal('caches', {
    open: vi.fn().mockResolvedValue(cache),
    delete: vi.fn((name: string) => {
      deleted.push(name);
      return Promise.resolve(true);
    }),
  });
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, init?: { mode?: string }) => {
      requested.push({ url, mode: init?.mode });
      return Promise.resolve(respond(url));
    }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('prefetchStyleAssets', () => {
  it('FE-SYNC-GLPF-001: takes the tile template from the TileJSON rather than guessing it', async () => {
    // OpenFreeMap's tile path carries a planet version. Guessing /planet/{z}/{x}/{y}.pbf
    // answers 200 with an empty body, which caches as a map with no data on it.
    const template = await prefetchStyleAssets(STYLE_URL);
    expect(template).toBe(TILE_TEMPLATE);
    expect(cache.store.has('https://tiles.openfreemap.org/planet')).toBe(true);
  });

  it('FE-SYNC-GLPF-002: warms both sprite densities and both parts', async () => {
    await prefetchStyleAssets(STYLE_URL);
    const urls = [...cache.store.keys()];
    expect(urls).toEqual(
      expect.arrayContaining([
        `${STYLE_DOC.sprite}.json`,
        `${STYLE_DOC.sprite}.png`,
        `${STYLE_DOC.sprite}@2x.json`,
        `${STYLE_DOC.sprite}@2x.png`,
      ]),
    );
  });

  it('FE-SYNC-GLPF-003: warms the Latin ranges for each distinct font stack, deduped', async () => {
    await prefetchStyleAssets(STYLE_URL);
    const glyphs = [...cache.store.keys()].filter(u => u.includes('/fonts/'));
    // Two stacks x nine Latin ranges. Asking for all 256 ranges would pull down
    // megabytes of CJK that nothing on this map renders.
    expect(glyphs).toHaveLength(18);
    expect(glyphs.some(u => u.includes('Noto%20Sans%20Regular') && u.endsWith('/0-255.pbf'))).toBe(true);
    expect(glyphs.some(u => u.includes('Noto%20Sans%20Italic'))).toBe(true);
    expect(glyphs.some(u => u.includes('20480-20735'))).toBe(false);
  });

  it('FE-SYNC-GLPF-004: asks in cors mode, never no-cors', async () => {
    // An opaque response cannot be read, so MapLibre would find a zero-byte body
    // in the cache and draw nothing. OpenFreeMap sends the CORS header.
    await prefetchStyleAssets(STYLE_URL);
    expect(requested.length).toBeGreaterThan(0);
    expect(requested.every(r => r.mode === 'cors')).toBe(true);
  });

  it('FE-SYNC-GLPF-005: gives up quietly when the style cannot be read', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(prefetchStyleAssets(STYLE_URL)).resolves.toBeNull();
  });

  it('FE-SYNC-GLPF-006: uses a source that already carries its tiles inline', async () => {
    const inline = { sources: { s: { tiles: ['https://example.test/{z}/{x}/{y}.pbf'] } } };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(inline), clone: () => ({}) }),
    );
    await expect(prefetchStyleAssets(STYLE_URL)).resolves.toBe('https://example.test/{z}/{x}/{y}.pbf');
  });
});

describe('prefetchVectorForPlaces', () => {
  const places = [buildPlace({ lat: 52.52, lng: 13.405 })];

  it('FE-SYNC-GLPF-007: downloads the tiles covering the trip, z10 to z14', async () => {
    const result = await prefetchVectorForPlaces(places, STYLE_URL);
    expect(result.template).toBe(TILE_TEMPLATE);
    expect(result.tiles).toBeGreaterThan(0);

    const zooms = new Set(
      [...cache.store.keys()]
        .filter(u => u.endsWith('.pbf') && u.includes('/planet/'))
        .map(u => Number(u.split('/planet/')[1]!.split('/')[1])),
    );
    // z14 is the last one OpenFreeMap serves; MapLibre scales it beyond that
    // rather than asking for another, which is why this stops where raster could not.
    expect([...zooms].sort((a, b) => a - b)).toEqual([10, 11, 12, 13, 14]);
  });

  it('FE-SYNC-GLPF-008: does nothing offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
    await expect(prefetchVectorForPlaces(places, STYLE_URL)).resolves.toEqual({ tiles: 0, template: null });
    expect(requested).toHaveLength(0);
  });

  it('FE-SYNC-GLPF-009: does nothing when no place has coordinates', async () => {
    const result = await prefetchVectorForPlaces([buildPlace({ lat: null, lng: null })], STYLE_URL);
    expect(result).toEqual({ tiles: 0, template: null });
  });

  it('FE-SYNC-GLPF-010: abandons the queue when cancelled', async () => {
    const result = await prefetchVectorForPlaces(places, STYLE_URL, () => true);
    // The style assets are already paid for at that point; the tiles are not.
    expect(result.tiles).toBe(0);
    expect([...cache.store.keys()].some(u => u.endsWith('.pbf') && u.includes('/planet/'))).toBe(false);
  });

  it('FE-SYNC-GLPF-011: a second run over a warm cache re-downloads nothing', async () => {
    await prefetchVectorForPlaces(places, STYLE_URL);
    const first = requested.length;
    requested.length = 0;

    const again = await prefetchVectorForPlaces(places, STYLE_URL);
    expect(again.tiles).toBe(0);
    expect(requested.length).toBeLessThan(first);
  });
});

describe('clearVectorCache', () => {
  it('FE-SYNC-GLPF-012: drops the offline vector basemap', async () => {
    await clearVectorCache();
    expect(deleted).toEqual(['gl-map-offline']);
  });

  it('FE-SYNC-GLPF-013: stays quiet when storage is unavailable', async () => {
    vi.stubGlobal('caches', { delete: vi.fn().mockRejectedValue(new Error('no storage')) });
    await expect(clearVectorCache()).resolves.toBeUndefined();
  });
});
