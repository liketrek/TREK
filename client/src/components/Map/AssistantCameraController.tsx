import L from 'leaflet';
import { useCallback, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { MAX_ZOOM_RASTER, type ViewportPadding } from '../../utils/mapViewport';
import { ASSISTANT_CAMERA_MS, centreOf, coverPadding, useCameraRequest, useUserMoveClock } from './assistantCamera';
import type { AssistantCamera } from './mapViewContract';

interface AssistantCameraControllerProps {
  camera: AssistantCamera | null | undefined;
  /** The planner's padding for its panels, in pixels per edge. */
  padding: ViewportPadding;
}

/**
 * Moves the Leaflet map where the assistant asks: `fit` frames the points,
 * `pan` brings their centre into view only when it is outside. Zoomed in no
 * further than a day fit, the same scale the GL map stops at.
 */
export function AssistantCameraController({ camera, padding }: AssistantCameraControllerProps) {
  const map = useMap();
  const getContainer = useCallback(() => map.getContainer(), [map]);
  const userMovedAt = useUserMoveClock(getContainer, true);
  const request = useCameraRequest(camera, userMovedAt);

  useEffect(() => {
    request((next) => {
      const duration = ASSISTANT_CAMERA_MS / 1000;
      if (next.mode === 'pan') {
        const centre = centreOf(next.points);
        if (!map.getBounds().contains(centre)) map.panTo(centre, { animate: next.animate, duration });
        return;
      }
      const box = coverPadding(padding, next.cover);
      map.fitBounds(L.latLngBounds(next.points), {
        paddingTopLeft: [box.left, box.top],
        paddingBottomRight: [box.right, box.bottom],
        maxZoom: MAX_ZOOM_RASTER,
        animate: next.animate,
        duration,
      });
    });
  }, [map, padding, request]);

  return null;
}
