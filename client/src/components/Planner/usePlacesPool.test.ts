// FE-PLANNER-POOL-001 to FE-PLANNER-POOL-016: the places pool's search, filters and
// multi-select behind the desktop sidebar ('exit') and the phone browser ('prune').
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildPlace } from '../../../tests/helpers/factories';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { collectionsApi } from '../../api/collections';
import { useTripStore } from '../../store/tripStore';
import {
  placesFilterTabs,
  poolHasTracks,
  usePlacesCategoryFilter,
  usePlacesPool,
  type PlacesPoolOptions,
} from './usePlacesPool';

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${JSON.stringify(params)}` : key;

let addToast: ReturnType<typeof vi.fn>;

type HookProps = Partial<PlacesPoolOptions>;

function setup(initial: HookProps = {}) {
  const places = initial.places ?? [];
  const base: PlacesPoolOptions = {
    tripId: 7,
    places,
    poolPlaces: places,
    toursEnabled: false,
    t,
    staleSelection: 'exit',
    ...initial,
  };
  return renderHook((p: HookProps) => usePlacesPool({ ...base, ...p }), { initialProps: {} as HookProps });
}

beforeEach(() => {
  resetAllStores();
  addToast = vi.fn();
  window.__addToast = addToast as unknown as typeof window.__addToast;
});

afterEach(() => {
  vi.restoreAllMocks();
  delete window.__addToast;
});

describe('places pool helpers', () => {
  it('FE-PLANNER-POOL-001: the Tracks choice needs a track and stays away while tours are on', () => {
    const track = buildPlace({ route_geometry: '[[1,2],[3,4]]' });
    const pin = buildPlace();
    expect(poolHasTracks([pin], false)).toBe(false);
    expect(poolHasTracks([pin, track], false)).toBe(true);
    expect(poolHasTracks([pin, track], undefined)).toBe(true);
    expect(poolHasTracks([pin, track], true)).toBe(false);
  });

  it('FE-PLANNER-POOL-002: the show choices list all, unplanned and planned, then tracks when there are some', () => {
    expect(placesFilterTabs(t, false)).toEqual([
      { id: 'all', label: 'places.all' },
      { id: 'unplanned', label: 'places.unplanned' },
      { id: 'planned', label: 'places.planned' },
    ]);
    expect(placesFilterTabs(t, true).map((tab) => tab.id)).toEqual(['all', 'unplanned', 'planned', 'tracks']);
    expect(placesFilterTabs(t, true)[3].label).toBe('places.filterTracks');
  });

  it('FE-PLANNER-POOL-003: the category filter toggles ids in the trip store, a new set each time', () => {
    const { result } = renderHook(() => usePlacesCategoryFilter());
    const before = result.current.categoryFilters;
    act(() => result.current.toggleCategoryFilter('3'));
    expect([...result.current.categoryFilters]).toEqual(['3']);
    expect(result.current.categoryFilters).not.toBe(before);
    act(() => result.current.toggleCategoryFilter('uncategorized'));
    act(() => result.current.toggleCategoryFilter('3'));
    expect([...useTripStore.getState().placesCategoryFilter]).toEqual(['uncategorized']);
    act(() => result.current.setCategoryFilters(new Set()));
    expect(useTripStore.getState().placesCategoryFilter.size).toBe(0);
  });
});

describe('usePlacesPool', () => {
  it('FE-PLANNER-POOL-004: reads the shared filters from the trip store and writes them back', () => {
    seedStore(useTripStore, { placesFilter: 'planned', placesRatingFilter: 4 });
    const { result } = setup();
    expect(result.current.filter).toBe('planned');
    expect(result.current.ratingFilter).toBe(4);
    act(() => result.current.setRatingFilter('all'));
    expect(useTripStore.getState().placesRatingFilter).toBe('all');
    act(() => result.current.setFilter('tracks'));
    expect(useTripStore.getState().placesFilter).toBe('tracks');
  });

  it('FE-PLANNER-POOL-005: hasTracks follows the listed places and the tours addon', () => {
    const track = buildPlace({ route_geometry: '[[1,2],[3,4]]' });
    const { result, rerender } = setup({ places: [track], poolPlaces: [] });
    expect(result.current.hasTracks).toBe(false);
    rerender({ poolPlaces: [track] });
    expect(result.current.hasTracks).toBe(true);
    rerender({ poolPlaces: [track], toursEnabled: true });
    expect(result.current.hasTracks).toBe(false);
  });

  it('FE-PLANNER-POOL-006: the select switch flips the mode and always starts an empty selection', () => {
    const { result } = setup();
    act(() => result.current.toggleSelectMode());
    expect(result.current.selectMode).toBe(true);
    act(() => result.current.toggleSelected(1));
    act(() => result.current.toggleSelected(2));
    act(() => result.current.toggleSelected(1));
    expect([...result.current.selectedIds]).toEqual([2]);
    act(() => result.current.toggleSelectMode());
    expect(result.current.selectMode).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('FE-PLANNER-POOL-007: toggleSelected keeps its identity across renders', () => {
    const { result, rerender } = setup();
    const first = result.current.toggleSelected;
    act(() => result.current.toggleSelected(5));
    rerender({});
    expect(result.current.toggleSelected).toBe(first);
  });

  it('FE-PLANNER-POOL-008: a new show choice lands in the store and drops the selection', () => {
    const { result } = setup();
    act(() => {
      result.current.setSelectMode(true);
      result.current.toggleSelected(3);
    });
    act(() => result.current.pickFilter('unplanned'));
    expect(useTripStore.getState().placesFilter).toBe('unplanned');
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.selectMode).toBe(true);
  });

  it('FE-PLANNER-POOL-009: a new search drops the selection only while picking', () => {
    const { result } = setup();
    act(() => result.current.setSelectedIds(new Set([1])));
    act(() => result.current.updateSearch('louvre'));
    expect(result.current.search).toBe('louvre');
    expect([...result.current.selectedIds]).toEqual([1]);

    act(() => {
      result.current.setSelectMode(true);
      result.current.setSelectedIds(new Set([1, 2]));
    });
    act(() => result.current.updateSearch('lou'));
    expect(result.current.search).toBe('lou');
    expect(result.current.selectedIds.size).toBe(0);

    act(() => result.current.setSelectedIds(new Set([4])));
    act(() => result.current.setSearch(''));
    expect([...result.current.selectedIds]).toEqual([4]);
  });

  it('FE-PLANNER-POOL-010: marking the selection visited reports the matches and leaves select mode', async () => {
    const mark = vi.spyOn(collectionsApi, 'setStatusFromTrip').mockResolvedValue({ updated: 2, places: 3 });
    const { result } = setup();
    act(() => {
      result.current.setSelectMode(true);
      result.current.setSelectedIds(new Set([11, 12]));
    });
    await act(async () => {
      await result.current.markSelectionVisited();
    });
    expect(mark).toHaveBeenCalledWith(7, [11, 12], 'visited');
    expect(addToast).toHaveBeenCalledWith('collections.markedVisitedTrip:{"count":3}', 'success', undefined);
    expect(result.current.selectMode).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.markVisitedBusy).toBe(false);
  });

  it('FE-PLANNER-POOL-011: nothing found in the library says so, and a missing count reads as zero', async () => {
    vi.spyOn(collectionsApi, 'setStatusFromTrip')
      .mockResolvedValueOnce({ updated: 0 })
      .mockResolvedValueOnce({ updated: 1 });
    const { result } = setup();
    act(() => result.current.setSelectedIds(new Set([11])));
    await act(async () => {
      await result.current.markSelectionVisited();
    });
    expect(addToast).toHaveBeenCalledWith('collections.markVisitedNone', 'info', undefined);

    act(() => result.current.setSelectedIds(new Set([12])));
    await act(async () => {
      await result.current.markSelectionVisited();
    });
    expect(addToast).toHaveBeenLastCalledWith('collections.markedVisitedTrip:{"count":0}', 'success', undefined);
  });

  it('FE-PLANNER-POOL-012: a failure keeps the selection for a retry', async () => {
    vi.spyOn(collectionsApi, 'setStatusFromTrip').mockRejectedValue(new Error('offline'));
    const { result } = setup();
    act(() => {
      result.current.setSelectMode(true);
      result.current.setSelectedIds(new Set([11]));
    });
    await act(async () => {
      await result.current.markSelectionVisited();
    });
    expect(addToast).toHaveBeenCalledWith('common.error', 'error', undefined);
    expect(result.current.selectMode).toBe(true);
    expect([...result.current.selectedIds]).toEqual([11]);
    expect(result.current.markVisitedBusy).toBe(false);
  });

  it('FE-PLANNER-POOL-013: an empty selection or a run in flight sends nothing more', async () => {
    let release: (v: { updated: number; places?: number }) => void = () => {};
    const mark = vi.spyOn(collectionsApi, 'setStatusFromTrip').mockReturnValue(
      new Promise<{ updated: number; places?: number }>((resolve) => {
        release = resolve;
      })
    );
    const { result } = setup();
    await act(async () => {
      await result.current.markSelectionVisited();
    });
    expect(mark).not.toHaveBeenCalled();

    act(() => result.current.setSelectedIds(new Set([11])));
    let first!: Promise<void>;
    act(() => {
      first = result.current.markSelectionVisited();
    });
    expect(result.current.markVisitedBusy).toBe(true);
    await act(async () => {
      await result.current.markSelectionVisited();
    });
    expect(mark).toHaveBeenCalledTimes(1);
    await act(async () => {
      release({ updated: 1, places: 1 });
      await first;
    });
    expect(result.current.markVisitedBusy).toBe(false);
  });

  it('FE-PLANNER-POOL-014: the desktop leaves select mode once every selected place is gone, not before', () => {
    const a = buildPlace();
    const b = buildPlace();
    const { result, rerender } = setup({ places: [a, b], staleSelection: 'exit' });
    act(() => {
      result.current.setSelectMode(true);
      result.current.setSelectedIds(new Set([a.id, b.id]));
    });
    rerender({ places: [b] });
    expect(result.current.selectMode).toBe(true);
    expect([...result.current.selectedIds]).toEqual([a.id, b.id]);
    rerender({ places: [] });
    expect(result.current.selectMode).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('FE-PLANNER-POOL-015: the desktop only looks again when the places change, and only while picking', () => {
    const a = buildPlace();
    const { result, rerender } = setup({ places: [a], staleSelection: 'exit' });
    // Not in select mode: a stale id stays where it is.
    act(() => result.current.setSelectedIds(new Set([999])));
    rerender({ places: [a, buildPlace()] });
    expect([...result.current.selectedIds]).toEqual([999]);
    // In select mode, but the places did not change since: nothing happens yet.
    act(() => result.current.setSelectMode(true));
    expect(result.current.selectMode).toBe(true);
    rerender({ places: [a] });
    expect(result.current.selectMode).toBe(false);
  });

  it('FE-PLANNER-POOL-016: the phone drops the ids that are gone and stays in select mode', () => {
    const a = buildPlace();
    const b = buildPlace();
    const { result, rerender } = setup({ places: [a, b], staleSelection: 'prune' });
    act(() => {
      result.current.setSelectMode(true);
      result.current.setSelectedIds(new Set([a.id, b.id]));
    });
    const kept = result.current.selectedIds;
    rerender({ places: [a, b, buildPlace()] });
    expect(result.current.selectedIds).toBe(kept);
    rerender({ places: [b] });
    expect([...result.current.selectedIds]).toEqual([b.id]);
    rerender({ places: [] });
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.selectMode).toBe(true);
    // A stale id picked up later is dropped as soon as it is in the selection.
    act(() => result.current.setSelectedIds(new Set([12345])));
    expect(result.current.selectedIds.size).toBe(0);
  });
});
