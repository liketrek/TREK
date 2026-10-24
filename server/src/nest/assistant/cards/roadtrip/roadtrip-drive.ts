import type { AnswerInput } from '../card-types';
import { clipped, clockOf, finite, isLat, isLng, recordOf, type Row } from '../card-values';
import { drivenLines, linePointsOf, roundPoint, thinLine, type GapStop, type LatLng } from './roadtrip-geometry';
import {
  MAX_CARD_CHARS,
  MAX_TRIP_DAYS,
  ROADTRIP_CARD_DAY_LINES_MAX,
  ROADTRIP_CARD_DAYS_MAX,
  ROADTRIP_CARD_LINE_POINTS_MAX,
  ROADTRIP_CARD_POINTS_MAX,
  ROADTRIP_CARD_STOPS_MAX,
  roadtripStopTypeSchema,
  type RoadtripCard,
  type RoadtripCardDay,
  type RoadtripCardStop,
} from '@trek/shared';

/**
 * The card of calculate_roadtrip: the drive as the planner's rail shows it,
 * built from the tool's raw answer (with its geometry, which the provider
 * never sees). A trip too long for one card keeps its first days and the
 * lines of the drive are thinned until the card fits; the rows of the days
 * it keeps are the planner's rows, never a summary of them. Lines give way
 * to days only when not even one day fits with them.
 */

/** Room the card leaves under the cap for the envelope it is stored in. */
const BUDGET = MAX_CARD_CHARS - 400;
/**
 * The point budgets a card tries, in rounds: every day count with lines first,
 * from the most points to a floor, and only then without lines at all. A day's
 * stops cost far more room than its lines, so dropping the lines first would
 * keep one more day and lose the drive the map draws on hover for all of them.
 */
const POINT_ROUNDS = [[ROADTRIP_CARD_POINTS_MAX, ROADTRIP_CARD_POINTS_MAX / 2, ROADTRIP_CARD_POINTS_MAX / 4], [0]];

function rows(value: unknown): Row[] {
  return Array.isArray(value) ? value.map(recordOf) : [];
}

function positiveId(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

/** A whole number in `[min, max]`, rounded; null for anything that is not a number. */
function wholeIn(value: unknown, min: number, max: number): number | null {
  const number = finite(value);
  return number === null ? null : Math.min(max, Math.max(min, Math.round(number)));
}

function within(value: unknown, max: number): number {
  return Math.min(max, Math.max(0, finite(value) ?? 0));
}

function carrierOf(raw: unknown): RoadtripCardStop['carrier'] {
  const carrier = recordOf(raw);
  const reservationId = positiveId(carrier.reservationId);
  const type = clipped(carrier.type, 20);
  const role = carrier.role;
  if (!reservationId || !type) return null;
  if (role !== 'departure' && role !== 'arrival' && role !== 'pickup' && role !== 'return') return null;
  return {
    reservationId,
    type,
    role,
    title: clipped(carrier.title, 80) ?? type,
    code: clipped(carrier.code, 8),
    at: clockOf(carrier.at),
  };
}

function bookendOf(raw: unknown): RoadtripCardStop['bookend'] {
  const bookend = recordOf(raw);
  if (bookend.phase !== 'morning' && bookend.phase !== 'evening') return null;
  return {
    phase: bookend.phase,
    reservationId: positiveId(bookend.reservationId),
    checkingIn: bookend.checkingIn === true,
    checkingOut: bookend.checkingOut === true,
    checkIn: clockOf(bookend.checkIn),
    checkOut: clockOf(bookend.checkOut),
  };
}

function autoNightOf(raw: unknown): RoadtripCardStop['autoNight'] {
  const night = recordOf(raw);
  const fromDayNumber = wholeIn(night.fromDayNumber, 1, MAX_TRIP_DAYS);
  if ((night.phase !== 'start' && night.phase !== 'end') || fromDayNumber === null) return null;
  return { phase: night.phase, fromDayNumber };
}

/** What the schedule says about the stop at `index`: its entry, how late it is reached, what the drive out finds. */
interface StopSchedule {
  entries: Row[];
  warnings: Row[];
  driveWarnings: Row[];
}

function lateAt(schedule: StopSchedule, index: number): RoadtripCardStop['late'] {
  return schedule.warnings
    .filter((w) => w.index === index && (w.code === 'late' || w.code === 'missedLeave'))
    .slice(0, 2)
    .map((w): RoadtripCardStop['late'][number] => ({
      code: w.code === 'late' ? 'late' : 'missedLeave',
      minutes: wholeIn(w.minutes, 0, 100_000) ?? 0,
    }));
}

function findingsAt(schedule: StopSchedule, index: number): RoadtripCardStop['findings'] {
  return schedule.driveWarnings
    .filter((w) => w.index === index && (w.code === 'leg' || w.code === 'range'))
    .slice(0, 2)
    .map((w): RoadtripCardStop['findings'][number] => {
      const sinceKm = finite(w.sinceKm);
      return {
        code: w.code === 'leg' ? 'leg' : 'range',
        overMinutes: wholeIn(w.overMinutes, 0, 100_000),
        sinceKm: sinceKm === null ? null : Math.round(Math.min(40_000, Math.max(0, sinceKm)) * 10) / 10,
      };
    });
}

/** One stop of the rail; null for one without a position, which ends the day's list there. */
function stopOf(raw: Row, index: number, schedule: StopSchedule): RoadtripCardStop | null {
  const lat = finite(raw.lat);
  const lng = finite(raw.lng);
  if (!isLat(lat) || !isLng(lng)) return null;
  const carrier = carrierOf(raw.carrier);
  const name = clipped(raw.name, 80) ?? carrier?.title;
  if (!name) return null;
  const entry = recordOf(schedule.entries[index]);
  const stopType = roadtripStopTypeSchema.safeParse(raw.stopType);
  return {
    placeId: positiveId(raw.placeId),
    assignmentId: positiveId(raw.assignmentId),
    name,
    lat: Math.round(lat * 1e5) / 1e5,
    lng: Math.round(lng * 1e5) / 1e5,
    stopType: stopType.success ? stopType.data : null,
    time: clockOf(raw.time),
    leaveAt: clockOf(raw.leaveAt),
    dwellMinutes: wholeIn(raw.dwellMinutes, 0, 10_080),
    offRoadM: wholeIn(raw.offRoadMeters, 0, 100_000),
    fillPercent: wholeIn(raw.fillPercent, 0, 100),
    night: raw.night === true ? { checkIn: clockOf(raw.checkInTime) } : null,
    autoNight: autoNightOf(raw.automaticNight),
    bookend: bookendOf(raw.bookend),
    carrier,
    arrival: clockOf(entry.arrival),
    departure: clockOf(entry.departure),
    anchored: entry.anchored === true,
    dayOffset: wholeIn(entry.dayOffset, 0, 60) ?? 0,
    late: lateAt(schedule, index),
    findings: findingsAt(schedule, index),
  };
}

/** A day as the card holds it, before its lines are fitted, with the driven pieces to fit them from. */
interface DraftDay {
  day: Omit<RoadtripCardDay, 'lines'>;
  pieces: LatLng[][];
}

function legOf(raw: unknown): RoadtripCardDay['legs'][number] {
  if (!raw || typeof raw !== 'object') return null;
  const leg = recordOf(raw);
  const distance = finite(leg.distance);
  const duration = finite(leg.duration);
  if (distance === null || duration === null) return null;
  return {
    distanceM: within(distance, 5e7),
    durationS: within(duration, 1e7),
    mode: clipped(leg.mode, 40) ?? 'driving',
  };
}

function gapStopOf(raw: Row): GapStop | null {
  const lat = finite(raw.lat);
  const lng = finite(raw.lng);
  if (!isLat(lat) || !isLng(lng)) return null;
  const carrier = recordOf(raw.carrier);
  const reservationId = positiveId(carrier.reservationId);
  const role = carrier.role;
  if (!reservationId || (role !== 'departure' && role !== 'arrival' && role !== 'pickup' && role !== 'return')) {
    return { lat, lng };
  }
  const type = typeof carrier.type === 'string' ? carrier.type : '';
  return { lat, lng, carrier: { reservationId, type, role, title: '', code: null, at: null } };
}

function draftDay(raw: Row): DraftDay | null {
  const dayId = positiveId(raw.dayId);
  const dayNumber = wholeIn(raw.dayNumber, 1, MAX_TRIP_DAYS);
  if (!dayId || dayNumber === null) return null;
  const schedule = recordOf(raw.schedule);
  const timing: StopSchedule = {
    entries: rows(schedule.entries),
    warnings: rows(schedule.warnings),
    driveWarnings: rows(raw.driveWarnings),
  };
  const rawStops = rows(raw.stops);
  const stops: RoadtripCardStop[] = [];
  for (const [index, stop] of rawStops.entries()) {
    if (stops.length >= ROADTRIP_CARD_STOPS_MAX) break;
    const shown = stopOf(stop, index, timing);
    if (!shown) break;
    stops.push(shown);
  }
  const rawLegs: unknown[] = Array.isArray(raw.legs) ? raw.legs : [];
  const dayWarning = recordOf(raw.dayWarning);
  const dayOverMinutes = wholeIn(dayWarning.minutes, 0, 100_000);
  const limitMinutes = wholeIn(dayWarning.limitMinutes, 1, 1440);
  const dry = finite(rows(raw.dryPoints)[0]?.sinceKm);
  const avoided: unknown[] = Array.isArray(raw.avoidMissed) ? raw.avoidMissed : [];
  const gapStops = rawStops.flatMap((stop) => {
    const gap = gapStopOf(stop);
    return gap ? [gap] : [];
  });
  return {
    day: {
      dayId,
      dayNumber,
      date: typeof raw.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : null,
      title: clipped(raw.title, 80),
      distanceM: within(raw.distanceMetres, 5e7),
      durationS: within(raw.durationSeconds, 1e7),
      stops,
      moreStops: Math.min(1000, Math.max(0, rawStops.length - stops.length)),
      legs: stops.slice(1).map((_, index) => legOf(rawLegs[index])),
      dayOver: dayOverMinutes !== null && limitMinutes !== null ? { minutes: dayOverMinutes, limitMinutes } : null,
      avoidMissed: [...new Set(avoided.filter(isAvoidClass))],
      dryKm: dry === null ? null : Math.round(Math.min(40_000, Math.max(0, dry)) * 10) / 10,
    },
    pieces: drivenLines(linePointsOf(raw.geometry), gapStops).slice(0, ROADTRIP_CARD_DAY_LINES_MAX),
  };
}

const AVOID_CLASSES: readonly unknown[] = ['motorway', 'toll', 'ferry'];

function isAvoidClass(value: unknown): value is RoadtripCardDay['avoidMissed'][number] {
  return AVOID_CLASSES.includes(value);
}

function problemOf(value: Row): RoadtripCard['problem'] {
  if (rows(value.failures).length > 0) return 'routing';
  if (Array.isArray(value.omittedVisitIds) && value.omittedVisitIds.length > 0) return 'coordinates';
  return value.dayWindowIssue ? 'dayWindow' : null;
}

/** A piece thinned to so many points, each thinning made once however often the card is fitted again. */
type Thinned = (piece: LatLng[], points: number) => [number, number][];

function thinnedOnce(): Thinned {
  const made = new Map<LatLng[], Map<number, [number, number][]>>();
  return (piece, points) => {
    const byPoints = made.get(piece) ?? new Map<number, [number, number][]>();
    made.set(piece, byPoints);
    let line = byPoints.get(points);
    if (!line) {
      line = thinLine(piece, points).map(roundPoint);
      byPoints.set(points, line);
    }
    return line;
  };
}

/** The card with the first `days` days and their lines fitted into `points` points. */
function cardWith(
  base: Omit<RoadtripCard, 'days' | 'moreDays'>,
  drafts: DraftDay[],
  fit: { days: number; points: number; thinned: Thinned },
): RoadtripCard {
  const kept = drafts.slice(0, fit.days);
  const pieceCount = kept.reduce((sum, draft) => sum + draft.pieces.length, 0);
  const perLine = pieceCount === 0 ? 0 : Math.min(ROADTRIP_CARD_LINE_POINTS_MAX, Math.floor(fit.points / pieceCount));
  return {
    ...base,
    days: kept.map(({ day, pieces }) => ({
      ...day,
      lines: perLine < 2 ? [] : pieces.map((piece) => fit.thinned(piece, perLine)),
    })),
    moreDays: Math.min(1000, drafts.length - kept.length),
  };
}

/** calculate_roadtrip's answer as a card, fitted under the size cap; null for a drive with no day to show. */
export function roadtripAnswerCard({ args, value }: AnswerInput): RoadtripCard | null {
  const answer = recordOf(value);
  const drafts = rows(answer.days).flatMap((day) => {
    const draft = draftDay(day);
    return draft ? [draft] : [];
  });
  if (drafts.length === 0) return null;
  const settings = recordOf(answer.settings);
  const vehicle = settings.roadtrip_vehicle;
  const allStops = rows(answer.days).flatMap((day) => rows(day.stops));
  const base: Omit<RoadtripCard, 'days' | 'moreDays'> = {
    kind: 'roadtrip',
    complete: answer.complete === true,
    problem: problemOf(answer),
    previewKeys: Object.keys(recordOf(args.settings))
      .filter((key) => /^roadtrip_[a-z0-9_]{1,40}$/.test(key))
      .slice(0, 12),
    vehicle: vehicle === 'combustion' || vehicle === 'electric' ? vehicle : null,
    defaultFill: wholeIn(settings.roadtrip_fill_percent, 0, 100) || null,
    dayColors: settings.roadtrip_day_colors === true,
    distanceM: within(answer.totalDistanceMetres, 5e7),
    durationS: within(answer.totalDurationSeconds, 1e7),
    stopCount: wholeIn(answer.totalStops, 0, 10_000) ?? 0,
    chargingCount: Math.min(10_000, allStops.filter((stop) => stop.stopType === 'charging').length),
    quietDays: Math.min(1000, rows(answer.quietDays).length),
    undatedRides: Math.min(100, rows(answer.undatedRides).length),
  };
  return fitted(base, drafts);
}

/** The card with the most days and points that fits under the cap, lines kept as long as one day fits with them. */
function fitted(base: Omit<RoadtripCard, 'days' | 'moreDays'>, drafts: DraftDay[]): RoadtripCard | null {
  const thinned = thinnedOnce();
  for (const steps of POINT_ROUNDS) {
    for (let days = Math.min(ROADTRIP_CARD_DAYS_MAX, drafts.length); days >= 1; days -= 1) {
      for (const points of steps) {
        const card = cardWith(base, drafts, { days, points, thinned });
        if (JSON.stringify(card).length <= BUDGET) return card;
      }
    }
  }
  return null;
}
