// The Leaflet map's bridges to the page: the events it hands out, with their
// points on the real world (#2976), and the view kept on the world copy the
// trip is drawn on (#2975).

import { wrapLongitude } from '@trek/shared';
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { frameLng, type LngFrame } from '../../utils/lngFrame';
import { bboxOnRealWorld } from '../../utils/worldCopy';
import { useLngFrame } from './lngFrameContext';
import type { MapViewProps } from './mapViewContract';
import { bindPoiDropTarget } from './poiDropTarget';

/**
 * Takes a corridor hit dropped anywhere on the map and reports where it landed.
 *
 * The container rather than the drawn route: a polyline is a real element here but not in
 * the GL renderers, and the drop coordinate answers "where on the drive" just as well
 * once the caller projects it onto the routed geometry — one behaviour for all three.
 */
export function PoiDropTarget({
  onPoiDropOnRoute,
}: {
  onPoiDropOnRoute?: (osmId: string, lat: number, lng: number) => void;
}) {
  const map = useMap();
  useEffect(() => {
    if (!onPoiDropOnRoute) return;
    return bindPoiDropTarget(map.getContainer(), (x, y) => map.containerPointToLatLng([x, y]), onPoiDropOnRoute);
  }, [map, onPoiDropOnRoute]);
  return null;
}

// Emits the current viewport bbox on pan/zoom so the POI-explore pill can fetch
// OSM places for the visible area, with the zoom an overlay's minimum is read against.
export function ViewportController({ onViewportChange }: { onViewportChange?: MapViewProps['onViewportChange'] }) {
  const map = useMap();
  useEffect(() => {
    if (!onViewportChange) return;
    const emit = () => {
      const b = map.getBounds();
      // A view of a world copy (or of a trip drawn past the antimeridian) asks for the real places there.
      onViewportChange(
        bboxOnRealWorld({ south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() }),
        map.getZoom()
      );
    };
    map.whenReady(emit); // ensure the first bbox is captured once the map is laid out
    map.on('moveend', emit);
    map.on('zoomend', emit);
    return () => {
      map.off('moveend', emit);
      map.off('zoomend', emit);
    };
  }, [map, onViewportChange]);
  return null;
}

/**
 * Moves the view along when the longitude frame changes under it (#2975): the trip
 * is then drawn one world further east or west, and a view left where it was would
 * look at an empty copy. One jump of a whole world, so nothing on screen changes.
 */
export function LngFrameFollower() {
  const map = useMap();
  const frame = useLngFrame();
  const prev = useRef<LngFrame | null>(frame);
  useEffect(() => {
    const before = prev.current;
    prev.current = frame;
    if (before === frame || typeof map.getCenter !== 'function') return;
    const center = map.getCenter();
    // Without a frame the trip is back on the real world, and so is the view.
    const target = frame ? frameLng(frame, center.lng) : wrapLongitude(center.lng);
    const shift = target - center.lng;
    if (shift !== 0) map.setView([center.lat, target], map.getZoom(), { animate: false });
  }, [frame, map]);
  return null;
}

interface MapClickHandlerProps {
  onClick: ((e: L.LeafletMouseEvent) => void) | null;
}

/**
 * The event as the map reports it, with its point moved from a repeated world copy
 * back onto the real world: a right-click on the copy east of it said 274.9 for
 * -85.1, and the place was saved there (#2976).
 */
function onRealWorldEvent(e: L.LeafletMouseEvent): L.LeafletMouseEvent {
  const lng = wrapLongitude(e.latlng.lng);
  return lng === e.latlng.lng ? e : { ...e, latlng: L.latLng(e.latlng.lat, lng) };
}

export function MapClickHandler({ onClick }: MapClickHandlerProps) {
  const map = useMap();
  useEffect(() => {
    if (!onClick) return;
    const handle = (e: L.LeafletMouseEvent) => onClick(onRealWorldEvent(e));
    map.on('click', handle);
    return () => {
      map.off('click', handle);
    };
  }, [map, onClick]);
  return null;
}

export function MapContextMenuHandler({ onContextMenu }: { onContextMenu: ((e: L.LeafletMouseEvent) => void) | null }) {
  const map = useMap();
  useEffect(() => {
    if (!onContextMenu) return;
    const handle = (e: L.LeafletMouseEvent) => onContextMenu(onRealWorldEvent(e));
    map.on('contextmenu', handle);
    return () => {
      map.off('contextmenu', handle);
    };
  }, [map, onContextMenu]);
  return null;
}
