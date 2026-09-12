import { useEffect, useRef, useState } from 'react'
import { TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { MaplibreGL } from '@maplibre/maplibre-gl-leaflet'
import {
  RASTER_FALLBACK_MAX_ZOOM,
  RASTER_FALLBACK_TILE_URL,
  attributionForTile,
} from '../../constants/mapDefaults'
import { hasWebGL } from '../../utils/webgl'
import { isChunkLoadError, reloadOnceForChunk } from '../../utils/chunkReload'

/** The Leaflet layer maplibre-gl-leaflet hands back. */
export type GlLeafletLayer = InstanceType<typeof MaplibreGL>

/**
 * What a map ended up drawing with. Every caller keeps one ref for both kinds, so
 * there is no code path that knows only about the GL layer and falls over the
 * raster stand-in the moment a browser has no WebGL (#2288).
 */
export type BasemapLayer = GlLeafletLayer | L.TileLayer

/** A GL layer rather than the raster stand-in. Prototype method, so `in` finds it. */
function isGlLayer(layer: BasemapLayer): layer is GlLeafletLayer {
  return 'getMaplibreMap' in layer
}

/**
 * Load the layer factory.
 *
 * Both imports are dynamic, the same rule the GL renderers follow: a static one
 * would pull about a megabyte into every chunk that draws a map, including the
 * public share page. The engine module comes along for maplibre-gl's stylesheet,
 * which the GL canvas needs to lay itself out.
 *
 * The layer comes from the bridge's own export rather than from the `L.maplibreGL`
 * it also installs: that side effect is guarded by `Object.isExtensible(L)` and
 * would fail silently — every Leaflet map blank — if a bundler ever handed it a
 * sealed namespace object.
 */
async function loadLayerFactory() {
  const [, bridge] = await Promise.all([
    import('./engines/maplibre'),
    import('@maplibre/maplibre-gl-leaflet'),
  ])
  return bridge.maplibreGL
}

/** The factory, or null when its chunk never arrived. A dead chunk is not the basemap's problem. */
async function loadLayerFactoryOrNull() {
  try {
    return await loadLayerFactory()
  } catch (err) {
    // A chunk gone after a deploy is the global handler's case and heals itself
    // with one reload; here it only means there is no GL layer to attach.
    if (isChunkLoadError(err)) reloadOnceForChunk()
    else console.warn('[basemap] the maplibre chunk did not load', err)
    return null
  }
}

/** Credit the basemap on a map that has an attribution control; a no-op on one that does not. */
function creditBasemap(map: L.Map, style: string): void {
  map.attributionControl?.addAttribution(attributionForTile(style))
}

/**
 * Make a half-built GL layer safe to take off a map.
 *
 * maplibre-gl-leaflet's onRemove calls `this._glMap.remove()` without asking
 * whether there is one, and after a refused WebGL context there is not. That
 * second throw is what turned a missing basemap into a crash: it lands in a React
 * cleanup, where a boundary picks it up and replaces the page (#2288). A no-op
 * stand-in lets the bridge run the rest of its own teardown, the pane child and
 * the zoom-animation listener, and skip only the line that cannot work. A healthy
 * layer already has a GL map and is left alone.
 */
function disarmGlLayer(layer: GlLeafletLayer): void {
  const internals = layer as unknown as { _glMap?: { remove: () => void } | null }
  if (!internals._glMap) internals._glMap = { remove: () => {} }
}

/**
 * Hang a GL layer into a Leaflet map and say whether it took.
 *
 * maplibre-gl builds its WebGL context inside the Map constructor, which Leaflet
 * reaches through onAdd, so `addTo` is where a browser without WebGL throws. The
 * probe catches nearly every case; what is left is a context budget that ran out
 * between probe and attach, which is real on a page holding several maps. Either
 * way the layer has to come back off: Leaflet registers it before onAdd runs, so
 * a broken one left behind is handed to the retile effect and to every later
 * map.remove().
 */
function attachGlLayer(map: L.Map, layer: GlLeafletLayer, style: string): boolean {
  try {
    layer.addTo(map)
  } catch (err) {
    console.warn('[basemap] no WebGL context for the vector basemap, drawing raster tiles', err)
    detachBasemapLayer(layer)
    return false
  }
  creditBasemap(map, style)
  return true
}

/**
 * The raster stand-in, attached imperatively for the maps that build Leaflet
 * themselves. The react-leaflet callers get the same tiles through the <TileLayer>
 * below instead, the way they already draw a user's own raster template.
 */
function attachRasterFallback(map: L.Map): L.TileLayer {
  const layer = L.tileLayer(RASTER_FALLBACK_TILE_URL, {
    maxZoom: RASTER_FALLBACK_MAX_ZOOM,
    referrerPolicy: 'strict-origin-when-cross-origin',
  } as L.TileLayerOptions)
  layer.addTo(map)
  creditBasemap(map, RASTER_FALLBACK_TILE_URL)
  return layer
}

/**
 * Take a basemap off its map. Never throws: unmounting a map is not allowed to
 * fail because its basemap did (#2288).
 */
export function detachBasemapLayer(layer: BasemapLayer | null | undefined): void {
  if (!layer) return
  if (isGlLayer(layer)) disarmGlLayer(layer)
  try {
    layer.remove()
  } catch (err) {
    console.warn('[basemap] teardown failed, leaving the layer where it is', err)
  }
}

/**
 * Retile in place. Swapping the layer would drop a WebGL context per theme
 * toggle, and browsers cap those in the low teens.
 *
 * The raster stand-in has nothing to swap: it draws one template, and there is no
 * keyless dark OSM raster to switch to, so a theme change leaves it alone rather
 * than refetching the same tiles.
 */
export function restyleBasemap(layer: BasemapLayer | null | undefined, style: string): void {
  if (!layer || !isGlLayer(layer)) return
  layer.getMaplibreMap()?.setStyle(style)
}

/**
 * A MapLibre vector style as the basemap of a Leaflet map.
 *
 * OpenFreeMap only serves vector tiles, and CARTO's raster tiles now carry a
 * watermark unless the operator has requested a key by mail, so the basemap of
 * every Leaflet map here is a style document rather than a tile template.
 * maplibre-gl-leaflet hangs a GL canvas into Leaflet's own tile pane, which
 * leaves everything above it alone: markers, GeoJSON, clusters, plugin layers and
 * the panes they live in are untouched, and Leaflet's CSS puts
 * `pointer-events: none` on the layer's canvas, so clicks fall through to them.
 *
 * WebGL is not a given, though. Hardware acceleration switched off, a blocklisted
 * driver, a VM or a remote desktop all end with maplibre-gl throwing out of its
 * constructor, so the browser is asked first and gets raster tiles when the answer
 * is no (#2288). Asking is also what keeps the maplibre chunk off the wire for a
 * browser that could never have used it.
 */
export function VectorBasemap({ style }: { style: string }) {
  const map = useMap()
  const layerRef = useRef<GlLeafletLayer | null>(null)
  const styleRef = useRef(style)
  styleRef.current = style
  // State rather than a plain constant: the probe can say yes and the attach can
  // still fail once the page has spent its context budget, and that has to reach
  // the render or the raster tiles never appear.
  const [glUsable, setGlUsable] = useState(hasWebGL)

  useEffect(() => {
    if (!glUsable) return
    let cancelled = false

    void (async () => {
      const maplibreGL = await loadLayerFactoryOrNull()
      if (cancelled) return
      if (!maplibreGL) {
        setGlUsable(false)
        return
      }

      // The style is read through a ref, never from the dependency list: a style
      // change must retile in place rather than tear the layer down, the same
      // reason the raster maps keep their template out of the build effect (#2097).
      const layer = maplibreGL({
        style: styleRef.current,
        interactive: false,
        attributionControl: false,
      })
      if (!attachGlLayer(map, layer, styleRef.current)) {
        setGlUsable(false)
        return
      }
      layerRef.current = layer
    })()

    return () => {
      cancelled = true
      detachBasemapLayer(layerRef.current)
      layerRef.current = null
    }
  }, [map, glUsable])

  useEffect(() => {
    restyleBasemap(layerRef.current, style)
  }, [style])

  // No WebGL, no vector tiles. Raster keeps the map readable instead of leaving
  // markers, routes and clusters floating over grey; see mapDefaults for why this
  // particular source. The satellite toggle in MapView was always raster and is
  // unaffected either way.
  if (!glUsable) {
    return (
      <TileLayer
        key="webgl-fallback"
        url={RASTER_FALLBACK_TILE_URL}
        attribution={attributionForTile(RASTER_FALLBACK_TILE_URL)}
        maxZoom={RASTER_FALLBACK_MAX_ZOOM}
        keepBuffer={8}
        updateWhenZooming={false}
        updateWhenIdle={true}
        referrerPolicy="strict-origin-when-cross-origin"
      />
    )
  }
  return null
}

export default VectorBasemap

/**
 * The same basemap for the maps that build Leaflet imperatively rather than
 * through react-leaflet: the journey map and the atlas.
 *
 * Loading is async because maplibre-gl only ever arrives through a dynamic import,
 * so the caller passes a `cancelled` probe: a map torn down mid-load must not get
 * a layer attached to it afterwards. What lands in `ref` is either the GL layer or
 * the raster stand-in, which is why callers go through restyleBasemap() and
 * detachBasemapLayer() rather than reaching for getMaplibreMap() themselves.
 */
export async function attachVectorBasemap(
  map: L.Map,
  style: string,
  ref: { current: BasemapLayer | null },
  cancelled: () => boolean,
  opts: { hideLabels?: boolean } = {},
): Promise<void> {
  // Same gate as the component: a browser without WebGL never pays for the
  // maplibre chunk and gets raster tiles rather than an empty map (#2288).
  if (!hasWebGL()) {
    if (!cancelled()) ref.current = attachRasterFallback(map)
    return
  }

  const maplibreGL = await loadLayerFactoryOrNull()
  if (cancelled()) return
  if (!maplibreGL) {
    ref.current = attachRasterFallback(map)
    return
  }

  const layer = maplibreGL({ style, interactive: false, attributionControl: false })
  // The raster layer this replaces carried the credit, and OpenFreeMap asks for
  // one of its own; attachGlLayer adds it once the layer is actually on the map.
  if (!attachGlLayer(map, layer, style)) {
    ref.current = attachRasterFallback(map)
    return
  }
  ref.current = layer
  if (opts.hideLabels) hideLabelLayers(layer)
}

/**
 * Drop every label from a vector style.
 *
 * The atlas draws country names into its own fills, so a basemap that repeats them
 * underneath is noise. OpenFreeMap has no label-free style, but its labels are all
 * `symbol` layers, while borders and coastlines are `line` and `fill`, so hiding
 * that one type leaves the geography intact.
 *
 * Bound to `style.load` rather than run once: the event fires again after every
 * setStyle, so a theme switch keeps the labels off without a second call site.
 */
export function hideLabelLayers(layer: BasemapLayer): void {
  // Nothing to hide on the raster stand-in: OSM bakes its labels into the tile.
  // A WebGL-less atlas therefore shows country names twice, which is cosmetic and
  // the price of having a basemap at all, because the only keyless alternative is
  // none.
  if (!isGlLayer(layer)) return
  const gl = layer.getMaplibreMap()
  if (!gl) return
  const apply = () => {
    for (const l of gl.getStyle()?.layers ?? []) {
      if (l.type === 'symbol') gl.setLayoutProperty(l.id, 'visibility', 'none')
    }
  }
  gl.on('style.load', apply)
  // The first style may already be in when we get here.
  if (gl.isStyleLoaded()) apply()
}
