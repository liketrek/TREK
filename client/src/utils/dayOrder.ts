import type { Day, Accommodation, RouteAnchors } from '../types'
import { parseTimeToMinutes } from './dayMerge'
import { haversineKm, withinDayTripRange } from './geo'

/**
 * Set on an edge waypoint that is the endpoint of a booking which CARRIES you out of
 * the day's geography (see `isCarrierTransport`): 'departure' = you left from this
 * point, 'arrival' = you were set down at it. A hire car — a vehicle you keep driving —
 * leaves this unset, so its pickup/drop-off points keep the hotel legs they have always
 * drawn. Undefined always means "no opinion", which is what keeps every existing caller
 * and the activity-free transfer day behaving exactly as before.
 */
export type CarrierEdge = 'departure' | 'arrival' | null

export const getDayOrder = (day: Day, days: Day[]): number =>
  day.day_number ?? days.indexOf(day)

type EdgeStop = { isPlace: boolean; time?: string | null; carrierEdge?: CarrierEdge; lat?: number; lng?: number }

/**
 * The #2009 default on a stay that records no check-in/check-out time: the loop closes,
 * because a day out of a hotel comes back to it. It is a guess about a day nobody timed,
 * and two things disprove it (#2157). A carrier on the day means you changed geography by
 * air/rail/sea, so the hotel is one end of the day and not both. And an edge stop past
 * day-trip range is where you travelled from or to, not somewhere the hotel sent you out
 * to: the reported 500 km drive home is as much a disproof as the 2400 km flight, which
 * is why the radius is a day's driving and not the router's reachability limit.
 */
const noTimeLoopHolds = (hotel: Accommodation, stop?: EdgeStop, dayHasCarrier?: boolean): boolean => {
  if (dayHasCarrier) return false
  if (stop?.lat == null || stop.lng == null || hotel.place_lat == null || hotel.place_lng == null) return true
  return withinDayTripRange({ lat: hotel.place_lat, lng: hotel.place_lng }, { lat: stop.lat, lng: stop.lng })
}

// The two hotels that bookend a day: the one you woke up in (morning) and the one you sleep in
// tonight (evening). On a transfer day these differ; on any other day both are the single hotel.
// The morning hotel is keyed off "checked in on an earlier day and still in range" (i.e. you slept
// there) rather than "checks out today", so it stays correct when an overlapping or long stay does
// not end exactly on the transfer day.
export const getDayBookendHotels = (
  day: Day,
  days: Day[],
  accommodations: Accommodation[],
): { morning?: Accommodation; evening?: Accommodation; morningIsSleptHere?: boolean; eveningIsOvernight?: boolean } => {
  const inRange = accommodations.filter(a =>
    a.place_lat != null && a.place_lng != null &&
    isDayInAccommodationRange(day, a.start_day_id, a.end_day_id, days),
  )
  if (inRange.length === 0) return {}

  const dayOrd = getDayOrder(day, days)
  const orderOf = (id: number) => {
    const d = days.find(x => x.id === id)
    return d ? getDayOrder(d, days) : dayOrd
  }
  const checkIn = inRange.find(a => a.start_day_id === day.id) // the hotel you arrive at tonight
  const sleptHere = inRange.find(a => orderOf(a.start_day_id) < dayOrd) // the hotel you woke up in

  return {
    morning: sleptHere ?? checkIn ?? inRange[0],
    evening: checkIn ?? sleptHere ?? inRange[0],
    // Provenance for the drawing consumers (map + sidebar). A hotel↔transport bookend
    // is only real when you actually used the hotel: morningIsSleptHere is true only
    // when you woke up there (not a check-in fallback on an arrival day), and
    // eveningIsOvernight is true only when you sleep there tonight (you check in today,
    // or an earlier stay continues past today). The optimizer keeps using the values.
    morningIsSleptHere: sleptHere != null,
    eveningIsOvernight: checkIn != null || (sleptHere != null && orderOf(sleptHere.end_day_id) > dayOrd),
  }
}

// Derives route anchors from the accommodation(s) active on a day. A single hotel is the day's home
// base, so the route is a loop that starts and ends there. A transfer day — checking out of one hotel
// and into another — instead runs from the morning hotel to the evening one.
//
// `stops` are the located stops the optimizer is about to reorder, and they decide the same way the
// drawn bookend legs do: an anchor the map would not draw a leg to is not an anchor the optimizer
// gets to pin the day on either, or it sorts a "Home" 500 km out into the middle of the day (#2157).
// Since the order is what the optimizer is still deciding, no stop is the day's edge yet, so the one
// farthest from the hotel stands in: a day reaching past what the hotel could send you out to and
// back from is not a day that hotel bookends. Passing no stops means no evidence, and the anchors
// stay where they have always been.
export const getAccommodationAnchors = (
  day: Day,
  days: Day[],
  accommodations: Accommodation[],
  stops?: { lat: number; lng: number }[],
  dayHasCarrier?: boolean,
): RouteAnchors => {
  const bookends = getDayBookendHotels(day, days, accommodations)
  const { morning, evening } = bookends
  if (!morning || !evening) return {}
  const at = (h: Accommodation) => ({ lat: h.place_lat as number, lng: h.place_lng as number })
  // The optimizer only ever moves untimed stops, so the stand-in carries no time.
  const farthestFrom = (h: Accommodation): EdgeStop | undefined => {
    if (!stops?.length) return undefined
    const from = at(h)
    const far = stops.reduce((a, b) => (haversineKm(from, b) > haversineKm(from, a) ? b : a), stops[0])
    return { isPlace: true, time: null, lat: far.lat, lng: far.lng }
  }
  const hasStops = !!stops?.length
  return {
    start: !hasStops || shouldDrawMorningLeg(bookends, day, farthestFrom(morning), dayHasCarrier) ? at(morning) : undefined,
    end: !hasStops || shouldDrawEveningLeg(bookends, day, farthestFrom(evening), dayHasCarrier) ? at(evening) : undefined,
  }
}

// Whether to draw the morning hotel → first-stop leg. It is a real drive when you slept in the
// morning hotel (a normal home-base day). On that hotel's check-in day you were traveling TO the
// hotel, so the leg is drawn only when the first stop is a PLACE provably timed at/after check-in
// (you dropped your bags first). A place before check-in (an airport you reach first, #1465), a
// transport arrival (you flew in, weren't at the hotel yet, #1321), or an un-timed place ("Home"
// before driving out, #1597) all mean no leg — mirroring the evening rule below. With no
// check-in time recorded the loop closes by default (#2009), except on a day a carrier
// takes you there or towards an edge place too far out to be a day trip (#2157).
export const shouldDrawMorningLeg = (
  bookends: { morning?: Accommodation; morningIsSleptHere?: boolean },
  day: Day,
  firstStop?: EdgeStop,
  dayHasCarrier?: boolean,
): boolean => {
  // You landed here. Whatever hotel the day belongs to, nobody drove out of it to the
  // airport they arrived at — so there is no morning leg, not even on a night you
  // provably slept in that hotel (#2133).
  if (firstStop?.carrierEdge === 'arrival') return false
  if (bookends.morningIsSleptHere) return true
  const m = bookends.morning
  if (!m || m.start_day_id !== day.id || !firstStop?.isPlace) return false
  const checkIn = parseTimeToMinutes(m.check_in)
  // No check-in time on the stay means there is no bar to clear, and "no
  // information" was being read as "proof against", which silently opened the
  // loop at the start of every arrival day, since the hotel picker leaves the
  // time blank by default (#2009). That loop is still only a guess, so an arrival
  // in the wide sense (a carrier, or a first stop too far out to be a day trip)
  // puts the hotel at the day's END instead (#2157). With a time set, #1465 still
  // holds: an earlier stop is a place you reached before the hotel and draws no leg.
  if (checkIn == null) return noTimeLoopHolds(m, firstStop, dayHasCarrier)
  const stop = parseTimeToMinutes(firstStop.time)
  return stop != null && stop >= checkIn
}

// Mirror of shouldDrawMorningLeg for the last-stop → hotel evening leg. It is a real drive when
// you sleep in the evening hotel tonight. On that hotel's check-out day you have already left, so
// the return leg is NOT the default — drawn only when the last stop is a PLACE timed at/before
// check-out (a swing back before checking out). A later stop (heading home, #1465), an un-timed
// stop, or an evening transport departure (S7) all mean no return leg.
export const shouldDrawEveningLeg = (
  bookends: { evening?: Accommodation; eveningIsOvernight?: boolean },
  day: Day,
  lastStop?: EdgeStop,
  dayHasCarrier?: boolean,
): boolean => {
  // Mirror: you took off from here, so no drive leads from it back to tonight's hotel —
  // the reported "flight starting airport connected to the accommodation" (#2133).
  if (lastStop?.carrierEdge === 'departure') return false
  if (bookends.eveningIsOvernight) return true
  const e = bookends.evening
  if (!e || e.end_day_id !== day.id || !lastStop?.isPlace) return false
  const checkOut = parseTimeToMinutes(e.check_out)
  // Mirror of the morning rule: with no check-out time recorded there is nothing
  // to have missed, so the return leg is drawn and the loop closes (#2009), unless
  // the day disproves it (#2157). A carrier, or a last stop too far out to be a day
  // trip, is a departure, and the hotel is then where the day STARTS.
  if (checkOut == null) return noTimeLoopHolds(e, lastStop, dayHasCarrier)
  const stop = parseTimeToMinutes(lastStop.time)
  return stop != null && stop <= checkOut
}

export const isDayInAccommodationRange = (
  day: Day,
  startDayId: number,
  endDayId: number,
  days: Day[],
): boolean => {
  const startDay = days.find(d => d.id === startDayId)
  const endDay = days.find(d => d.id === endDayId)
  if (!startDay || !endDay) {
    // Endpoint days not in the loaded array (e.g. sparse test data or partial load).
    // Fall back to numeric ID range — acceptable since non-monotonic IDs only arise when
    // both endpoints are present in a fully-loaded trip's days list.
    return day.id >= Math.min(startDayId, endDayId) && day.id <= Math.max(startDayId, endDayId)
  }
  const lo = Math.min(getDayOrder(startDay, days), getDayOrder(endDay, days))
  const hi = Math.max(getDayOrder(startDay, days), getDayOrder(endDay, days))
  return getDayOrder(day, days) >= lo && getDayOrder(day, days) <= hi
}
