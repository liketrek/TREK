import type { TourTrailGrade } from '@trek/shared';
import { decodePolyline } from '../../Map/transitGeometry';

/**
 * BIK-01 to BIK-05, RUN-02: what a bike tour or a run runs on, read from the
 * router's own description of the ways along its line (Valhalla's trace
 * attributes): the surface, the kind of way, the hiking grade, and the
 * OpenStreetMap way behind each stretch. Pure, so the classes and their
 * shares are tested apart from the request.
 */

/** Surfaces from smooth to rough; `unknown` where the data names none. */
export type SurfaceClass = 'paved' | 'rough' | 'compacted' | 'gravel' | 'ground' | 'unknown';

/** Kinds of way, the ones a rider plans by. */
export type WayClass = 'cyclePath' | 'cycleLane' | 'quiet' | 'road' | 'track' | 'path' | 'ferry' | 'other';

/**
 * mtb:scale steps as a rider reads them: S0 to S3 apart, S4 and up together
 * (rare, and all of them expert ground); `none` where OpenStreetMap gives the
 * way no grade, `unasked` where it could not be asked this time.
 */
export type TrailClass = 's0' | 's1' | 's2' | 's3' | 's4' | 'none' | 'unasked';

/**
 * RUN-02: sac_scale steps, T1 to T6, as OpenStreetMap mappers gave them to a
 * way; `none` where the way has no grade (the router's 0), which is unknown,
 * never easy.
 */
export type SacClass = 't1' | 't2' | 't3' | 't4' | 't5' | 't6' | 'none';

/** Surfaces a road bike's rider calls unpaved (BIK-02): what is no paving of any kind. */
export const UNPAVED: ReadonlySet<SurfaceClass> = new Set(['compacted', 'gravel', 'ground']);

export interface RouteWayEdge {
  /** Where on the line the stretch starts and ends, as indices into `RouteWays.line`. */
  from: number;
  to: number;
  lengthM: number;
  surface: SurfaceClass;
  way: WayClass;
  sac: SacClass;
  /** The OpenStreetMap way, where the router names it. */
  wayId: number | null;
}

export interface RouteWays {
  /** The line as the router matched it, which the stretches index into. */
  line: [number, number][];
  edges: RouteWayEdge[];
}

const SURFACE_OF: Record<string, SurfaceClass> = {
  paved_smooth: 'paved',
  paved: 'paved',
  paved_rough: 'rough',
  compacted: 'compacted',
  gravel: 'gravel',
  dirt: 'ground',
  path: 'ground',
};

const PATH_USES = new Set([
  'path',
  'footway',
  'pedestrian',
  'bridleway',
  'mountain_bike',
  'steps',
  'sidewalk',
  'pedestrian_crossing',
  'elevator',
]);
const QUIET_ROAD_CLASSES = new Set(['residential', 'service_other', 'unclassified']);

function wayOf(use: string | undefined, roadClass: string | undefined, cycleLane: string | undefined): WayClass {
  if (use === 'cycleway' || use === 'cycle_street') return 'cyclePath';
  if (use === 'ferry' || use === 'rail_ferry') return 'ferry';
  if (use === 'track') return 'track';
  if (use && PATH_USES.has(use)) return 'path';
  if (
    use === 'living_street' ||
    use === 'service_road' ||
    use === 'driveway' ||
    use === 'alley' ||
    use === 'parking_aisle'
  )
    return 'quiet';
  if (use === 'road') {
    if (cycleLane === 'dedicated' || cycleLane === 'separated') return 'cycleLane';
    return roadClass && QUIET_ROAD_CLASSES.has(roadClass) ? 'quiet' : 'road';
  }
  return 'other';
}

interface TraceEdge {
  surface?: unknown;
  use?: unknown;
  road_class?: unknown;
  cycle_lane?: unknown;
  sac_scale?: unknown;
  length?: unknown;
  way_id?: unknown;
  begin_shape_index?: unknown;
  end_shape_index?: unknown;
}

const text = (value: unknown) => (typeof value === 'string' ? value : undefined);
const count = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null);

/** The router's sac_scale, 1 to 6, as its step; 0, no value or anything else is no grade. */
export function sacClassOf(value: unknown): SacClass {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 6
    ? (`t${value}` as SacClass)
    : 'none';
}

/**
 * The router's answer read into stretches, or null when it is no answer of
 * that kind. Edge lengths come in kilometres; an edge without its place on the
 * line is dropped rather than placed by guess.
 */
export function routeWaysFrom(answer: unknown): RouteWays | null {
  const data = answer as { shape?: unknown; edges?: unknown } | null;
  if (!data || typeof data.shape !== 'string' || !Array.isArray(data.edges)) return null;
  const line = decodePolyline(data.shape, 6);
  if (line.length < 2) return null;
  const edges: RouteWayEdge[] = [];
  for (const raw of data.edges as TraceEdge[]) {
    const from = count(raw.begin_shape_index);
    const to = count(raw.end_shape_index);
    const km = count(raw.length);
    if (from === null || to === null || km === null || to < from || to >= line.length) continue;
    const surface = SURFACE_OF[text(raw.surface) ?? ''] ?? 'unknown';
    const wayId = count(raw.way_id);
    edges.push({
      from,
      to,
      lengthM: km * 1000,
      surface,
      way: wayOf(text(raw.use), text(raw.road_class), text(raw.cycle_lane)),
      sac: sacClassOf(raw.sac_scale),
      wayId: wayId && wayId > 0 ? wayId : null,
    });
  }
  return edges.length ? { line, edges } : null;
}

/** A trail grade's class: the step of mtb:scale, S4 and up together. */
export function trailClassOf(grade: Pick<TourTrailGrade, 'mtb_scale'> | undefined): TrailClass {
  const step = grade?.mtb_scale ? Number(grade.mtb_scale[0]) : null;
  if (step === null || Number.isNaN(step)) return 'none';
  return step >= 4 ? 's4' : (`s${step}` as TrailClass);
}

export interface ClassShare<C extends string> {
  key: C;
  lengthM: number;
  /** Of the whole line, 0 to 1. */
  share: number;
}

/** How much of the line falls in each class, the largest first; classes it has none of are left out. */
export function sharesBy<C extends string>(ways: RouteWays, classOf: (edge: RouteWayEdge) => C): ClassShare<C>[] {
  const total = ways.edges.reduce((sum, edge) => sum + edge.lengthM, 0);
  const sums = new Map<C, number>();
  for (const edge of ways.edges) sums.set(classOf(edge), (sums.get(classOf(edge)) ?? 0) + edge.lengthM);
  return [...sums]
    .filter(([, lengthM]) => lengthM > 0)
    .map(([key, lengthM]) => ({ key, lengthM, share: total > 0 ? lengthM / total : 0 }))
    .sort((a, b) => b.lengthM - a.lengthM);
}

/**
 * The share of the line known to be unpaved, 0 to 1. A line with a surface on record but none of it
 * unpaved is a plain 0, so a fully paved route says so; null only where no surface is known at all.
 */
export function unpavedShareOf(ways: RouteWays): number | null {
  const row = sharesBy(ways, (edge) => (UNPAVED.has(edge.surface) ? 'unpaved' : 'other')).find(
    (share) => share.key === 'unpaved'
  );
  if (row) return row.share;
  return ways.edges.some((edge) => edge.lengthM > 0 && edge.surface !== 'unknown') ? 0 : null;
}

/** The stretches of the line in one class, neighbours joined, each as its own line for the map. */
export function stretchesOf(ways: RouteWays, inClass: (edge: RouteWayEdge) => boolean): [number, number][][] {
  const stretches: [number, number][][] = [];
  let open: { from: number; to: number } | null = null;
  const close = () => {
    if (open && open.to > open.from) stretches.push(ways.line.slice(open.from, open.to + 1));
    open = null;
  };
  for (const edge of ways.edges) {
    if (!inClass(edge)) {
      close();
      continue;
    }
    if (open && edge.from <= open.to) open.to = Math.max(open.to, edge.to);
    else {
      close();
      open = { from: edge.from, to: edge.to };
    }
  }
  close();
  return stretches;
}

/** The ways along the line OpenStreetMap could grade, each once, in the order they are ridden. */
export function wayIdsOf(ways: RouteWays, limit: number): number[] {
  const ids: number[] = [];
  const seen = new Set<number>();
  for (const edge of ways.edges) {
    if (edge.wayId === null || seen.has(edge.wayId)) continue;
    seen.add(edge.wayId);
    ids.push(edge.wayId);
    if (ids.length === limit) break;
  }
  return ids;
}

/** A share of the route as it reads, in whole percent. */
export const percent = (share: number) => `${Math.round(share * 100)} %`;

type GradedClass = Exclude<SacClass, 'none'>;

/** The steps from easy to hard, so the hardest one along the route is the last one found. */
const SAC_STEPS: readonly GradedClass[] = ['t1', 't2', 't3', 't4', 't5', 't6'];

/** RUN-02: the hardest graded step along the route, or null when no way on it carries a grade. */
export function hardestSac(ways: RouteWays): GradedClass | null {
  const found = new Set(ways.edges.filter((edge) => edge.lengthM > 0).map((edge) => edge.sac));
  return [...SAC_STEPS].reverse().find((step) => found.has(step)) ?? null;
}
