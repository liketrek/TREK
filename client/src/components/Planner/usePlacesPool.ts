import { useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react';

import { collectionsApi } from '../../api/collections';
import type { useTranslation } from '../../i18n';
import { useTripStore } from '../../store/tripStore';
import type { Place } from '../../types';
import { useToast } from '../shared/Toast';

/** What the pool shows: everything, what is not on a day yet, what is, or the tracks. */
export type PlacesFilter = 'all' | 'unplanned' | 'planned' | 'tracks';

type Translate = ReturnType<typeof useTranslation>['t'];

/** Whether the "Tracks" choice belongs in the pool: never while tours are on, since tracks are tours then. */
export function poolHasTracks(places: Place[], toursEnabled: boolean | undefined): boolean {
  return !toursEnabled && places.some((p) => p.route_geometry);
}

/** The "show" choices; tracks only once a place has one. */
export function placesFilterTabs(t: Translate, hasTracks: boolean) {
  const tabs: Array<{ id: PlacesFilter; label: string }> = [
    { id: 'all', label: t('places.all') },
    { id: 'unplanned', label: t('places.unplanned') },
    { id: 'planned', label: t('places.planned') },
  ];
  if (hasTracks) tabs.push({ id: 'tracks', label: t('places.filterTracks') });
  return tabs;
}

/**
 * The category filter of the places pool: a set of category ids (plus the
 * no-category bucket), many at once. It lives in the trip store, so the list
 * and the map markers filter on the same values (#1541).
 */
export function usePlacesCategoryFilter() {
  const categoryFilters = useTripStore((s) => s.placesCategoryFilter);
  const setCategoryFilters = useTripStore((s) => s.setPlacesCategoryFilter);
  const toggleCategoryFilter = (catId: string) => {
    const next = new Set(categoryFilters);
    if (next.has(catId)) next.delete(catId);
    else next.add(catId);
    setCategoryFilters(next);
  };
  return { categoryFilters, setCategoryFilters, toggleCategoryFilter };
}

export interface PlacesPoolOptions {
  tripId: number;
  /** Every place of the trip: a selected place that is gone from here is gone. */
  places: Place[];
  /** The places the pool lists; the "Tracks" choice appears once one of them has a track. */
  poolPlaces: Place[];
  toursEnabled: boolean | undefined;
  t: Translate;
  /**
   * What a selection does once its places are removed (a bulk delete, a remote edit).
   * `exit` (desktop): select mode ends once none of the selected places is left.
   * `prune` (phone): the ids that are gone drop out, so the toolbar count stays honest.
   */
  staleSelection: 'exit' | 'prune';
}

/**
 * The places pool's search, filters and multi-select: the one logic path behind the
 * desktop sidebar and the phone's places browser, which render their own markup over
 * it. A new "show" choice, a new search while picking and the select switch all start
 * a fresh selection, and the selection can be marked visited in the library in one go.
 */
export function usePlacesPool({ tripId, places, poolPlaces, toursEnabled, t, staleSelection }: PlacesPoolOptions) {
  const toast = useToast();
  const [search, setSearch] = useState('');
  // Filter state lives in the trip store so it survives the Plan tab
  // unmounting (tab switch, mobile sheet close) and stays in lockstep with the
  // map markers, which filter on the same values (#1541).
  const filter = useTripStore((s) => s.placesFilter);
  const setFilter = useTripStore((s) => s.setPlacesFilter);
  const { categoryFilters, setCategoryFilters, toggleCategoryFilter } = usePlacesCategoryFilter();
  // Minimum average stars, matching the collections filter (#1435): 'all', or a
  // floor of 1..5 that unrated places fall through. It replaced a sort toggle,
  // which put the best first but still left everything else on the list: no
  // help at all when the point is to see only what the group actually rated.
  // In the trip store with the other filters, so the map markers follow it too.
  const ratingFilter = useTripStore((s) => s.placesRatingFilter);
  const setRatingFilter = useTripStore((s) => s.setPlacesRatingFilter);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [markVisitedBusy, setMarkVisitedBusy] = useState(false);

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  /** The select switch: either way the selection starts empty. */
  const toggleSelectMode = () => {
    setSelectMode((v) => !v);
    setSelectedIds(new Set());
  };

  const toggleSelected = useCallback(
    (id: number) =>
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    []
  );

  /** A new "show" choice starts a fresh selection, as picking it from the old select did. */
  const pickFilter = (next: PlacesFilter) => {
    setFilter(next);
    setSelectedIds(new Set());
  };

  /** A new search while picking starts a fresh selection too. */
  const updateSearch = (value: string) => {
    setSearch(value);
    if (selectMode) setSelectedIds(new Set());
  };

  /**
   * "I have been to these" for the selection, applied wherever the places are
   * saved in the library (#1469). The server does the matching, so a place saved
   * under a different name in a list is still found.
   */
  const markSelectionVisited = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || markVisitedBusy) return;
    setMarkVisitedBusy(true);
    try {
      const { updated, places: matchedPlaces } = await collectionsApi.setStatusFromTrip(tripId, ids, 'visited');
      if (updated === 0) toast.info(t('collections.markVisitedNone'));
      else toast.success(t('collections.markedVisitedTrip', { count: matchedPlaces ?? 0 }));
      exitSelectMode();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setMarkVisitedBusy(false);
    }
  };

  // Auto-exit when all selected places have been removed from the store (e.g. after bulk delete).
  const exitIfSelectionGone = useEffectEvent(() => {
    if (!selectMode || selectedIds.size === 0) return;
    const placeIdSet = new Set(places.map((p) => p.id));
    if ([...selectedIds].every((id) => !placeIdSet.has(id))) {
      setSelectMode(false);
      setSelectedIds(new Set());
    }
  });
  useEffect(() => {
    if (staleSelection === 'exit') exitIfSelectionGone();
  }, [places, staleSelection]);

  // A bulk delete (or a remote edit) can remove selected places: drop the
  // stale ids so the toolbar count stays honest.
  useEffect(() => {
    if (staleSelection !== 'prune' || selectedIds.size === 0) return;
    const alive = new Set(places.map((p) => p.id));
    if ([...selectedIds].some((id) => !alive.has(id))) {
      setSelectedIds((prev) => new Set([...prev].filter((id) => alive.has(id))));
    }
  }, [places, selectedIds, staleSelection]);

  const hasTracks = useMemo(() => poolHasTracks(poolPlaces, toursEnabled), [poolPlaces, toursEnabled]);

  return {
    search,
    setSearch,
    updateSearch,
    filter,
    setFilter,
    pickFilter,
    categoryFilters,
    setCategoryFilters,
    toggleCategoryFilter,
    ratingFilter,
    setRatingFilter,
    selectMode,
    setSelectMode,
    toggleSelectMode,
    selectedIds,
    setSelectedIds,
    toggleSelected,
    exitSelectMode,
    markSelectionVisited,
    markVisitedBusy,
    hasTracks,
  };
}
