import type { Day, Accommodation, RouteAnchors } from '../types'
import { parseTimeToMinutes } from './dayMerge'
import { withinDriveRange } from './geo'

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
export const getAccommodationAnchors = (
  day: Day,
  days: Day[],
  accommodations: Accommodation[],
): RouteAnchors => {
  const { morning, evening } = getDayBookendHotels(day, days, accommodations)
  if (!morning || !evening) return {}
  return {
    start: { lat: morning.place_lat as number, lng: morning.place_lng as number },
    end: { lat: evening.place_lat as number, lng: evening.place_lng as number },
  }
}

// Whether to draw the morning hotel → first-stop leg. It is a real drive when you slept in the
// morning hotel (a normal home-base day). On that hotel's check-in day you were traveling TO the
// hotel, so the leg is drawn only when the first stop is a PLACE provably timed at/after check-in
// (you dropped your bags first). A place before check-in (an airport you reach first, #1465), a
// transport arrival (you flew in, weren't at the hotel yet, #1321), or an un-timed place ("Home"
// before driving out, #1597) all mean no leg — mirroring the evening rule below. With no
// check-in time recorded the loop closes by default (#2009), except on a day a carrier
// takes you there or towards an edge place out of drive range (#2157).
export const shouldDrawMorningLeg = (
  bookends: { morning?: Accommodation; morningIsSleptHere?: boolean },
  day: Day,
  firstStop?: { isPlace: boolean; time?: string | null; carrierEdge?: CarrierEdge; lat?: number; lng?: number },
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
  // information" was being read as "proof against" — which silently opened the
  // loop at the start of every arrival day, since the hotel picker leaves the
  // time blank by default (#2009). With a time set, #1465 still holds: an
  // earlier stop is a place you reached before the hotel and draws no leg.
  if (checkIn == null) {
    // ...but the closed loop is a guess, and two things disprove it (#2157): a
    // carrier on the day means you arrive at this hotel by air/rail/sea — on its
    // check-in day the hotel is where the day ENDS, not where it starts — and an
    // edge place no drive of the hotel could reach ("Home", an ocean away) was
    // where you came FROM, not somewhere the hotel sent you.
    if (dayHasCarrier) return false
    if (firstStop.lat != null && firstStop.lng != null && m.place_lat != null && m.place_lng != null
      && !withinDriveRange({ lat: m.place_lat, lng: m.place_lng }, { lat: firstStop.lat, lng: firstStop.lng })) return false
    return true
  }
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
  lastStop?: { isPlace: boolean; time?: string | null; carrierEdge?: CarrierEdge; lat?: number; lng?: number },
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
  // to have missed, so the return leg is drawn and the loop closes (#2009).
  if (checkOut == null) {
    // Same two disproofs as the morning (#2157): a carrier on the check-out day
    // means the hotel is where the day STARTS and nothing drives back to it, and
    // an edge place out of drive range is where you went instead of returning.
    if (dayHasCarrier) return false
    if (lastStop.lat != null && lastStop.lng != null && e.place_lat != null && e.place_lng != null
      && !withinDriveRange({ lat: e.place_lat, lng: e.place_lng }, { lat: lastStop.lat, lng: lastStop.lng })) return false
    return true
  }
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
