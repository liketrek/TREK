import type { RouteHighlight } from '../../../store/tourRouteHighlightStore';

type Line = [number, number][];
type LineColor = { line: string; casing: string } | undefined;
/** The route paints resolved for the map, by key: the bike's and the hike's, with the accent and the rim. */
type RoutePaint = Readonly<Record<string, string>> & { readonly way: string; readonly casing: string };

/**
 * The planner map's lines with a highlight laid over them: the route's own
 * lines first as they were, the highlighted stretches after, solid, in their
 * colour over a rim of the map's own white, so they read over the route.
 * Without a highlight the lines stay exactly as they came.
 */
export function withRouteHighlight(
  highlight: RouteHighlight | null,
  route: Line[] | null,
  walking: boolean[] | null,
  colors: LineColor[] | null,
  paint: RoutePaint
): { route: Line[] | null; walking: boolean[] | null; colors: LineColor[] | null } {
  if (!highlight?.lines.length || !route?.length) return { route, walking, colors };
  const colorOf = (index: number) => ({
    line: paint[highlight.paints?.[index] ?? highlight.paint] ?? paint.way,
    casing: paint.casing,
  });
  return {
    route: [...route, ...highlight.lines],
    walking: walking ? [...walking, ...highlight.lines.map(() => false)] : null,
    colors: [...(colors ?? route.map(() => undefined)), ...highlight.lines.map((_, index) => colorOf(index))],
  };
}
