import { horseAccessTone, type HorseAccessShare, type HorseAccessTone } from '@trek/shared';
import type { DistanceUnit } from '../../../types';
import { formatDistance } from '../../../utils/units';

/**
 * HOR-01: how the `horse=*` tags along a section read for a rider. What is
 * tagged is said as it is, step by step; what is not tagged stays unknown.
 * None of it is a permission: being on a signposted route is not either.
 */

/** The step a whole line reads as: the most restrictive one tagged along it, unknown before open. */
const TONE_ORDER: readonly HorseAccessTone[] = ['closed', 'limited', 'unknown', 'open'];

export function accessToneOf(shares: readonly HorseAccessShare[] | undefined): HorseAccessTone | null {
  if (!shares?.length) return null;
  const tones = new Set(shares.map((share) => horseAccessTone(share.value)));
  return TONE_ORDER.find((tone) => tones.has(tone)) ?? null;
}

/** The dot a step is marked with: a status colour, unknown as a hollow ring. */
export const ACCESS_TONE_DOT: Readonly<Record<HorseAccessTone, string>> = {
  open: 'bg-success',
  limited: 'bg-warning',
  closed: 'bg-danger',
  unknown: 'border border-content-faint bg-surface-card',
};

/** The pill tone a step is written in. */
export const ACCESS_TONE_PILL: Readonly<Record<HorseAccessTone, 'success' | 'warning' | 'danger' | 'neutral'>> = {
  open: 'success',
  limited: 'warning',
  closed: 'danger',
  unknown: 'neutral',
};

/** The tags along a line as words, the longest first: "Designated for riders 900 m, Not in the data 450 m". */
export function accessText(
  shares: readonly HorseAccessShare[] | undefined,
  unit: DistanceUnit,
  t: (key: string) => string
): string {
  return (shares ?? [])
    .map((share) => `${t(`tours.horse.access.value.${share.value}`)} ${formatDistance(share.length_m / 1000, unit)}`)
    .join(', ');
}
