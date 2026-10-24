import type { SkiColourScheme, SkiFailCode, SkiFailHint, SkiRouteLeg, SkiRoutePoint, TourFixedLeg } from '@trek/shared';
import { skiRouteRepo, type SkiLegAnswer, type SkiPlanAnswer } from '../../../repo/skiRouteRepo';
import type { SkiChoice } from '../ski/skiChoice';
import { densifyLine, lineLengthM } from './tourFixedLegs';
import { freeLegBetween } from './tourRouteActions';
import { isTourRoute } from './tourRouteOutcome';
import { drawnTour, routeWalkingTour, type TourRoutePart, type TourRouteResult } from './tourRouting';

/**
 * SKI-02: how the legs of a planned ski tour are laid. With a discipline
 * chosen, the legs without a line of their own go to the piste router in one
 * request, each going on from the one before, and come back along runs, lifts
 * and trails. A leg the router cannot plan stays a straight stretch marked as
 * unrouted, with the reason and the one change that would plan it; a
 * snowshoe or winter hike leg off the piste data follows summer paths
 * instead, said so. Before a discipline is chosen every leg is drawn straight
 * and nothing is asked. A time is given only when the router planned every
 * leg; heights come from the piste data where it has them for every point.
 */

interface SkiLegPoint {
  lat: number;
  lng: number;
  fixedLeg?: TourFixedLeg | null;
}

type SkiLegFailure = SkiFailCode | 'offline';

export interface SkiLegProblem {
  /** The leg's place in the tour: the index of the point it starts at. */
  index: number;
  code: SkiLegFailure;
  hint: SkiFailHint | null;
  name: string | null;
  /** The leg follows summer paths instead (snowshoe and winter hike). */
  summer: boolean;
}

export interface SkiTourRoute extends TourRouteResult {
  /** Per leg: the router's answer, or null for a leg with a line of its own or none asked. */
  legs: Array<SkiRouteLeg | null>;
  problems: SkiLegProblem[];
  /** The line with the piste data's heights, when it has one for every point; else null. */
  elevations: [number, number, number][] | null;
  build: string | null;
  stale: boolean;
  areaNames: string[];
  colourScheme: SkiColourScheme;
  /** The credit of the piste and terrain data, as the server words it; null where nothing was asked. */
  attribution: string | null;
  /** The legs the piste router planned, by the index of the point each starts at. */
  plannedLegs: number[];
  /** The line as the tour was saved, opened without asking the router again; false for one planned now. */
  saved: boolean;
}

/** How long a leg waits for its ski area to download, asked again every two seconds. */
const LOADING_POLL_MS = 2000;
const LOADING_TRIES = 15;
/** Failures a snowshoer or winter hiker takes summer paths around. */
const SUMMER_FALLBACK: ReadonlySet<string> = new Set(['not_on_piste', 'no_area', 'places_unavailable', 'disabled']);
const ON_FOOT: ReadonlySet<string> = new Set(['snowshoe', 'winter_hike']);
/** Segments walked or ridden down: drawn dotted. */
const DOTTED: ReadonlySet<string> = new Set(['link', 'crossing', 'walk', 'lift_down']);

/**
 * What of the ski choice the legs are laid for: the discipline, the technique
 * where it counts, and the options. Nothing while no discipline is chosen, so
 * picking the first one is the change that plans the tour.
 */
export function skiRouteKey(choice: SkiChoice): string {
  if (choice.discipline === null) return '';
  const technique = choice.discipline === 'cross_country' ? choice.technique : null;
  return JSON.stringify([choice.discipline, technique, choice.options ?? {}]);
}

/** One leg for each point but the last: the line the point carries, else a straight line to the next point. */
export function skiLegs(points: readonly SkiLegPoint[]): TourFixedLeg[] {
  return points.slice(0, -1).map((point, index) => point.fixedLeg ?? freeLegBetween(point, points[index + 1]));
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      window.clearTimeout(timer);
      resolve();
    });
  });

/** The answers for the legs asked, a leg whose area still downloads asked again until it is in or the wait is over. */
async function askRouter(
  tripId: number | string,
  legs: Array<{ from: SkiRoutePoint; to: SkiRoutePoint }>,
  choice: SkiChoice,
  signal?: AbortSignal
): Promise<SkiPlanAnswer> {
  if (choice.discipline === null) throw new Error('no discipline');
  const ask = {
    discipline: choice.discipline,
    technique: choice.discipline === 'cross_country' ? choice.technique : null,
    options: choice.options ?? {},
  };
  let answer = await skiRouteRepo.plan(tripId, legs, ask, signal);
  for (let tries = 1; tries < LOADING_TRIES && answer.legs.some(isLoading) && !signal?.aborted; tries += 1) {
    await sleep(LOADING_POLL_MS, signal);
    answer = await skiRouteRepo.plan(tripId, legs, ask, signal);
  }
  // Waited long enough: the area is not to be had now.
  const legsNow = answer.legs.map((leg): SkiLegAnswer => (isLoading(leg) ? notReachable : leg));
  return { ...answer, legs: legsNow };
}

const isLoading = (leg: SkiLegAnswer) => leg.status === 'failed' && leg.code === 'loading';
const notReachable: SkiLegAnswer = {
  status: 'failed',
  code: 'places_unavailable',
  at: null,
  hint: { free_draw: true },
  detail: null,
};

/** The parts of a planned leg, one per stretch, styled by what it is. */
function routedParts(leg: Extract<SkiRouteLeg, { status: 'ok' }>, scheme: SkiColourScheme): TourRoutePart[] {
  return leg.segments.map((segment) => ({
    coordinates: leg.geometry.slice(segment.from, segment.to + 1).map(([lat, lng]): [number, number] => [lat, lng]),
    free: false,
    ...(DOTTED.has(segment.kind) ? { mark: 'gap' as const } : {}),
    ski: { kind: segment.kind, difficulty: segment.difficulty, scheme },
  }));
}

const straight = (from: SkiLegPoint, to: SkiLegPoint): [number, number][] => [
  [from.lat, from.lng],
  [to.lat, to.lng],
];

/** A leg off the piste data on summer paths, for a snowshoer or winter hiker; null when there is none either. */
async function summerParts(from: SkiLegPoint, to: SkiLegPoint, signal?: AbortSignal): Promise<TourRoutePart | null> {
  try {
    const routed = await routeWalkingTour([from, to], signal);
    if (!isTourRoute(routed)) return null;
    return { coordinates: routed.coordinates, free: false, mark: 'gap', ski: { kind: 'summer', difficulty: null } };
  } catch {
    // No summer path either: the leg stays straight and unrouted, which says as much.
    return null;
  }
}

/** Neighbouring parts drawn alike as one line. */
function mergeParts(parts: TourRoutePart[]): TourRoutePart[] {
  const merged: TourRoutePart[] = [];
  for (const part of parts) {
    const previous = merged[merged.length - 1];
    const alike =
      previous &&
      previous.free === part.free &&
      previous.mark === part.mark &&
      JSON.stringify(previous.ski ?? null) === JSON.stringify(part.ski ?? null);
    if (alike) previous.coordinates = [...previous.coordinates, ...part.coordinates.slice(1)];
    else merged.push({ ...part, coordinates: [...part.coordinates] });
  }
  return merged;
}

/** The heights of the whole line when the piste data has one for every point of every leg; else null. */
function graphHeights(answers: Array<SkiRouteLeg | null>): [number, number, number][] | null {
  const line: [number, number, number][] = [];
  for (const leg of answers) {
    if (leg?.status !== 'ok') return null;
    const points = line.length === 0 ? leg.geometry : leg.geometry.slice(1);
    for (const [lat, lng, ele] of points) {
      if (ele === null) return null;
      line.push([lat, lng, ele]);
    }
  }
  return line.length > 1 ? line : null;
}

interface LegOutcome {
  parts: TourRoutePart[];
  length: number;
  answer: SkiRouteLeg | null;
  problem: SkiLegProblem | null;
}

/** One leg of the tour from the router's answer: planned, on summer paths, or straight and unrouted. */
async function legOutcome(
  index: number,
  points: readonly SkiLegPoint[],
  answer: SkiLegAnswer,
  context: { onFoot: boolean; scheme: SkiColourScheme; signal?: AbortSignal }
): Promise<LegOutcome> {
  const from = points[index];
  const to = points[index + 1];
  if (answer.status === 'ok') {
    return { parts: routedParts(answer, context.scheme), length: answer.distance_m, answer, problem: null };
  }
  const name = answer.detail?.name ?? null;
  const summerFirst = context.onFoot && SUMMER_FALLBACK.has(answer.code);
  const summer = summerFirst ? await summerParts(from, to, context.signal) : null;
  const problem = { index, code: answer.code, hint: answer.hint, name, summer: summer !== null };
  if (summer) return { parts: [summer], length: lineLengthM(summer.coordinates), answer: null, problem };
  const line = straight(from, to);
  const unrouted: TourRoutePart = { coordinates: line, free: false, mark: 'unrouted' };
  return { parts: [unrouted], length: lineLengthM(line), answer: null, problem };
}

/** Asks the router for the legs that need it; a server that cannot be asked fails them all, drawn straight. */
async function plannedAnswers(
  points: readonly SkiLegPoint[],
  choice: SkiChoice,
  tripId: number | string,
  signal?: AbortSignal
): Promise<{ asked: number[]; plan: SkiPlanAnswer }> {
  const asked = points.slice(0, -1).flatMap((point, index) => (point.fixedLeg ? [] : [index]));
  const at = (point: SkiLegPoint): SkiRoutePoint => ({ lat: point.lat, lng: point.lng });
  const legs = asked.map((index) => ({ from: at(points[index]), to: at(points[index + 1]) }));
  const none = (answers: SkiLegAnswer[]): SkiPlanAnswer => ({
    legs: answers,
    build: null,
    stale: false,
    areaNames: [],
    colourScheme: 'europe',
    attribution: null,
  });
  if (legs.length === 0) return { asked, plan: none([]) };
  try {
    return { asked, plan: await askRouter(tripId, legs, choice, signal) };
  } catch {
    // The route request failed outright (the server, the network): every asked leg is said to be unrouted.
    return { asked, plan: none(legs.map(() => notReachable)) };
  }
}

/**
 * A ski tour's line: each leg planned by the piste router, kept as drawn, or
 * straight where neither is possible. Null for fewer than two points or a
 * request called off.
 */
export async function routeSkiTour(
  points: readonly SkiLegPoint[],
  choice: SkiChoice,
  tripId: number | string,
  signal?: AbortSignal
): Promise<SkiTourRoute | null> {
  if (points.length < 2) return null;
  if (choice.discipline === null) return drawnSkiTour(points);
  const { asked, plan } = await plannedAnswers(points, choice, tripId, signal);
  if (signal?.aborted) return null;
  const byLeg = new Map(asked.map((index, at) => [index, plan.legs[at]]));
  const onFoot = ON_FOOT.has(choice.discipline);
  const outcomes = await Promise.all(
    points.slice(0, -1).map(async (point, index): Promise<LegOutcome> => {
      const answer = byLeg.get(index);
      if (point.fixedLeg || !answer) {
        // A leg drawn by hand, sampled along its length so its heights follow the ground.
        const drawn = (point.fixedLeg ?? freeLegBetween(point, points[index + 1])).geometry;
        const line = densifyLine(drawn.map(([lat, lng]): [number, number] => [lat, lng]));
        return { parts: [{ coordinates: line, free: true }], length: lineLengthM(line), answer: null, problem: null };
      }
      return legOutcome(index, points, answer, { onFoot, scheme: plan.colourScheme, signal });
    })
  );
  if (signal?.aborted) return null;
  const parts = mergeParts(outcomes.flatMap((outcome) => outcome.parts));
  const coordinates = parts.flatMap((part, index) => (index === 0 ? part.coordinates : part.coordinates.slice(1)));
  const legs = outcomes.map((outcome) => outcome.answer);
  const everyLegPlanned = legs.every((leg) => leg?.status === 'ok');
  const seconds = legs.reduce((sum, leg) => sum + (leg?.status === 'ok' ? legSeconds(leg) : 0), 0);
  return {
    coordinates,
    parts,
    distanceMeters: outcomes.reduce((sum, outcome) => sum + outcome.length, 0),
    durationSeconds: everyLegPlanned ? Math.round(seconds) : null,
    legs,
    problems: outcomes.flatMap((outcome) => (outcome.problem ? [outcome.problem] : [])),
    elevations: everyLegPlanned ? graphHeights(legs) : null,
    build: plan.build,
    stale: plan.stale,
    areaNames: plan.areaNames,
    colourScheme: plan.colourScheme,
    attribution: plan.attribution,
    plannedLegs: legs.flatMap((leg, index) => (leg?.status === 'ok' ? [index] : [])),
    saved: false,
  };
}

/** A leg's time on the move and waiting, in seconds. */
export function legSeconds(leg: Extract<SkiRouteLeg, { status: 'ok' }>): number {
  return leg.seconds.ski + leg.seconds.lift + leg.seconds.wait + leg.seconds.walk;
}

/** Every leg drawn straight (or as the traveller drew it), sampled for its heights, nothing asked and no time. */
function drawnSkiTour(points: readonly SkiLegPoint[]): SkiTourRoute | null {
  const legs = skiLegs(points);
  const drawn = drawnTour(points.map((point, index) => ({ ...point, fixedLeg: legs[index] ?? null })));
  if (!drawn) return null;
  return {
    ...drawn,
    legs: legs.map(() => null),
    problems: [],
    elevations: null,
    build: null,
    stale: false,
    areaNames: [],
    colourScheme: 'europe',
    attribution: null,
    plannedLegs: [],
    saved: false,
  };
}
