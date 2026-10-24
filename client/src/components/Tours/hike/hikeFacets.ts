import type { TourTrailGrade } from '@trek/shared';
import { sharesBy, stretchesOf, type ClassShare, type RouteWayEdge, type RouteWays } from '../bike/routeWays';
import type { TrailGrades } from '../bike/useRouteWays';
import type { HikePaintKey } from './hikePaint';

/**
 * MAP-03 and MAP-04: what a hike's card reads along the line, one facet at a
 * time (the SAC grade, the surface, the kind of way), from the values
 * OpenStreetMap records for the ways under it. Each facet sorts a way's value
 * into its own classes; what is not known stays unknown, for the same four
 * reasons in every facet: the way carries no such value (`untagged`), one
 * the facet cannot place (`unclear`), no way lies clearly under the tour's
 * line (`unmatched`), or OpenStreetMap could not be asked this time
 * (`unasked`). The router's own reading of a way is never one of the values:
 * it may be normalised or a default. Pure, so the classes, their shares and
 * their stretches are tested apart from the requests.
 */

export type UnknownClass = 'untagged' | 'unclear' | 'unmatched' | 'unasked';

const UNKNOWN_CLASSES: readonly UnknownClass[] = ['untagged', 'unclear', 'unmatched', 'unasked'];

export function isUnknownClass(key: string): key is UnknownClass {
  return (UNKNOWN_CLASSES as readonly string[]).includes(key);
}

/** What a facet reads of one way: the class its value falls in, and the value as OpenStreetMap wrote it. */
interface FacetReading<K extends string> {
  key: K | 'untagged' | 'unclear';
  written: string | null;
}

export interface HikeFacetSpec<K extends string> {
  /** The known classes, in the order the card lists them. */
  classes: readonly K[];
  read(grade: TourTrailGrade | undefined): FacetReading<K>;
  /** The paint a known class is drawn in; the unknown is always the grey of the unknown. */
  paint(key: K): HikePaintKey;
}

type FacetPaint = HikePaintKey | 'unknown';

export interface FacetRow<K extends string = string> extends ClassShare<K | UnknownClass> {
  /** What OpenStreetMap wrote for this class's ways, each value once; none for a way not matched or not asked. */
  tags: string[];
}

type Grades = Pick<TrailGrades, 'byWay' | 'unasked'>;

/** How each stretch of the matched line reads in one facet, given the edges that stray from the tour's own line. */
export function facetClassifier<K extends string>(
  spec: HikeFacetSpec<K>,
  grades: Grades,
  strays: ReadonlySet<RouteWayEdge>
): (edge: RouteWayEdge) => K | UnknownClass {
  return (edge) => {
    if (edge.wayId === null || strays.has(edge)) return 'unmatched';
    if (grades.unasked.has(edge.wayId)) return 'unasked';
    return spec.read(grades.byWay.get(edge.wayId)).key;
  };
}

/** The paint of a class in its facet. */
export function facetPaint<K extends string>(spec: HikeFacetSpec<K>, key: K | UnknownClass): FacetPaint {
  return isUnknownClass(key) ? 'unknown' : spec.paint(key);
}

/**
 * The share of each class along the line in the card's order, the known
 * classes first, each with the values OpenStreetMap wrote for it; classes the
 * line has none of are left out.
 */
export function facetRows<K extends string>(
  spec: HikeFacetSpec<K>,
  ways: RouteWays,
  grades: Grades,
  classOf: (edge: RouteWayEdge) => K | UnknownClass
): FacetRow<K>[] {
  const order: readonly string[] = [...spec.classes, ...UNKNOWN_CLASSES];
  const tags = new Map<string, Set<string>>();
  for (const edge of ways.edges) {
    const key = classOf(edge);
    if (edge.wayId === null || key === 'unmatched' || key === 'unasked') continue;
    const written = spec.read(grades.byWay.get(edge.wayId)).written;
    if (written) tags.set(key, (tags.get(key) ?? new Set()).add(written));
  }
  return sharesBy(ways, classOf)
    .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))
    .map((row) => ({ ...row, tags: [...(tags.get(row.key) ?? [])] }));
}

/** Of the whole line, 0 to 1, the share whose class is known. */
export function knownShareOf(rows: readonly FacetRow[]): number {
  return rows.filter((row) => !isUnknownClass(row.key)).reduce((sum, row) => sum + row.share, 0);
}

interface FacetOverlay {
  lines: [number, number][][];
  paints: FacetPaint[];
}

/**
 * Every class's stretches with their paints, for drawing the facet along the
 * whole line at once; `only` draws one class alone.
 */
export function facetOverlay<K extends string>(
  spec: HikeFacetSpec<K>,
  ways: RouteWays,
  rows: readonly FacetRow<K>[],
  classOf: (edge: RouteWayEdge) => K | UnknownClass,
  only: string | null = null
): FacetOverlay {
  const lines: [number, number][][] = [];
  const paints: FacetPaint[] = [];
  for (const row of rows) {
    if (only && row.key !== only) continue;
    for (const line of stretchesOf(ways, (edge) => classOf(edge) === row.key)) {
      lines.push(line);
      paints.push(facetPaint(spec, row.key));
    }
  }
  return { lines, paints };
}
