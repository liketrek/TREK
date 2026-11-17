import type { Day, Reservation, Trip } from '../types';
import { getFlightLegs, getTrainLegs, usesStationRoute } from '../utils/flightLegs';
import { splitReservationDateTime } from '../utils/formatters';
import { heroTrip, sortTripsByRelevance } from '../utils/heroTrip';
import { hasNativeFeature } from './capabilities';
import { isNativeApp } from './platform';
import { reportNativeFailure } from './reportFailure';
import { TrekShell } from './trekShell';
import { stopLook, type WidgetBooking, type WidgetPacking, type WidgetTodos } from './widgetExtras';
import type { WidgetFlight } from './widgetFlight';
import type { WidgetAtlas, WidgetCollab, WidgetPackingDetail } from './widgetOnline';

/**
 * What the home-screen widgets and the travel-day Live Activity show, built from
 * the trips this device keeps offline (db/offlineDb) and handed to the app
 * (TrekShell.setWidgetSnapshot, syncTripDay). The texts go along translated, so
 * the widgets speak the app's language without localising anything themselves.
 * Everything past trip, today and the first six labels is optional on the Swift
 * side (client/ios/App/TREKWidgets/WidgetSnapshot.swift), so an older app
 * binary ignores it and a newer one copes without it.
 */
export interface WidgetLabels {
  nextTrip: string;
  today: string;
  noTrip: string;
  /** Contains "{n}". */
  inDays: string;
  tomorrow: string;
  nothingPlanned: string;
  days?: string;
  bookings?: string;
  noBookings?: string;
  todos?: string;
  noTodos?: string;
  packing?: string;
  confirmed?: string;
  pending?: string;
  todayShort?: string;
  tomorrowShort?: string;
  now?: string;
  places?: string;
  travellers?: string;
  allDone?: string;
  missing?: string;
  countries?: string;
  world?: string;
  group?: string;
  poll?: string;
  votes?: string;
  noMessages?: string;
  departure?: string;
  /** The flight widget: its title and the words around the moment. */
  flight?: string;
  /** Contains "{time}", where the widget puts its own running countdown. */
  flightDeparts?: string;
  flightInAir?: string;
  /** Contains "{time}". */
  flightLands?: string;
  flightLanded?: string;
  flightOnTime?: string;
  /** Contains "{m}". */
  flightLate?: string;
  /** Contains "{m}". */
  flightEarly?: string;
  flightEstimated?: string;
  /** Past the departure time with the aircraft not yet in the air. */
  flightReady?: string;
  noFlight?: string;
  /** Android, which has no running countdown text: "{d} d {h} h", "{h} h {m} min", "{m} min". */
  durDaysHours?: string;
  durHoursMinutes?: string;
  durMinutes?: string;
}

interface WidgetStop {
  time: string | null;
  name: string;
  /** Minutes after midnight, for picking the next stop and the widget's now line. */
  minutes: number | null;
  color?: string | null;
  symbol?: string | null;
  /** Minutes after midnight it ends, past midnight as 1440: a flight in the air is not done yet. */
  endMinutes?: number | null;
}

interface SnapshotStop {
  time: string | null;
  name: string;
  minutes?: number;
  color?: string;
  symbol?: string;
}

export interface WidgetSnapshot {
  trip: {
    title: string;
    start: string;
    end: string;
    path: string;
    place?: string;
    /** A small JPEG of the cover, base64. */
    cover?: string;
    dayCount?: number;
    placeCount?: number;
    memberCount?: number;
  } | null;
  today: { dayLabel: string; stops: SnapshotStop[]; index?: number; total?: number } | null;
  weather?: WidgetWeather;
  bookings?: WidgetBooking[];
  todos?: WidgetTodos;
  packing?: WidgetPacking & Partial<WidgetPackingDetail>;
  atlas?: WidgetAtlas;
  collab?: WidgetCollab;
  flight?: WidgetFlight;
  labels: WidgetLabels;
}

export interface WidgetWeather {
  temp: number;
  high?: number;
  low?: number;
  /** The provider's main condition ("Clear", "Rain", ...), which the widget turns into a symbol. */
  main: string;
  label: string;
  place?: string;
  /** Chance of rain in percent. */
  rain?: number;
}

/** What goes along with the trip beyond its day; each part optional. */
interface SnapshotExtras {
  place?: string | null;
  cover?: string | null;
  placeCount?: number;
  memberCount?: number;
  weather?: WidgetWeather | null;
  bookings?: WidgetBooking[];
  todos?: WidgetTodos;
  packing?: (WidgetPacking & Partial<WidgetPackingDetail>) | null;
  atlas?: WidgetAtlas | null;
  collab?: WidgetCollab | null;
  flight?: WidgetFlight;
}

export interface TripDay {
  tripTitle: string;
  path: string;
  dayLabel: string;
  stops: WidgetStop[];
  /** The day's id, which the legs of a multi-leg booking name. */
  dayId?: number;
  /** 1-based position of the day in the trip, and the trip's day count. */
  index?: number;
  total?: number;
}

/** iOS (WidgetKit) and Android (Glance) read the same snapshot. */
export function widgetsActive(): boolean {
  return isNativeApp() && hasNativeFeature('widgets');
}

export function minutesOf(time: string | null | undefined): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(time ?? '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/**
 * The trip the dashboard's hero features (utils/heroTrip.ts): the running one,
 * else the next to start, so the widgets show the trip the app opens on.
 * Archived trips are not candidates, as on the dashboard.
 */
export function pickTrip(trips: Trip[], today: string): Trip | null {
  const active = trips.filter((t) => !t.is_archived);
  return heroTrip(sortTripsByRelevance(active, today), today);
}

/**
 * The trips a widget can be set to in Edit Widget: the ones running or coming
 * up, in the dashboard's order (so the hero's trip comes first), at most `limit`,
 * each of which gets a snapshot of its own.
 */
export function widgetTripChoices(trips: Trip[], today: string, limit = 6): Trip[] {
  const ahead = trips.filter((t) => !t.is_archived && t.start_date && (t.end_date ?? t.start_date) >= today);
  return sortTripsByRelevance(ahead, today).slice(0, limit);
}

/** The symbols of the booking kinds a day's timeline shows next to its stops. */
export const RESERVATION_SYMBOLS: Record<string, string> = {
  flight: 'airplane',
  train: 'tram.fill',
  bus: 'bus.fill',
  car: 'car.fill',
  cruise: 'ferry.fill',
  ferry: 'ferry.fill',
  hotel: 'bed.double.fill',
  restaurant: 'fork.knife',
  event: 'ticket.fill',
  tour: 'figure.hiking',
};

/** Puts each timed booking before the first stop that comes later; untimed stops keep their place. */
export function mergeByTime<T extends { minutes?: number | null }>(stops: T[], booked: T[]): T[] {
  const out = [...stops];
  for (const b of [...booked].sort((x, y) => (x.minutes ?? 0) - (y.minutes ?? 0))) {
    const at = out.findIndex((s) => s.minutes != null && s.minutes > (b.minutes ?? 0));
    if (at < 0) out.push(b);
    else out.splice(at, 0, b);
  }
  return out;
}

/** Today's day of the trip with its stops in plan order, if the trip runs today. */
export function todayOf(
  trip: Trip,
  days: Day[],
  today: string,
  dayLabel: (index: number, total: number) => string,
  formatTime: (time: string) => string
): TripDay | null {
  const ordered = days.filter((d) => d.trip_id === trip.id).sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0));
  const index = ordered.findIndex((d) => (d.date ?? '').slice(0, 10) === today);
  if (index < 0) return null;
  const day = ordered[index];
  const stops = [...(day.assignments ?? [])]
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .flatMap((a): WidgetStop[] =>
      a.place?.name
        ? [
            {
              name: a.place.name,
              time: a.place.place_time ? formatTime(a.place.place_time.slice(0, 5)) : null,
              minutes: minutesOf(a.place.place_time),
              ...stopLook(a.place.category),
            },
          ]
        : []
    );
  return {
    tripTitle: trip.title,
    path: `/trips/${trip.id}`,
    dayLabel: dayLabel(index + 1, ordered.length),
    stops,
    dayId: day.id,
    index: index + 1,
    total: ordered.length,
  };
}

/** The day with its timed bookings (a flight, the table tonight) joined to the stops in time order. */
export function withBookings(
  day: TripDay,
  reservations: Reservation[],
  today: string,
  formatTime: (time: string) => string
): TripDay {
  const booked = reservations.flatMap((r): WidgetStop[] => {
    if (r.status === 'cancelled') return [];
    const symbol = RESERVATION_SYMBOLS[r.type] ?? 'bookmark.fill';
    // A booking with stopovers is a stop per leg, as the planner shows it: one
    // stop at the first departure counted the day done while legs were ahead.
    const legs = r.type === 'flight' ? getFlightLegs(r) : usesStationRoute(r.type) ? getTrainLegs(r) : [];
    if (legs.length > 1 && day.dayId != null && legs.every((l) => l.dep_day_id != null)) {
      return legs.flatMap((leg): WidgetStop[] => {
        if (leg.dep_day_id !== day.dayId || !leg.dep_time) return [];
        return [
          {
            name: leg.from && leg.to ? `${leg.from} → ${leg.to}` : r.title,
            time: formatTime(leg.dep_time),
            minutes: minutesOf(leg.dep_time),
            // A leg without an arrival day lands on the day it leaves, as the planner reads it.
            endMinutes: (leg.arr_day_id ?? leg.dep_day_id) === day.dayId ? minutesOf(leg.arr_time) : 24 * 60,
            color: null,
            symbol,
          },
        ];
      });
    }
    const { date, time } = splitReservationDateTime(r.reservation_time);
    if (!time || date !== today) return [];
    const end = splitReservationDateTime(r.reservation_end_time);
    return [
      {
        name: r.title,
        time: formatTime(time),
        minutes: minutesOf(time),
        endMinutes: !end.time ? null : end.date && end.date !== today ? 24 * 60 : minutesOf(end.time),
        color: null,
        symbol,
      },
    ];
  });
  return booked.length ? { ...day, stops: mergeByTime(day.stops, booked) } : day;
}

/** A stop as the widget gets it: the empty fields left out rather than sent as null. */
function snapshotStop({ time, name, minutes, color, symbol }: WidgetStop): SnapshotStop {
  return {
    time,
    name,
    ...(minutes != null ? { minutes } : {}),
    ...(color ? { color } : {}),
    ...(symbol ? { symbol } : {}),
  };
}

export function buildSnapshot(
  trip: Trip | null,
  day: TripDay | null,
  labels: WidgetLabels,
  extras: SnapshotExtras = {}
): WidgetSnapshot {
  const snapshot: WidgetSnapshot = {
    trip: trip
      ? {
          title: trip.title,
          start: trip.start_date ?? '',
          end: trip.end_date ?? '',
          path: `/trips/${trip.id}`,
          ...(extras.place ? { place: extras.place } : {}),
          ...(extras.cover ? { cover: extras.cover } : {}),
          ...(trip.day_count ? { dayCount: trip.day_count } : {}),
          ...(extras.placeCount ? { placeCount: extras.placeCount } : {}),
          ...(extras.memberCount ? { memberCount: extras.memberCount } : {}),
        }
      : null,
    today: day
      ? {
          dayLabel: day.dayLabel,
          stops: day.stops.map(snapshotStop),
          ...(day.index ? { index: day.index, total: day.total } : {}),
        }
      : null,
    labels,
  };
  if (extras.weather) snapshot.weather = extras.weather;
  if (extras.bookings) snapshot.bookings = extras.bookings;
  if (extras.todos) snapshot.todos = extras.todos;
  if (extras.packing) snapshot.packing = extras.packing;
  if (extras.atlas) snapshot.atlas = extras.atlas;
  if (extras.collab) snapshot.collab = extras.collab;
  if (extras.flight) snapshot.flight = extras.flight;
  return snapshot;
}

/** What the Live Activity (iOS) and the Live Update (Android) show of the travel day. */
interface TripDayState {
  tripTitle: string;
  path: string;
  dayLabel: string;
  nextName: string;
  nextTime?: string;
  /** Android: minutes after midnight of the next stop, for the countdown. */
  nextMinutes?: number;
  /** Android: the colour of each timed stop, for the progress segments. */
  colors?: (string | null)[];
  done: number;
  total: number;
  /** iOS: the day's flight while it is near or in the air, drawn as a boarding pass. */
  flight?: LiveFlight;
}

/** The flight a Live Activity follows: times in epoch seconds, the clocks formatted. */
interface LiveFlight {
  number: string;
  from: string;
  to: string;
  dep: number;
  arr: number;
  depTime: string;
  arrTime: string;
  delay?: number;
  /** In the air when the app last looked: the countdown then runs to touchdown. */
  airborne?: boolean;
}

/** From three hours before take-off until an hour after touchdown the activity is about the flight. */
export function liveFlightOf(flight: WidgetFlight | undefined, nowSeconds: number): LiveFlight | undefined {
  if (!flight || flight.landed) return undefined;
  const dep = flight.depActual ?? flight.depExpected ?? flight.dep;
  const arr = flight.arrExpected ?? flight.arr;
  if (nowSeconds < dep - 3 * 3600 || nowSeconds > arr + 3600) return undefined;
  return {
    number: flight.number,
    from: flight.from,
    to: flight.to,
    dep,
    arr,
    depTime: flight.depTime,
    arrTime: flight.arrTimeExpected ?? flight.arrTime,
    ...(flight.delay != null ? { delay: flight.delay } : {}),
    ...(flight.airborne ? { airborne: true } : {}),
  };
}

/**
 * The Live Activity's state: the first stop still ahead or still under way (a
 * flight in the air until it lands), else the last.
 */
export function tripDayState(day: TripDay, nowMinutes: number, allDone: string): TripDayState {
  const timed = day.stops.filter((s) => s.minutes != null);
  const nextIndex = day.stops.findIndex(
    (s) => s.minutes != null && (s.minutes >= nowMinutes || (s.endMinutes != null && s.endMinutes > nowMinutes))
  );
  const done = nextIndex < 0 ? timed.length : day.stops.slice(0, nextIndex).filter((s) => s.minutes != null).length;
  const next = nextIndex >= 0 ? day.stops[nextIndex] : null;
  return {
    tripTitle: day.tripTitle,
    path: day.path,
    dayLabel: day.dayLabel,
    nextName: next?.name ?? allDone,
    nextTime: next?.time ?? undefined,
    // Android's Live Update counts down to the next stop and colours a segment per stop.
    nextMinutes: next?.minutes ?? undefined,
    colors: day.stops.filter((s) => s.minutes != null).map((s) => s.color ?? null),
    done,
    total: timed.length,
  };
}

/** How long before the day's first timed stop its Live Activity appears. */
const LIVE_LEAD_MINUTES = 3 * 60;

/**
 * Whether the travel day's Live Activity belongs on the lock screen now: from
 * three hours before the first stop with a time, then until the day is done. A
 * day whose first stop is an evening flight does not hold the lock screen from
 * the morning on.
 */
export function liveDayDue(day: TripDay, nowMinutes: number): boolean {
  const first = day.stops.reduce<number | null>(
    (min, s) => (s.minutes != null && (min === null || s.minutes < min) ? s.minutes : min),
    null
  );
  return first !== null && nowMinutes >= first - LIVE_LEAD_MINUTES;
}

/** A trip a widget can be set to in Edit Widget, and its snapshot. */
export interface TripWidgetSnapshot {
  id: number;
  title: string;
  start: string;
  end: string;
  snapshot: WidgetSnapshot;
}

export async function publishWidgets(
  snapshot: WidgetSnapshot,
  liveDay: TripDayState | null,
  trips: TripWidgetSnapshot[] = []
): Promise<void> {
  if (!widgetsActive()) return;
  await TrekShell.setWidgetSnapshot({ json: JSON.stringify(snapshot) }).catch(reportNativeFailure);
  // An app binary without widgetTrips would take every one of these for the dashboard's snapshot.
  if (hasNativeFeature('widgetTrips')) {
    for (const trip of trips) {
      await TrekShell.setWidgetSnapshot({ json: JSON.stringify(trip.snapshot), key: `trip.${trip.id}` }).catch(
        reportNativeFailure
      );
    }
    const index = trips.map(({ id, title, start, end }) => ({ id, title, start, end }));
    await TrekShell.setWidgetSnapshot({ json: JSON.stringify(index), key: 'trips' }).catch(reportNativeFailure);
  }
  if (!hasNativeFeature('liveActivity')) return;
  if (liveDay && liveDay.total > 0) await TrekShell.syncTripDay(liveDay).catch(reportNativeFailure);
  else await TrekShell.endTripDay().catch(reportNativeFailure);
}
