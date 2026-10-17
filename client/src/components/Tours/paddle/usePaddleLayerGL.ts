import type { ExpressionSpecification, Map, MapMouseEvent } from 'mapbox-gl';
import { useEffect, useRef } from 'react';
import {
  isAreaOnly,
  isPaddleItemSelected,
  markerSize,
  PADDLE_AREA_MIN_ZOOM,
  paddleMarkerImageId,
  paddleMarkerSvg,
  type PaddleMapItem,
  type PaddleMapLayer,
} from './paddleMapLayer';

/** One map type for both engines, as the ferrata layer has: MapLibre answers every call made here. */
export type PaddleGlMap = Map;

const SOURCE = 'trek-paddle';
const CASING = 'trek-paddle-casing';
const CASING_AREA = 'trek-paddle-casing-area';
const LINE = 'trek-paddle-line';
const LINE_NEAR = 'trek-paddle-line-near';
const LINE_AREA = 'trek-paddle-line-area';
const PINS = 'trek-paddle-pins';
const PINS_AREA = 'trek-paddle-pins-area';
/** Bottom to top, as they are added. */
const LAYERS = [CASING_AREA, CASING, LINE_AREA, LINE, LINE_NEAR, PINS_AREA, PINS];
/** The layers a click can land on, the markers first. */
const HIT_LAYERS = [PINS, PINS_AREA, LINE, LINE_NEAR, LINE_AREA];

const WIDTH = { on_route: 4, near: 3, area: 2 } as const;
const OPACITY = { on_route: 1, near: 0.85, area: 0.5 } as const;

function collection(
  items: readonly PaddleMapItem[],
  selectedRef: string | null,
  selectedKey: string | null
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (const item of items) {
    const selected = isPaddleItemSelected(item, selectedRef, selectedKey);
    const area = isAreaOnly(item, selectedRef);
    if (item.line) {
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: item.line.map(([lat, lng]) => [lng, lat]) },
        properties: {
          ref: item.feature.ref,
          color: item.color,
          width: WIDTH[item.relation],
          opacity: OPACITY[item.relation],
          near: item.relation === 'near' && !selected,
          casing: item.disc,
          area,
        },
      });
    }
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [item.marker[1], item.marker[0]] },
      properties: {
        ref: item.feature.ref,
        icon: paddleMarkerImageId(item, selected),
        order: selected ? 3 : item.relation === 'on_route' ? 2 : item.relation === 'near' ? 1 : 0,
        area,
      },
    });
  }
  return { type: 'FeatureCollection', features };
}

/**
 * Draws each marker look the map does not have yet, the picked look beside the
 * plain one, so picking an object never shows a marker whose image is still
 * loading.
 */
function addImages(map: PaddleGlMap, items: readonly PaddleMapItem[], gone: () => boolean) {
  for (const item of items) {
    for (const selected of [false, true]) {
      const id = paddleMarkerImageId(item, selected);
      if (map.hasImage(id)) continue;
      const size = markerSize(item.relation, selected) * 2;
      const image = new Image(size, size);
      image.onload = () => {
        if (!gone() && !map.hasImage(id)) map.addImage(id, image, { pixelRatio: 2 });
      };
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(paddleMarkerSvg(item, selected))}`;
    }
  }
}

const isLine: ExpressionSpecification = ['==', ['geometry-type'], 'LineString'];
const isPoint: ExpressionSpecification = ['==', ['geometry-type'], 'Point'];
const inArea: ExpressionSpecification = ['==', ['get', 'area'], true];
const notArea: ExpressionSpecification = ['!=', ['get', 'area'], true];
const isNear: ExpressionSpecification = ['==', ['get', 'near'], true];
const notNear: ExpressionSpecification = ['!=', ['get', 'near'], true];

function addLayers(map: PaddleGlMap, data: GeoJSON.FeatureCollection): void {
  map.addSource(SOURCE, { type: 'geojson', data });
  const lineLayout = { 'line-cap': 'round', 'line-join': 'round' } as const;
  const casingPaint = {
    'line-color': ['get', 'casing'] as ExpressionSpecification,
    'line-width': ['+', ['get', 'width'], 3] as ExpressionSpecification,
    'line-opacity': ['get', 'opacity'] as ExpressionSpecification,
  };
  const linePaint = {
    'line-color': ['get', 'color'] as ExpressionSpecification,
    'line-width': ['get', 'width'] as ExpressionSpecification,
    'line-opacity': ['get', 'opacity'] as ExpressionSpecification,
  };
  const pinLayout = {
    'icon-image': ['get', 'icon'] as ExpressionSpecification,
    'icon-allow-overlap': true,
    'icon-ignore-placement': true,
    'symbol-sort-key': ['get', 'order'] as ExpressionSpecification,
  };
  // The objects only in the area wait for PADDLE_AREA_MIN_ZOOM; a hidden layer is also no click target.
  const area = { minzoom: PADDLE_AREA_MIN_ZOOM };
  const add = map.addLayer.bind(map);
  add({
    id: CASING_AREA,
    type: 'line',
    source: SOURCE,
    filter: ['all', isLine, inArea],
    layout: lineLayout,
    paint: casingPaint,
    ...area,
  });
  add({
    id: CASING,
    type: 'line',
    source: SOURCE,
    filter: ['all', isLine, notArea],
    layout: lineLayout,
    paint: casingPaint,
  });
  add({
    id: LINE_AREA,
    type: 'line',
    source: SOURCE,
    filter: ['all', isLine, inArea],
    layout: lineLayout,
    paint: linePaint,
    ...area,
  });
  add({
    id: LINE,
    type: 'line',
    source: SOURCE,
    filter: ['all', isLine, notArea, notNear],
    layout: lineLayout,
    paint: linePaint,
  });
  // A dash cannot follow a property, so the lines only near the route have a layer of their own, as on Leaflet.
  add({
    id: LINE_NEAR,
    type: 'line',
    source: SOURCE,
    filter: ['all', isLine, notArea, isNear],
    layout: lineLayout,
    paint: { ...linePaint, 'line-dasharray': [2, 1.6] },
  });
  add({ id: PINS_AREA, type: 'symbol', source: SOURCE, filter: ['all', isPoint, inArea], layout: pinLayout, ...area });
  add({ id: PINS, type: 'symbol', source: SOURCE, filter: ['all', isPoint, notArea], layout: pinLayout });
}

/** The paddle layers this map has now; a style still loading or one rebuilt by a basemap change may have none. */
function presentHitLayers(map: { getLayer?(id: string): unknown }): string[] {
  return HIT_LAYERS.filter((id) => map.getLayer?.(id));
}

/**
 * Whether a click at `point` landed on a paddle object. The map's own click
 * handler asks this first, so picking an obstacle opens its card instead of
 * also setting a waypoint under it.
 */
export function isPaddleHit<Point>(
  map: {
    getLayer?(id: string): unknown;
    queryRenderedFeatures?(point: Point, options: { layers: string[] }): unknown[];
  },
  point: Point
): boolean {
  if (typeof map.getLayer !== 'function' || typeof map.queryRenderedFeatures !== 'function') return false;
  const layers = presentHitLayers(map);
  return layers.length > 0 && map.queryRenderedFeatures(point, { layers }).length > 0;
}

/**
 * PAD-05B on a GL map (MapLibre or Mapbox, the 2D planner and the 3D
 * terrain alike): the paddle objects as lines on a white casing and as round
 * glyph markers, in the same look as on Leaflet, the ones only in the area
 * from PADDLE_AREA_MIN_ZOOM on. Kept through a basemap change, which rebuilds
 * the style and drops them, and removed with the layer.
 */
export function usePaddleLayerGL(map: PaddleGlMap | null, layer: PaddleMapLayer | undefined) {
  const onSelect = useRef(layer?.onSelect);
  useEffect(() => {
    onSelect.current = layer?.onSelect;
  }, [layer?.onSelect]);
  const items = layer?.items;
  const selectedRef = layer?.selectedRef ?? null;
  const selectedKey = layer?.selectedKey ?? null;

  useEffect(() => {
    if (!map || !items?.length) return;
    let gone = false;
    const data = collection(items, selectedRef, selectedKey);
    let applied: GeoJSON.FeatureCollection | null = null;
    const apply = () => {
      try {
        const source = map.getSource(SOURCE) as { setData?: (next: GeoJSON.FeatureCollection) => void } | undefined;
        // Every image the map takes fires styledata again; data already handed over is not sent twice.
        if (source?.setData && applied === data) return;
        addImages(map, items, () => gone);
        if (source?.setData) source.setData(data);
        else addLayers(map, data);
        applied = data;
      } catch {
        // A style still loading takes the layers on its next styledata event.
      }
    };
    apply();
    map.on('styledata', apply);
    return () => {
      gone = true;
      map.off('styledata', apply);
    };
  }, [items, map, selectedRef, selectedKey]);

  useEffect(() => {
    if (!map) return;
    // One handler for all of them, so a marker over a line picks the marker's object, never both.
    const click = (event: MapMouseEvent) => {
      const layers = presentHitLayers(map);
      if (layers.length === 0) return;
      const [hit] = map.queryRenderedFeatures(event.point, { layers });
      const ref: unknown = hit?.properties?.ref;
      if (typeof ref === 'string') onSelect.current?.(ref);
    };
    const enter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const leave = () => {
      map.getCanvas().style.cursor = '';
    };
    map.on('click', click);
    for (const id of HIT_LAYERS) {
      map.on('mouseenter', id, enter);
      map.on('mouseleave', id, leave);
    }
    return () => {
      map.off('click', click);
      for (const id of HIT_LAYERS) {
        map.off('mouseenter', id, enter);
        map.off('mouseleave', id, leave);
      }
    };
  }, [map]);

  // Without objects to show, the layers go; the next objects bring them back.
  useEffect(() => {
    if (!map || items?.length) return;
    try {
      for (const id of [...LAYERS].reverse()) if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(SOURCE)) map.removeSource(SOURCE);
    } catch {
      // A map torn down meanwhile has nothing left to remove.
    }
  }, [items, map]);
}
