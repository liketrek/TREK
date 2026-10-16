import type { FerrataBbox } from '@trek/shared';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { DistanceIndexedProfileSample, RouteProfileFocus } from '../../../utils/routeGeometry';
import type { FerrataMapLayer } from '../../Ferratas/useFerrataMapLayer';
import type { TourBaseLayer, TourLayerOffer } from '../../Map/MapLayerSwitcher';
import { useRasterOverlaysGL, type RasterOverlayGlMap } from '../../Map/mapRasterOverlay';
import { trackData, type PanelWidths, type TrackColorMode } from './terrainLayers';
import { useTerrainFerratas } from './useTerrainFerratas';
import { frameCamera, useTerrainMap, type TerrainScene } from './useTerrainMap';
import { useTerrainPins, type TerrainWaypoints } from './useTerrainPins';
import { useTerrainPrefetch } from './useTerrainPrefetch';
import { useTerrainReplay } from './useTerrainReplay';

interface Options {
  /** The open tour's distance-indexed profile; empty when no tour is open. */
  samples: DistanceIndexedProfileSample[];
  /** Every route the planner map draws, shown when no tour is open. */
  routes: [number, number][][] | null;
  trackColor: string;
  baseLayer: TourBaseLayer;
  focus: RouteProfileFocus | null;
  onFocusChange: (focus: RouteProfileFocus | null) => void;
  panels: PanelWidths;
  waypoints: TerrainWaypoints;
  /** What the flat map frames, [lat, lng]; the 3D view starts there while there is no route. */
  framePoints: [number, number][];
  /** The via ferrata layer of the planner map, drawn here too while it is on. */
  ferrataLayer?: FerrataMapLayer;
  tourLayers?: TourLayerOffer;
  /** The visible area, for the via ferrata layer to ask for. */
  onViewportChange?: (bbox: FerrataBbox) => void;
}

/** The planner map's 3D mode: map, pins, corridor preload and the flyover sharing the rail's focus. */
export function useTourTerrain(options: Options) {
  const { samples, routes, trackColor, baseLayer, focus, onFocusChange, panels, waypoints, framePoints } = options;
  const [exaggeration, setExaggeration] = useState(1.5);
  const [colorMode, setColorMode] = useState<TrackColorMode>('grade');
  const data = useMemo(
    () => trackData(samples, routes, colorMode, trackColor),
    [samples, routes, colorMode, trackColor]
  );

  // The map's own handlers fire long after they were bound, so they read the latest props here.
  const current: TerrainScene = {
    data,
    exaggeration,
    panels,
    baseLayer,
    trackColor,
    pins: waypoints.points,
    framePoints,
    onAdd: waypoints.onAdd,
  };
  const scene = useRef(current);
  const handlers = useRef(waypoints);
  useLayoutEffect(() => {
    scene.current = current;
    handlers.current = waypoints;
  });

  const { setContainer, gl, ready, styleGeneration } = useTerrainMap({ scene, baseLayer, data, exaggeration });
  const preloaded = useTerrainPrefetch(gl?.map ?? null, styleGeneration, samples);
  useTerrainPins(gl, ready, waypoints, handlers);
  useTerrainFerratas(gl, options.ferrataLayer, options.onViewportChange);
  // MapLibre answers every call the shared overlay hook makes, as it does the ferrata hook's.
  useRasterOverlaysGL(gl ? (gl.map as unknown as RasterOverlayGlMap) : null, options.tourLayers?.overlays);
  const replay = useTerrainReplay({ gl, ready, samples, focus, onFocusChange, scene, preloaded });
  const { stop } = replay;

  const overview = useCallback(() => {
    if (!gl || !frameCamera(gl.map, scene.current, 1200)) return;
    stop();
  }, [gl, stop]);

  // A different tour, or the same one recoloured, framed anew; pins added later never
  // refocus the camera under the user's cursor.
  useEffect(() => {
    if (ready) overview();
  }, [ready, data, framePoints, overview]);

  return { setContainer, preloaded, overview, exaggeration, setExaggeration, colorMode, setColorMode, ...replay };
}
