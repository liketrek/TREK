import { useCallback, useEffect, useRef, useState } from 'react'
import { useDawarichTrail } from '../../components/Map/useDawarichTrail'
import type { TripStoreState } from '../../store/tripStore'
import type { Place } from '../../types'
import type { PlannerBase } from './plannerTypes'

interface PlannerMapViewOptions extends Pick<PlannerBase, 'tripId' | 'trip'> {
  places: Place[]
  selectedDayId: TripStoreState['selectedDayId']
  isMobile: boolean
}

/**
 * How the planner's map is shown: the day route toggle and its travel profile, the
 * whole-trip overview, the map lock, the recorded Dawarich trail, and the fit key
 * with the one automatic fit each trip gets when it first has places to show.
 */
export function usePlannerMapView(options: PlannerMapViewOptions) {
  const { tripId, trip, places, selectedDayId, isMobile } = options
  // Manual route planning: off by default, toggled from the day-plan footer. Mode
  // is per-session and selects which travel time the connectors show: either a
  // built-in OSRM profile or a plugin route profile ('plugin:<id>/<profile>').
  // Per-trip route visibility. `null` = the user has never said anything, which
  // is what lets the mobile map switch it on by default; an explicit false has to
  // survive every later map entry, and it used to be clobbered on each one (#2003).
  const routeStorageKey = tripId ? `trek:day-route:${tripId}` : null
  const [routeChoice, setRouteChoice] = useState<boolean | null>(() => {
    if (typeof window === 'undefined' || !routeStorageKey) return null
    const raw = window.localStorage.getItem(routeStorageKey)
    return raw === 'true' ? true : raw === 'false' ? false : null
  })
  const routeShown = routeChoice === true
  const setRouteShown = useCallback((v: boolean | ((prev: boolean) => boolean)) => {
    setRouteChoice(prev => {
      const next = typeof v === 'function' ? v(prev === true) : v
      if (routeStorageKey && typeof window !== 'undefined') {
        window.localStorage.setItem(routeStorageKey, String(next))
      }
      return next
    })
  }, [routeStorageKey])
  // The mobile map opens with the day's route drawn. That is a default, not a choice,
  // so it never overwrites an explicit off and is never written to storage itself.
  const autoShowRoute = useCallback(() => {
    setRouteChoice(prev => (prev === null ? true : prev))
  }, [])
  // What the planner maps actually draw. The persisted toggle can rehydrate as
  // true while no day is selected yet (trip re-entry resets the selection, and
  // a second click on the day header clears it). Without a day context the
  // per-day transit filter is off, so the map would draw every automated
  // transport in the trip (#2019).
  const transitRoutesShown = routeShown && selectedDayId != null
  const [routeProfile, setRouteProfile] = useState<string>('driving')
  // Whole-trip route overview (#1736): every day's route at once, each in its own
  // colour. Per trip and per session like road trip mode: it answers "what does the
  // whole thing look like", which is a question you ask of one trip, not a preference.
  const [overviewShown, setOverviewShown] = useState<boolean>(() => sessionStorage.getItem(`trip-overview-${tripId}`) === '1')
  const toggleOverview = useCallback(() => {
    setOverviewShown(prev => {
      const next = !prev
      sessionStorage.setItem(`trip-overview-${tripId}`, next ? '1' : '0')
      return next
    })
  }, [tripId])
  // A locked map stays where the traveller put it (#2010): picking a day or a place no
  // longer zooms or pans it. Remembered per browser, like the other view toggles; the
  // first frame of a trip still fits, or the map would open on nothing.
  const [mapLocked, setMapLocked] = useState<boolean>(() => {
    try { return localStorage.getItem('trek:map-locked') === '1' } catch { return false }
  })
  const mapLockedRef = useRef(mapLocked)
  mapLockedRef.current = mapLocked
  const isMobileRef = useRef(isMobile)
  isMobileRef.current = isMobile
  const toggleMapLocked = useCallback(() => {
    setMapLocked(prev => {
      const next = !prev
      try { localStorage.setItem('trek:map-locked', next ? '1' : '0') } catch { /* private mode keeps it for the session */ }
      return next
    })
  }, [])
  // The recorded route from Dawarich (#2279), per trip and per session for the
  // same reason as the overview above: it answers "what actually happened on
  // this trip", which is a question about one trip rather than a preference.
  const [dawarichTrailShown, setDawarichTrailShown] = useState<boolean>(
    () => sessionStorage.getItem(`trip-dawarich-${tripId}`) === '1',
  )
  const toggleDawarichTrail = useCallback(() => {
    setDawarichTrailShown(prev => {
      const next = !prev
      sessionStorage.setItem(`trip-dawarich-${tripId}`, next ? '1' : '0')
      return next
    })
  }, [tripId])
  // Fetched here rather than in MapViewAuto so the desktop and the phone share
  // one request, and so the pill that toggles it can show why there is no line.
  const dawarichTrail = useDawarichTrail(tripId, dawarichTrailShown)

  const [fitKey, setFitKey] = useState<number>(0)
  const initialFitTripId = useRef<number | null>(null)

  useEffect(() => {
    if (!trip) return
    if (initialFitTripId.current === trip.id) return
    const hasGeoPlaces = places.some(p => p.lat != null && p.lng != null)
    if (!hasGeoPlaces) return
    initialFitTripId.current = trip.id
    setFitKey(k => k + 1)
  }, [trip, places])

  return {
    routeShown, setRouteShown, autoShowRoute, transitRoutesShown, routeProfile, setRouteProfile,
    overviewShown, toggleOverview, mapLocked, toggleMapLocked, mapLockedRef, isMobileRef,
    dawarichTrailShown, toggleDawarichTrail, dawarichTrail, fitKey, setFitKey,
  }
}

export type PlannerMapView = ReturnType<typeof usePlannerMapView>
