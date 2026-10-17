import { lineLength, metresBetween, projectOnSegment } from '../engine/geo';
import { Access, EdgeKind, type EdgeKindCode, PortageSource } from '../water-graph';

/** A node while the network is built: where it is, and the lake it opens into (-1 for none). */
export interface BuildNode {
  lat: number;
  lng: number;
  lake: number;
  /** Set on the sides of a weir, dam or waterfall: such a node never opens into a lake. */
  barrier: boolean;
}

export interface BuildEdge {
  a: number;
  b: number;
  /** [lat, lng] from a to b. */
  line: [number, number][];
  kind: EdgeKindCode;
  flow: 0 | 1;
  current: number;
  access: number;
  oneway: 0 | 1;
  /** The whitewater grade of the stretch (0 when none is given). */
  grade: number;
  name: string | null;
  ref: string | null;
  source: number;
  /** Dropped edges stay in the list as holes, so indices handed out earlier keep meaning the same edge. */
  dead?: boolean;
}

export interface BarrierSite {
  lat: number;
  lng: number;
  name: string | null;
  ref: string;
  /** The nodes on its sides, one per water line that meets it. */
  sides: number[];
}

/** The network under construction: nodes, edges, and the barriers to carry round. */
export class BuildState {
  readonly nodes: BuildNode[] = [];
  readonly edges: BuildEdge[] = [];
  readonly barriers: BarrierSite[] = [];
  /** The edges at each node, kept up to date as edges are added and cut; dead ones are filtered on reading. */
  private readonly at: number[][] = [];

  addNode(lat: number, lng: number, barrier = false): number {
    this.nodes.push({ lat, lng, lake: -1, barrier });
    this.at.push([]);
    return this.nodes.length - 1;
  }

  addEdge(edge: Omit<BuildEdge, 'dead'> & { dead?: boolean }): number {
    // A copy of a dropped edge comes in alive.
    const { dead: _dead, ...alive } = edge;
    this.edges.push(alive);
    const index = this.edges.length - 1;
    this.at[edge.a]?.push(index);
    if (edge.b !== edge.a) this.at[edge.b]?.push(index);
    return index;
  }

  /** The live edges at a node. */
  edgesAt(node: number): number[] {
    return (this.at[node] ?? []).filter((edge) => !this.edges[edge]?.dead);
  }

  /** A land edge carrying the boat between two nodes along `line`. */
  addPortage(
    a: number,
    b: number,
    line: [number, number][],
    source: number,
    name: string | null,
    ref: string | null,
  ): number {
    return this.addEdge({
      a,
      b,
      line,
      kind: EdgeKind.portage,
      flow: 0,
      current: 0,
      access: Access.open,
      oneway: 0,
      grade: 0,
      name,
      ref,
      source,
    });
  }

  /** A straight piece of water joining two nodes the data leaves apart: a connector when short, a gap beyond. */
  addLink(a: number, b: number, kind: EdgeKindCode): number {
    const from = this.nodes[a] as BuildNode;
    const to = this.nodes[b] as BuildNode;
    return this.addEdge({
      a,
      b,
      line: [
        [from.lat, from.lng],
        [to.lat, to.lng],
      ],
      kind,
      flow: 0,
      current: 0,
      access: Access.open,
      oneway: 0,
      grade: 0,
      name: null,
      ref: null,
      source: PortageSource.tagged,
    });
  }

  /**
   * Cuts an edge at one of its inner points, which becomes a node; the first
   * part keeps the edge's index. Returns the node at the cut (an end node when
   * the point is an end).
   */
  splitAt(edgeIndex: number, pointIndex: number): number {
    const edge = this.edges[edgeIndex] as BuildEdge;
    if (pointIndex <= 0) return edge.a;
    if (pointIndex >= edge.line.length - 1) return edge.b;
    const [lat, lng] = edge.line[pointIndex] as [number, number];
    const node = this.addNode(lat, lng);
    const tail: Omit<BuildEdge, 'dead'> = { ...edge, a: node, line: edge.line.slice(pointIndex) };
    const oldB = edge.b;
    edge.line = edge.line.slice(0, pointIndex + 1);
    edge.b = node;
    this.at[node]?.push(edgeIndex);
    if (oldB !== edge.a) this.at[oldB] = (this.at[oldB] ?? []).filter((other) => other !== edgeIndex);
    this.addEdge(tail);
    return node;
  }

  /**
   * The node at the point of an edge nearest to a spot, cutting the point into
   * the line where it falls between two of its points.
   */
  nodeNearest(edgeIndex: number, lat: number, lng: number): number {
    const edge = this.edges[edgeIndex] as BuildEdge;
    let best = { seg: 0, t: 0, distance: Infinity };
    for (let seg = 0; seg + 1 < edge.line.length; seg++) {
      const a = edge.line[seg] as [number, number];
      const b = edge.line[seg + 1] as [number, number];
      const { t, distance } = projectOnSegment(lat, lng, a[0], a[1], b[0], b[1]);
      if (distance < best.distance) best = { seg, t, distance };
    }
    if (best.t <= 0.02) return this.splitAt(edgeIndex, best.seg);
    if (best.t >= 0.98) return this.splitAt(edgeIndex, best.seg + 1);
    const a = edge.line[best.seg] as [number, number];
    const b = edge.line[best.seg + 1] as [number, number];
    edge.line.splice(best.seg + 1, 0, [a[0] + (b[0] - a[0]) * best.t, a[1] + (b[1] - a[1]) * best.t]);
    return this.splitAt(edgeIndex, best.seg + 1);
  }

  /**
   * The node `offset` metres along an edge from its end at `node`, cutting a
   * point into the line where none stands; the far end when the edge is shorter.
   */
  nodeAlong(edgeIndex: number, node: number, offset: number): number {
    const edge = this.edges[edgeIndex] as BuildEdge;
    const forward = edge.a === node;
    const last = edge.line.length - 1;
    let travelled = 0;
    for (let step = 1; step <= last; step++) {
      const fromAt = forward ? step - 1 : last - step + 1;
      const toAt = forward ? step : last - step;
      const from = edge.line[fromAt] as [number, number];
      const to = edge.line[toAt] as [number, number];
      const length = metresBetween(from[0], from[1], to[0], to[1]);
      if (travelled + length >= offset && length > 0) {
        const share = (offset - travelled) / length;
        if (share >= 0.999) return this.splitAt(edgeIndex, toAt);
        const point: [number, number] = [from[0] + (to[0] - from[0]) * share, from[1] + (to[1] - from[1]) * share];
        const insertAt = forward ? step : last - step + 1;
        edge.line.splice(insertAt, 0, point);
        return this.splitAt(edgeIndex, insertAt);
      }
      travelled += length;
    }
    return forward ? edge.b : edge.a;
  }

  live(): Array<{ edge: BuildEdge; index: number }> {
    return this.edges.flatMap((edge, index) => (edge.dead ? [] : [{ edge, index }]));
  }

  /** The live edges at each node, by index. */
  incidence(): number[][] {
    return this.nodes.map((_, node) => this.edgesAt(node));
  }

  lengthOf(edge: BuildEdge): number {
    return lineLength(edge.line);
  }

  distance(a: number, b: number): number {
    const p = this.nodes[a] as BuildNode;
    const q = this.nodes[b] as BuildNode;
    return metresBetween(p.lat, p.lng, q.lat, q.lng);
  }
}

/** Points of a set of lines bucketed on a grid of about 100 m, for the nearest point within a few hundred metres. */
export class PointGrid<T> {
  private readonly cells = new Map<string, Array<{ lat: number; lng: number; item: T }>>();
  private static readonly DEG = 0.001;

  private keyOf(lat: number, lng: number): string {
    return `${Math.floor(lat / PointGrid.DEG)}:${Math.floor(lng / PointGrid.DEG)}`;
  }

  add(lat: number, lng: number, item: T): void {
    const key = this.keyOf(lat, lng);
    const cell = this.cells.get(key);
    if (cell) cell.push({ lat, lng, item });
    else this.cells.set(key, [{ lat, lng, item }]);
  }

  /** The points within `radiusM`, nearest first. */
  near(lat: number, lng: number, radiusM: number): Array<{ item: T; distance: number; lat: number; lng: number }> {
    const reachLat = Math.ceil(radiusM / 111_195 / PointGrid.DEG);
    const reachLng = Math.ceil(radiusM / (111_195 * Math.cos((lat * Math.PI) / 180)) / PointGrid.DEG);
    const row = Math.floor(lat / PointGrid.DEG);
    const col = Math.floor(lng / PointGrid.DEG);
    const found: Array<{ item: T; distance: number; lat: number; lng: number }> = [];
    for (let r = row - reachLat; r <= row + reachLat; r++) {
      for (let c = col - reachLng; c <= col + reachLng; c++) {
        for (const point of this.cells.get(`${r}:${c}`) ?? []) {
          const distance = metresBetween(lat, lng, point.lat, point.lng);
          if (distance <= radiusM) found.push({ item: point.item, distance, lat: point.lat, lng: point.lng });
        }
      }
    }
    return found.sort((x, y) => x.distance - y.distance);
  }
}
