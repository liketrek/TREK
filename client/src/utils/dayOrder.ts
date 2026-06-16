import type { Day, Accommodation, RouteAnchors } from '../types'

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
): { morning?: Accommodation; evening?: Accommodation } => {
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
