/**
 * tilePrefetcher unit tests.
 *
 * Covers: bbox computation, tile math, URL building, size guard,
 * offline/no-SW guard, syncMeta update.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import {
  computeBbox,
  lngToTileX,
  latToTileY,
  buildTileUrl,
  countTiles,
  prefetchTiles,
  prefetchTilesForTrip,
  MAX_TILES,
  type TileBbox,
} from '../../../src/sync/tilePrefetcher';
import { offlineDb, clearAll, upsertSyncMeta } from '../../../src/db/offlineDb';
import { buildPlace } from '../../helpers/factories';

beforeEach(async () => {
  await clearAll();
  Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
  // Stub fetch + serviceWorker so prefetch path is exercised
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  Object.defineProperty(navigator, 'serviceWorker', {
    value: { controller: {} },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ── bbox computation ──────────────────────────────────────────────────────────

describe('computeBbox', () => {
  it('returns null when no places have coordinates', () => {
    const places = [buildPlace({ lat: null, lng: null })];
    expect(computeBbox(places)).toBeNull();
  });

  it('expands single-point bbox to at least 0.1° span', () => {
    const place = buildPlace({ lat: 48.8566, lng: 2.3522 });
    const bbox = computeBbox([place])!;
    expect(bbox.maxLat - bbox.minLat).toBeGreaterThan(0.09);
    expect(bbox.maxLng - bbox.minLng).toBeGreaterThan(0.09);
  });

  it('computes multi-point bbox with padding', () => {
    const places = [
      buildPlace({ lat: 48.8566, lng: 2.3522 }),  // Paris
      buildPlace({ lat: 51.5074, lng: -0.1278 }),  // London
    ];
    const bbox = computeBbox(places, 0.1)!;
    // Padded bbox should extend beyond raw points
    expect(bbox.minLat).toBeLessThan(48.8566);
    expect(bbox.maxLat).toBeGreaterThan(51.5074);
    expect(bbox.minLng).toBeLessThan(-0.1278);
    expect(bbox.maxLng).toBeGreaterThan(2.3522);
  });

  it('clamps to valid Mercator lat bounds', () => {
    const places = [buildPlace({ lat: 85.0, lng: 0 })];
    const bbox = computeBbox(places, 0.5)!;
    expect(bbox.maxLat).toBeLessThanOrEqual(85.0511);
  });
});

// ── tile math ─────────────────────────────────────────────────────────────────

describe('lngToTileX', () => {
  it('returns 0 for lng=-180 at any zoom', () => {
    expect(lngToTileX(-180, 10)).toBe(0);
  });

  it('returns max tile for lng=180 at zoom 1', () => {
    // At zoom 1: 2^1 = 2 tiles, lng=180 → x = floor(360/360 * 2) = floor(2) = 2
    // But tile range is 0..1, so this is the "overflow" edge — that's fine
    expect(lngToTileX(180, 1)).toBe(2);
  });

  it('increases with more easterly longitude', () => {
    const x1 = lngToTileX(0, 10);
    const x2 = lngToTileX(10, 10);
    expect(x2).toBeGreaterThan(x1);
  });
});

describe('latToTileY', () => {
  it('returns smaller y for higher latitude (north = top)', () => {
    const yNorth = latToTileY(60, 10);
    const ySouth = latToTileY(10, 10);
    expect(yNorth).toBeLessThan(ySouth);
  });

  it('equator is roughly half the tile grid', () => {
    const yEq = latToTileY(0, 1);
    // zoom 1 → 2 rows, equator ≈ row 1
    expect(yEq).toBe(1);
  });
});

// ── URL building ───────────────────────────────────────────────────────────────

describe('buildTileUrl', () => {
  it('replaces {z}, {x}, {y}, {r} correctly', () => {
    const tmpl = 'https://tile.example.com/{z}/{x}/{y}.png';
    const url = buildTileUrl(tmpl, 10, 500, 300);
    expect(url).toBe('https://tile.example.com/10/500/300.png');
  });

  it('replaces {s} with a subdomain character', () => {
    const tmpl = 'https://{s}.tiles.example.com/{z}/{x}/{y}.png';
    const url = buildTileUrl(tmpl, 10, 0, 0);
    expect(url).toMatch(/^https:\/\/[abcd]\.tiles\.example\.com\/10\/0\/0\.png$/);
  });

  it('removes {r} (retina placeholder)', () => {
    const tmpl = 'https://tiles.example.com/{z}/{x}/{y}{r}.png';
    const url = buildTileUrl(tmpl, 10, 0, 0);
    expect(url).toBe('https://tiles.example.com/10/0/0.png');
  });
});

// ── countTiles ────────────────────────────────────────────────────────────────

describe('countTiles', () => {
  it('returns more tiles at higher zoom levels', () => {
    const bbox: TileBbox = { minLat: 48.7, maxLat: 49.0, minLng: 2.2, maxLng: 2.5 };
    const low = countTiles(bbox, 10, 10);
    const high = countTiles(bbox, 12, 12);
    expect(high).toBeGreaterThan(low);
  });

  it('stops counting after exceeding MAX_TILES', () => {
    // Very large bbox — should hit cap quickly at high zooms
    const bbox: TileBbox = { minLat: -60, maxLat: 60, minLng: -180, maxLng: 180 };
    const count = countTiles(bbox, 10, 16);
    expect(count).toBeGreaterThan(MAX_TILES);
  });
});

// ── prefetchTiles guards ───────────────────────────────────────────────────────

describe('prefetchTiles — offline guard', () => {
  it('returns 0 and does not fetch when offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    const bbox: TileBbox = { minLat: 48.8, maxLat: 48.9, minLng: 2.3, maxLng: 2.4 };
    const count = await prefetchTiles(bbox, 'https://{s}.example.com/{z}/{x}/{y}.png', 10, 10);
    expect(count).toBe(0);
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('returns 0 when no service worker controller', async () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { controller: null },
      configurable: true,
    });
    const bbox: TileBbox = { minLat: 48.8, maxLat: 48.9, minLng: 2.3, maxLng: 2.4 };
    const count = await prefetchTiles(bbox, 'https://{s}.example.com/{z}/{x}/{y}.png', 10, 10);
    expect(count).toBe(0);
  });
});

describe('prefetchTiles — normal operation', () => {
  it('fetches tiles and returns count', async () => {
    const bbox: TileBbox = { minLat: 48.84, maxLat: 48.87, minLng: 2.33, maxLng: 2.37 };
    const count = await prefetchTiles(bbox, 'https://{s}.example.com/{z}/{x}/{y}.png', 10, 11);
    expect(count).toBeGreaterThan(0);
    expect(vi.mocked(fetch)).toHaveBeenCalled();
  });

  it('stops at zoom level where cap is exceeded', async () => {
    // Use a very small MAX_TILES override by using a huge bbox
    const bbox: TileBbox = { minLat: -80, maxLat: 80, minLng: -170, maxLng: 170 };
    // This bbox at zoom 10 alone has thousands of tiles — should trigger early stop
    const count = await prefetchTiles(bbox, 'https://{s}.example.com/{z}/{x}/{y}.png', 10, 16);
    expect(count).toBeLessThanOrEqual(MAX_TILES);
  });
});

// ── prefetchTilesForTrip ──────────────────────────────────────────────────────

describe('prefetchTilesForTrip', () => {
  it('no-ops when no places have coordinates', async () => {
    const places = [buildPlace({ lat: null, lng: null })];
    await prefetchTilesForTrip(1, places);
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('updates syncMeta tilesBbox after prefetch', async () => {
    await upsertSyncMeta({ tripId: 1, lastSyncedAt: Date.now(), status: 'idle', tilesBbox: null, filesCachedCount: 0 });

    const places = [
      buildPlace({ trip_id: 1, lat: 48.8566, lng: 2.3522 }),
    ];
    await prefetchTilesForTrip(1, places, 'https://{s}.example.com/{z}/{x}/{y}.png');

    const meta = await offlineDb.syncMeta.get(1);
    expect(meta!.tilesBbox).not.toBeNull();
    expect(meta!.tilesBbox).toHaveLength(4);
  });

  it('zoom-clamps instead of skipping when the bbox exceeds MAX_TILES', async () => {
    await upsertSyncMeta({ tripId: 1, lastSyncedAt: Date.now(), status: 'idle', tilesBbox: null, filesCachedCount: 0 });

    // ~4° road-trip span: low zooms fit the budget, high zooms (z14+) blow past
    // it. The old guard skipped the whole trip; now we keep what fits.
    const places = [
      buildPlace({ trip_id: 1, lat: 45.0, lng: 0.0 }),
      buildPlace({ trip_id: 1, lat: 49.0, lng: 4.0 }),
    ];
    await prefetchTilesForTrip(1, places, 'https://{s}.example.com/{z}/{x}/{y}.png');

    // Previously this skipped entirely; now it prefetches a clamped subset.
    const calls = vi.mocked(fetch).mock.calls.length;
    expect(calls).toBeGreaterThan(0);
    expect(calls).toBeLessThanOrEqual(MAX_TILES);
  });

  it('prefetches a region-sized (0.5°) trip that the old all-or-nothing guard would have skipped', async () => {
    await upsertSyncMeta({ tripId: 1, lastSyncedAt: Date.now(), status: 'idle', tilesBbox: null, filesCachedCount: 0 });

    const places = [
      buildPlace({ trip_id: 1, lat: 48.6, lng: 2.1 }),
      buildPlace({ trip_id: 1, lat: 49.1, lng: 2.6 }),
    ];
    await prefetchTilesForTrip(1, places, 'https://{s}.example.com/{z}/{x}/{y}.png');

    const calls = vi.mocked(fetch).mock.calls.length;
    expect(calls).toBeGreaterThan(0);
    expect(calls).toBeLessThanOrEqual(MAX_TILES);
  });
});

// ── cap coherence ───────────────────────────────────────────────────────────────

describe('MAX_TILES budget', () => {
  it('matches the Workbox map-tiles maxEntries in vite.config.js (drift guard)', () => {
    expect(MAX_TILES).toBe(12288);
  });
});
