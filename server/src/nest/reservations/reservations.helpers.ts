import type { ReservationEndpointRow } from '../../db/repositories/ReservationEndpoints.repository';
import type { EndpointInput, ReservationEndpoint } from './reservations.service';

/**
 * Pure helpers of the reservations domain: how a trip's endpoint and per-day
 * position rows are grouped by booking for the list, and which endpoint rows a
 * save inserts. Nothing here touches the DB, so they stay plain exports rather
 * than methods on ReservationsService (the places.helpers.ts split).
 */

/** A trip's endpoint rows, grouped by the reservation they belong to, in the order read. */
export function groupEndpointsByReservation(rows: ReservationEndpointRow[]): Map<number, ReservationEndpoint[]> {
  const map = new Map<number, ReservationEndpoint[]>();
  for (const r of rows) {
    const list = map.get(r.reservation_id) ?? [];
    // `role` is TEXT at the DB (unconstrained); `ReservationEndpoint.role`
    // narrows it to the three values every writer of this column sends:
    // the same widen-on-read the legacy `this.db.all<ReservationEndpoint>`
    // generic parameter asserted without any runtime check.
    list.push(r as ReservationEndpoint);
    map.set(r.reservation_id, list);
  }
  return map;
}

/** Each reservation's slot per day, `{ [day_id]: position }`, keyed by the reservation's id. */
export function groupDayPositions(
  dayPositions: { reservation_id: number; day_id: number; position: number }[],
): Map<number, Record<number, number>> {
  const posMap = new Map<number, Record<number, number>>();
  for (const dp of dayPositions) {
    if (!posMap.has(dp.reservation_id)) posMap.set(dp.reservation_id, {});
    posMap.get(dp.reservation_id)![dp.day_id] = dp.position;
  }
  return posMap;
}

/**
 * The rows a save of a reservation's endpoints inserts, one per kept endpoint
 * in the order given. A missing `sequence` is the index after the filter.
 */
export function endpointRows(reservationId: number, endpoints: EndpointInput[]) {
  // lat/lng are NOT NULL: an imported transport whose pick-up/return (or station/
  // stop) couldn't be geocoded reaches here with null coords. Skip those rows rather
  // than let the INSERT throw and fail the entire booking save; the dates still live
  // on reservation_time/reservation_end_time, so the booking lands on its day either way.
  const filtered = endpoints.filter((e) => e.lat != null && e.lng != null);
  return filtered.map((e, i) => ({
    reservation_id: reservationId,
    role: e.role,
    sequence: e.sequence ?? i,
    name: e.name,
    code: e.code ?? null,
    lat: e.lat!,
    lng: e.lng!,
    timezone: e.timezone ?? null,
    local_time: e.local_time ?? null,
    local_date: e.local_date ?? null,
  }));
}
