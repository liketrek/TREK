import type { RoadtripStop, RouteAvoidClass } from './planning-types';

export const SERVICE_STOP_TYPES = [
  'fuel',
  'charging',
  'rest_area',
  'campsite',
  'restaurant',
  'sights',
  'hotel',
] as const;

export const SERVICE_COLORS: Record<string, string> = {
  fuel: '#E8590C',
  charging: '#CA8A04',
  rest_area: '#3B82F6',
  campsite: '#16A34A',
  restaurant: '#EF4444',
  sights: '#EC4899',
  hotel: '#2563EB',
};

export function serviceColor(stopType: string | null | undefined): string {
  return SERVICE_COLORS[stopType ?? ''] ?? '#64748B';
}

export function isServiceStopType(stopType: string | null | undefined): boolean {
  return !!stopType && (SERVICE_STOP_TYPES as readonly string[]).includes(stopType);
}

export function formatDurationShort(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const h = Math.floor(safe / 3600);
  const m = Math.round((safe % 3600) / 60);

  if (m === 60) return `${h + 1} h`;
  if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`;
  return `${m} min`;
}

/**
 * Whether this stop's arrival is a time somebody chose, rather than one the chain
 * worked out from the stop before it.
 *
 * A check-in counts. Every schedule anchors on `time ?? checkInTime`, so a booked
 * night holds its hour exactly like a pinned stop does; asking only about `time`
 * here made the rail print that chosen hour in the grey it reserves for computed
 * ones. One function because the answer was spelled out separately in each of the
 * three schedulers, and two of them spelled it differently from the anchor they had
 * just used.
 */
export function hasChosenArrival(stop: { time?: string | null; checkInTime?: string | null; automaticNight?: unknown }): boolean {
  if (stop.automaticNight) return false;
  return (stop.time ?? null) !== null || (stop.checkInTime ?? null) !== null;
}

export function parseClock(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function formatClock(minutes: number): string {
  const day = 24 * 60;
  const wrapped = ((minutes % day) + day) % day;
  const h = Math.floor(wrapped / 60);
  const m = Math.round(wrapped % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export interface ScheduleStop {
  /**
   * Minute this stop is left at. A time of day is put on a day against the arrival (see
   * `leaveAfter`); past 1440 it is counted from the start of the day the stop is reached
   * on and reaches into the days after.
   *
   * The stay then lasts until then instead of for `dwellMinutes`, and the chain carries
   * on from it.
   */
  departureAt?: number;
  /** A time somebody fixed this stop to. The chain restarts from it, and arriving
   *  after it is being late. A booked night's check-in is one of these. */
  anchor: string | null;
  /**
   * The anchor is a timetable's, on this stop's own day: a ride's departure terminal. Any
   * other anchor is a time of day and counts at its passing nearest the drive.
   */
  dated?: boolean;

  dwellMinutes: number | null;
}

export interface ScheduleWarning {
  index: number;
  /** `missedLeave` is a stop reached after the time it was set to be left at. */
  code: 'late' | 'overnight' | 'leg' | 'range' | 'missedLeave';

  minutes?: number;

  overMinutes?: number;

  sinceKm?: number;
}

export const REFUELLING_STOP_TYPES = ['fuel', 'charging'] as const;

export type VehicleKind = 'combustion' | 'electric';

export function refuelStopTypeFor(vehicle: VehicleKind | null | undefined): readonly string[] {
  if (vehicle === 'combustion') return ['fuel'];
  if (vehicle === 'electric') return ['charging'];
  return REFUELLING_STOP_TYPES;
}

export function refuelsRange(stopType: string | null | undefined, vehicle?: VehicleKind | null): boolean {
  return refuelStopTypeFor(vehicle).includes(stopType ?? '');
}

export interface DriveLimits {
  fillPercent?: number | null;

  legMinutes: number | null;

  dayMinutes: number | null;

  rangeKm: number | null;
}

export interface DayWarning {
  code: 'dayDriving';

  minutes: number;
  limitMinutes: number;
}

export interface ScheduleEntry {
  arrival: string | null;
  departure: string | null;

  anchored: boolean;

  dayOffset: number;
}

export interface Schedule {
  entries: ScheduleEntry[];
  warnings: ScheduleWarning[];
  /**
   * Minute the last stop is left at, counted from the start of this day, so a stay
   * running past midnight comes back as more than 1440.
   *
   * The one number the next day needs. A stop stood at for twenty-four hours is not
   * over when the date changes, and the day after it cannot begin before it ends.
   * Null or absent when nothing on this day has a time at all.
   */
  endsAt?: number | null;
}

const DAY_MINUTES = 24 * 60;

function resolveArrival(
  anchor: number | null,
  cursor: number | null,
  dayOffset: number,
  dated = false,
): { arrival: number | null; lateBy: number | null } {
  if (anchor === null) return { arrival: cursor, lateBy: null };

  if (cursor === null) return { arrival: anchor + dayOffset * DAY_MINUTES, lateBy: null };

  // A dated anchor stays on its day: a flight is not caught by reaching the airport a day
  // late, and one reached at dawn for the afternoon is waited for, not read as yesterday's.
  const k = dated ? 0 : Math.round((cursor - anchor) / DAY_MINUTES);
  const anchorAt = anchor + k * DAY_MINUTES;
  return {
    arrival: anchorAt,
    lateBy: cursor > anchorAt + 1 ? Math.round(cursor - anchorAt) : null,
  };
}

/**
 * When a stop that is left at a set time is left, reached at `arrival`.
 *
 * Getting there after the time is not a reason to wait for the same time tomorrow: the
 * traveller is late for a departure they chose themselves, so the drive leaves on arrival
 * and `missedBy` says how late. The question is only which passing of the clock counts.
 *
 * The one the clock last showed before the arrival counts when the drive went past it on
 * the road, which is what `setOut` (when the drive towards the stop left the one before,
 * counted like the arrival) is for: a 23:30 reached at 00:30 is missed, midnight or not.
 * It also counts when it went by earlier the same day and less than half a day ago, like
 * a stop meant to be left at two and reached at half past.
 *
 * Anything else is the next one. Ten in the morning after a night drive is that
 * morning's, one at night after an evening arrival is that night's, and a stop reached
 * at nine with an End of half past nine in the evening is stood at all day.
 */
export function leaveAfter(
  arrival: number,
  departureAt: number,
  setOut: number | null = null,
): { departure: number; missedBy: number | null } {
  // A departure a day or more out is on its day already, counted from the start of the one
  // the stop is reached on. Only a time of day has to be put on one.
  if (departureAt >= DAY_MINUTES) {
    return { departure: departureAt + Math.floor(arrival / DAY_MINUTES) * DAY_MINUTES, missedBy: null };
  }
  const before = departureAt + Math.floor((arrival - departureAt) / DAY_MINUTES) * DAY_MINUTES;
  const late = arrival - before;
  // The minute a rounded drive can add is not being late.
  if (late <= 1) return { departure: arrival, missedBy: null };
  const drivenPast = setOut !== null && before >= setOut;
  const earlierToday =
    Math.floor(before / DAY_MINUTES) === Math.floor(arrival / DAY_MINUTES) && late <= DAY_MINUTES / 2;
  if (drivenPast || earlierToday) return { departure: arrival, missedBy: Math.round(late) };
  return { departure: before + DAY_MINUTES, missedBy: null };
}

/**
 * The part of a road trip stop the schedule reads.
 *
 * A booked night's check-in is the hour the traveller said they are at the hotel, so
 * it holds the stop the way a pinned time does: the day is built around it, and a
 * drive that gets there later is late. Read as a mere floor it held nothing once
 * anything before it set the clock, and a night booked for ten in the morning was
 * reported reached at a quarter past twelve, with the rest of the day lined up
 * behind that. A time pinned on the stop itself still wins.
 *
 * A visit's end time is when the drive leaves it. It is the traveller's own statement
 * about this visit, unlike the check-out that used to feed `departureAt` (the LATEST a
 * room has to be handed back, which is why #2357 took it out of the drive).
 *
 * A ride's departure terminal is pinned on the day its timetable names (`dated`). The
 * arrival terminal is not: the chain reaches it from the departure, on the ride's own
 * minutes, and a landing booked on the day it left but past midnight is the next morning.
 */
export function scheduleStopOf(
  stop: Pick<RoadtripStop, 'time' | 'checkInTime' | 'dwellMinutes' | 'leaveAt' | 'carrier'>,
): ScheduleStop {
  const leave = parseClock(stop.leaveAt);
  return {
    anchor: stop.time ?? stop.checkInTime ?? null,
    dwellMinutes: stop.dwellMinutes,
    ...(leave === null ? {} : { departureAt: leave }),
    ...(stop.carrier?.role === 'departure' ? { dated: true } : {}),
  };
}

/**
 * @param opts.notBefore Minute of this day the first stop cannot be reached before,
 * because the day before is still running into it: a stop stood at past midnight ends
 * where it ends, and nothing can happen ahead of that. Behaves like the arrival of an
 * imaginary stop just before the first, so a stop pinned earlier keeps its clock and
 * picks up the same late finding any leg it cannot make in time would give it.
 */
export function computeSchedule(
  stops: ScheduleStop[],
  legSeconds: (number | undefined)[],
  opts: { notBefore?: number | null } = {},
): Schedule {
  const warnings: ScheduleWarning[] = [];

  const arrivals: (number | null)[] = new Array(stops.length).fill(null);
  // Counted the same way as the arrivals. Set with every arrival, and on its own for a
  // stop whose leave time is known before anything says when it is reached.
  const departures: (number | null)[] = new Array(stops.length).fill(null);
  const anchored: boolean[] = new Array(stops.length).fill(false);

  let cursor: number | null = opts.notBefore ?? null;
  // When the drive the cursor stands for left the stop before, which is what tells a leave
  // time passed on the road from one still ahead.
  let setOut: number | null = null;
  let dayOffset = 0;

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i]!;
    const anchor = parseClock(stop.anchor);
    const { arrival, lateBy } = resolveArrival(anchor, cursor, dayOffset, stop.dated);
    if (lateBy !== null) warnings.push({ index: i, code: 'late', minutes: lateBy });

    if (arrival === null) {
      const leg = legSeconds[i];
      if (stop.departureAt !== undefined) {
        const departure = stop.departureAt + dayOffset * DAY_MINUTES;
        departures[i]! = departure;
        if (leg !== undefined) {
          cursor = departure + Math.round(leg / 60);
          setOut = departure;
        }
      }
      continue;
    }

    const offset = Math.floor(arrival / DAY_MINUTES);
    if (offset > dayOffset) dayOffset = offset;

    arrivals[i]! = arrival;
    anchored[i]! = anchor !== null;

    let departure = arrival + (stop.dwellMinutes ?? 0);
    if (stop.departureAt !== undefined) {
      const left = leaveAfter(arrival, stop.departureAt, setOut);
      departure = left.departure;
      if (left.missedBy !== null) warnings.push({ index: i, code: 'missedLeave', minutes: left.missedBy });
    }
    departures[i]! = departure;

    const leg = legSeconds[i];
    cursor = leg === undefined ? null : departure + Math.round(leg / 60);
    setOut = leg === undefined ? null : departure;
  }

  // Before the first time anything fixes, the chain runs backwards: every stop is reached
  // early enough to stay its length and still make the next one. A stop left at a set time
  // is reached its stay before that time, the way a pinned arrival is left a stay after.
  // The first stop of the day is not reached before the day began, though: a hotel left at
  // eight after a twelve hour stay is where the day starts, not a stop reached the evening
  // before, and reading it that way moved everything after it onto tomorrow's card.
  const firstKnown = stops.findIndex((_, i) => arrivals[i] !== null || departures[i] !== null);
  for (let i = firstKnown; i >= 0; i--) {
    if (arrivals[i] !== null) continue;
    const dwell = stops[i]!.dwellMinutes ?? 0;
    const fixed = departures[i]!;
    if (fixed !== null) {
      arrivals[i]! = i === 0 ? Math.max(0, fixed - dwell) : fixed - dwell;
      continue;
    }
    const leg = legSeconds[i];
    const next = arrivals[i + 1] ?? null;
    if (leg === undefined || next === null) break;
    arrivals[i]! = next - Math.round(leg / 60) - dwell;
    departures[i]! = next - Math.round(leg / 60);
  }

  const earliest = arrivals.reduce<number | null>((m, a) => (a === null ? m : m === null || a < m ? a : m), null);
  const shift = earliest === null || earliest >= 0 ? 0 : -Math.floor(earliest / DAY_MINUTES) * DAY_MINUTES;

  const entries: ScheduleEntry[] = [];
  let lastOffset = 0;
  for (let i = 0; i < stops.length; i++) {
    const raw = arrivals[i]!;
    const left = departures[i]!;
    if (raw === null) {
      entries.push({
        arrival: null,
        departure: left === null ? null : formatClock(left + shift),
        anchored: false,
        dayOffset: 0,
      });
      continue;
    }
    const arrival = raw + shift;
    const offset = Math.floor(arrival / DAY_MINUTES);

    if (offset > lastOffset) warnings.push({ index: i, code: 'overnight' });
    lastOffset = offset;
    entries.push({
      arrival: formatClock(arrival),
      departure: formatClock(left! + shift),
      anchored: anchored[i]!,
      dayOffset: offset,
    });
  }

  // Read off the last stop that actually has a clock: a trailing stop with no time of
  // its own carries nothing forward, and a day whose times peter out halfway should
  // hand on what it does know rather than nothing.
  let endsAt: number | null = null;
  for (let i = stops.length - 1; i >= 0; i--) {
    const raw = arrivals[i];
    if (raw === null || raw === undefined) continue;
    endsAt = departures[i]! + shift;
    break;
  }

  return { entries, warnings, endsAt };
}

/**
 * Whether a stop is one somebody stored on the day: an assignment, filed at its own
 * index. Not an automatic night, a terminal or a booked night at a day's edge, which the
 * plan seats between the stored stops and which borrow a stored stop's index to be seated
 * by. A reader looking a stop up by its day and index has to pass those three over, or it
 * finds the marker, the airport or the hotel in front of the stop it meant.
 *
 * Asked of the shape rather than of the id's sign: a stop added a moment ago carries a
 * temporary negative id until the server answers, and is stored all the same.
 */
export function isStoredStop(stop: Pick<RoadtripStop, 'automaticNight' | 'carrier' | 'bookend'>): boolean {
  return !stop.automaticNight && !stop.carrier && !stop.bookend;
}

/**
 * Whether the rail lists this day among the days, rather than as a quiet placeholder
 * asking for stops.
 *
 * Two stops make a drive. A booked night makes a day on its own: the day you arrive
 * somewhere and go no further, or the one you check in at ten and set out from. It
 * used to need company, and a hotel entered under Days for the arrival day was filed
 * at the bottom of the rail under "only X so far", which reads as the hotel missing
 * from the road trip altogether.
 */
export function standsAsDay(stops: readonly { night?: boolean }[]): boolean {
  return stops.length > 1 || stops.some((stop) => stop.night === true);
}

export function splitIntoRuns<T>(stops: T[], modeOfLeg: (from: T, to: T) => string): { stops: T[]; mode: string }[] {
  const runs: { stops: T[]; mode: string }[] = [];
  let current: T[] = [];
  let currentMode: string | null = null;

  for (let i = 0; i < stops.length - 1; i++) {
    const mode = modeOfLeg(stops[i]!, stops[i + 1]!);
    if (currentMode === null) {
      current = [stops[i]!, stops[i + 1]!];
      currentMode = mode;
    } else if (mode === currentMode) {
      current.push(stops[i + 1]!);
    } else {
      runs.push({ stops: current, mode: currentMode });
      current = [stops[i]!, stops[i + 1]!];
      currentMode = mode;
    }
  }
  if (currentMode !== null && current.length > 1) runs.push({ stops: current, mode: currentMode });
  return runs;
}

export function sumLegSeconds(legSeconds: (number | undefined)[]): number {
  return legSeconds.reduce<number>((sum, s) => sum + (s ?? 0), 0);
}

export interface DryPoint {
  inboundLine?: [number, number][];

  legIndex: number;

  intoLegKm: number;

  drivenMeters: number;

  sinceKm: number;
}

export function deriveDriveWarnings(
  legs: ({ duration?: number; distance?: number; mode?: string } | undefined)[],

  refuelsAt: boolean[],
  limits: DriveLimits,

  carryKm: number | null,

  fillAt: readonly (number | null | undefined)[] = [],
): { warnings: ScheduleWarning[]; day: DayWarning | null; carryKm: number | null; emptyAt: DryPoint[] } {
  const warnings: ScheduleWarning[] = [];
  const emptyAt: DryPoint[] = [];
  let budget = carryKm;
  let totalSeconds = 0;

  let drivenMeters = 0;

  const usedAfterFilling = (i: number): number => {
    const percent = fillAt[i] ?? limits.fillPercent;
    return limits.rangeKm && percent && percent > 0 && percent < 100 ? limits.rangeKm * (1 - percent / 100) : 0;
  };

  for (let i = 0; i < legs.length; i++) {
    if (refuelsAt[i]!) budget = usedAfterFilling(i);
    const leg = legs[i];

    const at = i + 1;

    if (leg && leg.mode !== undefined && leg.mode !== 'driving') continue;
    const seconds = leg?.duration;
    if (typeof seconds === 'number') {
      totalSeconds += seconds;
      if (limits.legMinutes && seconds / 60 > limits.legMinutes) {
        warnings.push({ index: at, code: 'leg', overMinutes: Math.round(seconds / 60 - limits.legMinutes) });
      }
    }
    const metres = leg?.distance;
    if (typeof metres !== 'number') {
      budget = null;
    } else if (budget !== null) {
      const before = budget;
      budget += metres / 1000;

      if (limits.rangeKm && before <= limits.rangeKm && budget > limits.rangeKm) {
        const intoLegKm = limits.rangeKm - before;
        emptyAt.push({
          legIndex: i,
          intoLegKm,
          drivenMeters: drivenMeters + intoLegKm * 1000,
          sinceKm: Math.round(limits.rangeKm),
        });
      }

      if (limits.rangeKm && budget > limits.rangeKm && !refuelsAt[at]!) {
        warnings.push({ index: at, code: 'range', sinceKm: Math.round(budget) });
      }
      drivenMeters += metres;
    }
  }

  if (refuelsAt[legs.length]!) budget = usedAfterFilling(legs.length);

  const minutes = Math.round(totalSeconds / 60);
  const day =
    limits.dayMinutes && minutes > limits.dayMinutes
      ? { code: 'dayDriving' as const, minutes, limitMinutes: limits.dayMinutes }
      : null;

  return { warnings, day, carryKm: budget, emptyAt };
}

export function legIndexForAlong(legEndMeters: number[], alongMeters: number): number {
  if (!legEndMeters.length) return -1;
  for (let i = 0; i < legEndMeters.length; i++) {
    if (alongMeters < legEndMeters[i]!) return i;
  }
  return legEndMeters.length - 1;
}

export interface SectionAnchor {
  kind: 'stop' | 'leg';

  index: number;
  alongKm: number;
}

export function sectionAnchors(stopsAlongKm: number[]): SectionAnchor[] {
  const out: SectionAnchor[] = [];
  for (let i = 0; i < stopsAlongKm.length; i++) {
    out.push({ kind: 'stop', index: i, alongKm: stopsAlongKm[i]! });
    if (i + 1 < stopsAlongKm.length) {
      out.push({ kind: 'leg', index: i, alongKm: (stopsAlongKm[i]! + stopsAlongKm[i + 1]!) / 2 });
    }
  }
  return out;
}

export function insertIndexForAlong(stopsAlongKm: number[], hitAlongKm: number): number {
  if (stopsAlongKm.length < 2) return stopsAlongKm.length;
  let i = 0;
  while (i < stopsAlongKm.length && stopsAlongKm[i]! <= hitAlongKm) i++;
  return Math.min(Math.max(i, 1), stopsAlongKm.length - 1);
}

export interface AnchoredVia {
  id: number;
  after_order_index: number;
  lat: number;
  lng: number;
}

export interface ReanchoredVia {
  id: number;
  after_order_index: number;
}

export interface Reanchoring {
  vias: ReanchoredVia[];
  remove: number[];
}

const EMPTY_REANCHORING: Reanchoring = { vias: [], remove: [] };

/**
 * Where a via filed behind a day's last stop goes once the day's stops change: from its
 * old index `from` to `to`, the index that stop has now. Null when the stop is no longer
 * the day's last, and such a via then goes (`seamViaIndex`).
 *
 * Such a via bends no leg of its own day. It shapes the drive from the day's last stop
 * into the next day, on a trip with connected days or a night drive: the planner files a
 * point dropped on that drive there (`anchorFor`), and a way chosen for it is written
 * there. Read as a leg it leads nowhere and is dropped, which is right for a stop that has
 * just become last and wrong for one that was last already: sorting the day, or taking a
 * stop out of its middle, deleted a drive into tomorrow somebody had picked. And a last
 * stop taken out, or dragged up the day, left its via on a number no stop has, bending
 * nothing at all.
 *
 * `previousIds` and `nextIds` are the day's located stops in order, before and after.
 */
export function carriedSeam(
  previousIds: readonly number[],
  nextIds: readonly number[],
): { from: number; to: number } | null {
  const from = previousIds.length - 1;
  const to = nextIds.length - 1;
  return from >= 0 && to >= 0 && previousIds[from] === nextIds[to] ? { from, to } : null;
}

/**
 * What becomes of a via pinned behind stop `index` of the old order when that stop was
 * the day's last: the index it is carried to while the stop is still last
 * (`carriedSeam`), or null when it goes. Undefined for a via on a leg of the day, which
 * each writer reads by its own rule.
 *
 * It goes once its stop is no longer last, whichever way that came about. It was never a
 * leg of the day: it lies on the road to tomorrow, and read as the leg its stop leaves by
 * now it bent a drive within the day through a point on that road, for everybody on the
 * trip. Which of the two happened used to depend on the surface: a stop dragged up the
 * rail dropped the via, while the same stop dragged up the list under Days, or given an
 * earlier hour, kept it on its new leg.
 *
 * The one rule for every writer that renumbers a day: the planner's drags and removals
 * (`reanchorAfterReorder`, `reanchorAfterRemove`), the list's reorder and the server's
 * sorts (`reanchorByStopOrder`), and the nights the server seats (`carryVias`).
 */
export function seamViaIndex(
  index: number,
  previousIds: readonly number[],
  nextIds: readonly number[],
): number | null | undefined {
  if (index !== previousIds.length - 1) return undefined;
  return carriedSeam(previousIds, nextIds)?.to ?? null;
}

/** The stops of a day as their own positions, for asking `seamViaIndex` about a positional edit. */
const positions = (count: number): number[] => Array.from({ length: count }, (_, i) => i);

function collect(vias: AnchoredVia[], at: (index: number) => number | null): Reanchoring {
  const moved: ReanchoredVia[] = [];
  const remove: number[] = [];
  for (const via of vias) {
    const next = at(via.after_order_index);
    if (next === null) remove.push(via.id);
    else if (next !== via.after_order_index) moved.push({ id: via.id, after_order_index: next });
  }
  return { vias: moved, remove };
}

export function reanchorAfterInsert(
  vias: AnchoredVia[],
  position: number,
  liesBeforeInsert: (via: AnchoredVia) => boolean,
): Reanchoring {
  if (!vias.length) return EMPTY_REANCHORING;
  const split = position - 1;
  const moved: ReanchoredVia[] = [];
  for (const via of vias) {
    const i = via.after_order_index;
    let next = i;
    if (i === split) next = liesBeforeInsert(via) ? i : i + 1;
    else if (i >= position) next = i + 1;
    if (next !== i) moved.push({ id: via.id, after_order_index: next });
  }
  return { vias: moved, remove: [] };
}

export function reanchorAfterRemove(vias: AnchoredVia[], position: number, stopCount: number): Reanchoring {
  if (!vias.length) return EMPTY_REANCHORING;

  const before = positions(stopCount);
  const after = before.filter((i) => i !== position);
  // A day left with one stop has no leg, and only the drive out of it into the next day
  // can keep its points.
  if (stopCount <= 2) return collect(vias, (i) => seamViaIndex(i, before, after) ?? null);
  return collect(vias, (i) => {
    const seam = seamViaIndex(i, before, after);
    if (seam !== undefined) return seam;
    if (position === 0) return i === 0 ? null : i - 1;
    if (position === stopCount - 1) return i === position - 1 ? null : i;
    if (i === position) return position - 1;
    return i > position ? i - 1 : i;
  });
}

export function reanchorByStopOrder(vias: AnchoredVia[], previousIds: number[], nextIds: number[]): Reanchoring {
  if (!vias.length) return EMPTY_REANCHORING;
  const moved: ReanchoredVia[] = [];
  const remove: number[] = [];
  for (const via of vias) {
    const seam = seamViaIndex(via.after_order_index, previousIds, nextIds);
    if (seam !== undefined) {
      if (seam === null) remove.push(via.id);
      else if (seam !== via.after_order_index) moved.push({ id: via.id, after_order_index: seam });
      continue;
    }
    const stopId = previousIds[via.after_order_index]!;
    const next = stopId === undefined ? -1 : nextIds.indexOf(stopId);

    if (next === -1 || next >= nextIds.length - 1) {
      remove.push(via.id);
      continue;
    }
    if (next !== via.after_order_index) moved.push({ id: via.id, after_order_index: next });
  }
  return { vias: moved, remove };
}

export function reanchorAfterReorder(vias: AnchoredVia[], from: number, to: number, stopCount: number): Reanchoring {
  if (!vias.length || from === to) return EMPTY_REANCHORING;

  // The drive into the next day is settled first, by the one rule for it (`seamViaIndex`):
  // it stays behind the last stop while that stop is still last and goes otherwise, be it
  // dragged up the day or passed by another. A move keeps the count, so a via that stays
  // keeps its number. Everything else is on a leg of the day and is worked out below.
  const before = positions(stopCount);
  const after = before.filter((i) => i !== from);
  after.splice(to, 0, from);
  const seamGone: number[] = [];
  const legs: AnchoredVia[] = [];
  for (const via of vias) {
    const seam = seamViaIndex(via.after_order_index, before, after);
    if (seam === null) seamGone.push(via.id);
    else if (seam === undefined) legs.push(via);
  }
  // Two stops swapped keep their one leg, driven the other way round.
  if (stopCount <= 2 || !legs.length) return seamGone.length ? { vias: [], remove: seamGone } : EMPTY_REANCHORING;
  const afterRemove = reanchorAfterRemove(legs, from, stopCount);
  const dropped = new Set(afterRemove.remove);
  const movedTo = new Map(afterRemove.vias.map((v) => [v.id, v.after_order_index] as const));

  const shifted: AnchoredVia[] = legs
    .filter((v) => !dropped.has(v.id))
    .map((v) => ({ ...v, after_order_index: movedTo.get(v.id) ?? v.after_order_index }));
  const afterInsert = reanchorAfterInsert(shifted, to, () => true);
  const finalIndex = new Map(afterInsert.vias.map((v) => [v.id, v.after_order_index] as const));

  const result: ReanchoredVia[] = [];
  for (const via of legs) {
    if (dropped.has(via.id)) continue;
    const mid = movedTo.get(via.id) ?? via.after_order_index;
    const end = finalIndex.get(via.id) ?? mid;
    if (end !== via.after_order_index) result.push({ id: via.id, after_order_index: end });
  }
  return { vias: result, remove: [...afterRemove.remove, ...seamGone] };
}

export function isEmptyReanchoring(r: Reanchoring): boolean {
  return r.vias.length === 0 && r.remove.length === 0;
}

export function parseAvoid(raw: unknown): RouteAvoidClass[] {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  const asked = new Set(raw.split(',').map((part) => part.trim().toLowerCase()));
  return AVOIDABLE.filter((cls) => asked.has(cls));
}

export const AVOIDABLE: readonly RouteAvoidClass[] = ['toll', 'motorway', 'ferry'];

export function serializeAvoid(classes: readonly RouteAvoidClass[]): string {
  return AVOIDABLE.filter((cls) => classes.includes(cls)).join(',');
}
