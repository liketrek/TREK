import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useTripStore } from '../store/tripStore'
import { useSettingsStore } from '../store/settingsStore'
import { calculateRouteWithLegs, withHotelBookends } from '../components/Map/RouteCalculator'
import { getTransportRouteEndpoints, parseTimeToMinutes } from '../utils/dayMerge'
import { getDayBookendHotels } from '../utils/dayOrder'
import { DEFAULT_WAKE_UP_TIME, normalizeDurationMinutes, normalizeScheduleMarginMinutes } from '../utils/daySchedule'
import type { TripStoreState } from '../store/tripStore'
import type { RouteSegment, RouteResult, Accommodation } from '../types'
import type { GoogleRoutingOptions, RoutingProvider } from '../components/Map/RouteCalculator'

const TRANSPORT_TYPES = ['flight', 'train', 'bus', 'car', 'taxi', 'bicycle', 'cruise', 'ferry', 'transport_other']

const NO_ACCOMMODATIONS: Accommodation[] = []

function localDateTimeForDayMinute(date: string, minutes: number): string {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCMinutes(value.getUTCMinutes() + Math.round(minutes))
  return value.toISOString().slice(0, 16)
}

function routeSecondsToMinutes(seconds: number): number {
  return Math.max(0, Math.round((Number(seconds) || 0) / 60))
}

function appendRoutePolyline(
  polylines: [number, number][][],
  coordinates: [number, number][],
  fallback: [number, number][],
): void {
  polylines.push(coordinates.length >= 2 ? coordinates : fallback)
}

function accommodationPoint(accommodation?: Accommodation): { lat: number; lng: number } | null {
  return accommodation && accommodation.place_lat != null && accommodation.place_lng != null
    ? { lat: accommodation.place_lat, lng: accommodation.place_lng }
    : null
}

/**
 * Manages route calculation state for a selected day. Extracts geo-coded waypoints from
 * day assignments, draws a straight-line route immediately, then upgrades it to
 * provider route geometry with per-segment durations. Aborts in-flight requests when the day changes.
 */
export function useRouteCalculation(
  tripStore: TripStoreState,
  selectedDayId: number | null,
  enabled: boolean = true,
  profile: 'driving' | 'walking' | 'cycling' = 'driving',
  accommodations: Accommodation[] = NO_ACCOMMODATIONS,
  provider: RoutingProvider = 'osrm',
  optimism: number = 0.33,
  scheduleMarginMinutes: number = 0,
  googleRoutingOptions: GoogleRoutingOptions = {},
) {
  const [route, setRoute] = useState<[number, number][][] | null>(null)
  const [routeInfo, setRouteInfo] = useState<RouteResult | null>(null)
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([])
  const routeAbortRef = useRef<AbortController | null>(null)
  const reservationsForSignature = useTripStore((s) => s.reservations)
  const optimizeFromAccommodation = useSettingsStore((s) => s.settings.optimize_from_accommodation)
  const avoidTolls = googleRoutingOptions.avoidTolls === true
  const avoidHighways = googleRoutingOptions.avoidHighways === true
  const avoidFerries = googleRoutingOptions.avoidFerries === true

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
    const selectedDay = allDays.find(x => x.id === dayId)
    const wakeMinutes = parseTimeToMinutes(selectedDay?.wake_up_time || DEFAULT_WAKE_UP_TIME) ?? parseTimeToMinutes(DEFAULT_WAKE_UP_TIME)!
    const departureLocalDateTime = selectedDay?.date ? localDateTimeForDayMinute(selectedDay.date, wakeMinutes) : null
    const scheduleMargin = normalizeScheduleMarginMinutes(scheduleMarginMinutes)
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
      | { kind: 'place'; lat: number; lng: number; pos: number; durationMinutes: number }
      | { kind: 'transport'; from: { lat: number; lng: number } | null; to: { lat: number; lng: number } | null; pos: number }
    const entries: Entry[] = [
      ...da.filter(a => a.place?.lat && a.place?.lng).map(a => ({
        kind: 'place' as const,
        lat: a.place.lat!,
        lng: a.place.lng!,
        pos: a.order_index,
        durationMinutes: normalizeDurationMinutes(a.duration_minutes ?? a.place?.duration_minutes),
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

    const { morning: startHotel, evening: endHotel } =
      selectedDay && optimizeFromAccommodation !== false ? getDayBookendHotels(selectedDay, allDays, accommodations) : {}
    const flatPts: { lat: number; lng: number }[] = []
    for (const entry of entries) {
      if (entry.kind === 'place') flatPts.push({ lat: entry.lat, lng: entry.lng })
      else { if (entry.from) flatPts.push(entry.from); if (entry.to) flatPts.push(entry.to) }
    }
    const startHotelPoint = accommodationPoint(startHotel)
    const endHotelPoint = accommodationPoint(endHotel)
    const runsWithHotel = withHotelBookends(runs, flatPts[0], flatPts[flatPts.length - 1], startHotelPoint, endHotelPoint)

    const straightLines = (): [number, number][][] =>
      runsWithHotel.map(r => r.map(p => [p.lat, p.lng] as [number, number]))

    if (runsWithHotel.length === 0) { setRoute(null); setRouteSegments([]); return }

    // Draw straight lines immediately for snappiness, then upgrade to the real
    // provider route geometry.
    setRoute(straightLines())

    const controller = new AbortController()
    routeAbortRef.current = controller
    const routeLeg = async (
      from: { lat: number; lng: number },
      to: { lat: number; lng: number },
      departure: string | null,
      polylines: [number, number][][],
      allLegs: RouteSegment[],
    ): Promise<number> => {
      const leg = [from, to]
      try {
        const r = await calculateRouteWithLegs(leg, {
          signal: controller.signal,
          profile,
          provider,
          optimism,
          google: { avoidTolls, avoidHighways, avoidFerries },
          departureLocalDateTime: departure,
        })
        appendRoutePolyline(polylines, r.coordinates, leg.map(p => [p.lat, p.lng] as [number, number]))
        allLegs.push(...r.legs)
        return routeSecondsToMinutes(r.duration)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') throw err
        appendRoutePolyline(polylines, [], leg.map(p => [p.lat, p.lng] as [number, number]))
        return 0
      }
    }
    const routeRun = async (
      run: { lat: number; lng: number }[],
      departure: string | null,
      polylines: [number, number][][],
      allLegs: RouteSegment[],
    ): Promise<void> => {
      try {
        const r = await calculateRouteWithLegs(run, {
          signal: controller.signal,
          profile,
          provider,
          optimism,
          google: { avoidTolls, avoidHighways, avoidFerries },
          departureLocalDateTime: departure,
        })
        appendRoutePolyline(polylines, r.coordinates, run.map(p => [p.lat, p.lng] as [number, number]))
        allLegs.push(...r.legs)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') throw err
        appendRoutePolyline(polylines, [], run.map(p => [p.lat, p.lng] as [number, number]))
      }
    }

    try {
      const polylines: [number, number][][] = []
      const allLegs: RouteSegment[] = []
      if ((provider === 'google_maps' || provider === 'google_maps_mobile') && selectedDay?.date) {
        let cursor = wakeMinutes
        let currentPoint: { lat: number; lng: number } | null = startHotelPoint
        for (const entry of entries) {
          if (entry.kind === 'place') {
            if (currentPoint) {
              const travelMinutes = await routeLeg(
                currentPoint,
                { lat: entry.lat, lng: entry.lng },
                localDateTimeForDayMinute(selectedDay.date, cursor),
                polylines,
                allLegs,
              )
              cursor += travelMinutes + (travelMinutes > 0 ? scheduleMargin : 0)
            }
            cursor += entry.durationMinutes + scheduleMargin
            currentPoint = { lat: entry.lat, lng: entry.lng }
          } else if (entry.from || entry.to) {
            if (entry.from && currentPoint) {
              const travelMinutes = await routeLeg(
                currentPoint,
                entry.from,
                localDateTimeForDayMinute(selectedDay.date, cursor),
                polylines,
                allLegs,
              )
              cursor += travelMinutes + (travelMinutes > 0 ? scheduleMargin : 0)
            }
            currentPoint = entry.to ? { lat: entry.to.lat, lng: entry.to.lng } : null
          }
        }
        if (currentPoint && endHotelPoint) {
          await routeLeg(
            currentPoint,
            endHotelPoint,
            localDateTimeForDayMinute(selectedDay.date, cursor),
            polylines,
            allLegs,
          )
        }
      } else {
        for (const run of runsWithHotel) {
          await routeRun(run, departureLocalDateTime, polylines, allLegs)
        }
      }
      if (!controller.signal.aborted) { setRoute(polylines); setRouteSegments(allLegs) }
    } catch (err: unknown) {
      // Aborted (day changed) — newer call owns the state. Anything else: keep straight lines.
      if (!(err instanceof Error) || err.name !== 'AbortError') setRouteSegments([])
    }
  }, [enabled, profile, accommodations, optimizeFromAccommodation, provider, optimism, scheduleMarginMinutes, avoidTolls, avoidHighways, avoidFerries])

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
  }, [selectedDayId, selectedDayAssignments, transportSignature, enabled, profile, accommodations, optimizeFromAccommodation, provider, optimism, scheduleMarginMinutes, avoidTolls, avoidHighways, avoidFerries])

  return { route, routeSegments, routeInfo, setRoute, setRouteInfo, updateRouteForDay }
}
