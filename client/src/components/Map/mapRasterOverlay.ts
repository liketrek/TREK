import type { Map } from 'mapbox-gl';
import { useEffect } from 'react';
import { useFerrataMapLayerGL } from '../Ferratas/useFerrataLayerGL';
import type { FerrataMapLayer } from '../Ferratas/useFerrataMapLayer';
import { OWN_LAYER_PREFIXES } from './glRasterLayers';

/**
 * A transparent raster layer laid over the basemap and under the route, such
 * as OpenSeaMap's seamarks over a paddle tour. Only the tiles in view are
 * fetched while it is on: nothing is prefetched or stored for offline use, and
 * the browser's own cache follows the answer's headers.
 */
export interface MapRasterOverlay {
  id: string;
  url: string;
  attribution: string;
  minZoom: number;
  maxZoom: number;
  active: boolean;
  /** A tile failed to load; the layer's owner decides when that means the source is down. */
  onTileError: () => void;
  /** A tile arrived; the source answers again. */
  onTileLoad: () => void;
}

type RasterOverlayStatus = 'off' | 'on' | 'down';

/** An overlay with its switch: whether it is on, and whether its source stopped answering. */
export interface ToggleableRasterOverlay extends MapRasterOverlay {
  status: RasterOverlayStatus;
  onToggle: () => void;
}

/** One map type for both engines, as the ferrata layer does: MapLibre answers every call made here. */
export type RasterOverlayGlMap = Map;

/**
 * The layer id. It carries TREK's own prefix, so a basemap raster added later
 * (satellite, topo) is put under it, and it goes in under the first other own
 * layer, so the route and its markers stay on top.
 */
function overlayLayerId(id: string): string {
  return `trek-overlay-${id}`;
}

function applyOverlay(map: RasterOverlayGlMap, overlay: MapRasterOverlay): void {
  const layerId = overlayLayerId(overlay.id);
  try {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', overlay.active ? 'visible' : 'none');
      return;
    }
    if (!overlay.active) return;
    if (!map.getSource(layerId)) {
      map.addSource(layerId, {
        type: 'raster',
        tiles: [overlay.url],
        tileSize: 256,
        minzoom: overlay.minZoom,
        maxzoom: overlay.maxZoom,
        attribution: overlay.attribution,
      });
    }
    const firstOwn = (map.getStyle()?.layers ?? []).find(
      (layer) =>
        OWN_LAYER_PREFIXES.some((prefix) => layer.id.startsWith(prefix)) && !layer.id.startsWith('trek-overlay-')
    );
    map.addLayer({ id: layerId, type: 'raster', source: layerId, paint: { 'raster-opacity': 1 } }, firstOwn?.id);
  } catch {
    // A style that refuses the layer keeps the plain map; the switch reports nothing loaded.
  }
}

/**
 * The overlays on a GL map, kept through a basemap change (which rebuilds the
 * style and drops them) and reporting their tiles' arrivals and failures.
 */
export function useRasterOverlaysGL(map: RasterOverlayGlMap | null, overlays: readonly MapRasterOverlay[] | undefined) {
  useEffect(() => {
    if (!map || !overlays?.length) return;
    const apply = () => overlays.forEach((overlay) => applyOverlay(map, overlay));
    const sourceOf = (event: { sourceId?: string }) =>
      overlays.find((overlay) => overlayLayerId(overlay.id) === event.sourceId);
    // A tile's failure carries the source it came from; other errors carry none and are not ours.
    const failed = (event: { error?: Error; sourceId?: string }) => {
      const overlay = sourceOf(event);
      if (overlay?.active) overlay.onTileError();
    };
    const loaded = (event: { sourceId?: string; tile?: unknown }) => {
      const overlay = sourceOf(event);
      if (overlay?.active && event.tile) overlay.onTileLoad();
    };
    apply();
    map.on('styledata', apply);
    map.on('error', failed);
    map.on('sourcedata', loaded);
    return () => {
      map.off('styledata', apply);
      map.off('error', failed);
      map.off('sourcedata', loaded);
    };
  }, [map, overlays]);
}

/** The tour planner's layers on a GL map: the via ferratas and the raster overlays its type offers. */
export function useTourMapLayersGL(
  map: RasterOverlayGlMap | null,
  ferrataLayer: FerrataMapLayer | undefined,
  overlays: readonly MapRasterOverlay[] | undefined
) {
  useFerrataMapLayerGL(map, ferrataLayer);
  useRasterOverlaysGL(map, overlays);
}
