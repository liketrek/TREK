import { compareCodeUnits } from '../common/compare';
import { haversineMetres } from '../geo/haversine';
import type { PaddleFeature } from '../paddle/paddle-obstacles.schema';
import { paddleLayoutOfPoints, paddleLayoutOfTrack, type PaddlePlanPoint } from './paddle-plan';
import type { TrackMarks } from './paddle-plan.schema';

/**
 * PAD-06: what a decision about an obstacle is bound to, as plain values
 * both sides can compute. A decision holds while the route near the obstacle
 * and the obstacle's material data stay as they were; a change far away, a
 * new name or a monthly nudge of a few metres leaves it standing, a moved
 * line near the weir, a water stretch turned into a carry, or a new paddling
 * rule makes it one to check again.
 */

/** Raised when the way a basis is built changes, so stored ones read as different. */
export const PADDLE_CHECK_VERSION = 1;
/** The route is sampled every SAMPLE_STEP_M on either side of a passage, SAMPLE_STEPS times. */
export const SAMPLE_STEP_M = 25;
export const SAMPLE_STEPS = 4;
/** Two samples or two positions this close count as the same place. */
export const BASIS_TOLERANCE_M = 15;
/** A portage proves a passage this far past its ends, for rounding along the line. */
export const PORTAGE_PROOF_SLACK_M = 5;

/** A paddle tour's line as the checklist reads it: its points, the metres along it, and its own portages and locks. */
export interface PaddleCheckLine {
  /** [lat, lng] pairs. */
  points: Array<[number, number]>;
  /** Metres from the start at each point, by haversine, so they agree with the time estimate's layout. */
  alongM: number[];
  totalM: number;
  portages: Array<{ fromM: number; toM: number; index: number | null }>;
  locks: Array<{ atM: number; index: number | null; bypassed: boolean }>;
}

function cumulative(points: ReadonlyArray<readonly [number, number]>, start = 0): number[] {
  const along: number[] = [];
  let total = start;
  points.forEach((point, i) => {
    const prev = points[i - 1];
    if (prev) total += haversineMetres(prev[0], prev[1], point[0], point[1]);
    along.push(total);
  });
  return along;
}

/**
 * The line of a planned tour: each leg its own drawn geometry or the straight
 * line to the next point, measured leg by leg as the layout measures them, so
 * a portage's metres here are the time card's metres.
 */
export function paddleCheckLineOfPoints(points: readonly PaddlePlanPoint[]): PaddleCheckLine | null {
  if (points.length < 2) return null;
  const line: Array<[number, number]> = [];
  const alongM: number[] = [];
  let distance = 0;
  points.forEach((point, index) => {
    const next = points[index + 1];
    if (!next) return;
    const leg: Array<[number, number]> = point.fixed_leg
      ? point.fixed_leg.geometry.map((p) => [Number(p[0]), Number(p[1])] as [number, number])
      : [
          [point.lat, point.lng],
          [next.lat, next.lng],
        ];
    const legAlong = cumulative(leg, distance);
    leg.forEach((p, i) => {
      const last = line[line.length - 1];
      // A leg starts where the last one ended; the joint is kept once.
      if (last && last[0] === p[0] && last[1] === p[1]) return;
      line.push(p);
      alongM.push(legAlong[i] ?? distance);
    });
    distance = legAlong[legAlong.length - 1] ?? distance;
  });
  if (line.length < 2) return null;
  const layout = paddleLayoutOfPoints(points);
  return {
    points: line,
    alongM,
    totalM: distance,
    portages: layout.stretches
      .filter((stretch) => stretch.kind === 'portage')
      .map((stretch) => ({ fromM: stretch.fromM, toM: stretch.toM, index: stretch.startIndex })),
    locks: layout.locks.map((lock) => ({ atM: lock.atM, index: lock.index, bypassed: lock.bypassed })),
  };
}

/** The line of a recorded track with the marks laid onto it; points that are not numbers are left out. */
export function paddleCheckLineOfTrack(
  route: ReadonlyArray<ReadonlyArray<unknown>>,
  marks: TrackMarks | null | undefined,
): PaddleCheckLine | null {
  const points = route
    .map((p) => [Number(p[0]), Number(p[1])] as [number, number])
    .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
  if (points.length < 2) return null;
  const alongM = cumulative(points);
  const totalM = alongM[alongM.length - 1] ?? 0;
  const layout = paddleLayoutOfTrack(totalM, marks);
  return {
    points,
    alongM,
    totalM,
    portages: layout.stretches
      .filter((stretch) => stretch.kind === 'portage')
      .map((stretch) => ({ fromM: stretch.fromM, toM: stretch.toM, index: null })),
    locks: layout.locks.map((lock) => ({ atM: lock.atM, index: null, bypassed: lock.bypassed })),
  };
}

/** The point `atM` metres along the line, clamped to its ends. */
export function pointAlong(line: PaddleCheckLine, atM: number): [number, number] {
  const { points, alongM } = line;
  const first = points[0] ?? [0, 0];
  if (atM <= (alongM[0] ?? 0)) return [first[0], first[1]];
  for (let i = 1; i < points.length; i++) {
    const end = alongM[i] ?? 0;
    if (atM > end) continue;
    const start = alongM[i - 1] ?? 0;
    const a = points[i - 1] ?? first;
    const b = points[i] ?? first;
    const t = end > start ? (atM - start) / (end - start) : 0;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }
  const last = points[points.length - 1] ?? first;
  return [last[0], last[1]];
}

/** Whether the paddler's own plan carries the boat at `atM`. */
export function isCarriedAt(line: PaddleCheckLine, atM: number, slackM = 0): boolean {
  return line.portages.some((portage) => atM >= portage.fromM - slackM && atM <= portage.toM + slackM);
}

const e5 = (value: number) => Math.round(value * 1e5);

/**
 * The route near an obstacle as a token: its relation, then for each passage
 * nine samples, SAMPLE_STEP_M apart around it, each a rounded position and
 * whether the boat is paddled (`w`) or carried (`p`) there; a sample beyond
 * an end of the line is `_`.
 */
export function routeTokenOf(
  line: PaddleCheckLine,
  passageM: readonly number[],
  relation: 'on_route' | 'near',
): string {
  const visits = passageM.map((m) => {
    const samples: string[] = [];
    for (let k = -SAMPLE_STEPS; k <= SAMPLE_STEPS; k++) {
      const at = m + k * SAMPLE_STEP_M;
      if (at < 0 || at > line.totalM) {
        samples.push('_');
        continue;
      }
      const [lat, lng] = pointAlong(line, at);
      samples.push(`${e5(lat)},${e5(lng)},${isCarriedAt(line, at) ? 'p' : 'w'}`);
    }
    return samples.join('|');
  });
  return `p1:${relation === 'on_route' ? 'o' : 'n'}:${visits.join(';')}`;
}

type Sample = { lat: number; lng: number; kind: string } | null;

function parseRouteToken(token: string): { relation: string; visits: Sample[][] } | null {
  const match = /^p1:([on]):(.+)$/.exec(token);
  if (!match) return null;
  const visits: Sample[][] = [];
  for (const visit of (match[2] ?? '').split(';')) {
    const samples: Sample[] = [];
    for (const sample of visit.split('|')) {
      if (sample === '_') {
        samples.push(null);
        continue;
      }
      const [lat, lng, kind] = sample.split(',');
      const parsed = { lat: Number(lat) / 1e5, lng: Number(lng) / 1e5, kind: kind ?? '' };
      if (!Number.isFinite(parsed.lat) || !Number.isFinite(parsed.lng) || (kind !== 'w' && kind !== 'p')) return null;
      samples.push(parsed);
    }
    visits.push(samples);
  }
  return { relation: match[1] ?? '', visits };
}

/**
 * Whether two route tokens describe the same route near the obstacle: the
 * same relation and number of passages, and every sample within
 * BASIS_TOLERANCE_M of its twin, paddled or carried alike. A token that
 * does not read matches nothing.
 */
export function sameRouteToken(a: string, b: string): boolean {
  const x = parseRouteToken(a);
  const y = parseRouteToken(b);
  if (!x || !y || x.relation !== y.relation || x.visits.length !== y.visits.length) return false;
  return x.visits.every((visit, i) => {
    const twin = y.visits[i] ?? [];
    if (visit.length !== twin.length) return false;
    return visit.every((sample, j) => {
      const other = twin[j] ?? null;
      if (sample === null || other === null) return sample === other;
      return (
        sample.kind === other.kind && haversineMetres(sample.lat, sample.lng, other.lat, other.lng) <= BASIS_TOLERANCE_M
      );
    });
  });
}

/** Tags that say nothing about passing: names, references, who runs it and when someone last looked. */
const COSMETIC = new Set(['name', 'lock_name', 'ref', 'operator', 'website', 'check_date', 'survey:date']);
const isCosmetic = (key: string) => COSMETIC.has(key) || key.startsWith('check_date:');

/** The material data of an obstacle's members, as text to hash: what they are and the tags that bear on passing. */
export function materialOf(members: readonly PaddleFeature[]): string {
  const rows = [...members]
    .sort((a, b) => compareCodeUnits(a.ref, b.ref))
    .map((member) => [
      member.ref,
      member.kind,
      member.geometry.type,
      Object.keys(member.tags)
        .filter((key) => !isCosmetic(key))
        .sort(compareCodeUnits)
        .map((key) => [key, member.tags[key]]),
    ]);
  return JSON.stringify(rows);
}

/** The source basis: the hash of the material data and the obstacle's position, rounded. */
export function sourceTokenOf(hash16: string, at: readonly [number, number]): string {
  return `s1:${hash16}:${e5(at[0])},${e5(at[1])}`;
}

function parseSourceToken(token: string): { hash: string; lat: number; lng: number } | null {
  const match = /^s1:([0-9a-f]{16}):(-?\d+),(-?\d+)$/.exec(token);
  if (!match) return null;
  return { hash: match[1] ?? '', lat: Number(match[2]) / 1e5, lng: Number(match[3]) / 1e5 };
}

/**
 * Whether two source tokens describe the same obstacle data: the same hash,
 * positions within BASIS_TOLERANCE_M. `gone` matches only `gone`.
 */
export function sameSourceToken(a: string, b: string): boolean {
  if (a === 'gone' || b === 'gone') return a === b;
  const x = parseSourceToken(a);
  const y = parseSourceToken(b);
  return !!x && !!y && x.hash === y.hash && haversineMetres(x.lat, x.lng, y.lat, y.lng) <= BASIS_TOLERANCE_M;
}
