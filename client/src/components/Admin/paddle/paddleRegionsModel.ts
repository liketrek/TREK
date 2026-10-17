import type { PaddleRegion } from '@trek/shared';

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
