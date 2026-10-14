import type { Marker as MapLibreMarker } from 'maplibre-gl';
import { useEffect, useRef, type RefObject } from 'react';
import { waypointPinElement } from './terrainLayers';
import type { TerrainGl } from './useTerrainMap';

export interface TerrainWaypoints {
  points: Array<{ id: string; lat: number; lng: number }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Absent while the tour cannot be edited; the pins then stay put. */
  onMove?: (id: string, lat: number, lng: number) => boolean;
  /** Absent while the tour cannot be edited; a click on the map then adds nothing. */
  onAdd?: (lat: number, lng: number) => void;
}

/**
 * The planner's numbered control points, pinned to the ground and draggable while
 * editing. They stay up while a new style loads and are redrawn once it is in.
 */
export function useTerrainPins(
  gl: TerrainGl | null,
  ready: boolean,
  waypoints: TerrainWaypoints,
  handlers: RefObject<TerrainWaypoints>
) {
  const { points, selectedId, onMove } = waypoints;
  const editable = !!onMove;
  const pinsRef = useRef<MapLibreMarker[]>([]);

  useEffect(() => {
    if (!gl || !ready) return;
    pinsRef.current.forEach((pin) => pin.remove());
    pinsRef.current = points.map((point, index) => {
      const el = waypointPinElement(index, point.id === selectedId, editable);
      el.addEventListener('click', (event) => {
        event.stopPropagation();
        handlers.current.onSelect(point.id);
      });
      const pin = new gl.engine.Marker({ element: el, draggable: editable })
        .setLngLat([point.lng, point.lat])
        .addTo(gl.map);
      pin.on('dragend', () => {
        const at = pin.getLngLat();
        if (!handlers.current.onMove?.(point.id, at.lat, at.lng)) pin.setLngLat([point.lng, point.lat]);
      });
      return pin;
    });
  }, [gl, ready, points, selectedId, editable, handlers]);

  // The pins go with the map, not with each redraw.
  useEffect(() => {
    const pins = pinsRef;
    return () => pins.current.forEach((pin) => pin.remove());
  }, []);
}
