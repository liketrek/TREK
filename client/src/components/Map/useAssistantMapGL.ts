import { useCallback } from 'react';
import type { ViewportPadding } from '../../utils/mapViewport';
import { useAssistantMarkerClasses } from './assistantCamera';
import { PLACE_POP_CLASS, PLACE_PULSE_CLASS } from './assistantGhostMarker';
import { useReportViewGL } from './assistantViewport';
import type { AssistantMapProps } from './mapViewContract';
import { useAssistantCameraGL, type CameraEngine, type CameraMap } from './useAssistantCameraGL';
import { useAssistantGhostLinesGL, type LineMap } from './useAssistantGhostLinesGL';
import { useAssistantGhostMarkersGL, type GhostMap } from './useAssistantGhostMarkersGL';

interface PinGL {
  el: HTMLElement;
  remove: () => void;
}

interface AssistantMapGLOptions<Pin extends PinGL> {
  /** The live GL map, typed by what the parts read; the engine itself stays out of this module. */
  mapRef: { readonly current: (CameraMap & GhostMap & LineMap) | null };
  mapReady: boolean;
  gl: CameraEngine;
  /** The ghosts' pins, in the ref the renderer repositions on its render clock. */
  pinsRef: { current: Pin[] };
  attachPin: (el: HTMLElement, lng: number, lat: number) => Pin;
  /** The renderer's place pins by place id, for the pop and the pulse. */
  markersRef: { readonly current: ReadonlyMap<number, Pin> };
  padding: ViewportPadding;
  assistant: AssistantMapProps;
}

/**
 * Hands the assistant's marks of a place pin on to the element that replaces
 * it. The GL map builds every place pin anew on each pan, zoom and selection,
 * so without this a pulse would end with the first move and a pop inside its
 * moment would be lost. Leaflet keeps its pins and never needs it.
 */
export function carryAssistantMarks(from: HTMLElement, to: HTMLElement): void {
  for (const mark of [PLACE_POP_CLASS, PLACE_PULSE_CLASS]) {
    if (from.classList.contains(mark)) to.classList.add(mark);
  }
}

/**
 * Everything the assistant does on the GL map in one call, so MapViewGL only
 * hands its props on: the routes its cards show, the ghosts, the camera, and
 * the pop and pulse on the real pins. The twin of AssistantMapLeaflet.
 */
export function useAssistantMapGL<Pin extends PinGL>({
  mapRef,
  mapReady,
  gl,
  pinsRef,
  attachPin,
  markersRef,
  padding,
  assistant,
}: AssistantMapGLOptions<Pin>): void {
  useAssistantGhostLinesGL({
    mapRef,
    mapReady,
    lines: assistant.assistantRouteLines,
    onHover: assistant.onAssistantRouteHover,
    onPoint: assistant.onAssistantRoutePoint,
  });
  useAssistantGhostMarkersGL({
    mapRef,
    mapReady,
    pinsRef,
    attachPin,
    ghosts: assistant.assistantGhosts,
    hoveredId: assistant.assistantHoveredId,
    onHover: assistant.onAssistantGhostHover,
    onClick: assistant.onAssistantGhostClick,
  });
  useAssistantCameraGL({ mapRef, mapReady, gl, camera: assistant.assistantCamera, padding });
  const markerEl = useCallback((id: number) => markersRef.current.get(id)?.el ?? null, [markersRef]);
  useAssistantMarkerClasses(markerEl, assistant.poppedPlaceIds, assistant.assistantPulsePlaceId);
  useReportViewGL(mapRef, mapReady);
}
