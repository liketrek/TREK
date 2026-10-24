/**
 * BIK-05, MAP-03 and MAP-04 for a saved tour read over MCP: what
 * OpenStreetMap records for the ways under its line, summed along it. The
 * ways come from the router's description of the saved line and their tags
 * from the trail grades the planner asks for; this half only lays them onto
 * the line. A way without a value is unknown, never easy or paved.
 */
import type { TracedWay } from '../roadtrip/roadtrip-router.service';
import { gradesAlong } from './hike-routing.helpers';
import { sacStepOf, type HikeTrailGrades, type SacStep, type TourTrailGrade } from '@trek/shared';

/** How many metres of the line one written value covers, and its share of the whole line. */
interface ValueShare {
  value: string;
  metres: number;
  share: number;
}

/** Everything the trail details answer, worked out from the ways and their tags. */
export interface TrailDetails {
  length_m: number;
  /** The SAC grades along the line, as a proposed hike carries them. */
  sac: HikeTrailGrades;
  /** The mountain bike scale (mtb:scale), the hardest step found and the metres of each; unknown where untagged. */
  mtb: { highest: string | null; values: ValueShare[] };
  surface: ValueShare[];
  highway: ValueShare[];
  /** The part of the line whose way has none of these tags or could not be asked about, 0 to 1. */
  unknown_share: number;
}

const roundShare = (value: number) => Math.min(1, Math.round(value * 1000) / 1000);

/** The metres each value covers, the most first, scaled onto the saved length like the SAC stretches. */
function sharesOf(
  ways: readonly TracedWay[],
  valueOf: (grade: TourTrailGrade) => string | null,
  grades: ReadonlyMap<number, TourTrailGrade>,
  scale: number,
  total: number,
): ValueShare[] {
  const metres = new Map<string, number>();
  for (const way of ways) {
    const grade = way.wayId === null ? undefined : grades.get(way.wayId);
    const value = grade ? valueOf(grade) : null;
    if (value) metres.set(value, (metres.get(value) ?? 0) + way.metres * scale);
  }
  return [...metres]
    .map(([value, along]) => ({ value, metres: Math.round(along), share: total > 0 ? roundShare(along / total) : 0 }))
    .sort((a, b) => b.metres - a.metres || a.value.localeCompare(b.value));
}

/** The harder of two mtb:scale values, by their step (a + or - only between equal steps). */
function harderMtb(a: string | null, b: string): string {
  if (a === null) return b;
  const step = (value: string) => Number(value[0]) * 3 + (value.endsWith('+') ? 2 : value.endsWith('-') ? 0 : 1);
  return step(b) > step(a) ? b : a;
}

/** The ways under the saved line with their tags, laid onto its length. */
export function trailDetailsOf(
  ways: readonly TracedWay[],
  grades: ReadonlyMap<number, TourTrailGrade>,
  lengthM: number,
): TrailDetails {
  const traced = ways.reduce((sum, way) => sum + way.metres, 0);
  const scale = traced > 0 && lengthM > 0 ? lengthM / traced : 1;
  const total = traced * scale;
  const steps = new Map<number, SacStep>();
  for (const [id, grade] of grades) if (grade.sac_scale) steps.set(id, sacStepOf(grade.sac_scale));
  const mtb = sharesOf(ways, (grade) => grade.mtb_scale, grades, scale, total);
  const known = ways
    .filter((way) => way.wayId !== null && grades.has(way.wayId))
    .reduce((sum, way) => sum + way.metres * scale, 0);
  return {
    length_m: Math.round(total),
    sac: gradesAlong(ways, steps, lengthM),
    mtb: { highest: mtb.reduce<string | null>((hardest, { value }) => harderMtb(hardest, value), null), values: mtb },
    surface: sharesOf(ways, (grade) => grade.surface, grades, scale, total),
    highway: sharesOf(ways, (grade) => grade.highway, grades, scale, total),
    unknown_share: total > 0 ? roundShare(1 - known / total) : 1,
  };
}
