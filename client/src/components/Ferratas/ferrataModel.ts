import { type Ferrata, type FerrataBbox, type FerrataGrade, ferrataBboxSpanOk } from '@trek/shared';

import type { FerrataGroup } from './ferrataGroups';

/**
 * The pure half of the via ferrata layer: grade wording, the area checks a
 * request makes, and the GeoJSON the GL renderer draws. React-free, so both
 * renderers and the detail card read the same answers.
 */

/**
 * The grade as the K scale reads it: `K3`, `K4+`, `K2-`. Null when the way has
 * no numeric level (untagged, or a letter scale such as "C/D" the server keeps
 * as `raw` and does not convert).
 */
export function ferrataGradeLabel(grade: FerrataGrade): string | null {
  if (grade.level === null || grade.level === undefined) return null;
  return `K${grade.level}${grade.plus ?? ''}`;
}

/**
 * The line as `[lat, lng]` pairs Leaflet takes. Zod's tuple reads as "maybe two
 * numbers, maybe more" where the client compiles without strict mode, so the
 * pairs are narrowed here rather than cast; the schema has already guaranteed
 * both are numbers.
 */
export function ferrataPositions(ferrata: Pick<Ferrata, 'geometry'>): Array<[number, number]> {
  return ferrata.geometry.flatMap((pair): Array<[number, number]> =>
    typeof pair[0] === 'number' && typeof pair[1] === 'number' ? [[pair[0], pair[1]]] : []
  );
}

const OSM_ORIGIN = 'https://www.openstreetmap.org/';

/**
 * The way's page on openstreetmap.org. Built from the id the contract pins to
 * `way/<digits>` rather than taken from `osmUrl` as sent, so the link can only
 * ever point at OpenStreetMap whatever an Overpass mirror put in the answer.
 */
export function ferrataOsmUrl(ferrata: Pick<Ferrata, 'id'>): string {
  return /^way\/\d+$/.test(ferrata.id) ? `${OSM_ORIGIN}${ferrata.id}` : OSM_ORIGIN;
}

/**
 * Whether the server takes this area: a real box no wider than
 * FERRATA_BBOX_MAX_SPAN_DEG per side. Past it the layer asks the user to zoom
 * in instead of loading every tile of the view.
 */
export function ferrataBboxFits(bbox: FerrataBbox): boolean {
  // The span check is the server's own, so a box the client sends is never refused as too large.
  return bbox.north > bbox.south && bbox.east > bbox.west && ferrataBboxSpanOk(bbox);
}

/** The `bbox` query parameter, in the south,west,north,east order the contract reads. */
export function ferrataBboxParam(bbox: FerrataBbox): string {
  return [bbox.south, bbox.west, bbox.north, bbox.east].map((edge) => edge.toFixed(3)).join(',');
}

interface FerrataLineFeature {
  type: 'Feature';
  properties: { id: string; group: string };
  geometry: { type: 'LineString'; coordinates: Array<[number, number]> };
}

interface FerrataLabelFeature {
  type: 'Feature';
  properties: { group: string };
  geometry: { type: 'Point'; coordinates: [number, number] };
}

interface FeatureCollection<F> {
  type: 'FeatureCollection';
  features: F[];
}

const lngLat = ([lat, lng]: [number, number]): [number, number] => [lng, lat];

/**
 * The segments as a GeoJSON FeatureCollection for MapLibre or Mapbox GL, one
 * line per OSM way. The contract carries [lat, lng] like the rest of TREK;
 * GeoJSON wants [lng, lat], and this is the one place the layer flips it. Only
 * the way and its group ride along: a click looks the ferrata up by id, so
 * names never pass through the map's own feature state, and a highlight
 * filters on the group.
 */
export function ferrataFeatureCollection(groups: readonly FerrataGroup[]): FeatureCollection<FerrataLineFeature> {
  return {
    type: 'FeatureCollection',
    features: groups.flatMap((group) =>
      group.segments.map((segment) => ({
        type: 'Feature' as const,
        properties: { id: segment.id, group: group.id },
        geometry: { type: 'LineString' as const, coordinates: ferrataPositions(segment).map(lngLat) },
      }))
    ),
  };
}

/** One point per ferrata, halfway along it, where the GL renderer puts the route icon. */
export function ferrataLabelCollection(groups: readonly FerrataGroup[]): FeatureCollection<FerrataLabelFeature> {
  return {
    type: 'FeatureCollection',
    features: groups.map((group) => ({
      type: 'Feature' as const,
      properties: { group: group.id },
      geometry: { type: 'Point' as const, coordinates: lngLat(group.midpoint) },
    })),
  };
}
