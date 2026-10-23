import type { RoadtripCardDay } from '@trek/shared';
import { useCallback, useEffect, useRef } from 'react';

import { useAssistantStore } from '../../../../store/assistantStore';
import { useAssistantView } from '../../assistantViewContext';
import { useCardPoint } from '../parts/useCardPoint';
import { dayPoints } from './roadtripCardModel';

/**
 * The road trip cards' part of the map. Resting on a day draws that day's
 * drive over the plan in its colour, resting on a stop or a hit shows its
 * pin; a click selects the day in the planner and fits the map to it, or
 * moves the map to a spot. On the phone, where the chat covers the map, the
 * chat steps aside first. Whatever a card drew goes when the card does,
 * and only that: a drive another card drew since stays.
 */
export function useRoadtripCardMap() {
  const { tripId, onRevealMap, onFocusDay } = useAssistantView();
  const setRoutePreview = useAssistantStore((s) => s.setRoutePreview);
  const requestCamera = useAssistantStore((s) => s.requestCamera);
  const point = useCardPoint();
  /** The drive this card drew last, so it takes away its own and never another card's. */
  const drawn = useRef<string | null>(null);

  const clearOwn = useCallback(() => {
    const ref = drawn.current;
    drawn.current = null;
    if (ref !== null && useAssistantStore.getState().routePreview?.ref === ref) setRoutePreview(null);
  }, [setRoutePreview]);

  /** Draws a day's drive while it is pointed at; null takes it away. */
  const hoverDay = useCallback(
    (ref: string, day: RoadtripCardDay | null, color: string) => {
      if (!day || day.lines.length === 0) {
        clearOwn();
        return;
      }
      drawn.current = ref;
      setRoutePreview({ tripId, ref, lines: day.lines, color });
    },
    [tripId, setRoutePreview, clearOwn]
  );

  /** Selects the day in the planner and fits the map to its drive. */
  const showDay = useCallback(
    (day: RoadtripCardDay) => {
      onFocusDay?.(day.dayId);
      onRevealMap?.();
      requestCamera(tripId, dayPoints(day), 'fit', 'user');
    },
    [tripId, onFocusDay, onRevealMap, requestCamera]
  );

  /** Fits the map to these points; on the phone the chat steps aside first. */
  const showPoints = useCallback(
    (points: [number, number][]) => {
      if (points.length === 0) return;
      onRevealMap?.();
      requestCamera(tripId, points, 'fit', 'user');
    },
    [tripId, onRevealMap, requestCamera]
  );

  /** Fits the map to every day the card holds. */
  const showDrive = useCallback(
    (days: readonly RoadtripCardDay[]) => showPoints(days.flatMap((day) => dayPoints(day))),
    [showPoints]
  );

  useEffect(() => clearOwn, [clearOwn]);

  return { hoverDay, showDay, showDrive, showPoints, hoverPoint: point.hover, showPoint: point.show };
}
