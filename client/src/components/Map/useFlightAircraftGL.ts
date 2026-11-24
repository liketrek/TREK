import { escapeHtml } from '@trek/shared';
import { useEffect, useRef } from 'react';
import { aircraftMarkerHtml, useLiveAircraft } from './flightAircraft';
import './flightAircraft.css';

interface GlMarker {
  setLngLat(lngLat: [number, number]): GlMarker;
  addTo(map: unknown): GlMarker;
  remove(): void;
  getElement(): HTMLElement;
}

/**
 * The trip's flights in the air on the Mapbox/MapLibre map: one HTML marker
 * per aircraft, moved in place when its position changes and removed when it
 * lands. A click opens the booking. The map is read through its ref inside the
 * effects, never during render; a rebuilt map (style or provider change) drops
 * the markers of the old one.
 */
export function useFlightAircraftGL(
  mapRef: { current: unknown },
  mapReady: boolean,
  // The map library's Marker class, injected like the other GL overlays do.
  Marker: (new (opts: { element: HTMLElement; anchor: string }) => GlMarker) | undefined,
  onOpen: (reservationId: number) => void,
  /** The bookings this map shows; only their aircraft are drawn. */
  reservations: readonly { id: number }[] | undefined
): void {
  const aircraft = useLiveAircraft(reservations);
  const markers = useRef(new Map<string, GlMarker>());
  const markersOf = useRef<unknown>(null);
  const openRef = useRef(onOpen);
  useEffect(() => {
    openRef.current = onOpen;
  });

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !Marker) return;
    if (markersOf.current !== map) {
      // The markers belonged to a map that is gone; the new one starts empty.
      markers.current.clear();
      markersOf.current = map;
    }
    const live = new Set(aircraft.map((a) => a.key));
    for (const [key, marker] of markers.current) {
      if (!live.has(key)) {
        marker.remove();
        markers.current.delete(key);
      }
    }
    for (const a of aircraft) {
      let marker = markers.current.get(a.key);
      if (!marker) {
        const el = document.createElement('div');
        el.addEventListener('click', () => openRef.current(a.reservationId));
        marker = new Marker({ element: el, anchor: 'center' }).setLngLat([a.lng, a.lat]).addTo(map);
        markers.current.set(a.key, marker);
      }
      marker.getElement().innerHTML = aircraftMarkerHtml(a, escapeHtml);
      marker.setLngLat([a.lng, a.lat]);
    }
  }, [aircraft, mapRef, mapReady, Marker]);

  useEffect(() => {
    const current = markers.current;
    return () => {
      for (const marker of current.values()) marker.remove();
      current.clear();
    };
  }, []);
}
