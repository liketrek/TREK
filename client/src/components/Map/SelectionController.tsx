import type L from 'leaflet';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import type { Place } from '../../types';
import { frameLng } from '../../utils/lngFrame';
import type { ViewportPadding } from '../../utils/mapViewport';
import { useLngFrame } from './lngFrameContext';
import { isUnderChrome } from './mapChromePadding';
import { selectedPlaceTarget } from './selectedPlaceTarget';

interface SelectionControllerProps {
  /** False while the traveller locked the map (#2010): a pick changes nothing on it. */
  follow: boolean;
  places: Place[];
  selectedPlaceId: number | null;
  dayPlaces: Place[];
  selectedPlace: Place | null;
  paddingBox: ViewportPadding;
}

/**
 * Where the Leaflet map goes when a place is selected: there, and out from under the
 * panels. The GL twin is `useSelectionCameraGL`.
 */
export function SelectionController({
  follow,
  places,
  selectedPlaceId,
  dayPlaces,
  selectedPlace,
  paddingBox,
}: SelectionControllerProps) {
  const map = useMap();
  const frame = useLngFrame();
  const prev = useRef<number | null>(null);
  /** The panel geometry the last pan was measured against. */
  const pannedWith = useRef(paddingBox);
  const target = selectedPlaceTarget(selectedPlaceId, places, dayPlaces, selectedPlace);
  const lat = target?.lat ?? null;
  const lng = target?.lng == null ? null : frameLng(frame, target.lng);

  useEffect(() => {
    const isNew = selectedPlaceId !== prev.current;
    prev.current = selectedPlaceId;
    if (!isNew || !follow || !selectedPlaceId || lat == null || lng == null) return;
    pannedWith.current = paddingBox;
    panToPlace(map, [lat, lng], paddingBox);
  }, [selectedPlaceId, follow, lat, lng, map, paddingBox]);

  // The place card only learns its height after it laid out, and grows again when its
  // details arrive. If it grew over the pin the selection placed, bring the pin back out;
  // a pin still in the open part of the map stays where the traveller left it (#2991).
  useEffect(() => {
    if (pannedWith.current === paddingBox) return;
    pannedWith.current = paddingBox;
    if (!follow || !selectedPlaceId || lat == null || lng == null) return;
    if (typeof map.latLngToContainerPoint !== 'function') return;
    if (isUnderChrome(map.latLngToContainerPoint([lat, lng]), map.getSize(), paddingBox)) {
      panToPlace(map, [lat, lng], paddingBox);
    }
  }, [paddingBox, follow, selectedPlaceId, lat, lng, map]);

  return null;
}

/**
 * Pan to a place without changing zoom. The centre is offset by the side panels and the
 * bottom card, so the pin lands in the middle of the *visible* map area rather than the
 * geometric centre, where the card would cover it.
 */
function panToPlace(map: L.Map, latlng: [number, number], padding: ViewportPadding): void {
  if (typeof map.project !== 'function' || typeof map.unproject !== 'function') {
    map.panTo(latlng, { animate: true });
    return;
  }
  const { top, right, bottom, left } = padding;
  const point = map.project(latlng).add([(right - left) / 2, (bottom - top) / 2]);
  map.panTo(map.unproject(point), { animate: true });
}
