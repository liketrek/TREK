import { useCallback, useEffect } from 'react';
import { MAX_ZOOM_GL, type ViewportPadding } from '../../utils/mapViewport';
import { ASSISTANT_CAMERA_MS, centreOf, coverPadding, useCameraRequest, useUserMoveClock } from './assistantCamera';
import type { AssistantCamera } from './mapViewContract';

/** The slice of the GL map the camera drives. */
export interface CameraMap {
  /** Where the user drags, wheels and pinches the map; marker clicks are not moves. */
  getCanvasContainer: () => HTMLElement;
  getBounds: () => { contains: (lngLat: [number, number]) => boolean } | null;
  fitBounds: (bounds: unknown, options: { padding: ViewportPadding; maxZoom: number; duration: number }) => unknown;
  easeTo: (options: { center: [number, number]; duration: number }) => unknown;
}

/** The engine's bounds class, handed in so this module never imports mapbox-gl or maplibre-gl itself. */
export interface CameraEngine {
  LngLatBounds: new () => { extend: (lngLat: [number, number]) => unknown };
}

interface AssistantCameraOptions {
  mapRef: { readonly current: CameraMap | null };
  mapReady: boolean;
  gl: CameraEngine;
  camera: AssistantCamera | null | undefined;
  /** The planner's padding for its panels, in pixels per edge. */
  padding: ViewportPadding;
}

/**
 * Moves the GL map where the assistant asks, the twin of the Leaflet
 * AssistantCameraController: `fit` frames the points, `pan` eases to their
 * centre only when it is outside the view. It stops at the same scale as the
 * Leaflet map (one GL zoom step is a raster step lower).
 */
export function useAssistantCameraGL({ mapRef, mapReady, gl, camera, padding }: AssistantCameraOptions): void {
  const getContainer = useCallback(() => mapRef.current?.getCanvasContainer() ?? null, [mapRef]);
  const userMovedAt = useUserMoveClock(getContainer, mapReady);
  const request = useCameraRequest(camera, userMovedAt);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    request((next) => {
      const duration = next.animate ? ASSISTANT_CAMERA_MS : 0;
      if (next.mode === 'pan') {
        const [lat, lng] = centreOf(next.points);
        if (!map.getBounds()?.contains([lng, lat])) map.easeTo({ center: [lng, lat], duration });
        return;
      }
      const bounds = new gl.LngLatBounds();
      next.points.forEach(([lat, lng]) => bounds.extend([lng, lat]));
      map.fitBounds(bounds, { padding: coverPadding(padding, next.cover), maxZoom: MAX_ZOOM_GL, duration });
    });
  }, [gl, mapReady, mapRef, padding, request]);
}
