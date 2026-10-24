import { nearnessToLine, withPointAppended } from '@trek/shared';
import { useCallback, useMemo } from 'react';
import { useTripStore } from '../../../store/tripStore';
import type { Category, Place } from '../../../types';
import { randomId } from '../../../utils/randomId';
import { useLinkedPlaceOf } from '../walk/useWalkSchedule';
import { unlinkedPoint, type TourPlannerWaypoint } from './tourPlannerWaypoints';
import type { TourPlannerController } from './useTourPlanner';

/** A place of the trip as the picker offers it. */
export interface TripPlaceCandidate {
  place: Place;
  category: Category | null;
  /** Metres from the tour as it stands (its route, else its points); null while the tour has no point. */
  distanceM: number | null;
  /** A point of the tour stands for it already. */
  used: boolean;
}

const NO_PLACES: Place[] = [];
const NO_CATEGORIES: Category[] = [];

/** Within this distance of the tour a place counts as near it, and the picker says so. */
export const NEAR_TOUR_M = 2_000;

/** The line a place is measured against: the route while there is one, else the points as set. */
function tourLine(planner: Pick<TourPlannerController, 'route' | 'waypoints'>): Array<[number, number]> {
  if (planner.route && planner.route.length >= 2) return planner.route;
  return planner.waypoints.map((point): [number, number] => [point.lat, point.lng]);
}

function distanceFrom(place: Place, line: Array<[number, number]>): number | null {
  if (line.length === 0 || place.lat == null || place.lng == null) return null;
  if (line.length === 1)
    return nearnessToLine(place as { lat: number; lng: number }, [line[0], line[0]])?.distanceM ?? null;
  return nearnessToLine(place as { lat: number; lng: number }, line)?.distanceM ?? null;
}

/**
 * PR1-10: the trip's places as stops of a tour, chosen on purpose. A place is
 * offered once it has a spot and is no tour itself, nearest to the tour first;
 * picking one adds a point on its spot that stands for it, as one step of the
 * history. The point keeps its own coordinates from then on, the place stays a
 * place of its own, and its days are left alone. Removing or unlinking the
 * point never touches the place.
 */
export function useTripPlaceWaypoints(planner: TourPlannerController, tourPlaceIds: ReadonlySet<number>) {
  const places = useTripStore((state) => state.places) ?? NO_PLACES;
  const categories = useTripStore((state) => state.categories) ?? NO_CATEGORIES;
  const { editWaypoints, setSelectedWaypointId, waypoints, route } = planner;

  const linkedPlaceOf = useLinkedPlaceOf();

  const candidates = useMemo((): TripPlaceCandidate[] => {
    const line = tourLine({ route, waypoints });
    const used = new Set(waypoints.flatMap((point) => (point.linkedPlaceId ? [point.linkedPlaceId] : [])));
    const categoryOf = new Map(categories.map((category) => [category.id, category]));
    return places
      .filter((place) => place.lat != null && place.lng != null && !tourPlaceIds.has(place.id))
      .map((place) => ({
        place,
        category: place.category_id != null ? (categoryOf.get(place.category_id) ?? null) : null,
        distanceM: distanceFrom(place, line),
        used: used.has(place.id),
      }))
      .sort(
        (a, b) =>
          (a.distanceM ?? Number.POSITIVE_INFINITY) - (b.distanceM ?? Number.POSITIVE_INFINITY) ||
          a.place.name.localeCompare(b.place.name)
      );
  }, [categories, places, route, tourPlaceIds, waypoints]);

  const add = useCallback(
    (place: Place) => {
      if (place.lat == null || place.lng == null) return;
      const id = randomId();
      const point: TourPlannerWaypoint = { id, lat: place.lat, lng: place.lng, role: 'end', linkedPlaceId: place.id };
      editWaypoints((current) => withPointAppended(current, point));
      setSelectedWaypointId(id);
    },
    [editWaypoints, setSelectedWaypointId]
  );

  const unlink = useCallback(
    (pointId: string) =>
      editWaypoints((current) => current.map((point) => (point.id === pointId ? unlinkedPoint(point) : point))),
    [editWaypoints]
  );

  return { candidates, add, unlink, linkedPlaceOf };
}

export type TripPlaceWaypoints = ReturnType<typeof useTripPlaceWaypoints>;
