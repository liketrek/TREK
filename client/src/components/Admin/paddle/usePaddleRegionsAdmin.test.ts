/**
 * FE-HOOK-PADDLEREGIONS-001 to FE-HOOK-PADDLEREGIONS-014: the paddle regions in
 * the admin area (PAD-05A), the one hook the desktop and the phone admin render
 * through PaddleRegionsPanel. The repo is mocked; its error codes and its
 * offline error stay the real ones, and the strings are the English ones.
 * FE-PADDLEREGIONSMODEL-001: the model's helpers for the list and its badges.
 */
import { act, renderHook } from '@testing-library/react';
import type { PaddleRegion, PaddleRegionCatalogEntry } from '@trek/shared';
import { createElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetAllStores, seedStore } from '../../../../tests/helpers/store';
import { TranslationProvider } from '../../../i18n/TranslationContext';
import { PaddleRegionsOfflineError } from '../../../repo/paddleRegionRepo';
import { useAddonStore } from '../../../store/addonStore';
import { setForcedOffline } from '../../../sync/networkMode';
import { isReading, progressPercent, regionStatusTone } from './paddleRegionsModel';
import { CATALOG_SEARCH_DEBOUNCE_MS, PADDLE_REGIONS_POLL_MS, usePaddleRegionsAdmin } from './usePaddleRegionsAdmin';

const repo = vi.hoisted(() => ({
  list: vi.fn<() => Promise<PaddleRegion[]>>(),
  catalog: vi.fn<(q: string, signal?: AbortSignal) => Promise<PaddleRegionCatalogEntry[]>>(),
  add: vi.fn<(id: string) => Promise<PaddleRegion>>(),
  refresh: vi.fn<(id: string) => Promise<PaddleRegion>>(),
  remove: vi.fn<(id: string) => Promise<{ success: true }>>(),
}));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../../../repo/paddleRegionRepo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../repo/paddleRegionRepo')>()),
  paddleRegionRepo: repo,
}));
vi.mock('../../shared/Toast', () => ({ useToast: () => toast }));

const OFFLINE = 'Regions can only be managed with a connection.';

/** A region as the server lists it. */
function region(id: string, status: PaddleRegion['status'], over: Partial<PaddleRegion> = {}): PaddleRegion {
  return {
    id,
    name: id,
    status,
    source_timestamp: null,
    imported_at: null,
    feature_count: 0,
    error: null,
    progress: null,
    ...over,
  };
}

/** A region in Geofabrik's list. */
function hit(id: string, name: string, ...path: string[]): PaddleRegionCatalogEntry {
  return { id, name, path };
}

const READY = region('oberbayern', 'ready', { source_timestamp: '2026-10-01T20:21:00Z', feature_count: 412 });
const FAILED = region('niederbayern', 'failed', { error: 'Download failed' });
const QUEUED = region('oberpfalz', 'queued');
const IMPORTING = region('oberpfalz', 'importing', { progress: { phase: 'read', fraction: 0.4 } });
const DONE = region('oberpfalz', 'ready', { source_timestamp: '2026-10-15T20:21:00Z', feature_count: 87 });
const HIT = hit('oberpfalz', 'Oberpfalz', 'Europe', 'Germany', 'Bayern');
const OBERBAYERN_HIT = hit('oberbayern', 'Oberbayern', 'Europe', 'Germany', 'Bayern');

/** An axios error as the server answers it: its message and, for some, a code. */
function apiError(error: string, code?: string) {
  return { response: { data: { error, code } } };
}

/** A promise the test settles itself, to look at the hook while a call is out. */
function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

/** Lets the clock run on and every answer due by then arrive. */
async function settle(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

const wrapper = ({ children }: { children: ReactNode }) => createElement(TranslationProvider, null, children);

async function mount() {
  const hook = renderHook(() => usePaddleRegionsAdmin(), { wrapper });
  await settle();
  return hook;
}

function seedTours() {
  seedStore(useAddonStore, { addons: [{ id: 'tours', enabled: true }] });
}

beforeEach(() => {
  vi.useFakeTimers();
  resetAllStores();
  seedTours();
  toast.success.mockReset();
  toast.error.mockReset();
  repo.list.mockReset().mockResolvedValue([READY]);
  repo.catalog.mockReset().mockResolvedValue([HIT]);
  repo.add.mockReset().mockResolvedValue(QUEUED);
  repo.refresh.mockReset().mockResolvedValue(READY);
  repo.remove.mockReset().mockResolvedValue({ success: true });
});
afterEach(() => {
  act(() => setForcedOffline(false));
  vi.useRealTimers();
});

describe('usePaddleRegionsAdmin', () => {
  it('FE-HOOK-PADDLEREGIONS-001: asks nothing while the Tours addon is off, and loads once it is switched on', async () => {
    seedStore(useAddonStore, { addons: [] });
    const { result } = await mount();
    await settle(PADDLE_REGIONS_POLL_MS * 2);
    expect(result.current.toursOn).toBe(false);
    expect(repo.list).not.toHaveBeenCalled();

    act(() => seedTours());
    await settle();
    expect(result.current.toursOn).toBe(true);
    expect(repo.list).toHaveBeenCalledTimes(1);
    expect(result.current.regions).toEqual([READY]);
  });

  it('FE-HOOK-PADDLEREGIONS-002: loads the list, knows which regions are added and asks no more while none is read', async () => {
    repo.list.mockResolvedValue([READY, FAILED]);
    const { result } = renderHook(() => usePaddleRegionsAdmin(), { wrapper });
    expect(result.current).toMatchObject({ toursOn: true, offline: false, loading: true, regions: [], error: null });

    await settle();
    expect(result.current).toMatchObject({ loading: false, regions: [READY, FAILED], error: null, busyId: null });
    expect([...result.current.added]).toEqual(['oberbayern', 'niederbayern']);
    expect(result.current.removing).toBeNull();
    await settle(PADDLE_REGIONS_POLL_MS * 3);
    expect(repo.list).toHaveBeenCalledTimes(1);
  });

  it('FE-HOOK-PADDLEREGIONS-003: asks again on every poll while a region waits or is read, and stops once all are ready', async () => {
    repo.list
      .mockResolvedValueOnce([READY, QUEUED])
      .mockResolvedValueOnce([READY, IMPORTING])
      .mockResolvedValue([READY, DONE]);
    const { result } = await mount();
    expect(repo.list).toHaveBeenCalledTimes(1);

    await settle(PADDLE_REGIONS_POLL_MS - 1);
    expect(repo.list).toHaveBeenCalledTimes(1);
    await settle(1);
    expect(repo.list).toHaveBeenCalledTimes(2);
    expect(result.current.regions).toEqual([READY, IMPORTING]);

    await settle(PADDLE_REGIONS_POLL_MS);
    expect(repo.list).toHaveBeenCalledTimes(3);
    expect(result.current.regions).toEqual([READY, DONE]);
    await settle(PADDLE_REGIONS_POLL_MS * 5);
    expect(repo.list).toHaveBeenCalledTimes(3);
  });

  it('FE-HOOK-PADDLEREGIONS-004: a failed poll shows the error and keeps the regions; the next answer clears it', async () => {
    repo.list
      .mockResolvedValueOnce([QUEUED])
      .mockRejectedValueOnce(apiError('Database is locked'))
      .mockResolvedValue([DONE]);
    const { result } = await mount();
    await settle(PADDLE_REGIONS_POLL_MS);
    expect(result.current).toMatchObject({ error: 'Database is locked', regions: [QUEUED], loading: false });

    await settle(PADDLE_REGIONS_POLL_MS);
    expect(result.current).toMatchObject({ error: null, regions: [DONE] });
    await settle(PADDLE_REGIONS_POLL_MS * 3);
    expect(repo.list).toHaveBeenCalledTimes(3);
  });

  it('FE-HOOK-PADDLEREGIONS-005: names why the list failed, offline or unknown, and a retry clears it', async () => {
    repo.list
      .mockRejectedValueOnce(new PaddleRegionsOfflineError())
      .mockRejectedValueOnce('socket hang up')
      .mockResolvedValue([READY]);
    const { result } = await mount();
    expect(result.current).toMatchObject({ error: OFFLINE, loading: false, regions: [] });

    await act(() => result.current.retry());
    expect(result.current.error).toBe('Error');

    await act(() => result.current.retry());
    expect(result.current).toMatchObject({ error: null, regions: [READY] });
  });

  it('FE-HOOK-PADDLEREGIONS-006: searches Geofabrik only from two characters and once the typing rests', async () => {
    const { result } = await mount();
    act(() => result.current.search.setQuery(' o '));
    await settle(CATALOG_SEARCH_DEBOUNCE_MS * 3);
    expect(repo.catalog).not.toHaveBeenCalled();
    expect(result.current.search).toMatchObject({ query: ' o ', hits: null, searching: false, error: null });

    act(() => result.current.search.setQuery(' ob'));
    expect(result.current.search.searching).toBe(true);
    await settle(CATALOG_SEARCH_DEBOUNCE_MS - 1);
    act(() => result.current.search.setQuery(' obe'));
    await settle(CATALOG_SEARCH_DEBOUNCE_MS - 1);
    expect(repo.catalog).not.toHaveBeenCalled();

    await settle(1);
    expect(repo.catalog).toHaveBeenCalledTimes(1);
    expect(repo.catalog).toHaveBeenCalledWith('obe', expect.any(AbortSignal));
    expect(result.current.search).toMatchObject({ query: ' obe', hits: [HIT], searching: false, error: null });
  });

  it('FE-HOOK-PADDLEREGIONS-007: the answer for the words typed last wins, an older one arriving late is dropped', async () => {
    const first = deferred<PaddleRegionCatalogEntry[]>();
    const second = deferred<PaddleRegionCatalogEntry[]>();
    repo.catalog.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result } = await mount();
    act(() => result.current.search.setQuery('ober'));
    await settle(CATALOG_SEARCH_DEBOUNCE_MS);
    act(() => result.current.search.setQuery('oberpf'));
    await settle(CATALOG_SEARCH_DEBOUNCE_MS);
    expect(repo.catalog.mock.calls.map(([q]) => q)).toEqual(['ober', 'oberpf']);
    expect(repo.catalog.mock.calls[0][1]?.aborted).toBe(true);

    first.resolve([OBERBAYERN_HIT, HIT]);
    await settle();
    expect(result.current.search).toMatchObject({ hits: null, searching: true });

    second.resolve([HIT]);
    await settle();
    expect(result.current.search).toMatchObject({ query: 'oberpf', hits: [HIT], searching: false });
  });

  it('FE-HOOK-PADDLEREGIONS-008: says when Geofabrik cannot be reached, until the words are too short to search', async () => {
    repo.catalog.mockRejectedValueOnce(apiError('Geofabrik did not answer', 'catalog_unavailable'));
    const { result } = await mount();
    act(() => result.current.search.setQuery('oberpfalz'));
    await settle(CATALOG_SEARCH_DEBOUNCE_MS);
    expect(result.current.search).toMatchObject({
      hits: null,
      searching: false,
      error: 'Geofabrik cannot be reached right now. Try again later.',
    });

    act(() => result.current.search.setQuery('o'));
    expect(result.current.search.error).toBeNull();
  });

  it('FE-HOOK-PADDLEREGIONS-009: adding a region clears the search, says so and lists it', async () => {
    repo.list.mockResolvedValueOnce([READY]).mockResolvedValue([READY, QUEUED]);
    const { result } = await mount();
    act(() => result.current.search.setQuery('oberpfalz'));
    await settle(CATALOG_SEARCH_DEBOUNCE_MS);
    expect(result.current.added.has('oberpfalz')).toBe(false);

    await act(() => result.current.add('oberpfalz'));
    expect(repo.add).toHaveBeenCalledWith('oberpfalz');
    expect(toast.success).toHaveBeenCalledWith('Region added. TREK reads it in the background.');
    expect(toast.error).not.toHaveBeenCalled();
    expect(result.current.search).toMatchObject({ query: '', hits: null, searching: false });
    expect(repo.list).toHaveBeenCalledTimes(2);
    expect(result.current.regions).toEqual([READY, QUEUED]);
    expect(result.current.added.has('oberpfalz')).toBe(true);
    expect(result.current.busyId).toBeNull();
  });

  it('FE-HOOK-PADDLEREGIONS-010: a refused add shows the server message and keeps the words typed', async () => {
    repo.add.mockRejectedValueOnce(apiError('Geofabrik has no region oberpfalz-nord', 'unknown_region'));
    const { result } = await mount();
    act(() => result.current.search.setQuery('oberpfalz-nord'));
    await act(() => result.current.add('oberpfalz-nord'));
    expect(toast.error).toHaveBeenCalledWith('Geofabrik has no region oberpfalz-nord');
    expect(toast.success).not.toHaveBeenCalled();
    expect(result.current.search.query).toBe('oberpfalz-nord');
    expect(repo.list).toHaveBeenCalledTimes(2);
    expect(result.current.busyId).toBeNull();
  });

  it('FE-HOOK-PADDLEREGIONS-011: reading a region again asks quietly and reloads the list; a failure says why', async () => {
    const { result } = await mount();
    await act(() => result.current.refresh('oberbayern'));
    expect(repo.refresh).toHaveBeenCalledWith('oberbayern');
    expect(toast.success).not.toHaveBeenCalled();
    expect(repo.list).toHaveBeenCalledTimes(2);

    repo.refresh.mockRejectedValueOnce(new PaddleRegionsOfflineError());
    await act(() => result.current.refresh('oberbayern'));
    expect(toast.error).toHaveBeenCalledWith(OFFLINE);
    expect(repo.list).toHaveBeenCalledTimes(3);
  });

  it('FE-HOOK-PADDLEREGIONS-012: removes a region only once the removal is confirmed', async () => {
    const { result } = await mount();
    act(() => result.current.askRemove(READY));
    expect(result.current.removing).toEqual(READY);
    act(() => result.current.cancelRemove());
    expect(result.current.removing).toBeNull();
    act(() => result.current.confirmRemove());
    expect(repo.remove).not.toHaveBeenCalled();
    expect(repo.list).toHaveBeenCalledTimes(1);

    repo.list.mockResolvedValue([]);
    act(() => result.current.askRemove(READY));
    act(() => result.current.confirmRemove());
    expect(repo.remove).toHaveBeenCalledWith('oberbayern');
    expect(result.current).toMatchObject({ removing: null, busyId: 'oberbayern' });

    await settle();
    expect(toast.success).toHaveBeenCalledWith('Region removed');
    expect(result.current).toMatchObject({ busyId: null, regions: [] });
    expect(result.current.added.size).toBe(0);
  });

  it('FE-HOOK-PADDLEREGIONS-013: while one action runs, a second one is ignored', async () => {
    const reading = deferred<PaddleRegion>();
    repo.refresh.mockReturnValueOnce(reading.promise);
    const { result } = await mount();
    act(() => {
      void result.current.refresh('oberbayern');
    });
    expect(result.current.busyId).toBe('oberbayern');

    await act(() => result.current.add('oberpfalz'));
    act(() => result.current.askRemove(READY));
    act(() => result.current.confirmRemove());
    expect(repo.add).not.toHaveBeenCalled();
    expect(repo.remove).not.toHaveBeenCalled();
    expect(repo.refresh).toHaveBeenCalledTimes(1);
    expect(result.current.busyId).toBe('oberbayern');

    reading.resolve(READY);
    await settle();
    expect(result.current.busyId).toBeNull();
    expect(repo.list).toHaveBeenCalledTimes(2);

    await act(() => result.current.add('oberpfalz'));
    expect(repo.add).toHaveBeenCalledWith('oberpfalz');
  });

  it('FE-HOOK-PADDLEREGIONS-014: offline it asks nothing and shows no spinner, and picks up again with the connection', async () => {
    repo.list.mockResolvedValue([QUEUED]);
    setForcedOffline(true);
    const { result } = await mount();
    expect(result.current).toMatchObject({ offline: true, loading: false, regions: [], error: null });
    act(() => result.current.search.setQuery('oberpfalz'));
    await settle(CATALOG_SEARCH_DEBOUNCE_MS * 3);
    expect(repo.list).not.toHaveBeenCalled();
    expect(repo.catalog).not.toHaveBeenCalled();
    expect(result.current.search).toMatchObject({ hits: null, searching: false, error: null });

    act(() => setForcedOffline(false));
    await settle(CATALOG_SEARCH_DEBOUNCE_MS);
    expect(result.current.offline).toBe(false);
    expect(repo.list).toHaveBeenCalledTimes(1);
    expect(repo.catalog).toHaveBeenCalledWith('oberpfalz', expect.any(AbortSignal));
    expect(result.current.search.hits).toEqual([HIT]);

    act(() => setForcedOffline(true));
    await settle(PADDLE_REGIONS_POLL_MS * 4);
    expect(repo.list).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.search.hits).toBeNull();

    act(() => setForcedOffline(false));
    await settle();
    expect(repo.list).toHaveBeenCalledTimes(2);
  });
});

describe('paddleRegionsModel', () => {
  it('FE-PADDLEREGIONSMODEL-001: waits on queued and importing reads, tones the badge by status and rounds the progress', () => {
    const statuses: PaddleRegion['status'][] = ['queued', 'importing', 'ready', 'failed'];
    expect(statuses.map((status) => isReading({ status }))).toEqual([true, true, false, false]);
    expect(statuses.map((status) => regionStatusTone(status))).toEqual(['neutral', 'accent', 'success', 'danger']);
    expect(progressPercent({ progress: null })).toBeNull();
    expect(progressPercent({ progress: { phase: 'download', fraction: null } })).toBeNull();
    expect(progressPercent({ progress: { phase: 'read', fraction: 0.456 } })).toBe(46);
    expect(progressPercent({ progress: { phase: 'read', fraction: 1 } })).toBe(100);
  });
});
