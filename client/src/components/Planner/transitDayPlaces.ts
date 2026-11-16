import type { AssignmentsMap, Place } from '../../types';

/** Resolve the chosen day's places by day id, in itinerary order (#1460). */
export function getTransitDayPlaces(dayId: number, assignments: AssignmentsMap, places: Place[]): Place[] {
  return (assignments[String(dayId)] ?? [])
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map((a) => places.find((p) => p.id === a.place_id))
    .filter((p): p is Place => p != null);
}
