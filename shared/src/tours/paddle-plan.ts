import { haversineMetres } from '../geo/haversine';
import {
  DEFAULT_PORTAGE_EXTRA_MINUTES,
  DEFAULT_PORTAGE_SPEED_KMH,
  type PaddleLock,
  type TrackMarks,
} from './paddle-plan.schema';

/**
 * PAD-03 and PAD-07 as plain arithmetic, so the planner, the detail view and
 * the server read one answer: which stretches of a paddle tour are on water
 * and which are carried, where its locks are, what each part takes and what
 * of the estimate is still missing.
 */

/** What a point of a paddle tour is to the paddler, read from the legs on either side of it. */
export type PaddleRole = 'put_in' | 'take_out' | 're_entry' | 'final_take_out';

interface PlanLeg {
  kind: string;
  /** Read as plain values: a workspace compiled without strict mode sees the schema's tuples as "maybe two". */
  geometry: ReadonlyArray<ReadonlyArray<unknown>>;
  extra_minutes?: number | null;
}

/** A control point as far as the paddle plan reads it. */
export interface PaddlePlanPoint {
  lat: number;
  lng: number;
  fixed_leg?: PlanLeg | null;
  lock?: PaddleLock | null;
}

export interface PaddleStretch {
  kind: 'water' | 'portage';
  fromM: number;
  toM: number;
  /** A portage's time for getting out, unloading and back in; null means the starting value. */
  extraMinutes: number | null;
  /** The control point the stretch starts at, for a planned tour. */
  startIndex: number | null;
}

export interface PaddleLockStop extends PaddleLock {
  atM: number;
  /** A planned portage carries round it: its times count instead of the lock's. */
  bypassed: boolean;
  /** The control point it sits at, for a planned tour. */
  index: number | null;
}

export interface PaddleLayout {
  totalM: number;
  stretches: PaddleStretch[];
  locks: PaddleLockStop[];
}

function isPortage(leg: PlanLeg | null | undefined): boolean {
  return leg?.kind === 'portage';
}

function lineLengthM(line: PlanLeg['geometry']): number {
  let total = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    if (a && b) total += haversineMetres(Number(a[0]), Number(a[1]), Number(b[0]), Number(b[1]));
  }
  return total;
}

/**
 * The role of every control point: the first puts in, the last takes out for
 * good, a point where water gives way to a portage is a take-out and where a
 * portage meets water again a re-entry. Points within a stretch have none.
 */
export function paddleRolesOf(points: readonly PaddlePlanPoint[]): Array<PaddleRole | null> {
  return points.map((point, index) => {
    if (index === 0) return 'put_in';
    if (index === points.length - 1) return 'final_take_out';
    const carriedIn = isPortage(points[index - 1]?.fixed_leg);
    const carriedOut = isPortage(point.fixed_leg);
    if (!carriedIn && carriedOut) return 'take_out';
    if (carriedIn && !carriedOut) return 're_entry';
    return null;
  });
}

function bypassedBy(stretches: readonly PaddleStretch[], atM: number): boolean {
  return stretches.some((s) => s.kind === 'portage' && atM >= s.fromM - 0.5 && atM <= s.toM + 0.5);
}

/** The stretches and locks of a planned tour, measured along the legs between its control points. */
export function paddleLayoutOfPoints(points: readonly PaddlePlanPoint[]): PaddleLayout {
  const stretches: PaddleStretch[] = [];
  const at: number[] = [];
  let distance = 0;
  points.forEach((point, index) => {
    at.push(distance);
    const next = points[index + 1];
    if (!next) return;
    const leg = point.fixed_leg;
    const length = leg ? lineLengthM(leg.geometry) : haversineMetres(point.lat, point.lng, next.lat, next.lng);
    const kind = isPortage(leg) ? 'portage' : 'water';
    const last = stretches[stretches.length - 1];
    if (last && last.kind === kind) last.toM = distance + length;
    else
      stretches.push({
        kind,
        fromM: distance,
        toM: distance + length,
        extraMinutes: kind === 'portage' ? (leg?.extra_minutes ?? null) : null,
        startIndex: index,
      });
    distance += length;
  });
  const locks = points.flatMap((point, index): PaddleLockStop[] => {
    if (!point.lock) return [];
    const atM = at[index] ?? 0;
    return [{ ...point.lock, atM, bypassed: bypassedBy(stretches, atM), index }];
  });
  return { totalM: distance, stretches, locks };
}

/** The stretches and locks of a recorded track, from the marks laid onto it. */
export function paddleLayoutOfTrack(totalM: number, marks: TrackMarks | null | undefined): PaddleLayout {
  const portages = [...(marks?.portages ?? [])]
    .map((mark) => ({ ...mark, from_m: Math.min(mark.from_m, totalM), to_m: Math.min(mark.to_m, totalM) }))
    .filter((mark) => mark.to_m > mark.from_m)
    .sort((a, b) => a.from_m - b.from_m);
  const stretches: PaddleStretch[] = [];
  let cursor = 0;
  for (const mark of portages) {
    if (mark.from_m > cursor)
      stretches.push({ kind: 'water', fromM: cursor, toM: mark.from_m, extraMinutes: null, startIndex: null });
    stretches.push({
      kind: 'portage',
      fromM: mark.from_m,
      toM: mark.to_m,
      extraMinutes: mark.extra_minutes,
      startIndex: null,
    });
    cursor = mark.to_m;
  }
  if (totalM > cursor)
    stretches.push({ kind: 'water', fromM: cursor, toM: totalM, extraMinutes: null, startIndex: null });
  const locks = (marks?.locks ?? [])
    .filter((lock) => lock.at_m <= totalM)
    .map((lock) => ({
      wait_minutes: lock.wait_minutes,
      transit_minutes: lock.transit_minutes,
      atM: lock.at_m,
      bypassed: bypassedBy(stretches, lock.at_m),
      index: null,
    }))
    .sort((a, b) => a.atM - b.atM);
  return { totalM, stretches, locks };
}

export interface PaddleTimeEstimate {
  waterM: number;
  landM: number;
  portageCount: number;
  /** The speeds the estimate used; the paddling one is null while the paddler has entered none. */
  paddleSpeedKmh: number | null;
  portageSpeedKmh: number;
  /** Null while there is no paddling speed: unknown, never zero. */
  waterMinutes: number | null;
  carryMinutes: number;
  portageExtraMinutes: number;
  /** The known lock times of the locks the boat goes through. */
  lockMinutes: number;
  locksCounted: number;
  /** Locks gone through whose wait or transit time is not entered. */
  locksMissingTime: number;
  breakMinutes: number;
  /** Every known part added up; with `complete` false it leaves something out. */
  estimateMinutes: number;
  complete: boolean;
}

/**
 * The estimate of PAD-07: water at the paddling speed, each portage carried at
 * the carrying speed plus its time for getting out and back in, each lock gone
 * through at the times entered for it, and the breaks. A lock a portage carries
 * round counts with the portage, not again. What is not known is left out and
 * named, so the sum is never passed off as complete.
 */
export function estimatePaddleTime(
  layout: PaddleLayout,
  speeds: { paddleSpeedKmh: number | null; portageSpeedKmh: number | null; breakMinutes: number | null },
): PaddleTimeEstimate {
  const portageSpeedKmh = speeds.portageSpeedKmh ?? DEFAULT_PORTAGE_SPEED_KMH;
  let waterM = 0;
  let landM = 0;
  let portageExtraMinutes = 0;
  let portageCount = 0;
  for (const stretch of layout.stretches) {
    const length = stretch.toM - stretch.fromM;
    if (stretch.kind === 'water') {
      waterM += length;
      continue;
    }
    landM += length;
    portageCount += 1;
    portageExtraMinutes += stretch.extraMinutes ?? DEFAULT_PORTAGE_EXTRA_MINUTES;
  }
  const waterMinutes = speeds.paddleSpeedKmh ? (waterM / 1000 / speeds.paddleSpeedKmh) * 60 : null;
  const carryMinutes = (landM / 1000 / portageSpeedKmh) * 60;
  let lockMinutes = 0;
  let locksCounted = 0;
  let locksMissingTime = 0;
  for (const lock of layout.locks) {
    if (lock.bypassed) continue;
    locksCounted += 1;
    lockMinutes += (lock.wait_minutes ?? 0) + (lock.transit_minutes ?? 0);
    if (lock.wait_minutes === null || lock.transit_minutes === null) locksMissingTime += 1;
  }
  const breakMinutes = speeds.breakMinutes ?? 0;
  const estimateMinutes = Math.round(
    (waterMinutes ?? 0) + carryMinutes + portageExtraMinutes + lockMinutes + breakMinutes,
  );
  return {
    waterM,
    landM,
    portageCount,
    paddleSpeedKmh: speeds.paddleSpeedKmh,
    portageSpeedKmh,
    waterMinutes: waterMinutes === null ? null : Math.round(waterMinutes),
    carryMinutes: Math.round(carryMinutes),
    portageExtraMinutes,
    lockMinutes,
    locksCounted,
    locksMissingTime,
    breakMinutes,
    estimateMinutes,
    complete: waterMinutes !== null && locksMissingTime === 0,
  };
}

/** The moving part of the estimate (no breaks), in seconds, as a tour's duration is stored. */
export function paddleMovingSeconds(estimate: PaddleTimeEstimate): number | null {
  if (estimate.waterMinutes === null) return null;
  return Math.round((estimate.estimateMinutes - estimate.breakMinutes) * 60);
}
