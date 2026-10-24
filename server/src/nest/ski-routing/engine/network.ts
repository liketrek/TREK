import { LocalFrame } from '../../../lib/geo/geo';
import { encodePolyline } from '../../../utils/polyline';
import { Kind, LIFT_NAMES, Use } from '../ski-graph.contract';
import { difficultyName } from './segments';
import type { SkiNet } from './stitch';
import type { SkiNetworkFeature, SkiSegmentKind } from '@trek/shared';

/**
 * An area's runs, lifts and trails as lines for the planner's map (spec 10.4):
 * each drawn edge simplified (Douglas-Peucker, 5 m) and encoded as a
 * Google polyline with what the map labels it by. Links, crossings, station
 * edges and the open-slope edges between an area's portals are not drawn;
 * the raster overlay shows the slopes themselves.
 */

/** Drawn edge kinds and the kind each is drawn as. */
const DRAWN: ReadonlyMap<number, SkiSegmentKind> = new Map<number, SkiSegmentKind>([
  [Kind.RUN, 'run'],
  [Kind.LIFT, 'lift'],
  [Kind.RAIL, 'rail'],
  [Kind.NORDIC, 'nordic'],
  [Kind.SKITOUR, 'skitour'],
  [Kind.HIKE, 'hike'],
  [Kind.SLED_WALKUP, 'hike'],
  [Kind.CONNECTION, 'connection'],
]);

/** Above this the lines are simplified harder. */
const NETWORK_MAX_BYTES = 3 * 1024 * 1024;

/** The points of a line that stay within `tolerance` metres of it, its ends always kept. */
export function simplifyLine(points: ReadonlyArray<[number, number]>, tolerance: number): Array<[number, number]> {
  if (points.length <= 2) return [...points];
  const first = points[0] as [number, number];
  const frame = new LocalFrame(first[0], first[1]);
  const xy = points.map(([lat, lng]) => [frame.x(lng), frame.y(lat)] as const);
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: Array<[number, number]> = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [from, to] = stack.pop() as [number, number];
    const [ax, ay] = xy[from] as readonly [number, number];
    const [bx, by] = xy[to] as readonly [number, number];
    const dx = bx - ax;
    const dy = by - ay;
    const length2 = dx * dx + dy * dy;
    let worst = -1;
    let worstDistance = tolerance;
    for (let i = from + 1; i < to; i++) {
      const [px, py] = xy[i] as readonly [number, number];
      const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length2));
      const distance = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
      if (distance > worstDistance) {
        worstDistance = distance;
        worst = i;
      }
    }
    if (worst < 0) continue;
    keep[worst] = 1;
    stack.push([from, worst], [worst, to]);
  }
  return points.filter((_, i) => keep[i] === 1);
}

function featureOf(net: SkiNet, e: number, kind: SkiSegmentKind, tolerance: number): SkiNetworkFeature {
  const line: Array<[number, number]> = [];
  for (let i = net.geomStart[e] as number; i < (net.geomStart[e + 1] as number); i++) {
    line.push([net.geomLat[i] as number, net.geomLng[i] as number]);
  }
  const fwd = net.edgeFwd[e] as number;
  const back = net.edgeBack[e] as number;
  const lift = net.edgeLift[e] as number;
  const riddenOneWay = (fwd & Use.LIFT_UP) !== 0 && (back & (Use.LIFT_UP | Use.LIFT_DOWN)) === 0;
  const skiedOneWay = (fwd & Use.DOWNHILL) !== 0 && (back & Use.DOWNHILL) === 0;
  return {
    kind,
    difficulty: kind === 'run' || kind === 'connection' ? difficultyName(net.edgeDiff[e] as number) : null,
    name: net.edgeName[e] ?? net.edgeRef[e] ?? null,
    lift_type: lift > 0 ? (LIFT_NAMES[lift] ?? null) : null,
    oneway: kind === 'lift' || kind === 'rail' ? riddenOneWay : skiedOneWay,
    line: encodePolyline(simplifyLine(line, tolerance), 5),
  };
}

/** The drawn lines of a network, simplified at 5 m, or at 15 m when that comes to more than 3 MB. */
export function networkFeatures(net: SkiNet): { features: SkiNetworkFeature[]; simplified_m: number } {
  let result: { features: SkiNetworkFeature[]; simplified_m: number } = { features: [], simplified_m: 5 };
  for (const tolerance of [5, 15]) {
    const features: SkiNetworkFeature[] = [];
    let bytes = 0;
    for (let e = 0; e < net.edgeCount; e++) {
      const kind = DRAWN.get(net.edgeKind[e] as number);
      if (!kind) continue;
      const feature = featureOf(net, e, kind, tolerance);
      bytes += feature.line.length + (feature.name?.length ?? 0) + 80;
      features.push(feature);
    }
    result = { features, simplified_m: tolerance };
    if (bytes <= NETWORK_MAX_BYTES) break;
  }
  return result;
}
