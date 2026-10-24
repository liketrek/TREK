import { metresBetween } from '../../../lib/geo/geo';
import { DIFF_UNKNOWN, DIFFICULTY_NAMES, EdgeFlag, Groom, Kind, LIFT_NAMES } from '../ski-graph.contract';
import { dismountSeconds, liftClassOf, Mode, type EdgeCosts } from './profile';
import type { Step } from './router';
import type { SkiNet } from './stitch';
import type { SkiFlag, SkiGeometryPoint, SkiLegSeconds, SkiRouteSegment, SkiSegmentKind, SkiWhy } from '@trek/shared';

/**
 * A found path as the planner reads it (spec 9.2): one line of points with
 * their heights, cut into stretches of one kind and one name (a run, a lift
 * with its wait, a link the data does not hold), with the time of each and
 * the totals, which are the stretches added up and nothing else.
 */

interface BuiltLeg {
  geometry: SkiGeometryPoint[];
  segments: SkiRouteSegment[];
  distance_m: number;
  climb_m: number;
  descent_m: number;
  seconds: SkiLegSeconds;
  /** Every flag on the way and how many stretches of edge carry it, for the notes. */
  flagCounts: Map<SkiFlag, number>;
}

/** The segment kind of an edge kind, before the mode it is travelled in says otherwise. */
const KIND_SEGMENT: readonly SkiSegmentKind[] = [
  'run',
  'lift',
  'rail',
  'lift',
  'lift',
  'nordic',
  'skitour',
  'hike',
  'hike',
  'connection',
  'area',
  'link',
  'crossing',
  'walk',
];

const DOWN_MODES: ReadonlySet<number> = new Set([Mode.LIFT_DOWN, Mode.BOARD_DOWN, Mode.ALIGHT_DOWN]);
const UP_MODES: ReadonlySet<number> = new Set([Mode.LIFT, Mode.BOARD, Mode.ALIGHT]);
const ON_FOOT_KINDS: ReadonlySet<number> = new Set([Kind.LINK, Kind.CROSSING, Kind.WALK]);

const GROOMING: ReadonlyArray<readonly [number, string]> = [
  [Groom.CLASSIC, 'classic'],
  [Groom.SKATING, 'skating'],
  [Groom.SCOOTER, 'scooter'],
  [Groom.BACKCOUNTRY, 'backcountry'],
  [Groom.MOGUL, 'mogul'],
];

const EDGE_FLAGS: ReadonlyArray<readonly [number, SkiFlag]> = [
  [EdgeFlag.INFERRED_LINK, 'inferred_link'],
  [EdgeFlag.INFERRED_CROSSING, 'inferred_crossing'],
  [EdgeFlag.DIR_FROM_DEM, 'dir_from_dem'],
  [EdgeFlag.DIR_CONFLICT, 'dir_conflict'],
  [EdgeFlag.RELATION_INHERITED, 'relation_inherited'],
  [EdgeFlag.AREA_DERIVED, 'area_derived'],
  [EdgeFlag.TUNNEL, 'tunnel'],
];

/** The flags the notes of a planned leg are built from (spec 7.6). */
const WHY_FLAGS: readonly SkiFlag[] = [
  'ride_down',
  'dir_from_dem',
  'technique_assumed',
  'inferred_link',
  'relation_inherited',
  'area_derived',
  'difficulty_unknown',
];

function segmentKind(net: SkiNet, e: number, mode: number): SkiSegmentKind {
  const kind = net.edgeKind[e] as number;
  if (DOWN_MODES.has(mode)) return 'lift_down';
  if (UP_MODES.has(mode)) return liftClassOf(net.edgeLift[e] as number) === 'rail' ? 'rail' : 'lift';
  if (mode === Mode.WALK && (kind === Kind.RUN || kind === Kind.AREA)) return 'crossing';
  return KIND_SEGMENT[kind] ?? 'walk';
}

export function difficultyName(diff: number): SkiRouteSegment['difficulty'] {
  return diff === DIFF_UNKNOWN ? null : (DIFFICULTY_NAMES[diff] ?? null);
}

const modeOf = (costs: EdgeCosts, step: Step): number =>
  (step.dir === 0 ? costs.modeFwd[step.edge] : costs.modeBack[step.edge]) as number;

/** The flags one stretch of edge carries, as travelled. */
function stepFlags(net: SkiNet, costs: EdgeCosts, step: Step): SkiFlag[] {
  const flags = net.edgeFlags[step.edge] as number;
  const kind = net.edgeKind[step.edge] as number;
  const mode = modeOf(costs, step);
  const out = EDGE_FLAGS.filter(([bit]) => flags & bit).map(([, flag]) => flag);
  if (flags & EdgeFlag.TECHNIQUE_ASSUMED && mode === Mode.NORDIC) out.push('technique_assumed');
  if (DOWN_MODES.has(mode)) out.push('ride_down');
  if (mode === Mode.UPHILL_PISTE) out.push('uphill_on_piste');
  const descending = mode === Mode.DOWNHILL || mode === Mode.SKITOUR_DOWN;
  if (descending && (kind === Kind.RUN || kind === Kind.AREA) && net.edgeDiff[step.edge] === DIFF_UNKNOWN) {
    out.push('difficulty_unknown');
  }
  const arrives = step.to === 1 || step.to === 0;
  const node = step.dir === 0 ? (net.edgeB[step.edge] as number) : (net.edgeA[step.edge] as number);
  if (arrives && dismountSeconds(net, node) > 0) out.push('dismount');
  return out;
}

/** The points of an edge between two shares of its length, in the direction travelled. */
function stepPoints(net: SkiNet, step: Step): SkiGeometryPoint[] {
  const first = net.geomStart[step.edge] as number;
  const last = (net.geomStart[step.edge + 1] as number) - 1;
  const at: number[] = [0];
  for (let i = first; i < last; i++) {
    const piece = metresBetween(
      net.geomLat[i] as number,
      net.geomLng[i] as number,
      net.geomLat[i + 1] as number,
      net.geomLng[i + 1] as number,
    );
    at.push((at[at.length - 1] as number) + piece);
  }
  const total = at[at.length - 1] as number;
  const share = (k: number) => (total > 0 ? (at[k] as number) / total : k / Math.max(1, last - first));
  const pointAt = (f: number): SkiGeometryPoint => {
    let k = 0;
    while (k < last - first - 1 && share(k + 1) < f) k++;
    const span = share(k + 1) - share(k);
    const r = span > 0 ? Math.min(1, Math.max(0, (f - share(k)) / span)) : 0;
    const a = first + k;
    const ele = (net.geomEle[a] as number) + ((net.geomEle[a + 1] as number) - (net.geomEle[a] as number)) * r;
    return [
      (net.geomLat[a] as number) + ((net.geomLat[a + 1] as number) - (net.geomLat[a] as number)) * r,
      (net.geomLng[a] as number) + ((net.geomLng[a + 1] as number) - (net.geomLng[a] as number)) * r,
      Number.isFinite(ele) ? Math.round(ele) : null,
    ];
  };
  const low = Math.min(step.from, step.to);
  const high = Math.max(step.from, step.to);
  const points: SkiGeometryPoint[] = [pointAt(low)];
  for (let k = 1; k < last - first; k++) {
    const f = share(k);
    if (f > low && f < high) {
      const ele = net.geomEle[first + k] as number;
      points.push([
        net.geomLat[first + k] as number,
        net.geomLng[first + k] as number,
        Number.isFinite(ele) ? ele : null,
      ]);
    }
  }
  points.push(pointAt(high));
  return step.from <= step.to ? points : points.reverse();
}

const samePoint = (a: SkiGeometryPoint, b: SkiGeometryPoint) =>
  Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;

interface Piece {
  key: string;
  segment: SkiRouteSegment;
}

/** One stretch of edge as a segment of its own, before neighbours of the same kind and name are joined. */
function stepSegment(net: SkiNet, costs: EdgeCosts, step: Step, from: number, to: number): Piece {
  const e = step.edge;
  const mode = modeOf(costs, step);
  const share = Math.abs(step.to - step.from);
  const time = ((step.dir === 0 ? costs.timeFwd[e] : costs.timeBack[e]) as number) * share;
  const kind = segmentKind(net, e, mode);
  const waits = mode === Mode.BOARD || mode === Mode.BOARD_DOWN;
  const lift = net.edgeLift[e] as number;
  const liftType = lift > 0 ? (LIFT_NAMES[lift] ?? null) : null;
  const pisteKind = kind === 'run' || kind === 'area' || kind === 'connection';
  const difficulty = pisteKind ? difficultyName(net.edgeDiff[e] as number) : null;
  const name = net.edgeName[e] ?? null;
  const ref = net.edgeRef[e] ?? null;
  const way = net.edgeWay[e] as number;
  return {
    key: [kind, name, ref, difficulty, liftType].join('|'),
    segment: {
      kind,
      from,
      to,
      name,
      ref,
      difficulty,
      lift_type: liftType,
      grooming: GROOMING.filter(([bit]) => (net.edgeGroom[e] as number) & bit).map(([, label]) => label),
      seconds: waits ? 0 : time,
      wait_seconds: waits ? time : 0,
      length_m: (net.edgeLen[e] as number) * share,
      flags: stepFlags(net, costs, step),
      osm_way: way > 0 ? way : null,
    },
  };
}

/** Which of the four totals a stretch of edge counts towards. */
function bucketOf(net: SkiNet, costs: EdgeCosts, step: Step): keyof SkiLegSeconds {
  const mode = modeOf(costs, step);
  if (mode === Mode.BOARD || mode === Mode.BOARD_DOWN) return 'wait';
  if (UP_MODES.has(mode) || DOWN_MODES.has(mode)) return 'lift';
  if (mode === Mode.WALK || ON_FOOT_KINDS.has(net.edgeKind[step.edge] as number)) return 'walk';
  return 'ski';
}

/** A found path as a leg: its line, its stretches and its totals. */
export function buildLeg(net: SkiNet, costs: EdgeCosts, steps: readonly Step[], start: [number, number, number]) {
  const geometry: SkiGeometryPoint[] = [];
  const pieces: Piece[] = [];
  const seconds: SkiLegSeconds = { ski: 0, lift: 0, wait: 0, walk: 0 };
  const flagCounts = new Map<SkiFlag, number>();
  let climb = 0;
  let descent = 0;
  let distance = 0;
  for (const step of steps) {
    if (Math.abs(step.to - step.from) < 1e-9) continue;
    const points = stepPoints(net, step);
    const last = geometry[geometry.length - 1];
    const joins = last !== undefined && samePoint(last, points[0] as SkiGeometryPoint);
    const from = joins ? geometry.length - 1 : geometry.length;
    geometry.push(...(joins ? points.slice(1) : points));
    const piece = stepSegment(net, costs, step, from, geometry.length - 1);
    pieces.push(piece);
    const share = Math.abs(step.to - step.from);
    const up = step.dir === 0 ? net.edgeUp[step.edge] : net.edgeDown[step.edge];
    const down = step.dir === 0 ? net.edgeDown[step.edge] : net.edgeUp[step.edge];
    climb += (up as number) * share;
    descent += (down as number) * share;
    distance += piece.segment.length_m;
    const bucket = bucketOf(net, costs, step);
    seconds[bucket] += piece.segment.seconds + piece.segment.wait_seconds;
    for (const flag of piece.segment.flags) flagCounts.set(flag, (flagCounts.get(flag) ?? 0) + 1);
  }
  if (geometry.length < 2) {
    // Both ends on one spot: a leg of no length, still a line of two points.
    const spot: SkiGeometryPoint = [start[0], start[1], Number.isFinite(start[2]) ? start[2] : null];
    geometry.splice(0, geometry.length, spot, [...spot]);
    pieces.splice(0, pieces.length, {
      key: 'walk',
      segment: {
        kind: 'walk',
        from: 0,
        to: 1,
        name: null,
        ref: null,
        difficulty: null,
        lift_type: null,
        grooming: [],
        seconds: 0,
        wait_seconds: 0,
        length_m: 0,
        flags: [],
        osm_way: null,
      },
    });
  }
  return {
    geometry,
    segments: joinPieces(pieces),
    distance_m: round1(distance),
    climb_m: Math.round(climb),
    descent_m: Math.round(descent),
    // Not rounded, here or in the segments: the totals are the segments added up, to the second.
    seconds,
    flagCounts,
  } satisfies BuiltLeg;
}

const round1 = (value: number): number => Math.round(value * 10) / 10;

/** Neighbouring stretches of one kind and name as one segment; a lift's wait, ride and exit become one. */
function joinPieces(pieces: readonly Piece[]): SkiRouteSegment[] {
  const out: Array<{ key: string; segment: SkiRouteSegment }> = [];
  for (const piece of pieces) {
    const previous = out[out.length - 1];
    if (previous && previous.key === piece.key) {
      const joined = previous.segment;
      joined.to = piece.segment.to;
      joined.seconds += piece.segment.seconds;
      joined.wait_seconds += piece.segment.wait_seconds;
      joined.length_m += piece.segment.length_m;
      joined.flags = [...new Set([...joined.flags, ...piece.segment.flags])];
      joined.grooming = [...new Set([...joined.grooming, ...piece.segment.grooming])];
      joined.osm_way ??= piece.segment.osm_way;
      continue;
    }
    out.push({ key: piece.key, segment: { ...piece.segment } });
  }
  return out.map(({ segment }) => ({ ...segment, length_m: round1(segment.length_m) }));
}

/** The flag notes of a planned leg, from the flags its stretches carry. */
export function flagNotes(flagCounts: ReadonlyMap<SkiFlag, number>): SkiWhy[] {
  return WHY_FLAGS.flatMap((flag) => {
    const count = flagCounts.get(flag) ?? 0;
    return count > 0 ? [{ kind: 'flag' as const, flag, count }] : [];
  });
}

/** The total time of a built leg, waits included. */
export const legSeconds = (leg: Pick<BuiltLeg, 'seconds'>): number =>
  leg.seconds.ski + leg.seconds.lift + leg.seconds.wait + leg.seconds.walk;
