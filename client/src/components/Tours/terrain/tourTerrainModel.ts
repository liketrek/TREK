import type { DistanceIndexedProfileSample } from '../../../utils/routeGeometry';

/**
 * The 3D tour view's numbers, derived from the distance-indexed profile the tour
 * dialog already builds. Pure and React-free, so the view only draws.
 */

/**
 * Grade bands in percent, the way hiking maps colour a route. `paint` is map paint on
 * the terrain, not an app surface: fixed hex like the day colours, since a token that
 * follows the user's accent would turn a steep stretch the colour of a flat one.
 */
export const GRADE_BANDS = [
  { max: 5, paint: '#22c55e', key: 'flat' },
  { max: 10, paint: '#a3e635', key: 'gentle' },
  { max: 18, paint: '#facc15', key: 'moderate' },
  { max: 27, paint: '#f97316', key: 'steep' },
  { max: Infinity, paint: '#dc2626', key: 'verySteep' },
] as const;

export type GradeBandKey = (typeof GRADE_BANDS)[number]['key'];

interface GradeSegment {
  from: [number, number];
  to: [number, number];
  /** Absolute grade in percent over the smoothing window. */
  grade: number;
  /** Signed grade: positive uphill in the walking direction. */
  signedGrade: number;
}

interface SummitPoint {
  lat: number;
  lng: number;
  elevationMeters: number;
  distanceMeters: number;
}

interface SteepestStretch {
  startMeters: number;
  endMeters: number;
  grade: number;
}

export interface TerrainStats {
  summit: SummitPoint | null;
  lowest: SummitPoint | null;
  steepest: SteepestStretch | null;
  /** Metres walked in each grade band. */
  bandMeters: Record<GradeBandKey, number>;
  totalMeters: number;
}

type LocatedSample = DistanceIndexedProfileSample & { lat: number; lng: number };

function located(samples: readonly DistanceIndexedProfileSample[]): LocatedSample[] {
  return samples.filter((s): s is LocatedSample => Number.isFinite(s.lat) && Number.isFinite(s.lng));
}

export function gradeBand(grade: number): (typeof GRADE_BANDS)[number] {
  return GRADE_BANDS.find((band) => Math.abs(grade) < band.max) ?? GRADE_BANDS[GRADE_BANDS.length - 1];
}

/**
 * The grade at each sample over a window of about `windowMeters`, so GPS jitter on a
 * few metres does not paint a flat path red.
 */
function smoothedGrades(samples: readonly LocatedSample[], windowMeters: number): number[] {
  const grades: number[] = [];
  let back = 0;
  let ahead = 0;
  for (let i = 0; i < samples.length; i++) {
    const here = samples[i].distanceMeters;
    while (back < i && here - samples[back].distanceMeters > windowMeters / 2) back++;
    if (ahead < i) ahead = i;
    while (ahead < samples.length - 1 && samples[ahead].distanceMeters - here < windowMeters / 2) ahead++;
    const run = samples[ahead].distanceMeters - samples[back].distanceMeters;
    const rise = samples[ahead].elevationMeters - samples[back].elevationMeters;
    grades.push(run > 0 ? (rise / run) * 100 : 0);
  }
  return grades;
}

/** One coloured piece per pair of samples, ready for a GeoJSON line layer. */
export function gradeSegments(samples: readonly DistanceIndexedProfileSample[], windowMeters = 200): GradeSegment[] {
  const points = located(samples);
  if (points.length < 2) return [];
  const grades = smoothedGrades(points, windowMeters);
  const segments: GradeSegment[] = [];
  for (let i = 1; i < points.length; i++) {
    const signedGrade = (grades[i - 1] + grades[i]) / 2;
    segments.push({
      from: [points[i - 1].lng, points[i - 1].lat],
      to: [points[i].lng, points[i].lat],
      grade: Math.abs(signedGrade),
      signedGrade,
    });
  }
  return segments;
}

function emptyBands(): Record<GradeBandKey, number> {
  return { flat: 0, gentle: 0, moderate: 0, steep: 0, verySteep: 0 };
}

function extreme(points: readonly LocatedSample[], pick: (a: number, b: number) => boolean): SummitPoint | null {
  let best: LocatedSample | null = null;
  for (const point of points) if (!best || pick(point.elevationMeters, best.elevationMeters)) best = point;
  return (
    best && { lat: best.lat, lng: best.lng, elevationMeters: best.elevationMeters, distanceMeters: best.distanceMeters }
  );
}

/** The steepest stretch of at least `minMeters`, uphill or down. */
function steepestStretch(points: readonly LocatedSample[], minMeters: number): SteepestStretch | null {
  let best: SteepestStretch | null = null;
  let start = 0;
  for (let end = 1; end < points.length; end++) {
    while (start < end - 1 && points[end].distanceMeters - points[start + 1].distanceMeters >= minMeters) start++;
    const run = points[end].distanceMeters - points[start].distanceMeters;
    if (run < minMeters) continue;
    const grade = (Math.abs(points[end].elevationMeters - points[start].elevationMeters) / run) * 100;
    if (!best || grade > best.grade)
      best = { startMeters: points[start].distanceMeters, endMeters: points[end].distanceMeters, grade };
  }
  return best;
}

export function terrainStats(samples: readonly DistanceIndexedProfileSample[]): TerrainStats {
  const points = located(samples);
  const bandMeters = emptyBands();
  const segments = gradeSegments(samples);
  for (let i = 0; i < segments.length; i++) {
    bandMeters[gradeBand(segments[i].grade).key] += points[i + 1].distanceMeters - points[i].distanceMeters;
  }
  return {
    summit: extreme(points, (a, b) => a > b),
    lowest: extreme(points, (a, b) => a < b),
    steepest: steepestStretch(points, 200),
    bandMeters,
    totalMeters: points.length ? points[points.length - 1].distanceMeters - points[0].distanceMeters : 0,
  };
}

/** Compass bearing in degrees from one point to another. */
export function bearingDegrees(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(to.lat));
  const x =
    Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) -
    Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Eases a camera heading towards a target without spinning the long way round. */
export function easeBearing(current: number, target: number, factor: number): number {
  const delta = ((target - current + 540) % 360) - 180;
  return (current + delta * factor + 360) % 360;
}

/** Replay speed: how many route metres pass per second of playback. */
export function replayMetresPerSecond(totalMeters: number, targetSeconds = 45): number {
  return Math.max(20, totalMeters / targetSeconds);
}
