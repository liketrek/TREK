import type { AnswerInput } from '../card-types';
import { clockOf, recordOf, type Row } from '../card-values';
import {
  climbOf,
  coord,
  dayNumberOf,
  fitted,
  latLngOf,
  lineOf,
  metresOf,
  minutesOf,
  roleAt,
  routeCard,
  rowsIn,
  sortedStops,
  stopName,
  stopOf,
  straightLine,
  whole,
  type RoutePoint,
} from './tour-card-values';
import {
  haversineMetres,
  skiColourSchemeSchema,
  skiRunDifficultySchema,
  skiSegmentKindSchema,
  TOUR_ROUTE_LIMITS,
  type TourRouteCard,
  type TourRouteStop,
  type TourRouteStretch,
} from '@trek/shared';

/**
 * The cards of the other ways an assistant plans: a city walk
 * (propose_city_walk), a paddle tour's legs (plan_paddle_route) and a ski
 * tour's legs (plan_ski_route), each drawn as one route. The legs of a plan
 * are joined into one line, each leg's stretches placed along the whole; a
 * leg that could not be planned is counted in a warning and leaves a gap.
 */

/** A station flagged by what goes wrong at it, the first conflict the proposal names. */
function flagOf(conflicts: unknown): TourRouteStop['flag'] {
  const first = Array.isArray(conflicts) ? conflicts[0] : null;
  if (first === 'late' || first === 'after_frame') return first;
  return typeof first === 'string' && first.startsWith('close') ? 'closed' : null;
}

/** Why a walk's way was estimated instead of planned, as the card names it; a router that did not answer else. */
const WALK_PROBLEMS: Readonly<Record<string, 'point_off_the_way' | 'ferry_only'>> = {
  station_off_the_way: 'point_off_the_way',
  ferry_only: 'ferry_only',
};

function walkProblem(estimate: Row): TourRouteCard['problem'] {
  const why = (typeof estimate.why === 'string' ? WALK_PROBLEMS[estimate.why] : undefined) ?? 'router_unavailable';
  return { why, position: whole(estimate.position, 1, 1_000), snappedM: null };
}

/** propose_city_walk: the stations in order with their times, the routed way when there is one. */
export function cityWalkCard({ value, args, card }: AnswerInput): TourRouteCard | null {
  const walk = recordOf(value);
  const stations = rowsIn(walk.stations).filter((station) => latLngOf(station) !== null);
  if (stations.length < 2) return null;
  const totals = recordOf(walk.totals);
  const frame = recordOf(walk.frame);
  let metres = 0;
  let minutes = 0;
  const stops = stations.map((station, index) => {
    const leg = recordOf(station.walk_from_previous);
    metres += metresOf(leg.metres) ?? 0;
    minutes += minutesOf(leg.minutes) ?? 0;
    return stopOf({
      role: roleAt(index, stations.length),
      kind: 'station',
      name: stopName(station.name),
      ...(latLngOf(station) ?? { lat: 0, lng: 0 }),
      atM: Math.min(metres, 5_000_000),
      minutes: Math.min(minutes, 86_400),
      clock: clockOf(station.arrival),
      stayMinutes: minutesOf(station.stay_minutes),
      flag: flagOf(station.conflicts),
    });
  });
  const routedLine = lineOf(walk.line_geometry);
  const routed = routedLine.length >= 2;
  const date = typeof walk.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(walk.date) ? walk.date : null;
  const dayId = whole(args.day_id, 1, Number.MAX_SAFE_INTEGER);
  const proposal = routeCard({
    source: 'proposal',
    activity: 'walk',
    distanceM: metresOf(totals.walk_m),
    minutes: minutesOf(totals.total_minutes),
    minutesBasis: 'stations',
    routed,
    problem: routed ? null : walkProblem(recordOf(walk.estimate)),
    line: routed ? routedLine : straightLine(stops),
    stops: sortedStops(stops),
    schedule: date
      ? {
          date,
          dayId,
          dayNumber: dayNumberOf(card, dayId),
          start: clockOf(frame.start_time),
          arrive: clockOf(totals.ends_at),
          nextDay: false,
          sunrise: null,
          sunset: null,
          latestStart: null,
          weather: null,
          hours: [],
        }
      : null,
  });
  return fitted(proposal);
}

/** A planned leg of a plan: its line for drawing, its length, its stretches along it. */
interface PlannedLeg {
  line: RoutePoint[];
  distanceM: number;
  segments: Row[];
  leg: Row;
}

/** The legs of a plan in order: the planned ones with their lines, null for each that failed. */
function legsOf(value: unknown): Array<PlannedLeg | null> {
  return rowsIn(recordOf(value).legs).map((leg) => {
    const line = lineOf(leg.line_geometry);
    if (leg.status !== 'ok' || line.length < 2) return null;
    return { line, distanceM: metresOf(leg.distance_m) ?? 0, segments: rowsIn(leg.segments), leg };
  });
}

/** One leg's stretches placed along the whole route. */
type StretchOf = (segment: Row, fromM: number, toM: number) => TourRouteStretch | null;

/** The metres straight between two points of a line. */
function straightBetween(a: RoutePoint, b: RoutePoint): number {
  return Math.round(haversineMetres(a[0], a[1], b[0], b[1]));
}

/**
 * The legs joined into one route: one line (heights kept only when every leg
 * has them), the stretches each leg names placed along the whole, the ends of
 * the legs as stops, and a warning counting the legs that failed. Where legs
 * failed between planned ones the line jumps straight from the last planned
 * end to the next planned start: that jump is marked as a gap and counted in
 * the length, so what follows sits where it lies along the line.
 */
function joined(args: Row, legs: Array<PlannedLeg | null>, stretchOf: StretchOf) {
  const asked = rowsIn(args.legs);
  const stretches: TourRouteStretch[] = [];
  const points: RoutePoint[] = [];
  const stops: TourRouteStop[] = [];
  let offset = 0;
  let failedSince = false;
  const lastPlanned = legs.reduce((last, leg, index) => (leg ? index : last), -1);
  const first = latLngOf(asked[0]?.from);
  if (first) stops.push(stopOf({ role: 'start', ...first, atM: 0 }));
  legs.forEach((planned, index) => {
    const lastEnd = points.at(-1);
    if (planned && lastEnd && failedSince) {
      const jump = straightBetween(lastEnd, planned.line[0] ?? lastEnd);
      const toM = Math.min(offset + jump, 5_000_000);
      stretches.push({ facet: 'mark', fromM: offset, toM, kind: 'gap' });
      offset = toM;
    }
    if (planned) {
      failedSince = false;
      points.push(...planned.line);
      for (const segment of planned.segments) {
        const fromM = metresOf(segment.from_m);
        const toM = metresOf(segment.to_m);
        if (fromM === null || toM === null) continue;
        const stretch = stretchOf(segment, Math.min(offset + fromM, 5_000_000), Math.min(offset + toM, 5_000_000));
        if (stretch) stretches.push(stretch);
      }
      offset = Math.min(offset + planned.distanceM, 5_000_000);
    } else {
      failedSince = true;
    }
    const end = latLngOf(asked[index]?.to);
    // The end of a failed leg between planned ones lies on the straight jump, as far along it as from where it starts.
    const pastEnd =
      !planned && index < lastPlanned && end && lastEnd ? straightBetween(lastEnd, [end.lat, end.lng, null]) : 0;
    const atM = Math.min(offset + pastEnd, 5_000_000);
    if (end) stops.push(stopOf({ role: index === legs.length - 1 ? 'end' : 'via', ...end, atM }));
  });
  const heights = points.every(([, , height]) => height !== null);
  const line = lineOf(
    points.map(([lat, lng, height]) => [coord(lat), coord(lng), heights ? height : null]),
    TOUR_ROUTE_LIMITS.line,
  );
  const failed = legs.filter((leg) => leg === null).length;
  return {
    line,
    distanceM: offset,
    stretches: mergedStretches(stretches),
    stops: sortedStops(stops),
    warnings: failed > 0 ? [{ kind: 'legs_failed' as const, at: null, count: Math.min(failed, 50) }] : [],
  };
}

/** Stretches of one kind that run on into each other joined, at most the card's share. */
function mergedStretches(stretches: readonly TourRouteStretch[]): TourRouteStretch[] {
  const merged: TourRouteStretch[] = [];
  for (const stretch of stretches) {
    const last = merged.at(-1);
    if (last && sameKind(last, stretch) && stretch.fromM <= last.toM) last.toM = Math.max(last.toM, stretch.toM);
    else merged.push({ ...stretch });
  }
  return merged.slice(0, TOUR_ROUTE_LIMITS.stretches);
}

function sameKind(a: TourRouteStretch, b: TourRouteStretch): boolean {
  if (a.facet === 'ski' && b.facet === 'ski') return a.kind === b.kind && a.difficulty === b.difficulty;
  if (a.facet === 'mark' && b.facet === 'mark') return a.kind === b.kind;
  return false;
}

const PADDLE_MARKS: Readonly<Record<string, 'portage' | 'rapids' | 'gap'>> = {
  portage: 'portage',
  rapids: 'rapids',
  gap: 'gap',
};

/** plan_paddle_route: the legs on the water as one route, carried and rough stretches marked. */
export function paddleCard({ value, args }: AnswerInput): TourRouteCard | null {
  const legs = legsOf(value);
  if (!legs.some((leg) => leg !== null)) return null;
  const route = joined(args, legs, (segment, fromM, toM) => {
    const kind = typeof segment.kind === 'string' ? PADDLE_MARKS[segment.kind] : undefined;
    return kind ? { facet: 'mark', fromM, toM, kind } : null;
  });
  if (route.line.length < 2) return null;
  return fitted(routeCard({ source: 'plan', activity: 'kayak', routed: true, ...route }));
}

/** The ways up and down a ski area that are no run: drawn dotted as lifts. */
const LIFTS: ReadonlySet<string> = new Set(['lift', 'lift_down', 'rail']);

/** plan_ski_route: the legs on runs, trails and lifts as one route, with their figures and the area's colours. */
export function skiCard({ value, args }: AnswerInput): TourRouteCard | null {
  const plan = recordOf(value);
  const legs = legsOf(plan);
  const planned = legs.filter((leg): leg is PlannedLeg => leg !== null);
  if (planned.length === 0) return null;
  const route = joined(args, legs, (segment, fromM, toM) => {
    if (typeof segment.kind === 'string' && LIFTS.has(segment.kind)) return { facet: 'mark', fromM, toM, kind: 'lift' };
    const kind = skiSegmentKindSchema.safeParse(segment.kind);
    if (!kind.success) return null;
    const difficulty = skiRunDifficultySchema.safeParse(segment.difficulty);
    return { facet: 'ski', fromM, toM, kind: kind.data, difficulty: difficulty.success ? difficulty.data : null };
  });
  if (route.line.length < 2) return null;
  const sum = (read: (leg: Row) => unknown) => planned.reduce((total, { leg }) => total + (Number(read(leg)) || 0), 0);
  const seconds = sum((leg) => {
    const parts = recordOf(leg.seconds);
    return (Number(parts.ski) || 0) + (Number(parts.lift) || 0) + (Number(parts.wait) || 0) + (Number(parts.walk) || 0);
  });
  const heights = route.line.map(([, , height]) => height).filter((height): height is number => height !== null);
  const scheme = skiColourSchemeSchema.safeParse(plan.colour_scheme);
  const ski = routeCard({
    source: 'plan',
    activity: 'ski',
    ascentM: climbOf(sum((leg) => leg.climb_m)),
    descentM: climbOf(sum((leg) => leg.descent_m)),
    minEleM: heights.length === route.line.length ? Math.min(...heights) : null,
    maxEleM: heights.length === route.line.length ? Math.max(...heights) : null,
    minutes: minutesOf(seconds / 60),
    minutesBasis: 'piste',
    routed: true,
    skiScheme: scheme.success ? scheme.data : null,
    ...route,
  });
  return fitted(ski);
}
