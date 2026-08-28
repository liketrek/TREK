import { describe, it, expect } from 'vitest'
import { isVectorStyle, resolveBasemap, resolveTileUrl } from './tileUrl'
import { OFM_POSITRON, attributionForTile, OFM_ATTRIBUTION } from '../constants/mapDefaults'

const CARTO = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const CUSTOM = 'https://tiles.example.test/{z}/{x}/{y}.png'

describe('isVectorStyle', () => {
  it('FE-UTIL-BASEMAP-001: a style document is one, a tile template is not', () => {
    expect(isVectorStyle(OFM_POSITRON)).toBe(true)
    expect(isVectorStyle('mapbox://styles/mapbox/standard')).toBe(true)
    // The placeholders are what separate the two, not the host.
    expect(isVectorStyle(CUSTOM)).toBe(false)
    expect(isVectorStyle(CARTO)).toBe(false)
    expect(isVectorStyle('')).toBe(false)
    expect(isVectorStyle(null)).toBe(false)
  })
})

describe('resolveTileUrl and the retired CARTO basemaps', () => {
  it('FE-UTIL-BASEMAP-002: a keyless CARTO template falls back to the default', () => {
    // Those tiles come back with "API KEY REQUIRED" burned into them, which is
    // worse than any basemap, so they are not drawn at all. The saved setting is
    // left alone — the Map tab still shows it, with its warning underneath.
    expect(resolveTileUrl(CARTO, OFM_POSITRON)).toBe(OFM_POSITRON)
    expect(resolveTileUrl('https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', OFM_POSITRON)).toBe(OFM_POSITRON)
    expect(resolveTileUrl('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', OFM_POSITRON)).toBe(OFM_POSITRON)
  })

  it('FE-UTIL-BASEMAP-003: with a key it is drawn, key appended', () => {
    // Choosing CARTO stays a supported option for whoever holds a key (#2054);
    // it is only no longer the default.
    expect(resolveTileUrl(CARTO, OFM_POSITRON, 'k1')).toBe(`${CARTO}?key=k1`)
  })

  it('FE-UTIL-BASEMAP-004: other providers are never touched', () => {
    expect(resolveTileUrl(CUSTOM, OFM_POSITRON)).toBe(CUSTOM)
    expect(resolveTileUrl(CUSTOM, OFM_POSITRON, 'k1')).toBe(CUSTOM)
    expect(resolveTileUrl('', OFM_POSITRON)).toBe(OFM_POSITRON)
  })
})

describe('resolveBasemap', () => {
  it('FE-UTIL-BASEMAP-005: an unconfigured map gets the vector default', () => {
    expect(resolveBasemap('', OFM_POSITRON)).toEqual({ kind: 'vector', style: OFM_POSITRON })
    expect(resolveBasemap(null, OFM_POSITRON)).toEqual({ kind: 'vector', style: OFM_POSITRON })
  })

  it('FE-UTIL-BASEMAP-006: a template the user configured still wins, as raster', () => {
    expect(resolveBasemap(CUSTOM, OFM_POSITRON)).toEqual({ kind: 'raster', url: CUSTOM })
  })

  it('FE-UTIL-BASEMAP-007: a keyless CARTO template draws the default instead', () => {
    expect(resolveBasemap(CARTO, OFM_POSITRON)).toEqual({ kind: 'vector', style: OFM_POSITRON })
  })

  it('FE-UTIL-BASEMAP-008: with a key it stays raster CARTO', () => {
    expect(resolveBasemap(CARTO, OFM_POSITRON, 'k1')).toEqual({ kind: 'raster', url: `${CARTO}?key=k1` })
  })
})

describe('attributionForTile', () => {
  it('FE-UTIL-BASEMAP-009: OpenFreeMap gets its own credit', () => {
    // Printing OpenStreetMap alone under these tiles is a licence problem: the
    // data is OSM, but the rendering and hosting are not.
    expect(attributionForTile(OFM_POSITRON)).toBe(OFM_ATTRIBUTION)
    expect(attributionForTile(OFM_POSITRON)).toContain('OpenMapTiles')
    expect(attributionForTile(CUSTOM)).toMatch(/OpenStreetMap/)
    expect(attributionForTile(null)).toMatch(/OpenStreetMap/)
  })
})
