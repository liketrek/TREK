import {
  HORSE_ROUTE_SECTION_MAX_POINTS,
  haversineMetres,
  type HorseAccess,
  type HorseAccessShare,
  type HorseSignposted,
} from '@trek/shared';

/**
 * HOR-01: a horse route's ways cut into the sections a rider can take whole.
 *
 * The member ways are read as a graph of their nodes: a section runs from a
 * node where the route ends, forks or meets itself to the next such node, so
 * a gap in the route ends a section and a fork starts new ones. Nothing is
 * joined across a gap, nothing is guessed about which branch is the "main"
 * one, and a section keeps the line of its ways point for point. Pure, so the
 * service and its tests share it.
 */

/** One step of a member way between two of its nodes. */
export interface RouteEdge {
  from: number;
  to: number;
  /** The `horse=*` value of the way the step is on. */
  access: HorseAccess;
  /** The way the route is signposted along the step: 1 from `from` to `to`, -1 the other way, 0 both or unsaid. */
  signed: 1 | -1 | 0;
  /** The place of its way among the route's members, which orders the sections. */
  order: number;
}

/** A section as the route answer carries it, before it is numbered. */
interface SectionLine {
  geometry: [number, number][];
  lengthM: number;
  access: HorseAccessShare[];
  signposted: HorseSignposted | null;
  order: number;
}

interface Step {
  edge: RouteEdge;
  /** Walked from `from` to `to`. */
  forward: boolean;
}

interface Chain {
  nodes: number[];
  steps: Step[];
}

/** The edges at every node, by index. */
function incidence(edges: readonly RouteEdge[]): Map<number, number[]> {
  const at = new Map<number, number[]>();
  const add = (node: number, index: number) => {
    const list = at.get(node);
    if (list) list.push(index);
    else at.set(node, [index]);
  };
  edges.forEach((edge, index) => {
    add(edge.from, index);
    add(edge.to, index);
  });
  return at;
}

/**
 * Every edge in exactly one chain. A chain starts at a node that is no plain
 * through point (an end, a fork, a crossing) and goes on through nodes with
 * two edges until it reaches the next such node; what is left after that are
 * closed rings without any, each walked once round from where it is entered.
 */
function chainsOf(edges: readonly RouteEdge[]): Chain[] {
  const at = incidence(edges);
  const used = new Set<number>();
  const chains: Chain[] = [];
  const through = (node: number) => at.get(node)?.length === 2;
  const walk = (start: number, first: number) => {
    const chain: Chain = { nodes: [start], steps: [] };
    let node = start;
    let index: number | undefined = first;
    while (index !== undefined) {
      used.add(index);
      const edge = edges[index] as RouteEdge;
      const forward = edge.from === node;
      node = forward ? edge.to : edge.from;
      chain.steps.push({ edge, forward });
      chain.nodes.push(node);
      index = through(node) && node !== start ? at.get(node)?.find((next) => !used.has(next)) : undefined;
    }
    chains.push(chain);
  };
  for (const [node, list] of at) {
    if (through(node)) continue;
    for (const index of list) if (!used.has(index)) walk(node, index);
  }
  edges.forEach((edge, index) => {
    if (!used.has(index)) walk(edge.from, index);
  });
  return chains;
}

/** The direction a run of steps is signposted in: one way along all of it, or null. */
function signpostedOf(steps: readonly Step[]): HorseSignposted | null {
  const signs = new Set(steps.map(({ edge, forward }) => edge.signed * (forward ? 1 : -1)));
  if (signs.size !== 1 || signs.has(0)) return null;
  return signs.has(1) ? 'with' : 'against';
}

/** A run of steps as a section: its line, its length, the access along it and its direction. */
function toSection(nodes: readonly number[], steps: readonly Step[], coords: ReadonlyMap<number, [number, number]>) {
  const geometry = nodes.map((node) => coords.get(node) as [number, number]);
  const byValue = new Map<HorseAccess, number>();
  let lengthM = 0;
  steps.forEach(({ edge }, index) => {
    const [aLat, aLng] = geometry[index] as [number, number];
    const [bLat, bLng] = geometry[index + 1] as [number, number];
    const metres = haversineMetres(aLat, aLng, bLat, bLng);
    lengthM += metres;
    byValue.set(edge.access, (byValue.get(edge.access) ?? 0) + metres);
  });
  const access = [...byValue].map(([value, metres]) => ({ value, length_m: Math.round(metres) }));
  return {
    geometry,
    lengthM: Math.round(lengthM),
    access: access.sort((a, b) => b.length_m - a.length_m),
    signposted: signpostedOf(steps),
    order: Math.min(...steps.map(({ edge }) => edge.order)),
  };
}

/**
 * The sections of a route out of its edges, in the order its ways are listed,
 * each at most HORSE_ROUTE_SECTION_MAX_POINTS points long: a longer chain is
 * cut into pieces that meet end to end. A section of no length is left out.
 * Every node an edge names must have its place in `coords`.
 */
export function routeSections(
  edges: readonly RouteEdge[],
  coords: ReadonlyMap<number, [number, number]>,
): SectionLine[] {
  const perPiece = HORSE_ROUTE_SECTION_MAX_POINTS - 1;
  const sections: SectionLine[] = [];
  for (const { nodes, steps } of chainsOf(edges)) {
    for (let start = 0; start < steps.length; start += perPiece) {
      const piece = steps.slice(start, start + perPiece);
      sections.push(toSection(nodes.slice(start, start + piece.length + 1), piece, coords));
    }
  }
  return sections.filter((section) => section.lengthM > 0).sort((a, b) => a.order - b.order);
}
