import { searchRoundLoops, type RoundLoop } from '@trek/shared';
import { valhallaRun } from '../../Map/valhallaRoute';
import { figuresOf } from './legVariants';
import { ROUND_KEYS, type RoundCandidate, type RoundRequest } from './roundHikes';
import { MAX_TOUR_SNAP_M } from './tourRouteOutcome';
import { enrichTourElevations } from './tourRouting';

type Spot = { lat: number; lng: number };

/** Where a search stands: still asking, done with what it found, or without one answer from the router. */
export interface RoundSearchReport {
  phase: 'searching' | 'done' | 'failed';
  candidates: RoundCandidate[];
  /** The questions put so far, of `MAX_ROUND_ASKS`. */
  asked: number;
}

/**
 * One loop out of the start and back, asked on foot under the hike's rules:
 * the same question the planner asks for a hike through these points, so the
 * round taken is the round shown. `undefined` when the router gave no answer,
 * null when a spot lies too far from any path to steer through.
 */
async function askLoop(
  request: RoundRequest,
  spots: Spot[],
  signal: AbortSignal
): Promise<RoundLoop | null | undefined> {
  const points = [request.start, ...spots, request.start];
  const run = await valhallaRun(points, 'walking', [], signal, request.costing);
  if (!run) return undefined;
  if (run.snapped.some((snap) => snap.meters > MAX_TOUR_SNAP_M)) return null;
  const coordinates = run.total.coordinates;
  return {
    coordinates,
    via: run.snapped.slice(1, -1).map(({ at }) => ({ lat: at[0], lng: at[1] })),
    distanceM: figuresOf(coordinates).distanceM,
  };
}

function candidateOf(loop: RoundLoop, index: number): RoundCandidate {
  return {
    key: ROUND_KEYS[index] ?? 'c',
    current: false,
    coordinates: loop.coordinates,
    ...figuresOf(loop.coordinates),
    heights: 'pending',
    via: loop.via,
  };
}

/**
 * RTE-03: up to three different round hikes out of the start, each within a
 * fifth of the wished length, searched by the rules both the planner and the
 * assistant search by (`searchRoundLoops`), the loops asked of the browser's
 * router. Then the heights of each round, one after the other. `report` hears
 * every step, so the rounds and their figures fill in as they come; nothing
 * is reported once `signal` aborts.
 */
export async function findRoundHikes(
  request: RoundRequest,
  signal: AbortSignal,
  report: (answer: RoundSearchReport) => void
): Promise<void> {
  const state = await searchRoundLoops(request.start, request.targetM, (spots) => askLoop(request, spots, signal), {
    signal,
    onStep: ({ found, asked }) =>
      report({ phase: 'searching', candidates: found.map((loop, i) => candidateOf(loop, i)), asked }),
  });
  if (signal.aborted) return;
  if (state.answered === 0) {
    report({ phase: 'failed', candidates: [], asked: state.asked });
    return;
  }
  const found = state.found.map((loop, i) => candidateOf(loop, i));
  let candidates = [...found];
  report({ phase: 'done', candidates, asked: state.asked });
  for (const round of found) {
    const heights = await enrichTourElevations(round.coordinates, signal);
    if (signal.aborted) return;
    // A round without heights keeps its length; its climb, descent and time stay unknown.
    candidates = candidates.map((known) =>
      known.key === round.key ? { ...known, ...figuresOf(heights ?? known.coordinates) } : known
    );
    report({ phase: 'done', candidates, asked: state.asked });
  }
}
