import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import {
  focusRouteProfileAtDistance,
  type DistanceIndexedProfileSample,
  type RouteProfileFocus,
} from '../../../utils/routeGeometry';
import { riderElement, sidePadding } from './terrainLayers';
import { bearingDegrees, easeBearing, replayMetresPerSecond } from './tourTerrainModel';
import type { TerrainGl, TerrainScene } from './useTerrainMap';

const REPLAY_LOOKAHEAD_METERS = 180;
// The flyover camera: high and flat enough that the horizon's tiles are already there.
const REPLAY_PITCH = 52;
const REPLAY_ZOOM = 13.4;
/** The rail's profile cursor follows the flyover at this rate, not every frame. */
const FOCUS_INTERVAL_MS = 100;

interface Options {
  gl: TerrainGl | null;
  ready: boolean;
  samples: DistanceIndexedProfileSample[];
  focus: RouteProfileFocus | null;
  onFocusChange: (focus: RouteProfileFocus | null) => void;
  scene: RefObject<TerrainScene>;
  /** Share of the corridor in the cache; the flyover starts only at 1. */
  preloaded: number;
}

/** Moves the chase camera to `distance` along the route and returns where that is, if anywhere. */
function chase(
  map: MapLibreMap,
  samples: DistanceIndexedProfileSample[],
  distance: number,
  bearing: RefObject<number>,
  scene: TerrainScene
): RouteProfileFocus | null {
  const here = focusRouteProfileAtDistance(samples, distance);
  if (!here) return null;
  const ahead = focusRouteProfileAtDistance(samples, distance + REPLAY_LOOKAHEAD_METERS);
  if (ahead) bearing.current = easeBearing(bearing.current, bearingDegrees(here, ahead), 0.03);
  // Centred on the ground the rider stands on, not on sea level beneath it.
  map.jumpTo({
    center: [here.lng, here.lat],
    elevation: (here.elevationMeters ?? 0) * scene.exaggeration,
    bearing: bearing.current,
    pitch: REPLAY_PITCH,
    zoom: REPLAY_ZOOM,
    padding: { top: 0, bottom: 0, ...sidePadding(scene.panels, 0) },
  });
  return here;
}

/** The rider and the replay clock: route metres per second, the camera chasing a point ahead. */
export function useTerrainReplay({ gl, ready, samples, focus, onFocusChange, scene, preloaded }: Options) {
  const riderRef = useRef<MapLibreMarker | null>(null);
  const frameRef = useRef<number | null>(null);
  const distanceRef = useRef(0);
  const bearingRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);
  const totalMeters = samples.length ? samples[samples.length - 1].distanceMeters : 0;

  useEffect(() => {
    if (!gl) return;
    const rider = new gl.engine.Marker({ element: riderElement(scene.current.trackColor) });
    riderRef.current = rider;
    const frame = frameRef;
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      rider.remove();
      riderRef.current = null;
    };
  }, [gl, scene]);

  // The rail's profile and the replay share one focus; the rider follows it.
  useEffect(() => {
    const rider = riderRef.current;
    // In flight the replay clock places the rider every frame; a throttled focus would pull it back.
    if (!gl || !rider || playing) return;
    if (focus) {
      rider.setLngLat([focus.lng, focus.lat]).addTo(gl.map);
      distanceRef.current = focus.distanceMeters;
    } else rider.remove();
  }, [gl, focus, playing]);

  useEffect(() => {
    if (!gl || !playing || !ready || totalMeters <= 0) return;
    let last = performance.now();
    let lastFocus = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      distanceRef.current = Math.min(
        totalMeters,
        distanceRef.current + replayMetresPerSecond(totalMeters) * speed * dt
      );
      const here = chase(gl.map, samples, distanceRef.current, bearingRef, scene.current);
      if (here) {
        riderRef.current?.setLngLat([here.lng, here.lat]).addTo(gl.map);
        if (now - lastFocus >= FOCUS_INTERVAL_MS || distanceRef.current >= totalMeters) {
          lastFocus = now;
          onFocusChange(here);
        }
      }
      if (distanceRef.current >= totalMeters) {
        setPlaying(false);
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [gl, playing, ready, samples, speed, totalMeters, onFocusChange, scene]);

  const togglePlay = useCallback(() => {
    if (!playing && preloaded < 1) return;
    if (!playing && distanceRef.current >= totalMeters) distanceRef.current = 0;
    setPlaying((value) => !value);
  }, [playing, preloaded, totalMeters]);

  const restart = useCallback(() => {
    if (preloaded < 1) return;
    distanceRef.current = 0;
    setPlaying(true);
  }, [preloaded]);

  const stop = useCallback(() => setPlaying(false), []);

  return { canReplay: totalMeters > 0, playing, togglePlay, restart, stop, speed, setSpeed };
}
