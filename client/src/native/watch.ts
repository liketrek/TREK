import type { Day, PackingItem, Place, Reservation, TodoItem, Trip } from '../types';
import { parseReservationMetadata } from '../utils/flightLegs';
import { splitReservationDateTime } from '../utils/formatters';
import { hasNativeFeature } from './capabilities';
import { isNativeIos } from './platform';
import { reportNativeFailure } from './reportFailure';
import { TrekShell } from './trekShell';
import { bookingKind, stopLook, upcomingReservations } from './widgetExtras';
import { RESERVATION_SYMBOLS, mergeByTime, minutesOf, type WidgetWeather } from './widgets';

/**
 * What the Apple Watch app shows (client/ios/App/TREKWatch), built from the
 * trips this device keeps offline, like the widgets' snapshot, and handed to
 * the app (TrekShell.setWatchSnapshot), which passes it on through
 * WatchConnectivity. The watch has no session of its own, so this carries the
 * whole trip it needs: every day with its stops and their coordinates, the
 * bookings with their reference, seat and platform, the packing list and the
 * to-dos with their ids. It carries data only; the watch says everything in its
 * own languages and formats the times itself.
 *
 * What the watch ticks off comes back as WatchActions (parseWatchActions) and
 * goes through the trip store's toggles, i.e. the repos and the mutation queue,
 * exactly as a tap in the app would. The Swift side of the shape is
 * client/ios/App/TREKWatchKit/WatchSnapshot.swift.
 */

interface WatchStop {
  name: string;
  /** Minutes after midnight, and the end when the stop has one. */
  minutes?: number;
  endMinutes?: number;
  symbol?: string;
  color?: string;
  address?: string;
  lat?: number;
  lng?: number;
  /** Set for a booking on the day's timeline: its kind (flight, hotel, ...). */
  booking?: string;
  note?: string;
}

interface WatchDay {
  /** yyyy-MM-dd; missing on a day without a date. */
  date?: string;
  /** 1-based position in the trip. */
  number: number;
  title?: string;
  stops: WatchStop[];
}

interface WatchPoint {
  name: string;
  code?: string;
  lat?: number;
  lng?: number;
}

interface WatchBooking {
  id: number;
  title: string;
  /** flight, train, bus, car, cruise, hotel, restaurant, event, tour, other */
  kind: string;
  confirmed: boolean;
  /** yyyy-MM-dd and HH:mm (24 hours) of the start, and of the end. */
  date?: string;
  time?: string;
  endDate?: string;
  endTime?: string;
  /** The IANA zone the start is local to, when the booking names one (a departure airport). */
  zone?: string;
  /** The zone the end is local to (the arrival airport), so a long flight lands at the right hour. */
  endZone?: string;
  from?: WatchPoint;
  to?: WatchPoint;
  /** The booking reference. */
  code?: string;
  /** "Lufthansa LH 716", "ICE 597". */
  carrier?: string;
  seat?: string;
  platform?: string;
  /** Where it is: the hotel, the restaurant's address. */
  location?: string;
  lat?: number;
  lng?: number;
  /** A stay's check-in and check-out times, HH:mm. */
  checkIn?: string;
  checkOut?: string;
}

interface WatchItem {
  id: number;
  name: string;
  done: boolean;
  /** The packing category or to-do category. */
  group?: string;
  /** yyyy-MM-dd */
  due?: string;
  /** 0 none ... 3 high. */
  priority?: number;
}

export interface WatchSnapshot {
  v: 1;
  /** When the phone built it, ISO 8601. */
  generatedAt: string;
  /** The user's clock in TREK's settings. */
  hour12: boolean;
  trip: {
    id: number;
    title: string;
    start: string;
    end: string;
    place?: string;
    /** The cover as a base64 JPEG; the app scales it down for the watch. */
    cover?: string;
  } | null;
  days: WatchDay[];
  bookings: WatchBooking[];
  weather?: WidgetWeather;
  packing?: { items: WatchItem[]; packed: number; total: number };
  todos?: { items: WatchItem[]; open: number; total: number };
  /** The ids of the watch's own actions this phone has applied, newest last. */
  applied: string[];
}

/** A tick from the watch: one packing item or to-do set done or not. */
interface WatchAction {
  id: string;
  tripId: number;
  list: 'packing' | 'todo';
  itemId: number;
  done: boolean;
}

const MAX_DAYS = 45;
const MAX_STOPS = 24;
const MAX_BOOKINGS = 12;
const MAX_NAME = 80;

const text = (value: string | null | undefined, max = MAX_NAME): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
};

const coordinate = (value: number | null | undefined): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 1e5) / 1e5 : undefined;

/** Leaves out what is undefined, so the JSON the watch gets stays small. */
function compact<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

function placeStop(a: NonNullable<Day['assignments']>[number]): WatchStop | null {
  const place = a.place;
  if (!place?.name) return null;
  const start = minutesOf(a.assignment_time ?? place.place_time);
  const end = minutesOf(a.assignment_end_time ?? place.end_time);
  const look = stopLook(place.category);
  return compact({
    name: place.name.slice(0, MAX_NAME),
    minutes: start ?? undefined,
    endMinutes: start != null && end != null && end > start ? end : undefined,
    symbol: look.symbol ?? undefined,
    color: look.color ?? undefined,
    address: text(place.address, 120),
    lat: coordinate(place.lat),
    lng: coordinate(place.lng),
    note: text(a.notes, 140),
  });
}

/** The trip's days in order, each with its stops and the timed bookings of its date merged in by time. */
export function watchDays(days: Day[], bookings: WatchBooking[]): WatchDay[] {
  return [...days]
    .sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0))
    .slice(0, MAX_DAYS)
    .map((day, index) => {
      const date = day.date ? day.date.slice(0, 10) : undefined;
      const stops = [...(day.assignments ?? [])]
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
        .map(placeStop)
        .filter((s): s is WatchStop => s !== null);
      const booked = date
        ? bookings
            .filter((b) => b.date === date && b.time)
            .map((b) =>
              compact<WatchStop>({
                name: b.title,
                minutes: minutesOf(b.time) ?? undefined,
                symbol: RESERVATION_SYMBOLS[b.kind] ?? 'bookmark.fill',
                booking: b.kind,
                address: b.from?.name ?? b.location,
                lat: b.from?.lat ?? b.lat,
                lng: b.from?.lng ?? b.lng,
              })
            )
        : [];
      return compact({
        date,
        number: index + 1,
        title: text(day.title),
        stops: mergeByTime(stops, booked).slice(0, MAX_STOPS),
      });
    });
}

function point(e: NonNullable<Reservation['endpoints']>[number] | undefined): WatchPoint | undefined {
  if (!e) return undefined;
  return compact({
    name: e.name.slice(0, MAX_NAME),
    code: text(e.code, 8),
    lat: coordinate(e.lat),
    lng: coordinate(e.lng),
  });
}

/** "Lufthansa LH 716" from the flight's airline and number, "ICE 597" from a train's. */
function carrierOf(meta: Record<string, unknown>): string | undefined {
  const str = (key: string) => (typeof meta[key] === 'string' ? (meta[key] as string).trim() : '');
  const number = str('flight_number') || str('train_number');
  const joined = [str('airline'), number].filter(Boolean).join(' ');
  return text(joined, 40);
}

type PlaceLookup = Map<number, Pick<Place, 'lat' | 'lng' | 'address'>>;

const metaText = (meta: Record<string, unknown>, key: string, max = 20) =>
  typeof meta[key] === 'string' ? text(meta[key] as string, max) : undefined;

/** Where a booking is: its hotel or place with coordinates, else what its location field says. */
function whereOf(r: Reservation, places: PlaceLookup): Pick<WatchBooking, 'location' | 'lat' | 'lng'> {
  const placeId = r.accommodation_place_id ?? r.place_id;
  const place = placeId == null ? undefined : places.get(placeId);
  const named = r.accommodation_name || r.location || r.place_name;
  return { location: text(named || place?.address), lat: coordinate(place?.lat), lng: coordinate(place?.lng) };
}

/** When a booking starts and ends; a stay without times of its own takes its check-in and check-out. */
function timesOf(
  r: Reservation,
  start: { day: string | null; time: string | null },
  meta: Record<string, unknown>,
  dayDates: Map<number, string>
): Pick<WatchBooking, 'date' | 'time' | 'endDate' | 'endTime'> {
  const end = splitReservationDateTime(r.reservation_end_time);
  const endDay = r.end_day_id == null ? undefined : dayDates.get(r.end_day_id);
  return {
    date: start.day ?? undefined,
    time: start.time ?? metaText(meta, 'check_in_time'),
    endDate: end.date ?? endDay,
    endTime: end.time ?? metaText(meta, 'check_out_time'),
  };
}

/** A booking with what the watch shows of it: the reference, seat, platform, both ends and where to go. */
export function watchBooking(
  r: Reservation,
  start: { day: string | null; time: string | null },
  { dayDates, places }: { dayDates: Map<number, string>; places: PlaceLookup }
): WatchBooking {
  const meta = parseReservationMetadata(r);
  const legs = [...(r.endpoints ?? [])].sort((a, b) => a.sequence - b.sequence);
  const from = legs.find((e) => e.role === 'from');
  const to = [...legs].reverse().find((e) => e.role === 'to');
  return compact({
    id: r.id,
    title: r.title.slice(0, MAX_NAME),
    kind: bookingKind(r.type),
    confirmed: r.status === 'confirmed',
    ...timesOf(r, start, meta, dayDates),
    zone: text(from?.timezone || metaText(meta, 'departure_timezone', 40), 40),
    endZone: text(to?.timezone || metaText(meta, 'arrival_timezone', 40), 40),
    from: point(from),
    to: point(to),
    code: text(r.confirmation_number, 40),
    carrier: carrierOf(meta),
    seat: metaText(meta, 'seat'),
    platform: metaText(meta, 'platform'),
    ...whereOf(r, places),
    checkIn: metaText(meta, 'check_in_time'),
    checkOut: metaText(meta, 'check_out_time'),
  });
}

/** The packing list, items still to pack first, each group in the list's order. */
export function watchPacking(items: PackingItem[]): WatchSnapshot['packing'] {
  if (items.length === 0) return undefined;
  const sorted = [...items].sort((a, b) => Number(!!a.checked) - Number(!!b.checked) || a.sort_order - b.sort_order);
  return {
    items: sorted.map((i) =>
      compact({ id: i.id, name: i.name.slice(0, MAX_NAME), done: !!i.checked, group: text(i.category, 40) })
    ),
    packed: items.filter((i) => i.checked).length,
    total: items.length,
  };
}

/** The to-dos, open ones first by due date (undated last) and priority, then the done ones. */
export function watchTodos(items: TodoItem[]): WatchSnapshot['todos'] {
  if (items.length === 0) return undefined;
  const rank = (i: TodoItem) => [i.checked ? 1 : 0, i.due_date ? 0 : 1] as const;
  const sorted = [...items].sort((a, b) => {
    const [doneA, undatedA] = rank(a);
    const [doneB, undatedB] = rank(b);
    if (doneA !== doneB) return doneA - doneB;
    if (undatedA !== undatedB) return undatedA - undatedB;
    if (a.due_date && b.due_date && a.due_date !== b.due_date) return a.due_date.localeCompare(b.due_date);
    return (b.priority ?? 0) - (a.priority ?? 0) || (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
  return {
    items: sorted.map((i) =>
      compact({
        id: i.id,
        name: i.name.slice(0, MAX_NAME),
        done: !!i.checked,
        group: text(i.category, 40),
        due: i.due_date ? i.due_date.slice(0, 10) : undefined,
        priority: i.priority ? Math.max(0, Math.min(3, i.priority)) : undefined,
      })
    ),
    open: items.filter((i) => !i.checked).length,
    total: items.length,
  };
}

interface WatchSources {
  trip: Trip | null;
  days: Day[];
  places: Place[];
  reservations: Reservation[];
  packing: PackingItem[];
  todos: TodoItem[];
  today: string;
  hour12: boolean;
  place?: string | null;
  cover?: string | null;
  weather?: WidgetWeather | null;
  applied?: string[];
  now?: Date;
}

export function buildWatchSnapshot(src: WatchSources): WatchSnapshot {
  const { trip } = src;
  const base = {
    v: 1 as const,
    generatedAt: (src.now ?? new Date()).toISOString(),
    hour12: src.hour12,
    applied: src.applied ?? [],
  };
  if (!trip) return { ...base, trip: null, days: [], bookings: [] };
  const dayDates = new Map(src.days.map((d) => [d.id, (d.date ?? '').slice(0, 10)]));
  const places = new Map(src.places.map((p) => [p.id, p]));
  const dated = upcomingReservations(src.reservations, { dayDates, today: src.today, running: true });
  const bookings = dated.map(({ r, day, time }) => watchBooking(r, { day, time }, { dayDates, places }));
  // The days get every booking of their date; the list only the ones ahead.
  const all = upcomingReservations(src.reservations, { dayDates, today: '0000-00-00' }).map(({ r, day, time }) =>
    watchBooking(r, { day, time }, { dayDates, places })
  );
  return compact({
    ...base,
    trip: compact({
      id: trip.id,
      title: trip.title,
      start: trip.start_date ?? '',
      end: trip.end_date ?? '',
      place: text(src.place),
      cover: src.cover ?? undefined,
    }),
    days: watchDays(src.days, all),
    bookings: bookings.slice(0, MAX_BOOKINGS),
    weather: src.weather ?? undefined,
    packing: watchPacking(src.packing),
    todos: watchTodos(src.todos),
  });
}

const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).length;

/**
 * The snapshot cut down to `max` bytes of JSON, for WatchConnectivity's
 * payload limit: first the cover goes (the app adds a small one back itself
 * when it fits), then the done to-dos and packed items, then the lists are
 * halved, then the days far from today.
 */
export function fitWatchSnapshot(snapshot: WatchSnapshot, max = 48_000): WatchSnapshot {
  let fitted = snapshot;
  const steps: ((s: WatchSnapshot) => WatchSnapshot)[] = [
    (s) => (s.trip?.cover ? { ...s, trip: { ...s.trip, cover: undefined } } : s),
    (s) => ({
      ...s,
      packing: s.packing && { ...s.packing, items: s.packing.items.filter((i) => !i.done) },
      todos: s.todos && { ...s.todos, items: s.todos.items.filter((i) => !i.done) },
    }),
    ...[0, 1, 2, 3].map(() => (s: WatchSnapshot) => ({
      ...s,
      packing: s.packing && { ...s.packing, items: s.packing.items.slice(0, Math.ceil(s.packing.items.length / 2)) },
      todos: s.todos && { ...s.todos, items: s.todos.items.slice(0, Math.ceil(s.todos.items.length / 2)) },
    })),
    (s) => ({
      ...s,
      days: s.days.map((d) => ({ ...d, stops: d.stops.map((stop) => ({ ...stop, note: undefined })) })),
    }),
    (s) => ({ ...s, days: s.days.slice(0, 14) }),
  ];
  for (const step of steps) {
    if (bytes(fitted) <= max) break;
    fitted = step(fitted);
  }
  return fitted;
}

export function watchActive(): boolean {
  return isNativeIos() && hasNativeFeature('watch');
}

export async function publishWatch(snapshot: WatchSnapshot): Promise<void> {
  if (!watchActive()) return;
  await TrekShell.setWatchSnapshot({ json: JSON.stringify(fitWatchSnapshot(snapshot)) }).catch(reportNativeFailure);
}

/** The actions the watch queued, as the app hands them over; anything malformed is dropped. */
export function parseWatchActions(raw: unknown): WatchAction[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry): WatchAction[] => {
    if (typeof entry !== 'object' || entry === null) return [];
    const { id, tripId, list, itemId, done } = entry as Record<string, unknown>;
    const valid =
      typeof id === 'string' &&
      id.length > 0 &&
      id.length <= 64 &&
      Number.isInteger(tripId) &&
      (list === 'packing' || list === 'todo') &&
      Number.isInteger(itemId) &&
      typeof done === 'boolean';
    return valid ? [{ id, tripId: tripId as number, list, itemId: itemId as number, done }] : [];
  });
}

interface WatchToggles {
  packing: (tripId: number, id: number, done: boolean) => Promise<void>;
  todo: (tripId: number, id: number, done: boolean) => Promise<void>;
}

/**
 * Applies the watch's ticks in the order they were made, through the given
 * toggles (the trip store's, which write through the repos and the mutation
 * queue). Answers the ids it applied; a tick whose write failed is applied too,
 * as the toggle has already rolled it back and told the user.
 */
export async function applyWatchActions(actions: WatchAction[], toggles: WatchToggles): Promise<string[]> {
  const applied: string[] = [];
  for (const action of actions) {
    try {
      await toggles[action.list](action.tripId, action.itemId, action.done);
    } catch (err: unknown) {
      reportNativeFailure(err);
    }
    applied.push(action.id);
  }
  return applied;
}

/** Takes the ticks the watch sent while the UI was not running, and with them the ones just arriving. */
export async function takeWatchActions(): Promise<WatchAction[]> {
  if (!watchActive()) return [];
  try {
    const { actions } = await TrekShell.takeWatchActions();
    return parseWatchActions(actions);
  } catch (err: unknown) {
    reportNativeFailure(err);
    return [];
  }
}
