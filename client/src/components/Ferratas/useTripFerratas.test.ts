/**
 * FE-FERRATA-HOOK-001 to FE-FERRATA-HOOK-010: when the via ferrata layer asks
 * the server, what it keeps, and what it reports while it does.
 *
 * The requests reach a public Overpass mirror behind the server, so the hook
 * has to be frugal: nothing while the layer is off, a trip's cached tiles
 * first, then only the tiles of the shared grid that are not loaded yet, never
 * one twice, and none at all for an area the server would refuse or a device
 * that is offline.
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Ferrata, FerrataBbox, FerratasResponse } from '@trek/shared';

import { useNetworkMode } from '../../hooks/useNetworkMode';
import { ferrataRepo } from '../../repo/ferrataRepo';
import { FERRATA_AREA_PREFETCH_MAX_TILES, useTripFerratas } from './useTripFerratas';

vi.mock('../../repo/ferrataRepo', () => ({
  ferrataRepo: { list: vi.fn(), cachedTiles: vi.fn(), saveTiles: vi.fn(), cacheName: vi.fn(() => 'trek-offline') },
}));
vi.mock('../../hooks/useNetworkMode', () => ({ useNetworkMode: vi.fn() }));

/** Exactly the tile 930:236. */
const TILE: FerrataBbox = { south: 46.5, west: 11.8, north: 46.55, east: 11.85 };
const TILE_PARAM = '46.500,11.800,46.550,11.850';
/** The first block of the ring around it, south west of it: the ring goes out a 0.1 degree block at a time. */
const RING_FIRST_PARAM = '46.450,11.750,46.500,11.800';
/** A view inside the same tile, after a small pan. */
const INSIDE: FerrataBbox = { south: 46.51, west: 11.81, north: 46.54, east: 11.84 };
const WIDE: FerrataBbox = { south: 46, west: 11, north: 47, east: 12 };

const FERRATA: Ferrata = {
  id: 'way/42',
  name: 'Via delle Trincee',
  grade: { raw: '4', level: 4, plus: null },
  routeName: null,
  geometry: [
    [46.52, 11.82],
    [46.53, 11.82],
  ],
  osmUrl: 'https://www.openstreetmap.org/way/42',
};

const reply = (ferratas: Ferrata[] = [FERRATA]): FerratasResponse => ({
  ferratas,
  truncated: false,
  source: 'openstreetmap',
  attribution: '© OpenStreetMap contributors',
});

const network = (offline: boolean) =>
  vi.mocked(useNetworkMode).mockReturnValue({ offline, forced: false, setForced: vi.fn() });

const params = () => vi.mocked(ferrataRepo.list).mock.calls.map(([, bbox]) => bbox);

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  network(false);
  vi.mocked(ferrataRepo.list).mockResolvedValue(reply());
  vi.mocked(ferrataRepo.cachedTiles).mockResolvedValue([]);
  vi.mocked(ferrataRepo.saveTiles).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

/** Lets the cache read and settled requests run their handlers. */
async function drain() {
  await act(async () => {
    // Enough turns for the prefetches, which go out one after another, to settle too.
    for (let i = 0; i < 40; i += 1) await Promise.resolve();
  });
}

/** Lets the debounce run out, then everything it started settle. */
async function settle(ms = 200) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
  await drain();
}

describe('useTripFerratas', () => {
  it('FE-FERRATA-HOOK-001: reads and asks for nothing while the layer is off', async () => {
    const { result } = renderHook(() => useTripFerratas(7, TILE, false));
    await settle(1_000);

    expect(ferrataRepo.cachedTiles).not.toHaveBeenCalled();
    expect(ferrataRepo.list).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('FE-FERRATA-HOOK-002: switched on, asks for the missing tiles of the view after the debounce, then the ring', async () => {
    const { result } = renderHook(() => useTripFerratas(7, TILE, true));
    await drain();
    expect(ferrataRepo.cachedTiles).toHaveBeenCalledWith(7);
    expect(ferrataRepo.list).not.toHaveBeenCalled();
    expect(result.current.status).toBe('loading');

    await settle();
    expect(params()[0]).toBe(TILE_PARAM);
    expect(params().slice(1)).toContain(RING_FIRST_PARAM);
    expect(vi.mocked(ferrataRepo.list).mock.calls[0]?.[0]).toBe(7);
    expect(result.current.status).toBe('ready');
    expect(result.current.ferratas).toEqual([FERRATA]);
    expect(ferrataRepo.saveTiles).toHaveBeenCalledWith(7, expect.any(Array), 'trek-offline');
  });

  it('FE-FERRATA-HOOK-003: draws the cached tiles at once and does not ask for them again', async () => {
    vi.mocked(ferrataRepo.cachedTiles).mockResolvedValue([{ tile: '930:236', fetchedAt: 1, ferratas: [FERRATA] }]);
    const { result } = renderHook(() => useTripFerratas(7, TILE, true));
    await drain();

    expect(result.current.status).toBe('ready');
    expect(result.current.ferratas).toEqual([FERRATA]);
    await settle();
    expect(params()).not.toContain(TILE_PARAM);
  });

  it('FE-FERRATA-HOOK-004: a pan inside loaded tiles asks for nothing, and keeps every line drawn', async () => {
    const { result, rerender } = renderHook(({ view }) => useTripFerratas(7, view, true), {
      initialProps: { view: TILE },
    });
    await settle();
    const asked = params().length;

    rerender({ view: INSIDE });
    await settle();
    expect(params()).toHaveLength(asked);
    expect(result.current.ferratas).toEqual([FERRATA]);
    expect(result.current.status).toBe('ready');
  });

  it('FE-FERRATA-HOOK-005: a fast pan ends in one request for where the map stopped', async () => {
    const { rerender } = renderHook(({ view }) => useTripFerratas(7, view, true), {
      initialProps: { view: { south: 47, west: 11.8, north: 47.05, east: 11.85 } },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    rerender({ view: TILE });
    await settle();
    expect(params()[0]).toBe(TILE_PARAM);
  });

  it('FE-FERRATA-HOOK-006: offline it asks for nothing and still draws what the device kept', async () => {
    network(true);
    vi.mocked(ferrataRepo.cachedTiles).mockResolvedValue([{ tile: '930:236', fetchedAt: 1, ferratas: [FERRATA] }]);
    const { result } = renderHook(() => useTripFerratas(7, TILE, true));
    await settle(1_000);

    expect(ferrataRepo.list).not.toHaveBeenCalled();
    expect(result.current.status).toBe('offline');
    expect(result.current.ferratas).toEqual([FERRATA]);
  });

  it('FE-FERRATA-HOOK-007: a view wider than the server takes reads as zoom in and asks for nothing', async () => {
    const { result } = renderHook(() => useTripFerratas(7, WIDE, true));
    await settle(1_000);

    expect(ferrataRepo.list).not.toHaveBeenCalled();
    expect(result.current.status).toBe('tooLarge');
  });

  it('FE-FERRATA-HOOK-008: reports the mirrors failing as an error and a refused box as zoom in', async () => {
    vi.mocked(ferrataRepo.list).mockRejectedValue(new Error('502'));
    const { result, rerender } = renderHook(({ view }) => useTripFerratas(7, view, true), {
      initialProps: { view: TILE },
    });
    await settle();
    expect(result.current.status).toBe('error');

    vi.mocked(ferrataRepo.list).mockRejectedValue({ response: { status: 400 } });
    rerender({ view: { south: 47, west: 11.8, north: 47.05, east: 11.85 } });
    await settle();
    expect(result.current.status).toBe('tooLarge');
  });

  it('FE-FERRATA-HOOK-009: switched off and on again asks for no tile it already has', async () => {
    const { result, rerender } = renderHook(({ on }) => useTripFerratas(7, TILE, on), {
      initialProps: { on: true },
    });
    await settle();
    const asked = params().length;

    rerender({ on: false });
    expect(result.current.status).toBe('idle');
    rerender({ on: true });
    await settle();
    expect(params()).toHaveLength(asked);
    expect(ferrataRepo.cachedTiles).toHaveBeenCalledTimes(1);
    expect(result.current.ferratas).toEqual([FERRATA]);
    expect(result.current.status).toBe('ready');
  });

  it("FE-FERRATA-HOOK-010: prefetches the trip's area in the background, but not one wider than the cap", async () => {
    const area: FerrataBbox = { south: 46.0, west: 11.0, north: 46.1, east: 11.1 };
    const first = renderHook(() => useTripFerratas(7, TILE, true, area));
    await settle();
    expect(params()).toContain('46.000,11.000,46.100,11.100');
    first.unmount();

    vi.mocked(ferrataRepo.list).mockClear();
    // 2 by 2 degrees is 1600 tiles, past FERRATA_AREA_PREFETCH_MAX_TILES.
    expect(FERRATA_AREA_PREFETCH_MAX_TILES).toBeLessThan(1600);
    renderHook(() => useTripFerratas(8, null, true, { south: 44, west: 10, north: 46, east: 12 }));
    await settle(1_000);
    expect(ferrataRepo.list).not.toHaveBeenCalled();
  });
});
