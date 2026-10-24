import type { PaddleLock, PaddleRouteFailureCode, PaddleRouteLeg, TourFixedLeg } from '@trek/shared';
import { paddleRouteRepo, type PaddleLegAnswer, type PaddleRouteProfile } from '../../../repo/paddleRouteRepo';
import { haversineKm } from '../../../utils/geo';
import { lineLengthM } from './tourFixedLegs';
import type { TourRoutePart } from './tourRouting';

/**
 * PAD-11: a paddle tour's route in the planner. A leg without a line of its
 * own is planned on the water by the server's router, as a hike's legs are by
 * Valhalla; a leg drawn by hand or carried as a portage keeps its line. Where
 * the router carries round a weir or goes through a lock between two of the
 * paddler's own points, the planner sets points of its own there (`auto`), so
 * the portage and the lock count like any planned by hand: in the time, in the
 * checklist, on the map. They are derived again whenever the points they came
 * from change, and become the paddler's own once touched.
 */

/** Where an automatic point came from: the two points of the paddler's leg it was found on, as they were. */
export interface AutoBase {
  from: { id: string; lat: number; lng: number };
  to: { id: string; lat: number; lng: number };
}

export interface PaddlePoint {
  id: string;
  lat: number;
  lng: number;
  fixedLeg?: TourFixedLeg | null;
  lock?: PaddleLock | null;
  shaping?: boolean;
  stageEnd?: boolean;
  /** Set by the planner where the router found a portage or a lock; gone once the paddler touches the point. */
  auto?: AutoBase;
}

export type PaddleLegFailure = PaddleRouteFailureCode | 'offline';

export interface PaddleTourRoute {
  coordinates: [number, number][];
  parts: TourRoutePart[];
  distanceMeters: number;
  /** Per leg (index of its first point): the router's answer, or null for a leg with a line of its own. */
  legs: Array<PaddleLegAnswer | null>;
  /** The routed length of every leg, metres, for the time estimate. */
  legLengths: number[];
  failures: Array<{ index: number; code: PaddleLegFailure; at: { lat: number; lng: number } | null }>;
}

/** What a leg holds when its answer is somehow missing: unrouted, never silently straight. */
const NOT_ASKED: PaddleLegAnswer = { status: 'failed', code: 'no_water_path', at: null };

/** Two points this close are one spot, in degrees (about ten centimetres). */
const SAME_SPOT = 1e-6;

function samePlace(a: { lat: number; lng: number }, b: { lat: number; lng: number }): boolean {
  return Math.abs(a.lat - b.lat) < SAME_SPOT && Math.abs(a.lng - b.lng) < SAME_SPOT;
}

type PartKind = 'water' | 'rapids' | 'gap' | 'unrouted' | 'land' | 'manual';

function partOf(kind: PartKind, coordinates: [number, number][]): TourRoutePart {
  if (kind === 'land') return { coordinates, free: false, land: true };
  if (kind === 'manual') return { coordinates, free: true };
  return { coordinates, free: false, ...(kind === 'water' ? {} : { mark: kind }) };
}

/** The parts of one routed leg: water as one line, carried and marked stretches as their own. */
function routedParts(leg: Extract<PaddleRouteLeg, { status: 'ok' }>): TourRoutePart[] {
  return leg.segments.map((segment) => {
    const line = leg.geometry.slice(segment.from, segment.to + 1) as [number, number][];
    if (segment.kind === 'portage') return partOf('land', line);
    if (segment.kind === 'rapids' || segment.kind === 'pass') return partOf('rapids', line);
    if (segment.kind === 'gap') return partOf('gap', line);
    return partOf('water', line);
  });
}

/** Neighbouring parts drawn alike as one line, as the hike's route does. */
function mergeParts(parts: TourRoutePart[]): TourRoutePart[] {
  const merged: TourRoutePart[] = [];
  for (const part of parts) {
    const previous = merged[merged.length - 1];
    if (previous && previous.free === part.free && !!previous.land === !!part.land && previous.mark === part.mark) {
      previous.coordinates = [...previous.coordinates, ...part.coordinates.slice(1)];
    } else {
      merged.push({ ...part, coordinates: [...part.coordinates] });
    }
  }
  return merged;
}

/** Plans the legs that need it and puts the whole line together. */
export async function routePaddleTour(
  points: readonly PaddlePoint[],
  tripId: number | string,
  profile: PaddleRouteProfile,
  signal?: AbortSignal
): Promise<PaddleTourRoute> {
  const routed = points.slice(0, -1).flatMap((point, index) => (point.fixedLeg ? [] : [index]));
  const answers = routed.length
    ? await paddleRouteRepo.plan(
        tripId,
        routed.map((index) => ({ from: points[index], to: points[index + 1] })),
        profile,
        signal
      )
    : [];
  const byLeg = new Map(routed.map((index, at) => [index, answers[at]]));
  const parts: TourRoutePart[] = [];
  const legs: PaddleTourRoute['legs'] = [];
  const legLengths: number[] = [];
  const failures: PaddleTourRoute['failures'] = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const point = points[index];
    const next = points[index + 1];
    const leg = point.fixedLeg;
    if (leg) {
      const line = leg.geometry.map(([lat, lng]): [number, number] => [lat, lng]);
      parts.push(partOf(leg.kind === 'portage' ? 'land' : 'manual', line));
      legs.push(null);
      legLengths.push(lineLengthM(line));
      continue;
    }
    const answer = byLeg.get(index) ?? NOT_ASKED;
    legs.push(answer);
    if (answer.status === 'ok') {
      parts.push(...routedParts(answer));
      legLengths.push(answer.distance_m);
      continue;
    }
    // A leg the router could not plan stays visible as what it is: a straight stretch nobody checked.
    failures.push({ index, code: answer.code, at: answer.at });
    parts.push(
      partOf('unrouted', [
        [point.lat, point.lng],
        [next.lat, next.lng],
      ])
    );
    legLengths.push(haversineKm(point, next) * 1000);
  }
  const lines = mergeParts(parts);
  const coordinates = lines.flatMap((part, index) => (index === 0 ? part.coordinates : part.coordinates.slice(1)));
  return {
    coordinates,
    parts: lines,
    distanceMeters: legLengths.reduce((sum, length) => sum + length, 0),
    legs,
    legLengths,
    failures,
  };
}

function baseOf(points: readonly PaddlePoint[], index: number): AutoBase {
  const from = points[index];
  const to = points[index + 1];
  return { from: { id: from.id, lat: from.lat, lng: from.lng }, to: { id: to.id, lat: to.lat, lng: to.lng } };
}

/**
 * The automatic points that no longer stand on the leg they were found on
 * (an end of it moved, or went), dropped; the next plan finds them again
 * where they belong.
 */
export function pruneAutoPoints<T extends PaddlePoint>(points: readonly T[]): T[] {
  const own = points.filter((point) => !point.auto);
  return points.filter((point) => {
    const base = point.auto;
    if (!base) return true;
    const from = own.find((candidate) => candidate.id === base.from.id);
    const to = own.find((candidate) => candidate.id === base.to.id);
    if (!from || !to || !samePlace(from, base.from) || !samePlace(to, base.to)) return false;
    return own.indexOf(to) === own.indexOf(from) + 1;
  });
}

/**
 * Sets the portages and locks the router found on the paddler's own legs as
 * points. An existing automatic point at the same spot keeps its id, so
 * planning the same leg again changes nothing.
 */
export function materializePaddleLegs<T extends PaddlePoint>(
  points: readonly T[],
  route: Pick<PaddleTourRoute, 'legs'>,
  newId: () => string
): T[] {
  const existing = points.filter((point) => point.auto);
  const idAt = (lat: number, lng: number) => existing.find((point) => samePlace(point, { lat, lng }))?.id ?? newId();
  const result: T[] = [];
  points.forEach((point, index) => {
    result.push(point);
    const next = points[index + 1];
    const answer = route.legs[index];
    // Only a leg between two of the paddler's own points: a leg at an automatic point is part of one already set.
    if (!next || point.auto || next.auto || !answer || answer.status !== 'ok') return;
    const base = baseOf(points, index);
    const last = answer.geometry.length - 1;
    for (const segment of answer.segments) {
      if (segment.kind === 'portage' && segment.from > 0 && segment.to < last) {
        const line = answer.geometry.slice(segment.from, segment.to + 1) as [number, number][];
        const [outLat, outLng] = line[0];
        const [inLat, inLng] = line[line.length - 1];
        result.push(
          {
            id: idAt(outLat, outLng),
            lat: outLat,
            lng: outLng,
            auto: base,
            fixedLeg: { kind: 'portage', geometry: line, extra_minutes: null },
          } as unknown as T,
          { id: idAt(inLat, inLng), lat: inLat, lng: inLng, auto: base } as unknown as T
        );
      }
      if (segment.kind === 'lock' && segment.from > 0 && segment.to < last) {
        const [lat, lng] = answer.geometry[Math.round((segment.from + segment.to) / 2)];
        result.push({
          id: idAt(lat, lng),
          lat,
          lng,
          auto: base,
          lock: { wait_minutes: null, transit_minutes: null },
        } as unknown as T);
      }
    }
  });
  return result;
}

/**
 * A point the paddler changed is theirs from then on: it loses its automatic
 * mark. Ending a stage there counts as a change (MDT-01), so the router never
 * drops a stage end with the leg around it.
 */
export function adoptChangedPoints<T extends PaddlePoint>(before: readonly T[], after: readonly T[]): T[] {
  const previous = new Map(before.map((point) => [point.id, point]));
  return after.map((point) => {
    if (!point.auto) return point;
    const was = previous.get(point.id);
    const same =
      !!was &&
      samePlace(was, point) &&
      !!was.stageEnd === !!point.stageEnd &&
      JSON.stringify(was.lock ?? null) === JSON.stringify(point.lock ?? null) &&
      JSON.stringify(was.fixedLeg ?? null) === JSON.stringify(point.fixedLeg ?? null);
    if (same) return point;
    const { auto: _auto, ...own } = point;
    return own as T;
  });
}

/**
 * One run of the paddle router over the points: either points to set first
 * (automatic ones dropped from a leg that changed, or found on a planned
 * leg), after which the planner runs again, or the finished route.
 */
export async function planPaddleStep<T extends PaddlePoint>(
  points: readonly T[],
  tripId: number | string,
  profile: PaddleRouteProfile,
  signal: AbortSignal,
  newId: () => string
): Promise<{ points: T[] } | { route: PaddleTourRoute }> {
  const pruned = pruneAutoPoints(points);
  if (pruned.length !== points.length) return { points: pruned };
  const route = await routePaddleTour(points, tripId, profile, signal);
  // Points are only ever added: the same count means nothing new was found.
  const materialized = materializePaddleLegs(points, route, newId);
  return materialized.length !== points.length ? { points: materialized } : { route };
}
