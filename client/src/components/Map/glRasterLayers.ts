import {
  OPENTOPOMAP_TILE_ATTRIBUTION,
  OPENTOPOMAP_TILE_MAXZOOM,
  OPENTOPOMAP_TILE_URL,
  SATELLITE_TILE_ATTRIBUTION,
  SATELLITE_TILE_MAXZOOM,
  SATELLITE_TILE_URL,
} from '../../constants/mapDefaults';

/*
 * The raster layers a GL map draws between its basemap style and what TREK
 * adds on top: the satellite and topo base layers, and (in mapRasterOverlay.ts)
 * the transparent overlays such as the seamarks.
 */

/**
 * The satellite base layer, the GL twin of the Leaflet one.
 *
 * Leaflet swaps its whole tile layer for the imagery; a GL map cannot, because the
 * basemap is a style with dozens of layers in it. So the imagery goes on as a raster
 * layer of its own, drawn over the style and under everything TREK adds — the route,
 * the pins and the tracks stay on top and stay legible, which is the same order the
 * Leaflet map ends up with.
 *
 * Same tokenless ESRI source as Leaflet, so the two look alike and neither needs a key.
 */
const SATELLITE_SOURCE_ID = 'trip-satellite';
const SATELLITE_LAYER_ID = 'trip-satellite-raster';
/** Everything TREK draws is prefixed; the imagery is inserted before the first of them. */
// Everything TREK draws on a GL map, so the satellite raster can be slipped underneath all
// of it. `route-alt-` earns its place here: the roads offered for a leg are added before the
// route source so they sit under the current route, which also puts them before the first
// `trip-` layer, and anchoring the imagery there painted right over them.
export const OWN_LAYER_PREFIXES = ['trip-', 'trek-', 'route-alt-'];

/**
 * Puts the imagery on the map, or takes it off again.
 *
 * Built on demand rather than once at load: a style change drops every source the map
 * had, and a hot reload does the same. Visibility comes first: a layer that is already
 * there only needs flipping, so the usual pass is one call and a tap answers at once.
 *
 * Deliberately not gated on `isStyleLoaded()`. That reports false for as long as any
 * source has tiles or a setData in flight (see useDawarichTrailGL), which on a phone is
 * the usual state, and the only retry here is `styledata`, which fires on style edits
 * and not when those finish. Behind that gate a stored choice met a busy map on load,
 * and a tap on the road trip stage met the sources the same render had just set again,
 * so the imagery was never drawn. The gate was also the wrong question: this only runs
 * after `load`, and addSource and addLayer refuse only a style document that is not in
 * yet. The catch covers that case, and `styledata` brings the pass back once it is in.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applySatellite(map: any, on: boolean, topo = false): void {
  const layerId = topo ? 'trip-topo-raster' : SATELLITE_LAYER_ID;
  const sourceId = topo ? 'trip-topo' : SATELLITE_SOURCE_ID;
  try {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', on ? 'visible' : 'none');
      return;
    }
    if (!on) return; // Nothing to build while it is switched off.
    // The layer is what is missing, not necessarily the source: a pass that got the
    // source in and then failed on the layer would otherwise leave a source that stops
    // every later pass from ever building the layer.
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'raster',
        tiles: topo
          ? ['a', 'b', 'c'].map((subdomain) => OPENTOPOMAP_TILE_URL.replace('{s}', subdomain))
          : [SATELLITE_TILE_URL],
        tileSize: 256,
        maxzoom: topo ? OPENTOPOMAP_TILE_MAXZOOM : SATELLITE_TILE_MAXZOOM,
        attribution: topo ? OPENTOPOMAP_TILE_ATTRIBUTION : SATELLITE_TILE_ATTRIBUTION,
      });
    }
    // Under the first thing TREK draws, over everything the basemap style draws.
    // Without the anchor the imagery lands on top and buries the route.
    const layers = map.getStyle?.()?.layers ?? [];
    const firstOwn = layers.find((l: { id: string }) => OWN_LAYER_PREFIXES.some((prefix) => l.id.startsWith(prefix)));
    map.addLayer(
      {
        id: layerId,
        type: 'raster',
        source: sourceId,
        paint: { 'raster-opacity': 1 },
      },
      firstOwn?.id
    );
  } catch {
    /* a style that refuses the layer keeps the plain basemap */
  }
}
