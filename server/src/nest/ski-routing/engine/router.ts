import { metresBetween } from '../../../lib/geo/geo';
import { MinHeap } from '../../../lib/geo/min-heap';
import type { EdgeCosts } from './profile';
import type { Snap } from './snap';
import type { SkiNet } from './stitch';

/**
 * The search (spec 7.5): A* over the network on cost, from any of a leg's
 * start places to any of its end places, with the straight line at the
 * fastest edge's speed as the heuristic, so the first way found is the
 * cheapest. A search has a budget of settled nodes and of time; spent, it
 * answers `timeout` rather than a guess.
 */

/** A stretch of one edge, travelled from share `from` to share `to` of its length (both 0 to 1, a to b). */
export interface Step {
  edge: number;
  dir: 0 | 1;
  from: number;
  to: number;
}

export interface FoundPath {
  steps: Step[];
  cost: number;
  start: Snap;
  end: Snap;
}

export type SearchOutcome =
  | { status: 'ok'; path: FoundPath; settled: number }
  | { status: 'none'; settled: number; nearest: { lat: number; lng: number } | null }
  | { status: 'timeout'; settled: number };

export interface SearchBudget {
  maxSettled: number;
  deadline: number;
}

/** The most nodes one search settles before it gives up, and how long it may take. */
export const MAX_SETTLED = 400_000;
export const LEG_TIME_MS = 3000;

/** Per-node state of a search, reused between searches on the same network and told apart by a stamp. */
class SearchState {
  readonly g: Float64Array;
  readonly prevEdge: Int32Array;
  readonly prevDir: Uint8Array;
  readonly startOf: Int32Array;
  readonly stamp: Uint32Array;
  readonly settled: Uint32Array;
  current = 0;
  readonly heap = new MinHeap(4096);

  constructor(nodes: number) {
    this.g = new Float64Array(nodes);
    this.prevEdge = new Int32Array(nodes);
    this.prevDir = new Uint8Array(nodes);
    this.startOf = new Int32Array(nodes);
    this.stamp = new Uint32Array(nodes);
    this.settled = new Uint32Array(nodes);
  }

  begin(): void {
    this.current++;
    this.heap.clear();
  }

  cost(node: number): number {
    return this.stamp[node] === this.current ? (this.g[node] as number) : Infinity;
  }

  set(node: number, cost: number, edge: number, dir: 0 | 1, start: number): void {
    this.stamp[node] = this.current;
    this.g[node] = cost;
    this.prevEdge[node] = edge;
    this.prevDir[node] = dir;
    this.startOf[node] = start;
  }
}

const states = new WeakMap<SkiNet, SearchState>();

function stateOf(net: SkiNet): SearchState {
  let state = states.get(net);
  if (!state) {
    state = new SearchState(net.nodeCount);
    states.set(net, state);
  }
  state.begin();
  return state;
}

/** How a search may begin: at a node (a lift station, or an edge's end reached from a start place on it). */
interface Entry {
  snap: Snap;
  /** The partial stretch from the start place to the node, or null where the place is the node. */
  step: Step | null;
}

/** How a search may end: from a node, along part of an edge to an end place, at an extra cost. */
interface Exit {
  snap: Snap;
  step: Step | null;
  extra: number;
}

/** What a stretch of an edge costs; none at all where it has no length (a place right at a node). */
function stepCost(costs: EdgeCosts, step: Step, penalty: Float64Array | null): number {
  const share = Math.abs(step.to - step.from);
  if (share === 0) return 0;
  const cost = step.dir === 0 ? (costs.costFwd[step.edge] as number) : (costs.costBack[step.edge] as number);
  return cost * share * (penalty ? (penalty[step.edge] as number) : 1);
}

function entriesOf(net: SkiNet, snap: Snap): Array<{ node: number; entry: Entry }> {
  if (snap.edge < 0) return [{ node: snap.node, entry: { snap, step: null } }];
  return [
    { node: net.edgeB[snap.edge] as number, entry: { snap, step: { edge: snap.edge, dir: 0, from: snap.t, to: 1 } } },
    { node: net.edgeA[snap.edge] as number, entry: { snap, step: { edge: snap.edge, dir: 1, from: snap.t, to: 0 } } },
  ];
}

function exitsOf(net: SkiNet, snap: Snap): Array<{ node: number; exit: Omit<Exit, 'extra'> }> {
  if (snap.edge < 0) return [{ node: snap.node, exit: { snap, step: null } }];
  return [
    { node: net.edgeA[snap.edge] as number, exit: { snap, step: { edge: snap.edge, dir: 0, from: 0, to: snap.t } } },
    { node: net.edgeB[snap.edge] as number, exit: { snap, step: { edge: snap.edge, dir: 1, from: 1, to: snap.t } } },
  ];
}

/** Both places on one edge (or at one station): the stretch between them, where the profile may go that way. */
function directPath(costs: EdgeCosts, from: Snap, to: Snap, penalty: Float64Array | null): FoundPath | null {
  const sameSpot = from.edge < 0 ? to.edge < 0 && from.node === to.node : from.edge === to.edge && from.t === to.t;
  if (sameSpot) return { steps: [], cost: from.startCost + to.startCost, start: from, end: to };
  if (from.edge < 0 || from.edge !== to.edge) return null;
  const step: Step = { edge: from.edge, dir: to.t > from.t ? 0 : 1, from: from.t, to: to.t };
  const cost = stepCost(costs, step, penalty);
  if (!Number.isFinite(cost)) return null;
  return { steps: [step], cost: from.startCost + cost + to.startCost, start: from, end: to };
}

interface Best {
  cost: number;
  node: number;
  exit: Exit | null;
  direct: FoundPath | null;
}

/** The path back from the node an exit was taken at, to the entry it began with. */
function unwind(net: SkiNet, state: SearchState, entries: Entry[], node: number, exit: Exit, cost: number): FoundPath {
  const steps: Step[] = [];
  if (exit.step) steps.push(exit.step);
  let at = node;
  while ((state.prevEdge[at] as number) >= 0) {
    const edge = state.prevEdge[at] as number;
    const dir = state.prevDir[at] as 0 | 1;
    steps.push(dir === 0 ? { edge, dir, from: 0, to: 1 } : { edge, dir, from: 1, to: 0 });
    at = dir === 0 ? (net.edgeA[edge] as number) : (net.edgeB[edge] as number);
  }
  const entry = entries[state.startOf[at] as number] as Entry;
  if (entry.step) steps.push(entry.step);
  steps.reverse();
  return { steps, cost, start: entry.snap, end: exit.snap };
}

/**
 * The cheapest way from any start place to any end place, or why there is
 * none. `penalty` multiplies the cost of an edge (the alternatives' search);
 * `target` is the clicked end point, which the heuristic measures to.
 */
export function searchPath(
  net: SkiNet,
  costs: EdgeCosts,
  starts: readonly Snap[],
  ends: readonly Snap[],
  target: { lat: number; lng: number },
  budget: SearchBudget,
  penalty: Float64Array | null = null,
): SearchOutcome {
  const state = stateOf(net);
  const h = (node: number) =>
    metresBetween(net.nodeLat[node] as number, net.nodeLng[node] as number, target.lat, target.lng) / costs.maxSpeed;
  const entries: Entry[] = [];
  const best: Best = { cost: Infinity, node: -1, exit: null, direct: null };

  for (const start of starts) {
    for (const end of ends) {
      const direct = directPath(costs, start, end, penalty);
      if (direct && direct.cost < best.cost) Object.assign(best, { cost: direct.cost, direct });
    }
    for (const { node, entry } of entriesOf(net, start)) {
      const cost = start.startCost + (entry.step ? stepCost(costs, entry.step, penalty) : 0);
      if (!Number.isFinite(cost) || cost >= state.cost(node)) continue;
      entries.push(entry);
      state.set(node, cost, -1, 0, entries.length - 1);
      state.heap.push(node, cost + h(node));
    }
  }

  const exits = new Map<number, Exit[]>();
  for (const end of ends) {
    for (const { node, exit } of exitsOf(net, end)) {
      const extra = end.startCost + (exit.step ? stepCost(costs, exit.step, penalty) : 0);
      if (!Number.isFinite(extra)) continue;
      exits.set(node, [...(exits.get(node) ?? []), { ...exit, extra }]);
    }
  }

  let settledCount = 0;
  let nearest = -1;
  let nearestDistance = Infinity;
  while (state.heap.size > 0) {
    if (state.heap.peekKey() >= best.cost) break;
    const u = state.heap.pop();
    if (state.settled[u] === state.current) continue;
    state.settled[u] = state.current;
    settledCount++;
    if (settledCount > budget.maxSettled || ((settledCount & 1023) === 0 && Date.now() > budget.deadline)) {
      return { status: 'timeout', settled: settledCount };
    }
    const gu = state.cost(u);
    const remaining = h(u);
    if (remaining < nearestDistance) {
      nearestDistance = remaining;
      nearest = u;
    }
    for (const exit of exits.get(u) ?? []) {
      if (gu + exit.extra < best.cost) Object.assign(best, { cost: gu + exit.extra, node: u, exit, direct: null });
    }
    relax(net, costs, state, u, gu, h, penalty);
  }

  if (best.direct) return { status: 'ok', path: best.direct, settled: settledCount };
  if (best.exit) {
    return { status: 'ok', path: unwind(net, state, entries, best.node, best.exit, best.cost), settled: settledCount };
  }
  const point = nearest >= 0 ? { lat: net.nodeLat[nearest] as number, lng: net.nodeLng[nearest] as number } : null;
  return { status: 'none', settled: settledCount, nearest: point };
}

/** Every edge out of a settled node, in each direction the profile may travel it. */
function relax(
  net: SkiNet,
  costs: EdgeCosts,
  state: SearchState,
  u: number,
  gu: number,
  h: (node: number) => number,
  penalty: Float64Array | null,
): void {
  for (let i = net.adjStart[u] as number; i < (net.adjStart[u + 1] as number); i++) {
    const e = net.adjEdge[i] as number;
    const a = net.edgeA[e] as number;
    const b = net.edgeB[e] as number;
    if (a === b) continue;
    const dir: 0 | 1 = a === u ? 0 : 1;
    const v = dir === 0 ? b : a;
    const edgeCost = dir === 0 ? (costs.costFwd[e] as number) : (costs.costBack[e] as number);
    if (!Number.isFinite(edgeCost) || state.settled[v] === state.current) continue;
    const next = gu + edgeCost * (penalty ? (penalty[e] as number) : 1);
    if (next >= state.cost(v)) continue;
    state.set(v, next, e, dir, -1);
    state.heap.push(v, next + h(v));
  }
}
