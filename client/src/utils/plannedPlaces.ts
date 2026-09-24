import { isDayInAccommodationRange } from './dayOrder'
import type { AssignmentsMap, Day } from '../types'

/**
 * Which of a trip's places are "planned", i.e. have a place in the itinerary.
 *
 * Dragging a place onto a day is the obvious way, and for a long time it was the
 * only one this answered — so a hotel linked to a booking sat under "Unplanned"
 * while its name was printed in the day header two panels away (#2072). A stay is
 * on days by construction (day_accommodations.start_day_id / end_day_id are both
 * NOT NULL), and a booking that names a day is on the plan as much as any dragged
 * pin, so both count.
 *
 * A booking with no day does not: it exists, but nothing says when, which is
 * exactly what "unplanned" means.
 *
 * The three surfaces that ask this — the desktop sidebar, the map's marker set and
 * the phone browser — have to agree, or the list and the pins disagree about the
 * same place (#1541). Hence one function rather than three predicates.
 */

/** A stay, as the planner and the reservation rows carry it. */
export interface PlannedAccommodation {
  place_id?: number | null
  start_day_id?: number | null
  end_day_id?: number | null
}

/** A booking, reduced to what decides whether it plans its place. */
export interface PlannedReservation {
  place_id?: number | null
  day_id?: number | null
}

export interface PlannedSources {
  assignments: AssignmentsMap
  accommodations?: PlannedAccommodation[]
  reservations?: PlannedReservation[]
}

function addAssignmentPlaces(ids: Set<number>, dayAssignments: { place?: { id?: number | null } | null }[]): void {
  for (const a of dayAssignments) {
    if (a.place?.id != null) ids.add(a.place.id)
  }
}

/** Every place the trip has a plan for, across all days. */
export function plannedPlaceIds({ assignments, accommodations = [], reservations = [] }: PlannedSources): Set<number> {
  const ids = new Set<number>()
  for (const dayAssignments of Object.values(assignments || {})) addAssignmentPlaces(ids, dayAssignments)
  for (const acc of accommodations) {
    // A deleted place leaves place_id NULL behind (ON DELETE SET NULL).
    if (acc.place_id != null) ids.add(acc.place_id)
  }
  for (const r of reservations) {
    // day_id only, matching what the day plan itself renders: a booking carrying
    // just an end day appears on no day at all.
    if (r.place_id != null && r.day_id != null) ids.add(r.place_id)
  }
  return ids
}

/** The same question for one day — what the map answers while a day is selected. */
export function plannedPlaceIdsForDay(
  dayId: number,
  days: Day[],
  { assignments, accommodations = [], reservations = [] }: PlannedSources,
): Set<number> {
  const ids = new Set<number>()
  addAssignmentPlaces(ids, assignments?.[String(dayId)] || [])
  const day = (days || []).find(d => d.id === dayId)
  for (const acc of accommodations) {
    if (acc.place_id == null || acc.start_day_id == null) continue
    const end = acc.end_day_id ?? acc.start_day_id
    // A stay covers the nights in between, so its place is planned on each of
    // them, not only on the two days it is pinned to. The day rows are the only
    // thing that can order them; without them, fall back to the id range the
    // rest of the planner uses.
    const inRange = day
      ? isDayInAccommodationRange(day, acc.start_day_id, end, days)
      : dayId >= Math.min(acc.start_day_id, end) && dayId <= Math.max(acc.start_day_id, end)
    if (inRange) ids.add(acc.place_id)
  }
  for (const r of reservations) {
    if (r.place_id != null && r.day_id === dayId) ids.add(r.place_id)
  }
  return ids
}
