import { compareCodeUnits } from '../common/compare';
import {
  PADDLE_BLOCKING_KINDS,
  paddleAccessOf,
  type PaddleAccess,
  type PaddleCoverageRegion,
  type PaddleFeature,
  type PaddleGeometry,
} from '../paddle/paddle-obstacles.schema';
import {
  distanceToRouteM,
  MAX_PASSAGES,
  NEAR_M,
  ON_ROUTE_M,
  PASSAGE_GAP_M,
  relateObstaclesToRoute,
  routePassages,
} from '../paddle/paddle-route-relation';
import {
  isCarriedAt,
  materialOf,
  PORTAGE_PROOF_SLACK_M,
  pointAlong,
  routeTokenOf,
  sameRouteToken,
  sameSourceToken,
  sourceTokenOf,
  type PaddleCheckLine,
} from './paddle-check-basis';
import {
  OBSTACLE_REFS_MAX,
  type ObstacleDecision,
  type ObstacleEntryStatus,
  type ObstacleSnapshot,
  type PaddleCheck,
  type TourObstacleEntry,
  type TourOwnEntry,
} from './paddle-check.schema';
import type { PaddleBoatType } from './tours.schema';

/**
 * PAD-06 and PAD-09 as plain functions the server runs and the client reuses
 * for its optimistic writes: which obstacles of the data a paddle tour has to
 * decide about, how each stands with the decision stored for it, and what the
 * check bench sums up. A decision is the paddler's own plan; a ban in the data
 * stays counted whatever was decided, and nothing here clears a tour.
 */

/** The one an obstacle checklist decides about: a lock's parts together, everything else on its own. */
export function paddleObstacleKeyOf(feature: Pick<PaddleFeature, 'ref' | 'group_key'>): string {
  return feature.group_key ?? feature.ref;
}

/** Access values that let anyone paddle; any other value, a condition, a ban or private water asks for a decision. */
const OPEN_ACCESS = new Set(['yes', 'designated', 'permissive', 'official']);

/**
 * Whether an object belongs on the checklist: an obstacle, or an access rule
 * that restricts paddling. A river tagged `canoe=yes` is no entry; an unknown
 * value is one, since missing or unclear values are no permission.
 */
export function isChecklistRelevant(feature: PaddleFeature): boolean {
  if (!PADDLE_BLOCKING_KINDS.includes(feature.kind)) return false;
  if (feature.kind !== 'access') return true;
  const access = paddleAccessOf(feature.tags);
  return (
    access.forbidden ||
    access.private ||
    access.condition !== null ||
    (access.value !== null && !OPEN_ACCESS.has(access.value))
  );
}

/** What the data says about walking a carrying way: forbidden, private, or nothing against it. */
export function portageWayRestriction(tags: Readonly<Record<string, string>>): 'forbidden' | 'private' | null {
  const value = tags['portage:access'] ?? tags.access;
  if (value === 'no') return 'forbidden';
  if (value === 'private') return 'private';
  return null;
}

/** A checklist entry as the data and the line make it, before a stored decision is laid over it. */
export interface ObstacleCandidate extends Omit<TourObstacleEntry, 'status' | 'changed' | 'basis' | 'decision'> {
  route: string;
  source: string;
  region_id: string | null;
  /** Metres along the line of each passage, in route order. */
  passage_m: number[];
}

/** One stored decision as the checklist reads it. */
export interface StoredObstacleReview {
  obstacle_key: string;
  decision: ObstacleDecision;
  note: string | null;
  route_fingerprint: string;
  source_fingerprint: string;
  snapshot: ObstacleSnapshot;
  decided_at: string;
  decided_by: number | null;
}

/** An object's points as [lat, lng], read as plain numbers (the client compiles this without strict mode). */
export function paddleGeometryPoints(geometry: PaddleGeometry): Array<[number, number]> {
  const pair = (position: readonly unknown[]): [number, number] => [Number(position[1]), Number(position[0])];
  if (geometry.type === 'Point') return [pair(geometry.coordinates)];
  if (geometry.type === 'LineString') return geometry.coordinates.map(pair);
  return (geometry.coordinates[0] ?? []).map(pair);
}

/**
 * Where an object stands as one point: a point itself, a line or an area the
 * middle of its extent, so adding a node or turning a way round leaves it in
 * place and only a change of its shape moves it.
 */
function representative(geometry: PaddleGeometry): [number, number] {
  const points = paddleGeometryPoints(geometry);
  if (geometry.type === 'Point' || points.length === 0) return points[0] ?? [0, 0];
  const [[south, west], [north, east]] = boundsOf(points);
  return [(south + north) / 2, (west + east) / 2];
}

function mean(points: ReadonlyArray<readonly [number, number]>): [number, number] {
  if (points.length === 0) return [0, 0];
  const sum = points.reduce((acc, [lat, lng]) => [acc[0] + lat, acc[1] + lng], [0, 0]);
  return [sum[0] / points.length, sum[1] / points.length];
}

function boundsOf(points: ReadonlyArray<readonly [number, number]>): [[number, number], [number, number]] {
  let south = 90;
  let west = 180;
  let north = -90;
  let east = -180;
  for (const [lat, lng] of points) {
    south = Math.min(south, lat);
    north = Math.max(north, lat);
    west = Math.min(west, lng);
    east = Math.max(east, lng);
  }
  return [
    [south, west],
    [north, east],
  ];
}

/** The strictest paddling rule among an obstacle's members: a ban, private water, a condition, then any value. */
function strictestAccess(members: readonly PaddleFeature[]): PaddleAccess {
  const rules = members.map((member) => paddleAccessOf(member.tags));
  const rank = (access: PaddleAccess) =>
    access.forbidden ? 4 : access.private ? 3 : access.condition !== null ? 2 : access.value !== null ? 1 : 0;
  return rules.reduce<PaddleAccess>(
    (best, access) => (rank(access) > rank(best) ? access : best),
    rules[0] ?? paddleAccessOf({}),
  );
}

const LOCAL_CHECK_DATE = /^\d{4}-\d{2}(-\d{2})?$/;

/** The latest check on site the members record, as written; null when they record none. */
function localCheckOf(members: readonly PaddleFeature[]): string | null {
  const dates = members.flatMap((member) =>
    Object.entries(member.tags)
      .filter(
        ([key, value]) =>
          (key === 'check_date' || key === 'survey:date' || key.startsWith('check_date:')) &&
          LOCAL_CHECK_DATE.test(value),
      )
      .map(([, value]) => value),
  );
  const sorted = dates.sort(compareCodeUnits);
  return sorted[sorted.length - 1] ?? null;
}

/** Metres along the line of the passages of one member, measured on the line's own (haversine) metres. */
function passagesAlong(line: PaddleCheckLine, member: PaddleFeature, reachM: number) {
  return routePassages(line.points, member.geometry, reachM).map((passage) => {
    const start = line.alongM[passage.segment] ?? 0;
    const end = line.alongM[passage.segment + 1] ?? start;
    return { atM: start + passage.t * (end - start), distanceM: passage.distanceM };
  });
}

/** The passages of a whole obstacle: merged within PASSAGE_GAP_M, the closest MAX_PASSAGES kept, in route order. */
function mergedPassages(found: ReadonlyArray<{ atM: number; distanceM: number }>): number[] {
  const merged: Array<{ atM: number; distanceM: number }> = [];
  for (const passage of [...found].sort((a, b) => a.atM - b.atM)) {
    const last = merged[merged.length - 1];
    if (last && passage.atM - last.atM < PASSAGE_GAP_M) {
      if (passage.distanceM < last.distanceM) Object.assign(last, passage);
    } else merged.push({ ...passage });
  }
  return merged
    .sort((a, b) => a.distanceM - b.distanceM || a.atM - b.atM)
    .slice(0, MAX_PASSAGES)
    .map((passage) => passage.atM)
    .sort((a, b) => a - b);
}

/**
 * The obstacles of the data a paddle tour has to decide about, in route
 * order, each with the basis a decision about it would be bound to. The parts
 * of one lock are one entry; an entry is on the route when any part is, near
 * it otherwise, and keeps every passage of the route by it.
 */
export function obstacleCandidatesOf(input: {
  line: PaddleCheckLine;
  features: readonly PaddleFeature[];
  regions: readonly PaddleCoverageRegion[];
  boat: PaddleBoatType | null;
  hash: (text: string) => string;
}): ObstacleCandidate[] {
  const { line } = input;
  const relevant = input.features.filter(isChecklistRelevant);
  const related = relateObstaclesToRoute(line.points, relevant);
  const groups = new Map<string, typeof related>();
  for (const entry of related) {
    const key = paddleObstacleKeyOf(entry.feature);
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }
  const candidates: ObstacleCandidate[] = [];
  for (const [key, hits] of groups) {
    const members = relevant.filter((feature) => paddleObstacleKeyOf(feature) === key);
    const anchor = [...hits].sort((a, b) => a.distanceM - b.distanceM || a.alongM - b.alongM)[0];
    if (!anchor) continue;
    const relation = hits.some((hit) => hit.relation === 'on_route') ? 'on_route' : 'near';
    const reach = relation === 'on_route' ? ON_ROUTE_M : NEAR_M;
    let passageM = mergedPassages(hits.flatMap((hit) => passagesAlong(line, hit.feature, reach)));
    // Related means within reach, so a passage is there; should rounding lose it, the closest point stands in.
    if (passageM.length === 0) passageM = [Math.min(line.totalM, anchor.alongM)];
    const kind = members.some((member) => member.kind === 'lock') ? 'lock' : anchor.feature.kind;
    const carried = passageM.filter((m) => isCarriedAt(line, m, PORTAGE_PROOF_SLACK_M)).length;
    const portage = carried === passageM.length ? 'planned' : carried > 0 ? 'partial' : 'none';
    const at = pointAlong(line, passageM[0] ?? 0);
    const position = mean(members.map((member) => representative(member.geometry)));
    candidates.push({
      key,
      // The part nearest the route first, the map selects it; a huge group names its first parts only.
      refs: [
        anchor.feature.ref,
        ...members
          .map((member) => member.ref)
          .filter((ref) => ref !== anchor.feature.ref)
          .sort(compareCodeUnits),
      ].slice(0, OBSTACLE_REFS_MAX),
      kind,
      name: anchor.feature.name ?? members.find((member) => member.name)?.name ?? null,
      at,
      bounds: boundsOf(members.flatMap((member) => paddleGeometryPoints(member.geometry))),
      relation,
      along_m: Math.round(passageM[0] ?? 0),
      distance_m: Math.round(Math.min(...hits.map((hit) => hit.distanceM))),
      passages: passageM.length,
      access: strictestAccess(members),
      advice:
        input.boat === 'sup' && (kind === 'lock' || kind === 'lock_gate') && portage !== 'planned'
          ? 'sup_lock_portage'
          : null,
      portage,
      local_check: localCheckOf(members),
      data_as_of: input.regions.find((region) => region.id === anchor.feature.region_id)?.source_timestamp ?? null,
      route: routeTokenOf(line, passageM, relation),
      source: sourceTokenOf(input.hash(materialOf(members)).slice(0, 16), position),
      region_id: anchor.feature.region_id,
      passage_m: passageM,
    });
  }
  return candidates.sort((a, b) => (a.along_m ?? 0) - (b.along_m ?? 0));
}

/** The part of the line between two distances, its ends interpolated. */
function subLine(line: PaddleCheckLine, fromM: number, toM: number): Array<[number, number]> {
  const inner = line.points.filter((_, i) => {
    const m = line.alongM[i] ?? 0;
    return m > fromM && m < toM;
  });
  return [pointAlong(line, fromM), ...inner, pointAlong(line, toM)];
}

/**
 * The paddler's own portages and locks as entries of the checklist, their
 * own plan beside the data: which obstacles a portage carries round, whether
 * the data records its carrying way as forbidden or private, and the SUP
 * advice at a lock the plan passes through.
 */
export function ownEntriesOf(input: {
  line: PaddleCheckLine;
  candidates: readonly ObstacleCandidate[];
  features: readonly PaddleFeature[];
  boat: PaddleBoatType | null;
}): TourOwnEntry[] {
  const { line } = input;
  const carryingWays = input.features.filter(
    (feature) => feature.kind === 'portage' && portageWayRestriction(feature.tags) !== null,
  );
  const portages = line.portages.map((portage): TourOwnEntry => {
    const path = subLine(line, portage.fromM, portage.toM);
    const restrictions = relateObstaclesToRoute(path, carryingWays)
      .filter((entry) => entry.relation === 'on_route')
      .map((entry) => portageWayRestriction(entry.feature.tags));
    return {
      kind: 'portage',
      index: portage.index,
      from_m: Math.round(portage.fromM),
      to_m: Math.round(portage.toM),
      at: pointAlong(line, (portage.fromM + portage.toM) / 2),
      bounds: boundsOf(path),
      covers: input.candidates
        .filter((candidate) =>
          candidate.passage_m.some(
            (m) => m >= portage.fromM - PORTAGE_PROOF_SLACK_M && m <= portage.toM + PORTAGE_PROOF_SLACK_M,
          ),
        )
        .map((candidate) => candidate.key)
        .slice(0, OBSTACLE_REFS_MAX),
      bypassed: false,
      advice: null,
      conflict: restrictions.includes('forbidden') ? 'forbidden' : restrictions.includes('private') ? 'private' : null,
    };
  });
  const locks = line.locks.map((lock): TourOwnEntry => {
    const at = pointAlong(line, lock.atM);
    return {
      kind: 'lock',
      index: lock.index,
      from_m: Math.round(lock.atM),
      to_m: Math.round(lock.atM),
      at,
      bounds: [at, at],
      covers: [],
      bypassed: lock.bypassed,
      advice: input.boat === 'sup' && !lock.bypassed ? 'sup_lock_portage' : null,
      conflict: null,
    };
  });
  return [...portages, ...locks].sort((a, b) => a.from_m - b.from_m);
}

/**
 * How an entry stands with the decision stored for it. A changed source
 * always asks for a new look; so does a changed route, except for a portage
 * decision, which planning the carry changes the route for on purpose: it
 * holds while the paddler's own portage carries round every passage. A
 * reroute stays to do while the route still passes.
 */
export function obstacleStatusOf(input: {
  current: { route: string; source: string; portage: 'planned' | 'partial' | 'none' };
  review: { decision: ObstacleDecision; route: string; source: string } | null;
}): { status: 'open' | 'decided' | 'todo' | 'review'; changed: Array<'route' | 'source'> } {
  const { current, review } = input;
  if (!review) return { status: 'open', changed: [] };
  const changed: Array<'route' | 'source'> = [];
  if (!sameSourceToken(review.source, current.source)) changed.push('source');
  if (review.decision !== 'portage' && !sameRouteToken(review.route, current.route)) changed.push('route');
  if (changed.length > 0) return { status: 'review', changed };
  if (review.decision === 'portage') return { status: current.portage === 'planned' ? 'decided' : 'todo', changed };
  if (review.decision === 'reroute') return { status: 'todo', changed };
  return { status: 'decided', changed };
}

/** What a decision keeps of its obstacle. */
export function obstacleSnapshotOf(candidate: ObstacleCandidate): ObstacleSnapshot {
  return {
    v: 1,
    kind: candidate.kind,
    name: candidate.name,
    refs: candidate.refs,
    at: candidate.at,
    bounds: candidate.bounds,
    relation: candidate.relation ?? 'near',
    along_m: candidate.along_m ?? 0,
    region_id: candidate.region_id,
    data_as_of: candidate.data_as_of,
  };
}

const NO_ACCESS: PaddleAccess = { value: null, source: null, condition: null, forbidden: false, private: false };

function decisionRecordOf(review: StoredObstacleReview) {
  return {
    decision: review.decision,
    note: review.note,
    decided_at: review.decided_at,
    decided_by: review.decided_by,
  };
}

/**
 * Whether the route still comes within NEAR_M of where an obstacle was, by
 * its whole extent rather than the point of the passage, since an object
 * near the route lies up to that far from it.
 */
function reachesRoute(line: PaddleCheckLine, bounds: ObstacleSnapshot['bounds']): boolean {
  // Read as numbers: a consumer compiled without strict checks types the tuples loosely.
  const [south, west] = [Number(bounds[0][0]), Number(bounds[0][1])];
  const [north, east] = [Number(bounds[1][0]), Number(bounds[1][1])];
  if (south === north && west === east) return distanceToRouteM(line.points, [south, west]) <= NEAR_M;
  const extent: PaddleGeometry = {
    type: 'Polygon',
    coordinates: [
      [
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south],
      ],
    ],
  };
  return routePassages(line.points, extent, NEAR_M).length > 0;
}

/**
 * The checklist: the current candidates in route order with their status,
 * then the earlier decisions no candidate carries any more, newest first.
 * Such a decision is about an object still in the data the route no longer
 * meets (off_route), or one the complete data no longer holds (gone, or kept
 * when the paddler kept the decision), or one TREK cannot tell (unknown, when
 * the data is incomplete). None of them is deleted or applied silently.
 */
export function obstacleEntriesOf(input: {
  candidates: readonly ObstacleCandidate[];
  reviews: readonly StoredObstacleReview[];
  dataKeys: ReadonlySet<string>;
  complete: boolean;
  line: PaddleCheckLine;
}): TourObstacleEntry[] {
  const byKey = new Map(input.reviews.map((review) => [review.obstacle_key, review]));
  const current = input.candidates.map((candidate): TourObstacleEntry => {
    const review = byKey.get(candidate.key) ?? null;
    const { status, changed } = obstacleStatusOf({
      current: candidate,
      review: review
        ? { decision: review.decision, route: review.route_fingerprint, source: review.source_fingerprint }
        : null,
    });
    const { route, source, region_id: _region, passage_m: _passages, ...entry } = candidate;
    return { ...entry, status, changed, basis: { route, source }, decision: review ? decisionRecordOf(review) : null };
  });
  const listed = new Set(input.candidates.map((candidate) => candidate.key));
  const earlier = input.reviews
    .filter((review) => !listed.has(review.obstacle_key))
    .sort((a, b) => b.decided_at.localeCompare(a.decided_at))
    .map((review): TourObstacleEntry => {
      const { snapshot } = review;
      let status: ObstacleEntryStatus;
      if (input.dataKeys.has(review.obstacle_key)) status = 'off_route';
      else if (!reachesRoute(input.line, snapshot.bounds)) status = 'off_route';
      else if (input.complete) status = review.source_fingerprint === 'gone' ? 'kept' : 'gone';
      else status = 'unknown';
      return {
        key: review.obstacle_key,
        refs: snapshot.refs,
        kind: snapshot.kind,
        name: snapshot.name,
        at: snapshot.at,
        bounds: snapshot.bounds,
        relation: null,
        along_m: null,
        distance_m: null,
        passages: 0,
        access: NO_ACCESS,
        advice: null,
        portage: 'none',
        local_check: null,
        data_as_of: snapshot.data_as_of,
        status,
        changed: [],
        basis: null,
        decision: decisionRecordOf(review),
      };
    });
  return [...current, ...earlier];
}

/**
 * PAD-09's check bench out of the checklist: how many entries are open (a
 * choice whose plan is missing included), to check again (a vanished object
 * included), decided, and how many bans or private stretches the route meets
 * whatever was decided. Earlier decisions off the route are not counted.
 */
export function paddleCheckSummaryOf(
  entries: readonly TourObstacleEntry[],
  own: readonly TourOwnEntry[],
  data: Pick<PaddleCheck, 'data' | 'data_as_of' | 'read_at'>,
): Omit<PaddleCheck, 'revision'> {
  const count = (statuses: readonly ObstacleEntryStatus[]) =>
    entries.filter((entry) => statuses.includes(entry.status)).length;
  return {
    ...data,
    entries: entries.filter((entry) => entry.relation !== null).length,
    open: count(['open', 'todo']),
    review: count(['review', 'gone']),
    decided: count(['decided']),
    bans:
      entries.filter((entry) => entry.relation === 'on_route' && (entry.access.forbidden || entry.access.private))
        .length + own.filter((entry) => entry.conflict !== null).length,
    own: own.length,
  };
}
