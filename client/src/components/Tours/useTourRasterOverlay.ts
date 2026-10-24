import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MapRasterOverlay, ToggleableRasterOverlay } from '../Map/mapRasterOverlay';
import { isOnTermsBase, type BaseMapHealth, type TileHealth } from '../Map/tourRasterBases';

/** Failed tiles in a row, with none arriving between them, before the source counts as down. */
const FAILURES_UNTIL_DOWN = 4;

/**
 * Whether a best-effort tile source answers. A run of failed tiles marks it
 * down; one tile arriving clears that, and `reset` tries afresh. One stray
 * failure alone never marks it down.
 */
export function useTileHealth(): TileHealth & { reset: () => void } {
  const [down, setDown] = useState(false);
  const failures = useRef(0);
  const reset = useCallback(() => {
    failures.current = 0;
    setDown(false);
  }, []);
  const onTileError = useCallback(() => {
    failures.current += 1;
    if (failures.current >= FAILURES_UNTIL_DOWN) setDown(true);
  }, []);
  return useMemo(() => ({ down, onTileError, onTileLoad: reset, reset }), [down, onTileError, reset]);
}

/**
 * Whether the base map answers while it is a map on its operator's terms
 * (OpenHikingMap, CyclOSM), asked afresh each time one becomes the base map;
 * nothing for any other base map.
 */
export function useBaseMapHealth(baseLayer: string): BaseMapHealth | undefined {
  const { down, onTileError, onTileLoad, reset } = useTileHealth();
  const onTerms = isOnTermsBase(baseLayer) ? baseLayer : null;
  useEffect(() => {
    if (onTerms) reset();
  }, [onTerms, reset]);
  return useMemo(
    () => (onTerms ? { base: onTerms, down, onTileError, onTileLoad } : undefined),
    [onTerms, down, onTileError, onTileLoad]
  );
}

/**
 * An overlay the planner offers, off until switched on; whether it is on is
 * the planner's (`active`, `onToggle`), so it outlasts the map. Its tile
 * health shows on the switch, and each time it comes on it tries afresh,
 * whether switched on or shown by default (the pistes of a ski tour), so a
 * source that failed earlier never opens a later tour already marked down.
 * While it is on and the map (`zoom`, on the raster tile scale) is further out
 * than its first tiles, it is marked so: nothing is drawn there, and the switch
 * says to zoom in. An unknown zoom marks nothing.
 */
export function useTourRasterOverlay(
  definition: Pick<MapRasterOverlay, 'id' | 'url' | 'attribution' | 'minZoom' | 'maxZoom'>,
  offered: boolean,
  active: boolean,
  toggle: () => void,
  zoom: number | null = null
): ToggleableRasterOverlay {
  const { down, onTileError, onTileLoad, reset } = useTileHealth();
  const on = active && offered;
  const belowMinZoom = on && zoom !== null && zoom < definition.minZoom;

  useEffect(() => {
    if (on) reset();
  }, [on, reset]);

  const onToggle = useCallback(() => {
    reset();
    toggle();
  }, [reset, toggle]);

  return useMemo(
    () => ({
      ...definition,
      active: on,
      status: on ? (down ? 'down' : 'on') : 'off',
      belowMinZoom,
      onToggle,
      onTileError,
      onTileLoad,
    }),
    [definition, down, on, belowMinZoom, onTileError, onTileLoad, onToggle]
  );
}
