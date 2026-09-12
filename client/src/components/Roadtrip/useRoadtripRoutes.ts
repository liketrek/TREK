import { useRoadtripSettings } from '../../hooks/useRoadtripSettings'
import { assembleRoadtrip, foldRouteRun, type RoadtripStop, type RoadtripRoutes, type PlanDay, type QuietDay, type RoutedLeg } from '@trek/shared/roadtrip'
import { useEffect, useMemo, useRef, useState } from 'react'
import { calculateRouteWithLegs, RoutingRefusedError } from '../Map/RouteCalculator'
import { resolveLegMode } from '../Planner/legMode'
import { splitIntoRuns, parseClock, parseAvoid, type DriveLimits } from './roadtripModel'
import { spillChains } from './nightSpill'
import { useSettingsStore } from '../../store/settingsStore'
import { useVehicleRange } from './useVehicleRange'
import type { Assignment, AssignmentsMap, Accommodation, Day, RouteAvoidClass, SnappedWaypoint } from '../../types'
import type { RoadtripVia, RoadtripDayBoundary } from '@trek/shared'
import { dayWindow } from './dayWindow'
import { useTranslation } from '../../i18n/TranslationContext'

export type { RoadtripStop, RoadtripDay, RoadtripRoutes, QuietDay, AccessSpur, RoutedLeg, SnappedPoint } from '@trek/shared/roadtrip'

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

const EMPTY_ACCOMMODATIONS: Accommodation[] = []

const asStop = (a: Assignment, ownerDayId: number, ownerIndex: number, accommodations: Accommodation[], days: Day[]): RoadtripStop | null => {
  const p = a.place
  if (!p || typeof p.lat !== 'number' || typeof p.lng !== 'number') return null
  const stay = accommodations.find(stay => stay.place_id === a.place_id && stay.start_day_id === ownerDayId)
  const checkoutDay = days.find(day => day.id === stay?.end_day_id)?.day_number
  const checkoutTime = parseClock(stay?.check_out)
  return {
    ...(checkoutDay != null && checkoutTime !== null ? { checkoutAt: checkoutDay * 1440 + checkoutTime } : {}),
    assignmentId: a.id,
    ownerDayId,
    ownerIndex,
    placeId: a.place_id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    time: a.assignment_time ?? p.place_time ?? null,
    checkInTime: stay?.check_in ?? null,
    dwellMinutes: typeof p.duration_minutes === 'number' ? p.duration_minutes : null,
    endDay: a.end_day === true,
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
  boundaries: RoadtripDayBoundary[] = [],
  accommodations: Accommodation[] = EMPTY_ACCOMMODATIONS,
): RoadtripRoutes {
  const { t } = useTranslation()
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

  const legMinutes = useRoadtripSettings(s => s.roadtrip_leg_minutes, tripId)
  const dayMinutes = useRoadtripSettings(s => s.roadtrip_day_minutes, tripId)
  const fillPercent = useRoadtripSettings(s => s.roadtrip_fill_percent, tripId)
  /**
   * Road classes to weight away, as the settings row stores them: a comma list.
   *
   * Parsed against the known classes rather than trusted, because there is no
   * server-side validation for a per-user setting — the write route stores any key with
   * any value — and an unknown word here would become a costing option the router does
   * not have.
   */
  const avoidSetting = useRoadtripSettings(s => s.roadtrip_avoid, tripId)
  /**
   * Whether the gaps between days are driven too.
   *
   * A trip is stored as days and routed as days, so the road from one day's last stop to
   * the next day's first was never asked for: no chain needed it. Turning this on makes
   * the trip one continuous drive — every one of those gaps is routed, drawn, and counted
   * towards the day it ARRIVES on, which is the same rule a night drive already follows.
   */
  const connectSetting = useRoadtripSettings(s => !!s.roadtrip_connect_days, tripId)
  const startTime = useRoadtripSettings(s => s.roadtrip_day_start, tripId)
  const endTime = useRoadtripSettings(s => s.roadtrip_day_end, tripId)
  const endMode = useRoadtripSettings(s => s.roadtrip_day_end_mode, tripId)
  const window = useMemo(() => dayWindow(startTime, endTime, endMode), [startTime, endTime, endMode])
  const connectDays = connectSetting || window !== null
  const avoid = useMemo(() => parseAvoid(avoidSetting), [avoidSetting])
  // What the car is and how far it goes on one fill, assembled in one place because the
  // rail needs the same answer to say what a given fill buys at a given stop.
  const { vehicleKind, rangeKm: planningRangeKm } = useVehicleRange(tripId)
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
          .map(a => asStop(a, d.id, 0, accommodations, days))
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
  }, [days, assignments, accommodations])

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
          .map(a => asStop(a, d.id, 0, accommodations, days))
          .filter((s): s is RoadtripStop => s !== null)
          .map((s, i) => ({ ...s, ownerIndex: i })),
      }))
      .filter(d => d.stops.length < 2)
  }, [days, assignments, accommodations])

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
              Object.assign(dayLegs, foldRouteRun(run, stopAt, r, mode))
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
    const routingChains = window
      ? [...plan, ...quietDays].sort((a, b) => a.dayNumber - b.dayNumber).filter(d => d.stops.length)
      : chains
    for (const chain of routingChains) {
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
      for (let d = 0; d < routingChains.length - 1; d++) {
        const from = routingChains[d].stops[routingChains[d].stops.length - 1]
        const to = routingChains[d + 1].stops[0]
        if (from && to) want(from, to, routingChains[d + 1].dayId)
      }
    }
    return out
  }, [chains, plan, quietDays, window, legsByDay, seamLegs, viasByDay, connectDays])
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

  return useMemo(() => assembleRoadtrip({ plan, quietDays, window, distanceUnit, allLegs, snapByDay, missedByDay, loading, limits, vehicleKind, connectDays, boundaries,
    labels: { start: t('roadtrip.window.resume'), end: t('roadtrip.window.stop') },
  }), [plan, quietDays, window, distanceUnit, t, allLegs, snapByDay, missedByDay, loading, limits, vehicleKind, connectDays, boundaries])
}
