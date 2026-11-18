import { createContext, useContext } from 'react';

export type MapLoadState = 'loading' | 'ready' | 'failed';
export type MapLoadReporter = (state: MapLoadState) => void;

// Optional so the Leaflet basemap keeps working on maps that are not wrapped by
// MapViewAuto (the atlas and journey maps build their own map chrome).
export const MapLoadContext = createContext<MapLoadReporter | null>(null);

export function useMapLoadStatus(): MapLoadReporter | null {
  return useContext(MapLoadContext);
}
