// FE-COMP-MAPBOXSETUP-001 to FE-COMP-MAPBOXSETUP-014
import { describe, it, expect, vi } from 'vitest'
import type mapboxgl from 'mapbox-gl'
import {
  isStandardFamily,
  wantsTerrain,
  supportsCustom3d,
  addCustom3dBuildings,
  addTerrainAndSky,
} from './mapboxSetup'

interface FakeMapOptions {
  layers?: string[]
  sources?: string[]
  styleLayers?: Array<{ id: string; type: string }>
  noStyle?: boolean
  addSourceThrows?: boolean
  addLayerThrows?: boolean
  setTerrainThrows?: boolean
}

function fakeMap(opts: FakeMapOptions = {}) {
  const layers = new Set(opts.layers ?? [])
  const sources = new Set(opts.sources ?? [])
  return {
    getLayer: vi.fn((id: string) => (layers.has(id) ? { id } : undefined)),
    getSource: vi.fn((id: string) => (sources.has(id) ? { id } : undefined)),
    addSource: vi.fn((id: string) => {
      if (opts.addSourceThrows) throw new Error('source rejected')
      sources.add(id)
    }),
    addLayer: vi.fn((spec: { id: string }) => {
      if (opts.addLayerThrows) throw new Error('source-layer unavailable')
      layers.add(spec.id)
    }),
    getStyle: vi.fn(() => (opts.noStyle ? undefined : { layers: opts.styleLayers ?? [] })),
    setTerrain: vi.fn(() => {
      if (opts.setTerrainThrows) throw new Error('style has no terrain')
    }),
  }
}

type FakeMap = ReturnType<typeof fakeMap>
const asMap = (m: FakeMap) => m as unknown as mapboxgl.Map

describe('mapboxSetup', () => {
  it('FE-COMP-MAPBOXSETUP-001: recognises the two Standard styles as the standard family', () => {
    expect(isStandardFamily('mapbox://styles/mapbox/standard')).toBe(true)
    expect(isStandardFamily('mapbox://styles/mapbox/standard-satellite')).toBe(true)
    expect(isStandardFamily('mapbox://styles/mapbox/streets-v12')).toBe(false)
    expect(isStandardFamily('https://tiles.openfreemap.org/styles/liberty')).toBe(false)
  })

  it('FE-COMP-MAPBOXSETUP-002: wants terrain only for satellite and outdoors styles', () => {
    expect(wantsTerrain('mapbox://styles/mapbox/satellite-v9')).toBe(true)
    expect(wantsTerrain('mapbox://styles/mapbox/satellite-streets-v12')).toBe(true)
    expect(wantsTerrain('mapbox://styles/mapbox/outdoors-v12')).toBe(true)
    // Flat vector styles must stay flat — DEM would drift the route lines off the markers.
    expect(wantsTerrain('mapbox://styles/mapbox/streets-v12')).toBe(false)
    expect(wantsTerrain('mapbox://styles/mapbox/standard')).toBe(false)
  })

  it('FE-COMP-MAPBOXSETUP-003: custom 3D is offered for everything outside the standard family', () => {
    expect(supportsCustom3d('mapbox://styles/mapbox/streets-v12')).toBe(true)
    expect(supportsCustom3d('mapbox://styles/mapbox/satellite-v9')).toBe(true)
    expect(supportsCustom3d('mapbox://styles/mapbox/standard')).toBe(false)
    expect(supportsCustom3d('mapbox://styles/mapbox/standard-satellite')).toBe(false)
  })

  it('FE-COMP-MAPBOXSETUP-004: addCustom3dBuildings bails out when the layer already exists', () => {
    const map = fakeMap({ layers: ['trek-3d-buildings'] })
    addCustom3dBuildings(asMap(map), false)
    expect(map.addLayer).not.toHaveBeenCalled()
    expect(map.addSource).not.toHaveBeenCalled()
  })

  it('FE-COMP-MAPBOXSETUP-005: uses the style composite source and inserts below the first symbol layer', () => {
    const map = fakeMap({
      sources: ['composite'],
      styleLayers: [
        { id: 'water', type: 'fill' },
        { id: 'place-labels', type: 'symbol' },
        { id: 'road-labels', type: 'symbol' },
      ],
    })
    addCustom3dBuildings(asMap(map), false)

    expect(map.addSource).not.toHaveBeenCalled()
    const [spec, beforeId] = map.addLayer.mock.calls[0] as unknown as [Record<string, unknown>, string]
    expect(spec.id).toBe('trek-3d-buildings')
    expect(spec.source).toBe('composite')
    expect(spec.type).toBe('fill-extrusion')
    // Extrusions must sit under the first label layer so text stays readable.
    expect(beforeId).toBe('place-labels')
  })

  it('FE-COMP-MAPBOXSETUP-006: attaches the streets tileset when the style has no composite source', () => {
    const map = fakeMap({ styleLayers: [] })
    addCustom3dBuildings(asMap(map), false)

    expect(map.addSource).toHaveBeenCalledWith('mapbox-streets-v8', {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-streets-v8',
    })
    const [spec, beforeId] = map.addLayer.mock.calls[0] as unknown as [Record<string, unknown>, string | undefined]
    expect(spec.source).toBe('mapbox-streets-v8')
    // No symbol layer in the style: nothing to insert before.
    expect(beforeId).toBeUndefined()
  })

  it('FE-COMP-MAPBOXSETUP-007: reuses an already attached streets tileset', () => {
    const map = fakeMap({ sources: ['mapbox-streets-v8'] })
    addCustom3dBuildings(asMap(map), false)

    expect(map.addSource).not.toHaveBeenCalled()
    const [spec] = map.addLayer.mock.calls[0] as unknown as [Record<string, unknown>]
    expect(spec.source).toBe('mapbox-streets-v8')
  })

  it('FE-COMP-MAPBOXSETUP-008: gives up quietly when the fallback source cannot be added', () => {
    const map = fakeMap({ addSourceThrows: true })
    expect(() => addCustom3dBuildings(asMap(map), false)).not.toThrow()
    expect(map.addLayer).not.toHaveBeenCalled()
  })

  it('FE-COMP-MAPBOXSETUP-009: swallows a rejected extrusion layer', () => {
    const map = fakeMap({ sources: ['composite'], addLayerThrows: true })
    expect(() => addCustom3dBuildings(asMap(map), false)).not.toThrow()
    expect(map.addLayer).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-MAPBOXSETUP-010: picks the dark building colour in dark mode', () => {
    const light = fakeMap({ sources: ['composite'] })
    addCustom3dBuildings(asMap(light), false)
    const dark = fakeMap({ sources: ['composite'] })
    addCustom3dBuildings(asMap(dark), true)

    const paintOf = (m: FakeMap) => (m.addLayer.mock.calls[0][0] as unknown as { paint: Record<string, unknown> }).paint
    expect(paintOf(light)['fill-extrusion-color']).toBe('#cfd2d6')
    expect(paintOf(dark)['fill-extrusion-color']).toBe('#3b3b3f')
  })

  it('FE-COMP-MAPBOXSETUP-011: survives a style that reports no layers at all', () => {
    const map = fakeMap({ sources: ['composite'], noStyle: true })
    addCustom3dBuildings(asMap(map), false)
    const [, beforeId] = map.addLayer.mock.calls[0] as unknown as [unknown, string | undefined]
    expect(beforeId).toBeUndefined()
  })

  it('FE-COMP-MAPBOXSETUP-012: addTerrainAndSky adds the DEM source, the terrain and the sky layer', () => {
    const map = fakeMap()
    addTerrainAndSky(asMap(map))

    expect(map.addSource).toHaveBeenCalledWith('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      tileSize: 512,
      maxzoom: 14,
    })
    expect(map.setTerrain).toHaveBeenCalledWith({ source: 'mapbox-dem', exaggeration: 1.2 })
    const [spec] = map.addLayer.mock.calls[0] as unknown as [Record<string, unknown>]
    expect(spec.id).toBe('sky')
    expect(spec.type).toBe('sky')
  })

  it('FE-COMP-MAPBOXSETUP-013: does not re-add DEM or sky when they are already there', () => {
    const map = fakeMap({ sources: ['mapbox-dem'], layers: ['sky'] })
    addTerrainAndSky(asMap(map))

    expect(map.addSource).not.toHaveBeenCalled()
    expect(map.addLayer).not.toHaveBeenCalled()
    // Terrain itself is re-applied — it is what the style rebuild dropped.
    expect(map.setTerrain).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-MAPBOXSETUP-014: swallows a style that does not support terrain', () => {
    const map = fakeMap({ setTerrainThrows: true })
    expect(() => addTerrainAndSky(asMap(map))).not.toThrow()
    expect(map.addLayer).not.toHaveBeenCalled()
  })
})
