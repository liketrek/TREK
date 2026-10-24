import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from '../../i18n';
import type { Accommodation, AssignmentsMap, Day, Place, Reservation, RouteSegment } from '../../types';
import type { MergedItem } from '../../utils/dayMerge';
import { projectDayItinerary } from '../Map/dayTourProjection';
import { readWalkStations } from '../Tours/walk/walkStationsRead';
import { journeyLate, walkPairAt, walkTransitLeg, type TourOf, type WalkLate } from '../Tours/walk/walkTransit';
import { buildTransitLeg, buildTransitNameIndex, type PlannedTransitLeg, type TransitLeg } from './transitLeg';

export interface TransitLegPlannerDeps {
  tripId: number | string;
  assignments: AssignmentsMap;
  accommodations: Accommodation[];
  reservations: Reservation[];
  places: Place[];
  toursEnabled: boolean;
  tourOf: TourOf;
  /** Opens the search for a leg; without it no leg offers one, as on a trip without dates. */
  onPlan: ((leg: PlannedTransitLeg) => void) | undefined;
}

/** A walk's stops, or null where this device cannot read them. */
async function stopsOrNull(tripId: number | string, placeId: number, signal: AbortSignal) {
  try {
    return await readWalkStations(tripId, placeId, signal);
  } catch {
    // They only name the leg's two ends: without them it opens named after the walks.
    return null;
  }
}

/**
 * Public transit for one leg of a day (#2398), behind the desktop day plan and
 * the phone timeline alike: the leg's two ends and the time its origin is
 * planned for. Between two city walks (CW-08) it runs from the first walk's
 * last stop to the next one's first, departing when the first one ends, and a
 * saved journey that now arrives after the next walk starts says so. Nothing
 * is saved here: the search opens, and only the connection picked there is
 * added to the day. Only the last leg asked for opens it, and none after the
 * view is gone.
 */
export function useTransitLegPlanner({
  tripId,
  assignments,
  accommodations,
  reservations,
  places,
  toursEnabled,
  tourOf,
  onPlan,
}: TransitLegPlannerDeps) {
  const { t } = useTranslation();
  // Coordinates back to names, over every located place, hotel and booking endpoint of the trip.
  const names = useMemo(
    () => buildTransitNameIndex(assignments, accommodations, reservations),
    [assignments, accommodations, reservations]
  );

  const legFor = useCallback(
    (dayId: number, seg?: RouteSegment): TransitLeg | null =>
      onPlan ? buildTransitLeg(seg, dayId, names, assignments, reservations) : null,
    [onPlan, names, assignments, reservations]
  );

  // The walks' stops being read for the leg asked for last; a later leg, or leaving the view, drops them.
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);

  /** Opens the search for a leg, told by the entry it leaves where the connector carries one. */
  const plan = useCallback(
    (dayId: number, leg: TransitLeg, originId?: number) => {
      if (!onPlan) return;
      pending.current?.abort();
      const day = [...(assignments[String(dayId)] ?? [])].sort((a, b) => a.order_index - b.order_index);
      const pair = toursEnabled ? walkPairAt(projectDayItinerary(day, true, places), leg, tourOf, originId) : null;
      if (!pair) {
        onPlan({ dayId, ...leg });
        return;
      }
      const controller = new AbortController();
      pending.current = controller;
      // The stops name the ends; read from this device's copy when offline, so the search waits only for them.
      void Promise.all([
        stopsOrNull(tripId, pair.first.item.placeId, controller.signal),
        stopsOrNull(tripId, pair.next.item.placeId, controller.signal),
      ]).then(([first, next]) => {
        if (controller.signal.aborted) return;
        onPlan({ dayId, ...walkTransitLeg({ leg, dayId, pair, stops: { first, next }, places, t }) });
      });
    },
    [onPlan, assignments, toursEnabled, places, tourOf, tripId, t]
  );

  /** A saved journey on a day that arrives after the walk it leads to starts; null otherwise. */
  const lateBefore = useCallback(
    (day: Pick<Day, 'date'>, reservation: Reservation, following: readonly MergedItem[]): WalkLate | null =>
      toursEnabled ? journeyLate({ reservation, following, date: day.date ?? null, tourOf }) : null,
    [toursEnabled, tourOf]
  );

  return { legFor, plan, lateBefore };
}
