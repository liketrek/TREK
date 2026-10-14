import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { TourBaseLayer } from '../../Map/MapLayerSwitcher';
import {
  addTerrainLayers,
  DEM_SOURCE,
  frameBounds,
  PITCH,
  sidePadding,
  styleFor,
  TRACK_SOURCE,
  type PanelWidths,
  type TrackData,
} from './terrainLayers';

type MapLibreEngine = typeof import('../../Map/engines/maplibre').default;

/** The GL map and the engine it came from, there once the engine has loaded. */
export interface TerrainGl {
  map: MapLibreMap;
  engine: MapLibreEngine;
}

/** What the map's own event handlers read at the moment they fire, not when they were bound. */
export interface TerrainScene {
  data: TrackData;
  exaggeration: number;
  panels: PanelWidths;
  baseLayer: TourBaseLayer;
  trackColor: string;
  pins: ReadonlyArray<{ lat: number; lng: number }>;
  framePoints: [number, number][];
  onAdd?: (lat: number, lng: number) => void;
}

/** Frames the route (or the pins, or what the flat map framed) between the side panels. */
export function frameCamera(map: MapLibreMap, scene: TerrainScene, duration: number): boolean {
  const target = frameBounds(scene.data, scene.pins, scene.framePoints);
  if (!target) return false;
  map.fitBounds(target, {
    padding: { top: 70, bottom: 150, ...sidePadding(scene.panels, 40) },
    pitch: PITCH,
    bearing: -20,
    duration,
  });
  return true;
}

interface MapHandlers {
  onReady: () => void;
  onStyleIdle: () => void;
}

function createTerrainMap(
  engine: MapLibreEngine,
  container: HTMLDivElement,
  scene: RefObject<TerrainScene>,
  handlers: MapHandlers
): MapLibreMap {
  const map = new engine.Map({
    container,
    style: styleFor(scene.current.baseLayer),
    pitch: PITCH,
    maxPitch: 75,
    fadeDuration: 0,
    renderWorldCopies: false,
    maxTileCacheSize: 2000,
    attributionControl: { compact: true },
  });
  // Clicking the terrain adds a control point, the same as on the flat planner map.
  map.on('click', (event) => scene.current.onAdd?.(event.lngLat.lat, event.lngLat.lng));
  map.on('style.load', () => {
    addTerrainLayers(map, scene.current.data, scene.current.exaggeration);
    handlers.onReady();
    // Vector sources know their tile URLs only once their TileJSON is in.
    void map.once('idle', handlers.onStyleIdle);
  });
  void map.once('load', () => frameCamera(map, scene.current, 0));
  return map;
}

interface Options {
  scene: RefObject<TerrainScene>;
  baseLayer: TourBaseLayer;
  data: TrackData;
  exaggeration: number;
}

/**
 * One GL map for as long as 3D mode is on, its engine loaded on demand. The base layer
 * swaps the style in place, and the track and relief follow without a rebuild.
 */
export function useTerrainMap({ scene, baseLayer, data, exaggeration }: Options) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [gl, setGl] = useState<TerrainGl | null>(null);
  const [ready, setReady] = useState(false);
  /** Counts the styles that finished loading their sources, so the prefetch knows the tile URLs. */
  const [styleGeneration, setStyleGeneration] = useState(0);
  const markReady = useCallback(() => setReady(true), []);
  const countStyle = useCallback(() => setStyleGeneration((n) => n + 1), []);

  useEffect(() => {
    if (!container) return;
    let cancelled = false;
    let map: MapLibreMap | null = null;
    void import('../../Map/engines/maplibre').then(({ default: engine }) => {
      if (cancelled) return;
      map = createTerrainMap(engine, container, scene, { onReady: markReady, onStyleIdle: countStyle });
      setGl({ map, engine });
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [container, scene, markReady, countStyle]);

  const appliedLayer = useRef(baseLayer);
  useEffect(() => {
    if (!gl || !ready || appliedLayer.current === baseLayer) return;
    appliedLayer.current = baseLayer;
    setReady(false);
    gl.map.setStyle(styleFor(baseLayer));
  }, [gl, ready, baseLayer]);

  useEffect(() => {
    if (gl && ready) gl.map.getSource<GeoJSONSource>(TRACK_SOURCE)?.setData(data);
  }, [gl, ready, data]);

  useEffect(() => {
    if (gl && ready) gl.map.setTerrain({ source: DEM_SOURCE, exaggeration });
  }, [gl, ready, exaggeration]);

  return { setContainer, gl, ready, styleGeneration };
}
