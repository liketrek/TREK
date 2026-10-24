import { useMapPaint } from '../../Map/mapPaint';

/**
 * The colours a ride's horse routes are drawn in on a map (styles/horse.css):
 * the sections of a route in its brown, the one chosen in the accent, both on
 * a rim. The cards take the CSS variables directly; a map needs them resolved.
 */
const HORSE_PAINT_TOKENS = {
  section: '--horse-route',
  chosen: '--accent',
  casing: '--horse-route-casing',
} as const;

export function useHorsePaint(): Record<keyof typeof HORSE_PAINT_TOKENS, string> {
  return useMapPaint(HORSE_PAINT_TOKENS);
}
