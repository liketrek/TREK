import { withHotelBookends } from './RouteCalculator'
import { getTransportRouteEndpoints, getTransportForDay, getMergedItems, isCarrierTransport, hasCarrierEndpointOnDay } from '../../utils/dayMerge'
import { getDayBookendHotels, shouldDrawMorningLeg, shouldDrawEveningLeg, type CarrierEdge } from '../../utils/dayOrder'
import { withinDriveRange } from '../../utils/geo'
import type { Accommodation, AssignmentsMap, Day, Reservation } from '../../types'

export const TRANSPORT_TYPES = ['flight', 'train', 'bus', 'car', 'taxi', 'bicycle', 'cruise', 'ferry', 'transit', 'transport_other']

/** A waypoint on a day's drive, carrying the per-leg modes `resolveLegMode` reads off it. */
export interface DayRoutePoint {
  lat: number
  lng: number
  isPlace: boolean
  leg_transport_mode?: string | null
  incoming_leg_transport_mode?: string | null
}

/** Everything the plan depends on, passed in rather than read from the store, so the
 *  builder stays pure and one caller can run it over every day of a trip at once. */
export interface DayRouteInputs {
  days: Day[]
  assignments: AssignmentsMap
  reservations: Reservation[]
  accommodations: Accommodation[]
  optimizeFromAccommodation: boolean | undefined
}

/**
 * The runs of waypoints a day's route is drawn from, hotel bookends folded in.
 *
 * Lifted out of `useRouteCalculation` unchanged so the trip-wide overview draws the
 * same line the day view does. Every rule below is load-bearing and issue-numbered —
 * a second copy of it would drift the moment either surface got the next fix.
 */
export function buildDayRouteRuns(dayId: number, input: DayRouteInputs): DayRoutePoint[][] {
  const { days: allDays, assignments, reservations: allReservations, accommodations, optimizeFromAccommodation } = input
  const da = (assignments[String(dayId)] || []).slice().sort((a, b) => a.order_index - b.order_index)
  const dayOrder = (id: number | null | undefined): number | null => {
    if (id == null) return null
    const d = allDays.find(x => x.id === id)
    return d ? (d.day_number ?? allDays.indexOf(d)) : null
  }
  const thisOrder = dayOrder(dayId)

  // The order the day plan shows is the order the map has to draw, so take it from
  // the same place the plan does rather than rebuilding it here. getTransportForDay
  // brings the span filter, the hotel/assignment exclusions and the leg expansion with
  // it; getMergedItems places each leg by its own saved position, falling back to its
  // time. Notes carry no coordinates, so none are passed.
  const dayTransports = thisOrder == null ? [] : getTransportForDay({
    reservations: allReservations.filter(r => TRANSPORT_TYPES.includes(r.type)),
    dayId,
    dayAssignmentIds: da.map(a => a.id),
    days: allDays,
  })
  const merged = getMergedItems({ dayAssignments: da, dayNotes: [], dayTransports, dayId })

  type Entry =
    | { kind: 'place'; lat: number; lng: number; pos: number; time: string | null; mode: string | null; incoming: string | null }
    | { kind: 'transport'; from: { lat: number; lng: number } | null; to: { lat: number; lng: number } | null; pos: number; carrier: boolean }
  const entries: Entry[] = merged.flatMap((item): Entry[] => {
    if (item.type === 'place') {
      const a = item.data
      if (!a.place?.lat || !a.place?.lng) return []
      return [{
        kind: 'place', lat: a.place.lat, lng: a.place.lng, pos: item.sortKey, time: a.place?.place_time ?? null,
        // Per-segment travel mode (#1281): mode of the leg leaving this place.
        mode: (a as { leg_transport_mode?: string | null }).leg_transport_mode ?? null,
        // Boundary-leg mode (#1281 follow-up): mode of the leg arriving at this place.
        incoming: (a as { incoming_leg_transport_mode?: string | null }).incoming_leg_transport_mode ?? null,
      }]
    }
    if (item.type !== 'transport') return []
    const { from, to } = getTransportRouteEndpoints(item.data, dayId)
    return [{ kind: 'transport', from, to, pos: item.sortKey, carrier: isCarrierTransport(item.data) }]
  })

  // Group located places into driving runs. A transport WITH a location anchors the
  // route to its departure point then breaks the run (you don't drive the flight); its
  // arrival starts the next. A transport WITHOUT a location is ignored entirely. A run
  // is only a real drive when it contains at least one actual place, or two back-to-back
  // transports pair into a phantom [airport → airport] road route (#1394). A booking
  // endpoint also has to be REACHABLE from the stop before it, or a long-haul arrival
  // sorted in among the day's local stops gets stapled to one of them (#2133).
  const runs: DayRoutePoint[][] = []
  let currentRun: DayRoutePoint[] = []
  let runHasPlace = false
  const closeRun = () => {
    if (currentRun.length >= 2 && runHasPlace) runs.push(currentRun)
    currentRun = []
    runHasPlace = false
  }
  for (const entry of entries) {
    if (entry.kind === 'place') {
      const prev = currentRun[currentRun.length - 1]
      // The open run may be nothing but a far-away arrival endpoint — break rather
      // than draw the ocean.
      if (prev && !prev.isPlace && !withinDriveRange(prev, entry)) closeRun()
      currentRun.push({ lat: entry.lat, lng: entry.lng, isPlace: true, leg_transport_mode: entry.mode, incoming_leg_transport_mode: entry.incoming })
      runHasPlace = true
    } else if (entry.from || entry.to) {
      const prev = currentRun[currentRun.length - 1]
      if (entry.from && (!prev || withinDriveRange(prev, entry.from))) currentRun.push({ ...entry.from, isPlace: false })
      closeRun()
      if (entry.to) currentRun.push({ ...entry.to, isPlace: false })
    }
  }
  closeRun()

  // Bookend the route with the day's accommodation, so the drawn line matches the
  // sidebar's hotel legs.
  const day = allDays.find(d => d.id === dayId)
  const bookends = day && optimizeFromAccommodation !== false
    ? getDayBookendHotels(day, allDays, accommodations)
    : null
  const flatPts: DayRoutePoint[] = []
  for (const e of entries) {
    if (e.kind === 'place') flatPts.push({ lat: e.lat, lng: e.lng, isPlace: true, leg_transport_mode: e.mode, incoming_leg_transport_mode: e.incoming })
    else { if (e.from) flatPts.push({ ...e.from, isPlace: false }); if (e.to) flatPts.push({ ...e.to, isPlace: false }) }
  }
  // A hotel bookend point is not a place-assignment, so isPlace: false — resolveLegMode
  // falls through to the day default for hotel-adjacent legs unless the place endpoint
  // carries its own override.
  const hotelPt = (a?: Accommodation): DayRoutePoint | null =>
    a && a.place_lat != null && a.place_lng != null ? { lat: a.place_lat, lng: a.place_lng, isPlace: false } : null
  // Only draw a hotel bookend when the leg is a real drive: a place before check-in
  // (#1465), a later "home" stop on the checkout day (#1465), or a transport endpoint on
  // an arrival/departure day (#1321, #2133) all draw no bookend.
  const contributes = (e: Entry) => e.kind === 'place' || !!e.from || !!e.to
  const firstStop = entries.find(contributes)
  const lastStop = [...entries].reverse().find(contributes)
  const edgeInfo = (e: Entry | undefined, side: 'first' | 'last') => {
    if (!e) return undefined
    if (e.kind === 'place') return { isPlace: true, time: e.time, lat: e.lat, lng: e.lng }
    const role: CarrierEdge = side === 'first'
      ? (e.from ? 'departure' : 'arrival')
      : (e.to ? 'arrival' : 'departure')
    return { isPlace: false, time: null, carrierEdge: e.carrier ? role : null }
  }
  // A carrier with a located endpoint today means the day changes geography by
  // air/rail/sea — the check-in hotel is then the day's destination and the
  // check-out hotel its origin, which the no-time bookend default respects (#2157).
  const dayHasCarrier = dayTransports.some(r => hasCarrierEndpointOnDay(r, dayId))
  const firstWay = flatPts[0]
  const lastWay = flatPts[flatPts.length - 1]
  const morningHotel = hotelPt(bookends?.morning)
  const eveningHotel = hotelPt(bookends?.evening)
  const drawMorning = !!bookends && !!day && shouldDrawMorningLeg(bookends, day, edgeInfo(firstStop, 'first'), dayHasCarrier)
    && (!morningHotel || !firstWay || firstWay.isPlace || withinDriveRange(morningHotel, firstWay))
  const drawEvening = !!bookends && !!day && shouldDrawEveningLeg(bookends, day, edgeInfo(lastStop, 'last'), dayHasCarrier)
    && (!eveningHotel || !lastWay || lastWay.isPlace || withinDriveRange(eveningHotel, lastWay))
  const runsWithHotel: DayRoutePoint[][] = withHotelBookends(
    runs,
    firstWay,
    lastWay,
    drawMorning ? morningHotel : null,
    drawEvening ? eveningHotel : null,
  )

  // Transfer day with no activities: you check out of one accommodation and into
  // another, so there are no waypoints for withHotelBookends to attach a leg to.
  if (runsWithHotel.length === 0 && drawMorning && drawEvening) {
    const m = hotelPt(bookends?.morning)
    const e = hotelPt(bookends?.evening)
    if (m && e && (m.lat !== e.lat || m.lng !== e.lng)) runsWithHotel.push([m, e])
  }

  return runsWithHotel
}
