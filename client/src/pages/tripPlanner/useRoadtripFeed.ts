import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MAX_TRIP_DAYS, type RoadtripPreferences } from '@trek/shared'
import { carrierReservationIds } from '@trek/shared/roadtrip'
import type { DayBoundaryControls } from '../../components/Map/dayBoundaryDrag'
import { collapsedDayDates } from '../../components/Map/dawarichTrail'
import { projectOntoRoute, type LatLng } from '../../components/Roadtrip/corridor'
import { PHONE_CORRIDOR_OPTIONS } from '../../components/Roadtrip/corridorSearchModel'
import { dayColor } from '../../components/Roadtrip/dayColors'
import { dayWindow } from '../../components/Roadtrip/dayWindow'
import { reanchorAfterInsert } from '../../components/Roadtrip/roadtripModel'
import { useDayBoundaries } from '../../components/Roadtrip/useDayBoundaries'
import { useFollowTrack } from '../../components/Roadtrip/useFollowTrack'
import { useRefuelSearch } from '../../components/Roadtrip/useRefuelSearch'
import { useRoadtripCorridor } from '../../components/Roadtrip/useRoadtripCorridor'
import { useRoadtripRoutes } from '../../components/Roadtrip/useRoadtripRoutes'
import { useRoadtripVias } from '../../components/Roadtrip/useRoadtripVias'
import { useLoadRoadtripSettings } from '../../hooks/useRoadtripSettings'
import { roadtripPreferencesRepo } from '../../repo/roadtripPreferencesRepo'
import { useAuthStore } from '../../store/authStore'
import { publishRoadtripPreferences } from '../../store/roadtripPreferencesStore'
import type { TripStoreState } from '../../store/tripStore'
import type { Accommodation, Day, Place, Reservation } from '../../types'
import type { PlannerBase } from './plannerTypes'
import type { MapPlaces } from './useMapPlaces'
import type { PlannerMapView } from './usePlannerMapView'

/** Stable empty list so the road trip hook stays inert while its mode is off. */
const EMPTY_DAYS: Day[] = []
const EMPTY_RESERVATIONS: Reservation[] = []

interface RoadtripFeedOptions extends Pick<PlannerBase, 'tripId' | 'trip' | 'can' | 'toast' | 't'> {
  isMobile: boolean
  activeTab: string
  enabledAddons: Record<string, boolean>
  /** The trip's road trip switch, already off on a phone. */
  roadtripMode: boolean
  roadtripSettings: RoadtripPreferences
  days: TripStoreState['days']
  storedAssignments: TripStoreState['assignments']
  /** The day lists read as a plan, without the stops only the drive wants. */
  assignments: TripStoreState['assignments']
  tripAccommodations: Accommodation[]
  reservations: TripStoreState['reservations']
  places: Place[]
  visibleConnections: number[]
  routeProfile: PlannerMapView['routeProfile']
  mapPlaces: MapPlaces['mapPlaces']
  expandedDayIds: MapPlaces['expandedDayIds']
}

/**
 * The road trip as it is routed and drawn: whether the drive is shown and fed, the
 * traveller's driving preferences and limits, the day boundaries and their drag
 * controls, the vias, the refuel search, the routes, the corridor search, the track
 * being followed, the index helpers every via correction counts with, the days folded
 * away in the rail and the map layers that follow those folds.
 *
 * Its effects run where useTripPlanner calls it, right after the trip overview, in the
 * order they always had.
 */
export function useRoadtripFeed(options: RoadtripFeedOptions) {
  const {
    tripId, trip, can, toast, t, isMobile, activeTab, enabledAddons, roadtripMode, roadtripSettings,
    days, storedAssignments, assignments, tripAccommodations, reservations, places, visibleConnections,
    routeProfile, mapPlaces, expandedDayIds,
  } = options
  // Road trip mode reads the whole trip, not the selected day, so it owns its own legs.
  // Passing no days while the mode is off keeps it inert: no routing requests, no state.
  const roadtripActive = !!enabledAddons.roadtrip && roadtripMode
  // The phone's own way into the drive, and the reason `roadtripMode` in useTripPlanner
  // stays as it is.
  //
  // `roadtripMode` is not a view switch, it is a data switch: `assignments` and
  // `places` are derived from it for the whole planner, and every permanently mounted
  // sheet of the phone shell reads those same lists. Letting the phone flip it would
  // bring back exactly the regressions the comment on `roadtripMode` describes, on paths that
  // never touch a tab. The second tap on a day chip opens the day sheet, the More
  // button opens the PDF export.
  //
  // So the phone feeds the routing round instead, and nothing else. Once the tab has
  // been opened the feed stays on for as long as the trip is: a tab switch must not
  // throw away legs that cost a rate-limited request each.
  const roadtripTabSeen = useRef(false)
  if (activeTab === 'roadtrip') roadtripTabSeen.current = true
  const roadtripFeedActive = !!enabledAddons.roadtrip
    && (roadtripMode || (isMobile && (activeTab === 'roadtrip' || roadtripTabSeen.current)))
  const roadtripPreferencesState = useLoadRoadtripSettings(tripId, !!enabledAddons.roadtrip)
  useEffect(() => {
    if (roadtripPreferencesState.failed) toast.error(t('common.error'))
  }, [roadtripPreferencesState.failed, toast, t])
  const dailyTimesActive = !!dayWindow(roadtripSettings.roadtrip_day_start, roadtripSettings.roadtrip_day_end)
  // Fed from the same flag as the routing round: without the boundaries the phone
  // would draw a drive that never ends for the night.
  const dayBoundaries = useDayBoundaries(tripId, roadtripFeedActive && dailyTimesActive, assignments)
  useEffect(() => { if (dayBoundaries.stale) toast.error(t('trip.toast.loadError')) }, [dayBoundaries.stale, toast, t])
  const resetDayBoundaries = dayBoundaries.editable && dayBoundaries.boundaries.length && can('day_edit', trip) ? async () => {
    try {
      for (const boundary of dayBoundaries.boundaries) await dayBoundaries.save(boundary.day_number, null)
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) }
  } : undefined
  // Fed whenever the addon is on, not only while the mode is being looked at.
  // The three handlers that re-anchor a day's vias (assign, remove, reorder)
  // are reachable from the place inspector in both modes, and with an empty list
  // they computed an empty correction and wrote nothing while the server kept
  // every via pointing at a position that had moved. Deleting a stop with the
  // switch off then left the detour on the wrong leg, for the traveller and for
  // a collaborator who never turned the mode on at all.
  const roadtripVias = useRoadtripVias(tripId, !!enabledAddons.roadtrip)
  const refuel = useRefuelSearch()
  const roadtripRoutes = useRoadtripRoutes(
    tripId,
    roadtripFeedActive && roadtripPreferencesState.ready ? days : EMPTY_DAYS,
    // Deliberately the stored list, not the filtered one: the drive wants the
    // service stops and the night a lodging booking put on the map, and the filter
    // useTripPlanner puts on `assignments` only exists to keep those out of a day list
    // read as a plan.
    roadtripFeedActive ? storedAssignments : assignments,
    routeProfile,
    roadtripVias.byDay,
    dayBoundaries.boundaries,
    tripAccommodations,
    roadtripFeedActive ? reservations : EMPTY_RESERVATIONS,
  )
  /**
   * The bookings the drive is seamed by, drawn as their own arcs beside the roads: a
   * flight's route on the road trip map is the booking's line, the same one the day plan
   * draws, so the ride shows where the road stops (#2428). On top of whatever the reader
   * switched on by hand under Days.
   */
  const roadtripConnections = useMemo(() => {
    const rides = carrierReservationIds(roadtripRoutes.days)
    return rides.length ? [...new Set([...visibleConnections, ...rides])] : visibleConnections
  }, [roadtripRoutes.days, visibleConnections])
  // Lives here rather than in the panel because the map draws what it finds.
  // The trip comes with it for the vehicle: an electric car looks for chargers rather
  // than for pumps, and that preference is stored per trip.
  // The phone searches under a smaller ceiling: fewer boxes, a capped retry pass and a
  // deadline, because a search that keeps the radio warm costs battery somebody is
  // navigating on. Which stretch of the day it asks about is decided per search.
  const roadtripCorridor = useRoadtripCorridor(roadtripRoutes, tripId, isMobile ? PHONE_CORRIDOR_OPTIONS : undefined)
  // Applying a track is a long job, a routing round trip per refinement, so it lives
  // above the dialog: a component that unmounted halfway would leave the day holding
  // half a chain of vias.
  const followTrack = useFollowTrack(tripId, places, roadtripRoutes, roadtripVias)
  /** How many vias each day carries, for the rail's badge. */
  const roadtripViaCounts = useMemo(() => {
    const counts: Record<number, number> = {}
    for (const [dayId, list] of Object.entries(roadtripVias.byDay)) counts[Number(dayId)] = list.length
    return counts
  }, [roadtripVias.byDay])

  /**
   * The stops of a day as the road trip counts them, in the order it drives them.
   *
   * This is the index space `after_order_index` lives in: sorted by `order_index`, and
   * filtered to the rows that have coordinates, because a place the map cannot put
   * anywhere is not a point the router is given. Built from the STORED list, the same
   * one the routing round and the server count over. The day list read as a plan
   * hides the stop a lodging booking put on the day and, behind the switch, the
   * service stops; the handlers that correct a day's vias run in that mode too, and a
   * plan measured on the shorter list deleted a via behind a hidden hotel or pinned
   * it to a leg nobody drew. Built from the list rather than from `roadtripRoutes` so
   * it also answers for a day with one stop or none, which is exactly the day a stop
   * gets pushed onto when a leg turns out too long.
   */
  const roadtripStopsOf = useCallback((dayId: number) =>
    (storedAssignments[String(dayId)] ?? [])
      .slice()
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .filter(a => typeof a.place?.lat === 'number' && typeof a.place?.lng === 'number'),
  [storedAssignments])

  /**
   * Where a place dropped at `position` in a day's row list lands among the stops the
   * road trip counts.
   *
   * The day plan hands over a row index and the store splices the new row in at that
   * index, so the stop's place in the chain is the number of routable rows ahead of
   * it, not the index itself: a row without coordinates is never a stop.
   */
  const roadtripIndexOf = useCallback((dayId: number, position: number) =>
    (storedAssignments[String(dayId)] ?? [])
      .slice()
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .slice(0, Math.max(0, position))
      .filter(a => typeof a.place?.lat === 'number' && typeof a.place?.lng === 'number')
      .length,
  [storedAssignments])

  /**
   * Which half of a split leg a via belongs to, measured on the road actually driven.
   *
   * Both the via and the new stop are projected onto the day's current routed line, so
   * the comparison is "which one does the car reach first" rather than a straight-line
   * guess. The line already includes the detour the via causes, so the via sits exactly
   * on it and its position along the drive is exact.
   *
   * Falls back to keeping the via on the first half. A projection only fails when the
   * point is nowhere near the drive, and in that case leaving the anchor where it was is
   * the answer that changes least.
   */
  const viaLiesBefore = useCallback((dayId: number, at: { lat: number; lng: number }) => {
    const line: LatLng[] = (roadtripRoutes.days.find(d => d.dayId === dayId)?.geometry ?? [])
      .map(([lat, lng]) => ({ lat, lng }))
    const insertAt = line.length ? projectOntoRoute(at, line)?.alongKm ?? null : null
    return (via: { lat: number; lng: number }) => {
      if (insertAt === null) return true
      const viaAt = projectOntoRoute({ lat: via.lat, lng: via.lng }, line)?.alongKm
      return viaAt === undefined || viaAt === null ? true : viaAt < insertAt
    }
  }, [roadtripRoutes.days])

  /**
   * How a day's vias move when a place at `at` lands on it at row `position`, or at its
   * end without one. Null when none do: appending moves nothing, and a place without
   * coordinates is never a stop.
   *
   * Worked out before the stop lands, the same way the road-trip popup does it: once the
   * list has shifted there is no record of which leg each via was drawn for. The
   * predicate decides which side of the new stop a via falls on when it is dropped into
   * the middle of a leg.
   */
  const viasAfterInsert = useCallback((dayId: number, position: number | undefined, at: { lat?: number | null; lng?: number | null } | undefined) => {
    const stopsBefore = roadtripStopsOf(dayId)
    // The position is a row index in the day list, the anchors count stops.
    const insertAt = position === undefined ? stopsBefore.length : roadtripIndexOf(dayId, position)
    if (insertAt >= stopsBefore.length || typeof at?.lat !== 'number' || typeof at?.lng !== 'number') return null
    return reanchorAfterInsert(roadtripVias.byDay[dayId] ?? [], insertAt, viaLiesBefore(dayId, { lat: at.lat, lng: at.lng }))
  }, [roadtripStopsOf, roadtripIndexOf, roadtripVias.byDay, viaLiesBefore])

  /**
   * Days folded down to their header in the road trip rail.
   *
   * Its own state rather than the day plan's `expandedDayIds`: that one is owned by
   * `DayPlanSidebar`, which republishes it from its own state every time it mounts, so a
   * day folded in the rail would spring back open the moment the other view was visited.
   */
  const [collapsedRoadtripDays, setCollapsedRoadtripDays] = useState<Set<number>>(new Set())
  const toggleRoadtripDay = useCallback((dayId: number) => {
    setCollapsedRoadtripDays(prev => {
      const next = new Set(prev)
      if (!next.delete(dayId)) next.add(dayId)
      return next
    })
  }, [])

  /**
   * The road trip's lines, minus the days that are folded away.
   *
   * Folding a card takes that day off the map, which is most of what folding is for: a
   * rail entry can be scrolled past, a line across the map cannot be looked away from.
   * `lineDays` runs parallel to `lines`, so both are filtered in one pass and the colours
   * stay lined up with what is left.
   */
  const roadtripMapLines = useMemo(() => {
    if (!collapsedRoadtripDays.size) return roadtripRoutes.lines
    const hidden = new Set(
      roadtripRoutes.days.filter(d => collapsedRoadtripDays.has(d.dayId)).map(d => d.dayNumber),
    )
    return roadtripRoutes.lines.filter((_, i) => !hidden.has(roadtripRoutes.lineDays[i]))
  }, [roadtripRoutes.lines, roadtripRoutes.lineDays, roadtripRoutes.days, collapsedRoadtripDays])

  /**
   * The map's places with the folded cards' stops taken out.
   *
   * A second pass rather than a branch inside `mapPlaces`: that memo runs long before the
   * road trip is routed, and the answer here needs the CHAINS: a card is a date, and
   * after a night drive it holds stops stored on the day before (`nightSpill.ts`), so
   * what a folded card hides is what is drawn on it, not what is filed under its day.
   *
   * A place still drawn on some other card stays, which is the rule the day plan's own
   * declutter follows.
   */
  const roadtripMapPlaces = useMemo(() => {
    const plannedIds = new Set(Object.values(assignments).flat().map(a => a.place_id))
    // The hotel a day sets out from or ends at is drawn with its drive whether or not a day
    // still holds its stop: with that stop removed, the line and the walk to the door ended
    // at a spot with no pin, where the phone's stage map has one (`stagePlaceIds`).
    for (const day of roadtripRoutes.days) {
      for (const stop of day.stops) if (stop.bookend) plannedIds.add(stop.placeId)
    }
    const plannedPlaces = mapPlaces.filter(p => plannedIds.has(p.id))
    if (!collapsedRoadtripDays.size) return plannedPlaces
    const hidden = new Set<number>()
    for (const day of roadtripRoutes.days) {
      if (!collapsedRoadtripDays.has(day.dayId)) continue
      for (const stop of day.stops) if (!stop.automaticNight) hidden.add(stop.placeId)
    }
    for (const day of roadtripRoutes.days) {
      if (collapsedRoadtripDays.has(day.dayId)) continue
      for (const stop of day.stops) if (!stop.automaticNight) hidden.delete(stop.placeId)
    }
    return plannedPlaces.filter(p => !hidden.has(p.id))
  }, [mapPlaces, assignments, roadtripRoutes.days, collapsedRoadtripDays])

  // The recorded route follows the same folds as the places above, so a
  // collapsed day does not leave its line behind on the map. Keyed on the joined
  // dates rather than on the Set, because `days` changes identity on every store
  // update and the GL overlay rebuilds its source whenever this reference moves.
  const dawarichHiddenKey = useMemo(
    () => collapsedDayDates(days, expandedDayIds, roadtripActive ? collapsedRoadtripDays : null).join('|'),
    [days, expandedDayIds, roadtripActive, collapsedRoadtripDays],
  )
  const dawarichHiddenDates = useMemo(
    () => (dawarichHiddenKey ? new Set(dawarichHiddenKey.split('|')) : null),
    [dawarichHiddenKey],
  )

  /**
   * A colour per drawn line, or none at all.
   *
   * Off is not "all the same colour" but an absent array: the map then paints the blue it
   * has always painted, so a trip that never turns this on renders byte for byte the way
   * it did.
   */
  const roadtripLineColors = useMemo(
    () => {
      if (!roadtripSettings.roadtrip_day_colors) return undefined
      const hidden = new Set(
        roadtripRoutes.days.filter(d => collapsedRoadtripDays.has(d.dayId)).map(d => d.dayNumber),
      )
      return roadtripRoutes.lineDays.filter(n => !hidden.has(n)).map(n => dayColor(n))
    },
    [roadtripSettings.roadtrip_day_colors, roadtripRoutes.lineDays, roadtripRoutes.days, collapsedRoadtripDays],
  )

  /**
   * Stores one of the three driving limits.
   *
   * Straight to the settings store rather than through the offline queue: these are
   * per-user preferences on the settings table, the same path the map provider and the
   * distance unit take, and they are read locally the moment they change.
   */
  const saveRoadtripLimit = useCallback(async (key: string, value: number | string | boolean) => {
    try {
      if (!can('day_edit', trip) || !roadtripPreferencesState.ready) return
      const userId = useAuthStore.getState().user?.id
      if (!userId) return
      const preferences = await roadtripPreferencesRepo.update(tripId, { [key]: value })
      publishRoadtripPreferences(userId, tripId, preferences)
    } catch {
      toast.error(t('places.saveError'))
    }
  }, [tripId, trip, can, roadtripPreferencesState.ready, toast, t])

  const dayBoundaryControls = useMemo<DayBoundaryControls | undefined>(() => {
    if (!dayBoundaries.editable || !can('day_edit', trip) || !roadtripRoutes.boundaryPath?.length) return undefined
    return {
      path: roadtripRoutes.boundaryPath,
      hint: t('roadtrip.window.dragHint'),
      move: async (day, boundary) => {
        const next = dayBoundaries.boundaries.filter(b => b.day_number !== day)
        if (boundary) next.push(boundary)
        const issue = roadtripRoutes.validateBoundaries?.(next)
        if (boundary && issue) { toast.error(t(`roadtrip.window.${issue}`, { days: MAX_TRIP_DAYS })); return false }
        try { return await dayBoundaries.save(day, boundary) }
        catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')); return false }
      },
    }
  }, [dayBoundaries.editable, dayBoundaries.boundaries, dayBoundaries.save, can, trip, roadtripRoutes, t, toast])

  return {
    roadtripActive, roadtripFeedActive, roadtripPreferencesState, dailyTimesActive, dayBoundaries, resetDayBoundaries,
    roadtripVias, refuel, roadtripRoutes, roadtripConnections, roadtripCorridor, followTrack, roadtripViaCounts,
    roadtripStopsOf, viaLiesBefore, viasAfterInsert, collapsedRoadtripDays, toggleRoadtripDay,
    roadtripMapLines, roadtripMapPlaces, dawarichHiddenDates, roadtripLineColors, saveRoadtripLimit, dayBoundaryControls,
  }
}

export type RoadtripFeed = ReturnType<typeof useRoadtripFeed>
