import type { AssistantMapView } from '@trek/shared';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

import { useAssistantStore } from '../../store/assistantStore';
import { useTripStore } from '../../store/tripStore';

/**
 * The part of the planner's map on screen, told to the assistant after every
 * move, so a question about "here" needs no place named. Both renderers report
 * through this module; the assistant sends it with the next question only for
 * the trip it was taken on.
 */

interface Edges {
  south: number;
  west: number;
  north: number;
  east: number;
}

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));
const round = (value: number) => Math.round(value * 1e4) / 1e4;

/** The edges as the contract takes them: inside the globe (a wrapped map runs past ±180) and to about ten metres. */
export function mapViewOf(edges: Edges): AssistantMapView {
  return {
    south: round(clamp(edges.south, 90)),
    west: round(clamp(edges.west, 180)),
    north: round(clamp(edges.north, 90)),
    east: round(clamp(edges.east, 180)),
  };
}

function report(tripId: number | null, edges: Edges | null): void {
  const set = useAssistantStore.getState().setMapView;
  // A map without a size yet (hidden, or still laying out) has no edges to speak of.
  const usable = edges && Object.values(edges).every(Number.isFinite) && edges.north > edges.south;
  set(tripId !== null && usable ? { tripId, view: mapViewOf(edges) } : null);
}

/** The trip whose view is reported: only while the assistant can run, so a map without it listens to nothing. */
function useReportedTrip(): number | null {
  const available = useAssistantStore((s) => s.status?.available === true);
  const tripId = useTripStore((s) => s.trip?.id ?? null);
  return available ? tripId : null;
}

/** Leaflet: read from inside the map container, after each move and once on mount. */
export function useReportViewLeaflet(): void {
  const map = useMap();
  const tripId = useReportedTrip();
  useEffect(() => {
    if (tripId === null) return;
    const read = () => {
      const b = map.getBounds();
      report(tripId, { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() });
    };
    read();
    map.on('moveend', read);
    return () => {
      map.off('moveend', read);
      report(null, null);
    };
  }, [map, tripId]);
}

/** What the GL map offers for it; mapbox-gl and maplibre-gl alike. */
interface ViewMap {
  getBounds: () => {
    getSouth: () => number;
    getWest: () => number;
    getNorth: () => number;
    getEast: () => number;
  } | null;
  on: (type: 'moveend', listener: () => void) => unknown;
  off: (type: 'moveend', listener: () => void) => unknown;
}

/** GL: the same, once the map is ready. */
export function useReportViewGL(mapRef: { readonly current: unknown }, mapReady: boolean): void {
  const tripId = useReportedTrip();
  useEffect(() => {
    const map = mapRef.current as Partial<ViewMap> | null;
    if (tripId === null || !mapReady || !map?.on || !map.off || !map.getBounds) return;
    const { on, off, getBounds } = { on: map.on.bind(map), off: map.off.bind(map), getBounds: map.getBounds.bind(map) };
    const read = () => {
      const b = getBounds();
      if (typeof b?.getSouth !== 'function') return;
      report(tripId, { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() });
    };
    read();
    on('moveend', read);
    return () => {
      off('moveend', read);
      report(null, null);
    };
  }, [mapRef, mapReady, tripId]);
}
