import type { BookMetric, BookUnits } from '@trek/shared';
import { CalendarDays, Camera, Footprints, Globe, MapPin, Navigation, Route, type LucideIcon } from 'lucide-react';
import { lighterWeight, nearestWeight } from '../bookFonts';

/**
 * What every drawing of the journey's elements shares: millimetres rounded the
 * way the document stores them, an ink at a strength, the two weights a figure
 * and its caption are set in, and how a figure is written.
 *
 * TravelElements.tsx draws the looks every book has had since the start, and
 * the files beside this one draw the newer ones. Both take these from here, so
 * a figure reads the same whichever look it is set in.
 */

/** Two decimals of a millimetre, matching what the document stores. */
export const round2 = (n: number) => Math.round(n * 100) / 100;

/** A length for a style, in millimetres. */
export const mm = (n: number) => `${round2(n)}mm`;

/** #rrggbb at a strength, for the hairlines, tints and quiet labels of a drawing. */
export function inkAt(hex: string, alpha: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/**
 * How heavy the type is set, and one step down for the labels under it. These
 * elements draw at two levels at once, a figure over its caption, and the pair
 * moves together the way `textScale` moves their size.
 */
export const heavy = (el: { font: string; weight: number }) => nearestWeight(el.font, el.weight);
export const light = (el: { font: string; weight: number }) => lighterWeight(el.font, el.weight);

/**
 * The icon beside each figure, from lucide like every other icon in TREK. The
 * stroke is the drawing's own, so it scales with the figure on a large panel.
 */
export const METRIC_ICONS: Record<BookMetric, LucideIcon> = {
  distance: Route,
  days: CalendarDays,
  steps: Footprints,
  photos: Camera,
  countries: Globe,
  places: MapPin,
  furthest: Navigation,
};

/**
 * A figure as it is printed: the number in the reader's locale and the unit
 * that rides with it. Distances are stored in metres and converted here, so
 * switching units never rounds a second time on top of a rounded number.
 */
export function metricValue(
  metric: BookMetric,
  values: Record<string, number>,
  units: BookUnits,
  locale: string
): { value: string; unit: string } {
  const raw = values[metric] ?? 0;
  const n = (v: number, digits = 0) => new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(v);

  if (metric === 'distance' || metric === 'furthest') {
    const km = raw / 1000;
    const shown = units === 'imperial' ? km * 0.621371 : km;
    return { value: n(shown, shown < 100 ? 1 : 0), unit: units === 'imperial' ? 'mi' : 'km' };
  }
  return { value: n(raw), unit: '' };
}
