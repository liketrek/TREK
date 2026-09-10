import { useEffect, useMemo, useRef, useState } from 'react'
import { calculateRouteWithLegs, RoutingRefusedError } from '../Map/RouteCalculator'
import { resolveLegMode } from '../Planner/legMode'
import {
  deriveDriveWarnings, isServiceStopType, legIndexForAlong, refuelsRange, splitIntoRuns,
  type DayWarning, type DriveLimits, type Schedule, type ScheduleWarning, parseAvoid, type DryPoint } from './roadtripModel'
import { projectOntoRoute, pointAtMeters, sliceAtMeters, lineMetres } from './corridor'
import { spillChains, type SpillMark } from './nightSpill'
import { useSettingsStore } from '../../store/settingsStore'
import { useVehicleRange } from './useVehicleRange'
import type { Assignment, AssignmentsMap, Day, RouteAvoidClass, RouteSegment, RouteVia, SnappedWaypoint } from '../../types'
import { spurFor } from './accessSpur'
import type { RoadtripVia } from '@trek/shared'

/** One stop on a day's drive — an assignment whose place actually has coordinates. */
export interface RoadtripStop {
  assignmentId: number
  /**
   * The day this stop is STORED on, and its position there.
   *
   * A road trip draws its stops by the day they are reached, which after a drive across
   * midnight is not the day they are stored on — see `nightSpill.ts`. Nothing is written
   * to make that so, which means every callback that reorders, moves, re-anchors or adds
   * beside a stop has to name the day the server knows it by. That is this pair, and it
   * travels with the stop so no caller has to work it out.
   */
  ownerDayId: number
  ownerIndex: number
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
   * How full THIS stop fills up, 1-100, or null to follow the traveller's own setting.
   *
   * A property of the stop: the motorway rapid charger is worth 80 % because the last
   * fifth costs as long again, the one at the hotel is worth all of it because the car
   * stands there all night.
   *
   * Optional, like `offRoadMeters`: absent and null say the same thing, and a stop built
   * anywhere that has no opinion about filling up should not have to say so.
   */
  fillPercent?: number | null
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
   * Classes this day was asked to leave out and could not.
   *
   * Empty when the drive got what it asked for, and empty when nothing was asked. The
   * switch says "where possible", and this is what makes that honest rather than a
   * hedge: a drive with no untolled crossing comes back on the toll road, and the day
   * has to be able to say so instead of wearing a label the road disproves.
   */
  avoidMissed?: RouteAvoidClass[]
  /**
   * Where the tank runs dry on this day, once per fill-up, with a coordinate.
   *
   * Empty when no range limit is set, when the day never crosses it, or when a leg did
   * not route — the budget gives up rather than guessing, and so does this.
   */
  dryPoints?: (DryPoint & { lat: number; lng: number })[]
  /**
   * `geometry` with the non-driving runs left out, which is what `dryPoints` are measured
   * along. The same array as `geometry` on a day that drives the whole way.
   */
  drivingGeometry?: [number, number][]
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
  driveWarnings: ScheduleWarning[]
  /** More driving in this day than the traveller allows, or null. */
  dayWarning: DayWarning | null
  /**
   * Stretches of this day's chain that were driven onto it from an earlier day.
   *
   * Empty on an ordinary day, which is most of them. See `nightSpill.ts`: a drive that
   * crosses midnight is read on the date it ARRIVES, and the stops it reaches are drawn
   * here even though they are stored on the day they set off from. Each stop still names
   * that day in `ownerDayId`, so nothing that writes has to know about this.
   */
  spills?: SpillMark[]
}

/**
 * A day with its stops and nothing routed onto it yet — what the routing effect is handed
 * and what the arrangement by date is worked out from.
 */
type PlanDay = Pick<RoadtripDay, 'dayId' | 'dayNumber' | 'date' | 'title' | 'stops'>

/** A place, the road it is driven to from, and how far apart the two are. */
export interface AccessSpur {
  line: [[number, number], [number, number]]
  meters: number
  /** So the rail and the map can point at the same one. */
  stopKey: string
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
   * The day each entry of `lines` is driven on, same length and same order.
   *
   * So the map can colour the trip by day without knowing anything about how the days
   * were worked out. A night drive belongs to the day it ARRIVES on, the same rule its
   * kilometres follow.
   */
  lineDays: number[]
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

/**
 * The via points that shape the drive leaving a stop, as one comparable string.
 *
 * Read in two places that must agree: when deciding whether a seam still matches the
 * answer already in hand, and when recording what an answer was fetched for. One function
 * so the two cannot drift and quietly stop refetching.
 */
const seamShape = (from: RoadtripStop, viasByDay: Record<number, RoadtripVia[]>): string =>
  (viasByDay[from.ownerDayId] ?? [])
    .filter(v => v.after_order_index === from.ownerIndex)
    .sort((a, b) => a.sequence - b.sequence)
    .map(v => `${v.lat.toFixed(5)},${v.lng.toFixed(5)}`)
    .join('|')

/** The drive from one stop to the next, identified the same way `planKey` identifies them. */
const legKey = (from: RoadtripStop, to: RoadtripStop): string => `${stopKey(from)}>${stopKey(to)}`

const asStop = (a: Assignment, ownerDayId: number, ownerIndex: number): RoadtripStop | null => {
  const p = a.place
  if (!p || typeof p.lat !== 'number' || typeof p.lng !== 'number') return null
  return {
    assignmentId: a.id,
    ownerDayId,
    ownerIndex,
    placeId: a.place_id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    time: a.assignment_time ?? p.place_time ?? null,
    dwellMinutes: typeof p.duration_minutes === 'number' ? p.duration_minutes : null,
    legMode: a.leg_transport_mode ?? null,
    incomingLegMode: a.incoming_leg_transport_mode ?? null,
    stopType: p.stop_type ?? null,
    fillPercent: typeof p.fill_percent === 'number' ? p.fill_percent : null,
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
  /** Per day, the classes it was asked to avoid and did not get. See RoadtripDay.avoidMissed. */
  const [missedByDay, setMissedByDay] = useState<Record<number, RouteAvoidClass[]>>({})
  /**
   * Drives that only exist because a night moved a stop onto the next day's card.
   *
   * The trip is routed a stored day at a time, so the road between the last stop of one
   * day and the first of the next was never asked for — there was no chain that needed
   * it. Once a drive across midnight hands its stops forward, the stop it ends at and the
   * next day's own first stop become NEIGHBOURS in one chain, and a chain with a hole in
   * it draws two disconnected runs on the map. Filed by leg key like every other leg, so
   * everything downstream reads them without knowing where they came from.
   */
  const [seamLegs, setSeamLegs] = useState<Record<string, RoutedLeg & { shape: string }>>({})
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const legMinutes = useSettingsStore(s => s.settings.roadtrip_leg_minutes)
  const dayMinutes = useSettingsStore(s => s.settings.roadtrip_day_minutes)
  const fillPercent = useSettingsStore(s => s.settings.roadtrip_fill_percent)
  /**
   * Road classes to weight away, as the settings row stores them: a comma list.
   *
   * Parsed against the known classes rather than trusted, because there is no
   * server-side validation for a per-user setting — the write route stores any key with
   * any value — and an unknown word here would become a costing option the router does
   * not have.
   */
  const avoidSetting = useSettingsStore(s => s.settings.roadtrip_avoid)
  /**
   * Whether the gaps between days are driven too.
   *
   * A trip is stored as days and routed as days, so the road from one day's last stop to
   * the next day's first was never asked for: no chain needed it. Turning this on makes
   * the trip one continuous drive — every one of those gaps is routed, drawn, and counted
   * towards the day it ARRIVES on, which is the same rule a night drive already follows.
   */
  const connectDays = useSettingsStore(s => !!s.settings.roadtrip_connect_days)
  const avoid = useMemo(() => parseAvoid(avoidSetting), [avoidSetting])
  // What the car is and how far it goes on one fill, assembled in one place because the
  // rail needs the same answer to say what a given fill buys at a given stop.
  const { vehicleKind, rangeKm: planningRangeKm } = useVehicleRange()
  const avoidKey = avoid.join(',')
  // Zero and absent both mean "no limit": zero is a legal thing to type and says the
  // same thing, so it is folded here rather than guarded at every reading.
  const limits = useMemo<DriveLimits>(
    () => ({
      legMinutes: legMinutes || null,
      dayMinutes: dayMinutes || null,
      rangeKm: planningRangeKm,
      // Only a real fraction counts. Zero, absent and 100 all mean "fills right up",
      // which is what the budget did before the setting existed.
      fillPercent: fillPercent && fillPercent > 0 && fillPercent < 100 ? fillPercent : null,
    }),
    [legMinutes, dayMinutes, planningRangeKm, fillPercent],
  )

  const plan = useMemo<PlanDay[]>(() => {
    return [...days]
      .sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0))
      .map(d => {
        const stops = (assignments[String(d.id)] ?? [])
          .slice()
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
          .map(a => asStop(a, d.id, 0))
          .filter((s): s is RoadtripStop => s !== null)
          // The index is filled in after the drop, because it is the index into THIS
          // list: an assignment whose place has no coordinates never becomes a stop, and
          // counting before the filter would name a row the rail does not draw.
          .map((s, i) => ({ ...s, ownerIndex: i }))
        return {
          dayId: d.id,
          dayNumber: d.day_number ?? 0,
          date: d.date ?? null,
          title: d.title ?? null,
          stops,
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
          .map(a => asStop(a, d.id, 0))
          .filter((s): s is RoadtripStop => s !== null)
          .map((s, i) => ({ ...s, ownerIndex: i })),
      }))
      .filter(d => d.stops.length < 2)
  }, [days, assignments])

  // Only the geometry decides whether legs have to be re-fetched: renaming a place or
  // editing its notes must not fire a routing round.
  const viaKey = useMemo(
    () => Object.entries(viasByDay)
      .map(([dayId, vias]) => `${dayId}:${vias.map(v => `${v.after_order_index}@${v.lat.toFixed(5)},${v.lng.toFixed(5)}`).join('|')}`)
      // Only the order has to be stable — this is a cache key, not a list anybody reads
      // — but it has to be stable on purpose rather than by default.
      .sort((a, b) => a.localeCompare(b))
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
      setMissedByDay({})
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
    const collectedMisses: Record<number, RouteAvoidClass[]> = {}
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
            // A via is filed against the day it was dropped on and the position it sits
            // after IN THAT DAY. Since a chain can hold stops from an earlier day (see
            // `nightSpill.ts`), the lookup has to be the stop's own day and its own
            // index — this used to be the position within the chain, so on any day that
            // received a night drive every via matched nothing and quietly stopped
            // shaping the road.
            ;(viasByDay[stop.ownerDayId ?? day.dayId] ?? [])
              .filter(v => v.after_order_index === (stop.ownerIndex ?? i))
              .sort((a, b) => a.sequence - b.sequence)
              .forEach(v => waypoints.push({ lat: v.lat, lng: v.lng }))
          })

          for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
            if (controller.signal.aborted) return
            try {
              const r = await calculateRouteWithLegs(
                waypoints,
                { signal: controller.signal, profile: mode, tripId: tripId ?? null, dayId: day.dayId, avoid },
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
              /**
               * Where each leg starts and ends along the run, so its own stretch of road
               * can be cut out of the run's one polyline.
               *
               * Collected rather than cut on the spot because the cut is proportional:
               * the router reports a leg's length off its own graph while the polyline is
               * great-circle hops between the vertices it sent back, and the two never
               * agree exactly. Cutting at absolute metres left the last leg of every run
               * short by the difference. Cutting at the same FRACTION of each makes the
               * last cut land on the last vertex, so the pieces still rebuild the run.
               */
              const cuts: { key: string; from: number; to: number; seg: RouteSegment }[] = []
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
                const startedAt = travelled
                travelled += merged.distance ?? 0
                legEndMeters.push(travelled)
                const key = legKey(from, to)
                legKeys.push(key)
                cuts.push({ key, from: startedAt, to: travelled, seg: { ...merged, mode } }) 
              }
              // The road under each leg, in the polyline's own measure. It used to be
              // "the whole run hangs off leg 0", which was enough while a day was always
              // drawn whole — but a drive across midnight hands its stops to the next
              // card and the road has to travel with them.
              const drawnMetres = lineMetres(spine)
              const scale = travelled > 0 ? drawnMetres / travelled : 0
              for (const cut of cuts) {
                dayLegs[cut.key] = {
                  seg: cut.seg,
                  line: sliceAtMeters(spine, cut.from * scale, cut.to * scale)
                    .map(pt => [pt.lat, pt.lng] as [number, number]),
                  vias: [],
                }
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
        setMissedByDay({ ...collectedMisses })
        // Only pace what actually went out. RouteCalculator answers a repeat from its
        // cache in well under a millisecond, and switching back into road trip mode is
        // all repeats — waiting a second between those made a warm view feel broken.
        const wasNetwork = performance.now() - startedAt > CACHE_HIT_MS
        if (wasNetwork && i < tasks.length - 1) await sleep(REQUEST_SPACING_MS, controller.signal)
      }
      if (!controller.signal.aborted) setLoading(false)
    })()

    return () => controller.abort()
    // planKey stands in for `plan`: same geometry, same legs. avoidKey, not `avoid`:
    // a fresh array every render would re-route on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKey, routeProfile, distanceUnit, tripId, avoidKey])

  /**
   * Every leg known so far, by the two stops it connects.
   *
   * Filed under a key built from the stops' own coordinates, so which day it was fetched
   * under stops mattering the moment a drive across midnight moves its stops to the next
   * card — the road between two places is the road between them whichever date it is
   * driven on.
   */
  const allLegs = useMemo(() => {
    const out: Record<string, RoutedLeg> = {}
    for (const day of plan) Object.assign(out, legsByDay[day.dayId] ?? {})
    return { ...out, ...seamLegs }
  }, [plan, legsByDay, seamLegs])

  // Which date each stop is actually reached on. Nothing is written to make it so; see
  // `nightSpill.ts`.
  const chains = useMemo(
    () => spillChains(plan, quietDays, (a, b) => allLegs[legKey(a, b)]),
    [plan, quietDays, allLegs],
  )

  /**
   * Pairs a chain needs a road for and does not have.
   *
   * Only ever a seam between two stored days: everything inside one day was routed as a
   * run. Left unrouted the rail shows a chain that stops halfway and the map draws the
   * day in two pieces with a gap across the middle.
   */
  const seams = useMemo(() => {
    const out: { from: RoadtripStop; to: RoadtripStop; dayId: number }[] = []
    const want = (from: RoadtripStop, to: RoadtripStop, dayId: number): void => {
      // Routed as part of a day's own run — that request is rebuilt whenever its vias
      // change, so there is nothing to catch up here.
      if (legsByDay[from.ownerDayId]?.[legKey(from, to)]) return
      // A seam already fetched is skipped only while it was fetched for the SHAPE it has
      // now. Skipping it whenever any answer existed is what made a via on a seam do
      // nothing at all: the first answer was cached under the pair, and dragging the
      // point changed the request nobody was going to send again.
      const have = seamLegs[legKey(from, to)]
      if (have && have.shape === seamShape(from, viasByDay)) return
      out.push({ from, to, dayId })
    }
    for (const chain of chains) {
      for (let i = 0; i < chain.stops.length - 1; i++) {
        const from = chain.stops[i]
        const to = chain.stops[i + 1]
        // Inside one stored day it was routed as part of that day's run.
        if (from.ownerDayId === to.ownerDayId) continue
        want(from, to, chain.dayId)
      }
    }
    // And, when the traveller asks for one continuous drive, the road from each card's
    // last stop to the next card's first — the one gap a day-at-a-time routing leaves.
    if (connectDays) {
      for (let d = 0; d < chains.length - 1; d++) {
        const from = chains[d].stops[chains[d].stops.length - 1]
        const to = chains[d + 1].stops[0]
        if (from && to) want(from, to, chains[d + 1].dayId)
      }
    }
    return out
  }, [chains, legsByDay, seamLegs, viasByDay, connectDays])
  const seamKey = seams.map(s => `${legKey(s.from, s.to)}#${seamShape(s.from, viasByDay)}`).join(';')

  useEffect(() => {
    if (!seams.length) return
    const controller = new AbortController()
    void (async () => {
      for (const seam of seams) {
        if (controller.signal.aborted) return
        const mode = resolveLegMode(
          { isPlace: true, leg_transport_mode: seam.from.legMode },
          { isPlace: true, incoming_leg_transport_mode: seam.to.incomingLegMode },
          days.find(d => d.id === seam.dayId)?.default_transport_mode || routeProfile,
        )
        try {
          // The via points on this seam, threaded in the same way the day runs thread
          // theirs. Without them a seam is the one stretch of the trip a via cannot
          // shape: it is asked for on its own, so the points the traveller dropped on it
          // never reached the router and dragging one did visibly nothing.
          const shaping = (viasByDay[seam.from.ownerDayId] ?? [])
            .filter(v => v.after_order_index === seam.from.ownerIndex)
            .sort((a, b) => a.sequence - b.sequence)
          const r = await calculateRouteWithLegs(
            [
              { lat: seam.from.lat, lng: seam.from.lng },
              ...shaping.map(v => ({ lat: v.lat, lng: v.lng })),
              { lat: seam.to.lat, lng: seam.to.lng },
            ],
            { signal: controller.signal, profile: mode, tripId: tripId ?? null, dayId: seam.dayId, avoid },
          )
          if (controller.signal.aborted) return
          // One leg per waypoint PAIR, so a shaped seam comes back in pieces and the rail
          // wants the whole drive: summed here, exactly as a day run folds its via legs
          // back onto the stop pair they belong to.
          if (!r.legs.length) continue
          const merged = r.legs.length === 1 ? r.legs[0] : {
            ...r.legs[0],
            distance: r.legs.reduce((sum, l) => sum + (l.distance ?? 0), 0),
            duration: r.legs.reduce((sum, l) => sum + (l.duration ?? 0), 0),
          }
          setSeamLegs(prev => ({
            ...prev,
            [legKey(seam.from, seam.to)]: {
              seg: { ...merged, mode },
              line: r.coordinates,
              vias: [],
              shape: seamShape(seam.from, viasByDay),
            },
          }))
        } catch {
          // A seam that will not route stays missing, exactly like any other leg that
          // will not route: the chain shows a gap and the totals are partial rather than
          // invented. Retried on the next run of this effect.
          if (controller.signal.aborted) return
        }
        await sleep(REQUEST_SPACING_MS, controller.signal)
      }
    })()
    return () => controller.abort()
    // seamKey stands in for `seams`: same pairs, same requests. avoidKey, not `avoid`:
    // a fresh array every render would re-ask for every seam on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seamKey, routeProfile, tripId, avoidKey])

  return useMemo(() => {
    // Legs and snaps, flat. They are filed under a key built from the two stops' own
    // coordinates, so which day they were fetched under stops mattering the moment a
    // drive across midnight moves its stops to the next card — the road between two
    // places is the road between them whichever date it is driven on.
    const allSnaps: Record<string, SnappedWaypoint> = {}
    for (const day of plan) Object.assign(allSnaps, snapByDay[day.dayId] ?? {})
    const legFor = (from: RoadtripStop, to: RoadtripStop): RoutedLeg | undefined => allLegs[legKey(from, to)]

    const lines: [number, number][][] = []
    const lineDays: number[] = []
    const segments: RouteSegment[] = []
    const accessLines: RoadtripRoutes['accessLines'] = []
    // A loop rather than a map, because the range budget outlives a single day: a tank
    // does not empty overnight, so what is left at the end of one day is what the next
    // one starts with. `chains` is already in day order, and the legs inside them are in
    // driving order, which is the order the tank is emptied in.
    const out: RoadtripDay[] = []
    let carryKm: number | null = 0
    /** The stop the previous card ended at, so the next one can be driven to from it. */
    let previousStop: RoadtripStop | undefined
    /** And which day that was, so the road out of it is drawn as that day's. */
    let previousDayNumber: number | undefined
    for (const chain of chains) {
      const routed = chain.stops.slice(0, -1).map((s, i) => legFor(s, chain.stops[i + 1]))
      /**
       * The drives that reach this card rather than leave from it, and only when the
       * traveller asked for them.
       *
       * Every one of these crosses from one card to the next: a night drive that handed
       * its stops forward, or plainly the road from yesterday's last stop to today's
       * first. Whether a road trip is one continuous line or a day at a time is exactly
       * what the switch asks, so with it off a card holds only the driving between its
       * own stops — no stroke across the join, and none of those kilometres in its total.
       *
       * A night drive is no exception. It is stored inside one day and it is real
       * driving, but on screen it runs from a stop on one card to a stop on the next, and
       * a line between two cards is the thing the switch is about.
       *
       * `drawnAs` is the day it LEAVES rather than the one it arrives on. The kilometres
       * count towards the arrival, because that is when they are driven, but the stroke
       * starts at a stop on yesterday's card and colouring it as tomorrow makes tomorrow
       * look like it begins at a stop that is not on it.
       */
      const inboundAt = new Map<number, { seg: RouteSegment | undefined; line: [number, number][]; drawnAs: number }>()
      if (connectDays) {
        for (const spill of chain.spills) {
          inboundAt.set(spill.at, { seg: spill.leg, line: spill.line, drawnAs: spill.fromDayNumber })
        }
        // And the road out of the previous card where no night drive already opens this
        // one. Nothing moved for that one: it is the gap a day-at-a-time plan leaves.
        const joined = inboundAt.has(0) ? undefined : previousStop && legFor(previousStop, chain.stops[0])
        if (joined) inboundAt.set(0, { seg: joined.seg, line: joined.line, drawnAs: previousDayNumber ?? chain.dayNumber })
      }
      previousStop = chain.stops[chain.stops.length - 1] ?? previousStop
      previousDayNumber = chain.stops.length ? chain.dayNumber : previousDayNumber
      for (let i = 0; i < chain.stops.length; i++) {
        const inbound = inboundAt.get(i)
        if (inbound) {
          if (inbound.line.length > 1) { lines.push(inbound.line); lineDays.push(inbound.drawnAs) }
          if (inbound.seg) segments.push(inbound.seg)
        }
        const leg = routed[i]
        if (!leg) continue
        if (leg.line.length > 1) { lines.push(leg.line); lineDays.push(chain.dayNumber) }
        segments.push(leg.seg)
      }
      // Each leg carries its own stretch of road now, so the day's line is simply its
      // legs end to end — with the night that reached it threaded in at the stop it
      // arrives at, so the line is drawn in the order it is driven.
      const geometry: [number, number][] = []
      for (let i = 0; i < chain.stops.length; i++) {
        const inbound = inboundAt.get(i)
        if (inbound) geometry.push(...inbound.line)
        geometry.push(...(routed[i]?.line ?? []))
      }
      const legs = routed.map(l => l?.seg)
      const inbound = [...inboundAt.values()].map(l => l.seg)
      const distance = legs.reduce((sum, l) => sum + (l?.distance ?? 0), 0)
        + inbound.reduce((sum, l) => sum + (l?.distance ?? 0), 0)
      const duration = legs.reduce((sum, l) => sum + (l?.duration ?? 0), 0)
        + inbound.reduce((sum, l) => sum + (l?.duration ?? 0), 0)
      const schedule = chain.schedule
      const legVias = routed.map(l => l?.vias ?? [])
      const stops = chain.stops.map(s => {
        const snap = allSnaps[stopKey(s)]
        const line = spurFor(snap)
        if (line) accessLines.push({ line, meters: snap.meters, stopKey: stopKey(s) })
        return { ...s, offRoadMeters: line ? snap.meters : null }
      })
      // The night drive is on the tank too, and it is in no leg list: it ends at this
      // chain's first stop rather than leaving from it. Added to the carry so the budget
      // has spent it before the first stop of the day gets a chance to fill up again.
      const inboundKm = inbound
        .filter(l => l && (l.mode === undefined || l.mode === 'driving'))
        .reduce((sum, l) => sum + (l?.distance ?? 0), 0) / 1000
      const startKm = carryKm === null ? null : carryKm + inboundKm
      const drive = deriveDriveWarnings(
        legs,
        // One longer than the legs: the last stop of the day counts too, because filling
        // up on arrival is what makes the next morning start full.
        stops.map(s => refuelsRange(s.stopType, vehicleKind)),
        limits,
        startKm,
        // Same length and same order, so a stop that says how far it fills is read
        // against itself rather than against the traveller's default.
        stops.map(s => s.fillPercent),
      )
      carryKm = drive.carryKm
      // Where each tank runs dry, as a place rather than a distance.
      //
      // Walked along the DRIVING legs only. `geometry` above is every leg end to end,
      // ferries and walks included, while the budget counts none of those — so walking
      // the drawn line to the same figure overshoots by the whole length of any crossing
      // the day happens to contain, and the marker lands a ferry's width off the road.
      const drivingLine = routed
        .filter(l => l && l.seg.mode !== undefined && l.seg.mode === 'driving')
        .flatMap(l => l?.line ?? [])
      const dryPoints = drive.emptyAt
        .map(dry => {
          const at = pointAtMeters(drivingLine.map(([lat, lng]) => ({ lat, lng })), dry.drivenMeters)
          return at ? { ...dry, lat: at.lat, lng: at.lng } : null
        })
        .filter((d): d is DryPoint & { lat: number; lng: number } => d !== null)
      // The same line the dry points are measured along, so anything offered against
      // them is projected in the same space. Handed on as the SAME array when the day
      // drives all the way through, which is nearly every day — only a day carrying a
      // ferry or a walk pays for a second copy.
      const drivingGeometry = drivingLine.length === geometry.length ? geometry : drivingLine
      out.push({
        dayId: chain.dayId,
        dayNumber: chain.dayNumber,
        date: chain.date,
        title: chain.title,
        avoidMissed: missedByDay[chain.dayId],
        spills: chain.spills,
        stops, legs, legVias, schedule, geometry, distance, duration, dryPoints, drivingGeometry,
        driveWarnings: drive.warnings,
        dayWarning: drive.day,
      })
    }
    const drives = out.filter(d => d.stops.length > 1)
    return {
      days: drives,
      lines,
      lineDays,
      segments,
      accessLines,
      vias: out.flatMap(d => d.legVias.flat()),
      totalDistance: drives.reduce((s, d) => s + d.distance, 0),
      totalDuration: drives.reduce((s, d) => s + d.duration, 0),
      // Over the days the head is a summary OF, which is the ones with a drive: a day
      // holding a single stop draws no card and contributes nothing else here either.
      // Service stops are not stops in this sense — a charger on the way is part of the
      // drive, and counting it here would make the head disagree with the day cards.
      totalStops: drives.reduce((s, d) => s + d.stops.filter(st => !isServiceStopType(st.stopType)).length, 0),
      // A day left with one stop or none draws no drive, so it stays what it was: an
      // outline that appears while a stop is in flight and is not worth a row otherwise.
      quietDays: out
        .filter(d => d.stops.length < 2)
        .map(d => ({ dayId: d.dayId, dayNumber: d.dayNumber, date: d.date, title: d.title, stops: d.stops })),
      loading,
    }
  }, [plan, chains, allLegs, snapByDay, missedByDay, loading, limits, vehicleKind, connectDays])
}