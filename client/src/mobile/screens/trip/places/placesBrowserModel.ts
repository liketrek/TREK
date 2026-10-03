import type { AssignmentsMap, Day, Place } from '../../../../types'
import { placeMatchesSearch } from '../../../../utils/placeSearch'
import {
  matchesCategoryFilter, matchesPlacesFilter, type PlacesRatingFloor,
} from '../../../../utils/placesFilter'
import {
  plannedPlaceIds as sharedPlannedPlaceIds,
  type PlannedAccommodation, type PlannedReservation,
} from '../../../../utils/plannedPlaces'

/**
 * Pure filter model of the mobile places browser. Mirrors the desktop
 * sidebar's semantics exactly (usePlacesSidebar + the map's mapPlaces memo):
 * the pool filter, the category set and the rating floor come from the trip
 * store and go through the same matcher (utils/placesFilter), so the list here
 * and the map markers always agree (#1541).
 */

/** Kept under this name for the browser's callers; the predicate itself lives in utils/placesFilter. */
export { matchesCategoryFilter }

export function plannedPlaceIds(
  assignments: AssignmentsMap,
  accommodations: PlannedAccommodation[] = [],
  reservations: PlannedReservation[] = [],
): Set<number> {
  return sharedPlannedPlaceIds({ assignments, accommodations, reservations })
}

/** place id → number of the first (lowest-numbered) day it is planned on. */
export function firstPlannedDayNumbers(assignments: AssignmentsMap, days: Day[]): Map<number, number> {
  const numberByDayId = new Map<number, number>()
  days.forEach((day, i) => numberByDayId.set(day.id, day.day_number ?? i + 1))
  const result = new Map<number, number>()
  for (const [dayId, dayAssignments] of Object.entries(assignments)) {
    const dayNumber = numberByDayId.get(Number(dayId))
    if (dayNumber == null) continue
    for (const a of dayAssignments) {
      const placeId = a.place?.id
      if (placeId == null) continue
      const prev = result.get(placeId)
      if (prev == null || dayNumber < prev) result.set(placeId, dayNumber)
    }
  }
  return result
}

export function matchesSearch(place: Place, search: string): boolean {
  return placeMatchesSearch(place, search)
}

interface PoolFilterArgs {
  filter: string
  categoryFilters: Set<string>
  /** Minimum average stars; omitted means every rating. */
  ratingFilter?: PlacesRatingFloor
  search: string
  plannedIds: Set<number>
}

export function filterPool(places: Place[], { filter, categoryFilters, ratingFilter = 'all', search, plannedIds }: PoolFilterArgs): Place[] {
  return places.filter(p => matchesPlacesFilter(p, { filter, categoryFilters, ratingFilter }, { plannedIds }) && matchesSearch(p, search))
}

/** Chip counts run on the category+search base set, like the desktop tabs. */
export function poolCounts(places: Place[], categoryFilters: Set<string>, search: string, plannedIds: Set<number>) {
  const base = places.filter(p => matchesCategoryFilter(p, categoryFilters) && matchesSearch(p, search))
  return {
    all: base.length,
    unplanned: base.filter(p => !plannedIds.has(p.id)).length,
    planned: base.filter(p => plannedIds.has(p.id)).length,
    tracks: base.filter(p => p.route_geometry).length,
  }
}
