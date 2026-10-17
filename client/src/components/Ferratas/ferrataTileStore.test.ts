/**
 * FE-FERRATA-TILES-001 to FE-FERRATA-TILES-012: the per-trip tile store behind
 * the via ferrata layer.
 *
 * Pinned: nothing goes out before the device cache was read, a tile is asked
 * for once and never dropped, the view goes before any prefetch and runs
 * beside one on its way rather than behind it, answers are
 * kept per tile, the view's failures are reported and retried, and a stop
 * calls off what is on its way but keeps what is loaded.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Ferrata, FerrataBbox, FerratasResponse } from '@trek/shared';

import type { FerrataTileRow } from '../../repo/ferrataRepo';
import { FerrataTileStore, ferrataRowsOf } from './ferrataTileStore';

const ferrata = (id: number, lat: number, lng: number, lat2 = lat + 0.01, lng2 = lng): Ferrata => ({
  id: `way/${id}`,
  name: `Ferrata ${id}`,
  grade: { raw: '3', level: 3, plus: null },
  routeName: null,
  geometry: [
    [lat, lng],
    [lat2, lng2],
  ],
  osmUrl: `https://www.openstreetmap.org/way/${id}`,
});

const reply = (ferratas: Ferrata[], truncated = false): FerratasResponse => ({
  ferratas,
  truncated,
  source: 'openstreetmap',
  attribution: '© OpenStreetMap contributors',
});

interface Call {
  bbox: FerrataBbox;
  signal: AbortSignal;
  resolve: (value: FerratasResponse) => void;
  reject: (error: unknown) => void;
}

function harness(options: { persist?: boolean } = {}) {
  const calls: Call[] = [];
  const persisted: FerrataTileRow[][] = [];
  const fetch = vi.fn(
    (bbox: FerrataBbox, signal: AbortSignal) =>
      new Promise<FerratasResponse>((resolve, reject) => calls.push({ bbox, signal, resolve, reject }))
  );
  const persist = vi.fn((rows: FerrataTileRow[]) => {
    persisted.push(rows);
    return Promise.resolve();
  });
  const store = new FerrataTileStore({
    fetch,
    persist: options.persist === false ? undefined : persist,
    now: () => 1_000,
    retryDelaysMs: [100, 200],
  });
  return { store, calls, fetch, persist, persisted };
}

/** Lets a settled fetch's handlers run. */
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const A = { row: 930, col: 236 }; // 46.50 to 46.55, 11.80 to 11.85
const B = { row: 930, col: 237 };
const FAR = { row: 940, col: 236 };

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('FerrataTileStore', () => {
  it('FE-FERRATA-TILES-001: asks for nothing before the cache was read, and nothing the cache already had', () => {
    const { store, fetch } = harness();
    expect(store.beginHydration()).toBe(true);
    expect(store.beginHydration()).toBe(false);
    store.want([A, B], 'visible');
    expect(fetch).not.toHaveBeenCalled();
    expect(store.getSnapshot().waiting.size).toBe(2);

    const cached = ferrata(1, 46.52, 11.82);
    store.hydrate([
      { tile: '930:236', fetchedAt: 1, ferratas: [cached] },
      { tile: '930:237', fetchedAt: 1, ferratas: [] },
    ]);
    expect(fetch).not.toHaveBeenCalled();
    const snapshot = store.getSnapshot();
    expect(snapshot.hydrated).toBe(true);
    expect([...snapshot.loaded].sort()).toEqual(['930:236', '930:237']);
    expect(snapshot.waiting.size).toBe(0);
    expect(snapshot.ferratas).toEqual([cached]);
  });

  it('FE-FERRATA-TILES-002: asks for the missing tiles in one box, keeps them, and never asks for them again', async () => {
    const { store, calls, fetch } = harness();
    store.hydrate([]);
    store.want([A, B], 'visible');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(calls[0]?.bbox).toEqual({ south: 46.5, west: 11.8, north: 46.55, east: 11.9 });

    const found = ferrata(1, 46.52, 11.82);
    calls[0]?.resolve(reply([found]));
    await flush();
    expect(store.getSnapshot().ferratas).toEqual([found]);
    expect(store.getSnapshot().loaded.has('930:237')).toBe(true);

    store.want([A, B], 'visible');
    store.want([A], 'background');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('FE-FERRATA-TILES-003: keeps every ferrata it ever loaded, a later answer adding to them by id', async () => {
    const { store, calls } = harness();
    store.hydrate([]);
    store.want([A], 'visible');
    calls[0]?.resolve(reply([ferrata(1, 46.52, 11.82)]));
    await flush();
    store.want([FAR], 'visible');
    // The same way again, as a tile across its end returns it, and one more.
    calls[1]?.resolve(reply([ferrata(1, 46.52, 11.82), ferrata(2, 47.01, 11.82)]));
    await flush();
    expect(store.getSnapshot().ferratas.map((f) => f.id)).toEqual(['way/1', 'way/2']);
  });

  it('FE-FERRATA-TILES-004: the view goes out beside a prefetch on its way, and prefetches go one at a time', async () => {
    const { store, calls } = harness();
    store.hydrate([]);
    store.want([A], 'background');
    store.want([FAR], 'background');
    expect(calls).toHaveLength(1);

    // The view does not wait for the prefetch already on its way.
    store.want([B], 'visible');
    expect(calls).toHaveLength(2);
    expect(calls[1]?.bbox).toEqual({ south: 46.5, west: 11.85, north: 46.55, east: 11.9 });
    calls[1]?.resolve(reply([]));
    await flush();
    expect(calls).toHaveLength(2);

    calls[0]?.resolve(reply([]));
    await flush();
    expect(calls[2]?.bbox.south).toBe(47);
  });

  it('FE-FERRATA-TILES-012: runs two of the view requests at once and queues the rest behind them', async () => {
    const { store, calls } = harness();
    store.hydrate([]);
    // Three blocks of the grid apart: three requests.
    store.want([A, { row: 930, col: 240 }, { row: 930, col: 244 }], 'visible');
    expect(calls).toHaveLength(2);
    calls[0]?.resolve(reply([]));
    await flush();
    expect(calls).toHaveLength(3);
    expect(calls[2]?.bbox.west).toBe(12.2);
  });

  it('FE-FERRATA-TILES-005: a tile a queued prefetch holds moves up with it when the view wants it', async () => {
    const { store, calls } = harness();
    store.hydrate([]);
    store.want([A], 'background');
    store.want([FAR], 'background');
    store.want([B], 'background');
    store.want([B], 'visible');
    expect(store.getSnapshot().waiting.has('930:237')).toBe(true);
    // Moved up, it takes the view's lane at once instead of waiting behind the other prefetches.
    expect(calls).toHaveLength(2);
    expect(calls[1]?.bbox.west).toBe(11.85);
  });

  it('FE-FERRATA-TILES-006: keeps each answer per tile, an empty tile included', async () => {
    const { store, calls, persisted } = harness();
    store.hydrate([]);
    store.want([A, B], 'visible');
    const inA = ferrata(1, 46.52, 11.82);
    calls[0]?.resolve(reply([inA]));
    await flush();
    expect(persisted).toEqual([
      [
        { tile: '930:236', fetchedAt: 1_000, ferratas: [inA] },
        { tile: '930:237', fetchedAt: 1_000, ferratas: [] },
      ],
    ]);
  });

  it('FE-FERRATA-TILES-007: reports the view failing and asks again after each delay; a 400 reads as zoom in', async () => {
    const { store, calls } = harness();
    store.hydrate([]);
    store.want([A], 'visible');
    calls[0]?.reject(new Error('502'));
    await flush();
    expect(store.getSnapshot().failure).toBe('unavailable');
    expect(store.getSnapshot().waiting.size).toBe(0);

    await vi.advanceTimersByTimeAsync(100);
    expect(calls).toHaveLength(2);
    calls[1]?.resolve(reply([]));
    await flush();
    expect(store.getSnapshot().failure).toBeNull();

    store.want([FAR], 'visible');
    calls[2]?.reject({ response: { status: 400 } });
    await flush();
    expect(store.getSnapshot().failure).toBe('refused');
    await vi.advanceTimersByTimeAsync(1_000);
    expect(calls).toHaveLength(3);
  });

  it('FE-FERRATA-TILES-008: a failed prefetch says nothing and is asked for again on the next want', async () => {
    const { store, calls } = harness();
    store.hydrate([]);
    store.want([A], 'background');
    calls[0]?.reject(new Error('502'));
    await flush();
    expect(store.getSnapshot().failure).toBeNull();
    store.want([A], 'background');
    expect(calls).toHaveLength(2);
  });

  it('FE-FERRATA-TILES-009: a stop aborts what is on its way and drops the queue, and keeps what is loaded', async () => {
    const { store, calls } = harness();
    store.hydrate([{ tile: '940:236', fetchedAt: 1, ferratas: [ferrata(9, 47.01, 11.82)] }]);
    store.want([A], 'visible');
    store.want([B], 'background');
    expect(calls).toHaveLength(2);
    store.stop();
    expect(calls.map((call) => call.signal.aborted)).toEqual([true, true]);
    calls[0]?.resolve(reply([ferrata(1, 46.52, 11.82)]));
    await flush();
    expect(calls).toHaveLength(2);
    expect(store.getSnapshot().ferratas.map((f) => f.id)).toEqual(['way/9']);
    expect(store.getSnapshot().waiting.size).toBe(0);
    // Wanted again, the tiles go out again.
    store.want([A], 'visible');
    expect(calls).toHaveLength(3);
  });

  it('FE-FERRATA-TILES-010: tells its listeners only of a change, and keeps the list while only the tiles change', async () => {
    const { store, calls } = harness({ persist: false });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.hydrate([{ tile: '940:236', fetchedAt: 1, ferratas: [ferrata(9, 47.01, 11.82)] }]);
    const first = store.getSnapshot();
    expect(listener).toHaveBeenCalledTimes(1);

    store.want([FAR], 'visible');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toBe(first);

    store.want([A], 'visible');
    calls[0]?.resolve(reply([]));
    await flush();
    expect(store.getSnapshot()).not.toBe(first);
    expect(store.getSnapshot().ferratas).toBe(first.ferratas);
    unsubscribe();
  });

  it('FE-FERRATA-TILES-011: a prefetch on its way that holds a tile of the view reports its failure as the view', async () => {
    const { store, calls } = harness();
    store.hydrate([]);
    store.want([A], 'background');
    store.want([A], 'visible');
    expect(calls).toHaveLength(1);
    expect(store.getSnapshot().waiting.has('930:236')).toBe(true);

    calls[0]?.reject(new Error('502'));
    await flush();
    expect(store.getSnapshot().failure).toBe('unavailable');
    expect(store.getSnapshot().waiting.size).toBe(0);
  });
});

describe('ferrataRowsOf', () => {
  it('gives a ferrata to every tile of the box its own line reaches into', () => {
    // From 46.52 to 46.57: across the row line at 46.55.
    const across = ferrata(1, 46.52, 11.82, 46.57, 11.82);
    const rows = ferrataRowsOf({ minRow: 930, maxRow: 931, minCol: 236, maxCol: 237 }, [across], 5);
    expect(rows.map((row) => [row.tile, row.ferratas.length])).toEqual([
      ['930:236', 1],
      ['930:237', 0],
      ['931:236', 1],
      ['931:237', 0],
    ]);
    expect(rows.every((row) => row.fetchedAt === 5)).toBe(true);
  });
});
