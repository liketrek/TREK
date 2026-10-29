import { useSyncExternalStore } from 'react';
import { offlineStyle } from '../../native/offlineTiles';
import { hasWebGL, reportWebGLFailure, subscribeWebGL, webGLFailures } from '../../utils/webgl';
import type { GlMapProvider } from './glProviders';

/*
 * Whether a map may be drawn with a GL engine at all, for every place that would
 * build one: the trip map, the journey maps, the settings preview and the 3D tour.
 *
 * MapLibre 6 and Mapbox GL 3 both need WebGL2 and throw out of their Map
 * constructor without it. A browser that cannot give it gets the Leaflet map with
 * the user's tiles instead, never a map that fails to start. Like the GL
 * renderers it guards, this module stays free of both SDKs (`check:gl-split`).
 */

/**
 * The GL engine to draw with, or null for Leaflet: the user's provider, as long
 * as it can run here. Mapbox also needs a token, MapLibre does not.
 */
export function pickGlRenderer(
  provider: string | null | undefined,
  mapboxToken: string | null | undefined,
  webgl2: () => boolean = hasWebGL
): GlMapProvider | null {
  const wanted: GlMapProvider | null =
    provider === 'maplibre-gl' ? 'maplibre-gl' : provider === 'mapbox-gl' && mapboxToken ? 'mapbox-gl' : null;
  // Asked only for a GL provider: a Leaflet user never pays for the probe's context.
  return wanted && webgl2() ? wanted : null;
}

/** Re-renders the caller when a GL map found out that WebGL2 does not work after all. */
function useWebGLFailures(): number {
  return useSyncExternalStore(subscribeWebGL, webGLFailures, webGLFailures);
}

/** pickGlRenderer for a component, switching to Leaflet the moment a GL map fails to build. */
export function useGlRenderer(
  provider: string | null | undefined,
  mapboxToken: string | null | undefined
): GlMapProvider | null {
  useWebGLFailures();
  return pickGlRenderer(provider, mapboxToken);
}

/** Whether 3D (the GL terrain map) can run here, kept current the same way. */
export function useWebGL2(): boolean {
  useWebGLFailures();
  return hasWebGL();
}

/**
 * The GPU refusing a context, as either engine reports it from its Map
 * constructor. Matched on the name and message because the class itself lives in
 * the maplibre chunk, and Mapbox throws a plain Error.
 */
export function isGpuInitFailure(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return err.name === 'GPUInitializationError' || /failed to initialize webgl/i.test(err.message);
}

/**
 * Builds a GL map, the second line of defence behind the probe: a GPU that
 * claims WebGL2 and still fails is reported, so every map switches to Leaflet,
 * and the caller gets null instead of a throw. Anything else is a bug and is
 * thrown on.
 */
/**
 * The style a new GL map is built with. A MapLibre map inside the iOS app reads
 * its tiles through the offline protocol (native/offlineTiles.ts); Mapbox has no
 * protocol hook, so its style goes in untouched.
 */
export function initialMapStyle(provider: GlMapProvider, style: string): string {
  return provider === 'maplibre-gl' ? offlineStyle(style) : style;
}

export function buildGlMap<T>(construct: () => T): T | null {
  try {
    return construct();
  } catch (err) {
    if (!isGpuInitFailure(err)) throw err;
    reportWebGLFailure();
    return null;
  }
}
