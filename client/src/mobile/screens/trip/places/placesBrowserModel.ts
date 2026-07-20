import type { AssignmentsMap, Day, Place } from '../../../../types'

/**
 * Pure filter model of the mobile places browser. Mirrors the desktop
 * sidebar's semantics exactly (usePlacesSidebar + the map's mapPlaces memo):
 * the pool filter and category set come from the trip store, so the list here
 * and the map markers always agree (#1541).
 */

export function plannedPlaceIds(assignments: AssignmentsMap): Set<number> {
  const ids = new Set<number>()
  for (const dayAssignments of Object.values(assignments)) {
    for (const a of dayAssignments) {
      if (a.place?.id != null) ids.add(a.place.id)
    }
  }
  return ids
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

export function matchesCategoryFilter(place: Place, categoryFilters: Set<string>): boolean {
  if (categoryFilters.size === 0) return true
  if (place.category_id == null) return categoryFilters.has('uncategorized')
  return categoryFilters.has(String(place.category_id))
}

export function matchesSearch(place: Place, search: string): boolean {
  if (!search) return true
  const q = search.toLowerCase()
  return place.name.toLowerCase().includes(q) || (place.address || '').toLowerCase().includes(q)
}

interface PoolFilterArgs {
  filter: string
  categoryFilters: Set<string>
  search: string
  plannedIds: Set<number>
}

export function filterPool(places: Place[], { filter, categoryFilters, search, plannedIds }: PoolFilterArgs): Place[] {
  return places.filter(p => {
    if (filter === 'unplanned' && plannedIds.has(p.id)) return false
    if (filter === 'tracks' && !p.route_geometry) return false
    return matchesCategoryFilter(p, categoryFilters) && matchesSearch(p, search)
  })
}

/** Chip counts run on the category+search base set, like the desktop tabs. */
export function poolCounts(places: Place[], categoryFilters: Set<string>, search: string, plannedIds: Set<number>) {
  const base = places.filter(p => matchesCategoryFilter(p, categoryFilters) && matchesSearch(p, search))
  return {
    all: base.length,
    unplanned: base.filter(p => !plannedIds.has(p.id)).length,
    tracks: base.filter(p => p.route_geometry).length,
  }
}
