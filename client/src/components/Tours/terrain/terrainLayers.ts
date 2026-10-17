import type { Map as MapLibreMap, StyleSpecification } from 'maplibre-gl';
import { OPENTOPOMAP_TILE_URL, SATELLITE_TILE_URL } from '../../../constants/mapDefaults';
import type { DistanceIndexedProfileSample } from '../../../utils/routeGeometry';
import { OPENFREEMAP_DEFAULT_STYLE } from '../../Map/glProviders';
import type { TourBaseLayer } from '../../Map/MapLayerSwitcher';
import { plannerPinShape, type PlannerPinPoint } from '../../Map/plannerPinShape';
import type { TileTemplate } from './terrainPrefetch';
import { gradeBand, gradeSegments } from './tourTerrainModel';

/**
 * What the 3D tour map draws and how its camera frames it, kept out of the hooks so
 * the hooks only wire it to React. Everything here is map paint on the terrain, not an
 * app surface, which is why the colours are fixed hex rather than theme tokens.
 */

export type TrackColorMode = 'grade' | 'tour';

// Mapzen's Terrarium tiles, published as AWS Open Data: free, keyless, worldwide.
const DEM_TILES = 'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png';
export const DEM_SOURCE = 'tour-terrain-dem';
// Hillshade reads its own copy: sharing the terrain's source lowers both renderings.
const HILLSHADE_SOURCE = 'tour-terrain-hillshade-dem';
export const TRACK_SOURCE = 'tour-terrain-track';
export const PITCH = 60;
/** The planner's route blue, the colour its numbered control points always had. */
const PIN_BLUE = '#0a84ff';

/** How much of the map each side panel covers. The panels sit on fixed physical sides. */
export interface PanelWidths {
  leftWidth: number;
  rightWidth: number;
}

type Bounds = [[number, number], [number, number]];

export type TrackData = {
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    properties: { color: string };
    geometry: { type: 'LineString'; coordinates: [number, number][] };
  }[];
};

/** The camera's side padding: the panels plus a margin, on the sides the panels are on. */
export function sidePadding(panels: PanelWidths, margin: number) {
  const left = panels.leftWidth + margin;
  const right = panels.rightWidth + margin;
  return { left, right };
}

function rasterStyle(tiles: string[], maxzoom: number): StyleSpecification {
  return {
    version: 8,
    sources: { base: { type: 'raster', tiles, tileSize: 256, maxzoom } },
    layers: [{ id: 'base', type: 'raster', source: 'base' }],
  };
}

/** The same three looks as the flat planner map, draped over the terrain. */
export function styleFor(layer: TourBaseLayer): string | StyleSpecification {
  if (layer === 'satellite') return rasterStyle([SATELLITE_TILE_URL], 19);
  if (layer === 'topo')
    return rasterStyle(
      ['a', 'b', 'c'].map((s) => OPENTOPOMAP_TILE_URL.replace('{s}', s)),
      17
    );
  return OPENFREEMAP_DEFAULT_STYLE;
}

function line(color: string, coordinates: [number, number][]): TrackData['features'][number] {
  return { type: 'Feature', properties: { color }, geometry: { type: 'LineString', coordinates } };
}

/** The open tour piece by piece in its grade colours, else every planner route in the tour colour. */
export function trackData(
  samples: DistanceIndexedProfileSample[],
  routes: [number, number][][] | null,
  mode: TrackColorMode,
  trackColor: string
): TrackData {
  const segments = gradeSegments(samples);
  if (segments.length) {
    return {
      type: 'FeatureCollection',
      features: segments.map((segment) =>
        line(mode === 'grade' ? gradeBand(segment.grade).paint : trackColor, [segment.from, segment.to])
      ),
    };
  }
  return {
    type: 'FeatureCollection',
    features: (routes ?? [])
      .filter((route) => route.length > 1)
      .map((route) =>
        line(
          trackColor,
          route.map(([lat, lng]) => [lng, lat] as [number, number])
        )
      ),
  };
}

function boundsOf(points: [number, number][], pad: number): Bounds | null {
  if (!points.length) return null;
  const lngs = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  return [
    [Math.min(...lngs) - pad, Math.min(...lats) - pad],
    [Math.max(...lngs) + pad, Math.max(...lats) + pad],
  ];
}

/**
 * What the camera frames: the drawn route, else the control points, else what the flat
 * map framed ([lat, lng] each). A lone point gets ~2 km around it, so the terrain shows
 * instead of one tile.
 */
export function frameBounds(
  data: TrackData,
  pins: ReadonlyArray<{ lat: number; lng: number }>,
  framePoints: [number, number][]
): Bounds | null {
  const route = boundsOf(
    data.features.flatMap((feature) => feature.geometry.coordinates),
    0
  );
  if (route) return route;
  const fallback = pins.length
    ? pins.map((p): [number, number] => [p.lng, p.lat])
    : framePoints.map(([lat, lng]): [number, number] => [lng, lat]);
  return boundsOf(fallback, fallback.length === 1 ? 0.02 : 0);
}

/** The terrain, its hillshade and the route on top; run again after every style swap. */
export function addTerrainLayers(map: MapLibreMap, data: TrackData, exaggeration: number): void {
  for (const id of [DEM_SOURCE, HILLSHADE_SOURCE]) {
    if (!map.getSource(id)) {
      map.addSource(id, { type: 'raster-dem', tiles: [DEM_TILES], tileSize: 256, encoding: 'terrarium', maxzoom: 15 });
    }
  }
  map.setTerrain({ source: DEM_SOURCE, exaggeration });
  map.addLayer({
    id: 'tour-terrain-hillshade',
    type: 'hillshade',
    source: HILLSHADE_SOURCE,
    paint: { 'hillshade-exaggeration': 0.35 },
  });
  map.addSource(TRACK_SOURCE, { type: 'geojson', data });
  const layout = { 'line-cap': 'round', 'line-join': 'round' } as const;
  map.addLayer({
    id: 'tour-terrain-casing',
    type: 'line',
    source: TRACK_SOURCE,
    layout,
    paint: { 'line-color': '#ffffff', 'line-width': 8, 'line-opacity': 0.9 },
  });
  map.addLayer({
    id: 'tour-terrain-line',
    type: 'line',
    source: TRACK_SOURCE,
    layout,
    paint: { 'line-color': ['get', 'color'], 'line-width': 5 },
  });
  map.setSky({ 'sky-color': '#9cc3f0', 'horizon-color': '#e8f0fb', 'fog-color': '#f4f7fb', 'sky-horizon-blend': 0.5 });
}

/** Every tiled source the loaded style draws from, the elevation model included. */
export function loadedTemplates(map: MapLibreMap): TileTemplate[] {
  const templates: TileTemplate[] = [];
  for (const id of Object.keys(map.getStyle().sources)) {
    if (id === HILLSHADE_SOURCE || id === TRACK_SOURCE) continue;
    const source = map.getSource(id) as { tiles?: string[]; minzoom?: number; maxzoom?: number } | undefined;
    const url = source?.tiles?.[0];
    if (url) templates.push({ url, minzoom: source.minzoom ?? 0, maxzoom: source.maxzoom ?? 22 });
  }
  return templates;
}

/** One point every ~150 m of the route: dense enough that no tile of the corridor is skipped. */
export function corridorPoints(samples: DistanceIndexedProfileSample[]): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  let lastAt = -Infinity;
  for (const sample of samples) {
    const { lat, lng } = sample;
    if (lat === undefined || lng === undefined || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (sample.distanceMeters - lastAt < 150) continue;
    lastAt = sample.distanceMeters;
    points.push({ lat, lng });
  }
  return points;
}

/** The dot that rides the route during the flyover and marks the rail's focus. */
export function riderElement(trackColor: string): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = `width:18px;height:18px;border-radius:9999px;background:${trackColor};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.45)`;
  return el;
}

/** A numbered control point, the same pin the flat planner map draws. */
export function waypointPinElement(
  point: PlannerPinPoint,
  index: number,
  selected: boolean,
  editable: boolean
): HTMLButtonElement {
  const { size, text } = plannerPinShape(point, index, selected);
  const el = document.createElement('button');
  el.type = 'button';
  el.textContent = text;
  el.setAttribute('aria-label', `Waypoint ${index + 1}`);
  el.style.cssText = `display:flex;width:${size}px;height:${size}px;align-items:center;justify-content:center;border-radius:9999px;background:${PIN_BLUE};color:white;border:${selected ? 3 : 2}px solid white;box-shadow:0 2px 7px rgba(0,0,0,.4);font:700 11px system-ui;cursor:${editable ? 'grab' : 'pointer'};padding:0`;
  return el;
}
