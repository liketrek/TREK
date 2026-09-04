import { useEffect, useMemo, useRef, useState } from 'react'
import { calculateRouteWithLegs, RoutingRefusedError } from '../Map/RouteCalculator'
import { resolveLegMode } from '../Planner/legMode'
import { computeSchedule, isServiceStopType, legIndexForAlong, splitIntoRuns, type Schedule } from './roadtripModel'
import { projectOntoRoute } from './corridor'
import { useSettingsStore } from '../../store/settingsStore'
import type { Assignment, AssignmentsMap, Day, RouteSegment, RouteVia, SnappedWaypoint } from '../../types'
import { spurFor } from './accessSpur'
import type { RoadtripVia } from '@trek/shared'

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
  /** fuel / charging / rest_area / campsite, or null for an ordinary place (#1797). */
  stopType: string | null
  /**
   * How far the router had to go to find a road, in metres, once this stop has routed.
   *
   * null means either not routed yet or close enough that nobody would call it a gap.
   */
  offRoadMeters?: number | null
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
   * Halts a routing plugin placed on each leg, indexed alongside `legs`.
   *
   * Read-only and never written back: a plugin halt that became a via would go out as a
   * waypoint on the next run, and the plugin would then optimise around its own charging
   * stop. Kept out of `RouteSegment` because that type is read by half the map.
   */
  legVias: RouteVia[][]
  /**
   * The roads actually driven that day, as [lat, lng] — not the straight lines between
   * stops. Anything asking "what is along this day" has to use this: between Hamburg and
   * Berlin the straight line runs across open country while the motorway swings north of
   * it, so a corridor built from the stops finds the wrong side of the map.
   */
  geometry: [number, number][]
  distance: number
  duration: number
  /**
   * Findings about the driving itself, per leg: too long behind the wheel, the tank
   * running out before the next fuel stop. Separate from `schedule.warnings`, which are
   * findings about a stop, because these belong to no stop and because `Schedule` is
   * pinned shape-for-shape by its own tests.
   */
  driveWarnings?: DriveWarning[]
  /** A finding about the day as a whole, such as more driving than the day allows. */
  dayWarning?: DriveWarning | null
}

/** A place, the road it is driven to from, and how far apart the two are. */
export interface AccessSpur {
  line: [[number, number], [number, number]]
  meters: number
  /** So the rail and the map can point at the same one. */
  stopKey: string
}

/** A finding about the drive rather than about a stop. */
export interface DriveWarning {
  /** Which leg it belongs to; -1 means the day as a whole. */
  legIndex: number
  code: 'legTooLong' | 'dayTooLong' | 'outOfRange'
  /** By how much, in the unit the code implies: minutes for the first two, km for range. */
  over?: number
}

/** A day the rail does not draw a drive for, but that a stop can still be moved onto. */
export interface QuietDay {
  dayId: number
  dayNumber: number
  date: string | null
  title: string | null
  /** Usually none or one — two would have made it a drive. */
  stops: RoadtripStop[]
}

export interface RoadtripRoutes {
  days: RoadtripDay[]
  /**
   * Days with fewer than two stops, in trip order.
   *
   * They carry no drive, so they are not part of `days` and nothing is routed for them —
   * but a stop has to be able to move onto one, and a day that is not on screen cannot be
   * dropped on. Listed separately rather than folded into `days` so the totals and the
   * routing keep meaning exactly what they meant before.
   */
  quietDays: QuietDay[]
  /** One polyline per routed leg, in trip order — what the map draws in road trip mode. */
  lines: [number, number][][]
  /**
   * The gap between a place and the road it was routed from, as a two-point line.
   *
   * Drawn dashed, the way Google draws the walk from the kerb to the door, so a stop well
   * off the road reads as "the drive ends here and the rest is not driving" instead of
   * looking like a route that cuts across open country.
   */
  accessLines: AccessSpur[]
  /** Every plugin halt of the trip, flat, which is the shape the map draws. */
  vias: RouteVia[]
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

/**
 * A leg that routed: the numbers for the rail plus the geometry the map draws.
 *
 * The two optional fields are filled by their own features and are declared here rather
 * than added later, because this shape is written in one place and read in another and
 * three separate changes to the same two lines is three merge conflicts.
 */
interface RoutedLeg {
  seg: RouteSegment
  line: [number, number][]
  /**
   * Where the router actually put each end of this leg, and how far that is from the
   * place we asked for. OSRM snaps every waypoint to the nearest road with no distance
   * limit and reports both in every response; a place set well off the road otherwise
   * looks like it is on the route when the drive really starts hundreds of metres away.
   */
  snapped?: { from: SnappedPoint | null; to: SnappedPoint | null }
  /** Halts a routing plugin placed on this leg, in the order they are driven through. */
  vias: RouteVia[]
}

/** A waypoint as the router resolved it, beside the coordinate that was asked for. */
export interface SnappedPoint {
  lat: number
  lng: number
  /** Straight-line metres from the requested coordinate to the road it snapped to. */
  offRoadMeters: number
}

/**
 * What makes a stop the same stop as far as routing is concerned. `planKey` is built from
 * these, and so are the keys the routed legs are filed under, so the two can never drift
 * apart.
 *
 * Deliberately not the assignment id. A stop added mid-day is written optimistically with
 * a temporary negative id (`assignmentsSlice`) and swapped for the real one once the
 * server answers, without its coordinates changing — so `planKey` stays identical, the
 * effect does not run again, and a leg filed under the id would sit under a dead one
 * forever. A missing leg breaks the schedule's chain (`computeSchedule` gives up its
 * cursor), which would silently blank every arrival time after the new stop.
 */
const stopKey = (s: RoadtripStop): string =>
  `${s.lat.toFixed(5)},${s.lng.toFixed(5)},${s.legMode ?? ''},${s.incomingLegMode ?? ''}`

/** The drive from one stop to the next, identified the same way `planKey` identifies them. */
const legKey = (from: RoadtripStop, to: RoadtripStop): string => `${stopKey(from)}>${stopKey(to)}`

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
    stopType: p.stop_type ?? null,
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
  /**
   * Points the drive is made to pass through, per day (#1797). They join the routing
   * request between the stops they follow, so the router draws the road the traveller
   * chose rather than the one it prefers.
   */
  viasByDay: Record<number, RoadtripVia[]> = {},
): RoadtripRoutes {
  const routeProfile = fallbackProfile || 'driving'
  // Leg text is pre-formatted in the chosen unit, so a km↔mi switch has to re-fetch.
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  const [legsByDay, setLegsByDay] = useState<Record<number, Record<string, RoutedLeg>>>({})
  /**
   * Where the router put each stop, by day and stop key.
   *
   * Kept beside the legs rather than inside them because it belongs to a stop and a leg
   * has two of them: the arrival end of one leg is the departure end of the next, and
   * filing it twice would draw the spur twice.
   */
  const [snapByDay, setSnapByDay] = useState<Record<number, Record<string, SnappedWaypoint>>>({})
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
          legVias: [],
          schedule: { entries: [], warnings: [] },
          geometry: [],
          distance: 0,
          duration: 0,
        }
      })
      .filter(d => d.stops.length > 1)
  }, [days, assignments])

  const quietDays = useMemo<QuietDay[]>(() => {
    return [...days]
      .sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0))
      .map(d => ({
        dayId: d.id,
        dayNumber: d.day_number ?? 0,
        date: d.date ?? null,
        title: d.title ?? null,
        stops: (assignments[String(d.id)] ?? [])
          .slice()
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
          .map(asStop)
          .filter((s): s is RoadtripStop => s !== null),
      }))
      .filter(d => d.stops.length < 2)
  }, [days, assignments])

  // Only the geometry decides whether legs have to be re-fetched: renaming a place or
  // editing its notes must not fire a routing round.
  const viaKey = useMemo(
    () => Object.entries(viasByDay)
      .map(([dayId, vias]) => `${dayId}:${vias.map(v => `${v.after_order_index}@${v.lat.toFixed(5)},${v.lng.toFixed(5)}`).join('|')}`)
      .sort()
      .join(';'),
    [viasByDay],
  )

  const planKey = useMemo(
    () => `${plan.map(d => `${d.dayId}:${d.stops.map(stopKey).join('|')}`).join(';')}#${viaKey}`,
    [plan, viaKey],
  )

  useEffect(() => {
    abortRef.current?.abort()
    if (!plan.length) {
      setLegsByDay({})
      setSnapByDay({})
      setLoading(false)
      return
    }
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)

    const dayDefault = (dayId: number): string =>
      days.find(d => d.id === dayId)?.default_transport_mode || routeProfile

    const collected: Record<number, Record<string, RoutedLeg>> = {}
    const collectedSnaps: Record<number, Record<string, SnappedWaypoint>> = {}
    const tasks: (() => Promise<void>)[] = []

    for (const day of plan) {
      const dayLegs: Record<string, RoutedLeg> = {}
      collected[day.dayId] = dayLegs
      const dfMode = dayDefault(day.dayId)

      const runs = splitIntoRuns(day.stops, (from, to) =>
        resolveLegMode(
          { isPlace: true, leg_transport_mode: from.legMode },
          { isPlace: true, incoming_leg_transport_mode: to.incomingLegMode },
          dfMode,
        ))

      const dayVias = viasByDay[day.dayId] ?? []

      for (const { stops: run, mode } of runs) {
        tasks.push(async () => {
          // Waypoints are the stops with this day's vias threaded in between them, so the
          // router draws the road the traveller picked. `stopAt` remembers which waypoint
          // each stop became, because the answer has a leg per waypoint PAIR and the rail
          // wants one leg per stop pair.
          const waypoints: { lat: number; lng: number }[] = []
          const stopAt: number[] = []
          run.forEach((stop, i) => {
            stopAt.push(waypoints.length)
            waypoints.push({ lat: stop.lat, lng: stop.lng })
            if (i === run.length - 1) return
            const dayIndex = day.stops.indexOf(stop)
            dayVias
              .filter(v => v.after_order_index === dayIndex)
              .sort((a, b) => a.sequence - b.sequence)
              .forEach(v => waypoints.push({ lat: v.lat, lng: v.lng }))
          })

          for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
            if (controller.signal.aborted) return
            try {
              const r = await calculateRouteWithLegs(
                waypoints,
                { signal: controller.signal, profile: mode, tripId: tripId ?? null, dayId: day.dayId },
              )
              // Where each stop ended up. stopAt[i] is that stop's waypoint index, so the
              // vias threaded in between are skipped: a via is a shape handle, not a
              // destination, and a dashed spur hanging off one reads as a fault.
              if (r.snapped) {
                const daySnaps = (collectedSnaps[day.dayId] ??= {})
                run.forEach((stop, i) => {
                  const s = r.snapped?.[stopAt[i]]
                  if (s) daySnaps[stopKey(stop)] = s
                })
              }
              // Where a plugin's halts sit along this run, measured once. Only the ones
              // that say something get projected — a bare coordinate has nothing to show
              // in the rail, and projection is not free.
              const spine = r.coordinates.map(([la, ln]) => ({ lat: la, lng: ln }))
              const viaAlong = (r.vias ?? [])
                .filter(v => v.label || v.dwellSeconds != null)
                .map(v => ({ via: v, alongMeters: (projectOntoRoute({ lat: v.lat, lng: v.lng }, spine)?.alongKm ?? 0) * 1000 }))

              // Fold the router's per-waypoint legs back onto the stop pairs: a stop pair
              // with a via between it comes back as two legs, and the rail shows one.
              // A running metre count comes with it, so each halt lands on the leg it is
              // actually driven on rather than on the nearest stop, which two towns close
              // together would get wrong.
              const legEndMeters: number[] = []
              const legKeys: string[] = []
              let travelled = 0
              for (let i = 0; i < run.length - 1; i++) {
                const from = run[i]
                const to = run[i + 1]
                if (!from || !to) continue
                const parts = r.legs.slice(stopAt[i], stopAt[i + 1])
                if (!parts.length) continue
                const merged = parts.length === 1 ? parts[0] : {
                  ...parts[0],
                  distance: parts.reduce((sum, l) => sum + (l.distance ?? 0), 0),
                  duration: parts.reduce((sum, l) => sum + (l.duration ?? 0), 0),
                }
                travelled += merged.distance ?? 0
                legEndMeters.push(travelled)
                const key = legKey(from, to)
                legKeys.push(key)
                dayLegs[key] = { seg: { ...merged, mode }, line: i === 0 ? r.coordinates : [], vias: [] }
              }
              for (const { via, alongMeters } of viaAlong) {
                const idx = legIndexForAlong(legEndMeters, alongMeters)
                if (idx >= 0) dayLegs[legKeys[idx]].vias.push(via)
              }
              return
            } catch (err) {
              // Almost always a rate limit on the shared routing host. Back off and try
              // again; a run that still won't route (island hop, dead router) simply stays
              // blank, and the totals say so by being partial rather than wrong.
              const delay = RETRY_DELAYS_MS[attempt]
              if (delay === undefined) return
              // When the host says how long to wait, waiting less is just a second refusal.
              const asked = err instanceof RoutingRefusedError && err.isRateLimit ? err.retryAfterMs : null
              await sleep(Math.max(delay, asked ?? 0), controller.signal)
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
        setSnapByDay({ ...collectedSnaps })
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
    const accessLines: RoadtripRoutes['accessLines'] = []
    // A loop rather than a map: the days are walked in order and findings that outlive a
    // single day (a range budget carried across midnight) need somewhere to live between
    // iterations. Nothing accumulates yet; the shape is here so the feature that needs it
    // does not have to rewrite this block a second time.
    const out: RoadtripDay[] = []
    for (const day of plan) {
      const dayLegs = legsByDay[day.dayId] ?? {}
      const daySnaps = snapByDay[day.dayId] ?? {}
      const routed = day.stops.slice(0, -1).map((s, i) => dayLegs[legKey(s, day.stops[i + 1])])
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
      const legVias = routed.map(l => l?.vias ?? [])
      const stops = day.stops.map(s => {
        const snap = daySnaps[stopKey(s)]
        const line = spurFor(snap)
        if (line) accessLines.push({ line, meters: snap.meters, stopKey: stopKey(s) })
        return { ...s, offRoadMeters: line ? snap.meters : null }
      })
      out.push({ ...day, stops, legs, legVias, schedule, geometry, distance, duration })
    }
    return {
      days: out,
      lines,
      segments,
      accessLines,
      vias: out.flatMap(d => d.legVias.flat()),
      totalDistance: out.reduce((s, d) => s + d.distance, 0),
      totalDuration: out.reduce((s, d) => s + d.duration, 0),
      // Service stops are not stops in this sense — a charger on the way is part of the
      // drive, and counting it here would make the head disagree with the day cards.
      totalStops: out.reduce((s, d) => s + d.stops.filter(st => !isServiceStopType(st.stopType)).length, 0),
      quietDays,
      loading,
    }
  }, [plan, legsByDay, snapByDay, loading, quietDays])
}
