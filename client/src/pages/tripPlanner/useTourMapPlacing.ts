import { useCallback, useEffect, useRef, useState } from 'react';
import { createPressTracker, isPlacementTap, type PressTracker } from '../../components/Map/mapPress';
import {
  setTourPlaceToolMode,
  toggleTourPlacing,
  useTourPlaceToolStore,
  type TourMapMode,
} from '../../store/tourPlaceToolStore';

export type { TourMapMode } from '../../store/tourPlaceToolStore';

/**
 * The tour map's "set points" tool: whether a click on the map places a point
 * in the current mode, remembered per mode for the session, and the gate that
 * lets only a real click through, never the end of a pan, a rotation or a tilt.
 * `attach` goes on the element around the map, where the presses are followed.
 */
export function useTourMapPlacing(mode: TourMapMode) {
  const active = useTourPlaceToolStore((state) => state.placing[mode]);
  const [element, attach] = useState<HTMLElement | null>(null);
  const tracker = useRef<PressTracker | null>(null);

  useEffect(() => {
    if (!element) return;
    const next = createPressTracker(element);
    tracker.current = next;
    return () => {
      next.dispose();
      if (tracker.current === next) tracker.current = null;
    };
  }, [element]);

  // The editor's "add point" row switches the tool for whichever mode the map shows.
  useEffect(() => {
    setTourPlaceToolMode(mode);
  }, [mode]);

  /** Lets a handler run only for a click that was a click, not a drag or a long hold. */
  const gate = useCallback(<A extends unknown[]>(handler: ((...args: A) => void) | undefined) => {
    if (!handler) return undefined;
    return (...args: A) => {
      if (!isPlacementTap(tracker.current?.take() ?? null)) return;
      handler(...args);
    };
  }, []);

  return { active, toggle: toggleTourPlacing, gate, attach };
}
