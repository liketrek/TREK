import type { Day, Accommodation, RouteAnchors } from '../types'
import { parseTimeToMinutes } from './dayMerge'

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
// morning hotel (a normal home-base day). On that hotel's check-in day the hotel is your base
// once you arrive, so the leg is still the default for a PLACE first stop — suppressed only when
// that place is timed BEFORE check-in (an airport you reach before dropping your bags, #1465), or
// when the first stop is a transport arrival (you flew in, weren't at the hotel yet, #1321).
// Un-timed places keep the loop, avoiding over-suppression on ordinary arrival days.
export const shouldDrawMorningLeg = (
  bookends: { morning?: Accommodation; morningIsSleptHere?: boolean },
  day: Day,
  firstStop?: { isPlace: boolean; time?: string | null },
): boolean => {
  if (bookends.morningIsSleptHere) return true
  const m = bookends.morning
  if (!m || m.start_day_id !== day.id || !firstStop?.isPlace) return false
  const checkIn = parseTimeToMinutes(m.check_in)
  const stop = parseTimeToMinutes(firstStop.time)
  return !(checkIn != null && stop != null && stop < checkIn)
}

// Mirror of shouldDrawMorningLeg for the last-stop → hotel evening leg. It is a real drive when
// you sleep in the evening hotel tonight. On that hotel's check-out day you have already left, so
// the return leg is NOT the default — drawn only when the last stop is a PLACE timed at/before
// check-out (a swing back before checking out). A later stop (heading home, #1465), an un-timed
// stop, or an evening transport departure (S7) all mean no return leg.
export const shouldDrawEveningLeg = (
  bookends: { evening?: Accommodation; eveningIsOvernight?: boolean },
  day: Day,
  lastStop?: { isPlace: boolean; time?: string | null },
): boolean => {
  if (bookends.eveningIsOvernight) return true
  const e = bookends.evening
  if (!e || e.end_day_id !== day.id || !lastStop?.isPlace) return false
  const checkOut = parseTimeToMinutes(e.check_out)
  const stop = parseTimeToMinutes(lastStop.time)
  return checkOut != null && stop != null && stop <= checkOut
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
