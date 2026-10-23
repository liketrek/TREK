import { type AssistantFocus, parsePlaceHours, type PlaceOpeningHours, reservationTypeInfo } from '@trek/shared';

import type {
  Accommodation,
  Assignment,
  AssignmentsMap,
  Day,
  DayNotesMap,
  DistanceUnit,
  Place,
  Reservation,
} from '../../types';
import { formatClockTime, splitReservationDateTime } from '../../utils/formatters';
import { haversineKm } from '../../utils/geo';
import { formatDistance } from '../../utils/units';
import { dayBookings } from '../Planner/dayDetailModel';
import {
  bookingSpan,
  clockMinutes,
  clockText,
  type DaySpan,
  noteMinutes,
  spanKey,
  spansOverlap,
  spanTouches,
  stopSpan,
  weekdayMondayFirst,
} from './assistantHintsTime';

/**
 * The plan hints the empty chat offers: things in the trip worth a second
 * look, worked out from the data the client already holds. No model and no
 * request is involved, so they cost nothing and appear at once. Each hint
 * carries a short line, the question a tap sends, and the day or places that
 * question is about.
 *
 * A false alarm costs more than a missed one. Only rules on hard data (times,
 * stored opening hours) warn; whatever rests on an estimate is a quiet note.
 */

/** Free time between two stops that counts as a gap. */
export const GAP_MIN_MINUTES = 180;
/** Straight-line distance between two stops that counts as far, by how the leg is travelled. */
export const LONG_LEG_KM = { walking: 4, cycling: 20, other: 150 } as const;
/** Rough speed of a leg, to tell whether the time between two stops is enough. */
const LEG_SPEED_KMH = { walking: 4.5, cycling: 15, other: 50 } as const;
/** How much longer the way is than the straight line. */
const DETOUR_FACTOR = 1.3;
/** How far the estimate may run past the time available before it is worth a word. */
const TIGHT_LEG_SLACK_MINUTES = 10;

export type HintRule =
  'overlap' | 'closed' | 'outsideHours' | 'tightLeg' | 'gap' | 'longLeg' | 'noStay' | 'unplacedBooking';

const RULE_ORDER: readonly HintRule[] = [
  'overlap',
  'closed',
  'outsideHours',
  'tightLeg',
  'gap',
  'longLeg',
  'noStay',
  'unplacedBooking',
];

const WARNS: ReadonlySet<HintRule> = new Set(['overlap', 'closed', 'outsideHours', 'tightLeg']);

/** Bookings that keep the traveller busy at their time, so a stop at the same time collides with them. */
const OCCUPYING_TYPES: ReadonlySet<string> = new Set(['restaurant', 'event', 'tour', 'activity']);

export interface AssistantHint {
  /** Stable while the situation stays the same; a changed time or stop makes a new hint. */
  id: string;
  rule: HintRule;
  level: 'warn' | 'info';
  /** Position of the day in the trip, for the order; null for the trip as a whole. */
  dayIndex: number | null;
  /** The day the line names as {day}; the caller words it. */
  dayId: number | null;
  /** What the question is about, set on the chat before it is sent. */
  focus: AssistantFocus | null;
  textKey: string;
  promptKey: string;
  params: Record<string, string | number>;
}

export interface TripHintsInput {
  /** The user's calendar date, YYYY-MM-DD; earlier days are left alone. */
  today: string;
  days: Day[];
  assignments: AssignmentsMap;
  places: Place[];
  reservations: Reservation[];
  dayNotes: DayNotesMap;
  /** The trip's stays; null while they are not known, which keeps the night rule quiet. */
  accommodations: Accommodation[] | null;
  distanceUnit: DistanceUnit;
  is12h: boolean;
}

interface Stop {
  assignment: Assignment;
  placeId: number;
  name: string;
  span: DaySpan | null;
  hours: PlaceOpeningHours | null;
}

interface TimedBooking {
  reservation: Reservation;
  span: DaySpan;
}

interface PlannedDay {
  day: Day;
  index: number;
  stops: Stop[];
  /** The day's bookings with a time, the ones that occupy the traveller. */
  bookings: TimedBooking[];
  hasCarrier: boolean;
  noteTimes: number[];
}

interface Ctx {
  input: TripHintsInput;
  clock: (minutes: number) => string;
}

function isLive(r: Reservation): boolean {
  return r.status !== 'cancelled' && r.ingest_state !== 'staged';
}

function isCarrier(r: Reservation): boolean {
  return reservationTypeInfo(r.type)?.isCarrier === true;
}

function hint(
  rule: HintRule,
  key: string,
  at: { day: Day; index: number } | null,
  fields: Pick<AssistantHint, 'focus' | 'textKey' | 'promptKey' | 'params'>
): AssistantHint {
  return {
    id: `${rule}:${at?.day.id ?? 'trip'}:${key}`,
    rule,
    level: WARNS.has(rule) ? 'warn' : 'info',
    dayIndex: at?.index ?? null,
    dayId: at?.day.id ?? null,
    ...fields,
  };
}

function planDay(day: Day, index: number, input: TripHintsInput, placesById: Map<number, Place>): PlannedDay {
  const all = (input.assignments[String(day.id)] ?? []).slice().sort((a, b) => a.order_index - b.order_index);
  const toStop = (a: Assignment): Stop => ({
    assignment: a,
    placeId: a.place_id,
    name: a.place.name,
    span: stopSpan(a),
    hours: parsePlaceHours(placesById.get(a.place_id)?.opening_hours),
  });
  // A stay's own stop is the overnight block, not a visit.
  const stops = all.filter((a) => a.accommodation_id == null).map(toStop);
  const booked = dayBookings(day.id, all, input.reservations.filter(isLive));
  const bookings: TimedBooking[] = [];
  for (const reservation of booked) {
    if (!isCarrier(reservation) && !OCCUPYING_TYPES.has(reservation.type)) continue;
    const span = bookingSpan(reservation, day.date);
    if (span) bookings.push({ reservation, span });
  }
  const noteTimes = (input.dayNotes[String(day.id)] ?? [])
    .map((n) => noteMinutes(n.time))
    .filter((m): m is number => m !== null);
  return { day, index, stops, bookings, hasCarrier: booked.some(isCarrier), noteTimes };
}

interface Slot {
  key: string;
  name: string;
  span: DaySpan;
  placeId: number | null;
  assignmentId: number | null;
  isStop: boolean;
}

/** A booking hung on a stop, or made for its place, is that stop: the two cannot collide. */
function sameVisit(a: Slot, b: Slot): boolean {
  return (
    (a.assignmentId !== null && a.assignmentId === b.assignmentId) || (a.placeId !== null && a.placeId === b.placeId)
  );
}

function overlapHint(pd: PlannedDay): AssistantHint | null {
  const slots: Slot[] = [];
  for (const s of pd.stops) {
    if (s.span) {
      slots.push({
        key: `a${s.assignment.id}`,
        name: s.name,
        span: s.span,
        placeId: s.placeId,
        assignmentId: s.assignment.id,
        isStop: true,
      });
    }
  }
  for (const b of pd.bookings) {
    slots.push({
      key: `r${b.reservation.id}`,
      name: b.reservation.title,
      span: b.span,
      placeId: b.reservation.place_id ?? null,
      assignmentId: b.reservation.assignment_id ?? null,
      isStop: false,
    });
  }
  slots.sort((a, b) => a.span.start - b.span.start);
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const [a, b] = [slots[i], slots[j]];
      if (sameVisit(a, b) || !spansOverlap(a.span, b.span)) continue;
      const placeIds = [a, b].filter((s) => s.isStop && s.placeId !== null).map((s) => s.placeId as number);
      return hint('overlap', `${a.key}@${spanKey(a.span)},${b.key}@${spanKey(b.span)}`, pd, {
        focus: placeIds.length > 0 ? { dayId: pd.day.id, placeIds } : { dayId: pd.day.id },
        textKey: 'assistant.hint.overlap',
        promptKey: 'assistant.hint.overlap.prompt',
        params: { a: a.name, b: b.name },
      });
    }
  }
  return null;
}

function hoursHint(pd: PlannedDay, stop: Stop, weekday: number, ctx: Ctx): AssistantHint | null {
  const hours = stop.hours?.[weekday];
  if (!hours) return null;
  const focus = { dayId: pd.day.id, placeIds: [stop.placeId] };
  if (hours.closed) {
    return hint('closed', `p${stop.placeId}`, pd, {
      focus,
      textKey: 'assistant.hint.closed',
      promptKey: 'assistant.hint.closed.prompt',
      params: { place: stop.name },
    });
  }
  const open = clockMinutes(hours.open);
  const close = clockMinutes(hours.close);
  // Hours past midnight are left alone: which day they belong to is a guess.
  if (!stop.span || open === null || close === null || close <= open) return null;
  const { start } = stop.span;
  const end = stop.span.end ?? start;
  const key = `p${stop.placeId}@${spanKey(stop.span)}`;
  if (start < open) {
    return hint('outsideHours', key, pd, {
      focus,
      textKey: 'assistant.hint.opensLate',
      promptKey: 'assistant.hint.outsideHours.prompt',
      params: { place: stop.name, time: ctx.clock(open) },
    });
  }
  if (end > close || start >= close) {
    return hint('outsideHours', key, pd, {
      focus,
      textKey: 'assistant.hint.closesEarly',
      promptKey: 'assistant.hint.outsideHours.prompt',
      params: { place: stop.name, time: ctx.clock(close) },
    });
  }
  return null;
}

function hoursHints(pd: PlannedDay, ctx: Ctx): AssistantHint[] {
  const weekday = weekdayMondayFirst(pd.day.date);
  if (weekday === null) return [];
  return pd.stops.map((s) => hoursHint(pd, s, weekday, ctx)).filter((h): h is AssistantHint => h !== null);
}

/** Whether a booking or a timed note already fills the free time. */
function gapFilled(pd: PlannedDay, from: number, to: number): boolean {
  return pd.bookings.some((b) => spanTouches(b.span, from, to)) || pd.noteTimes.some((t) => t > from && t < to);
}

/**
 * The first long stretch with nothing planned between two timed stops. A free
 * morning or evening is not a gap, and a stop whose end is not known leaves
 * the time after it unknown too.
 */
function gapHint(pd: PlannedDay, ctx: Ctx): AssistantHint | null {
  const timed = pd.stops.filter((s) => s.span).sort((a, b) => (a.span as DaySpan).start - (b.span as DaySpan).start);
  let reach: number | null = null;
  for (let k = 0; k < timed.length; k++) {
    const span = timed[k].span as DaySpan;
    if (k > 0 && reach !== null && span.start - reach >= GAP_MIN_MINUTES && !gapFilled(pd, reach, span.start)) {
      return hint('gap', `${reach}-${span.start}`, pd, {
        focus: { dayId: pd.day.id },
        textKey: 'assistant.hint.gap',
        promptKey: 'assistant.hint.gap.prompt',
        params: {
          count: Math.floor((span.start - reach) / 60),
          from: ctx.clock(reach),
          to: ctx.clock(span.start),
        },
      });
    }
    if (span.end === null) reach = reach !== null && reach > span.start ? reach : null;
    else reach = Math.max(reach ?? span.end, span.end);
  }
  return null;
}

type LegClass = keyof typeof LONG_LEG_KM;

function legClass(mode: string | null | undefined): LegClass {
  if (!mode || mode === 'walking') return 'walking';
  return mode === 'cycling' ? 'cycling' : 'other';
}

/** A stop on the day's route: placed on the map, and not one a road trip or a tour lays out by itself. */
function routable(s: Stop): boolean {
  const a = s.assignment;
  return (
    a.place.lat != null && a.place.lng != null && !a.route_excluded && !a.place.stop_type && a.tour_place_id == null
  );
}

function tightLegHint(pd: PlannedDay, from: Stop, to: Stop, km: number, cls: LegClass): AssistantHint | null {
  const leaves = from.span?.end;
  const arrives = to.span?.start;
  if (leaves == null || arrives == null) return null;
  const available = arrives - leaves;
  const needed = ((km * DETOUR_FACTOR) / LEG_SPEED_KMH[cls]) * 60;
  // Less than nothing is an overlap, which says so itself.
  if (available < 0 || needed <= available + TIGHT_LEG_SLACK_MINUTES) return null;
  return hint('tightLeg', `a${from.assignment.id}-a${to.assignment.id}@${leaves}-${arrives}:${cls}`, pd, {
    focus: { dayId: pd.day.id, placeIds: [from.placeId, to.placeId] },
    textKey: 'assistant.hint.tightLeg',
    promptKey: 'assistant.hint.tightLeg.prompt',
    params: { count: available, from: from.name, to: to.name },
  });
}

/**
 * The legs between consecutive stops, by straight line: one that is short of
 * time, and one that is far for the way it is travelled. A day with a flight,
 * train or ferry is left alone, since the distance is the point of it.
 */
function legHints(pd: PlannedDay, ctx: Ctx): AssistantHint[] {
  if (pd.hasCarrier) return [];
  const route = pd.stops.filter(routable);
  let tight: AssistantHint | null = null;
  let long: AssistantHint | null = null;
  for (let k = 1; k < route.length; k++) {
    const [from, to] = [route[k - 1], route[k]];
    const cls = legClass(from.assignment.leg_transport_mode ?? pd.day.default_transport_mode);
    const km = haversineKm(
      { lat: from.assignment.place.lat as number, lng: from.assignment.place.lng as number },
      { lat: to.assignment.place.lat as number, lng: to.assignment.place.lng as number }
    );
    const tooTight: AssistantHint | null = tight ? null : tightLegHint(pd, from, to, km, cls);
    if (tooTight) {
      tight = tooTight;
      continue;
    }
    if (!long && km > LONG_LEG_KM[cls]) {
      long = hint('longLeg', `a${from.assignment.id}-a${to.assignment.id}:${cls}`, pd, {
        focus: { dayId: pd.day.id, placeIds: [from.placeId, to.placeId] },
        textKey: 'assistant.hint.longLeg',
        promptKey: 'assistant.hint.longLeg.prompt',
        params: { from: from.name, to: to.name, distance: formatDistance(km, ctx.input.distanceUnit) },
      });
    }
  }
  return [tight, long].filter((h): h is AssistantHint => h !== null);
}

/** Marks the nights from the day at `start` up to the one before `end`, by their place in the trip. */
function cover(nights: boolean[], start: number | undefined, end: number | undefined): void {
  if (start === undefined || end === undefined) return;
  for (let i = Math.max(start, 0); i < Math.min(end, nights.length); i++) nights[i] = true;
}

/**
 * Nights without a bed: the night after each day but the last, covered by a
 * stay or by a ride through it (night train, ferry, flight). Nights in a row
 * make one hint, and nights already past count as covered.
 */
function noStayHints(input: TripHintsInput): AssistantHint[] {
  const { days, accommodations } = input;
  if (!accommodations || days.length < 2) return [];
  const indexOf = new Map(days.map((d, i) => [d.id, i]));
  const covered = days.slice(0, -1).map((d) => !!d.date && d.date < input.today);
  for (const a of accommodations) cover(covered, indexOf.get(a.start_day_id), indexOf.get(a.end_day_id));
  for (const r of input.reservations) {
    if (!isLive(r) || !isCarrier(r) || r.day_id == null || r.end_day_id == null) continue;
    cover(covered, indexOf.get(r.day_id), indexOf.get(r.end_day_id));
  }
  const hints: AssistantHint[] = [];
  for (let i = 0; i < covered.length; i++) {
    if (covered[i]) continue;
    let nights = 1;
    while (i + nights < covered.length && !covered[i + nights]) nights++;
    const at = { day: days[i], index: i };
    const night = hint('noStay', String(nights), at, {
      focus: { dayId: at.day.id },
      textKey: 'assistant.hint.noStay',
      promptKey: 'assistant.hint.noStay.prompt',
      params: { count: nights },
    });
    hints.push(night);
    i += nights - 1;
  }
  return hints;
}

/**
 * Bookings that hang on no day, which the day view therefore never shows. One
 * names itself, and its day when its date is a day of the trip; several are
 * counted. A booking already behind the user is left alone.
 */
function unplacedHint(input: TripHintsInput): AssistantHint | null {
  const loose = input.reservations
    .filter((r) => isLive(r) && r.type !== 'hotel' && r.day_id == null && r.assignment_id == null)
    .map((r) => ({ r, date: splitReservationDateTime(r.reservation_time).date }))
    .filter(({ date }) => !date || date >= input.today);
  if (loose.length === 0) return null;
  const key = loose
    .map(({ r }) => r.id)
    .sort((a, b) => a - b)
    .join(',');
  const fields = { promptKey: 'assistant.hint.unplacedBooking.prompt' };
  if (loose.length > 1) {
    return hint('unplacedBooking', key, null, {
      ...fields,
      focus: null,
      textKey: 'assistant.hint.unplacedBookings',
      params: { count: loose.length },
    });
  }
  const { r, date } = loose[0];
  const index = date ? input.days.findIndex((d) => d.date === date) : -1;
  if (index < 0) {
    return hint('unplacedBooking', key, null, {
      ...fields,
      focus: null,
      textKey: 'assistant.hint.unplacedBooking',
      params: { title: r.title },
    });
  }
  const at = { day: input.days[index], index };
  return hint('unplacedBooking', key, at, {
    ...fields,
    focus: { dayId: at.day.id },
    textKey: 'assistant.hint.unplacedBookingDay',
    params: { title: r.title },
  });
}

function byWeight(a: AssistantHint, b: AssistantHint): number {
  if (a.level !== b.level) return a.level === 'warn' ? -1 : 1;
  const ai = a.dayIndex ?? Number.MAX_SAFE_INTEGER;
  const bi = b.dayIndex ?? Number.MAX_SAFE_INTEGER;
  if (ai !== bi) return ai - bi;
  return RULE_ORDER.indexOf(a.rule) - RULE_ORDER.indexOf(b.rule);
}

/** Every hint for the trip, warnings first, then by day and rule. */
export function tripHints(input: TripHintsInput): AssistantHint[] {
  const ctx: Ctx = { input, clock: (m) => formatClockTime(clockText(m), input.is12h) };
  const placesById = new Map(input.places.map((p) => [p.id, p]));
  const hints: AssistantHint[] = [];
  input.days.forEach((day, index) => {
    if (day.date && day.date < input.today) return;
    const pd = planDay(day, index, input, placesById);
    const overlap = overlapHint(pd);
    const gap = gapHint(pd, ctx);
    if (overlap) hints.push(overlap);
    hints.push(...hoursHints(pd, ctx), ...legHints(pd, ctx));
    if (gap) hints.push(gap);
  });
  hints.push(...noStayHints(input));
  const unplaced = unplacedHint(input);
  if (unplaced) hints.push(unplaced);
  return hints.sort(byWeight);
}
