import { readMapPaint, sameMapPaint } from '../Map/mapPaint';

/**
 * The colours the via ferrata lines are drawn in.
 *
 * Ferratas have a look of their own: a dashed violet line on a white halo.
 * Violet is the one colour nothing else on the planner map uses (the route is
 * blue, its grades run green to red, the waypoints are blue), and the halo
 * keeps it readable over a satellite tile or dark hillshade. The ferrata under
 * the pointer or open in the card is drawn solid, wider and in a deeper violet.
 * The grade is a badge on the card, never a line colour.
 *
 * Map paint cannot take a `var(--token)`: Leaflet writes the colour into an
 * SVG `stroke` attribute and GL paint wants a resolved colour string. So the
 * `--map-ferrata*` tokens are read off the document when the layer draws
 * (`mapPaint.ts`; the precedent is the hazard overlay in useHazardLayerGL),
 * which keeps light and dark mode apart without a colour literal in the layer.
 */
export interface FerrataPaint {
  /** The dashed line itself. */
  line: string;
  /** The halo under the line, so it stays readable over a satellite or hillshade tile. */
  casing: string;
  /** The ferrata under the pointer or open in the card. */
  highlight: string;
}

export const FERRATA_TOKENS = {
  line: '--map-ferrata',
  casing: '--map-ferrata-casing',
  highlight: '--map-ferrata-lit',
} as const;

export function ferrataPaint(): FerrataPaint {
  return readMapPaint(FERRATA_TOKENS);
}

export function sameFerrataPaint(a: FerrataPaint, b: FerrataPaint): boolean {
  return sameMapPaint(a, b);
}
