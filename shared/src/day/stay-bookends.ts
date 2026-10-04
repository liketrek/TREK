/**
 * Which stay a day wakes up in and which one it goes to sleep in.
 *
 * The rule came from the client's Days view, where it decides the hotel legs of the
 * day route, and moved here unchanged so that every reader of a day's nights makes the
 * same choice. The types name only the fields the rule reads, so a client row, a
 * server row and a test fixture all fit, and a caller gets its own stay objects back.
 */

/** The fields of a day its place in the trip is read from. */
export interface DayRef {
  id: number;
  day_number?: number | null;
}

/** The fields of a stay the choice reads: the days it spans and where it is. */
export interface StayRange {
  start_day_id: number;
  end_day_id: number;
  place_lat?: number | null;
  place_lng?: number | null;
}

/** A point on the day, such as its first or last stop, held against a stay. */
export interface StayEdgePoint {
  lat?: number | null;
  lng?: number | null;
}

/** The stay a day wakes up in and the one it sleeps in, with where each choice came from. */
export interface DayBookendHotels<A> {
  morning?: A;
  evening?: A;
  morningIsSleptHere?: boolean;
  eveningIsOvernight?: boolean;
}

/** A day's place in the trip: its day number, or its position in the list without one. */
export const getDayOrder = (day: DayRef, days: readonly DayRef[]): number => day.day_number ?? days.indexOf(day);

export const isDayInAccommodationRange = (
  day: DayRef,
  startDayId: number,
  endDayId: number,
  days: readonly DayRef[],
): boolean => {
  const startDay = days.find((d) => d.id === startDayId);
  const endDay = days.find((d) => d.id === endDayId);
  if (!startDay || !endDay) {
    // Endpoint days not in the loaded array (e.g. sparse test data or partial load).
    // Fall back to numeric ID range. Acceptable since non-monotonic IDs only arise when
    // both endpoints are present in a fully-loaded trip's days list.
    return day.id >= Math.min(startDayId, endDayId) && day.id <= Math.max(startDayId, endDayId);
  }
  const lo = Math.min(getDayOrder(startDay, days), getDayOrder(endDay, days));
  const hi = Math.max(getDayOrder(startDay, days), getDayOrder(endDay, days));
  return getDayOrder(day, days) >= lo && getDayOrder(day, days) <= hi;
};

/**
 * The hotel and the day's edge waypoint are one and the same spot.
 *
 * Booking a night also puts its hotel on the check-in day as a stop, so that day's
 * last waypoint IS the hotel far more often than not, and the bookend leg drawn to
 * it would be a zero-kilometre round trip: in the drawn line, in the sidebar's leg
 * list and in every exported directions link, which would carry the hotel twice in
 * a row. Compared by coordinates, because the bookend comes off the stay row and
 * the waypoint off the assignment, and the same tie holds for two places pinned at
 * the same spot.
 */
export const hotelIsTheStop = (
  hotel: Pick<StayRange, 'place_lat' | 'place_lng'> | undefined,
  stop?: StayEdgePoint,
): boolean =>
  !!hotel &&
  hotel.place_lat != null &&
  hotel.place_lng != null &&
  stop?.lat != null &&
  stop.lng != null &&
  hotel.place_lat === stop.lat &&
  hotel.place_lng === stop.lng;

// The two hotels that bookend a day: the one you woke up in (morning) and the one you sleep in
// tonight (evening). On a transfer day these differ; on any other day both are the single hotel.
// The morning hotel is keyed off "checked in on an earlier day and still in range" (i.e. you slept
// there) rather than "checks out today", so it stays correct when an overlapping or long stay does
// not end exactly on the transfer day.
export const getDayBookendHotels = <A extends StayRange>(
  day: DayRef,
  days: readonly DayRef[],
  accommodations: readonly A[],
): DayBookendHotels<A> => {
  const inRange = accommodations.filter(
    (a) =>
      a.place_lat != null && a.place_lng != null && isDayInAccommodationRange(day, a.start_day_id, a.end_day_id, days),
  );
  if (inRange.length === 0) return {};

  const dayOrd = getDayOrder(day, days);
  const orderOf = (id: number) => {
    const d = days.find((x) => x.id === id);
    return d ? getDayOrder(d, days) : dayOrd;
  };
  const checkIn = inRange.find((a) => a.start_day_id === day.id); // the hotel you arrive at tonight
  const sleptHere = inRange.find((a) => orderOf(a.start_day_id) < dayOrd); // the hotel you woke up in

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
  };
};
