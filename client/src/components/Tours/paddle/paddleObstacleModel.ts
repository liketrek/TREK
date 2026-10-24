import {
  PADDLE_BLOCKING_KINDS,
  paddleAccessOf,
  type PaddleAccess,
  type PaddleCoverageRegion,
  type PaddleFeature,
  type PaddleObstacleKind,
  type RelatedObstacle,
} from '@trek/shared';
import type { PaddleMapRelation } from './paddleMapLayer';

/**
 * PAD-05B: what the obstacle card and the route band show of one paddle
 * object, worked out of the obstacle store without React. Nothing here turns
 * a missing value into a permission: an object without an access tag says it
 * has none, and an object only near the route stays "near", never "on it".
 */

/** The tags the card names, each with a label of its own; everything else of the kept tags stays behind. */
export const OBSTACLE_FACT_KEYS = [
  'height',
  'width',
  'whitewater:section_grade',
  'opening_hours',
  'seasonal',
  'fee',
  'operator',
] as const;
type ObstacleFactKey = (typeof OBSTACLE_FACT_KEYS)[number];

/** The access values the card puts into words; any other value is shown as OSM has it. */
export const KNOWN_ACCESS_VALUES = ['yes', 'no', 'private', 'permissive', 'designated'] as const;

export interface PaddleObstacleDetail {
  feature: PaddleFeature;
  relation: PaddleMapRelation;
  /** Metres between the route and the object; null for an object only in the area. */
  distanceM: number | null;
  /** Metres from the start of the route to where it comes closest; null for an object only in the area. */
  alongM: number | null;
  /** The date the object's region is current to, ISO 8601; null when unknown. */
  dataAsOf: string | null;
  access: PaddleAccess;
  /** A carrying way someone recorded as private: never a way round that is open to anyone. */
  privateWay: boolean;
  facts: { key: ObstacleFactKey; value: string }[];
  /** The free text OSM holds about it, shown as written. */
  note: string | null;
}

/** The object in OpenStreetMap, for the source link. */
export function osmUrlOf(ref: string): string {
  return `https://www.openstreetmap.org/${ref}`;
}

export function isBlockingKind(kind: PaddleObstacleKind): boolean {
  return PADDLE_BLOCKING_KINDS.includes(kind);
}

/** The picked object with everything the card says about it, or null when nothing (or nothing known) is picked. */
export function paddleObstacleDetail(state: {
  features: readonly PaddleFeature[];
  related: readonly RelatedObstacle[];
  regions: readonly PaddleCoverageRegion[];
  selectedRef: string | null;
}): PaddleObstacleDetail | null {
  const feature = state.selectedRef ? state.features.find((entry) => entry.ref === state.selectedRef) : undefined;
  if (!feature) return null;
  const related = state.related.find((entry) => entry.feature.ref === feature.ref);
  const tags = feature.tags;
  const access = paddleAccessOf(tags);
  const portageAccess = tags['portage:access'] ?? tags.access;
  return {
    feature,
    relation: related?.relation ?? 'area',
    distanceM: related ? related.distanceM : null,
    alongM: related ? related.alongM : null,
    dataAsOf: state.regions.find((region) => region.id === feature.region_id)?.source_timestamp ?? null,
    access,
    privateWay: feature.kind === 'portage' && (access.private || portageAccess === 'private'),
    facts: OBSTACLE_FACT_KEYS.flatMap((key) => {
      const value = tags[key]?.trim();
      return value ? [{ key, value }] : [];
    }),
    note: tags.description?.trim() || tags.note?.trim() || null,
  };
}

export interface RouteStripObstacle {
  ref: string;
  kind: PaddleObstacleKind;
  name: string | null;
  relation: 'on_route' | 'near';
  /** Where it sits on the band, in the band's own metres. */
  atM: number;
}

/**
 * The obstacles to mark on the route band: the ones a paddler has to decide
 * about, on the route or near it, placed by their share of the measured route
 * so they sit right on a band drawn to another length. Access rules run along
 * whole stretches and are left to the map and the card.
 */
export function routeStripObstacles(
  related: readonly RelatedObstacle[],
  measuredLengthM: number,
  bandLengthM: number
): RouteStripObstacle[] {
  if (measuredLengthM <= 0 || bandLengthM <= 0) return [];
  return related.flatMap((entry) => {
    const { feature } = entry;
    if (feature.kind === 'access' || !isBlockingKind(feature.kind)) return [];
    const share = Math.min(1, Math.max(0, entry.alongM / measuredLengthM));
    return [
      { ref: feature.ref, kind: feature.kind, name: feature.name, relation: entry.relation, atM: share * bandLengthM },
    ];
  });
}

/** A length tag as a number of metres when it is one ("1.5", "2"); null for anything with its own unit or words. */
export function metresOf(value: string): number | null {
  return /^\d+(\.\d+)?$/.test(value) ? Number(value) : null;
}
