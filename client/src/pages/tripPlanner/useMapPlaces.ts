import { useEffect, useMemo, useState } from 'react'
import { isServiceStopType } from '../../components/Roadtrip/roadtripModel'
import { useSettingsStore } from '../../store/settingsStore'
import { useTripStore, type TripStoreState } from '../../store/tripStore'
import type { Accommodation, Place } from '../../types'
import { pendingStayPlaceIds } from '../../utils/pendingStays'
import { matchesPlacesFilter } from '../../utils/placesFilter'
import { plannedPlaceIds, plannedPlaceIdsForDay } from '../../utils/plannedPlaces'

interface MapPlacesOptions {
  places: Place[]
  assignments: TripStoreState['assignments']
  selectedDayId: TripStoreState['selectedDayId']
  days: TripStoreState['days']
  tripAccommodations: Accommodation[]
  reservations: TripStoreState['reservations']
  toursEnabled: boolean
}

/**
 * Which places the planner's map draws and how: the list filters shared through the
 * store, the declutter of collapsed days, the compact and pending markers, the Tracks
 * filter falling back once no place carries a track, and the selected day's order
 * badges and the places the map fits to.
 */
export function useMapPlaces(options: MapPlacesOptions) {
  const { places, assignments, selectedDayId, days, tripAccommodations, reservations, toursEnabled } = options
  // Same filter the places sidebar renders, shared via the store so tab
  // switches can't desync the marker set from the filter UI (#1541).
  const placesFilter = useTripStore((s) => s.placesFilter)
  const placesCategoryFilter = useTripStore((s) => s.placesCategoryFilter)
  const placesRatingFilter = useTripStore((s) => s.placesRatingFilter)

  const [expandedDayIds, setExpandedDayIds] = useState<Set<number> | null>(null)

  const compactUnplanned = useSettingsStore(s => s.settings.map_compact_unplanned === true)
  const mapPlaces = useMemo(() => {
    // Build set of place IDs assigned to collapsed days
    const hiddenPlaceIds = new Set<number>()
    if (expandedDayIds) {
      for (const [dayId, dayAssignments] of Object.entries(assignments)) {
        if (!expandedDayIds.has(Number(dayId))) {
          for (const a of dayAssignments) {
            if (a.place?.id) hiddenPlaceIds.add(a.place.id)
          }
        }
      }
      // Don't hide places that are also assigned to an expanded day
      for (const [dayId, dayAssignments] of Object.entries(assignments)) {
        if (expandedDayIds.has(Number(dayId))) {
          for (const a of dayAssignments) {
            if (a.place?.id) hiddenPlaceIds.delete(a.place.id)
          }
        }
      }
    }

    // Planned place IDs: needed by both the 'unplanned' filter (exclude them) and
    // the new 'planned' filter (keep only them). With a day selected, 'planned'
    // follows it like the other filters do; with no day selected it keeps showing
    // the whole plan (#2024). 'unplanned' always uses the whole-trip set: a place
    // assigned to any day is not unplanned.
    const plannedIds = placesFilter === 'unplanned' || placesFilter === 'planned'
      ? (placesFilter === 'planned' && selectedDayId
        ? plannedPlaceIdsForDay(selectedDayId, days, { assignments, accommodations: tripAccommodations, reservations })
        : plannedPlaceIds({ assignments, accommodations: tripAccommodations, reservations }))
      : null

    const compactIds = compactUnplanned ? plannedPlaceIds({ assignments, accommodations: tripAccommodations, reservations }) : null
    const pendingIds = pendingStayPlaceIds(tripAccommodations, reservations)
    const filterState = { filter: placesFilter, categoryFilters: placesCategoryFilter, ratingFilter: placesRatingFilter }
    return places.filter(p => {
      if (!p.lat || !p.lng) return false
      // Collapsed-day declutter hides a day's stops on every filter EXCEPT 'planned':
      // there the user asked to see the whole plan on the map, so a collapsed day
      // must not drop its planned places.
      if (placesFilter !== 'planned' && hiddenPlaceIds.has(p.id)) return false
      // Pool, categories and rating floor: the very matcher the lists use (#1541).
      return matchesPlacesFilter(p, filterState, { plannedIds })
    }).map(p => {
      // How the map tells a place apart (#2024, #2281); untouched places keep their identity.
      const compact = !!compactIds && !compactIds.has(p.id)
      const pending = pendingIds.has(p.id)
      return compact || pending ? { ...p, _compact: compact, _pending: pending } : p
    })
  }, [places, placesCategoryFilter, placesFilter, placesRatingFilter, assignments, expandedDayIds, selectedDayId, days, tripAccommodations, reservations, compactUnplanned])

  // The "Tracks" pool is only offered while a place carries a track. When the last
  // one goes (deleted here or by a collaborator), fall back to "all". That happens here
  // because the planner's hooks are mounted whatever is on screen: the lists that used
  // to do it are not mounted while the phone map is in front, and the map would sit
  // empty under a "Tracks" filter no control offers any more.
  const setPlacesFilter = useTripStore((s) => s.setPlacesFilter)
  const hasTracks = useMemo(() => !toursEnabled && places.some(p => p.route_geometry), [places, toursEnabled])
  useEffect(() => {
    if (placesFilter === 'tracks' && !hasTracks) setPlacesFilter('all')
  }, [placesFilter, hasTracks, setPlacesFilter])

  // Build placeId → order-number map from the selected day's assignments. A service
  // stop is passed over rather than counted: the map draws it without a badge and the
  // rail gives it no number, so a number spent on it left the pin after a fuel stop
  // wearing "3" where the rail said "2".
  const dayOrderMap = useMemo(() => {
    if (!selectedDayId) return {}
    const da = assignments[String(selectedDayId)] || []
    const sorted = [...da].sort((a, b) => a.order_index - b.order_index)
    const map = {}
    let counted = 0
    sorted.forEach(a => {
      if (!a.place?.id || isServiceStopType(a.place.stop_type)) return
      counted += 1
      if (!map[a.place.id]) map[a.place.id] = []
      map[a.place.id].push(counted)
    })
    return map
  }, [selectedDayId, assignments])

  // Places assigned to selected day (with coords), used for map fitting
  const dayPlaces = useMemo(() => {
    if (!selectedDayId) return []
    const da = assignments[String(selectedDayId)] || []
    return da.map(a => a.place).filter(p => p?.lat && p?.lng)
  }, [selectedDayId, assignments])

  return { expandedDayIds, setExpandedDayIds, mapPlaces, dayOrderMap, dayPlaces }
}

export type MapPlaces = ReturnType<typeof useMapPlaces>
