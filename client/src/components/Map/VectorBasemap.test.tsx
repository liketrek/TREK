/**
 * VectorBasemap unit tests.
 *
 * The component and its imperative twin both hang a MapLibre style into Leaflet's
 * tile pane. Nothing here renders WebGL — maplibre-gl and the bridge are mocked;
 * what is under test is the wiring: which style goes in, what happens on a style
 * change, and what is left behind on teardown.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import type * as L from 'leaflet'
import { maplibreGL as bridge } from '@maplibre/maplibre-gl-leaflet'
import { hasWebGL } from '../../utils/webgl'
import {
  VectorBasemap,
  attachVectorBasemap,
  detachBasemapLayer,
  hideLabelLayers,
  restyleBasemap,
  type BasemapLayer,
  type GlLeafletLayer,
} from './VectorBasemap'
import { OFM_POSITRON, OFM_DARK, OFM_ATTRIBUTION, RASTER_FALLBACK_TILE_URL } from '../../constants/mapDefaults'

const addAttribution = vi.fn()
/** Only the two things the component touches; casting keeps the mock honest about that. */
const asMap = (m: object) => m as unknown as L.Map
const leafletMap = asMap({ attributionControl: { addAttribution } })
/** A map built without an attribution control, like the atlas. */
const bareMap = asMap({})

// TileLayer as well as useMap: the component renders one when the browser has no
// WebGL, and jsdom is exactly such a browser.
vi.mock('react-leaflet', () => ({
  useMap: () => leafletMap,
  TileLayer: ({ url }: { url: string }) => <div data-testid="raster-basemap" data-url={url} />,
}))

// jsdom has no WebGL, so without this every case below would take the raster
// branch. The suite is about the GL wiring; the raster branch has its own cases.
vi.mock('../../utils/webgl', () => ({ hasWebGL: vi.fn(() => true), resetWebGLProbe: vi.fn() }))
vi.mock('./engines/maplibre', () => ({ default: { __engine: 'maplibre' } }))
vi.mock('@maplibre/maplibre-gl-leaflet', () => {
  const maplibreGL = vi.fn(() => {
    // One GL map per layer, kept stable: a fresh object per call would hand the
    // assertions a different spy than the code just used.
    const gl = {
      setStyle: vi.fn(),
      on: vi.fn(),
      isStyleLoaded: vi.fn(() => false),
      getStyle: vi.fn(() => ({
        layers: [
          { id: 'water', type: 'fill' },
          { id: 'boundary', type: 'line' },
          { id: 'place-city', type: 'symbol' },
          { id: 'country-label', type: 'symbol' },
        ],
      })),
      setLayoutProperty: vi.fn(),
    }
    const layer: Record<string, unknown> = { remove: vi.fn(), getMaplibreMap: vi.fn(() => gl) }
    layer.addTo = vi.fn(() => layer)
    return layer
  })
  return { maplibreGL, default: maplibreGL }
})

const maplibreGL = vi.mocked(bridge as unknown as ReturnType<typeof vi.fn>)

type Spy = ReturnType<typeof vi.fn>

/** The GL map behind a mocked layer, typed as spies so assertions can reach them. */
interface MockGl {
  setStyle: Spy
  on: Spy
  isStyleLoaded: Spy
  getStyle: Spy
  setLayoutProperty: Spy
}

/** The layer the last maplibreGL() call produced, and its GL map. */
function lastLayer(): { layer: GlLeafletLayer; gl: MockGl } {
  const results = maplibreGL.mock.results
  const raw = results[results.length - 1]!.value as { getMaplibreMap: () => MockGl }
  return { layer: raw as unknown as GlLeafletLayer, gl: raw.getMaplibreMap() }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('VectorBasemap', () => {
  it('FE-COMP-VECBM-001: hangs the style into the map, non-interactive', async () => {
    render(<VectorBasemap style={OFM_POSITRON} />)

    await waitFor(() => expect(maplibreGL).toHaveBeenCalledTimes(1))
    expect(maplibreGL.mock.calls[0]![0]).toMatchObject({
      style: OFM_POSITRON,
      // Leaflet keeps handling the gestures; a second interactive map underneath
      // would fight it for the wheel and the drag.
      interactive: false,
      attributionControl: false,
    })
    expect(lastLayer().layer.addTo).toHaveBeenCalledWith(leafletMap)
  })

  it('FE-COMP-VECBM-002: credits OpenFreeMap, not just OpenStreetMap', async () => {
    // The data is OSM, but the rendering and the hosting are not, and the licence
    // asks for both.
    render(<VectorBasemap style={OFM_POSITRON} />)
    await waitFor(() => expect(addAttribution).toHaveBeenCalledWith(OFM_ATTRIBUTION))
  })

  it('FE-COMP-VECBM-003: a theme switch restyles in place instead of rebuilding', async () => {
    const { rerender } = render(<VectorBasemap style={OFM_POSITRON} />)
    await waitFor(() => expect(maplibreGL).toHaveBeenCalledTimes(1))
    const { gl } = lastLayer()

    rerender(<VectorBasemap style={OFM_DARK} />)

    // Swapping the layer would leak a WebGL context per toggle, and browsers cap
    // those in the low teens: a dozen theme switches and the map goes blank.
    expect(gl.setStyle).toHaveBeenCalledWith(OFM_DARK)
    expect(maplibreGL).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-VECBM-004: takes the layer off the map on unmount', async () => {
    const { unmount } = render(<VectorBasemap style={OFM_POSITRON} />)
    await waitFor(() => expect(maplibreGL).toHaveBeenCalledTimes(1))
    const { layer } = lastLayer()

    unmount()
    expect(layer.remove).toHaveBeenCalled()
  })
})

describe('attachVectorBasemap', () => {
  it('FE-COMP-VECBM-005: hands the caller the layer it attached', async () => {
    const ref: { current: GlLeafletLayer | null } = { current: null }
    const map = { id: 'imperative' }

    await attachVectorBasemap(asMap(map), OFM_DARK, ref, () => false)

    expect(maplibreGL.mock.calls[0]![0]).toMatchObject({ style: OFM_DARK, interactive: false })
    expect(ref.current).toBe(lastLayer().layer)
    expect(lastLayer().layer.addTo).toHaveBeenCalledWith(map)
  })

  it('FE-COMP-VECBM-006: a map torn down mid-load gets no layer', async () => {
    // maplibre-gl only ever arrives through a dynamic import, so there is always a
    // gap between "the map wants a basemap" and "the basemap is here". Leaving the
    // layer attached to a dead map keeps its WebGL context alive for good.
    const ref: { current: GlLeafletLayer | null } = { current: null }

    await attachVectorBasemap(bareMap, OFM_DARK, ref, () => true)

    expect(maplibreGL).not.toHaveBeenCalled()
    expect(ref.current).toBeNull()
  })

  it('FE-COMP-VECBM-007: credits OpenFreeMap on a map that has an attribution control', async () => {
    // The raster layer it replaces carried the credit, so dropping it silently
    // would leave the journey map crediting nobody.
    const ref: { current: GlLeafletLayer | null } = { current: null }
    await attachVectorBasemap(leafletMap, OFM_POSITRON, ref, () => false)
    expect(addAttribution).toHaveBeenCalledWith(OFM_ATTRIBUTION)
  })

  it('FE-COMP-VECBM-008: stays quiet on a map built without one', async () => {
    // The atlas turns the control off on purpose; asking for it there would throw.
    const ref: { current: GlLeafletLayer | null } = { current: null }
    await expect(attachVectorBasemap(bareMap, OFM_POSITRON, ref, () => false)).resolves.toBeUndefined()
    expect(addAttribution).not.toHaveBeenCalled()
  })

  it('FE-COMP-VECBM-009: hides the labels when asked to', async () => {
    const ref: { current: GlLeafletLayer | null } = { current: null }

    await attachVectorBasemap(bareMap, OFM_POSITRON, ref, () => false, { hideLabels: true })

    const { gl } = lastLayer()
    expect(gl.on).toHaveBeenCalledWith('style.load', expect.any(Function))
  })
})

describe('hideLabelLayers', () => {
  it('FE-COMP-VECBM-010: hides every symbol layer and nothing else', async () => {
    const ref: { current: GlLeafletLayer | null } = { current: null }
    await attachVectorBasemap(bareMap, OFM_POSITRON, ref, () => false)
    const { layer, gl } = lastLayer()
    gl.isStyleLoaded.mockReturnValue(true)

    hideLabelLayers(layer)

    // The atlas draws country names into its own fills, so basemap labels repeat
    // them. Borders and coastlines are line/fill layers and have to survive.
    expect(gl.setLayoutProperty).toHaveBeenCalledWith('place-city', 'visibility', 'none')
    expect(gl.setLayoutProperty).toHaveBeenCalledWith('country-label', 'visibility', 'none')
    expect(gl.setLayoutProperty).toHaveBeenCalledTimes(2)
  })

  it('FE-COMP-VECBM-011: re-hides them after every restyle', async () => {
    const ref: { current: GlLeafletLayer | null } = { current: null }
    await attachVectorBasemap(bareMap, OFM_POSITRON, ref, () => false)
    const { layer, gl } = lastLayer()

    hideLabelLayers(layer)
    expect(gl.setLayoutProperty).not.toHaveBeenCalled() // style not loaded yet

    // setStyle discards the layout properties along with the old style, so the
    // theme toggle would bring the labels back without this.
    const onStyleLoad = gl.on.mock.calls.find((c: unknown[]) => c[0] === 'style.load')![1] as () => void
    onStyleLoad()
    expect(gl.setLayoutProperty).toHaveBeenCalledTimes(2)
  })

  it('FE-COMP-VECBM-012: does nothing when the GL map is not up yet', () => {
    const layer = { getMaplibreMap: () => undefined } as unknown as GlLeafletLayer
    expect(() => hideLabelLayers(layer)).not.toThrow()
  })
})

/**
 * A browser that will not give MapLibre a WebGL context (#2288).
 *
 * Hardware acceleration off, a blocklisted driver, a VM or a remote desktop all
 * land here. Before the probe, the throw came out of an async effect nobody could
 * catch, and the layer it left behind took the page down on the way out.
 */
describe('VectorBasemap without WebGL', () => {
  const noWebGL = vi.mocked(hasWebGL)

  /** A map real Leaflet will accept, which the raster stand-in needs. */
  const rasterMap = () => asMap({ addLayer: vi.fn(), attributionControl: { addAttribution } })

  beforeEach(() => {
    noWebGL.mockReturnValue(false)
  })

  it('FE-COMP-VECBM-013: draws raster tiles and never asks for the maplibre chunk', async () => {
    // Not loading it is half the point: about a megabyte for a browser that could
    // never have drawn it.
    const { findByTestId } = render(<VectorBasemap style={OFM_POSITRON} />)

    const tiles = await findByTestId('raster-basemap')
    expect(tiles.getAttribute('data-url')).toBe(RASTER_FALLBACK_TILE_URL)
    expect(maplibreGL).not.toHaveBeenCalled()
  })

  it('FE-COMP-VECBM-014: unmounting is quiet, with nothing to take off the map', () => {
    const { unmount } = render(<VectorBasemap style={OFM_POSITRON} />)
    // The crash in #2288 came from teardown, not from the failed attach.
    expect(() => unmount()).not.toThrow()
  })

  it('FE-COMP-VECBM-015: the imperative maps get the raster stand-in in their ref', async () => {
    const ref: { current: BasemapLayer | null } = { current: null }
    const map = rasterMap()

    await attachVectorBasemap(map, OFM_POSITRON, ref, () => false)

    expect(maplibreGL).not.toHaveBeenCalled()
    expect(ref.current).not.toBeNull()
    // OpenStreetMap rather than OpenFreeMap: different tiles, different credit.
    expect(addAttribution).toHaveBeenCalledWith(expect.stringContaining('openstreetmap.org/copyright'))
  })

  it('FE-COMP-VECBM-016: a map torn down mid-probe still gets nothing', async () => {
    const ref: { current: BasemapLayer | null } = { current: null }
    await attachVectorBasemap(rasterMap(), OFM_POSITRON, ref, () => true)
    expect(ref.current).toBeNull()
  })

  it('FE-COMP-VECBM-017: the raster stand-in ignores a restyle and a label sweep', async () => {
    const ref: { current: BasemapLayer | null } = { current: null }
    await attachVectorBasemap(rasterMap(), OFM_POSITRON, ref, () => false)

    // Both are GL-only operations. Called on raster tiles they must do nothing
    // rather than reach for a maplibre map that is not there.
    expect(() => restyleBasemap(ref.current, OFM_DARK)).not.toThrow()
    expect(() => hideLabelLayers(ref.current!)).not.toThrow()
  })
})

describe('detachBasemapLayer', () => {
  it('FE-COMP-VECBM-018: a GL layer whose context never came off cleanly anyway', () => {
    // This is the crash from #2288 in one line: maplibre-gl-leaflet's onRemove
    // calls this._glMap.remove() without asking whether there is one, and after a
    // refused context there is not. It ran inside a React cleanup, so the throw
    // reached a boundary and replaced the page.
    const remove = vi.fn(function (this: { _glMap?: { remove: () => void } }) {
      this._glMap!.remove()
    })
    const halfBuilt = { getMaplibreMap: () => undefined, remove } as unknown as GlLeafletLayer

    expect(() => detachBasemapLayer(halfBuilt)).not.toThrow()
    expect(remove).toHaveBeenCalled()
  })

  it('FE-COMP-VECBM-019: a layer that throws for any other reason is swallowed too', () => {
    // Unmounting a map is never allowed to fail because its basemap did.
    const layer = { remove: vi.fn(() => { throw new Error('boom') }) } as unknown as BasemapLayer
    expect(() => detachBasemapLayer(layer)).not.toThrow()
  })

  it('FE-COMP-VECBM-020: nothing to detach is not an error', () => {
    expect(() => detachBasemapLayer(null)).not.toThrow()
  })
})
