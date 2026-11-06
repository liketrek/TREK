import { useEffect, useRef } from 'react';
import type { ViewportPadding } from '../../utils/mapViewport';
import { isUnderChrome } from './mapChromePadding';
import { selectedPlaceTarget, type MapTarget } from './selectedPlaceTarget';

/** The part of a MapLibre/Mapbox map the selection camera drives. */
interface SelectionCameraMap {
  getZoom: () => number;
  flyTo: (options: Record<string, unknown>) => unknown;
  easeTo: (options: Record<string, unknown>) => unknown;
  project?: (lngLat: [number, number]) => { x: number; y: number };
  getContainer: () => { clientWidth: number; clientHeight: number };
}

interface SelectionCameraOptions<P extends MapTarget> {
  mapRef: { readonly current: SelectionCameraMap | null | undefined };
  selectedPlaceId: number | null;
  places: P[];
  dayPlaces: P[];
  selectedPlace: P | null;
  /** False while the traveller locked the map (#2010): a pick changes nothing on it. */
  follow: boolean;
  /** The side panels and the bottom card over the map, so the pin lands in the open part. */
  padding: ViewportPadding;
  enableMapbox3d: boolean;
}

/**
 * Where the GL map goes when a place is selected: there, and out from under the panels.
 *
 * A selection flies to the pin, padded by the panels so it lands in the centre of the
 * visible map rather than the geometric one. The place card only learns its height after
 * it laid out and grows again when its details arrive; if it grew over the pin, the pin is
 * eased back out above it at the same zoom, and one still in the open stays put (#2991).
 */
export function useSelectionCameraGL<P extends MapTarget>({
  mapRef,
  selectedPlaceId,
  places,
  dayPlaces,
  selectedPlace,
  follow,
  padding,
  enableMapbox3d,
}: SelectionCameraOptions<P>): void {
  /** The panel geometry the last move to the selection was measured against. */
  const movedWith = useRef(padding);
  /** The selection (and 3D mode) the camera last flew for: only a change of it flies. */
  const flownFor = useRef<string | null>(null);
  const target = selectedPlaceTarget(selectedPlaceId, places, dayPlaces, selectedPlace);
  const lat = target?.lat ?? null;
  const lng = target?.lng ?? null;

  useEffect(() => {
    const key = `${selectedPlaceId}:${enableMapbox3d}`;
    if (flownFor.current === key) return;
    flownFor.current = key;
    movedWith.current = padding;
    const map = mapRef.current;
    if (!map || !selectedPlaceId || !follow || !lat || !lng) return;
    try {
      map.flyTo({
        center: [lng, lat],
        zoom: Math.max(map.getZoom(), 14),
        pitch: enableMapbox3d ? 45 : 0,
        duration: 400,
        padding,
      });
    } catch {
      /* noop */
    }
  }, [selectedPlaceId, enableMapbox3d, follow, lat, lng, mapRef, padding]);

  useEffect(() => {
    if (movedWith.current === padding) return;
    movedWith.current = padding;
    const map = mapRef.current;
    if (!map || !selectedPlaceId || !follow || lat == null || lng == null) return;
    if (typeof map.project !== 'function') return;
    try {
      const container = map.getContainer();
      const size = { x: container.clientWidth, y: container.clientHeight };
      if (!isUnderChrome(map.project([lng, lat]), size, padding)) return;
      map.easeTo({ center: [lng, lat], padding, duration: 300 });
    } catch {
      /* noop */
    }
  }, [padding, selectedPlaceId, follow, lat, lng, mapRef]);
}
