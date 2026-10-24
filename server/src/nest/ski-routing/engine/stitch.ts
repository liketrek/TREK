import { poolString } from '../ski-graph';
import { ELE_MISSING, EdgeFlag, NodeFlag, type SkiGraphData } from '../ski-graph.contract';

/**
 * The network the router searches: one area's graph, or up to four pieces of
 * a large network stitched together. Coordinates are degrees, heights metres
 * (NaN where the terrain data has none), names read out of the string pools,
 * and every node knows its edges.
 *
 * Stitching follows the writer's own check (`stitch` in `winter/qa.py`): a
 * node flagged `boundary` with a positive OSM id is one node in every piece
 * that holds it, and an edge two pieces both carry (the halo one piece keeps
 * of its neighbour) is kept once, the copy without `halo` winning. A synthetic
 * node (negative id) is never joined to anything.
 */
export interface SkiNet {
  areaIds: string[];
  colourScheme: 'europe' | 'north_america';
  nodeCount: number;
  edgeCount: number;
  nodeLat: Float64Array;
  nodeLng: Float64Array;
  nodeEle: Float64Array;
  nodeFlags: Uint16Array;
  nodeOsm: Float64Array;
  edgeA: Uint32Array;
  edgeB: Uint32Array;
  edgeLen: Float64Array;
  edgeUp: Float64Array;
  edgeDown: Float64Array;
  edgeKind: Uint8Array;
  edgeFwd: Uint16Array;
  edgeBack: Uint16Array;
  edgeDiff: Uint8Array;
  edgeGroom: Uint8Array;
  edgeLift: Uint8Array;
  edgeLiftSec: Uint16Array;
  edgeLiftCap: Uint16Array;
  edgeFlags: Uint32Array;
  edgeName: Array<string | null>;
  edgeRef: Array<string | null>;
  edgeWay: Float64Array;
  /** Where each edge's points start in the point pool; `geomStart[e + 1]` is where they end. */
  geomStart: Uint32Array;
  geomLat: Float64Array;
  geomLng: Float64Array;
  geomEle: Float64Array;
  /** The edges at each node: `adjEdge[adjStart[n] .. adjStart[n + 1]]`. */
  adjStart: Uint32Array;
  adjEdge: Uint32Array;
  /** Roughly what the arrays take, for the cache's budget. */
  bytes: number;
}

interface EdgeRef {
  graph: SkiGraphData;
  index: number;
  remap: Int32Array;
  halo: boolean;
}

/** An edge's identity across pieces: its way and its exact line. */
function edgeKey(graph: SkiGraphData, e: number): string {
  const start = graph.edgeGeomOff[e] as number;
  const end = graph.edgeGeomOff[e + 1] as number;
  const parts: number[] = [graph.edgeWay[e] as number];
  for (let i = start; i < end; i++) parts.push(graph.geomLatE7[i] as number, graph.geomLngE7[i] as number);
  return parts.join(',');
}

const metres = (value: number): number => (value === ELE_MISSING ? Number.NaN : value);

/** The edges to keep of all pieces, in the order they were first met, and each piece's node numbering. */
function collect(graphs: readonly SkiGraphData[]) {
  const byOsm = new Map<number, number>();
  const nodes: Array<{ graph: SkiGraphData; index: number }> = [];
  const edges = new Map<string, EdgeRef>();
  let anonymous = 0;
  for (const graph of graphs) {
    const remap = new Int32Array(graph.header.nodeCount);
    for (let i = 0; i < graph.header.nodeCount; i++) {
      const osm = graph.nodeOsm[i] as number;
      const stitchable = graphs.length > 1 && osm > 0 && ((graph.nodeFlags[i] as number) & NodeFlag.BOUNDARY) !== 0;
      const known = stitchable ? byOsm.get(osm) : undefined;
      if (known !== undefined) {
        remap[i] = known;
        continue;
      }
      remap[i] = nodes.length;
      if (stitchable) byOsm.set(osm, nodes.length);
      nodes.push({ graph, index: i });
    }
    for (let e = 0; e < graph.header.edgeCount; e++) {
      const halo = ((graph.edgeFlags[e] as number) & EdgeFlag.HALO) !== 0;
      // One piece alone has nothing to deduplicate.
      const key = graphs.length > 1 ? edgeKey(graph, e) : String(anonymous++);
      const kept = edges.get(key);
      if (kept && (halo || !kept.halo)) continue;
      edges.set(key, { graph, index: e, remap, halo });
    }
  }
  return { nodes, edges: [...edges.values()] };
}

/** The network of one area (or of the pieces of one) as the router searches it. */
export function stitchGraphs(graphs: readonly SkiGraphData[]): SkiNet {
  if (graphs.length === 0) throw new Error('No graph to stitch');
  const { nodes, edges } = collect(graphs);
  const n = nodes.length;
  const m = edges.length;
  let points = 0;
  for (const { graph, index } of edges) {
    points += (graph.edgeGeomOff[index + 1] as number) - (graph.edgeGeomOff[index] as number);
  }

  const net: SkiNet = {
    areaIds: graphs.map((graph) => graph.header.areaId ?? ''),
    colourScheme: graphs[0]?.header.colourScheme === 'north_america' ? 'north_america' : 'europe',
    nodeCount: n,
    edgeCount: m,
    nodeLat: new Float64Array(n),
    nodeLng: new Float64Array(n),
    nodeEle: new Float64Array(n),
    nodeFlags: new Uint16Array(n),
    nodeOsm: new Float64Array(n),
    edgeA: new Uint32Array(m),
    edgeB: new Uint32Array(m),
    edgeLen: new Float64Array(m),
    edgeUp: new Float64Array(m),
    edgeDown: new Float64Array(m),
    edgeKind: new Uint8Array(m),
    edgeFwd: new Uint16Array(m),
    edgeBack: new Uint16Array(m),
    edgeDiff: new Uint8Array(m),
    edgeGroom: new Uint8Array(m),
    edgeLift: new Uint8Array(m),
    edgeLiftSec: new Uint16Array(m),
    edgeLiftCap: new Uint16Array(m),
    edgeFlags: new Uint32Array(m),
    edgeName: new Array<string | null>(m),
    edgeRef: new Array<string | null>(m),
    edgeWay: new Float64Array(m),
    geomStart: new Uint32Array(m + 1),
    geomLat: new Float64Array(points),
    geomLng: new Float64Array(points),
    geomEle: new Float64Array(points),
    adjStart: new Uint32Array(n + 1),
    adjEdge: new Uint32Array(2 * m),
    bytes: 0,
  };

  nodes.forEach(({ graph, index }, i) => {
    net.nodeLat[i] = (graph.nodeLatE7[index] as number) / 1e7;
    net.nodeLng[i] = (graph.nodeLngE7[index] as number) / 1e7;
    net.nodeEle[i] = metres(graph.nodeEle[index] as number);
    net.nodeFlags[i] = graph.nodeFlags[index] as number;
    net.nodeOsm[i] = graph.nodeOsm[index] as number;
  });

  let at = 0;
  edges.forEach(({ graph, index, remap }, e) => {
    net.edgeA[e] = remap[graph.edgeA[index] as number] as number;
    net.edgeB[e] = remap[graph.edgeB[index] as number] as number;
    net.edgeLen[e] = graph.edgeLen[index] as number;
    net.edgeUp[e] = graph.edgeUp[index] as number;
    net.edgeDown[e] = graph.edgeDown[index] as number;
    net.edgeKind[e] = graph.edgeKind[index] as number;
    net.edgeFwd[e] = graph.edgeFwdUses[index] as number;
    net.edgeBack[e] = graph.edgeBackUses[index] as number;
    net.edgeDiff[e] = graph.edgeDiff[index] as number;
    net.edgeGroom[e] = graph.edgeGroom[index] as number;
    net.edgeLift[e] = graph.edgeLift[index] as number;
    net.edgeLiftSec[e] = graph.edgeLiftSec[index] as number;
    net.edgeLiftCap[e] = graph.edgeLiftCap[index] as number;
    net.edgeFlags[e] = graph.edgeFlags[index] as number;
    net.edgeName[e] = poolString(graph.strings, graph.edgeName[index] as number);
    net.edgeRef[e] = poolString(graph.strings, graph.edgeRef[index] as number);
    net.edgeWay[e] = graph.edgeWay[index] as number;
    net.geomStart[e] = at;
    for (let i = graph.edgeGeomOff[index] as number; i < (graph.edgeGeomOff[index + 1] as number); i++) {
      net.geomLat[at] = (graph.geomLatE7[i] as number) / 1e7;
      net.geomLng[at] = (graph.geomLngE7[i] as number) / 1e7;
      net.geomEle[at] = metres(graph.geomEle[i] as number);
      at++;
    }
  });
  net.geomStart[m] = at;
  buildAdjacency(net);
  net.bytes = n * 34 + m * 80 + points * 24;
  return net;
}

/** Every node's edges, a self-loop listed once. */
function buildAdjacency(net: SkiNet): void {
  const degree = new Uint32Array(net.nodeCount + 1);
  for (let e = 0; e < net.edgeCount; e++) {
    const a = net.edgeA[e] as number;
    const b = net.edgeB[e] as number;
    degree[a + 1] = (degree[a + 1] as number) + 1;
    if (b !== a) degree[b + 1] = (degree[b + 1] as number) + 1;
  }
  for (let i = 1; i <= net.nodeCount; i++) degree[i] = (degree[i] as number) + (degree[i - 1] as number);
  net.adjStart.set(degree);
  const fill = degree.slice(0, net.nodeCount);
  for (let e = 0; e < net.edgeCount; e++) {
    const a = net.edgeA[e] as number;
    const b = net.edgeB[e] as number;
    net.adjEdge[fill[a] as number] = e;
    fill[a] = (fill[a] as number) + 1;
    if (b !== a) {
      net.adjEdge[fill[b] as number] = e;
      fill[b] = (fill[b] as number) + 1;
    }
  }
}
