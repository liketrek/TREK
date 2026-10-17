import { paddleObstacleKeyOf, type PaddleFeature, type RelatedObstacle } from '@trek/shared';
import { OBSTACLE_GLYPH, PADDLE_GLYPH_PATHS, paddleGlyphSvg, type PaddleGlyphKind } from './paddleGlyphPaths';
import { paddleKindPaint, type PaddlePaint } from './paddlePaint';

/**
 * PAD-05B: the paddle obstacles as the planner maps draw them, one model for
 * Leaflet and GL. Colours sort objects into what they are, never into safe or
 * unsafe: obstacles in slate, access rules in indigo, places to get in and out
 * in teal, portage ways in the earth brown of the planner's own portages.
 * How strongly an object shows says how it stands to the route.
 */

export type PaddleMapRelation = 'on_route' | 'near' | 'area';

export interface PaddleMapItem {
  feature: PaddleFeature;
  relation: PaddleMapRelation;
  /** Its kind's colour, resolved for map paint. */
  color: string;
  /** The marker's disc and the lines' casing, in the map's own white (or dark). */
  disc: string;
  shadow: string;
  glyph: PaddleGlyphKind;
  /** Where its marker sits: the point itself, or the middle of its line. */
  marker: [number, number];
  /** Its line or outline as [lat, lng] pairs; null for a point. */
  line: [number, number][] | null;
}

export interface PaddleMapLayer {
  items: PaddleMapItem[];
  selectedRef: string | null;
  /** The checklist key of the selected object (PAD-06): every part of a selected lock lights up with it. */
  selectedKey: string | null;
  onSelect: (ref: string) => void;
}

/** The checklist key of the selected object among the features, or null when none is selected. */
export function selectedPaddleKey(features: readonly PaddleFeature[], selectedRef: string | null): string | null {
  const feature = selectedRef === null ? undefined : features.find((candidate) => candidate.ref === selectedRef);
  return feature ? paddleObstacleKeyOf(feature) : null;
}

/** Whether an item shows as selected: the object itself, or another part of the same lock. */
export function isPaddleItemSelected(
  item: PaddleMapItem,
  selectedRef: string | null,
  selectedKey: string | null
): boolean {
  return (
    item.feature.ref === selectedRef || (selectedKey !== null && paddleObstacleKeyOf(item.feature) === selectedKey)
  );
}

function lineOf(feature: PaddleFeature): [number, number][] | null {
  const { geometry } = feature;
  if (geometry.type === 'Point') return null;
  const ring = geometry.type === 'LineString' ? geometry.coordinates : (geometry.coordinates[0] ?? []);
  return ring.map(([lng, lat]) => [lat, lng]);
}

function markerOf(feature: PaddleFeature, line: [number, number][] | null): [number, number] {
  if (feature.geometry.type === 'Point') return [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
  const points = line ?? [];
  return points[Math.floor(points.length / 2)] ?? [0, 0];
}

/** The items to draw: the related ones as they stand to the route, the rest of the area quietly. */
export function paddleMapItems(
  features: readonly PaddleFeature[],
  related: readonly RelatedObstacle[],
  paint: PaddlePaint
): PaddleMapItem[] {
  const relations = new Map(related.map((entry) => [entry.feature.ref, entry.relation]));
  return features.map((feature) => {
    const line = lineOf(feature);
    return {
      feature,
      relation: relations.get(feature.ref) ?? 'area',
      color: paddleKindPaint(feature.kind, paint),
      disc: paint.disc,
      shadow: paint.shadow,
      glyph: OBSTACLE_GLYPH[feature.kind],
      marker: markerOf(feature, line),
      line,
    };
  });
}

/**
 * Objects that are only in the area show from this zoom on, on Leaflet and GL
 * alike, so an overview of a long tour stays calm; the ones on or near the
 * route always show, and so does a picked one.
 */
export const PADDLE_AREA_MIN_ZOOM = 13;

/** Whether an item is drawn as one of the area's quiet objects, which wait for PADDLE_AREA_MIN_ZOOM. */
export function isAreaOnly(item: PaddleMapItem, selectedRef: string | null): boolean {
  return item.relation === 'area' && item.feature.ref !== selectedRef;
}

/** The items a map at `zoom` shows. */
export function paddleItemsAtZoom(
  items: readonly PaddleMapItem[],
  zoom: number,
  selectedRef: string | null
): PaddleMapItem[] {
  return zoom >= PADDLE_AREA_MIN_ZOOM ? [...items] : items.filter((item) => !isAreaOnly(item, selectedRef));
}

/** The marker's size in pixels by how it stands to the route; a selected one is larger still. */
export function markerSize(relation: PaddleMapRelation, selected: boolean): number {
  if (selected) return 36;
  return relation === 'on_route' ? 30 : relation === 'near' ? 26 : 22;
}

/**
 * A marker as markup: a white disc with a ring in the object's colour and its
 * glyph inside, dashed when the object is only near the route, faded when it
 * is merely in the area. It carries no user content.
 */
export function paddleMarkerHtml(item: PaddleMapItem, selected: boolean): string {
  const size = markerSize(item.relation, selected);
  const ring = selected ? 3 : 2;
  const dash = item.relation === 'near' && !selected ? 'dashed' : 'solid';
  const opacity = item.relation === 'area' && !selected ? 0.6 : 1;
  const glyph = paddleGlyphSvg(item.glyph, Math.round(size * 0.58), item.color);
  const style = `width:${size}px;height:${size}px;border-radius:9999px;background:${item.disc};border:${ring}px ${dash} ${item.color};box-shadow:0 1px 3px ${item.shadow};display:grid;place-items:center;box-sizing:border-box;opacity:${opacity}`;
  return `<div style="${style}">${glyph}</div>`;
}

/**
 * The same marker as a standalone SVG, for the GL maps' symbol images: drawn
 * at twice its size for sharp pixels on dense screens, the ring dashed or
 * faded as the HTML marker is.
 */
export function paddleMarkerSvg(item: PaddleMapItem, selected: boolean): string {
  const size = markerSize(item.relation, selected) * 2;
  const ring = (selected ? 3 : 2) * 2;
  const r = size / 2 - ring / 2 - 2;
  const dash = item.relation === 'near' && !selected ? ' stroke-dasharray="6 5"' : '';
  const opacity = item.relation === 'area' && !selected ? 0.6 : 1;
  const glyph = Math.round(size * 0.58);
  const offset = (size - glyph) / 2;
  const paths = PADDLE_GLYPH_PATHS[item.glyph].map((d) => `<path d="${d}"/>`).join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" opacity="${opacity}">` +
    `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="${item.disc}" stroke="${item.color}" stroke-width="${ring}"${dash}/>` +
    `<svg x="${offset}" y="${offset}" width="${glyph}" height="${glyph}" viewBox="0 0 24 24" fill="none" stroke="${item.color}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${paths}</svg></svg>`
  );
}

/** The name of a marker's image on a GL map, one per look; a theme change draws new ones. */
export function paddleMarkerImageId(item: PaddleMapItem, selected: boolean): string {
  const tint = `${item.color}-${item.disc}`.replace(/[^a-z0-9]/gi, '');
  return `trek-paddle-${item.glyph}-${tint}-${item.relation}${selected ? '-sel' : ''}`;
}
