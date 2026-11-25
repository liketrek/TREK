import { createContext, useContext } from 'react';

export type MapLoadState = 'loading' | 'ready' | 'failed';
export type MapLoadReporter = (state: MapLoadState) => void;

// Optional so the Leaflet basemap keeps working on maps that are not wrapped by
// MapViewAuto (the atlas and journey maps build their own map chrome).
export const MapLoadContext = createContext<MapLoadReporter | null>(null);

export function useMapLoadStatus(): MapLoadReporter | null {
  return useContext(MapLoadContext);
}

/** The event surface of a GL map, so the tracker stays free of either SDK's types. */
interface MapEventSource {
  once(event: string, handler: () => void): unknown;
  on(event: string, handler: () => void): unknown;
  off(event: string, handler: () => void): unknown;
}

/**
 * Builds the map and reports its first load: `loading` as the build starts,
 * `failed` when WebGL refused the map or the style errors before `style.load`,
 * and `ready` on the map's own `load`. `dispose` detaches the listeners.
 */
export function trackInitialMapLoad<T extends object>(
  build: () => T | null,
  report: MapLoadReporter | null
): { map: T | null; dispose: () => void } {
  report?.('loading');
  const map = build();
  if (!map) {
    report?.('failed');
    return { map: null, dispose: () => {} };
  }
  const events = map as unknown as MapEventSource;
  let styleLoaded = false;
  const onStyleLoad = () => {
    styleLoaded = true;
  };
  const onError = () => {
    if (!styleLoaded) report?.('failed');
  };
  const onLoad = () => {
    report?.('ready');
  };
  events.once('style.load', onStyleLoad);
  events.on('error', onError);
  events.on('load', onLoad);
  return {
    map,
    dispose: () => {
      events.off('style.load', onStyleLoad);
      events.off('error', onError);
      events.off('load', onLoad);
    },
  };
}
