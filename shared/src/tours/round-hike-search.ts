import { haversineMetres } from '../geo/haversine';
import { loopSpots, retracedShare, sharedShare, STRAIGHT_PER_RADIUS_M } from './round-hike-geometry';

/**
 * RTE-03: the search for round hikes of about a wished length out of a start
 * point, without the router: the planner in the browser asks its Valhalla,
 * the assistant on the server asks the server's, and both look through the
 * same directions, sizes and rules. `ask` plans one loop through the spots it
 * is handed; everything else, which loop is asked next and which is a round
 * worth offering, is decided here.
 */

type Spot = { lat: number; lng: number };

/** How far a round may lie off the wished length and still be offered: a fifth either way. */
export const ROUND_TOLERANCE = 0.2;
/** The shortest round asked for, in metres: below it there is hardly a loop to walk. */
export const ROUND_MIN_M = 1_000;
/** The longest round asked for, in metres: a long day on foot, and as far as the router is asked to plan in one go. */
export const ROUND_MAX_M = 60_000;
/** The length a search starts with, in metres, until one was asked for. */
export const ROUND_DEFAULT_M = 10_000;
/** The most rounds one search offers, lettered like the other ways of a section. */
export const ROUND_MOST = 3;
/**
 * The most questions one search puts to the router. The public instance
 * answers one a second, so a search ends within about a quarter of a minute.
 */
export const MAX_ROUND_ASKS = 12;

/**
 * The directions a search sends its loops in, in turn: three a third of a
 * turn apart first, so the first rounds found lie on different sides of the
 * start, then the three between them.
 */
const BEARINGS = [0, 120, 240, 60, 180, 300] as const;
/** How much longer the paths are than the straight lines between the corners, until the router said. */
const FIRST_DETOUR = 1.3;
/** A loop walking more than this share of its ground twice is an out and back, not a round. */
const MAX_RETRACED_SHARE = 0.4;
/** Two rounds sharing more than this share of their ground are one round, walked a little apart. */
const MAX_SHARED_SHARE = 0.6;
/** A loop that missed the length is asked again once, its circle scaled within these bounds. */
const RESCALE = { min: 0.5, max: 2 } as const;

/** The shortest and longest round that fits a wish of `targetM`. */
export function distanceWindow(targetM: number): { minM: number; maxM: number } {
  return { minM: targetM * (1 - ROUND_TOLERANCE), maxM: targetM * (1 + ROUND_TOLERANCE) };
}

/** Whether a round of `distanceM` fits a wish of `targetM`. */
export function fitsWish(distanceM: number, targetM: number): boolean {
  const { minM, maxM } = distanceWindow(targetM);
  return distanceM >= minM && distanceM <= maxM;
}

/** How far a round lies off the wish, as a signed share: 0.08 is 8 % longer, -0.05 is 5 % shorter. */
export function deviationOf(distanceM: number, targetM: number): number {
  return (distanceM - targetM) / targetM;
}

/** Whether a wished length can be asked for at all. */
export function isRoundTarget(targetM: number | null): targetM is number {
  return targetM !== null && Number.isFinite(targetM) && targetM >= ROUND_MIN_M && targetM <= ROUND_MAX_M;
}

/** A loop the router planned out of the start and back: its line, where it met the steering spots, how far it is. */
export interface RoundLoop {
  coordinates: [number, number][];
  /** Where the line passes the spots it was steered through: the shaping points a round is planned by. */
  via: Spot[];
  /** Measured along the line. */
  distanceM: number;
}

/**
 * One loop asked of the router through `[start, ...spots, start]`: the loop,
 * null when a spot lies too far from any path to steer through, undefined
 * when the router gave no answer.
 */
export type RoundLoopAsk = (spots: Spot[]) => Promise<RoundLoop | null | undefined>;

/** What a search has found and asked so far. */
export interface RoundSearchState {
  /** The rounds to offer, in the order they were found, at most ROUND_MOST. */
  found: RoundLoop[];
  /** The questions put, at most MAX_ROUND_ASKS. */
  asked: number;
  /** The questions the router answered; none at all is a failed search. */
  answered: number;
}

export interface RoundSearchOptions {
  /** Read after every question: once it says aborted, nothing more is asked. */
  signal?: { readonly aborted: boolean };
  /** Hears the state after each direction, so the rounds can show up as they are found. */
  onStep?: (state: Readonly<RoundSearchState>) => void;
}

const clamp = (value: number, { min, max }: { readonly min: number; readonly max: number }) =>
  Math.min(max, Math.max(min, value));

/** The circle a loop of `targetM` is steered round, for paths `detour` times longer than straight lines. */
const radiusFor = (targetM: number, detour: number) => targetM / (detour * STRAIGHT_PER_RADIUS_M);

/** The loop in straight lines from corner to corner, in metres. */
function straightLength(spots: readonly Spot[]): number {
  let metres = 0;
  for (let i = 1; i < spots.length; i += 1) {
    const a = spots[i - 1];
    const b = spots[i];
    if (a && b) metres += haversineMetres(a.lat, a.lng, b.lat, b.lng);
  }
  return metres;
}

/**
 * What a planned loop is worth: a round to offer, a loop to ask again larger
 * or smaller, or nothing (an out and back, or a round already found).
 */
function judge(loop: RoundLoop, targetM: number, found: readonly RoundLoop[]): 'round' | 'rescale' | 'drop' {
  if (!fitsWish(loop.distanceM, targetM)) return 'rescale';
  if (retracedShare(loop.coordinates) > MAX_RETRACED_SHARE) return 'drop';
  const known = found.some(
    (round) =>
      Math.max(sharedShare(loop.coordinates, round.coordinates), sharedShare(round.coordinates, loop.coordinates)) >
      MAX_SHARED_SHARE,
  );
  return known ? 'drop' : 'round';
}

interface Search {
  start: Spot;
  targetM: number;
  ask: RoundLoopAsk;
  signal: { readonly aborted: boolean } | undefined;
  state: RoundSearchState;
  detour: number;
}

/**
 * The loops in one direction: asked once at the size the detour so far
 * suggests, and once more scaled by how far the first missed the length.
 */
async function searchBearing(search: Search, bearing: number): Promise<void> {
  const { start, targetM, state } = search;
  let radius = radiusFor(targetM, search.detour);
  for (let attempt = 0; attempt < 2 && state.asked < MAX_ROUND_ASKS; attempt += 1) {
    const spots = loopSpots(start, bearing, radius);
    const loop = await search.ask(spots);
    state.asked += 1;
    if (search.signal?.aborted || loop === undefined) return;
    state.answered += 1;
    if (!loop) return;
    // The paths here are this much longer than the straight lines: the next circle is drawn for them.
    const straightM = straightLength([start, ...spots, start]);
    if (straightM > 0) search.detour = clamp(loop.distanceM / straightM, { min: 1, max: 3 });
    const verdict = judge(loop, targetM, state.found);
    if (verdict === 'round') state.found.push(loop);
    if (verdict !== 'rescale') return;
    radius *= clamp(targetM / loop.distanceM, RESCALE);
  }
}

/**
 * Up to ROUND_MOST different round hikes out of `start`, each within a fifth
 * of `targetM`. Loops are steered round circles in several directions; a
 * loop that misses the length is asked once more at a corrected size, one
 * that walks its ground twice or repeats a round found is left out. At most
 * MAX_ROUND_ASKS questions; once `signal` aborts, nothing more is asked and
 * `onStep` hears nothing more.
 */
export async function searchRoundLoops(
  start: Spot,
  targetM: number,
  ask: RoundLoopAsk,
  options: RoundSearchOptions = {},
): Promise<RoundSearchState> {
  const state: RoundSearchState = { found: [], asked: 0, answered: 0 };
  const search: Search = { start, targetM, ask, signal: options.signal, state, detour: FIRST_DETOUR };
  for (const bearing of BEARINGS) {
    if (state.found.length >= ROUND_MOST || state.asked >= MAX_ROUND_ASKS) break;
    await searchBearing(search, bearing);
    if (options.signal?.aborted) return state;
    options.onStep?.({ found: [...state.found], asked: state.asked, answered: state.answered });
  }
  return state;
}
