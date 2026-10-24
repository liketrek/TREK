import type { PaddleRegion, PaddleRegionAutoMode } from '@trek/shared';

/** How TREK loads a paddler's region by itself, in the order the switch shows them. */
export const AUTO_LOAD_MODES: readonly PaddleRegionAutoMode[] = ['auto', 'ask', 'off'];
/** The largest region TREK loads by itself, in megabytes: a district, a state, a small country. */
const AUTO_LOAD_SIZES = [100, 250, 500, 1000, 2000] as const;

/** The size choices, with a stored size outside the presets kept among them in its place. */
export function autoLoadSizes(current: number): number[] {
  return (AUTO_LOAD_SIZES as readonly number[]).includes(current)
    ? [...AUTO_LOAD_SIZES]
    : [...AUTO_LOAD_SIZES, current].sort((a, b) => a - b);
}

/** A size in megabytes as the reader's language writes it, from 1000 on in gigabytes. */
export function formatMegabytes(mb: number, language: string): string {
  return new Intl.NumberFormat(language, {
    style: 'unit',
    unit: mb >= 1000 ? 'gigabyte' : 'megabyte',
    maximumFractionDigits: mb >= 1000 ? 1 : 0,
  }).format(mb >= 1000 ? mb / 1000 : mb);
}

/** A region waiting for its read or being read: the list asks again until none is. */
export function isReading(region: Pick<PaddleRegion, 'status'>): boolean {
  return region.status === 'queued' || region.status === 'importing';
}

/** The share of a read under way as a whole percent, or null while its size is unknown. */
export function progressPercent(region: Pick<PaddleRegion, 'progress'>): number | null {
  const fraction = region.progress?.fraction;
  return fraction === null || fraction === undefined ? null : Math.round(fraction * 100);
}

/** The status badge's tone: what state the read is in, never whether the water is safe. */
export function regionStatusTone(status: PaddleRegion['status']): 'neutral' | 'accent' | 'success' | 'danger' {
  if (status === 'importing') return 'accent';
  if (status === 'ready') return 'success';
  if (status === 'failed') return 'danger';
  return 'neutral';
}
