import type { TripCard } from '../../assistant-context';
import type { AnswerInput } from '../card-types';
import { clipped, clockOf, finite, recordOf, type Row } from '../card-values';
import {
  climbOf,
  clockAfter,
  dayNumberOf,
  fitted,
  hardestStretches,
  heightOf,
  heightRange,
  latLngOf,
  lineOf,
  metresOf,
  minutesOf,
  near,
  poiCategoryOf,
  roleAt,
  routeCard,
  rowsIn,
  sacStepOf,
  sortedStops,
  stopName,
  stopOf,
  straightLine,
  straightMetres,
  whole,
  type RoutePoint,
} from './tour-card-values';
import {
  cumulativeMetres,
  HIKE_UNROUTED_REASONS,
  legMinutes,
  nearestAlongM,
  TOUR_ROUTE_LIMITS,
  TOUR_WARNING_KINDS,
  tourTypeKeySchema,
  type TourRouteCard,
  type TourRouteSchedule,
  type TourRouteStop,
  type TourRouteStretch,
} from '@trek/shared';

/**
 * The cards of a hike the assistant proposed (propose_hike) and of a saved
 * tour it read (get_tour_plan), built from the tool's raw answer. A proposal
 * draws its line only when the tool added it for drawing (the assistant
 * always asks), so without `line_geometry` there is no card. A way that was
 * not planned is drawn straight between the points it was asked through,
 * with the reason.
 */

/** How close a summit along the way must lie to the highest point to stand for it. */
const SAME_SUMMIT_M = 150;
/** How close a saved tour's last point must lie to the end of its line to be that end (a loop's included). */
const LOOP_END_M = 60;

const UNROUTED: ReadonlySet<string> = new Set(HIKE_UNROUTED_REASONS);
const WARNINGS: ReadonlySet<string> = new Set(TOUR_WARNING_KINDS);

/** Graded stretches merged where the step repeats, at most the card's share, the hardest kept. */
export function sacStretches(segments: unknown): TourRouteStretch[] {
  const merged: Array<Extract<TourRouteStretch, { facet: 'sac' }>> = [];
  for (const segment of rowsIn(segments)) {
    const step = sacStepOf(segment.sac);
    const fromM = metresOf(segment.from_m);
    const toM = metresOf(segment.to_m);
    if (step === null || fromM === null || toM === null || toM < fromM) continue;
    const last = merged.at(-1);
    if (last && last.step === step && fromM <= last.toM) last.toM = Math.max(last.toM, toM);
    else merged.push({ facet: 'sac', fromM, toM, step });
  }
  return hardestStretches(merged, TOUR_ROUTE_LIMITS.stretches);
}

/** The walking minutes to a spot along the way, read between the points whose minutes are known. */
function minutesAt(stops: readonly TourRouteStop[], atM: number): number | null {
  const timed = stops.filter((stop) => stop.minutes !== null);
  const after = timed.findIndex((stop) => stop.atM >= atM);
  if (after < 0) return null;
  const b = timed[after];
  const a = after > 0 ? timed[after - 1] : null;
  if (!b || b.minutes === null) return null;
  if (!a || a.minutes === null || b.atM === a.atM) return b.atM === atM ? b.minutes : null;
  return Math.round(a.minutes + ((b.minutes - a.minutes) * (atM - a.atM)) / (b.atM - a.atM));
}

/** The day of a proposal: its date, sun, weather by the hour; null without a date. */
function scheduleOf(value: unknown, card: TripCard): TourRouteSchedule | null {
  const schedule = recordOf(value);
  const date = typeof schedule.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(schedule.date) ? schedule.date : null;
  if (!date) return null;
  const dayId = whole(schedule.day_id, 1, Number.MAX_SAFE_INTEGER);
  const hours = rowsIn(schedule.hours).flatMap((hour) => {
    const at = whole(hour.hour, 0, 23);
    const main = clipped(hour.main, 20);
    const tempC = whole(hour.temp_c, -80, 60);
    if (at === null || !main || tempC === null) return [];
    return [{ hour: at, main, tempC, rainPct: whole(hour.rain_pct, 0, 100), windKmh: whole(hour.wind_kmh, 0, 400) }];
  });
  return {
    date,
    dayId,
    dayNumber: dayNumberOf(card, dayId),
    start: clockOf(schedule.start),
    arrive: clockOf(schedule.arrive),
    nextDay: schedule.next_day === true,
    sunrise: clockOf(schedule.sunrise),
    sunset: clockOf(schedule.sunset),
    latestStart: clockOf(schedule.latest_start),
    weather: schedule.weather === 'forecast' || schedule.weather === 'climate' ? schedule.weather : null,
    hours: hours.slice(0, TOUR_ROUTE_LIMITS.hours),
  };
}

/** What to look out for, as the proposal names it. */
function warningsOf(value: unknown): TourRouteCard['warnings'] {
  return rowsIn(value)
    .flatMap((warning): TourRouteCard['warnings'] => {
      const kind = typeof warning.kind === 'string' && WARNINGS.has(warning.kind) ? warning.kind : null;
      if (!kind) return [];
      return [{ kind: kind as TourRouteCard['warnings'][number]['kind'], at: clockOf(warning.at), count: null }];
    })
    .slice(0, TOUR_ROUTE_LIMITS.warnings);
}

/** The points a proposal was asked through, as stops. */
function waypointStops(waypoints: readonly Row[], start: string | null): TourRouteStop[] {
  return waypoints.flatMap((point, index) => {
    const at = latLngOf(point);
    if (!at) return [];
    const minutes = minutesOf(point.minutes);
    return [
      stopOf({
        role: roleAt(index, waypoints.length),
        kind: poiCategoryOf(point.poi_category),
        name: stopName(point.name),
        ...at,
        atM: metresOf(point.at_m) ?? 0,
        minutes,
        clock: clockOf(point.arrival) ?? clockAfter(start, minutes),
      }),
    ];
  });
}

/** The places along a proposed way and its highest point, timed between the points around them. */
function alongStops(value: Row, own: readonly TourRouteStop[], start: string | null): TourRouteStop[] {
  const along = rowsIn(value.along)
    .slice(0, TOUR_ROUTE_LIMITS.along)
    .flatMap((place) => {
      const at = latLngOf(place);
      const atM = metresOf(place.at_m);
      if (!at || atM === null) return [];
      const offM = whole(place.off_m, 0, Number.MAX_SAFE_INTEGER);
      return [
        stopOf({
          role: 'along',
          kind: poiCategoryOf(place.category),
          name: stopName(place.name),
          ...at,
          atM,
          offM: offM === null ? null : Math.min(offM, 2_000),
        }),
      ];
    });
  const high = recordOf(value.high_point);
  const top = latLngOf(high);
  const topAt = metresOf(high.at_m);
  const summit = [...own, ...along].some(
    (stop) => stop.kind === 'peak' && top !== null && near(stop, top, SAME_SUMMIT_M),
  );
  const highest =
    top && topAt !== null && !summit ? [stopOf({ role: 'along', kind: 'highest', ...top, atM: topAt })] : [];
  return [...along, ...highest].map((stop) => {
    const minutes = minutesAt(own, stop.atM);
    return { ...stop, minutes, clock: clockAfter(start, minutes) };
  });
}

/** A proposal whose way was not planned: its points joined straight, with why. */
function unroutedHike(value: Row, args: Row, source: TourRouteCard['source']): TourRouteCard | null {
  const asked = rowsIn(value.waypoints).length > 0 ? rowsIn(value.waypoints) : rowsIn(args.waypoints);
  const points = asked.flatMap((point) => {
    const at = latLngOf(point);
    return at ? [{ ...at, name: stopName(point.name), kind: poiCategoryOf(point.poi_category) }] : [];
  });
  if (points.length < 2) return null;
  const route = recordOf(value.route);
  const unreachable = recordOf(value.unreachable);
  const why = typeof route.why === 'string' && UNROUTED.has(route.why) ? route.why : 'not_planned';
  const along = straightMetres(points);
  return routeCard({
    source,
    activity: 'hike',
    name: clipped(value.name ?? args.name, 120),
    label: clipped(value.variant_label ?? args.variant_label, 40),
    limit: sacStepOf(value.max_hiking_difficulty ?? args.max_hiking_difficulty),
    routed: false,
    problem: {
      why: why as NonNullable<TourRouteCard['problem']>['why'],
      position: whole(route.position, 1, 1_000),
      snappedM: whole(unreachable.snapped_m, 0, 1_000_000),
    },
    line: straightLine(points),
    stops: sortedStops(
      points.map((point, index) =>
        stopOf({ role: roleAt(index, points.length), ...point, atM: Math.min(along[index] ?? 0, 5_000_000) }),
      ),
    ),
  });
}

/**
 * The card of a hike proposal: the way with its figures, grades, stops and
 * day. `source` is `pending` when it shows a held create of the same hike.
 */
export function hikeCard(
  value: unknown,
  args: Row,
  card: TripCard,
  source: TourRouteCard['source'],
): TourRouteCard | null {
  const plan = recordOf(value);
  if (recordOf(plan.route).planned !== true) return unroutedHike(plan, args, source);
  const line = lineOf(plan.line_geometry);
  if (line.length < 2) return null;
  const sac = plan.sac === null || plan.sac === undefined ? null : recordOf(plan.sac);
  const start = clockOf(plan.start_time);
  const own = waypointStops(rowsIn(plan.waypoints), start);
  const basis = plan.duration_basis === 'din33466' || plan.duration_basis === 'router' ? plan.duration_basis : null;
  const unknown = finite(sac?.unknown_share);
  return routeCard({
    source,
    activity: 'hike',
    name: clipped(plan.name, 120),
    label: clipped(plan.variant_label, 40),
    distanceM: metresOf(plan.distance_m),
    ascentM: climbOf(plan.ascent_m),
    descentM: climbOf(plan.descent_m),
    minEleM: heightOf(plan.min_ele_m),
    maxEleM: heightOf(plan.max_ele_m),
    minutes: minutesOf(plan.duration_minutes),
    minutesBasis: basis,
    limit: sacStepOf(plan.max_hiking_difficulty),
    grades: sac ? { highest: sacStepOf(sac.highest), unknownShare: Math.min(1, Math.max(0, unknown ?? 0)) } : null,
    routed: true,
    line,
    stretches: sacStretches(sac?.segments),
    stops: sortedStops([...own, ...alongStops(plan, own, start)]),
    schedule: scheduleOf(plan.schedule, card),
    warnings: warningsOf(plan.warnings),
  });
}

/** propose_hike: the proposal as a card. */
export function proposalCard({ value, args, card }: AnswerInput): TourRouteCard | null {
  const proposal = hikeCard(value, args, card, 'proposal');
  return proposal ? fitted(proposal) : null;
}

/**
 * The control points of a saved tour (a city walk's stations), placed along
 * its line and timed by the signposts' rule; shaping points are left out.
 */
function savedStops(
  waypoints: readonly Row[],
  line: readonly RoutePoint[],
  total: number | null,
  walk: boolean,
): TourRouteStop[] {
  const points = waypoints.filter((point) => point.shaping !== true && latLngOf(point) !== null);
  const length = line.length >= 2 ? (cumulativeMetres(line).at(-1) ?? 0) : 0;
  const end = line.at(-1);
  // A tour still waiting for its way: its points lie along the straight line between them.
  const straight = line.length < 2 ? straightMetres(points.flatMap((point) => latLngOf(point) ?? [])) : null;
  const atMs = points.map((point, index) => {
    const at = latLngOf(point);
    if (straight) return straight[index] ?? 0;
    if (!at) return 0;
    // A loop ends where it started: its end lies at the end of the line, not at its first pass.
    if (index === points.length - 1 && end && near(at, { lat: end[0], lng: end[1] }, LOOP_END_M)) {
      return Math.round(length);
    }
    return Math.round(nearestAlongM(line, at.lat, at.lng));
  });
  const legs = total !== null && line.length >= 2 && points.length >= 2 ? legMinutes(line, atMs, total) : null;
  let walked = 0;
  return points.map((point, index) => {
    const at = latLngOf(point) ?? { lat: 0, lng: 0 };
    if (index > 0 && legs) walked += legs[index - 1] ?? 0;
    return stopOf({
      role: roleAt(index, points.length),
      kind: walk ? 'station' : poiCategoryOf(point.poi_category),
      name: stopName(point.name ?? point.linked_place_name),
      ...at,
      atM: Math.min(atMs[index] ?? 0, 5_000_000),
      minutes: legs ? walked : null,
      stayMinutes: minutesOf(point.stay_minutes),
      stageEnd: point.stage_end === true,
    });
  });
}

/** get_tour_plan: a saved tour of the trip as a card, its line the saved one in brief. */
export function savedTourCard({ value }: AnswerInput): TourRouteCard | null {
  const plan = recordOf(value);
  const tour = recordOf(plan.tour);
  const activity = tourTypeKeySchema.safeParse(tour.tour_type);
  const placeId = whole(tour.place_id, 1, Number.MAX_SAFE_INTEGER);
  if (!activity.success || placeId === null) return null;
  const saved = lineOf(recordOf(plan.line).preview);
  const waypoints = rowsIn(plan.waypoints);
  const planned = minutesOf(tour.planned_duration_minutes);
  const minutes = planned ?? minutesOf(tour.duration);
  const distance = finite(tour.distance);
  const routed = saved.length >= 2;
  const line = routed ? saved : straightLine(waypoints.flatMap((point) => latLngOf(point) ?? []));
  if (line.length < 2) return null;
  const heights = heightRange(line);
  const walked = routed ? (minutesOf(tour.duration) ?? minutes) : null;
  const stops = savedStops(waypoints, routed ? line : [], walked, activity.data === 'walk');
  return fitted(
    routeCard({
      source: 'saved',
      activity: activity.data,
      placeId,
      name: clipped(tour.name, 120),
      distanceM: distance === null ? null : metresOf(distance * 1000),
      ascentM: climbOf(tour.elevation_gain),
      descentM: climbOf(tour.elevation_loss),
      minEleM: heights.min,
      maxEleM: heights.max,
      minutes,
      minutesBasis: minutes === null ? null : 'planned',
      limit: sacStepOf(tour.max_hiking_difficulty),
      routed,
      problem: routed ? null : { why: 'not_planned', position: null, snappedM: null },
      line,
      stops: sortedStops(stops),
      stages: whole(tour.stage_count, 2, 60),
    }),
  );
}
