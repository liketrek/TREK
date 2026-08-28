import { useEffect, useMemo, useRef, useState } from 'react'
import { calculateRouteWithLegs } from '../Map/RouteCalculator'
import { resolveLegMode } from '../Planner/legMode'
import { computeSchedule, splitIntoRuns, type Schedule } from './roadtripModel'
import { useSettingsStore } from '../../store/settingsStore'
import type { Assignment, AssignmentsMap, Day, RouteSegment } from '../../types'

/** One stop on a day's drive — an assignment whose place actually has coordinates. */
export interface RoadtripStop {
  assignmentId: number
  placeId: number
  name: string
  lat: number
  lng: number
  /** Planned time on the assignment, or the place's own time as the fallback the API already resolves. */
  time: string | null
  /** How long the visit is planned to take. `places.duration_minutes` has carried this for years. */
  dwellMinutes: number | null
  /** Mode of the leg LEAVING this stop; null inherits the day default. */
  legMode: string | null
  incomingLegMode: string | null
}

export interface RoadtripDay {
  dayId: number
  dayNumber: number
  date: string | null
  title: string | null
  stops: RoadtripStop[]
  /** Leg i connects stops[i] → stops[i+1]. Shorter than `stops` by one once every leg resolved. */
  legs: (RouteSegment | undefined)[]
  /** Arrival and departure per stop, walked forward from the day's first pinned time. */
  schedule: Schedule
  /**
   * The roads actually driven that day, as [lat, lng] — not the straight lines between
   * stops. Anything asking "what is along this day" has to use this: between Hamburg and
   * Berlin the straight line runs across open country while the motorway swings north of
   * it, so a corridor built from the stops finds the wrong side of the map.
   */
  geometry: [number, number][]
  distance: number
  duration: number
}

export interface RoadtripRoutes {
  days: RoadtripDay[]
  /** One polyline per routed leg, in trip order — what the map draws in road trip mode. */
  lines: [number, number][][]
  /** The routed legs themselves, so the map can label each connector. */
  segments: RouteSegment[]
  totalDistance: number
  totalDuration: number
  totalStops: number
  /** True while legs are still coming in — the numbers below are a partial sum until then. */
  loading: boolean
}

/**
 * Gap between two routing requests. The public OSRM hosts TREK ships with state one
 * request per second; a road trip asks for every leg of every day, so without spacing
 * the first handful answer and the rest come back 429.
 */
const REQUEST_SPACING_MS = 1100
/** Anything answered faster than this came out of RouteCalculator cache, not the network. */
const CACHE_HIT_MS = 60
/** How often a leg that failed (usually a rate limit) is tried again, and how long after. */
const RETRY_DELAYS_MS = [1500, 4000]

const sleep = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise(resolve => {
    if (signal.aborted) { resolve(); return }
    const timer = setTimeout(done, ms)
    function done(): void {
      clearTimeout(timer)
      signal.removeEventListener('abort', done)
      resolve()
    }
    signal.addEventListener('abort', done, { once: true })
  })

/** A leg that routed: the numbers for the rail plus the geometry the map draws. */
interface RoutedLeg {
  seg: RouteSegment
  line: [number, number][]
}

const asStop = (a: Assignment): RoadtripStop | null => {
  const p = a.place
  if (!p || typeof p.lat !== 'number' || typeof p.lng !== 'number') return null
  return {
    assignmentId: a.id,
    placeId: a.place_id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    time: a.assignment_time ?? p.place_time ?? null,
    dwellMinutes: typeof p.duration_minutes === 'number' ? p.duration_minutes : null,
    legMode: a.leg_transport_mode ?? null,
    incomingLegMode: a.incoming_leg_transport_mode ?? null,
  }
}

/**
 * Distance and driving time for every leg of every day of the trip.
 *
 * The day plan sidebar routes one day at a time because that is all it shows; a road
 * trip is the whole chain, which is exactly what #435 asks for.
 *
 * A day is one request, not one per leg: the router already returns a leg for every
 * consecutive pair of the waypoints it is handed. Requests go out one after another
 * with a gap, because the public routing hosts TREK ships with allow about one per
 * second — but only the ones that actually reach the network are paced, so returning
 * to this view costs nothing.
 */
export function useRoadtripRoutes(
  tripId: number | string | null,
  days: Day[],
  assignments: AssignmentsMap,
  /** Mode for legs that neither the stop nor the day pins down. */
  fallbackProfile: string = 'driving',
): RoadtripRoutes {
  const routeProfile = fallbackProfile || 'driving'
  // Leg text is pre-formatted in the chosen unit, so a km↔mi switch has to re-fetch.
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  const [legsByDay, setLegsByDay] = useState<Record<number, Record<number, RoutedLeg>>>({})
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const plan = useMemo<RoadtripDay[]>(() => {
    return [...days]
      .sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0))
      .map(d => {
        const stops = (assignments[String(d.id)] ?? [])
          .slice()
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
          .map(asStop)
          .filter((s): s is RoadtripStop => s !== null)
        return {
          dayId: d.id,
          dayNumber: d.day_number ?? 0,
          date: d.date ?? null,
          title: d.title ?? null,
          stops,
          legs: [],
          schedule: { entries: [], warnings: [] },
          geometry: [],
          distance: 0,
          duration: 0,
        }
      })
      .filter(d => d.stops.length > 1)
  }, [days, assignments])

  // Only the geometry decides whether legs have to be re-fetched: renaming a place or
  // editing its notes must not fire a routing round.
  const planKey = useMemo(
    () => plan.map(d => `${d.dayId}:${d.stops.map(s => `${s.lat.toFixed(5)},${s.lng.toFixed(5)},${s.legMode ?? ''},${s.incomingLegMode ?? ''}`).join('|')}`).join(';'),
    [plan],
  )

  useEffect(() => {
    abortRef.current?.abort()
    if (!plan.length) {
      setLegsByDay({})
      setLoading(false)
      return
    }
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)

    const dayDefault = (dayId: number): string =>
      days.find(d => d.id === dayId)?.default_transport_mode || routeProfile

    const collected: Record<number, Record<number, RoutedLeg>> = {}
    const tasks: (() => Promise<void>)[] = []

    for (const day of plan) {
      const dayLegs: Record<number, RoutedLeg> = {}
      collected[day.dayId] = dayLegs
      const dfMode = dayDefault(day.dayId)

      const runs = splitIntoRuns(day.stops, (from, to) =>
        resolveLegMode(
          { isPlace: true, leg_transport_mode: from.legMode },
          { isPlace: true, incoming_leg_transport_mode: to.incomingLegMode },
          dfMode,
        ))

      for (const { stops: run, mode } of runs) {
        tasks.push(async () => {
          for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
            if (controller.signal.aborted) return
            try {
              const r = await calculateRouteWithLegs(
                run.map(s => ({ lat: s.lat, lng: s.lng })),
                { signal: controller.signal, profile: mode, tripId: tripId ?? null, dayId: day.dayId },
              )
              // legs[i] is the drive from run[i] to run[i+1]; the geometry comes back for
              // the run as a whole, which is what the map draws.
              r.legs.forEach((leg, i) => {
                const from = run[i]
                if (from) dayLegs[from.assignmentId] = { seg: { ...leg, mode }, line: i === 0 ? r.coordinates : [] }
              })
              return
            } catch {
              // Almost always a rate limit on the shared routing host. Back off and try
              // again; a run that still won't route (island hop, dead router) simply stays
              // blank, and the totals say so by being partial rather than wrong.
              const delay = RETRY_DELAYS_MS[attempt]
              if (delay === undefined) return
              await sleep(delay, controller.signal)
            }
          }
        })
      }
    }

    // One at a time, spaced out. The day sidebar can afford a small pool because it
    // routes a single day; a road trip is every leg of every day at once, and the
    // public routing hosts answer that with 429 after the first handful. Results are
    // published as they land so the rail fills in instead of sitting empty.
    void (async () => {
      for (let i = 0; i < tasks.length; i++) {
        if (controller.signal.aborted) return
        const startedAt = performance.now()
        await tasks[i]()
        if (controller.signal.aborted) return
        setLegsByDay({ ...collected })
        // Only pace what actually went out. RouteCalculator answers a repeat from its
        // cache in well under a millisecond, and switching back into road trip mode is
        // all repeats — waiting a second between those made a warm view feel broken.
        const wasNetwork = performance.now() - startedAt > CACHE_HIT_MS
        if (wasNetwork && i < tasks.length - 1) await sleep(REQUEST_SPACING_MS, controller.signal)
      }
      if (!controller.signal.aborted) setLoading(false)
    })()

    return () => controller.abort()
    // planKey stands in for `plan`: same geometry, same legs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKey, routeProfile, distanceUnit, tripId])

  return useMemo(() => {
    const lines: [number, number][][] = []
    const segments: RouteSegment[] = []
    const out = plan.map(day => {
      const dayLegs = legsByDay[day.dayId] ?? {}
      const routed = day.stops.slice(0, -1).map(s => dayLegs[s.assignmentId])
      for (const leg of routed) {
        if (!leg) continue
        if (leg.line.length > 1) lines.push(leg.line)
        segments.push(leg.seg)
      }
      // The run polylines end to end: leg 0 of a run carries its whole geometry, the
      // rest carry none, so concatenating what is there gives the day as driven.
      const geometry = routed.flatMap(l => l?.line ?? [])
      const legs = routed.map(l => l?.seg)
      const distance = legs.reduce((sum, l) => sum + (l?.distance ?? 0), 0)
      const duration = legs.reduce((sum, l) => sum + (l?.duration ?? 0), 0)
      const schedule = computeSchedule(
        day.stops.map(s => ({ anchor: s.time, dwellMinutes: s.dwellMinutes })),
        legs.map(l => l?.duration),
      )
      return { ...day, legs, schedule, geometry, distance, duration }
    })
    return {
      days: out,
      lines,
      segments,
      totalDistance: out.reduce((s, d) => s + d.distance, 0),
      totalDuration: out.reduce((s, d) => s + d.duration, 0),
      totalStops: out.reduce((s, d) => s + d.stops.length, 0),
      loading,
    }
  }, [plan, legsByDay, loading])
}
