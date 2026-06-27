import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useTripStore } from '../store/tripStore'
import { useSettingsStore } from '../store/settingsStore'
import { calculateRouteWithLegs, withHotelBookends } from '../components/Map/RouteCalculator'
import { getTransportRouteEndpoints } from '../utils/dayMerge'
import { getDayBookendHotels } from '../utils/dayOrder'
import type { TripStoreState } from '../store/tripStore'
import type { RouteSegment, RouteResult, Accommodation } from '../types'

const TRANSPORT_TYPES = ['flight', 'train', 'bus', 'car', 'taxi', 'bicycle', 'cruise', 'ferry', 'transport_other']

const NO_ACCOMMODATIONS: Accommodation[] = []

/**
 * Manages route calculation state for a selected day. Extracts geo-coded waypoints from
 * day assignments, draws a straight-line route immediately, then upgrades it to real OSRM
 * road geometry with per-segment durations. Aborts in-flight requests when the day changes.
 */
export function useRouteCalculation(tripStore: TripStoreState, selectedDayId: number | null, enabled: boolean = true, profile: 'driving' | 'walking' | 'cycling' = 'driving', accommodations: Accommodation[] = NO_ACCOMMODATIONS) {
  const [route, setRoute] = useState<[number, number][][] | null>(null)
  const [routeInfo, setRouteInfo] = useState<RouteResult | null>(null)
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([])
  const routeAbortRef = useRef<AbortController | null>(null)
  const reservationsForSignature = useTripStore((s) => s.reservations)
  // Draw the day's accommodation bookend legs (hotel → first stop, last stop →
  // hotel) unless the user turned the setting off — same gate as the sidebar.
  const optimizeFromAccommodation = useSettingsStore((s) => s.settings.optimize_from_accommodation)
  // Recompute when the user flips km↔mi so leg distances (formatted at compute time)
  // refresh instead of showing stale cached text (#1300).
  const distanceUnit = useSettingsStore((s) => s.settings.distance_unit)

  const updateRouteForDay = useCallback(async (dayId: number | null) => {
    if (routeAbortRef.current) routeAbortRef.current.abort()
    // Route is manual: only compute when explicitly enabled (the "show route" toggle).
    if (!dayId || !enabled) { setRoute(null); setRouteSegments([]); return }
    // Read directly from store (not a render-phase ref) so callers after optimistic
    // updates or non-optimistic deletes always see the latest assignments.
    const currentAssignments = useTripStore.getState().assignments || {}
    const da = (currentAssignments[String(dayId)] || []).slice().sort((a, b) => a.order_index - b.order_index)
    const allReservations = useTripStore.getState().reservations || []
    const allDays = useTripStore.getState().days || []
    const dayOrder = (id: number | null | undefined): number | null => {
      if (id == null) return null
      const d = allDays.find(x => x.id === id)
      return d ? ((d as any).day_number ?? allDays.indexOf(d)) : null
    }
    const thisOrder = dayOrder(dayId)

    // Transport reservations for this day with a known position — mirrors getTransportForDay semantics
    const dayTransports = thisOrder == null ? [] : allReservations.filter(r => {
      if (!TRANSPORT_TYPES.includes(r.type)) return false
      const startId = r.day_id
      if (startId == null) return false
      const endId = r.end_day_id ?? startId
      if (startId === endId) {
        if (startId !== dayId) return false
      } else {
        const startOrder = dayOrder(startId)
        const endOrder = dayOrder(endId)
        if (startOrder == null || endOrder == null) return false
        if (thisOrder < startOrder || thisOrder > endOrder) return false
      }
      const pos = r.day_positions?.[dayId] ?? r.day_positions?.[String(dayId)] ?? r.day_plan_position
      return pos != null
    })

    // Build a unified list of places + transports sorted by effective position.
    type Entry =
      | { kind: 'place'; lat: number; lng: number; pos: number }
      | { kind: 'transport'; from: { lat: number; lng: number } | null; to: { lat: number; lng: number } | null; pos: number }
    const entries: Entry[] = [
      ...da.filter(a => a.place?.lat && a.place?.lng).map(a => ({
        kind: 'place' as const, lat: a.place.lat!, lng: a.place.lng!, pos: a.order_index,
      })),
      ...dayTransports.map(r => {
        const { from, to } = getTransportRouteEndpoints(r, dayId)
        return {
          kind: 'transport' as const,
          from,
          to,
          pos: (r.day_positions?.[dayId] ?? r.day_positions?.[String(dayId)] ?? r.day_plan_position) as number,
        }
      }),
    ].sort((a, b) => a.pos - b.pos)

    // Group located places into driving runs.
    // - A transport WITH a location anchors the route to its departure point (you
    //   travel there), then breaks the run (you don't drive the flight/train); its
    //   arrival point starts the next run.
    // - A transport WITHOUT a location is ignored entirely — the places around it
    //   connect directly, as if the booking weren't there.
    const runs: { lat: number; lng: number }[][] = []
    let currentRun: { lat: number; lng: number }[] = []
    for (const entry of entries) {
      if (entry.kind === 'place') {
        currentRun.push({ lat: entry.lat, lng: entry.lng })
      } else if (entry.from || entry.to) {
        if (entry.from) currentRun.push(entry.from)
        if (currentRun.length >= 2) runs.push(currentRun)
        currentRun = []
        if (entry.to) currentRun.push(entry.to)
      }
    }
    if (currentRun.length >= 2) runs.push(currentRun)

    // Bookend the route with the day's accommodation: a hotel → first-stop run and
    // a last-stop → hotel run, so the drawn line matches the sidebar's hotel legs.
    // getDayBookendHotels returns the morning/evening hotel (they differ only on a
    // transfer day) and already filters to accommodations that have coordinates.
    const day = allDays.find(d => d.id === dayId)
    const bookends = day && optimizeFromAccommodation !== false
      ? getDayBookendHotels(day, allDays, accommodations)
      : null
    const flatPts: { lat: number; lng: number }[] = []
    for (const e of entries) {
      if (e.kind === 'place') flatPts.push({ lat: e.lat, lng: e.lng })
      else { if (e.from) flatPts.push(e.from); if (e.to) flatPts.push(e.to) }
    }
    const hotelPt = (a?: Accommodation) =>
      a && a.place_lat != null && a.place_lng != null ? { lat: a.place_lat, lng: a.place_lng } : null
    // Only draw a hotel bookend when the leg is real. A hotel → first-stop leg holds
    // if the first stop is a place, or if you actually slept in that hotel last night;
    // on a day-1 arrival the morning hotel is just a check-in fallback and the first
    // waypoint is the transport's departure point, so [hotel → departure] is dropped
    // (#1321). Symmetrically, [last-stop → hotel] is dropped when you leave on a transport
    // in the evening and don't sleep in that hotel tonight.
    const contributes = (e: Entry) => e.kind === 'place' || !!e.from || !!e.to
    const firstStop = entries.find(contributes)
    const lastStop = [...entries].reverse().find(contributes)
    const drawMorning = firstStop?.kind === 'place' || !!bookends?.morningIsSleptHere
    const drawEvening = lastStop?.kind === 'place' || !!bookends?.eveningIsOvernight
    const runsWithHotel = withHotelBookends(
      runs,
      flatPts[0],
      flatPts[flatPts.length - 1],
      drawMorning ? hotelPt(bookends?.morning) : null,
      drawEvening ? hotelPt(bookends?.evening) : null,
    )

    // Transfer day with no activities: you check out of one accommodation and into
    // another, so there are no waypoints for withHotelBookends to attach a leg to.
    // Draw the hotel → hotel transfer directly. Gated on both bookends being real
    // (drawMorning/drawEvening already exclude the #1321 arrival fallback) and the two
    // hotels being distinct, so an ordinary same-hotel rest day still draws nothing.
    if (runsWithHotel.length === 0 && drawMorning && drawEvening) {
      const m = hotelPt(bookends?.morning)
      const e = hotelPt(bookends?.evening)
      if (m && e && (m.lat !== e.lat || m.lng !== e.lng)) runsWithHotel.push([m, e])
    }

    const straightLines = (): [number, number][][] =>
      runsWithHotel.map(r => r.map(p => [p.lat, p.lng] as [number, number]))

    if (runsWithHotel.length === 0) { setRoute(null); setRouteSegments([]); return }

    // Draw straight lines immediately for snappiness, then upgrade to the real
    // OSRM road geometry.
    setRoute(straightLines())

    const controller = new AbortController()
    routeAbortRef.current = controller
    try {
      const polylines: [number, number][][] = []
      const allLegs: RouteSegment[] = []
      for (const run of runsWithHotel) {
        try {
          const r = await calculateRouteWithLegs(run, { signal: controller.signal, profile })
          polylines.push(r.coordinates.length >= 2 ? r.coordinates : run.map(p => [p.lat, p.lng] as [number, number]))
          allLegs.push(...r.legs)
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') throw err
          // OSRM failed for this run — fall back to a straight line, no times.
          polylines.push(run.map(p => [p.lat, p.lng] as [number, number]))
        }
      }
      if (!controller.signal.aborted) { setRoute(polylines); setRouteSegments(allLegs) }
    } catch (err: unknown) {
      // Aborted (day changed) — newer call owns the state. Anything else: keep straight lines.
      if (!(err instanceof Error) || err.name !== 'AbortError') setRouteSegments([])
    }
  }, [enabled, profile, accommodations, optimizeFromAccommodation, distanceUnit])

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
      .sort()
      .join('|')
  }, [reservationsForSignature, selectedDayId])

  // Recalculate when assignments or transport positions for the SELECTED day change
  const selectedDayAssignments = selectedDayId ? tripStore.assignments?.[String(selectedDayId)] : null
  useEffect(() => {
    if (!selectedDayId) { setRoute(null); setRouteSegments([]); return }
    updateRouteForDay(selectedDayId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDayId, selectedDayAssignments, transportSignature, enabled, profile, accommodations, optimizeFromAccommodation, distanceUnit])

  return { route, routeSegments, routeInfo, setRoute, setRouteInfo, updateRouteForDay }
}
