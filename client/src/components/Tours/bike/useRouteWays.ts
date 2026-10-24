import { TOUR_TRAIL_GRADE_MAX_WAYS, type TourTrailGrade } from '@trek/shared';
import { useCallback, useEffect, useState } from 'react';
import { useNetworkMode } from '../../../hooks/useNetworkMode';
import { OnlineOnlyError } from '../../../repo/onlineOnly';
import { tourTrailGradeRepo } from '../../../repo/tourTrailGradeRepo';
import { useTourRouteHighlightStore } from '../../../store/tourRouteHighlightStore';
import { valhallaTraceAttributes, type TraceMatching } from '../../Map/valhallaRoute';
import { routeWaysFrom, wayIdsOf, type RouteWays } from './routeWays';

/** How long a route has to stay before its ways are asked about, so a route being shaped asks once. */
const SETTLE_MS = 600;

type RouteWaysStatus = 'idle' | 'loading' | 'ready' | 'failed' | 'offline';

export interface TrailGrades {
  status: 'loading' | 'ready' | 'failed' | 'offline';
  byWay: ReadonlyMap<number, TourTrailGrade>;
  /** Ways the data could not be asked about: their grade is unknown, not absent. */
  unasked: ReadonlySet<number>;
}

export interface RouteWaysState {
  status: RouteWaysStatus;
  ways: RouteWays | null;
  /** BIK-05, MAP-03 and MAP-04, where asked for: what OpenStreetMap records for its ways. */
  grades: TrailGrades | null;
}

interface Answer extends RouteWaysState {
  attempt: number;
  /** The route and the question it answers; another one makes it stale. */
  route: [number, number][];
  matching: TraceMatching;
  withGrades: boolean;
}

const IDLE: RouteWaysState = { status: 'idle', ways: null, grades: null };
const NO_GRADES = { byWay: new Map<number, TourTrailGrade>(), unasked: new Set<number>() };

interface Question {
  tripId: number | string;
  route: [number, number][];
  matching: TraceMatching;
  withGrades: boolean;
}

/**
 * The ways whose grades stay unknown after an answer: those it left unanswered,
 * and those past the cap that were never asked, so neither reads as a way
 * OpenStreetMap records nothing for.
 */
function unaskedWays(ways: RouteWays, asked: readonly number[], unanswered: readonly number[]): Set<number> {
  const askedIds = new Set(asked);
  const unasked = new Set(unanswered);
  for (const edge of ways.edges) {
    if (edge.wayId !== null && !askedIds.has(edge.wayId)) unasked.add(edge.wayId);
  }
  return unasked;
}

/** The ways of a route, and where asked for their grades; the grades' outcome as it came. */
async function askRouteWays(
  { tripId, route, matching, withGrades }: Question,
  signal: AbortSignal,
  onWays: (ways: RouteWays) => void
): Promise<RouteWaysState> {
  const ways = routeWaysFrom(await valhallaTraceAttributes(route, signal, matching));
  if (!ways) return { status: 'failed', ways: null, grades: null };
  if (!withGrades) return { status: 'ready', ways, grades: null };
  onWays(ways);
  const ids = wayIdsOf(ways, TOUR_TRAIL_GRADE_MAX_WAYS);
  if (ids.length === 0) return { status: 'ready', ways, grades: { status: 'ready', ...NO_GRADES } };
  try {
    const answer = await tourTrailGradeRepo.grades(tripId, { way_ids: ids }, signal);
    const byWay = new Map(answer.ways.map((grade) => [grade.id, grade]));
    const unasked = unaskedWays(ways, ids, answer.unanswered);
    return { status: 'ready', ways, grades: { status: 'ready', byWay, unasked } };
  } catch (failure) {
    const status = failure instanceof OnlineOnlyError ? 'offline' : 'failed';
    return { status: 'ready', ways, grades: { status, ...NO_GRADES } };
  }
}

/**
 * BIK-01 to BIK-05, MAP-03 and MAP-04: what the tour being planned runs on,
 * asked of the router once its route has settled, and where asked for what
 * OpenStreetMap records for its ways (a mountain bike tour's grades; a hike's
 * SAC grades, surfaces and kinds of way). A new route makes
 * the answer on its way stale and takes the map's highlight down; nothing of
 * it changes the tour.
 */
export function useRouteWays(input: {
  tripId: number | string;
  active: boolean;
  route: [number, number][] | null;
  /** How the line is matched to its ways: as a bike rides it, or on foot for a hike. */
  matching: TraceMatching;
  withGrades: boolean;
}): RouteWaysState & { retry: () => void } {
  const { tripId, active, route, matching, withGrades } = input;
  const { offline } = useNetworkMode();
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const asking = active && !offline && !!route && route.length >= 2;

  useEffect(() => {
    useTourRouteHighlightStore.getState().clear();
    if (!asking || !route) return;
    const controller = new AbortController();
    const settle = (state: RouteWaysState) => {
      if (!controller.signal.aborted) setAnswer({ ...state, route, matching, withGrades, attempt });
    };
    const timer = window.setTimeout(() => {
      askRouteWays({ tripId, route, matching, withGrades }, controller.signal, (ways) =>
        settle({ status: 'ready', ways, grades: { status: 'loading', ...NO_GRADES } })
      )
        .then(settle)
        // Whatever went wrong, the card says it failed and offers to ask again rather than wait for ever.
        .catch(() => settle({ status: 'failed', ways: null, grades: null }));
    }, SETTLE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [asking, attempt, matching, route, tripId, withGrades]);

  // The highlight belongs to the route it was drawn on.
  useEffect(() => () => useTourRouteHighlightStore.getState().clear(), []);

  if (!active || !route || route.length < 2) return { ...IDLE, retry };
  if (offline) return { status: 'offline', ways: null, grades: null, retry };
  const current =
    answer?.route === route &&
    answer.matching === matching &&
    answer.withGrades === withGrades &&
    answer.attempt === attempt;
  return current ? { ...answer, retry } : { status: 'loading', ways: null, grades: null, retry };
}
