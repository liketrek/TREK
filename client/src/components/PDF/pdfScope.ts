import type { AssignmentsMap } from '../../types'
import { isServiceStopType } from '../Roadtrip/roadtripModel'

interface WithTravelers { travelers?: { user_id: number }[] | null }

/**
 * Whether anyone on the trip has been given their own part of it (#2168): a stop
 * with participants or a booking with travellers. Without either, "my plan" is
 * the whole plan, and offering it would only be a second way to the same file.
 */
export function hasPersonalPlan(assignments: AssignmentsMap, reservations: WithTravelers[]): boolean {
  return Object.values(assignments).some(list => (list || []).some(a => (a.participants || []).length > 0))
    || reservations.some(r => (r.travelers || []).length > 0)
}

/**
 * The plan one member goes on (#2168). A stop or booking that names its people
 * stays only when it names them; one that names nobody is everybody's and stays.
 */
export function onlyMyPlan<R extends WithTravelers>(
  assignments: AssignmentsMap,
  reservations: R[],
  userId: number,
): { assignments: AssignmentsMap; reservations: R[] } {
  const mine = (people: { user_id: number }[] | null | undefined) => !people?.length || people.some(p => p.user_id === userId)
  return {
    assignments: Object.fromEntries(Object.entries(assignments).map(([dayId, list]) => [dayId, (list || []).filter(a => mine(a.participants))])),
    reservations: reservations.filter(r => mine(r.travelers)),
  }
}

/**
 * The stops the day plan lists, out of everything the store holds for the trip.
 *
 * The stop a booked night wrote onto its check-in day is out whatever the switch says:
 * the day already shows that booking as its accommodation block, and the row would be
 * the same hotel a second time. The service stops go with the setting. One predicate
 * for the whole document, so the day lists, the route map, the cover's planned count
 * and every cost total agree with the plan and with each other, whichever shell asked.
 */
export function planAssignments(assignments: AssignmentsMap, showServiceStops: boolean): AssignmentsMap {
  return Object.fromEntries(Object.entries(assignments).map(([dayId, list]) => [
    dayId,
    (list || []).filter(a => a.accommodation_id == null && (showServiceStops || !isServiceStopType(a.place?.stop_type))),
  ]))
}
