import type { CardReader, PreviewContext, ToolArgs } from '../card-types';
import { canonicalJson, clipped, finite, recordOf, type Row } from '../card-values';
import {
  argText,
  climbOf,
  fitted,
  latLngOf,
  lineOf,
  metresOf,
  minutesOf,
  roleAt,
  routeCard,
  rowsIn,
  sacStepOf,
  sortedStops,
  stopOf,
  straightLine,
  straightMetres,
  whole,
} from './tour-card-values';
import { hikeCard } from './tour-route.cards';
import {
  hikingPreferencesOf,
  TOUR_ROUTE_LIMITS,
  TOURS_MAX_HIKING_DIFFICULTY,
  type AssistantChangeEffect,
  type AssistantChangePreview,
  type HikingPreferences,
  type TourRouteCard,
} from '@trek/shared';

/**
 * The cards inside the change cards of the tours: a held create_hike shows
 * the way the proposal of the same points showed (the planner keeps the
 * plan for a quarter of an hour, so the saved line is that line), a held
 * create_city_walk its stations joined straight (its way is planned on
 * save), a held update_tour the new way beside the one it replaces. A way
 * that could not be planned now is drawn straight with the reason.
 */

/** What a held hike change looked up: the plan of its way, and for a change the saved tour it changes. */
export interface TourLoaded {
  plan: unknown;
  saved: unknown;
}

/** The fields propose_hike takes of a create_hike, without the places along the way the change card does not show. */
const PLAN_FIELDS = ['name', 'waypoints', 'max_hiking_difficulty', 'hiking_preferences', 'round_trip'] as const;

/** The proposal a held create_hike stands for: the same points, limit, preferences and day. */
export function planArgsOf(args: ToolArgs): ToolArgs {
  const plan: ToolArgs = { along: false };
  for (const key of [...PLAN_FIELDS, 'day_id', 'start_time'] as const) {
    if (args[key] !== undefined) plan[key] = args[key];
  }
  return plan;
}

/** create_hike: plans the way through the points (a proposal of a moment ago is answered from the planner's memo). */
export async function loadCreateHike(args: ToolArgs, read: CardReader): Promise<TourLoaded> {
  return { plan: await read('propose_hike', planArgsOf(args)), saved: null };
}

/** A saved hike's limit and preferences, as update_tour keeps them when the change does not name them. */
function keptSettings(tour: Row): { limit: number; preferences: HikingPreferences | null } {
  const limit = sacStepOf(tour.max_hiking_difficulty) ?? TOURS_MAX_HIKING_DIFFICULTY;
  return { limit, preferences: hikingPreferencesOf(recordOf(tour.hiking_preferences) as HikingPreferences) };
}

/**
 * Whether update_tour plans the hike's way anew, as it decides: new points,
 * a hike without a line yet, or a limit or preferences other than the saved.
 */
export function replans(args: ToolArgs, saved: unknown): boolean {
  const plan = recordOf(saved);
  const kept = keptSettings(recordOf(plan.tour));
  const limit = sacStepOf(args.max_hiking_difficulty) ?? kept.limit;
  const preferences =
    args.hiking_preferences === undefined
      ? kept.preferences
      : hikingPreferencesOf(recordOf(args.hiking_preferences) as HikingPreferences);
  return (
    args.waypoints !== undefined ||
    plan.line === null ||
    limit !== kept.limit ||
    canonicalJson(preferences) !== canonicalJson(kept.preferences)
  );
}

/**
 * update_tour: the saved tour, and where the change plans the way anew the
 * way it will plan, through the new points or the saved ones under the saved
 * limit and preferences where the change leaves them, so the planner's memo
 * answers it and the card shows the line the change will save.
 */
export async function loadUpdateTour(args: ToolArgs, read: CardReader): Promise<TourLoaded | null> {
  const placeId = whole(args.placeId, 1, Number.MAX_SAFE_INTEGER);
  if (placeId === null) return null;
  const saved = await read('get_tour_plan', { placeId });
  if (!saved || !replans(args, saved)) return { plan: null, saved };
  const tour = recordOf(recordOf(saved).tour);
  const kept = keptSettings(tour);
  const points = args.waypoints ?? rowsIn(recordOf(saved).waypoints).map(({ lat, lng }) => ({ lat, lng }));
  const plan = await read('propose_hike', {
    name: args.name ?? tour.name,
    waypoints: points,
    max_hiking_difficulty: args.max_hiking_difficulty ?? kept.limit,
    hiking_preferences: args.hiking_preferences === undefined ? kept.preferences : args.hiking_preferences,
    along: false,
  });
  return { plan, saved };
}

/** Why a held create is drawn straight: the planner's own reason where it refuses the hike, else "planned on save". */
function heldProblem(card: TourRouteCard | null): TourRouteCard['problem'] {
  const why = card?.problem?.why;
  const refuses = why !== undefined && why !== 'router_unavailable' && why !== 'not_planned';
  return refuses && card?.problem ? card.problem : { why: 'not_planned', position: null, snappedM: null };
}

/** The points of a held hike or walk joined straight, as stops along the straight line. */
function straightCard(points: readonly Row[], activity: 'hike' | 'walk', fields: Partial<TourRouteCard>) {
  const stops = points.flatMap((point) => {
    const at = latLngOf(point);
    return at ? [{ ...at, point }] : [];
  });
  if (stops.length < 2) return null;
  const along = straightMetres(stops);
  return routeCard({
    source: 'pending',
    activity,
    routed: false,
    problem: { why: 'not_planned', position: null, snappedM: null },
    line: straightLine(stops),
    stops: sortedStops(
      stops.map(({ lat, lng, point }, index) =>
        stopOf({
          role: roleAt(index, stops.length),
          kind: activity === 'walk' ? 'station' : null,
          name: argText(point.name, 80),
          lat,
          lng,
          atM: Math.min(along[index] ?? 0, 5_000_000),
          stayMinutes: minutesOf(point.stay_minutes),
        }),
      ),
    ),
    ...fields,
  });
}

/** The points a hike is asked through, a round trip's way back included. */
function hikePoints(args: ToolArgs): Row[] {
  const points = rowsIn(args.waypoints);
  return args.round_trip === true && points[0] ? [...points, points[0]] : points;
}

/** create_hike: the planned way as the proposal drew it, else the points straight. */
export function createHikeCard(ctx: PreviewContext, args: ToolArgs, loaded: TourLoaded | null): TourRouteCard | null {
  const name = argText(args.name, 120);
  const planned = loaded ? hikeCard(loaded.plan, args, ctx.card, 'pending') : null;
  if (planned?.routed) return fitted({ ...planned, name: name ?? planned.name, label: null });
  const straight = straightCard(hikePoints(args), 'hike', {
    name,
    limit: sacStepOf(args.max_hiking_difficulty) ?? TOURS_MAX_HIKING_DIFFICULTY,
    problem: heldProblem(planned),
  });
  return straight ? fitted(straight) : null;
}

/** create_city_walk: the stations joined straight; the way on foot is planned when the walk is saved. */
export function createCityWalkCard(_ctx: PreviewContext, args: ToolArgs): TourRouteCard | null {
  const straight = straightCard(rowsIn(args.stations), 'walk', { name: argText(args.name, 120) });
  return straight ? fitted(straight) : null;
}

/** The saved way a change replaces, in brief: its line flat, its length, climb and time. */
function previousOf(saved: unknown): TourRouteCard['previous'] {
  const tour = recordOf(recordOf(saved).tour);
  const line = lineOf(recordOf(recordOf(saved).line).preview, TOUR_ROUTE_LIMITS.previous);
  const distance = finite(tour.distance);
  const distanceM = distance === null ? null : metresOf(distance * 1000);
  if (line.length < 2 || distanceM === null) return null;
  return {
    line: line.map(([lat, lng]): [number, number] => [lat, lng]),
    distanceM,
    ascentM: climbOf(tour.elevation_gain),
    minutes: minutesOf(tour.planned_duration_minutes) ?? minutesOf(tour.duration),
  };
}

/** update_tour: the new way beside the saved one; a change of name or words alone draws nothing. */
export function updateTourCard(ctx: PreviewContext, args: ToolArgs, loaded: TourLoaded | null): TourRouteCard | null {
  if (!loaded?.saved || !replans(args, loaded.saved)) return null;
  const tour = recordOf(recordOf(loaded.saved).tour);
  const placeId = whole(args.placeId, 1, Number.MAX_SAFE_INTEGER);
  const name = argText(args.name, 120) ?? clipped(tour.name, 120);
  const previous = previousOf(loaded.saved);
  const planned = hikeCard(loaded.plan, args, ctx.card, 'pending');
  if (planned?.routed) return fitted({ ...planned, placeId, name, label: null, previous });
  const points = args.waypoints === undefined ? rowsIn(recordOf(loaded.saved).waypoints) : rowsIn(args.waypoints);
  const straight = straightCard(points, 'hike', { placeId, name, previous, problem: heldProblem(planned) });
  return straight ? fitted(straight) : null;
}

/** create_hike on a day: the hike lands on it at its first point, for the day's preview on the map. */
export function createHikeEffect(ctx: PreviewContext, args: ToolArgs): AssistantChangeEffect | null {
  const dayId = whole(args.day_id, 1, Number.MAX_SAFE_INTEGER);
  const start = latLngOf(rowsIn(args.waypoints)[0]);
  if (dayId === null || !ctx.card.days.some((day) => day.id === dayId)) return null;
  const name = argText(args.name, 200);
  return {
    kind: 'add',
    dayId,
    fromDayId: null,
    placeId: null,
    assignmentId: null,
    place: start && name ? { name, lat: start.lat, lng: start.lng, categoryId: null } : null,
  };
}

/**
 * The card of an applied create: the one the change showed, now naming the
 * tour it created, so the receipt opens it. Null when the change showed none
 * or the answer names no tour.
 */
export function appliedTourCard(input: {
  result: unknown;
  preview: AssistantChangePreview | null;
}): TourRouteCard | null {
  const shown = input.preview?.card;
  const placeId = whole(recordOf(recordOf(input.result).tour).place_id, 1, Number.MAX_SAFE_INTEGER);
  return shown?.kind === 'tourRoute' && placeId !== null ? { ...shown, placeId } : null;
}
