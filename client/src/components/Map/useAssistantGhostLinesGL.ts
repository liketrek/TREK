import { useEffect, useLayoutEffect, useRef } from 'react';

import type { AssistantRouteLine } from '../../types/assistantMap';
import { mapHoverLabel } from './mapHoverLabel';
import { PLACE_CLUSTER_CIRCLE_LAYER_ID, PLACE_CLUSTER_COUNT_LAYER_ID } from './placeClusterLayers';

const SOURCE_ID = 'assistant-route-lines';
export const ROUTE_LINE_LAYERS = {
  casing: `${SOURCE_ID}-casing`,
  line: `${SOURCE_ID}-line`,
  dashed: `${SOURCE_ID}-line-dashed`,
  tint: `${SOURCE_ID}-tint`,
  ends: `${SOURCE_ID}-ends`,
  stops: `${SOURCE_ID}-stops`,
  hit: `${SOURCE_ID}-hit`,
} as const;

/** The way a change replaces, beside the new one. */
const DIM_OPACITY = 0.45;
const ROUND = { 'line-cap': 'round', 'line-join': 'round' } as const;

type Position = [number, number];
interface Feature {
  type: 'Feature';
  properties: Record<string, string | number | boolean>;
  geometry:
    | { type: 'MultiLineString'; coordinates: Position[][] }
    | { type: 'LineString'; coordinates: Position[] }
    | { type: 'Point'; coordinates: Position };
}
interface FeatureCollection {
  type: 'FeatureCollection';
  features: Feature[];
}

/** What a pointer event on a layer hands over: where, and the feature under it. */
interface LayerEvent {
  lngLat: { lng: number; lat: number };
  point?: { x: number; y: number };
  features?: { properties?: Record<string, unknown> | null }[];
  /** The DOM event behind it: a place pin is a DOM marker over the canvas, and its taps reach the layers too. */
  originalEvent?: { target?: EventTarget | null };
}

/**
 * The slice of the GL map the route lines need. Every call is optional, so a
 * stand-in map without them draws nothing instead of throwing; Mapbox and
 * MapLibre both fit.
 */
export interface LineMap {
  getSource?(id: string): { setData?: (data: FeatureCollection) => void } | undefined;
  addSource?(id: string, source: { type: 'geojson'; data: FeatureCollection }): unknown;
  addLayer?(layer: Record<string, unknown>): unknown;
  getLayer?(id: string): unknown;
  isStyleLoaded?(): boolean;
  queryRenderedFeatures?(point: { x: number; y: number }, options: { layers: string[] }): unknown[];
  getContainer?(): HTMLElement;
  getCanvas?(): HTMLElement;
  on?(type: 'styledata', listener: () => void): unknown;
  on?(type: 'mousemove' | 'mouseleave' | 'click', layer: string, listener: (event: LayerEvent) => void): unknown;
  off?(type: 'styledata', listener: () => void): unknown;
  off?(type: 'mousemove' | 'mouseleave' | 'click', layer: string, listener: (event: LayerEvent) => void): unknown;
}

/** [lat, lng] as the store keeps points, [lng, lat] as GeoJSON wants them. */
const flip = ([lat, lng]: [number, number]): Position => [lng, lat];

const pointFeature = (properties: Feature['properties'], coordinates: Position): Feature => ({
  type: 'Feature',
  properties,
  geometry: { type: 'Point', coordinates },
});

/**
 * The routes as one GeoJSON collection: each route its line (with its rim
 * colour, whether it is dashed, how faint, whether it is lit), its hard
 * grades, its two ends, and its named stops while it is lit. Pure, for the
 * tests.
 */
export function routeLineFeatures(lines: readonly AssistantRouteLine[]): FeatureCollection {
  const features: Feature[] = [];
  for (const line of lines) {
    const opacity = line.dim ? DIM_OPACITY : 1;
    features.push({
      type: 'Feature',
      properties: {
        kind: 'line',
        ref: line.ref,
        color: line.color,
        casing: line.casing,
        dashed: !!line.dashed,
        hot: !!line.hot,
        opacity,
      },
      geometry: { type: 'MultiLineString', coordinates: line.lines.map((part) => part.map(flip)) },
    });
    for (const tint of line.tints ?? []) {
      features.push({
        type: 'Feature',
        properties: { kind: 'tint', color: tint.color, opacity },
        geometry: { type: 'LineString', coordinates: tint.line.map(flip) },
      });
    }
    if (line.ends) {
      const start = { kind: 'end', fill: line.color, stroke: line.casing, strokeWidth: 2, opacity };
      features.push(pointFeature(start, flip(line.ends.start)));
      if (line.ends.end) {
        const end = { kind: 'end', fill: line.casing, stroke: line.color, strokeWidth: 3, opacity };
        features.push(pointFeature(end, flip(line.ends.end)));
      }
    }
    if (!line.hot) continue;
    for (const stop of line.stops ?? []) {
      const properties = { kind: 'stop', fill: line.color, stroke: line.casing, label: stop.label };
      features.push(pointFeature(properties, [stop.lng, stop.lat]));
    }
  }
  return { type: 'FeatureCollection', features };
}

const kindIs = (kind: string) => ['==', ['get', 'kind'], kind];

/** The layers, bottom first: rims, lines, dashed lines, grades, ends, stops, and the invisible line on top. */
function addRouteLineLayers(map: LineMap): void {
  map.addSource?.(SOURCE_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  const source = SOURCE_ID;
  const line = (id: string, filter: unknown[], paint: Record<string, unknown>) =>
    map.addLayer?.({ id, type: 'line', source, filter, paint, layout: ROUND });
  const solid = ['all', kindIs('line'), ['==', ['get', 'dashed'], false]];
  const dashed = ['all', kindIs('line'), ['==', ['get', 'dashed'], true]];
  const opacity = ['get', 'opacity'];
  line(ROUTE_LINE_LAYERS.casing, kindIs('line'), {
    'line-color': ['get', 'casing'],
    'line-width': 7,
    'line-opacity': ['*', opacity, 0.9],
  });
  line(ROUTE_LINE_LAYERS.line, solid, { 'line-color': ['get', 'color'], 'line-width': 4, 'line-opacity': opacity });
  // Dashes are counted in line widths: 6 px on, 7 px off at a width of 4, as the Leaflet map draws them.
  line(ROUTE_LINE_LAYERS.dashed, dashed, {
    'line-color': ['get', 'color'],
    'line-width': 4,
    'line-opacity': opacity,
    'line-dasharray': [1.5, 1.75],
  });
  line(ROUTE_LINE_LAYERS.tint, kindIs('tint'), {
    'line-color': ['get', 'color'],
    'line-width': 4,
    'line-opacity': opacity,
  });
  const disc = (id: string, filter: unknown[], radius: number) =>
    map.addLayer?.({
      id,
      type: 'circle',
      source,
      filter,
      paint: {
        'circle-radius': radius,
        'circle-color': ['get', 'fill'],
        'circle-stroke-color': ['get', 'stroke'],
        'circle-stroke-width': ['coalesce', ['get', 'strokeWidth'], 2],
        'circle-opacity': ['coalesce', opacity, 1],
        'circle-stroke-opacity': ['coalesce', opacity, 1],
      },
    });
  disc(ROUTE_LINE_LAYERS.ends, kindIs('end'), 5);
  disc(ROUTE_LINE_LAYERS.stops, kindIs('stop'), 4);
  line(ROUTE_LINE_LAYERS.hit, kindIs('line'), { 'line-color': ['get', 'casing'], 'line-width': 16, 'line-opacity': 0 });
}

interface AssistantGhostLinesOptions {
  mapRef: { readonly current: LineMap | null };
  mapReady: boolean;
  lines: readonly AssistantRouteLine[] | undefined;
  onHover?: (ref: string | null) => void;
  onPoint?: (ref: string, lat: number, lng: number) => void;
}

/** The ref of the route line under a pointer event, if any. */
function refOf(event: LayerEvent): string | null {
  const ref = event.features?.[0]?.properties?.ref;
  return typeof ref === 'string' ? ref : null;
}

/**
 * Whether the pointer is on something of the plan's that lies over the route
 * on screen: a place pin (a DOM marker) or a cluster bubble (drawn under the
 * route's layers, but the bubble is what a tap there means). The plan's own
 * tracks leave such a tap alone the same way.
 */
function onPlanPin(map: LineMap, event: LayerEvent): boolean {
  const target = event.originalEvent?.target;
  if (target instanceof Element && target.closest('.mapboxgl-marker, .maplibregl-marker')) return true;
  if (!event.point || !map.queryRenderedFeatures || !map.getLayer?.(PLACE_CLUSTER_CIRCLE_LAYER_ID)) return false;
  const layers = [PLACE_CLUSTER_CIRCLE_LAYER_ID, PLACE_CLUSTER_COUNT_LAYER_ID];
  return map.queryRenderedFeatures(event.point, { layers }).length > 0;
}

/**
 * The routes the chat shows on the GL map, the twin of the Leaflet
 * AssistantGhostLineLayer: one GeoJSON source and its layers, added the
 * first time there is a route to draw and again whenever the basemap
 * rebuilds the style, the data set anew when the routes change. The
 * invisible line reports the pointer onto, along and off a route; a stop
 * under the pointer shows its name in the map's hover label.
 */
export function useAssistantGhostLinesGL({ mapRef, mapReady, lines, onHover, onPoint }: AssistantGhostLinesOptions) {
  const handlers = useRef({ onHover, onPoint });
  useLayoutEffect(() => {
    handlers.current = { onHover, onPoint };
  }, [onHover, onPoint]);
  const data = useRef<FeatureCollection>(routeLineFeatures([]));
  const added = useRef(false);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || typeof map.getSource !== 'function') return;
    data.current = routeLineFeatures(lines ?? []);
    // Nothing is added to a map that never had a route to draw.
    if (!added.current && data.current.features.length === 0) return;
    added.current = true;
    if (!map.getSource(SOURCE_ID)) {
      // A basemap still loading takes no layers; its styledata puts the routes on once it is ready.
      if (map.isStyleLoaded?.() === false) return;
      addRouteLineLayers(map);
    }
    map.getSource(SOURCE_ID)?.setData?.(data.current);
  }, [lines, mapReady, mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || typeof map.on !== 'function' || typeof map.off !== 'function') return;
    const label = mapHoverLabel(map, 'assistant-route-label');
    // A new basemap takes every layer with it: put the routes back, as the plan's own tracks are.
    const restore = () => {
      if (!added.current || !map.getSource || map.getSource(SOURCE_ID)) return;
      addRouteLineLayers(map);
      map.getSource(SOURCE_ID)?.setData?.(data.current);
    };
    const move = (event: LayerEvent) => {
      const ref = refOf(event);
      if (ref === null) return;
      // On a pin over the line the pin is what the pointer is on: the line goes out as if left.
      if (onPlanPin(map, event)) {
        handlers.current.onHover?.(null);
        return;
      }
      handlers.current.onHover?.(ref);
      handlers.current.onPoint?.(ref, event.lngLat.lat, event.lngLat.lng);
    };
    const leave = () => handlers.current.onHover?.(null);
    const click = (event: LayerEvent) => {
      const ref = refOf(event);
      if (ref !== null && !onPlanPin(map, event)) handlers.current.onPoint?.(ref, event.lngLat.lat, event.lngLat.lng);
    };
    const stop = (event: LayerEvent) => {
      const name = event.features?.[0]?.properties?.label;
      if (typeof name === 'string' && event.point) label.show({ name, detail: null }, event.point);
    };
    const hideLabel = () => label.hide();
    map.on('styledata', restore);
    map.on('mousemove', ROUTE_LINE_LAYERS.hit, move);
    map.on('mouseleave', ROUTE_LINE_LAYERS.hit, leave);
    map.on('click', ROUTE_LINE_LAYERS.hit, click);
    map.on('mousemove', ROUTE_LINE_LAYERS.stops, stop);
    map.on('mouseleave', ROUTE_LINE_LAYERS.stops, hideLabel);
    return () => {
      map.off?.('styledata', restore);
      map.off?.('mousemove', ROUTE_LINE_LAYERS.hit, move);
      map.off?.('mouseleave', ROUTE_LINE_LAYERS.hit, leave);
      map.off?.('click', ROUTE_LINE_LAYERS.hit, click);
      map.off?.('mousemove', ROUTE_LINE_LAYERS.stops, stop);
      map.off?.('mouseleave', ROUTE_LINE_LAYERS.stops, hideLabel);
      label.remove();
    };
  }, [mapReady, mapRef]);
}
