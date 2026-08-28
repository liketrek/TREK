import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import type * as L from 'leaflet'
import type { MaplibreGL } from '@maplibre/maplibre-gl-leaflet'
import { attributionForTile } from '../../constants/mapDefaults'

/** The Leaflet layer maplibre-gl-leaflet hands back. */
export type GlLeafletLayer = InstanceType<typeof MaplibreGL>

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

/** Credit the basemap on a map that has an attribution control; a no-op on one that does not. */
function creditBasemap(map: L.Map, style: string): void {
  map.attributionControl?.addAttribution(attributionForTile(style))
}

/**
 * A MapLibre vector style as the basemap of a Leaflet map.
 *
 * OpenFreeMap only serves vector tiles, and CARTO's raster tiles now carry a
 * watermark unless the operator has requested a key by mail, so the basemap of
 * every Leaflet map here is a style document rather than a tile template.
 * maplibre-gl-leaflet hangs a GL canvas into Leaflet's own tile pane, which
 * leaves everything above it alone: markers, GeoJSON, clusters, plugin layers
 * and the panes they live in are untouched, and Leaflet's CSS puts
 * `pointer-events: none` on the layer's canvas, so clicks fall through to them.
 */
export function VectorBasemap({ style }: { style: string }): null {
  const map = useMap()
  const layerRef = useRef<GlLeafletLayer | null>(null)
  const styleRef = useRef(style)
  styleRef.current = style

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const maplibreGL = await loadLayerFactory()
      if (cancelled) return

      // The style is read through a ref, never from the dependency list: a style
      // change must retile in place rather than tear the layer down, the same
      // reason the raster maps keep their template out of the build effect (#2097).
      const layer = maplibreGL({
        style: styleRef.current,
        interactive: false,
        attributionControl: false,
      })
      layerRef.current = layer
      layer.addTo(map)
      creditBasemap(map, styleRef.current)
    })()

    return () => {
      cancelled = true
      layerRef.current?.remove()
      layerRef.current = null
    }
  }, [map])

  // Restyle in place. Swapping the layer would drop a WebGL context per theme
  // toggle, and browsers cap those in the low teens.
  useEffect(() => {
    layerRef.current?.getMaplibreMap()?.setStyle(style)
  }, [style])

  return null
}

export default VectorBasemap

/**
 * The same layer for the maps that build Leaflet imperatively rather than
 * through react-leaflet: the journey map and the atlas.
 *
 * Loading is async because maplibre-gl only ever arrives through a dynamic
 * import, so the caller passes a `cancelled` probe: a map torn down mid-load
 * must not get a layer attached to it afterwards.
 */
export async function attachVectorBasemap(
  map: L.Map,
  style: string,
  ref: { current: GlLeafletLayer | null },
  cancelled: () => boolean,
  opts: { hideLabels?: boolean } = {},
): Promise<void> {
  const maplibreGL = await loadLayerFactory()
  if (cancelled()) return

  const layer = maplibreGL({ style, interactive: false, attributionControl: false })
  ref.current = layer
  layer.addTo(map)
  // The raster layer this replaces carried the credit, and OpenFreeMap asks for
  // one of its own.
  creditBasemap(map, style)
  if (opts.hideLabels) hideLabelLayers(layer)
}

/**
 * Drop every label from a vector style.
 *
 * The atlas draws country names into its own fills, so a basemap that repeats
 * them underneath is noise. OpenFreeMap has no label-free style, but its labels
 * are all `symbol` layers, while borders and coastlines are `line` and `fill`,
 * so hiding that one type leaves the geography intact.
 *
 * Bound to `style.load` rather than run once: the event fires again after every
 * setStyle, so a theme switch keeps the labels off without a second call site.
 */
export function hideLabelLayers(layer: GlLeafletLayer): void {
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
