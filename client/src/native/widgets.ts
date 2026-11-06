import type { Day, Reservation, Trip } from '../types';
import { splitReservationDateTime } from '../utils/formatters';
import { heroTrip, sortTripsByRelevance } from '../utils/heroTrip';
import { hasNativeFeature } from './capabilities';
import { isNativeIos } from './platform';
import { reportNativeFailure } from './reportFailure';
import { TrekShell } from './trekShell';
import { stopLook, type WidgetBooking, type WidgetPacking, type WidgetTodos } from './widgetExtras';
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
}

interface WidgetStop {
  time: string | null;
  name: string;
  /** Minutes after midnight, for picking the next stop and the widget's now line. */
  minutes: number | null;
  color?: string | null;
  symbol?: string | null;
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
}

export interface TripDay {
  tripTitle: string;
  path: string;
  dayLabel: string;
  stops: WidgetStop[];
  /** 1-based position of the day in the trip, and the trip's day count. */
  index?: number;
  total?: number;
}

export function widgetsActive(): boolean {
  return isNativeIos() && hasNativeFeature('widgets');
}

function minutesOf(time: string | null | undefined): number | null {
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

/** The symbols of the booking kinds a day's timeline shows next to its stops. */
const RESERVATION_SYMBOLS: Record<string, string> = {
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
function mergeByTime(stops: WidgetStop[], booked: WidgetStop[]): WidgetStop[] {
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
    const { date, time } = splitReservationDateTime(r.reservation_time);
    if (r.status === 'cancelled' || !time || date !== today) return [];
    return [
      {
        name: r.title,
        time: formatTime(time),
        minutes: minutesOf(time),
        color: null,
        symbol: RESERVATION_SYMBOLS[r.type] ?? 'bookmark.fill',
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
  return snapshot;
}

/** The Live Activity's state: the first stop whose time is still ahead, else the last. */
export function tripDayState(day: TripDay, nowMinutes: number, allDone: string) {
  const timed = day.stops.filter((s) => s.minutes != null);
  const nextIndex = day.stops.findIndex((s) => s.minutes != null && s.minutes >= nowMinutes);
  const done = nextIndex < 0 ? timed.length : day.stops.slice(0, nextIndex).filter((s) => s.minutes != null).length;
  const next = nextIndex >= 0 ? day.stops[nextIndex] : null;
  return {
    tripTitle: day.tripTitle,
    path: day.path,
    dayLabel: day.dayLabel,
    nextName: next?.name ?? allDone,
    nextTime: next?.time ?? undefined,
    done,
    total: timed.length,
  };
}

export async function publishWidgets(
  snapshot: WidgetSnapshot,
  liveDay: ReturnType<typeof tripDayState> | null
): Promise<void> {
  if (!widgetsActive()) return;
  await TrekShell.setWidgetSnapshot({ json: JSON.stringify(snapshot) }).catch(reportNativeFailure);
  if (!hasNativeFeature('liveActivity')) return;
  if (liveDay && liveDay.total > 0) await TrekShell.syncTripDay(liveDay).catch(reportNativeFailure);
  else await TrekShell.endTripDay().catch(reportNativeFailure);
}
