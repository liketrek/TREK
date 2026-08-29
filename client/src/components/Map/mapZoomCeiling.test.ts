/**
 * The zoom ceiling a Leaflet map needs before a marker cluster will attach.
 *
 * This is a test about Leaflet's own semantics rather than about our components,
 * because that semantic is what a basemap change quietly broke: switching the
 * default basemap to a vector style replaced the TileLayer with a GL canvas, the
 * ceiling went with it, and MarkerClusterGroup.onAdd threw on the way in. The
 * planner and the map settings preview both went to the error boundary, which
 * left no screen from which to pick a different basemap.
 *
 * Nothing is mocked here on purpose. A mocked react-leaflet would have kept
 * passing throughout.
 */
import { describe, it, expect, afterEach } from 'vitest'
import L from 'leaflet'
import 'leaflet.markercluster'
import { MAP_MAX_ZOOM } from '../../constants/mapDefaults'

/**
 * A layer that is not a GridLayer, which is what a vector basemap amounts to:
 * maplibre-gl-leaflet hands back an L.Layer holding a canvas, so it has no
 * beforeAdd and never reaches Leaflet's _addZoomLimit.
 */
const GlCanvasLayer = L.Layer.extend({ onAdd: () => undefined, onRemove: () => undefined })
function glCanvasLayer(): L.Layer {
  return new GlCanvasLayer() as L.Layer
}

/**
 * `leaflet.markercluster` ships no types and we do not depend on
 * `@types/leaflet.markercluster`, so the one factory this file needs is named
 * here rather than pulling a package in for a single call.
 */
const markerClusterGroup = (L as unknown as { markerClusterGroup: () => L.Layer }).markerClusterGroup

const containers: HTMLElement[] = []

function mapOn(options: L.MapOptions): L.Map {
  const el = document.createElement('div')
  Object.defineProperty(el, 'clientWidth', { value: 800 })
  Object.defineProperty(el, 'clientHeight', { value: 600 })
  document.body.appendChild(el)
  containers.push(el)
  return L.map(el, { center: [48.85, 2.35], zoom: 12, ...options })
}

afterEach(() => {
  for (const el of containers.splice(0)) el.remove()
})

describe('the zoom ceiling of a Leaflet map', () => {
  it('MAPZOOM-001: a vector basemap contributes none, so the map has none', () => {
    const map = mapOn({})
    glCanvasLayer().addTo(map)
    // Only a GridLayer feeds Leaflet's _layersMaxZoom, via its beforeAdd hook.
    expect(map.getMaxZoom()).toBe(Infinity)
  })

  it('MAPZOOM-002: a raster basemap contributes one, which is why raster maps never broke', () => {
    const map = mapOn({})
    L.tileLayer('https://example.test/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
    expect(map.getMaxZoom()).toBe(19)
  })

  it('MAPZOOM-003: a cluster refuses to attach to a map with no ceiling', () => {
    const map = mapOn({})
    glCanvasLayer().addTo(map)
    // The throw is in onAdd, before any clustering, so an empty trip hits it too.
    expect(() => markerClusterGroup().addTo(map)).toThrow(/maxZoom/)
  })

  it('MAPZOOM-004: the ceiling on the map itself carries every basemap kind', () => {
    const map = mapOn({ maxZoom: MAP_MAX_ZOOM })
    glCanvasLayer().addTo(map)
    expect(map.getMaxZoom()).toBe(MAP_MAX_ZOOM)
    expect(() => markerClusterGroup().addTo(map)).not.toThrow()
  })

  it('MAPZOOM-005: it does not lower the raster and satellite layers, which already sat at 19', () => {
    const map = mapOn({ maxZoom: MAP_MAX_ZOOM })
    L.tileLayer('https://example.test/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
    expect(map.getMaxZoom()).toBe(19)
  })
})
