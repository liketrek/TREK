import {
  getDayBookendHotels,
  getDayOrder,
  hotelIsTheStop,
  isDayInAccommodationRange,
  type DayRef,
} from '../day/stay-bookends';
import { closesTheDay, isCarrierType, opensTheDay, type CarrierBooking } from './carriers';
import { withinDriveRange } from './corridor';
import { stationary } from './dayWindow';
import type { BookendPhase, PlanDay, RoadtripStop, RoutedLeg } from './planning-types';

/**
 * A booked night at both ends of the days around it.
 *
 * A stay's hotel is a stop on the day it is checked in on, where the booking put it
 * (#2354). The days after it did not know about it: a day after a booked night set off
 * from its first place, a day before one ended at its last, and with the days connected
 * the drive between them ran from one place to the other as if nobody slept anywhere. The
 * day plan has always drawn those two legs (`getDayBookendHotels`); this seats the same
 * two hotels on the road trip, as stops of their own at a day's edges, so the drive to
 * them and from them is timed, measured and drawn like any other.
 *
 * One rule for the browser and the server, run right after the terminals are seated
 * (`seatCarrierStops`) and before a day is asked whether it stands as one. Nothing is
 * stored: a bookend is the stay's place with an id that belongs to no assignment, and
 * every reader that files something by a stored stop's index passes it over
 * (`isStoredStop`).
 */

/** A stay as the rule reads it: its nights, its place, and the booking behind it. */
export interface BookendStay {
  id: number;
  place_id?: number | null;
  start_day_id: number;
  end_day_id: number;
  place_lat?: number | null;
  place_lng?: number | null;
  place_name?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  reservation_id?: number | null;
}

/**
 * Below the terminals (-3e9), the automatic nights (-2e9) and the days the window
 * invents (-1e9), so a bookend's id never meets one of theirs.
 */
const BOOKEND_ID_BASE = -6_000_000_000;

/** The id a day's bookend goes by: one per day and phase, and the same on every run. */
export function bookendAssignmentId(dayId: number, phase: BookendPhase): number {
  return BOOKEND_ID_BASE - dayId * 2 - (phase === 'evening' ? 1 : 0);
}

/** Whether a trip's days start and end at the stay. Off unless it was switched on. */
export function hotelBookendsOn(preferences: { roadtrip_hotel_bookends?: boolean | null }): boolean {
  return preferences.roadtrip_hotel_bookends === true;
}

/**
 * Whether the drive between two stops is a night spent at one hotel: one end is a
 * bookend and both stand on the same spot. Nothing is driven there, and nothing is asked.
 */
export function isStationaryJoin(
  from: Pick<RoadtripStop, 'bookend' | 'lat' | 'lng'>,
  to: Pick<RoadtripStop, 'bookend' | 'lat' | 'lng'>,
): boolean {
  return !!(from.bookend || to.bookend) && from.lat === to.lat && from.lng === to.lng;
}

/**
 * A leg lookup that answers a night spent at one hotel with a leg going nowhere, ahead of
 * whatever is stored for the pair. A leg fetched for the same two points some other time
 * is a drive, and the night is not one.
 */
export function withStationaryJoins(
  lookup: (from: RoadtripStop, to: RoadtripStop) => RoutedLeg | undefined,
): (from: RoadtripStop, to: RoadtripStop) => RoutedLeg | undefined {
  return (from, to) => (isStationaryJoin(from, to) ? stationary(from) : lookup(from, to));
}

/**
 * The stays as the rule reads them, from the trip's stays and its bookings: each stay
 * once, with the earliest booking linked to it. A booking names its stay as text on some
 * rows, so the link is compared as a number.
 */
export function bookendStaysOf<S extends Omit<BookendStay, 'reservation_id'>>(
  stays: readonly S[],
  reservations: readonly { id: number; accommodation_id?: number | string | null }[],
): BookendStay[] {
  const seen = new Set<number>();
  const out: BookendStay[] = [];
  for (const stay of stays) {
    if (seen.has(stay.id)) continue;
    seen.add(stay.id);
    const linked = reservations.filter(
      (r) => r.accommodation_id != null && r.accommodation_id !== '' && Number(r.accommodation_id) === stay.id,
    );
    out.push({
      id: stay.id,
      place_id: stay.place_id ?? null,
      start_day_id: stay.start_day_id,
      end_day_id: stay.end_day_id,
      place_lat: stay.place_lat ?? null,
      place_lng: stay.place_lng ?? null,
      place_name: stay.place_name ?? null,
      check_out: stay.check_out ?? null,
      reservation_id: linked.length ? Math.min(...linked.map((r) => r.id)) : null,
    });
  }
  return out;
}

/**
 * A bookend as a stop. `legMode` is the mode of the drive that leaves it: the morning's
 * drive to the first stop goes the way that stop is reached from the hotel
 * (`incoming_leg_transport_mode`, the mode the day plan draws that leg in), and the
 * evening's leaves nowhere.
 */
function bookendStop(
  day: PlanDay,
  phase: BookendPhase,
  stay: BookendStay,
  ownerIndex: number,
  legMode: string | null,
): RoadtripStop {
  const checkingOut = phase === 'morning' && stay.end_day_id === day.dayId;
  const checkingIn = phase === 'evening' && stay.start_day_id === day.dayId;
  return {
    bookend: {
      phase,
      accommodationId: stay.id,
      reservationId: stay.reservation_id ?? null,
      checkingOut,
      checkingIn,
      checkOut: checkingOut ? (stay.check_out ?? null) : null,
      ...(checkingIn && stay.check_in ? { checkIn: stay.check_in } : {}),
    },
    assignmentId: bookendAssignmentId(day.dayId, phase),
    ownerDayId: day.dayId,
    ownerIndex,
    placeId: stay.place_id!,
    name: stay.place_name ?? '',
    lat: stay.place_lat!,
    lng: stay.place_lng!,
    // No clock of its own. The check-out is the latest the room is handed back, not when
    // the drive leaves (#2357), and the evening's check-in is the stay's business: a stop
    // nobody can move or edit must never be the one the day is late for.
    time: null,
    leaveAt: null,
    checkInTime: null,
    dwellMinutes: 0,
    night: false,
    endDay: false,
    legMode,
    incomingLegMode: null,
    stopType: 'hotel',
    fillPercent: null,
  };
}

const sameSpot = (a: BookendStay | undefined, b: BookendStay | undefined): boolean =>
  !!a && !!b && a.place_lat === b.place_lat && a.place_lng === b.place_lng;

/**
 * Whether the hotel is joined by road to the stop beside it. Not to a terminal more than a
 * drive away: the traveller flew there, and the router answers the pair with no route. The
 * day plan draws no hotel leg to such a terminal either (#2133).
 */
const withinReach = (hotel: BookendStay, stop: RoadtripStop | undefined): boolean =>
  !stop?.carrier || withinDriveRange({ lat: hotel.place_lat!, lng: hotel.place_lng! }, stop);

/**
 * The plan's days with the night before and the night after seated at their edges.
 *
 * Which stay a day wakes up in and which one it sleeps in is the day plan's own choice
 * (`getDayBookendHotels`), read over the real nights only: a stay that begins and ends on
 * one day is slept in by nobody. The stays are read in id order, so the browser, which may
 * hold them in any order, and the server choose the same one where two overlap.
 *
 * The morning gets the stay slept in, unless the day already starts there, or starts on
 * landing or at a hire car's desk, where the traveller was not at the hotel. The evening
 * gets tonight's stay, unless the day already ends there, or ends at a departure or at the
 * desk the hire car goes back to. A day without a stop of its own gets both or neither: a
 * morning at one hotel and an evening at another is the drive between them, while a day
 * between two nights in one hotel, or a day that is only its check-out, is not driven.
 *
 * Neither is seated beside a terminal more than a drive away (`withinReach`). And a day
 * with nothing of its own but tonight's stay gets neither when a flight, train, ferry,
 * cruise or bus is booked across it: that booking is the move from one stay to the other.
 * It seats no terminal on the day, most often because it was saved without both of them,
 * so the road from one hotel to the next is the stretch nobody drove, and the day plan
 * draws no line for it either (#2476). `bookings` are the trip's, read for those rides.
 *
 * So a day with a bookend always has two stops or more, and stands as a day for that
 * reason and no other. Days that change nothing come back as they were, and so does the
 * plan when no day changes.
 */
export function seatNightBookends(
  plan: PlanDay[],
  days: readonly DayRef[],
  stays: readonly BookendStay[],
  bookings: readonly Pick<CarrierBooking, 'type' | 'day_id' | 'end_day_id'>[] = [],
): PlanDay[] {
  const dayOf = (id: number): DayRef | undefined => days.find((d) => d.id === id);
  const realNight = (stay: BookendStay): boolean => {
    const start = dayOf(stay.start_day_id);
    const end = dayOf(stay.end_day_id);
    return start && end ? getDayOrder(end, days) > getDayOrder(start, days) : stay.end_day_id > stay.start_day_id;
  };
  const nights = stays.filter((stay) => stay.place_id != null && realNight(stay)).sort((a, b) => a.id - b.id);
  if (!nights.length) return plan;
  const rides = bookings.filter((booking) => isCarrierType(booking.type) && booking.day_id != null);
  const ridden = (day: DayRef): boolean =>
    rides.some((ride) => isDayInAccommodationRange(day, ride.day_id!, ride.end_day_id ?? ride.day_id!, days));

  let changed = false;
  const out = plan.map((day) => {
    const ref = dayOf(day.dayId);
    if (!ref) return day;
    const stops = day.stops;
    if (stops.every((stop) => stop.night) && ridden(ref)) return day;
    const hotels = getDayBookendHotels(ref, days, nights);
    const first = stops[0];
    const last = stops[stops.length - 1];
    let head =
      !!hotels.morning &&
      !!hotels.morningIsSleptHere &&
      !(first && (hotelIsTheStop(hotels.morning, first) || opensTheDay(first.carrier?.role))) &&
      withinReach(hotels.morning, first);
    let tail =
      !!hotels.evening &&
      !!hotels.eveningIsOvernight &&
      !(last && (hotelIsTheStop(hotels.evening, last) || closesTheDay(last.carrier?.role))) &&
      withinReach(hotels.evening, last);
    if (!stops.length) head = tail = head && tail && !sameSpot(hotels.morning, hotels.evening);
    if (!head && !tail) return day;
    changed = true;
    const stored = stops.filter((stop) => !stop.carrier).length;
    return {
      ...day,
      stops: [
        ...(head ? [bookendStop(day, 'morning', hotels.morning!, 0, first?.incomingLegMode ?? null)] : []),
        ...stops,
        ...(tail ? [bookendStop(day, 'evening', hotels.evening!, stored, null)] : []),
      ],
    };
  });
  return changed ? out : plan;
}
