import { chronoOrder } from '../day/chrono-order';
import { haversineKm, type LatLng } from './corridor';
import type { CarrierTerminal, RoadtripStop, RoutedLeg } from './planning-types';
import { formatClock, formatDurationShort, parseClock } from './roadtripModel';

/**
 * Bookings the traveller rides and then leaves behind, the same set the day plan calls a
 * carrier (`isCarrierTransport` in the client): the vehicle carries them out of the day's
 * geography and keeps going without them. A hire car, a taxi or a transit hop is not one
 * of these, because the traveller stays in the drive's geography the whole way.
 *
 * On the road trip such a booking is a seam: the road ends at the terminal it leaves
 * from and starts again at the one it lands at. Routing straight across it drew a
 * two-thousand-kilometre drive where a flight was booked (#2428).
 */
export const CARRIER_TYPES = ['flight', 'train', 'ferry', 'cruise', 'bus'] as const;

export function isCarrierType(type: string | null | undefined): boolean {
  return !!type && (CARRIER_TYPES as readonly string[]).includes(type);
}

/**
 * A hire car: the traveller drives it, so its booking is no seam. Its pick-up and return
 * desks are still where the drive starts and ends, and the day plan routes to them the
 * same way, so they take their place on the road as points of their own.
 */
export function isRentalType(type: string | null | undefined): boolean {
  return type === 'car';
}

/** A leg mode that is a ride rather than a road: the booking's own type is the mode. */
export function isCarrierMode(mode: string | null | undefined): boolean {
  return isCarrierType(mode);
}

/**
 * How long before the timetable's departure the traveller has to be at the terminal.
 *
 * The pin on the departure terminal is this much before the departure, not the departure
 * itself: a drive that reaches the airport as the doors close is late, however the model
 * counts it. The ride then leaves at the timetable's minute.
 */
export const CHECK_IN_MINUTES: Record<string, number> = {
  flight: 60,
  cruise: 60,
  ferry: 30,
  train: 10,
  bus: 10,
};

/**
 * Whether the car goes along. A range budget carries across a ride the car takes too
 * (a car ferry, a motorail) and starts afresh after one it cannot (nobody flies a car),
 * because the tank the drive continues on is a different tank.
 */
export function carriesTheCar(type: string): boolean {
  return type === 'ferry' || type === 'train';
}

/** A booking as either side stores it: the row with its endpoints and positions joined on. */
export interface CarrierBooking {
  id: number;
  type: string;
  title: string;
  day_id?: number | null;
  end_day_id?: number | null;
  /** 'HH:mm' or 'YYYY-MM-DDTHH:mm', as the reservation form writes it. */
  reservation_time?: string | null;
  reservation_end_time?: string | null;
  /** JSON as stored, or the parsed object; only `legs` is read here. */
  metadata?: string | Record<string, unknown> | null;
  endpoints?: readonly {
    role: string;
    sequence?: number | null;
    name: string;
    code?: string | null;
    lat: number | null;
    lng: number | null;
  }[];
  day_positions?: Record<string, number> | null;
  day_plan_position?: number | null;
}

/** One end of a seam: where, when and on which day the drive stops or resumes. */
export interface CarrierEnd {
  dayId: number;
  /** Where the terminal sits among the day's stops, when somebody placed the booking by hand. */
  position: number | null;
  /** The timetable's clock at this terminal, 'HH:mm', null when the booking names none. */
  clock: string | null;
  name: string;
  code: string | null;
  lat: number;
  lng: number;
}

export interface CarrierSeam {
  reservationId: number;
  type: string;
  title: string;
  /** A ride seams the drive; a rental only puts its two desks on it. */
  kind: 'ride' | 'rental';
  /**
   * Whether the ride changes vehicle on the way. The day plan lists each leg of such a
   * booking by its own clock, so the seat by geography (`rideSeatAfter`) leaves it alone.
   */
  stopover: boolean;
  departure: CarrierEnd;
  /**
   * A ride always has both ends. A hire car has a return only when the booking says
   * when and where: without a return day or a located return desk, nothing is guessed
   * and only the pick-up stands on the road.
   */
  arrival: CarrierEnd | null;
}

interface LegRecord {
  dep_day_id?: number | null;
  dep_time?: string | null;
  arr_day_id?: number | null;
  arr_time?: string | null;
  day_positions?: Record<string, number> | null;
}

function parseMetadata(raw: CarrierBooking['metadata']): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw !== 'string') return raw;
  try {
    let parsed: unknown = JSON.parse(raw);
    // A booking saved by an earlier bug carries its JSON encoded twice; the day plan
    // unwraps it once more on read and so does this.
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** The legs of a booking with a stopover, in order; none for a direct one. */
function legsOf(booking: CarrierBooking): LegRecord[] {
  const legs = parseMetadata(booking.metadata).legs;
  return Array.isArray(legs) ? (legs as LegRecord[]) : [];
}

/** 'HH:mm' out of either form the reservation columns hold, null for anything else. */
export function carrierClock(value: string | null | undefined): string | null {
  if (!value) return null;
  const text = value.includes('T') ? value.slice(value.indexOf('T') + 1) : value;
  const minutes = parseClock(text);
  return minutes === null ? null : formatClock(minutes);
}

function positionOn(positions: Record<string, number> | null | undefined, dayId: number): number | null {
  const value = positions?.[String(dayId)] ?? (positions as Record<number, number> | null | undefined)?.[dayId];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

type Endpoint = NonNullable<CarrierBooking['endpoints']>[number];
type LocatedEndpoint = Endpoint & { lat: number; lng: number };

function isLocated(e: Endpoint): e is LocatedEndpoint {
  return typeof e.lat === 'number' && typeof e.lng === 'number' && Number.isFinite(e.lat) && Number.isFinite(e.lng);
}

/**
 * The terminals a booking stops and resumes the drive at, or null when it has not the
 * ones its kind needs.
 *
 * A ride needs both ends to say where the drive stops and where it resumes, and takes
 * the first and the last located stop for them when no endpoint is marked. A hire car's
 * desks are only ever the ones marked as such: guessing one would put a stop on the
 * road nobody booked, and a return desk read as the pick-up starts the drive where it
 * ends. The same desk twice is fine for a car, and no seam for a ride.
 */
function seamEnds(
  booking: CarrierBooking,
  kind: CarrierSeam['kind'],
): { from: LocatedEndpoint; to: LocatedEndpoint | undefined } | null {
  const located = (booking.endpoints ?? []).filter(isLocated).sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  const from =
    kind === 'ride' ? (located.find((e) => e.role === 'from') ?? located[0]) : located.find((e) => e.role === 'from');
  const to =
    kind === 'ride'
      ? ([...located].reverse().find((e) => e.role === 'to') ?? located[located.length - 1])
      : [...located].reverse().find((e) => e.role === 'to');
  if (!from) return null;
  if (kind === 'ride' && (!to || from === to)) return null;
  return { from, to };
}

/** The day a booking leaves on: its first leg's, else its own. Null when it names none. */
function departureDayOf(booking: CarrierBooking, legs: readonly LegRecord[]): number | null {
  return legs[0]?.dep_day_id ?? booking.day_id ?? null;
}

/**
 * The seam a booking makes, or null when it makes none: a booking on no day is not on the
 * plan, and one without a located terminal at BOTH ends cannot say where the drive stops
 * or where it goes on, so it is left to the day plan.
 *
 * A booking with a stopover is one seam from its first departure to its last arrival. The
 * change of planes happens inside the ride, and the drive has no say in it.
 */
export function carrierSeam(booking: CarrierBooking): CarrierSeam | null {
  const kind: CarrierSeam['kind'] | null = isCarrierType(booking.type)
    ? 'ride'
    : isRentalType(booking.type)
      ? 'rental'
      : null;
  if (!kind) return null;
  const ends = seamEnds(booking, kind);
  if (!ends) return null;
  const { from, to } = ends;

  const legs = legsOf(booking);
  const first = legs[0];
  const last = legs[legs.length - 1];
  const depDayId = departureDayOf(booking, legs);
  if (depDayId == null) return null;
  // A ride lands on the day it left unless the booking says otherwise. A hire car is
  // handed back on the day the booking names, and on no day when it names none.
  const arrDayId = last?.arr_day_id ?? booking.end_day_id ?? (kind === 'ride' ? depDayId : null);
  const depClock = carrierClock(first?.dep_time ?? booking.reservation_time);
  const arrClock = carrierClock(last?.arr_time ?? booking.reservation_end_time);
  const bookingPosition = (dayId: number): number | null =>
    positionOn(booking.day_positions, dayId) ??
    (typeof booking.day_plan_position === 'number' ? booking.day_plan_position : null);
  // The booking's own slot (`day_plan_position`) is one number for every day it spans,
  // and the day plan seeds it on the day the booking leaves, against that day's stops.
  // Read on the day a ride lands it named a seat among stops it was never measured
  // against: an overnight ferry seeded behind both stops of its evening sat behind the
  // morning's stop across the water, and the drive went from that stop back to the pier
  // (#2461). So a ride landing on a later day takes only a slot somebody gave it on that
  // day. Without one the clock seats it there, and with nothing timed ahead of it the
  // arrival opens the day (`opensTheDay`).
  const arrivalPosition = (dayId: number): number | null =>
    kind === 'ride' && dayId !== depDayId
      ? (positionOn(last?.day_positions, dayId) ?? positionOn(booking.day_positions, dayId))
      : (positionOn(last?.day_positions, dayId) ?? bookingPosition(dayId));

  return {
    reservationId: booking.id,
    type: booking.type,
    title: booking.title,
    kind,
    stopover: legs.length > 1,
    departure: {
      dayId: depDayId,
      position: positionOn(first?.day_positions, depDayId) ?? bookingPosition(depDayId),
      clock: depClock,
      name: from.name,
      code: from.code ?? null,
      lat: from.lat,
      lng: from.lng,
    },
    arrival:
      to && arrDayId != null
        ? {
            dayId: arrDayId,
            position: arrivalPosition(arrDayId),
            clock: arrClock,
            name: to.name,
            code: to.code ?? null,
            lat: to.lat,
            lng: to.lng,
          }
        : null,
  };
}

/**
 * Whether a booking is a ride the drive would seam at its terminals if it were on a day:
 * a flight, train, ferry, cruise or bus with both ends located and no day to leave on.
 *
 * Such a booking falls out of the road trip without a word, while the map still draws
 * its arc between the same two terminals, so it looks planned and the drive goes round
 * it by road (#2461). A booking gets there by being saved without a date, or by losing
 * its day when the trip was shortened.
 */
export function isUndatedRide(booking: CarrierBooking): boolean {
  return (
    isCarrierType(booking.type) &&
    seamEnds(booking, 'ride') !== null &&
    departureDayOf(booking, legsOf(booking)) == null
  );
}

/** The trip's rides on no day (`isUndatedRide`), by id so both sides list them alike. */
export function undatedRides<T extends CarrierBooking>(bookings: readonly T[]): T[] {
  return bookings.filter(isUndatedRide).sort((a, b) => a.id - b.id);
}

/** One item of a day, as the seat of a ride reads it. */
export interface SeatItem {
  /** Where it sorts in the day: its stored order index, or the day list's own key. */
  key: number;
  /** Its own clock in minutes, null without one. */
  minutes: number | null;
  /** Where the drive goes for it; null for an item it does not drive to. */
  point: LatLng | null;
}

/** A ride that leaves and lands on one day, as far as its seat among the stops goes. */
export interface SameDayRide {
  /** The departure's clock in minutes, null when the booking names none. */
  minutes: number | null;
  from: LatLng;
  to: LatLng;
}

/**
 * How much less road a seat has to promise than the clock's before it wins, as a share of
 * the crossing's own length.
 *
 * The kilometres are straight lines, a guess at the road. Two seats that differ by less
 * than a quarter of the crossing are within that guess, and then the clock's seat stands:
 * it is the one the day plan has always shown. The seat this is for saves about twice the
 * crossing, the drive overland to the far shore and back to the pier.
 */
const SEAT_MARGIN_SHARE = 0.25;

function sameDayRideOf(seam: CarrierSeam): SameDayRide | null {
  if (seam.kind !== 'ride' || seam.stopover || seam.arrival?.dayId !== seam.departure.dayId) return null;
  return {
    minutes: parseClock(seam.departure.clock),
    from: { lat: seam.departure.lat, lng: seam.departure.lng },
    to: { lat: seam.arrival.lat, lng: seam.arrival.lng },
  };
}

/**
 * The ride a booking makes within one day, for seating it by where it goes: a flight,
 * train, ferry, cruise or bus that leaves and lands on the same day, with both terminals
 * located and no change of vehicle. Null for anything else, which keeps the clock's seat.
 */
export function sameDayRide(booking: CarrierBooking): SameDayRide | null {
  const seam = carrierSeam(booking);
  return seam ? sameDayRideOf(seam) : null;
}

/**
 * Where a ride that leaves and lands on the same day goes when nobody placed it, if not
 * where the clock puts it: the key of the item it goes behind, -Infinity to open the day,
 * or null to keep the clock's seat.
 *
 * The clock alone files a ride behind the last stop timed at or before its departure,
 * and at the end of the day when there is none. A ferry between two untimed stops, one
 * on each shore, then closed the day: the drive went overland to the far shore, back to
 * the pier, and only then across (#2461). The clock still bounds the seat, behind the
 * last item timed at or before the departure and ahead of the first one timed after it.
 * Between those the seat is the one that adds the fewest straight-line kilometres: the
 * drive to the departure terminal and the drive on from the arrival one, less the drive
 * the ride stands in for. At the start of the day only the drive on counts, at the end
 * only the drive there. An item with no point is passed over, and the kilometres are
 * measured between the located items around it.
 *
 * Every caller seats a booking with this one rule, so the day list, the slot the desktop
 * stores for it and the road trip keep to one order.
 */
export function rideSeatAfter(items: readonly SeatItem[], ride: SameDayRide): number | null {
  const sorted = [...items].sort((a, b) => a.key - b.key);
  // Read the way the clock rule reads it: a ride without a clock counts as midnight.
  const departs = ride.minutes ?? 0;
  let lower = -1;
  sorted.forEach((item, i) => {
    if (item.minutes !== null && item.minutes <= departs) lower = i;
  });
  // Nothing timed binds a ride without a clock from above: wherever it goes, it takes the
  // time of the item before it and stays there.
  const next =
    ride.minutes === null
      ? -1
      : sorted.findIndex((item, i) => i > lower && item.minutes !== null && item.minutes > departs);
  const upper = next < 0 ? sorted.length : next;
  // Seat `g` is behind sorted[g], -1 ahead of everything. The clock's own is behind the
  // last item timed before the ride, or with none the last seat in reach, which is where
  // the day plan's time order reads a ride it filed at the end of the day.
  if (upper - lower < 2 || !sorted.some((item) => item.point)) return null;
  const clockSeat = lower >= 0 ? lower : upper - 1;
  const pointAt = (from: number, step: 1 | -1): LatLng | null => {
    for (let i = from; i >= 0 && i < sorted.length; i += step) if (sorted[i]!.point) return sorted[i]!.point;
    return null;
  };
  const added = (g: number): number => {
    const before = pointAt(g, -1);
    const after = pointAt(g + 1, 1);
    return (
      (before ? haversineKm(before, ride.from) : 0) +
      (after ? haversineKm(ride.to, after) : 0) -
      (before && after ? haversineKm(before, after) : 0)
    );
  };
  let best = clockSeat;
  let bestKm = added(clockSeat) - haversineKm(ride.from, ride.to) * SEAT_MARGIN_SHARE;
  for (let g = lower; g < upper; g++) {
    const km = added(g);
    if (km < bestKm) {
      best = g;
      bestKm = km;
    }
  }
  if (best === clockSeat) return null;
  return best < 0 ? -Infinity : sorted[best]!.key;
}

/**
 * Minutes of a ride as the clocks tell them, across the days it spans.
 *
 * Wall clocks on purpose, not elapsed time: the chain runs on the local clock, and after
 * landing the day goes on in the destination's time. A ride that lands earlier on the
 * clock than it left (westward across the date line) cannot be told from a ride of no
 * length this way and counts as one. Null when either clock is missing.
 */
function rideMinutes(dep: number | null, arr: number | null, dayDelta: number): number | null {
  if (dep === null || arr === null) return null;
  return Math.max(0, arr + Math.max(0, dayDelta) * 1440 - dep);
}

/** Below the automatic nights (-2e9 and down): a terminal is no assignment and no night. */
const TERMINAL_ID_BASE = -3_000_000_000;

export function terminalAssignmentId(reservationId: number, role: CarrierTerminal['role']): number {
  return TERMINAL_ID_BASE - reservationId * 2 - (role === 'arrival' || role === 'return' ? 1 : 0);
}

/** The two roles of a seam, by which end of it a terminal stands at. */
function rolesOf(seam: CarrierSeam): { start: CarrierTerminal['role']; end: CarrierTerminal['role'] } {
  return seam.kind === 'rental' ? { start: 'pickup', end: 'return' } : { start: 'departure', end: 'arrival' };
}

function terminalStop(
  seam: CarrierSeam,
  role: CarrierTerminal['role'],
  dayId: number,
  ownerIndex: number,
): RoadtripStop {
  // The callers only ask for an arrival or a return the seam has.
  const end = role === 'departure' || role === 'pickup' ? seam.departure : seam.arrival!;
  const checkIn = CHECK_IN_MINUTES[seam.type] ?? 0;
  const depart = parseClock(end.clock);
  // The departure terminal is pinned a check-in ahead of the timetable and left at the
  // timetable's minute; the arrival one is pinned at the timetable's minute and left at
  // once. Neither has a stay of its own. A hire car's desks are pinned at the booking's
  // own clock, and the drive goes on from them without a stay. The pin never goes past
  // midnight: a red-eye inside its allowance would otherwise read as the evening before,
  // and the chain would file every stop after it on the next day's card.
  const pinnedAt = role === 'departure' && depart !== null ? Math.max(0, depart - checkIn) : null;
  return {
    carrier: {
      reservationId: seam.reservationId,
      type: seam.type,
      role,
      title: seam.title,
      code: end.code,
      at: end.clock,
    },
    assignmentId: terminalAssignmentId(seam.reservationId, role),
    ownerDayId: dayId,
    ownerIndex,
    placeId: -seam.reservationId,
    name: end.name,
    lat: end.lat,
    lng: end.lng,
    time: pinnedAt === null ? end.clock : formatClock(pinnedAt),
    leaveAt: role === 'departure' ? end.clock : null,
    dwellMinutes: depart !== null && pinnedAt !== null ? depart - pinnedAt : 0,
    checkInTime: null,
    night: false,
    endDay: false,
    legMode: role === 'departure' ? seam.type : null,
    incomingLegMode: role === 'arrival' ? seam.type : null,
    stopType: null,
    fillPercent: null,
  };
}

/**
 * Tonight's stays that wait behind a ride of their check-in day, by their index among the
 * day's stops, each with the rides that land nearer it than they leave.
 *
 * A booked night's stop carries its check-in as its clock, and the clock seats every stop
 * ahead of a ride that leaves after it. But the check-in is the earliest the room is
 * ready, not an hour anybody keeps: a hotel in Munich checked into from three sat ahead of
 * a flight out of Hamburg at a quarter past, and the drive went from the hotel to Hamburg
 * airport to fly back to Munich. The day plan never met this, because it does not list the
 * stay's stop at all. So a stay nearer where a ride of the day lands than where it leaves
 * goes behind the landing, whatever its check-in or the booking's slot says. A stop with a
 * time of its own keeps the seat that time gives it: that hour somebody chose.
 */
function staysBehindRides(stops: readonly RoadtripStop[], rides: readonly CarrierSeam[]): Map<number, CarrierSeam[]> {
  const behind = new Map<number, CarrierSeam[]>();
  stops.forEach((stop, index) => {
    if (!stop.night || parseClock(stop.time) !== null) return;
    const landing = rides.filter((ride) => haversineKm(stop, ride.arrival!) < haversineKm(stop, ride.departure));
    if (landing.length) behind.set(index, landing);
  });
  return behind;
}

/**
 * The stay as the ride it waits behind reaches it. Its check-in still holds it when the
 * ride lands before the room is ready. One that opened while the traveller was on the way
 * pins nothing: held, it read the hotel at 15:00 behind a landing at 17:20, and late.
 */
function reachedFrom(stay: RoadtripStop, ride: CarrierSeam): RoadtripStop {
  const lands = parseClock(ride.arrival?.clock);
  const checkIn = parseClock(stay.checkInTime);
  return lands !== null && checkIn !== null && checkIn < lands ? { ...stay, checkInTime: null } : stay;
}

/** Whether a terminal opens a day it has no timed stop before it on: an arrival or a pick-up. */
export function opensTheDay(role: CarrierTerminal['role'] | undefined): boolean {
  return role === 'arrival' || role === 'pickup';
}

/** Whether a terminal closes the day it stands last on: a departure or a hire car handed back. */
export function closesTheDay(role: CarrierTerminal['role'] | undefined): boolean {
  return role === 'departure' || role === 'return';
}

/**
 * The day's stops with the terminals of its rides, and the desks of its hire cars, seated
 * among them.
 *
 * Each terminal takes the slot the day plan shows the booking in, worked out by the same
 * rules (`getMergedItems` in the client): a position somebody dragged it to wins, otherwise
 * it goes behind the last stop whose time is at or before its own, otherwise at the end,
 * and the whole list is then read in clock order. A ride that lands on the day it left
 * may sit elsewhere between the same clocks, where it adds the least road
 * (`rideSeatAfter`). Only the terminal moves, though. The stops keep the order they are
 * stored in, which is the order the road trip has always driven them in, and the
 * terminal is slotted in behind the stop that precedes it in the day plan's reading.
 * The one stop that moves is tonight's stay at the far end of such a ride, which waits
 * behind the landing (`staysBehindRides`).
 *
 * A ride that leaves and lands on the same day seats its arrival right behind its
 * departure: nothing is visited in between. One that lands on a later day seats the
 * arrival on that day, where it opens the drive. A hire car's pick-up opens the day the
 * same way when nothing timed comes before it, and its return closes the day it is
 * handed back on; the two are seated on their own, because the drive itself runs
 * between them.
 *
 * `orderIndex` is each stop's stored `order_index`, which is what a dragged position is
 * measured against; `clockOf` its time in minutes, or null.
 */
export function seatCarrierStops(
  dayId: number,
  stops: RoadtripStop[],
  orderIndex: number[],
  seams: CarrierSeam[],
): RoadtripStop[] {
  const departing = seams.filter((s) => s.departure.dayId === dayId);
  // A ride landing on the day it left seats its arrival behind its departure below. A
  // hire car handed back on the day it was picked up has two desks with nothing tying
  // them together, so both are seated on their own.
  const arriving = seams.filter(
    (s) => s.arrival?.dayId === dayId && (s.departure.dayId !== dayId || s.kind === 'rental'),
  );
  if (!departing.length && !arriving.length) return stops;
  // Tonight's stays that wait behind a ride are left out of the reading, so neither a
  // check-in nor the booking's slot puts them back ahead of it, and the ride is seated
  // among the other stops alone.
  const behind = staysBehindRides(
    stops,
    departing.filter((s) => s.kind === 'ride' && s.arrival?.dayId === dayId),
  );

  type Item =
    | { kind: 'stop'; index: number; key: number; minutes: number | null }
    | { kind: 'end'; seam: CarrierSeam; role: CarrierTerminal['role']; key: number; minutes: number | null };
  const base: Item[] = stops.flatMap((stop, index): Item[] =>
    behind.has(index)
      ? []
      : [
          {
            kind: 'stop',
            index,
            key: orderIndex[index] ?? index,
            minutes: parseClock(stop.time ?? stop.checkInTime ?? null),
          },
        ],
  );
  const ends: { seam: CarrierSeam; role: CarrierTerminal['role']; end: CarrierEnd }[] = [
    ...departing.map((seam) => ({ seam, role: rolesOf(seam).start, end: seam.departure })),
    ...arriving.map((seam) => ({ seam, role: rolesOf(seam).end, end: seam.arrival! })),
  ];
  const items: Item[] = [...base];
  const lastKey = base.length ? Math.max(...base.map((b) => b.key)) : 0;
  const firstKey = base.length ? Math.min(...base.map((b) => b.key)) : 0;
  // A terminal seated before is an item with a clock and no say in the geography: the
  // kilometres are the drive's between stops, and the terminal is not one of those yet.
  const seatItem = (item: Item): SeatItem => ({
    key: item.key,
    minutes: item.minutes,
    point: item.kind === 'stop' ? { lat: stops[item.index]!.lat, lng: stops[item.index]!.lng } : null,
  });
  ends
    .map((e) => ({ ...e, minutes: parseClock(e.end.clock) }))
    .sort((a, b) => (a.minutes ?? 0) - (b.minutes ?? 0))
    .forEach((e, ti) => {
      let key = e.end.position;
      if (key === null) {
        const minutes = e.minutes ?? 0;
        let after = -Infinity;
        for (const item of items)
          if (item.minutes !== null && item.minutes <= minutes) after = Math.max(after, item.key);
        // A ride that lands on the day it left goes where it adds the least road, as far
        // as the clock leaves a choice (`rideSeatAfter`), and the day plan seats it the
        // same way: behind the item that seat names, or ahead of every one.
        const ride = e.role === 'departure' ? sameDayRideOf(e.seam) : null;
        const seat = ride ? rideSeatAfter(items.map(seatItem), ride) : null;
        if (seat !== null) after = seat;
        // With no timed stop ahead of it, a departure closes the day, the way the day plan
        // lists it. An arrival that landed overnight OPENS the day it lands on: the day
        // plan happens to file it last there too, but read as a drive that puts the
        // morning's stops on the road before the traveller has landed.
        const opens = seat === -Infinity || opensTheDay(e.role);
        key =
          after === -Infinity
            ? opens
              ? firstKey - 0.5 - ti * 0.01
              : lastKey + 0.5 + ti * 0.01
            : after + 0.01 + ti * 0.001;
      }
      items.push({ kind: 'end', seam: e.seam, role: e.role, key, minutes: e.minutes });
    });
  items.sort((a, b) => a.key - b.key || (a.kind === 'stop' ? -1 : 1));
  // Untimed stops keep their place behind the timed item before them, as in the day plan.
  // An arrival opening the day is timed and first, so the untimed stops behind it follow
  // it rather than sorting ahead of it on a clock they never had.
  const read = chronoOrder(items, (item) => item.minutes);

  // Where each terminal lands: behind the stop before it in the day plan's reading, in
  // the stored order. Two terminals behind the same stop keep their reading order.
  const slots: { seam: CarrierSeam; role: CarrierTerminal['role']; after: number }[] = [];
  let lastStop = -1;
  for (const item of read) {
    if (item.kind === 'stop') lastStop = item.index;
    else slots.push({ seam: item.seam, role: item.role, after: lastStop });
  }
  // A stay waits behind the last of its rides to leave, on a day out and back the one home.
  const waiting = new Map<CarrierSeam, number[]>();
  for (const [index, rides] of behind) {
    const ride = slots.filter((s) => s.role === 'departure' && rides.includes(s.seam)).pop()!.seam;
    waiting.set(ride, [...(waiting.get(ride) ?? []), index]);
  }
  const out: RoadtripStop[] = [];
  const emit = (slot: (typeof slots)[number]): void => {
    // The index of the stored stop that follows the one the terminal is seated behind.
    const insertAt = slot.after + 1;
    out.push(terminalStop(slot.seam, slot.role, dayId, insertAt));
    if (slot.role === 'departure' && slot.seam.arrival?.dayId === dayId) {
      out.push(terminalStop(slot.seam, 'arrival', dayId, insertAt));
      for (const index of waiting.get(slot.seam) ?? []) out.push(reachedFrom(stops[index]!, slot.seam));
    }
  };
  for (const slot of slots.filter((s) => s.after < 0)) emit(slot);
  stops.forEach((stop, index) => {
    if (!behind.has(index)) out.push(stop);
    for (const slot of slots.filter((s) => s.after === index)) emit(slot);
  });
  return out;
}

/**
 * The ride between a departure terminal and its arrival, in the shape of a routed leg.
 *
 * Its mode is the booking's type, so every reader that tells driving from walking tells
 * a ride apart the same way. No line and no distance: the map draws the booking's own
 * arc for it, and the line here is what the corridor and the via points measure along,
 * which a flight is not. The minutes are what the chain needs.
 */
export function carrierLeg(from: RoadtripStop, to: RoadtripStop, minutes: number | null): RoutedLeg {
  const seconds = (minutes ?? 0) * 60;
  const a: [number, number] = [from.lat, from.lng];
  const b: [number, number] = [to.lat, to.lng];
  const durationText = minutes === null ? '' : formatDurationShort(seconds);
  return {
    seg: {
      from: a,
      to: b,
      mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
      distance: 0,
      duration: seconds,
      mode: from.carrier?.type ?? to.carrier?.type ?? 'flight',
      distanceText: '',
      durationText,
      drivingText: durationText,
      walkingText: durationText,
    },
    line: [],
    vias: [],
  };
}

/**
 * The seams a run of stops asks for, when the run is a ride and not a road: one leg per
 * consecutive pair, each the ride between them. Null for a run that is a road.
 */
export function carrierLegsFor(
  run: RoadtripStop[],
  mode: string,
  dayDelta: (from: RoadtripStop, to: RoadtripStop) => number,
  key: (from: RoadtripStop, to: RoadtripStop) => string,
): Record<string, RoutedLeg> | null {
  if (!isCarrierMode(mode)) return null;
  const legs: Record<string, RoutedLeg> = {};
  for (let i = 0; i < run.length - 1; i++) {
    const from = run[i]!;
    const to = run[i + 1]!;
    const minutes = rideMinutes(parseClock(from.carrier?.at), parseClock(to.carrier?.at), dayDelta(from, to));
    legs[key(from, to)] = carrierLeg(from, to, minutes);
  }
  return legs;
}

/**
 * The via points shaping the drive that leaves a stop. None leave a terminal or a booked
 * night at a day's edge: a via is filed by the position of a stored stop, and neither
 * stands in for one, so the points filed at its index belong to the stop that really has
 * that index.
 */
export function viasLeaving<V extends { day_id: number; after_order_index: number; sequence: number }>(
  stop: Pick<RoadtripStop, 'carrier' | 'bookend' | 'ownerDayId' | 'ownerIndex'>,
  vias: readonly V[],
): V[] {
  if (stop.carrier || stop.bookend) return [];
  return vias
    .filter((v) => v.day_id === stop.ownerDayId && v.after_order_index === stop.ownerIndex)
    .sort((a, b) => a.sequence - b.sequence);
}

/**
 * The via points shaping the drive from `from` to `to`.
 *
 * Those leaving `from`, unless the drive ends at a booked night's hotel. The points behind
 * a day's last stored stop shape the road from it into the next day (`carriedSeam`), and
 * with the night booked that road is no longer driven: the day ends at the hotel. Bent
 * through them, the drive to the hotel would run out along tomorrow's road and back. They
 * stay stored, and bend the road again once the day ends at its last stop.
 */
export function viasOnLeg<V extends { day_id: number; after_order_index: number; sequence: number }>(
  from: Pick<RoadtripStop, 'carrier' | 'bookend' | 'ownerDayId' | 'ownerIndex'>,
  to: Pick<RoadtripStop, 'bookend'>,
  vias: readonly V[],
): V[] {
  return to.bookend ? [] : viasLeaving(from, vias);
}

/**
 * The bookings whose ride the days draw, for the map to show their arcs beside the roads.
 * A hire car is left out: its line on the map is the road the drive already draws.
 */
export function carrierReservationIds(days: readonly { stops: readonly Pick<RoadtripStop, 'carrier'>[] }[]): number[] {
  const ids = new Set<number>();
  for (const day of days)
    for (const stop of day.stops)
      if (stop.carrier && isCarrierType(stop.carrier.type)) ids.add(stop.carrier.reservationId);
  return [...ids];
}

/** Whether a stop is where a hire car is picked up: the tank the drive goes on with is full. */
export function isPickupStop(stop: Pick<RoadtripStop, 'carrier'> | null | undefined): boolean {
  return stop?.carrier?.role === 'pickup';
}
