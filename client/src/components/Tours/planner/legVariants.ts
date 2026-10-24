import { hikingTimeMinutes, otherWaysOf, type PlannableTourType } from '@trek/shared';
import { analyzeRouteGeometry } from '../../../utils/routeGeometry';
import type { CostingOptions, ValhallaLeg } from '../../Map/valhallaRoute';
import { legSpanOf } from './routeLegAt';
import type { TourPlannerWaypoint } from './tourPlannerWaypoints';
import type { TourElevationPoint } from './tourRouting';

/**
 * RTE-02: the ways a hike's routed section can take, as a pure model: which
 * section can be compared, the way it takes now, the other ways the router
 * offers between the same two points under the same rules, and the figures
 * each one has. Nothing here asks a router or changes the tour.
 */

/** The most other ways one section is offered: the colours and letters the card and the map have for them. */
export const OTHER_WAY_KEYS = ['a', 'b', 'c'] as const;

type OtherWayKey = (typeof OTHER_WAY_KEYS)[number];
export type LegVariantKey = 'current' | OtherWayKey;

/** Where a way's heights stand: still being asked for, in, or not to be had. */
type VariantHeights = 'pending' | 'known' | 'unknown';

/** One way of walking the section, with what is known of it. */
export interface LegVariant {
  key: LegVariantKey;
  /** The way the section takes now, cut from the drawn route. */
  current: boolean;
  coordinates: [number, number][];
  /** Measured along the line, as the tour's own distance is. */
  distanceM: number;
  gainM: number | null;
  lossM: number | null;
  /** The walking time by the signposts' rule the tour is timed by; known once the heights are. */
  minutes: number | null;
  heights: VariantHeights;
}

/** The section a comparison is about, as it stood when it was asked. */
export interface ComparedLeg {
  fromId: string;
  toId: string;
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  /** The hike's rules the ways were asked under. */
  costing: CostingOptions;
  /** What the section is planned from; another key is another section. */
  key: string;
}

/**
 * Whether the leg after waypoint `index` is a routed section of a hike: a
 * leg drawn by hand or a via ferrata taken over keeps its fixed line and is
 * never offered another way.
 */
export function isComparableLeg(
  points: readonly TourPlannerWaypoint[],
  index: number,
  tourType: PlannableTourType
): boolean {
  return tourType === 'hike' && index >= 0 && index < points.length - 1 && !points[index].fixedLeg;
}

const spot = (point: { lat: number; lng: number }) => `${point.lat.toFixed(7)},${point.lng.toFixed(7)}`;

/**
 * The section after the waypoint `fromId` as it stands now, or null when the
 * point is gone or its leg cannot be compared. Its key holds both ends and
 * the rules, so a moved point, a point set in between or a changed limit makes
 * a comparison asked before it one of another section.
 */
export function comparedLegOf(
  points: readonly TourPlannerWaypoint[],
  fromId: string,
  tourType: PlannableTourType,
  costing: CostingOptions
): ComparedLeg | null {
  const index = points.findIndex((point) => point.id === fromId);
  if (!isComparableLeg(points, index, tourType)) return null;
  const from = points[index];
  const to = points[index + 1];
  return {
    fromId: from.id,
    toId: to.id,
    from: { lat: from.lat, lng: from.lng },
    to: { lat: to.lat, lng: to.lng },
    costing,
    key: `${from.id}@${spot(from)}>${to.id}@${spot(to)}#${JSON.stringify(costing)}`,
  };
}

/**
 * Distance, climb, descent and walking time of a line. The climb, descent and
 * time stay unknown unless every point has its height: a figure from part of a
 * line would be set beside whole ones as if it were one.
 */
export function figuresOf(
  line: readonly TourElevationPoint[]
): Pick<LegVariant, 'distanceM' | 'gainM' | 'lossM' | 'minutes' | 'heights'> {
  const analysis = analyzeRouteGeometry(JSON.stringify(line));
  const distanceM = Math.round((analysis?.distanceKm ?? 0) * 1000);
  const gainM = analysis?.gain ?? null;
  const lossM = analysis?.loss ?? null;
  if (gainM === null || lossM === null) {
    return { distanceM, gainM: null, lossM: null, minutes: null, heights: 'unknown' };
  }
  return {
    distanceM,
    gainM: Math.round(gainM),
    lossM: Math.round(lossM),
    minutes: hikingTimeMinutes(distanceM / 1000, gainM, lossM),
    heights: 'known',
  };
}

/**
 * The way the section after waypoint `index` takes now, cut from the drawn
 * route, with its heights where the route has them all; null while the route
 * has no such stretch.
 */
export function currentVariantOf(
  points: ReadonlyArray<{ lat: number; lng: number }>,
  index: number,
  route: readonly [number, number][] | null,
  heights: readonly TourElevationPoint[] | null
): LegVariant | null {
  const span = legSpanOf(points, route, index);
  if (!route || !span) return null;
  const line = route.slice(span.from, span.to + 1);
  const withHeights = heights?.length === route.length ? heights.slice(span.from, span.to + 1) : null;
  return {
    key: 'current',
    current: true,
    coordinates: line.map(([lat, lng]): [number, number] => [lat, lng]),
    ...figuresOf(withHeights ?? line),
  };
}

/**
 * The way the section takes now first, then each other way the router
 * offered that is not the same way again (`otherWaysOf`), lettered in the
 * order the router gave them and at most three. The router's first answer is
 * never one of them: it is its own way between the two points under the same
 * rules, the one the tour already routes the section by, so choosing it could
 * change nothing even where it is drawn a little apart from the route. Their
 * heights are still to be asked for.
 */
export function offeredVariants(current: LegVariant, offers: readonly ValhallaLeg[]): LegVariant[] {
  const others = otherWaysOf(current, offers, OTHER_WAY_KEYS.length);
  return [
    current,
    ...others.map((offer, index): LegVariant => ({
      key: OTHER_WAY_KEYS[index] ?? 'c',
      current: false,
      coordinates: offer.coordinates,
      ...figuresOf(offer.coordinates),
      heights: 'pending',
    })),
  ];
}

/** A way with the heights the router answered, or with its heights unknown when there were none. */
export function withVariantHeights(variant: LegVariant, heights: readonly TourElevationPoint[] | null): LegVariant {
  return { ...variant, ...figuresOf(heights ?? variant.coordinates) };
}

/** How a way differs from the one taken now: metres and minutes more (positive) or fewer; null where unknown. */
export function variantDelta(
  variant: LegVariant,
  current: LegVariant
): { distanceM: number; minutes: number | null; gainM: number | null } {
  return {
    distanceM: variant.distanceM - current.distanceM,
    minutes: variant.minutes !== null && current.minutes !== null ? variant.minutes - current.minutes : null,
    gainM: variant.gainM !== null && current.gainM !== null ? variant.gainM - current.gainM : null,
  };
}
