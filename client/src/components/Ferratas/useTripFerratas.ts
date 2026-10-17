import { useEffect, useMemo, useSyncExternalStore } from 'react';

import {
  ferrataTileCount,
  ferrataTileKey,
  ferrataTileRange,
  ferrataTilesOf,
  growFerrataTileRange,
  parseFerrataTileKey,
  type Ferrata,
  type FerrataBbox,
  type FerrataTile,
  type FerrataTileRange,
} from '@trek/shared';

import { useNetworkMode } from '../../hooks/useNetworkMode';
import { ferrataRepo } from '../../repo/ferrataRepo';
import { ferrataBboxFits, ferrataBboxParam } from './ferrataModel';
import { FerrataTileStore, type FerrataTileSnapshot } from './ferrataTileStore';

/**
 * Where the layer stands for the view on screen. `tooLarge` and `offline` are
 * answers to "why are there no new lines" that need no request at all: the
 * server refuses a box wider than its limit, and an offline device should not
 * fire one. Whatever was loaded before stays drawn in both.
 */
export type FerrataStatus = 'idle' | 'loading' | 'ready' | 'error' | 'tooLarge' | 'offline';

/** Long enough that a pan or a zoom gesture settles before the missing tiles are asked for. */
const DEBOUNCE_MS = 200;
/** The ring of tiles around the view that loads behind it, so a short pan finds its lines already there. */
const PREFETCH_RINGS = 1;
/**
 * The trip's area is prefetched up to this many tiles (about 0.4 by 0.4
 * degree, at most sixteen requests of 0.1 degree); a trip spread wider loads
 * as the map gets there.
 */
export const FERRATA_AREA_PREFETCH_MAX_TILES = 64;

const NO_TILES: readonly string[] = [];

const EMPTY_SNAPSHOT: FerrataTileSnapshot = {
  loaded: new Set(),
  ferratas: [],
  waiting: new Set(),
  failure: null,
  truncated: false,
  hydrated: false,
};
const subscribeNothing = () => () => {};
const emptySnapshot = () => EMPTY_SNAPSHOT;

/** A range as a dependency-friendly string, and back. */
const rangeKeyOf = (range: FerrataTileRange) => `${range.minRow},${range.maxRow},${range.minCol},${range.maxCol}`;
function rangeOfKey(key: string): FerrataTileRange {
  const [minRow = 0, maxRow = 0, minCol = 0, maxCol = 0] = key.split(',').map(Number);
  return { minRow, maxRow, minCol, maxCol };
}

/** `missing`: some tile of the view is not loaded yet. */
function statusOf(
  active: boolean,
  offline: boolean,
  fits: boolean,
  missing: boolean,
  snapshot: FerrataTileSnapshot
): FerrataStatus {
  if (!active) return 'idle';
  if (offline) return 'offline';
  if (!fits || (missing && snapshot.failure === 'refused')) return 'tooLarge';
  if (!missing) return 'ready';
  return snapshot.failure === 'unavailable' ? 'error' : 'loading';
}

/** One tile store per trip; it lives as long as the map surface does, so 2D, 3D and a toggle share it. */
function useTileStore(tripId: number | null | undefined): FerrataTileStore | null {
  return useMemo(() => {
    if (!tripId) return null;
    const cacheName = ferrataRepo.cacheName();
    return new FerrataTileStore({
      fetch: (bbox, signal) => ferrataRepo.list(tripId, ferrataBboxParam(bbox), signal),
      persist: (rows) => ferrataRepo.saveTiles(tripId, rows, cacheName),
    });
  }, [tripId]);
}

/**
 * The via ferratas of a trip, for the map layer, loaded per tile of the shared
 * 0.05 degree grid (see `FerrataTileStore`).
 *
 * Nothing is read or requested while the layer is off. Switched on, the trip's
 * cached tiles come back from the device first and draw at once, offline too;
 * then the view's missing tiles are asked for DEBOUNCE_MS after the map
 * settles, the ring around them behind that, and `area` (the trip's own
 * extent) in the background once, after the same pause, so the view's tiles
 * are always asked for first. Every ferrata loaded stays drawn: a pan, a
 * zoom, a switch between 2D and 3D or the layer off and on again never drops
 * one, and never asks again for a tile it has.
 */
export function useTripFerratas(
  tripId: number | null | undefined,
  view: FerrataBbox | null,
  enabled: boolean,
  area: FerrataBbox | null = null,
  routeTiles: readonly FerrataTile[] | null = null
): { ferratas: readonly Ferrata[]; status: FerrataStatus; truncated: boolean } {
  const { offline } = useNetworkMode();
  const store = useTileStore(tripId);
  const snapshot = useSyncExternalStore(
    store ? store.subscribe : subscribeNothing,
    store ? store.getSnapshot : emptySnapshot
  );
  // The tiles a tour's line runs through load with the layer off too, for the warning
  // that a route climbs a ferrata; only the layer's own state decides what it shows.
  const routeKey =
    routeTiles && routeTiles.length > 0
      ? routeTiles
          .map(ferrataTileKey)
          .sort((a, b) => a.localeCompare(b))
          .join('|')
      : null;
  const layerOn = enabled && !!store;
  const active = layerOn || (!!routeKey && !!store);
  const fits = !!view && ferrataBboxFits(view);
  const viewKey = view && fits ? rangeKeyOf(ferrataTileRange(view)) : null;
  const areaRange = area && ferrataBboxFitsArea(area) ? ferrataTileRange(area) : null;
  const areaKey =
    areaRange && ferrataTileCount(areaRange) <= FERRATA_AREA_PREFETCH_MAX_TILES ? rangeKeyOf(areaRange) : null;
  const visibleKeys = useMemo(
    () => (viewKey ? ferrataTilesOf(rangeOfKey(viewKey)).map(ferrataTileKey) : NO_TILES),
    [viewKey]
  );

  useEffect(() => {
    if (!active || !store || !tripId) return;
    if (store.beginHydration()) {
      void ferrataRepo.cachedTiles(tripId).then(
        (rows) => store.hydrate(rows),
        // An unreadable cache is an empty one: the tiles load from the network instead.
        () => store.hydrate([])
      );
    }
    return () => store.stop();
  }, [active, store, tripId]);

  useEffect(() => {
    if (!layerOn || !store || offline || !viewKey) return;
    const timer = window.setTimeout(() => {
      const range = rangeOfKey(viewKey);
      store.want(ferrataTilesOf(range), 'visible');
      store.want(ferrataTilesOf(growFerrataTileRange(range, PREFETCH_RINGS)), 'background');
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [layerOn, store, offline, viewKey]);

  // Declared after the view's effect, so with both due its timer fires second.
  useEffect(() => {
    if (!layerOn || !store || offline || !areaKey) return;
    const timer = window.setTimeout(() => {
      store.want(ferrataTilesOf(rangeOfKey(areaKey)), 'background');
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [layerOn, store, offline, areaKey]);

  useEffect(() => {
    if (!active || !store || offline || !routeKey) return;
    const timer = window.setTimeout(() => {
      const tiles = routeKey.split('|').flatMap((key) => parseFerrataTileKey(key) ?? []);
      store.want(tiles, 'background');
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [active, store, offline, routeKey]);

  const missing = visibleKeys.some((key) => !snapshot.loaded.has(key));
  const status = statusOf(layerOn, offline, fits, missing, snapshot);
  return { ferratas: snapshot.ferratas, status, truncated: layerOn && snapshot.truncated };
}

/** A trip's area is any real box; only its tile count limits the prefetch. */
function ferrataBboxFitsArea(bbox: FerrataBbox): boolean {
  return bbox.north >= bbox.south && bbox.east >= bbox.west;
}
