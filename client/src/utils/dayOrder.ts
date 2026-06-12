import type { Day, Accommodation, RouteAnchors } from '../types'

export const getDayOrder = (day: Day, days: Day[]): number =>
  day.day_number ?? days.indexOf(day)

// Derives route anchors from the accommodation(s) active on a day. A single hotel is the day's home
// base, so the route is a loop that starts and ends there. A transfer day — checking out of one hotel
// and into another — instead runs from the morning hotel to the evening one.
export const getAccommodationAnchors = (
  day: Day,
  days: Day[],
  accommodations: Accommodation[],
): RouteAnchors => {
  const located = accommodations.filter(a =>
    a.place_lat != null && a.place_lng != null &&
    isDayInAccommodationRange(day, a.start_day_id, a.end_day_id, days),
  )
  if (located.length === 0) return {}

  const toAnchor = (a: Accommodation) => ({ lat: a.place_lat as number, lng: a.place_lng as number })

  const checkOut = located.find(a => a.end_day_id === day.id) // the hotel you leave this morning
  const checkIn = located.find(a => a.start_day_id === day.id) // the hotel you arrive at tonight
  if (checkOut && checkIn && checkOut !== checkIn) {
    return { start: toAnchor(checkOut), end: toAnchor(checkIn) }
  }

  const hotel = toAnchor(located[0])
  return { start: hotel, end: hotel }
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
