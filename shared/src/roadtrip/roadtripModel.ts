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
 * A check-in counts. Every schedule already anchors on `time ?? checkInTime`, so a
 * booked night starts its day exactly like a pinned stop does; asking only about
 * `time` here made the rail print that chosen hour in the grey it reserves for
 * computed ones. One function because the answer was spelled out separately in each
 * of the three schedulers, and two of them spelled it differently from the anchor
 * they had just used.
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
   *  after it is being late. */
  anchor: string | null;

  /**
   * The earliest this stop can be entered, when something says so — a check-in is
   * the hour a room becomes available, not an appointment. Arriving before it means
   * waiting for it; arriving after it means arriving, with nothing to report.
   */
  earliest?: string | null;

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
): { arrival: number | null; lateBy: number | null } {
  if (anchor === null) return { arrival: cursor, lateBy: null };

  if (cursor === null) return { arrival: anchor + dayOffset * DAY_MINUTES, lateBy: null };

  const k = Math.round((cursor - anchor) / DAY_MINUTES);
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
 * A visit's end time is when the drive leaves it. It is the traveller's own statement
 * about this visit, unlike the check-out that used to feed `departureAt` (the LATEST a
 * room has to be handed back, which is why #2357 took it out of the drive).
 */
export function scheduleStopOf(
  stop: Pick<RoadtripStop, 'time' | 'checkInTime' | 'dwellMinutes' | 'leaveAt'>,
): ScheduleStop {
  const leave = parseClock(stop.leaveAt);
  return {
    anchor: stop.time ?? null,
    earliest: stop.checkInTime ?? null,
    dwellMinutes: stop.dwellMinutes,
    ...(leave === null ? {} : { departureAt: leave }),
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
    const resolved = resolveArrival(anchor, cursor, dayOffset);
    // A door that opens at eleven is not an appointment at eleven. Reaching the stop
    // later than that is simply reaching it; only a time somebody pinned can be missed.
    const opens = parseClock(stop.earliest ?? null);
    // With nothing before it deciding the hour, the door IS the hour: a night booked
    // to check in at ten starts the day at ten rather than being worked backwards out
    // of whatever comes after it. Reached later, it is only a floor, and a floor below
    // the arrival changes nothing.
    const waited = anchor === null && opens !== null
      ? resolved.arrival === null
        ? opens + dayOffset * DAY_MINUTES
        : opens + Math.round((resolved.arrival - opens) / DAY_MINUTES) * DAY_MINUTES
      : null;
    const held = waited !== null && (resolved.arrival === null || waited > resolved.arrival);
    const arrival = held ? waited : resolved.arrival;
    const lateBy = resolved.lateBy;
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
    // Ink for a time somebody decided: a pinned one always, a check-in only where the
    // drive actually had to wait for it.
    anchored[i]! = anchor !== null || held;

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

  if (stopCount <= 2) return { vias: [], remove: vias.map((v) => v.id) };
  return collect(vias, (i) => {
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

  if (stopCount <= 2) return EMPTY_REANCHORING;
  const afterRemove = reanchorAfterRemove(vias, from, stopCount);
  const dropped = new Set(afterRemove.remove);
  const movedTo = new Map(afterRemove.vias.map((v) => [v.id, v.after_order_index] as const));

  const shifted: AnchoredVia[] = vias
    .filter((v) => !dropped.has(v.id))
    .map((v) => ({ ...v, after_order_index: movedTo.get(v.id) ?? v.after_order_index }));
  const afterInsert = reanchorAfterInsert(shifted, to, () => true);
  const finalIndex = new Map(afterInsert.vias.map((v) => [v.id, v.after_order_index] as const));

  const result: ReanchoredVia[] = [];
  for (const via of vias) {
    if (dropped.has(via.id)) continue;
    const mid = movedTo.get(via.id) ?? via.after_order_index;
    const end = finalIndex.get(via.id) ?? mid;
    if (end !== via.after_order_index) result.push({ id: via.id, after_order_index: end });
  }
  return { vias: result, remove: afterRemove.remove };
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
