import { chosenAfterId, insertionBlock, insertionSlots, withPointAfter, type TourPoi } from '@trek/shared';
import { useCallback } from 'react';
import { useTranslation } from '../../../i18n';
import { useTourPoiStore, type InsertedTourPoi } from '../../../store/tourPoiStore';
import { randomId } from '../../../utils/randomId';
import { TOUR_POI_LOOKS } from '../../Map/poiCategories';
import type { TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import type { TourPlannerController, TourPlannerStatus } from '../planner/useTourPlanner';

/** The route is planned through and its measures can be read. */
const SETTLED: readonly TourPlannerStatus[] = ['ready', 'saved', 'elevation-failed'];

interface Measures {
  distanceM: number;
  minutes: number | null;
}

export type InsertionOutcome =
  | { kind: 'measuring'; name: string }
  | { kind: 'measured'; name: string; extraM: number; extraMinutes: number | null }
  | { kind: 'unmeasured'; name: string };

export type PoiInsertionPlanner = Pick<
  TourPlannerController,
  | 'waypoints'
  | 'route'
  | 'editWaypoints'
  | 'setSelectedWaypointId'
  | 'routeCurrent'
  | 'status'
  | 'distanceMeters'
  | 'walkingDurationMinutes'
  | 'canEdit'
  | 'isSaving'
  | 'undo'
  | 'canUndo'
  | 'historyMark'
>;

function measuresOf(planner: PoiInsertionPlanner): Measures | null {
  if (!planner.routeCurrent || !SETTLED.includes(planner.status) || planner.distanceMeters == null) return null;
  return { distanceM: planner.distanceMeters, minutes: planner.walkingDurationMinutes ?? null };
}

/**
 * PLN-03: a place found along the tour taken in as a stop, after the point
 * chosen, only when asked. It becomes a waypoint of its own on the place's
 * spot, not a place of the trip; the route is planned again as for any point,
 * and the one step it was can be undone. What it adds is the difference of the
 * route as planned before and after, read once the new route is in; where
 * either could not be planned, it says so rather than guess. A leg drawn by
 * hand or a fixed line is never cut: the point after which it would go says why.
 */
export function usePoiInsertion(planner: PoiInsertionPlanner) {
  const { t } = useTranslation();
  const select = useTourPoiStore((state) => state.select);
  // In the store: the map draws where the place would go while its card is open.
  const afterChoice = useTourPoiStore((state) => state.slot);
  const chooseSlot = useTourPoiStore((state) => state.chooseSlot);
  // Kept in the store: the place is taken in from its card over the map, and the list says what it did.
  const inserted = useTourPoiStore((state) => state.inserted);
  const setInserted = useTourPoiStore((state) => state.setInserted);

  const afterIdFor = useCallback(
    (poi: TourPoi) => chosenAfterId(planner.waypoints, planner.route, poi, afterChoice),
    [afterChoice, planner.route, planner.waypoints]
  );
  const chooseAfter = useCallback(
    (poi: TourPoi, afterId: string) => chooseSlot({ poiId: poi.id, afterId }),
    [chooseSlot]
  );

  const insert = useCallback(
    (poi: TourPoi) => {
      const afterId = afterIdFor(poi);
      if (!afterId || !planner.canEdit || planner.isSaving) return false;
      // The place keeps its name, and on a city walk its opening hours to check the arrival against (CW-04).
      const point: TourPlannerWaypoint = {
        id: randomId(),
        lat: poi.lat,
        lng: poi.lng,
        role: 'via',
        ...(poi.name ? { name: poi.name } : {}),
        ...(poi.opening_hours ? { openingHours: poi.opening_hours } : {}),
        // PLN-03: its row carries the kind's icon, as the map drew the place.
        poiCategory: poi.category,
      };
      const next = withPointAfter(planner.waypoints, afterId, point);
      if (!next) return false;
      const before = measuresOf(planner);
      planner.editWaypoints((current) => withPointAfter(current, afterId, point) ?? current);
      planner.setSelectedWaypointId(point.id);
      // An unnamed place (a tap, a bench) is told by its kind, as the list names it.
      const name = poi.name || t(TOUR_POI_LOOKS[poi.category].labelKey);
      // Taking it in is one step of the history, so the mark moves on by one.
      setInserted({ pointId: point.id, name, before, pointCount: next.length, mark: planner.historyMark + 1 });
      chooseSlot(null);
      select(null);
      return true;
    },
    [afterIdFor, chooseSlot, planner, select, setInserted, t]
  );

  const dismiss = useCallback(() => setInserted(null), [setInserted]);
  const outcome = outcomeOf(inserted, planner);
  // The one step that took the place in, while it is still the last thing done to the points.
  const { undo: undoStep } = planner;
  const undo = useCallback(() => {
    undoStep();
    setInserted(null);
  }, [setInserted, undoStep]);

  return {
    afterIdFor,
    chooseAfter,
    blockOf: (afterId: string) => insertionBlock(planner.waypoints, afterId),
    slots: insertionSlots(planner.waypoints),
    insert,
    outcome,
    dismiss,
    undo:
      outcome && inserted?.mark === planner.historyMark && planner.canUndo && planner.canEdit && !planner.isSaving
        ? undo
        : null,
  };
}

/**
 * What taking the place in did to the route, read from the planner as it is
 * now: nothing once the point is gone again (undone or removed) or the tour
 * was edited further, so the figure never describes another route.
 */
function outcomeOf(inserted: InsertedTourPoi | null, planner: PoiInsertionPlanner): InsertionOutcome | null {
  if (!inserted) return null;
  const stillThere = planner.waypoints.some((point) => point.id === inserted.pointId);
  if (!stillThere || planner.waypoints.length !== inserted.pointCount) return null;
  const { name, before } = inserted;
  if (planner.status === 'routing-failed') return { kind: 'unmeasured', name };
  const after = measuresOf(planner);
  if (!after) return { kind: 'measuring', name };
  if (!before) return { kind: 'unmeasured', name };
  return {
    kind: 'measured',
    name,
    extraM: after.distanceM - before.distanceM,
    extraMinutes: after.minutes != null && before.minutes != null ? after.minutes - before.minutes : null,
  };
}
