import type { SnappedWaypoint } from './planning-types';

export const ACCESS_SPUR_MIN_M = 30;

export const ACCESS_LABEL_MIN_M = 250;

export function spurFor(snapped: SnappedWaypoint | undefined | null): [[number, number], [number, number]] | null {
  if (!snapped) return null;
  if (!(snapped.meters >= ACCESS_SPUR_MIN_M)) return null;
  return [snapped.asked, snapped.at];
}

export function spurWorthLabelling(meters: number | null | undefined): boolean {
  return typeof meters === 'number' && meters >= ACCESS_LABEL_MIN_M;
}
