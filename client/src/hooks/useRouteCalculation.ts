import { useRoadtripSettings } from './useRoadtripSettings'
import { isServiceStopType } from '../components/Roadtrip/roadtripModel'
import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useTripStore } from '../store/tripStore'
import { useSettingsStore } from '../store/settingsStore'
import { calculateRouteWithLegs, type RouteProfileKey } from '../components/Map/RouteCalculator'
import { buildDayRouteRuns, TRANSPORT_TYPES } from '../components/Map/dayRoutePlan'
import { resolveLegMode } from '../components/Planner/legMode'
import type { TripStoreState } from '../store/tripStore'
import type { RouteSegment, RouteResult, RouteVia, Accommodation } from '../types'

const NO_ACCOMMODATIONS: Accommodation[] = []

/**
 * Manages route calculation state for a selected day. Extracts geo-coded waypoints from
 * day assignments, draws a straight-line route immediately, then upgrades it to real OSRM
 * road geometry with per-segment durations. Aborts in-flight requests when the day changes.
 */
export function useRouteCalculation(tripStore: TripStoreState, selectedDayId: number | null, enabled: boolean = true, profile: RouteProfileKey = 'driving', accommodations: Accommodation[] = NO_ACCOMMODATIONS) {
  const [route, setRoute] = useState<[number, number][][] | null>(null)
  const [routeInfo, setRouteInfo] = useState<RouteResult | null>(null)
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([])
  // Charging stops / rest areas a plugin route places on the drawn line.
  const [routeVias, setRouteVias] = useState<RouteVia[]>([])
  const mirrorServiceStops = useRoadtripSettings(s => s.roadtrip_service_stops_in_days !== false)
  const routeAbortRef = useRef<AbortController | null>(null)
  const reservationsForSignature = useTripStore((s) => s.reservations)
  // Recompute when the selected day's whole-day default mode changes (#1281) —
  // including a remote collaborator's change, which arrives as day:updated and only
  // touches state.days (otherwise not an effect dependency, so the map/mobile
  // connectors would stay in the old mode while the sidebar already switched).
  const selectedDayDefaultMode = useTripStore((s) => (selectedDayId ? s.days?.find(d => d.id === selectedDayId)?.default_transport_mode ?? null : null))
  // Draw the day's accommodation bookend legs (hotel → first stop, last stop →
  // hotel) unless the user turned the setting off — same gate as the sidebar.
  const optimizeFromAccommodation = useSettingsStore((s) => s.settings.optimize_from_accommodation)
  // Recompute when the user flips km↔mi so leg distances (formatted at compute time)
  // refresh instead of showing stale cached text (#1300).
  const distanceUnit = useSettingsStore((s) => s.settings.distance_unit)

  const updateRouteForDay = useCallback(async (dayId: number | null) => {
    if (routeAbortRef.current) routeAbortRef.current.abort()
    // Route is manual: only compute when explicitly enabled (the "show route" toggle).
    if (!dayId || !enabled) { setRoute(null); setRouteSegments([]); setRouteVias([]); return }
    // Read directly from store (not a render-phase ref) so callers after optimistic
    // updates or non-optimistic deletes always see the latest assignments.
    const state = useTripStore.getState()
    const allDays = state.days || []
    const runsWithHotel = buildDayRouteRuns(dayId, {
      days: allDays,
      assignments: Object.fromEntries(Object.entries(state.assignments || {}).map(([id, entries]) => [id, entries.filter(a => mirrorServiceStops || !isServiceStopType(a.place?.stop_type))])),
      reservations: state.reservations || [],
      accommodations,
      optimizeFromAccommodation,
    })
    const day = allDays.find(d => d.id === dayId)

    const straightLines = (): [number, number][][] =>
      runsWithHotel.map(r => r.map(p => [p.lat, p.lng] as [number, number]))

    if (runsWithHotel.length === 0) { setRoute(null); setRouteSegments([]); setRouteVias([]); return }

    // Draw straight lines immediately for snappiness, then upgrade to the real
    // OSRM (or plugin-provided) road geometry.
    setRoute(straightLines())

    const tripId = useTripStore.getState().trip?.id ?? null
    const controller = new AbortController()
    routeAbortRef.current = controller
    // Per-leg routing (#1281): each leg uses its origin's saved mode, else the
    // day's default, else the live picker profile. Legs are concatenated back into
    // one polyline per run, and each segment is tagged with the mode it drew in so
    // the connector shows the matching icon and duration.
    const dayDefaultMode = day?.default_transport_mode || profile
    try {
      const polylines: [number, number][][] = []
      const allLegs: RouteSegment[] = []
      const allVias: RouteVia[] = []
      for (const run of runsWithHotel) {
        const polyline: [number, number][] = []
        // Append a leg's coordinates, dropping the point shared with the previous
        // leg so concatenated legs don't leave a duplicate at each junction.
        const pushCoords = (coords: [number, number][]) => {
          for (const c of coords) {
            const last = polyline[polyline.length - 1]
            if (last && last[0] === c[0] && last[1] === c[1]) continue
            polyline.push(c)
          }
        }
        // Neighbouring legs that resolve to the SAME mode travel as one
        // multi-waypoint request — the router answers with one leg per pair, so
        // the per-connector segments stay exactly as they were, and a day without
        // per-leg overrides is back to a single call per run.
        let i = 0
        while (i < run.length - 1) {
          const mode = resolveLegMode(run[i], run[i + 1], dayDefaultMode)
          let end = i + 1
          while (end < run.length - 1 && resolveLegMode(run[end], run[end + 1], dayDefaultMode) === mode) end++
          const chunk = run.slice(i, end + 1)
          const straight = (): [number, number][] => chunk.map(p => [p.lat, p.lng] as [number, number])
          try {
            const r = await calculateRouteWithLegs(chunk.map(p => ({ lat: p.lat, lng: p.lng })), { signal: controller.signal, profile: mode, tripId, dayId })
            pushCoords(r.coordinates.length >= 2 ? r.coordinates : straight())
            for (const leg of r.legs) allLegs.push({ ...leg, mode })
            if (r.vias) allVias.push(...r.vias)
          } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') throw err
            // Routing failed for these legs — fall back to straight lines, no times.
            pushCoords(straight())
          }
          i = end
        }
        if (polyline.length >= 2) polylines.push(polyline)
      }
      if (!controller.signal.aborted) { setRoute(polylines); setRouteSegments(allLegs); setRouteVias(allVias) }
    } catch (err: unknown) {
      // Aborted (day changed) — newer call owns the state. Anything else: keep straight lines.
      if (!(err instanceof Error) || err.name !== 'AbortError') { setRouteSegments([]); setRouteVias([]) }
    }
  }, [enabled, profile, accommodations, optimizeFromAccommodation, distanceUnit, selectedDayDefaultMode, mirrorServiceStops])

  // Stable signature for transport reservations on the selected day — changes when a transport
  // is added, removed, or repositioned, ensuring route recalc fires even on transport-only reorders.
  const transportSignature = useMemo(() => {
    if (!selectedDayId) return ''
    return reservationsForSignature
      .filter(r => TRANSPORT_TYPES.includes(r.type))
      .map(r => {
        const pos = r.day_positions?.[selectedDayId] ?? r.day_positions?.[String(selectedDayId)] ?? r.day_plan_position
        // Include endpoints so adding/moving a departure/arrival location re-routes.
        const eps = (r.endpoints || []).map(e => `${e.role}@${e.lat ?? ''},${e.lng ?? ''}`).join(';')
        return `${r.id}:${r.day_id ?? ''}:${r.end_day_id ?? ''}:${r.reservation_time ?? ''}:${pos ?? ''}:${eps}`
      })
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
      .join('|')
  }, [reservationsForSignature, selectedDayId])

  // Recalculate when assignments or transport positions for the SELECTED day change
  const selectedDayAssignments = selectedDayId ? tripStore.assignments?.[String(selectedDayId)] : null
  useEffect(() => {
    if (!selectedDayId) { setRoute(null); setRouteSegments([]); setRouteVias([]); return }
    updateRouteForDay(selectedDayId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDayId, selectedDayAssignments, transportSignature, enabled, profile, accommodations, optimizeFromAccommodation, distanceUnit, selectedDayDefaultMode, mirrorServiceStops])

  return { route, routeSegments, routeVias, routeInfo, setRoute, setRouteInfo, updateRouteForDay }
}
