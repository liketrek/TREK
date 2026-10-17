import { useCallback, useMemo, useRef, useState } from 'react';
import type { MapRasterOverlay, ToggleableRasterOverlay } from '../Map/mapRasterOverlay';

/** Failed tiles in a row, with none arriving between them, before the source counts as down. */
const FAILURES_UNTIL_DOWN = 4;

/**
 * An overlay the planner offers, off until switched on; whether it is on is
 * the planner's (`active`, `onToggle`), so it outlasts the map. A run of failed
 * tiles marks it down, which the switch shows; one tile arriving clears that,
 * and switching it off and on again tries afresh. One stray failure alone
 * never marks it down.
 */
export function useTourRasterOverlay(
  definition: Pick<MapRasterOverlay, 'id' | 'url' | 'attribution' | 'minZoom' | 'maxZoom'>,
  offered: boolean,
  active: boolean,
  toggle: () => void
): ToggleableRasterOverlay {
  const [down, setDown] = useState(false);
  const failures = useRef(0);
  const on = active && offered;

  const onToggle = useCallback(() => {
    failures.current = 0;
    setDown(false);
    toggle();
  }, [toggle]);
  const onTileError = useCallback(() => {
    failures.current += 1;
    if (failures.current >= FAILURES_UNTIL_DOWN) setDown(true);
  }, []);
  const onTileLoad = useCallback(() => {
    failures.current = 0;
    setDown(false);
  }, []);

  return useMemo(
    () => ({
      ...definition,
      active: on,
      status: on ? (down ? 'down' : 'on') : 'off',
      onToggle,
      onTileError,
      onTileLoad,
    }),
    [definition, down, on, onTileError, onTileLoad, onToggle]
  );
}
