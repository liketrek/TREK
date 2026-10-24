import { EdgeKind, PortageSource, type WaterGraphData } from '../water-graph';
import { BuildState } from './build-state';
import type { CollectedWater } from './collect';
import { attachLakes, rasterizeLakes } from './lakes';
import { buildLines, joinDanglingEnds, type CoordOf } from './lines';
import { buildPortages } from './portages';

/**
 * PAD-11: the water network of a region from what the collector kept. The
 * order matters: lines first (with their barriers), then the lakes cut them
 * where they enter, then line ends left short are joined, and last the
 * barriers get their carries, on the network as it finally runs.
 */
export function buildWaterGraph(
  water: CollectedWater,
  coordOf: CoordOf,
  meta: { regionId: string; sourceTimestamp: string | null },
): WaterGraphData {
  const state = new BuildState();
  buildLines(water, coordOf, state);
  const lakes = attachLakes(state, rasterizeLakes(water, coordOf));
  joinDanglingEnds(state);
  buildPortages(state, water, coordOf);
  return freeze(state, lakes, meta);
}

function freeze(
  state: BuildState,
  lakes: WaterGraphData['lakes'],
  meta: { regionId: string; sourceTimestamp: string | null },
): WaterGraphData {
  const live = state.live().map(({ edge }) => edge);
  // Only nodes an edge or a lake still uses are kept, renumbered in the order they were made.
  const used = new Uint8Array(state.nodes.length);
  for (const edge of live) {
    used[edge.a] = 1;
    used[edge.b] = 1;
  }
  state.nodes.forEach((node, at) => {
    if (node.lake >= 0) used[at] = 1;
  });
  const renumber = new Int32Array(state.nodes.length).fill(-1);
  let count = 0;
  used.forEach((flag, at) => {
    if (flag) renumber[at] = count++;
  });

  const nodeLat = new Float64Array(count);
  const nodeLng = new Float64Array(count);
  const nodeLake = new Int32Array(count).fill(-1);
  state.nodes.forEach((node, at) => {
    const index = renumber[at] as number;
    if (index < 0) return;
    nodeLat[index] = node.lat;
    nodeLng[index] = node.lng;
    nodeLake[index] = node.lake;
  });

  const strings: string[] = [];
  const stringIndex = new Map<string, number>();
  const intern = (text: string | null): number => {
    if (text === null || text === '') return -1;
    const known = stringIndex.get(text);
    if (known !== undefined) return known;
    strings.push(text);
    stringIndex.set(text, strings.length - 1);
    return strings.length - 1;
  };

  const n = live.length;
  const edgeA = new Uint32Array(n);
  const edgeB = new Uint32Array(n);
  const edgeLength = new Float32Array(n);
  const edgeKind = new Uint8Array(n);
  const edgeFlow = new Uint8Array(n);
  const edgeCurrent = new Float32Array(n);
  const edgeAccess = new Uint8Array(n);
  const edgeOneway = new Uint8Array(n);
  const edgeGrade = new Uint8Array(n);
  const edgeGeomStart = new Uint32Array(n);
  const edgeGeomCount = new Uint32Array(n);
  const edgeName = new Int32Array(n);
  const edgeRef = new Int32Array(n);
  const edgeSource = new Uint8Array(n);
  const pool = new Float64Array(live.reduce((sum, edge) => sum + edge.line.length * 2, 0));
  const stats = { water_km: 0, lakes: lakes.length, portages: 0, inferred_portages: 0, gaps: 0, locks: 0 };
  // The straight carry beside a lock is an option, not a barrier without a portage; it stays out of the count.
  const lockRefs = new Set(live.filter((edge) => edge.kind === EdgeKind.lock).map((edge) => edge.ref));
  let cursor = 0;
  live.forEach((edge, index) => {
    edgeA[index] = renumber[edge.a] as number;
    edgeB[index] = renumber[edge.b] as number;
    const length = state.lengthOf(edge);
    edgeLength[index] = length;
    edgeKind[index] = edge.kind;
    edgeFlow[index] = edge.flow;
    edgeCurrent[index] = edge.current;
    edgeAccess[index] = edge.access;
    edgeOneway[index] = edge.oneway;
    edgeGrade[index] = edge.grade;
    edgeGeomStart[index] = cursor / 2;
    edgeGeomCount[index] = edge.line.length;
    for (const [lat, lng] of edge.line) {
      pool[cursor++] = lat;
      pool[cursor++] = lng;
    }
    edgeName[index] = intern(edge.name);
    edgeRef[index] = intern(edge.ref);
    edgeSource[index] = edge.source;
    if (edge.kind === EdgeKind.water || edge.kind === EdgeKind.connector || edge.kind === EdgeKind.pass)
      stats.water_km += length / 1000;
    else if (edge.kind === EdgeKind.gap) stats.gaps++;
    else if (edge.kind === EdgeKind.portage && !lockRefs.has(edge.ref)) {
      if (edge.source === PortageSource.inferred) stats.inferred_portages++;
      else stats.portages++;
    }
  });
  stats.water_km = Math.round(stats.water_km * 10) / 10;
  stats.locks = lockRefs.size;

  return {
    regionId: meta.regionId,
    sourceTimestamp: meta.sourceTimestamp,
    nodeLat,
    nodeLng,
    nodeLake,
    edgeA,
    edgeB,
    edgeLength,
    edgeKind,
    edgeFlow,
    edgeCurrent,
    edgeAccess,
    edgeOneway,
    edgeGrade,
    edgeGeomStart,
    edgeGeomCount,
    edgeName,
    edgeRef,
    edgeSource,
    pool,
    strings,
    lakes: lakes.map((lake) => ({ ...lake, portals: lake.portals.map((node) => renumber[node] as number) })),
    stats,
  };
}
