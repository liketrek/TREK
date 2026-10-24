import type { EdgeCosts } from './profile';
import type { FoundPath, SearchOutcome } from './router';
import { buildLeg, legSeconds } from './segments';
import type { SkiNet } from './stitch';
import type { SkiRouteAlternative } from '@trek/shared';

/**
 * Other ways for a leg (spec 7.5), by the penalty method: every edge a way
 * already uses costs 1.4 times as much in the next search. A way found that
 * way is offered only when it shares less than 70 % of its length with the
 * ways before it and takes at most half as long again as the best one.
 */

const PENALTY = 1.4;
const MAX_SHARED = 0.7;
const MAX_SLOWER = 1.5;

/** How much of a way's length runs on edges an earlier way used. */
function sharedShare(net: SkiNet, path: FoundPath, used: ReadonlySet<number>): number {
  let total = 0;
  let shared = 0;
  for (const step of path.steps) {
    const length = (net.edgeLen[step.edge] as number) * Math.abs(step.to - step.from);
    total += length;
    if (used.has(step.edge)) shared += length;
  }
  return total > 0 ? shared / total : 1;
}

export function findAlternatives(
  net: SkiNet,
  costs: EdgeCosts,
  best: FoundPath,
  count: number,
  search: (penalty: Float64Array) => SearchOutcome,
): SkiRouteAlternative[] {
  if (count <= 0) return [];
  const bestSeconds = legSeconds(buildLeg(net, costs, best.steps, [best.start.lat, best.start.lng, best.start.ele]));
  const penalty = new Float64Array(net.edgeCount).fill(1);
  const used = new Set<number>();
  const punish = (path: FoundPath) => {
    for (const edge of new Set(path.steps.map((step) => step.edge))) {
      penalty[edge] = (penalty[edge] as number) * PENALTY;
      used.add(edge);
    }
  };
  punish(best);
  const found: SkiRouteAlternative[] = [];
  // A rejected way is penalised too, so the next try looks elsewhere; two spare tries at most.
  for (let tries = 0; tries < count + 2 && found.length < count; tries++) {
    const outcome = search(penalty);
    if (outcome.status !== 'ok') break;
    const path = outcome.path;
    const leg = buildLeg(net, costs, path.steps, [path.start.lat, path.start.lng, path.start.ele]);
    const seconds = legSeconds(leg);
    if (sharedShare(net, path, used) < MAX_SHARED && seconds <= bestSeconds * MAX_SLOWER) {
      found.push({ geometry: leg.geometry, segments: leg.segments, seconds_total: seconds });
    }
    punish(path);
  }
  return found;
}
