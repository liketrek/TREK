import { rasterTileZoom } from './glRasterLayers';
import type { MapViewProps } from './mapViewContract';

/** Enough of a GL map to say what it shows: its bounds and its zoom. */
interface ViewportSource {
  getBounds(): { getSouth(): number; getWest(): number; getNorth(): number; getEast(): number } | null;
  getZoom(): number;
}

/**
 * Tells the page what a GL map shows, so the POI explore pill can fetch the
 * OSM places of the visible area: its bounds, and its zoom on the raster tile
 * scale Leaflet reports too, so both maps ask for the same places at the
 * same view. A map without bounds yet says nothing.
 */
export function reportGlViewport(map: ViewportSource, report: MapViewProps['onViewportChange']): void {
  const bounds = map.getBounds();
  if (!report || !bounds) return;
  const bbox = { south: bounds.getSouth(), west: bounds.getWest(), north: bounds.getNorth(), east: bounds.getEast() };
  report(bbox, rasterTileZoom(map.getZoom()));
}
