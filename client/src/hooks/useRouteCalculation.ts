import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { useTripStore } from '../store/tripStore'
import { calculateRouteWithLegs } from '../components/Map/RouteCalculator'
import type { TripStoreState } from '../store/tripStore'
import type { RouteSegment, RouteResult } from '../types'

const TRANSPORT_TYPES = ['flight', 'train', 'bus', 'car', 'cruise']

/**
 * Manages route calculation state for a selected day. Extracts geo-coded waypoints from
 * day assignments, draws a straight-line route, and optionally fetches per-segment
 * driving/walking durations via OSRM. Aborts in-flight requests when the day changes.
 */
export function useRouteCalculation(tripStore: TripStoreState, selectedDayId: number | null, enabled: boolean = true, profile: 'driving' | 'walking' | 'cycling' = 'driving') {
  const [route, setRoute] = useState<[number, number][][] | null>(null)
  const [routeInfo, setRouteInfo] = useState<RouteResult | null>(null)
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([])
  const routeCalcEnabled = useSettingsStore((s) => s.settings.route_calculation) !== false
  const routeAbortRef = useRef<AbortController | null>(null)
  const reservationsForSignature = useTripStore((s) => s.reservations)

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

    // Build a unified list of places + transports sorted by effective position,
    // then derive segments by resetting whenever a transport appears — mirrors getMergedItems order.
    type Entry = { kind: 'place'; lat: number; lng: number } | { kind: 'transport' }
    const entries: (Entry & { pos: number })[] = [
      ...da.filter(a => a.place?.lat && a.place?.lng).map(a => ({
        kind: 'place' as const, lat: a.place.lat!, lng: a.place.lng!, pos: a.order_index,
      })),
      ...dayTransports.map(r => ({
        kind: 'transport' as const,
        pos: (r.day_positions?.[dayId] ?? r.day_positions?.[String(dayId)] ?? r.day_plan_position) as number,
      })),
    ].sort((a, b) => a.pos - b.pos)

    // Group consecutive located places into runs, resetting whenever a transport
    // appears (you don't drive between a flight's endpoints) — mirrors getMergedItems order.
    const runs: { lat: number; lng: number }[][] = []
    let currentRun: { lat: number; lng: number }[] = []
    for (const entry of entries) {
      if (entry.kind === 'place') {
        currentRun.push({ lat: entry.lat, lng: entry.lng })
      } else {
        if (currentRun.length >= 2) runs.push(currentRun)
        currentRun = []
      }
    }
    if (currentRun.length >= 2) runs.push(currentRun)

    const straightLines = (): [number, number][][] =>
      runs.map(r => r.map(p => [p.lat, p.lng] as [number, number]))

    if (runs.length === 0) { setRoute(null); setRouteSegments([]); return }

    // Draw straight lines immediately for snappiness, then upgrade to the real
    // OSRM road geometry. If route calc is disabled, keep the straight lines.
    setRoute(straightLines())
    if (!routeCalcEnabled) { setRouteSegments([]); return }

    const controller = new AbortController()
    routeAbortRef.current = controller
    try {
      const polylines: [number, number][][] = []
      const allLegs: RouteSegment[] = []
      for (const run of runs) {
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
  }, [routeCalcEnabled, enabled, profile])

  // Stable signature for transport reservations on the selected day — changes when a transport
  // is added, removed, or repositioned, ensuring route recalc fires even on transport-only reorders.
  const transportSignature = useMemo(() => {
    if (!selectedDayId) return ''
    return reservationsForSignature
      .filter(r => TRANSPORT_TYPES.includes(r.type))
      .map(r => {
        const pos = r.day_positions?.[selectedDayId] ?? r.day_positions?.[String(selectedDayId)] ?? r.day_plan_position
        return `${r.id}:${r.day_id ?? ''}:${r.end_day_id ?? ''}:${r.reservation_time ?? ''}:${pos ?? ''}`
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
  }, [selectedDayId, selectedDayAssignments, transportSignature, enabled, profile])

  return { route, routeSegments, routeInfo, setRoute, setRouteInfo, updateRouteForDay }
}
