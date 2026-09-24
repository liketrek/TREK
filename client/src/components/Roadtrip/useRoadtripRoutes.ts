import { useRoadtripSettings } from '../../hooks/useRoadtripSettings'
import { assembleRoadtrip, bookendStaysOf, carrierLegsFor, carrierSeam, foldRouteRun, hotelBookendsOn, isCarrierMode, isStationaryJoin, mergeRouteSegments, seatCarrierStops, seatNightBookends, standsAsDay, terminalAssignmentId, viasOnLeg, type CarrierSeam, type RoadtripStop, type RoadtripRoutes, type PlanDay, type QuietDay, type RoutedLeg } from '@trek/shared/roadtrip'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { avoidedClasses, calculateRouteWithLegs, routeEngineFor, RoutingRefusedError, type RouteEngine } from '../Map/RouteCalculator'
import { resolveLegMode } from '../Planner/legMode'
import { splitIntoRuns, parseAvoid, type DriveLimits } from './roadtripModel'
import { spillChains } from './nightSpill'
import { useSettingsStore } from '../../store/settingsStore'
import { useTripStore } from '../../store/tripStore'
import { useVehicleRange } from './useVehicleRange'
import type { Assignment, AssignmentsMap, Accommodation, Day, Reservation, RouteAvoidClass, SnappedWaypoint } from '../../types'
import type { RoadtripVia, RoadtripDayBoundary } from '@trek/shared'
import { dayWindow } from './dayWindow'
import { useTranslation } from '../../i18n/TranslationContext'
import { stayStartingOn } from '../../utils/dayMerge'
import { staysAtTheirPlaces } from './nightBookend'

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
 * Everything a seam's answer depends on besides its two stops, as one comparable string:
 * the mode it is driven in, the classes the trip avoids, and the via points that shape
 * the drive from `from` to `to` (`viasOnLeg`).
 *
 * Read in two places that must agree: when deciding whether a seam still matches the
 * answer already in hand, and when recording what an answer was fetched for. One function
 * so the two cannot drift and quietly stop refetching. The mode and the classes are in it
 * because the vias alone were: switching motorways off, or the day's profile, re-ran the
 * seam round and found every seam already answered, so the drive between two days kept
 * its old road and its old minutes until the page was loaded again.
 */
const seamShape = (from: RoadtripStop, to: RoadtripStop, viasByDay: Record<number, RoadtripVia[]>, mode: string, avoidKey: string, unit: string): string =>
  [
    mode,
    avoidKey,
    // The seam's printed texts are in this unit, so a switch asks for it again, the way a
    // day's own run is asked for again.
    unit,
    viasOnLeg(from, to, viasByDay[from.ownerDayId] ?? [])
      .map(v => `${v.lat.toFixed(5)},${v.lng.toFixed(5)}`)
      .join('|'),
  ].join('#')

/**
 * A drive between two days as it was answered: the leg, the shape it was asked for
 * (`seamShape`), whether OSRM answered in place of the engine asked (`standIn`), and the
 * classes the answer could not avoid.
 */
type SeamLeg = RoutedLeg & { shape: string; standIn?: boolean; missed?: RouteAvoidClass[] }

/** The drive from one stop to the next, identified the same way `planKey` identifies them. */
const legKey = (from: RoadtripStop, to: RoadtripStop): string => `${stopKey(from)}>${stopKey(to)}`

const EMPTY_ACCOMMODATIONS: Accommodation[] = []
const EMPTY_RESERVATIONS: Reservation[] = []
const NO_STAND_INS: ReadonlySet<string> = new Set()

/** One leg as the rail's own router answered it, for a surface checking a choice against it. */
export interface RailLegRoute {
  coordinates: [number, number][]
  distance: number
  duration: number
  /** Whether the road crosses by ferry, where the engine says so. */
  hasFerry?: boolean
  /** True when the leg's own engine could not answer and OSRM drove it unweighted. */
  fellBack?: boolean
}

/**
 * How the rail drives one of its legs, and the same question put again with points pinned
 * in between.
 *
 * The one place that answers "route this leg the way the rail does". The picker of other
 * ways asked OSRM with nothing avoided while the rail drove the leg through Valhalla with
 * the trip's avoidances, so the list offered roads the rail was not on and a choice could
 * not be told apart from a click that did nothing. Whatever offers a leg another way, or
 * checks that a choice holds, asks here.
 */
export interface RailLegRouter {
  /** The leg's mode, resolved the way the routing round resolved it. */
  mode: string
  /** The classes the rail weighs away on this leg: none unless the leg is driven by Valhalla. */
  avoid: RouteAvoidClass[]
  /** Which engine prices this leg on the rail. */
  engine: RouteEngine
  /**
   * True when the line the rail has for this leg came from OSRM standing in for `engine`,
   * which did not answer when the leg was routed. The leg's own road is then not what the
   * map shows, whatever its vias say, and only asking again (`reroute`) puts it there.
   */
  standIn: boolean
  /** The leg from its first stop through `pins` to its last, asked exactly as the rail asks it. */
  route: (pins: { lat: number; lng: number }[], signal: AbortSignal) => Promise<RailLegRoute>
}

/**
 * What the rail reads, plus what only a browser can do with it: route a leg again.
 *
 * Optional like `validateBoundaries`, because the same shape is assembled on the server,
 * where no router of the browser's exists; this hook always fills it in.
 */
export type RoadtripRoutesView = RoadtripRoutes & {
  /**
   * The router for the leg between two stops, `cardDayId` being the card they are drawn
   * on. Two stops stored on one day were asked for in that day's run; two stored on
   * different days are a seam, asked for under the card it arrives on.
   */
  legRouter?: (from: RoadtripStop, to: RoadtripStop, cardDayId: number) => RailLegRouter
  /**
   * Asks the router again for every leg OSRM drew while the engine above it did not
   * answer: the days whose run fell back, and the joins between days that did.
   *
   * Nothing else would. A day run is asked again only when its stops or vias change, and
   * a choice of the leg's own road writes nothing, so the stand-in line stayed on the map
   * under a picker that said the road had been taken.
   */
  reroute?: () => void
}

const asStop = (a: Assignment, ownerDayId: number, ownerIndex: number, accommodations: Accommodation[]): RoadtripStop | null => {
  const p = a.place
  if (!p || typeof p.lat !== 'number' || typeof p.lng !== 'number') return null
  // Check-in only. A check-out is the LATEST the room has to be handed back, not the
  // earliest anybody may leave, so it says nothing about when the drive sets off and
  // has no business in the chain. It stays a booking detail, shown under Days.
  const stay = stayStartingOn(accommodations, a.place_id, ownerDayId)
  return {
    assignmentId: a.id,
    ownerDayId,
    ownerIndex,
    placeId: a.place_id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    time: a.assignment_time ?? p.place_time ?? null,
    // The visit's End is when the drive leaves it. Unlike a check-out it is the
    // traveller's own statement about this stop, and the stay then runs until it.
    leaveAt: a.assignment_end_time ?? p.end_time ?? null,
    checkInTime: stay?.check_in ?? null,
    night: stay !== undefined,
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
  /**
   * The trip's bookings, for the ones the traveller rides (#2428). A flight, train,
   * ferry, cruise or bus with located terminals seams the drive: the road ends at the
   * terminal it leaves from and starts again at the one it lands at, and the leg
   * between the two is the ride, never a road.
   */
  reservations: Reservation[] = EMPTY_RESERVATIONS,
): RoadtripRoutesView {
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
  const [seamLegs, setSeamLegs] = useState<Record<string, SeamLeg>>({})
  /** The legs of the day runs that OSRM drew while the engine asked did not answer. */
  const [standInLegs, setStandInLegs] = useState<ReadonlySet<string>>(NO_STAND_INS)
  /** Bumped to route everything again (`reroute`): every answer already cached comes back at once. */
  const [rerouteRound, setRerouteRound] = useState(0)
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

  // The seams the bookings make. Only the rides matter here, and only their days,
  // clocks, terminals and seats, so a renamed booking or a new note on it changes nothing.
  const rideSeams = useMemo<CarrierSeam[]>(
    () => reservations.map(r => carrierSeam(r)).filter((seam): seam is CarrierSeam => seam !== null),
    [reservations],
  )

  // Every stored day as the road trip reads it: its located stops in stored order, with
  // the terminals of its rides seated among them. Built once and split below, because
  // the two halves are one list read two ways.
  const storedDays = useMemo<PlanDay[]>(() => {
    return [...days]
      .sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0))
      .map(d => {
        const located = (assignments[String(d.id)] ?? [])
          .slice()
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
          .map(a => ({ assignment: a, stop: asStop(a, d.id, 0, accommodations) }))
          .filter((x): x is { assignment: Assignment; stop: RoadtripStop } => x.stop !== null)
        // The index is filled in after the drop, because it is the index into THIS
        // list: an assignment whose place has no coordinates never becomes a stop, and
        // counting before the filter would name a row the rail does not draw.
        const stops = located.map((x, i) => ({ ...x.stop, ownerIndex: i }))
        return {
          dayId: d.id,
          dayNumber: d.day_number ?? 0,
          date: d.date ?? null,
          title: d.title ?? null,
          stops: seatCarrierStops(d.id, stops, located.map((x, i) => x.assignment.order_index ?? i), rideSeams),
        }
      })
  }, [days, assignments, accommodations, rideSeams])

  /**
   * Whether a day after a booked night starts at the stay and a day before one ends there.
   * Off until the trip switches it on, so a trip drives exactly as it did before.
   */
  const bookendsOn = useRoadtripSettings(hotelBookendsOn, tripId)
  // Where each hotel stands now. The stay rows keep the position their place had when they
  // were fetched, while the visits follow the place at once, and the server joins it afresh.
  const tripPlaces = useTripStore(s => s.places)
  // The nights as the rule reads them, with the booking behind each and the hotel where its
  // place is. Read only while the switch is on, so a new booking or a moved pin on a trip
  // without it touches nothing downstream.
  const stays = useMemo(
    () => (bookendsOn ? bookendStaysOf(staysAtTheirPlaces(accommodations, tripPlaces), reservations) : []),
    [bookendsOn, accommodations, tripPlaces, reservations],
  )
  // The stored days with the night before and the night after seated at their edges, by
  // the rule the server's calculate_roadtrip runs too. Before a day is asked whether it
  // stands as one: a day with a bookend always has two stops. A linked booking changes a
  // bookend's reservation and nothing `planKey` reads, so it asks the router nothing. The
  // bookings go in whole: a ride saved without its stations still moves its day.
  const seatedDays = useMemo<PlanDay[]>(
    () => (bookendsOn ? seatNightBookends(storedDays, days, stays, reservations) : storedDays),
    [bookendsOn, storedDays, days, stays, reservations],
  )

  const plan = useMemo<PlanDay[]>(() => seatedDays.filter(d => standsAsDay(d.stops)), [seatedDays])

  const quietDays = useMemo<QuietDay[]>(() => seatedDays.filter(d => !standsAsDay(d.stops)), [seatedDays])

  /** Days apart, for a ride that lands on a later day than it left. */
  const dayNumberOf = (dayId: number): number => days.find(d => d.id === dayId)?.day_number ?? 0

  /**
   * The leg between the two terminals of every ride, keyed like a routed leg.
   *
   * Derived from the bookings rather than fetched, and kept out of the routing round on
   * purpose: that round only runs when the geometry changes, and a ride's minutes come
   * from its clocks. Filed inside the round, an edited departure time left the old
   * minutes in place until something else re-routed, so the chain reached the arrival
   * terminal late for a flight that had been moved earlier.
   */
  const rideLegs = useMemo(() => {
    const terminals = new Map<number, { stop: RoadtripStop; dayNumber: number }>()
    for (const day of storedDays)
      for (const stop of day.stops)
        if (stop.carrier) terminals.set(stop.assignmentId, { stop, dayNumber: day.dayNumber })
    const out: Record<string, RoutedLeg> = {}
    for (const seam of rideSeams) {
      if (seam.kind !== 'ride') continue
      const dep = terminals.get(terminalAssignmentId(seam.reservationId, 'departure'))
      const arr = terminals.get(terminalAssignmentId(seam.reservationId, 'arrival'))
      if (!dep || !arr) continue
      Object.assign(out, carrierLegsFor([dep.stop, arr.stop], seam.type, () => arr.dayNumber - dep.dayNumber, legKey))
    }
    return out
  }, [storedDays, rideSeams])

  /**
   * A leg's mode, resolved the one way every request here resolves it: the stop's own,
   * else the default of `dayId`, else the trip's. The day runs pass their own day, a seam
   * the card it arrives on, and a leg asked for on demand whichever of the two it is.
   */
  const legModeOf = useCallback((from: RoadtripStop, to: RoadtripStop, dayId: number): string => resolveLegMode(
    { isPlace: true, leg_transport_mode: from.legMode },
    { isPlace: true, incoming_leg_transport_mode: to.incomingLegMode },
    days.find(d => d.id === dayId)?.default_transport_mode || routeProfile,
  ), [days, routeProfile])

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
      setStandInLegs(NO_STAND_INS)
      setLoading(false)
      return
    }
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)

    const collected: Record<number, Record<string, RoutedLeg>> = {}
    const collectedSnaps: Record<number, Record<string, SnappedWaypoint>> = {}
    const collectedMisses: Record<number, RouteAvoidClass[]> = {}
    const collectedStandIns = new Set<string>()
    const tasks: (() => Promise<void>)[] = []

    /**
     * Ask for one run, and when the router refuses the whole of it, ask for its legs
     * one at a time instead.
     *
     * A run travels as a single request because the answer carries a leg per waypoint
     * pair, which is exactly what the rail wants, and one request is one slot of a
     * host that allows about one a second. What that thrift costs is that a refusal is
     * never local: OSRM answers `400 NoRoute` for the entire chain when one stop in the
     * MIDDLE of it sits where it may not turn around, so a day lost every leg it had
     * over a single cave car park while each of its pairs routed perfectly alone.
     * `uTurnParam` in RouteCalculator removes the usual cause; this removes the SHAPE of
     * the failure, so a stop that really cannot be reached costs its own two legs and
     * not the day around them.
     *
     * The split is enqueued, not awaited, so the pairs queue up behind everything else
     * and keep the same spacing as any other request: a day falling back must not turn
     * into a burst at the one host that refused it.
     */
    const enqueueRun = (day: PlanDay, dayLegs: Record<string, RoutedLeg>, run: RoadtripStop[], mode: string): void => {
      // A ride is no road, so no router is asked. The two ends of a booked ride have
      // their leg in `rideLegs`, which keeps step with an edited timetable; a terminal
      // standing beside an ordinary stop is the other carrier-mode pair, and it still
      // needs a leg of its own. Without one `computeSchedule` loses its cursor there and
      // every arrival behind it goes blank. A run is one stored day, so its ends are
      // never days apart.
      if (isCarrierMode(mode)) {
        const legs = carrierLegsFor(run, mode, () => 0, legKey) ?? {}
        for (const [key, leg] of Object.entries(legs)) if (!rideLegs[key]) dayLegs[key] = leg
        return
      }
      /** The same stops, as one request per pair. A pair has nothing left to split. */
      const splitIntoPairs = (): void => {
        if (run.length <= 2) return
        for (let i = 0; i < run.length - 1; i++) enqueueRun(day, dayLegs, [run[i], run[i + 1]], mode)
      }
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
          // shaping the road. None bend the drive from or to a booked night's hotel.
          viasOnLeg(stop, run[i + 1], viasByDay[stop.ownerDayId ?? day.dayId] ?? [])
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
            // What was asked for against what the road turned out to be. Only a
            // request that was asked to avoid something reports it: the second
            // engine says what it managed, and an OSRM fallback after it failed
            // says it managed nothing, which is the honest reading of "the
            // weighting never happened". Collected here because the rail plans
            // in the browser and never sees the server's own copy of this field.
            // Without it the "not honoured" badge could not appear at all, and a
            // motorway-free drive that is not one read as if the setting had held.
            if (r.avoidance) {
              const missed = r.avoidance.asked.filter(cls => !r.avoidance!.achieved.includes(cls))
              if (missed.length) {
                collectedMisses[day.dayId] = [...new Set([...(collectedMisses[day.dayId] ?? []), ...missed])]
              }
            }
            const folded = foldRouteRun(run, stopAt, r, mode, distanceUnit)
            // Remembered per leg, so a picker opened on one of them knows the line on the
            // map is not its engine's and does not read it as the road already taken.
            if (r.avoidance?.fellBack) for (const key of Object.keys(folded)) collectedStandIns.add(key)
            Object.assign(dayLegs, folded)
            return
          } catch (err) {
            if (controller.signal.aborted) return
            const refusal = err instanceof RoutingRefusedError ? err : null
            // Almost always a rate limit on the shared routing host, or a connection
            // that dropped: back off and try again. A refusal the host MEANT is the
            // one thing not worth repeating: it objects to these coordinates, and
            // asking twice more only spends five seconds earning the same 400.
            const delay = refusal && !refusal.isRateLimit ? undefined : RETRY_DELAYS_MS[attempt]
            if (delay !== undefined) {
              // When the host says how long to wait, waiting less is just a second refusal.
              await sleep(Math.max(delay, (refusal?.isRateLimit ? refusal.retryAfterMs : null) ?? 0), controller.signal)
              continue
            }
            // Nothing left to try. A run of three or more stops asks again one pair at
            // a time, so a stop the router will not route THROUGH costs its own two
            // legs instead of every leg of the day around it. Never after a rate limit:
            // the answer to a host asking for less traffic is not four more requests.
            if (!refusal?.isRateLimit) splitIntoPairs()
            return
          }
        }
      })
    }

    for (const day of plan) {
      const dayLegs: Record<string, RoutedLeg> = {}
      collected[day.dayId] = dayLegs

      const runs = splitIntoRuns(day.stops, (from, to) => legModeOf(from, to, day.dayId))

      for (const { stops: run, mode } of runs) enqueueRun(day, dayLegs, run, mode)
    }

    // One at a time, spaced out. The day sidebar can afford a small pool because it
    // routes a single day; a road trip is every leg of every day at once, and the
    // public routing hosts answer that with 429 after the first handful. Results are
    // published as they land so the rail fills in instead of sitting empty.
    const publish = (): void => {
      setLegsByDay({ ...collected })
      setSnapByDay({ ...collectedSnaps })
      setMissedByDay({ ...collectedMisses })
      setStandInLegs(new Set(collectedStandIns))
    }
    void (async () => {
      for (let i = 0; i < tasks.length; i++) {
        if (controller.signal.aborted) return
        const startedAt = performance.now()
        await tasks[i]()
        if (controller.signal.aborted) return
        publish()
        // Only pace what actually went out. RouteCalculator answers a repeat from its
        // cache in well under a millisecond, and switching back into road trip mode is
        // all repeats — waiting a second between those made a warm view feel broken.
        const wasNetwork = performance.now() - startedAt > CACHE_HIT_MS
        if (wasNetwork && i < tasks.length - 1) await sleep(REQUEST_SPACING_MS, controller.signal)
      }
      if (controller.signal.aborted) return
      // A plan that is nothing but rides asked for no road, and still replaces what
      // the last round left behind.
      if (!tasks.length) publish()
      setLoading(false)
    })()

    return () => controller.abort()
    // planKey stands in for `plan`: same geometry, same legs. avoidKey, not `avoid`:
    // a fresh array every render would re-route on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKey, routeProfile, distanceUnit, tripId, avoidKey, rerouteRound])

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
    // Seams first, this day's own runs over the top. `legsByDay` is replaced whole on
    // every routing round while `seamLegs` only ever grows, so a pair that used to sit on
    // a day boundary and now sits inside one day keeps an answer nobody re-asks for, and
    // that older answer was shaped by the vias of a stop that has since moved. Where both
    // exist the day run is the newer of the two, so it is the one to believe. The rides
    // last: a ride is never a road, whatever was fetched for its pair.
    return { ...seamLegs, ...out, ...rideLegs }
  }, [plan, legsByDay, seamLegs, rideLegs])

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
  const { seams, seamMisses } = useMemo(() => {
    const out: { from: RoadtripStop; to: RoadtripStop; dayId: number; mode: string; shape: string }[] = []
    const misses: Record<number, RouteAvoidClass[]> = {}
    const want = (from: RoadtripStop, to: RoadtripStop, dayId: number): void => {
      // The two ends of one ride: the leg between them is the booking's, never a road.
      if (rideLegs[legKey(from, to)]) return
      // A night spent at one hotel: nothing is driven, so nothing is asked.
      if (isStationaryJoin(from, to)) return
      // Routed as part of a day's own run — that request is rebuilt whenever its vias
      // change, so there is nothing to catch up here.
      if (legsByDay[from.ownerDayId]?.[legKey(from, to)]) return
      // A seam already fetched is skipped only while it was fetched for the SHAPE it has
      // now. Skipping it whenever any answer existed is what made a via on a seam do
      // nothing at all: the first answer was cached under the pair, and dragging the
      // point changed the request nobody was going to send again.
      const mode = legModeOf(from, to, dayId)
      const shape = seamShape(from, to, viasByDay, mode, avoidKey, distanceUnit)
      const have = seamLegs[legKey(from, to)]
      const current = have?.shape === shape
      // What the drawn join could not avoid is flagged on the card it arrives on, the way
      // a day's own run is. A join OSRM drove in the engine's place said nothing at all.
      if (current && have.missed?.length) misses[dayId] = [...new Set([...(misses[dayId] ?? []), ...have.missed])]
      // An answer OSRM gave in the engine's place is drawn but not settled: it is asked
      // for again on the next seam round, instead of standing in for the weighed road
      // until the page is loaded again.
      if (current && !have.standIn) return
      out.push({ from, to, dayId, mode, shape })
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
    return { seams: out, seamMisses: misses }
  }, [chains, plan, quietDays, window, legsByDay, seamLegs, rideLegs, viasByDay, connectDays, legModeOf, avoidKey, distanceUnit])
  /** Each card's unavoided classes, its own run's and those of the join it is reached by. */
  const missedOnCards = useMemo(() => {
    const out: Record<number, RouteAvoidClass[]> = { ...missedByDay }
    for (const [dayId, classes] of Object.entries(seamMisses)) {
      out[Number(dayId)] = [...new Set([...(out[Number(dayId)] ?? []), ...classes])]
    }
    return out
  }, [missedByDay, seamMisses])
  const seamKey = seams.map(s => `${legKey(s.from, s.to)}#${s.shape}`).join(';')
  /**
   * When the last request outside the routing round went out, across every run of the
   * effect below: a seam, or a leg asked for again on demand (see `legRouter`). One clock
   * for both, so a choice being checked cannot fire into the gap a seam is keeping.
   */
  const lastSpacedRequestAt = useRef(0)
  /** Waits until the gap since the last such request is kept, then claims the next slot. */
  const spacedRequest = useCallback(async (signal: AbortSignal): Promise<void> => {
    const since = performance.now() - lastSpacedRequestAt.current
    if (since < REQUEST_SPACING_MS) await sleep(REQUEST_SPACING_MS - since, signal)
    if (!signal.aborted) lastSpacedRequestAt.current = performance.now()
  }, [])

  useEffect(() => {
    if (!seams.length) return
    const controller = new AbortController()
    void (async () => {
      for (const seam of seams) {
        if (controller.signal.aborted) return
        const { mode, shape } = seam
        // No router knows a ride. A booked ride's own pair has its leg in `rideLegs` and
        // never reaches here; what is left is a terminal seamed to an ordinary stop on
        // another card, which is a join of no minutes rather than a road. Filed here,
        // above the pacing block, so it spends no request slot.
        if (isCarrierMode(mode)) {
          const key = legKey(seam.from, seam.to)
          const legs = carrierLegsFor([seam.from, seam.to], mode, (from, to) => dayNumberOf(to.ownerDayId) - dayNumberOf(from.ownerDayId), legKey)
          const leg = legs?.[key]
          if (leg) setSeamLegs(prev => ({ ...prev, [key]: { ...leg, shape } }))
          continue
        }
        // Paced before the request, against a clock that outlives this effect.
        //
        // Waiting AFTER one instead spaced nothing: storing a seam changes
        // seamLegs, which is a dependency of the seams memo, which shortens
        // seamKey, which is this effect's first dependency — so React tore the
        // effect down mid-wait, the cleanup aborted the sleep, and the next run
        // fired straight away. Thirteen seams went out at round-trip speed, the
        // shared routing hosts answered the tail with 429, and a refused seam
        // writes no state, so nothing changed to make the effect try again: the
        // map drew the trip in pieces and the totals came back short.
        await spacedRequest(controller.signal)
        if (controller.signal.aborted) return
        try {
          // The via points on this seam, threaded in the same way the day runs thread
          // theirs. Without them a seam is the one stretch of the trip a via cannot
          // shape: it is asked for on its own, so the points the traveller dropped on it
          // never reached the router and dragging one did visibly nothing.
          const shaping = viasOnLeg(seam.from, seam.to, viasByDay[seam.from.ownerDayId] ?? [])
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
          // wants the whole drive: merged here, exactly as a day run folds its via legs
          // back onto the stop pair they belong to.
          if (!r.legs.length) continue
          const merged = mergeRouteSegments(r.legs, distanceUnit)
          setSeamLegs(prev => ({
            ...prev,
            [legKey(seam.from, seam.to)]: {
              seg: { ...merged, mode },
              line: r.coordinates,
              vias: [],
              shape,
              standIn: r.avoidance?.fellBack === true,
              missed: r.avoidance ? r.avoidance.asked.filter(cls => !r.avoidance!.achieved.includes(cls)) : [],
            },
          }))
        } catch {
          // A seam that will not route stays missing, exactly like any other leg that
          // will not route: the chain shows a gap and the totals are partial rather than
          // invented. Retried on the next run of this effect.
          if (controller.signal.aborted) return
        }
      }
    })()
    return () => controller.abort()
    // seamKey stands in for `seams`: same pairs, same requests. avoidKey, not `avoid`:
    // a fresh array every render would re-ask for every seam on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seamKey, routeProfile, tripId, avoidKey, rerouteRound])

  const legRouter = useCallback((from: RoadtripStop, to: RoadtripStop, cardDayId: number): RailLegRouter => {
    // The day the routing round asked this pair under: its own stored day for a pair
    // inside one, the card it is drawn on for a seam. It decides the default mode and
    // is what a route provider plugin is told.
    const dayId = from.ownerDayId === to.ownerDayId ? from.ownerDayId : cardDayId
    const mode = legModeOf(from, to, dayId)
    // Whose line the rail shows, read the way `allLegs` picks it: a day run's over a seam's.
    const key = legKey(from, to)
    const byRun = plan.some(day => legsByDay[day.dayId]?.[key] !== undefined)
    return {
      mode,
      avoid: avoidedClasses(mode, avoid),
      engine: routeEngineFor(mode, avoid),
      standIn: byRun ? standInLegs.has(key) : seamLegs[key]?.standIn === true,
      route: async (pins, signal) => {
        await spacedRequest(signal)
        const r = await calculateRouteWithLegs(
          [{ lat: from.lat, lng: from.lng }, ...pins.map(p => ({ lat: p.lat, lng: p.lng })), { lat: to.lat, lng: to.lng }],
          { signal, profile: mode, tripId: tripId ?? null, dayId, avoid },
        )
        return {
          coordinates: r.coordinates,
          distance: r.distance,
          duration: r.duration,
          hasFerry: r.hasFerry,
          fellBack: r.avoidance?.fellBack === true,
        }
      },
    }
  }, [legModeOf, avoid, spacedRequest, tripId, plan, legsByDay, standInLegs, seamLegs])

  const reroute = useCallback(() => setRerouteRound(round => round + 1), [])

  const assembled = useMemo(() => assembleRoadtrip({ plan, quietDays, window, distanceUnit, allLegs, snapByDay, missedByDay: missedOnCards, loading, limits, vehicleKind, connectDays, boundaries,
    labels: { start: t('roadtrip.window.resume'), end: t('roadtrip.window.stop') },
  }), [plan, quietDays, window, distanceUnit, t, allLegs, snapByDay, missedOnCards, loading, limits, vehicleKind, connectDays, boundaries])
  return useMemo(() => ({ ...assembled, legRouter, reroute }), [assembled, legRouter, reroute])
}
