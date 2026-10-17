import type { ExpressionSpecification, GeoJSONSource, Map, MapMouseEvent } from 'mapbox-gl';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { Ferrata } from '@trek/shared';

import { useTranslation } from '../../i18n';
import { mapHoverLabel } from '../Map/mapHoverLabel';
import { type FerrataGroup, ferrataLabel } from './ferrataGroups';
import { FERRATA_ICON_IMAGE, FERRATA_ICON_MIN_ZOOM, FERRATA_ICON_PIXEL_RATIO, loadFerrataIcon } from './ferrataIcon';
import { ferrataFeatureCollection, ferrataLabelCollection } from './ferrataModel';
import type { FerrataPaint } from './ferrataPaint';
import { useFerrataPaint } from './useFerrataPaint';

const SOURCE = 'trek-ferratas';
const LABEL_SOURCE = `${SOURCE}-labels`;
const CASING = `${SOURCE}-casing`;
const LINE = `${SOURCE}-line`;
/** The wider casing under a lit ferrata, so it stands out by its shape and not only its colour. */
const HIGHLIGHT_CASING = `${SOURCE}-highlight-casing`;
/** The whole ferrata under the pointer or open in the card, drawn solid over its own line. */
const HIGHLIGHT = `${SOURCE}-highlight`;
/** A wide, invisible line on top, so a thin dashed route is still easy to tap. */
const HIT = `${SOURCE}-hit`;
const LABEL = `${SOURCE}-label`;
const LAYERS = [CASING, LINE, HIGHLIGHT_CASING, HIGHLIGHT, HIT, LABEL];
const LIT_LAYERS = [HIGHLIGHT_CASING, HIGHLIGHT];

/**
 * The line widths, in pixels. On the 3D terrain the map is seen at a slant
 * and over a hillshade, so the lines there are drawn wider to stay readable.
 */
interface FerrataWidths {
  casing: number;
  line: number;
  litCasing: number;
  lit: number;
}

const FLAT_WIDTHS: FerrataWidths = { casing: 6, line: 2.5, litCasing: 9, lit: 4 };
const TERRAIN_WIDTHS: FerrataWidths = { casing: 8, line: 3.5, litCasing: 11, lit: 5 };

/** Where the layer is drawn: the flat map, or the 3D terrain, which draws its lines wider. */
type FerrataSurface = 'flat' | 'terrain';

/** Where on the map a ferrata was clicked, for a popup or card anchored there. */
interface FerrataClickPoint {
  lng: number;
  lat: number;
}

/** A click on a line: the ferrata it belongs to, the OSM way under the pointer and where it landed. */
export type FerrataSelectHandler = (group: FerrataGroup, segment: Ferrata, at: FerrataClickPoint) => void;

/** The groups to highlight, as a GL filter on the features' `group`. */
function highlightFilter(ids: readonly string[]): ExpressionSpecification {
  return ['in', ['get', 'group'], ['literal', [...ids]]];
}

const LINE_LAYOUT = { 'line-cap': 'round', 'line-join': 'round' } as const;

/**
 * The two sources and the five line layers, bottom to top: casing, dashed
 * line, the lit ferrata's wider casing and its solid line, hit line.
 */
function addFerrataLayers(
  map: Map,
  paint: FerrataPaint,
  widths: FerrataWidths,
  data: GeoJSON.GeoJSON,
  labels: GeoJSON.GeoJSON
): void {
  map.addSource(SOURCE, { type: 'geojson', data });
  map.addSource(LABEL_SOURCE, { type: 'geojson', data: labels });
  map.addLayer({
    id: CASING,
    type: 'line',
    source: SOURCE,
    layout: LINE_LAYOUT,
    paint: { 'line-color': paint.casing, 'line-width': widths.casing, 'line-opacity': 0.9 },
  });
  map.addLayer({
    id: LINE,
    type: 'line',
    source: SOURCE,
    layout: LINE_LAYOUT,
    paint: { 'line-color': paint.line, 'line-width': widths.line, 'line-dasharray': [2, 1.5] },
  });
  map.addLayer({
    id: HIGHLIGHT_CASING,
    type: 'line',
    source: SOURCE,
    layout: LINE_LAYOUT,
    filter: highlightFilter([]),
    paint: { 'line-color': paint.casing, 'line-width': widths.litCasing },
  });
  map.addLayer({
    id: HIGHLIGHT,
    type: 'line',
    source: SOURCE,
    layout: LINE_LAYOUT,
    filter: highlightFilter([]),
    paint: { 'line-color': paint.highlight, 'line-width': widths.lit },
  });
  map.addLayer({
    id: HIT,
    type: 'line',
    source: SOURCE,
    layout: LINE_LAYOUT,
    paint: { 'line-color': paint.casing, 'line-width': 16, 'line-opacity': 0 },
  });
}

/**
 * Draws the route icon in `paint` and, the first time, the symbol layer that
 * shows it from FERRATA_ICON_MIN_ZOOM. Done once the image is decoded; a
 * layer torn down meanwhile (`gone`) is left alone.
 */
function addFerrataIcon(map: Map, paint: FerrataPaint, gone: () => boolean): void {
  void loadFerrataIcon(paint).then(
    (image) => {
      if (gone() || !map.getSource(LABEL_SOURCE)) return;
      if (map.hasImage(FERRATA_ICON_IMAGE)) map.removeImage(FERRATA_ICON_IMAGE);
      map.addImage(FERRATA_ICON_IMAGE, image, { pixelRatio: FERRATA_ICON_PIXEL_RATIO });
      if (map.getLayer(LABEL)) return;
      map.addLayer({
        id: LABEL,
        type: 'symbol',
        source: LABEL_SOURCE,
        minzoom: FERRATA_ICON_MIN_ZOOM,
        layout: { 'icon-image': FERRATA_ICON_IMAGE, 'icon-allow-overlap': false, 'icon-ignore-placement': false },
      });
    },
    // Undecodable: the lines simply go without their icons.
    () => undefined
  );
}

function removeFerrataLayers(map: Map): void {
  // A map already removed with its view (leaving 3D) took its style and the layers with it;
  // asking it for a layer then throws.
  if (!map.getStyle?.()) return;
  for (const layer of [...LAYERS].reverse()) if (map.getLayer(layer)) map.removeLayer(layer);
  for (const source of [LABEL_SOURCE, SOURCE]) if (map.getSource(source)) map.removeSource(source);
  if (map.hasImage(FERRATA_ICON_IMAGE)) map.removeImage(FERRATA_ICON_IMAGE);
}

/**
 * The via ferrata layer on a MapLibre or Mapbox GL map: a source of the OSM
 * ways and one of a point per ferrata, a light casing, the dark dashed line,
 * the highlight of the ferrata under the pointer or `selectedId` (solid and
 * wider, on a wider casing), a hit line that turns a click into
 * `onSelect(group, way, point)` and shows the name and grade above the
 * pointer, and from FERRATA_ICON_MIN_ZOOM a small route icon halfway along
 * each ferrata. `surface` 'terrain' draws the lines wider for the 3D map.
 *
 * The layers are installed once per map and again after a style swap (a
 * basemap or theme change drops every custom layer); new ferratas only replace
 * the sources' data, so tiles loading after a pan do not rebuild the layers.
 * Like the hazard overlay, a draw that finds the style busy loading tiles
 * waits for `idle` rather than for a `style.load` that may never come. A theme
 * change repaints the installed layers in place and redraws the icon.
 */
export function useFerrataLayerGL(
  map: Map | null,
  groups: readonly FerrataGroup[],
  onSelect: FerrataSelectHandler,
  selectedId: string | null = null,
  surface: FerrataSurface = 'flat'
) {
  const { t } = useTranslation();
  const data = useMemo(() => ferrataFeatureCollection(groups), [groups]);
  const labels = useMemo(() => ferrataLabelCollection(groups), [groups]);
  const paint = useFerrataPaint();
  const [hovered, setHovered] = useState<string | null>(null);
  // The handlers read the newest props without reinstalling the layers on every render.
  const latest = useRef({ groups, data, labels, onSelect, paint, t, surface });
  // The paint the installed layers were last drawn in, so a mount does not repaint what it just drew.
  const painted = useRef<FerrataPaint | null>(null);
  // Set by the install effect: redraws the icon in the current paint on a theme change.
  const iconRepaint = useRef<(() => void) | null>(null);
  useEffect(() => {
    latest.current = { groups, data, labels, onSelect, paint, t, surface };
  });

  useEffect(() => {
    if (!map) return;
    let waiting = false;
    let disposed = false;
    const hoverLabel = mapHoverLabel(map, 'ferrata-hover-label');
    const draw = () => {
      if (map.getSource(SOURCE)) return;
      if (!map.isStyleLoaded()) {
        if (!waiting) {
          waiting = true;
          map.once('idle', retry);
        }
        return;
      }
      const { paint, data, labels } = latest.current;
      painted.current = paint;
      const widths = latest.current.surface === 'terrain' ? TERRAIN_WIDTHS : FLAT_WIDTHS;
      addFerrataLayers(map, paint, widths, data, labels);
      addFerrataIcon(map, paint, () => disposed);
    };
    const retry = () => {
      waiting = false;
      draw();
    };
    const featureAt = (event: MapMouseEvent) => {
      if (!map.getLayer(HIT)) return null;
      const hit = map.queryRenderedFeatures(event.point, { layers: [HIT] })[0];
      return hit?.properties ?? null;
    };
    const click = (event: MapMouseEvent) => {
      const id: unknown = featureAt(event)?.id;
      for (const group of latest.current.groups) {
        const segment = group.segments.find((candidate) => candidate.id === id);
        if (segment) {
          latest.current.onSelect(group, segment, { lng: event.lngLat.lng, lat: event.lngLat.lat });
          return;
        }
      }
    };
    const move = (event: MapMouseEvent) => {
      const id: unknown = featureAt(event)?.group;
      const group = typeof id === 'string' ? latest.current.groups.find((candidate) => candidate.id === id) : undefined;
      setHovered(group ? group.id : null);
      if (group) {
        const label = ferrataLabel(group, latest.current.t);
        hoverLabel.show({ name: label.name, detail: label.grade }, event.point);
      } else hoverLabel.hide();
    };
    const enter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const leave = () => {
      map.getCanvas().style.cursor = '';
      setHovered(null);
      hoverLabel.hide();
    };
    const repaintIcon = () => addFerrataIcon(map, latest.current.paint, () => disposed);

    draw();
    map.on('style.load', draw);
    map.on('click', click);
    map.on('mousemove', HIT, move);
    map.on('mouseenter', HIT, enter);
    map.on('mouseleave', HIT, leave);
    iconRepaint.current = repaintIcon;
    return () => {
      disposed = true;
      iconRepaint.current = null;
      map.off('style.load', draw);
      map.off('idle', retry);
      map.off('click', click);
      map.off('mousemove', HIT, move);
      map.off('mouseenter', HIT, enter);
      map.off('mouseleave', HIT, leave);
      hoverLabel.remove();
      removeFerrataLayers(map);
    };
  }, [map]);

  useEffect(() => {
    (map?.getSource(SOURCE) as GeoJSONSource | undefined)?.setData(data);
    (map?.getSource(LABEL_SOURCE) as GeoJSONSource | undefined)?.setData(labels);
  }, [map, data, labels]);

  const highlighted = useMemo(
    () => [...new Set([hovered, selectedId].filter((id): id is string => !!id))],
    [hovered, selectedId]
  );
  useEffect(() => {
    for (const layer of LIT_LAYERS) if (map?.getLayer(layer)) map.setFilter(layer, highlightFilter(highlighted));
  }, [map, highlighted]);

  useEffect(() => {
    if (!map || painted.current === paint || !map.getLayer(LINE)) return;
    painted.current = paint;
    for (const layer of [CASING, HIGHLIGHT_CASING])
      if (map.getLayer(layer)) map.setPaintProperty(layer, 'line-color', paint.casing);
    map.setPaintProperty(LINE, 'line-color', paint.line);
    if (map.getLayer(HIGHLIGHT)) map.setPaintProperty(HIGHLIGHT, 'line-color', paint.highlight);
    iconRepaint.current?.();
  }, [map, paint]);
}

/** The GL map the layer draws on. MapLibre's map answers the same calls the layer makes. */
export type FerrataGlMap = Map;

/**
 * Just the two calls a hit test needs, so the Mapbox and the MapLibre map both
 * fit, each with the point type of its own click events. Optional because a stand-in map (a test double, a map torn down mid
 * click) may lack them, and a hit test must then answer no rather than throw.
 */
interface HitTestMap<Point> {
  getLayer?(id: string): unknown;
  queryRenderedFeatures?(point: Point, options: { layers: string[] }): unknown[];
}

/**
 * Whether a click at `point` landed on a drawn ferrata. A map's own click
 * handler asks this first, so picking a ferrata opens its card instead of also
 * dropping a control point or a place under it.
 */
export function isFerrataHit<Point>(map: HitTestMap<Point>, point: Point): boolean {
  if (typeof map.getLayer !== 'function' || typeof map.queryRenderedFeatures !== 'function') return false;
  return !!map.getLayer(HIT) && map.queryRenderedFeatures(point, { layers: [HIT] }).length > 0;
}

const NO_GROUPS: readonly FerrataGroup[] = [];
const IGNORE_SELECT: FerrataSelectHandler = () => {};

/**
 * The layer as a map view mounts it from a `FerrataMapLayer`: drawn only while
 * it is switched on, so a map with the layer off carries no source or layers.
 */
export function useFerrataMapLayerGL(
  map: Map | null,
  layer:
    | { active: boolean; groups: readonly FerrataGroup[]; onSelect: FerrataSelectHandler; selectedId: string | null }
    | undefined,
  surface: FerrataSurface = 'flat'
) {
  useFerrataLayerGL(
    layer?.active ? map : null,
    layer?.groups ?? NO_GROUPS,
    layer?.onSelect ?? IGNORE_SELECT,
    layer?.selectedId ?? null,
    surface
  );
}
