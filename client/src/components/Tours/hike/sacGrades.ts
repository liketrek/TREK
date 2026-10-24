import { sacStepOf } from '@trek/shared';
import type { HikeFacetSpec } from './hikeFacets';

/**
 * MAP-03: the SAC grades along a hike, read stretch by stretch from the
 * `sac_scale` OpenStreetMap gives the ways under it. A step (`t1` to `t6`)
 * is only ever what OpenStreetMap wrote for that way; a grade that names no
 * single step is unclear, and none of the unknown is ever read as T1.
 */

type SacStepClass = 't1' | 't2' | 't3' | 't4' | 't5' | 't6';

function isSacStep(key: string): key is SacStepClass {
  return /^t[1-6]$/.test(key);
}

/** The step a class stands for, 1 to 6; null for the unknown. */
export function sacStepOfClass(key: string): number | null {
  return isSacStep(key) ? Number(key.slice(1)) : null;
}

/** The highest step known among the classes along the line, or null where none is. */
export function highestStep(rows: readonly { key: string }[]): number | null {
  const steps = rows.map((row) => sacStepOfClass(row.key)).filter((step): step is number => step !== null);
  return steps.length ? Math.max(...steps) : null;
}

export const SAC_FACET: HikeFacetSpec<SacStepClass> = {
  classes: ['t1', 't2', 't3', 't4', 't5', 't6'],
  read: (grade) => {
    if (grade?.sac_scale) return { key: `t${sacStepOf(grade.sac_scale)}`, written: grade.sac_scale };
    if (grade?.sac_scale_unclear) return { key: 'unclear', written: grade.sac_scale_unclear };
    return { key: 'untagged', written: null };
  },
  paint: (key) => key,
};
