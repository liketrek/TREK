import { frameLng, type LngFrame } from '../../utils/lngFrame';
import { computeMapViewport, TILE_SIZE_RASTER, type GeoPointish, type ViewportPadding } from '../../utils/mapViewport';

/**
 * Where MapView opens: framed on the places when they have coordinates, else
 * at the caller's centre and zoom. Leaflet snaps to whole zoom levels and
 * rounds to the nearest, so 14.7 became 15 and the day ran off the map; the
 * whole level below always fits. `refit` keeps what the frame was worked out
 * for (the window), so OpeningFrameFit can work it out again for the map's
 * own size once it has one.
 */
export function openingView(
  points: readonly GeoPointish[],
  options: { padding: ViewportPadding; lngFrame: LngFrame | null; center: [number, number]; zoom: number }
): { center: [number, number]; zoom: number; framed: boolean; refit: OpeningFrame | null } {
  // With a longitude frame the trip lies on one copy, so it can be framed the short way.
  const wrapsWorld = options.lngFrame !== null;
  const fitted = computeMapViewport(points, { tileSize: TILE_SIZE_RASTER, padding: options.padding, wrapsWorld });
  if (!fitted) return { center: options.center, zoom: options.zoom, framed: false, refit: null };
  const center: [number, number] = [fitted.center[0], frameLng(options.lngFrame, fitted.center[1])];
  const zoom = Math.floor(fitted.zoom);
  const width = typeof window !== 'undefined' && window.innerWidth > 0 ? window.innerWidth : 1024;
  const height = typeof window !== 'undefined' && window.innerHeight > 0 ? window.innerHeight : 768;
  return {
    center,
    zoom,
    framed: true,
    refit: { points, padding: options.padding, wrapsWorld, center, zoom, width, height },
  };
}

/** The opening frame as MapView worked it out before the map existed: for the window. */
export interface OpeningFrame {
  points: readonly GeoPointish[];
  padding: ViewportPadding;
  wrapsWorld: boolean;
  center: [number, number];
  zoom: number;
  /** The size it was worked out for: the window's. */
  width: number;
  height: number;
}
