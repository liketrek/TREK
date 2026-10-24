import { parsePlaceHours, type PlaceHoursDay } from '../place/place-hours';

/**
 * CW-02, CW-04: a city walk's arrivals at its stops and what their opening
 * hours say about them on one day, worked out the same in the app and on the
 * server.
 *
 * TREK keeps no time zone on a trip or a day: a start time, an arrival and
 * opening hours are all the wall clock where the walk takes place, so they are
 * compared as they are written. An arrival needs a date and a start time; one
 * at or after midnight is not checked against the next day.
 *
 * Hours come from the trip place a stop stands for (its own entry, seven days
 * from Monday) or from OpenStreetMap, read only in its plain forms
 * ("Mo-Fr 09:00-18:00; Sa 10:00-14:00; Su off", "24/7"). Anything else stays
 * unread rather than guessed, and a stop without hours is unknown, never open.
 */

const DAY_MINUTES = 24 * 60;
const OSM_DAYS: readonly string[] = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const CLOCK = /^(\d{1,2}):(\d{2})(?::\d{2})?$/;
const MERIDIEM = /^(\d{1,2})(?::(\d{2}))?\s?([AaPp])[Mm]$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A span a place is open, in minutes after midnight; the end may be 1440, midnight. */
export type HoursWindow = readonly [number, number];

/** Where a stop's hours come from: OpenStreetMap, or the trip place's own entry. */
export type HoursSource = 'osm' | 'place';

/**
 * A stop's hours on one date: its open windows (none when closed all day), or
 * text that could not be read. `continues` says the last window, ending at
 * midnight, runs on into the next date, as it does around the clock or for a
 * night past midnight; a place closing at midnight does not.
 */
export type StationHours =
  { source: HoursSource; windows: readonly HoursWindow[]; continues: boolean } | { source: 'osm'; unread: string };

function clockMinutes(hours: number, minutes: number): number | null {
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}

/** Minutes after midnight of a time as TREK stores it (`H:mm`, `HH:mm`, `HH:mm:ss`) or typed in 12 hours (`9:30 PM`). */
export function minutesOf(time: string | null | undefined): number | null {
  const text = (time ?? '').trim();
  const clock = CLOCK.exec(text);
  if (clock) return clockMinutes(Number(clock[1]), Number(clock[2]));
  const meridiem = MERIDIEM.exec(text);
  if (!meridiem) return null;
  const hours = Number(meridiem[1]);
  if (hours < 1 || hours > 12) return null;
  const afternoon = meridiem[3]?.toLowerCase() === 'p';
  return clockMinutes((hours % 12) + (afternoon ? 12 : 0), Number(meridiem[2] ?? 0));
}

/** `HH:MM` of minutes after midnight, wrapping round a day. */
export function clockOf(minutes: number): string {
  const day = ((Math.round(minutes) % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  return `${String(Math.floor(day / 60)).padStart(2, '0')}:${String(day % 60).padStart(2, '0')}`;
}

/** Monday 0 to Sunday 6, of a `YYYY-MM-DD` date read as a calendar day. */
function weekdayOf(date: string): number | null {
  const match = ISO_DATE.exec(date);
  if (!match) return null;
  const month = Number(match[2]) - 1;
  const dayOfMonth = Number(match[3]);
  const day = new Date(Date.UTC(Number(match[1]), month, dayOfMonth));
  // A date that does not exist, such as 2026-02-31, would roll over into the next month.
  if (day.getUTCMonth() !== month || day.getUTCDate() !== dayOfMonth) return null;
  return (day.getUTCDay() + 6) % 7;
}

/** The weekdays of an OpenStreetMap day list such as `Mo-Fr,Su`; a range may wrap round the week (`Sa-Mo`). */
function daysOf(spec: string): Set<number> | null {
  const days = new Set<number>();
  for (const part of spec.split(',')) {
    const [from = '', to, ...rest] = part.split('-');
    const start = OSM_DAYS.indexOf(from);
    const end = to === undefined ? start : OSM_DAYS.indexOf(to);
    if (start < 0 || end < 0 || rest.length > 0) return null;
    for (let day = start; ; day = (day + 1) % 7) {
      days.add(day);
      if (day === end) break;
    }
  }
  return days;
}

/** The spans of a rule such as `09:00-12:00,13:00-18:00`; null where one is not a plain span within the day. */
function spansOf(times: string): HoursWindow[] | null {
  const windows: HoursWindow[] = [];
  for (const span of times.split(',')) {
    const [open, close, ...rest] = span.trim().split('-');
    const from = minutesOf(open);
    const to = close === '24:00' ? DAY_MINUTES : minutesOf(close);
    if (rest.length > 0 || from === null || to === null || to <= from) return null;
    windows.push([from, to]);
  }
  return windows;
}

/** One rule, its days and its spans (none for `off`); null where it is not one of the plain forms. */
function ruleOf(rule: string): { days: Set<number>; windows: HoursWindow[] } | null {
  const gap = rule.search(/\s/);
  if (gap <= 0) return null;
  const days = daysOf(rule.slice(0, gap));
  const times = rule.slice(gap + 1).trim();
  if (!days) return null;
  if (times === 'off' || times === 'closed') return { days, windows: [] };
  const windows = spansOf(times);
  return windows && { days, windows };
}

/** The windows OpenStreetMap's hours give a date, in minutes; null where they cannot be read. */
export function openWindows(hours: string, date: string): HoursWindow[] | null {
  const weekday = weekdayOf(date);
  return weekday === null ? null : osmWindows(hours.trim(), weekday);
}

/** The windows OpenStreetMap's hours give a weekday, Monday 0; null where they cannot be read. */
function osmWindows(text: string, weekday: number): HoursWindow[] | null {
  if (text === '24/7') return [[0, DAY_MINUTES]];
  let windows: HoursWindow[] = [];
  for (const raw of text.split(';')) {
    if (!raw.trim()) continue;
    const rule = ruleOf(raw.trim());
    if (!rule) return null;
    // A later rule for the day replaces an earlier one, as OpenStreetMap reads them.
    if (rule.days.has(weekday)) windows = rule.windows;
  }
  return windows;
}

/** A day of a place's own week as its window that day: none when closed, null when it says nothing. */
function dayWindows(day: PlaceHoursDay | undefined): HoursWindow[] | null {
  if (!day) return null;
  if (day.closed) return [];
  const open = minutesOf(day.open);
  const close = minutesOf(day.close);
  if (open === null || close === null) return null;
  // Closing at or before it opens runs past midnight: open to the end of this day.
  return [[open, close > open ? close : DAY_MINUTES]];
}

/** The part after midnight of a day open past it, which falls on the next date. */
function spillOf(day: PlaceHoursDay | undefined): HoursWindow | null {
  if (!day || day.closed) return null;
  const open = minutesOf(day.open);
  const close = minutesOf(day.close);
  return open !== null && close !== null && close <= open && close > 0 ? [0, close] : null;
}

/**
 * The windows a trip place's own hours (#2472: seven days, Monday first) give
 * a date, with the night of the day before where it runs past midnight; null
 * where that weekday says nothing, which is unknown and never open.
 */
export function placeWindows(raw: string | null | undefined, date: string): HoursWindow[] | null {
  const week = parsePlaceHours(raw);
  const weekday = weekdayOf(date);
  return week && weekday !== null ? placeWeekWindows(week, weekday) : null;
}

/** The windows of one weekday of a place's own week, Monday 0, with the night of the day before. */
function placeWeekWindows(week: readonly PlaceHoursDay[], weekday: number): HoursWindow[] | null {
  const today = dayWindows(week[weekday]);
  if (today === null) return null;
  const spill = spillOf(week[(weekday + 6) % 7]);
  return spill ? [spill, ...today] : today;
}

/**
 * A stop's hours on a date: the trip place it stands for first, as the
 * travellers entered them, else what OpenStreetMap had for it; null where
 * neither says anything or the date cannot be read.
 */
export function stationHoursOn(
  hours: { place?: string | null; osm?: string | null },
  date: string,
): StationHours | null {
  const weekday = weekdayOf(date);
  if (weekday === null) return null;
  const tomorrow = (weekday + 1) % 7;
  const week = parsePlaceHours(hours.place);
  const own = week && placeWeekWindows(week, weekday);
  if (week && own) {
    return { source: 'place', windows: own, continues: runsOn(own, placeWeekWindows(week, tomorrow)) };
  }
  const text = hours.osm?.trim();
  if (!text) return null;
  const windows = osmWindows(text, weekday);
  return windows
    ? { source: 'osm', windows, continues: runsOn(windows, osmWindows(text, tomorrow)) }
    : { source: 'osm', unread: text };
}

/**
 * Whether a window of the day ends at midnight and the next day opens at
 * midnight, so the hours run on past it. Every window is looked at, as the
 * hours text keeps the order it was written in.
 */
function runsOn(today: readonly HoursWindow[], tomorrow: readonly HoursWindow[] | null): boolean {
  return today.some(([, to]) => to === DAY_MINUTES) && (tomorrow?.some(([from]) => from === 0) ?? false);
}

/**
 * What a stop's hours say about the visit planned there:
 * - `unknown`: no hours, so nothing is said, and never that it is open;
 * - `unread`: hours that are not in a plain form, given back as written;
 * - `nextDay`: an arrival at or after midnight, which is not checked against the next day;
 * - `uncertain`: the arrival is only a lower bound and a later one could still fit;
 * - `open`: open from the arrival to the end of the stay, in `window`;
 * - `closedAllDay`, `closed` (at the arrival; `windows` are the day's) and
 *   `closes` (during the stay, at the end of `window`) are conflicts.
 */
export type StationFit =
  | { kind: 'unknown' }
  | { kind: 'unread'; text: string }
  | { kind: 'nextDay' }
  | { kind: 'uncertain'; source: HoursSource }
  | { kind: 'open'; source: HoursSource; window: HoursWindow }
  | { kind: 'closedAllDay'; source: HoursSource }
  | { kind: 'closed'; source: HoursSource; windows: readonly HoursWindow[] }
  | { kind: 'closes'; source: HoursSource; window: HoursWindow };

/** An arrival in minutes after midnight; `atLeast` when a stay before it is not known, so it may come later. */
export interface WalkArrival {
  arrival: number;
  atLeast: boolean;
}

/** Inside the window holding the arrival: whether the stay ends after it closes. */
function fitInWindow(
  source: HoursSource,
  window: HoursWindow,
  leave: number | null,
  later: { atLeast: boolean; windowAfter: boolean; continues: boolean },
): StationFit {
  // A window to midnight is open past it only where the hours run on into the next date.
  const closes = leave !== null && leave > window[1] && !(window[1] === DAY_MINUTES && later.continues);
  // An arrival that may come later can still miss the closing, or reach the next window instead.
  if (later.atLeast)
    return closes && !later.windowAfter ? { kind: 'closes', source, window } : { kind: 'uncertain', source };
  return closes ? { kind: 'closes', source, window } : { kind: 'open', source, window };
}

/**
 * Whether a stop is open from its arrival to the end of its stay. A stay that
 * is not known checks the arrival alone, and a stay of 0, a point only passed,
 * checks that it is open as the walk passes.
 */
export function stationFit(hours: StationHours | null, at: WalkArrival, stay: number | null): StationFit {
  if (at.arrival >= DAY_MINUTES) return { kind: 'nextDay' };
  if (!hours) return { kind: 'unknown' };
  if ('unread' in hours) return { kind: 'unread', text: hours.unread };
  const { source, windows, continues } = hours;
  if (windows.length === 0) return { kind: 'closedAllDay', source };
  const leave = stay === null ? null : at.arrival + stay;
  const window = windows.find(([from, to]) => at.arrival >= from && at.arrival < to);
  const windowAfter = windows.some(([from]) => from > at.arrival);
  if (window) return fitInWindow(source, window, leave, { atLeast: at.atLeast, windowAfter, continues });
  return at.atLeast && windowAfter ? { kind: 'uncertain', source } : { kind: 'closed', source, windows };
}

/** A stop of a walk as the arrivals need it: where it is, and its stay (null or left out when not known). */
export interface WalkStop {
  lat: number;
  lng: number;
  stayMinutes?: number | null;
}

type RoutePoint = readonly [number, number, ...number[]];

const RAD = Math.PI / 180;

/** The route laid flat around its start: a city walk spans a few kilometres, so distances keep their ratios. */
function flatRoute(route: readonly RoutePoint[]): Array<[number, number]> {
  const kx = Math.cos((route[0]?.[0] ?? 0) * RAD);
  return route.map(([lat, lng]) => [lng * kx, lat]);
}

function flatGap(a: readonly [number, number], b: readonly [number, number]): number {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
}

/**
 * The route point each stop is passed at, keeping the stops' order: the
 * nearest points that do, so a loop's end is its last point rather than its
 * first, and a stop passed on the way out and back is matched where the walk
 * passes it in its turn. Of two equally near points the earlier is taken.
 */
function passedAt(stops: readonly WalkStop[], flat: ReadonlyArray<[number, number]>, kx: number): number[] {
  // best[j]: the least summed distance of the stops so far, the last of them at point j or before.
  let best = new Array<number>(flat.length).fill(0);
  const picks: Int32Array[] = [];
  for (const stop of stops) {
    const spot: [number, number] = [stop.lng * kx, stop.lat];
    const next = new Array<number>(flat.length);
    const pick = new Int32Array(flat.length);
    let low = Number.POSITIVE_INFINITY;
    let lowAt = 0;
    flat.forEach((point, j) => {
      const cost = (best[j] ?? 0) + flatGap(point, spot);
      if (cost < low) {
        low = cost;
        lowAt = j;
      }
      next[j] = low;
      pick[j] = lowAt;
    });
    best = next;
    picks.push(pick);
  }
  const indices = new Array<number>(stops.length).fill(0);
  let at = flat.length - 1;
  for (let s = stops.length - 1; s >= 0; s -= 1) {
    at = picks[s]?.[at] ?? 0;
    indices[s] = at;
  }
  return indices;
}

/**
 * CW-12: a walk's crossings by boat along its route: the spans the boat runs,
 * from the index it leaves at to the one it lands at, and for each ferry leg
 * the index its last boat lands at with the minutes of its boats (null where
 * the router gave none).
 */
export interface WalkBoats {
  spans: Array<[number, number]>;
  landings: Array<{ at: number; minutes: number | null }>;
}

const NO_BOATS: Readonly<WalkBoats> = { spans: [], landings: [] };

/** Each stop's share of the walk with the index of the route's point it is passed at. */
function walkedAlong(
  stops: readonly WalkStop[],
  route: readonly RoutePoint[],
  boatSpans: ReadonlyArray<readonly [number, number]>,
): { shares: number[]; indices: number[] } | null {
  if (route.length < 2) return null;
  const flat = flatRoute(route);
  const byBoat = (i: number) => boatSpans.some(([from, to]) => i > from && i <= to);
  const along = [0];
  for (let i = 1; i < flat.length; i += 1) {
    const step = byBoat(i) ? 0 : Math.sqrt(flatGap(flat[i] ?? [0, 0], flat[i - 1] ?? [0, 0]));
    along.push((along[i - 1] ?? 0) + step);
  }
  const total = along[along.length - 1] || 1;
  const indices = passedAt(stops, flat, Math.cos((route[0]?.[0] ?? 0) * RAD));
  return { shares: indices.map((index) => (along[index] ?? 0) / total), indices };
}

/**
 * How far along the route each stop is passed, from 0 at its start to 1 at its
 * end, by distance, the stops matched in their order as `passedAt` does. Null
 * for a route of fewer than two points. The stretches of `boatSpans` (CW-12,
 * from the index the boat leaves at to the one it lands at) are crossed by
 * boat and add no walking distance.
 */
export function stationShares(
  stops: readonly WalkStop[],
  route: readonly RoutePoint[],
  boatSpans: ReadonlyArray<readonly [number, number]> = [],
): number[] | null {
  return walkedAlong(stops, route, boatSpans)?.shares ?? null;
}

/**
 * The estimated arrival at each stop, in minutes after midnight and whole: the
 * start, the walking time shared out by how far along the route the stop is
 * passed, and the stays before it. A stay not known counts as nothing and
 * makes every later arrival a lower bound; a stay of 0 is known. A crossing by
 * boat (CW-12) takes no share of the walking time; a stop after it lands is
 * reached its minutes later, a lower bound where the boat's time is not known.
 * Null when the start, the walking time or the route is not known.
 */
export function stationArrivals(
  stops: readonly WalkStop[],
  route: readonly RoutePoint[],
  start: number | null,
  walkingMinutes: number | null,
  boats: Readonly<WalkBoats> = NO_BOATS,
): WalkArrival[] | null {
  if (start === null || walkingMinutes === null) return null;
  const walked = walkedAlong(stops, route, boats.spans);
  if (!walked) return null;
  let stays = 0;
  let unknown = false;
  return stops.map((stop, index) => {
    const at = walked.indices[index] ?? 0;
    const landed = boats.landings.filter((landing) => landing.at <= at);
    const boat = landed.reduce((sum, landing) => sum + (landing.minutes ?? 0), 0);
    const arrival = {
      arrival: Math.round(start + walkingMinutes * (walked.shares[index] ?? 0) + boat + stays),
      atLeast: unknown || landed.some((landing) => landing.minutes === null),
    };
    if (stop.stayMinutes == null) unknown = true;
    else stays += stop.stayMinutes;
    return arrival;
  });
}
