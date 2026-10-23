import { useMemo } from 'react';
import { useMapPaint } from '../../Map/mapPaint';
import { withRouteHighlight } from '../bike/routeHighlight';
import type { LegVariant, LegVariantKey } from './legVariants';

/**
 * RTE-02, RTE-03: the colours of the ways offered for one section of a hike
 * and of the round hikes offered out of a stop (styles/hike.css), by their
 * key: the way taken now in the route's blue, the others in a hue each, over
 * the white rim the route's highlights wear. The card takes the CSS variable,
 * the map the resolved colour.
 */
const VARIANT_PAINT_TOKENS = {
  current: '--hike-variant-current',
  a: '--hike-variant-a',
  b: '--hike-variant-b',
  c: '--hike-variant-c',
  casing: '--bike-highlight-casing',
} as const;

/** A way's colour as a CSS variable, for markup on the page. */
export function variantPaintCss(key: LegVariantKey): string {
  return `var(${VARIANT_PAINT_TOKENS[key]})`;
}

/** The ways' colours and their rim resolved for map paint, again whenever the theme changes. */
export function useVariantPaint(): Readonly<Record<LegVariantKey | 'casing', string>> {
  return useMapPaint(VARIANT_PAINT_TOKENS);
}

type Drawn = Parameters<typeof withRouteHighlight>;
/** A way as the map draws it: its line and the key its colour goes by. */
type DrawnWay = Pick<LegVariant, 'key' | 'coordinates'>;

/**
 * The ways in the order they are drawn: the one in focus (hovered or chosen)
 * last, so it lies on top of the others where they share a path.
 */
export function drawOrder<T extends DrawnWay>(variants: readonly T[], focus: LegVariantKey | null): T[] {
  return [
    ...variants.filter((variant) => variant.key !== focus),
    ...variants.filter((variant) => variant.key === focus),
  ];
}

/** Ways with no route to lie over: their lines alone, each in its colour over the rim. */
function waysAlone(ways: readonly DrawnWay[], paint: Readonly<Record<LegVariantKey | 'casing', string>>) {
  return {
    route: ways.map((way) => way.coordinates),
    walking: null,
    colors: ways.map((way) => ({ line: paint[way.key], casing: paint.casing })),
  };
}

/**
 * The planner map's lines with the ways offered laid over them, each in its
 * colour; the lines as they came while nothing is offered. A round offered
 * from a tour of one point has no route to lie over and is drawn on its own.
 * `overlays` are the same ways for the 3D view, which draws its own line.
 */
export function useLegVariantLines(
  route: Drawn[1],
  walking: Drawn[2],
  colors: Drawn[3],
  variants: readonly DrawnWay[] | null,
  focus: LegVariantKey | null
) {
  const paint = useVariantPaint();
  return useMemo(() => {
    const ordered = variants ? drawOrder(variants, focus) : [];
    const highlight = ordered.length
      ? {
          id: 'leg-variants',
          lines: ordered.map((variant) => variant.coordinates),
          paint: 'current',
          paints: ordered.map((variant) => variant.key),
        }
      : null;
    const overlays = ordered.map((variant) => ({ coordinates: variant.coordinates, color: paint[variant.key] }));
    if (highlight && !route?.length) return { ...waysAlone(ordered, paint), overlays };
    const drawn = withRouteHighlight(highlight, route, walking, colors, { ...paint, way: paint.current });
    return { ...drawn, overlays };
  }, [colors, focus, paint, route, variants, walking]);
}
