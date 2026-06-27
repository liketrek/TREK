import { describe, expect, it } from 'vitest'
import {
  MAPBOX_DEFAULT_STYLE,
  OPENFREEMAP_DEFAULT_STYLE,
  isOpenFreeMapStyle,
  normalizeStyleForProvider,
  styleForActiveProvider,
  basemapLanguage,
} from './glProviders'

describe('glProviders', () => {
  it('keeps OpenFreeMap styles for MapLibre', () => {
    const style = 'https://tiles.openfreemap.org/styles/bright'

    expect(normalizeStyleForProvider('maplibre-gl', style)).toBe(style)
  })

  it('falls back to OpenFreeMap for MapLibre styles outside the CSP allowlist', () => {
    expect(normalizeStyleForProvider('maplibre-gl', 'https://demotiles.maplibre.org/style.json')).toBe(
      OPENFREEMAP_DEFAULT_STYLE,
    )
    expect(normalizeStyleForProvider('maplibre-gl', MAPBOX_DEFAULT_STYLE)).toBe(OPENFREEMAP_DEFAULT_STYLE)
  })

  it('leaves Mapbox styles unchanged for Mapbox GL', () => {
    expect(normalizeStyleForProvider('mapbox-gl', MAPBOX_DEFAULT_STYLE)).toBe(MAPBOX_DEFAULT_STYLE)
  })

  it('matches the OpenFreeMap CSP host', () => {
    expect(isOpenFreeMapStyle('https://tiles.openfreemap.org/styles/liberty')).toBe(true)
    expect(isOpenFreeMapStyle('https://demotiles.maplibre.org/style.json')).toBe(false)
  })

  it('rejects host/userinfo spoofing and http downgrade', () => {
    expect(isOpenFreeMapStyle('https://tiles.openfreemap.org.evil.com/styles/x')).toBe(false)
    expect(isOpenFreeMapStyle('https://evil.com/@tiles.openfreemap.org/styles/x')).toBe(false)
    expect(isOpenFreeMapStyle('http://tiles.openfreemap.org/styles/liberty')).toBe(false)
    expect(isOpenFreeMapStyle('  https://tiles.openfreemap.org/styles/liberty  ')).toBe(true)
  })

  it('falls back to provider defaults for empty/whitespace styles', () => {
    expect(normalizeStyleForProvider('maplibre-gl', '')).toBe(OPENFREEMAP_DEFAULT_STYLE)
    expect(normalizeStyleForProvider('maplibre-gl', '   ')).toBe(OPENFREEMAP_DEFAULT_STYLE)
    expect(normalizeStyleForProvider('mapbox-gl', '')).toBe(MAPBOX_DEFAULT_STYLE)
    expect(normalizeStyleForProvider('mapbox-gl', null)).toBe(MAPBOX_DEFAULT_STYLE)
  })

  it('styleForActiveProvider reads each provider\'s own style slot', () => {
    const mb = 'mapbox://styles/me/custom'
    const ofm = 'https://tiles.openfreemap.org/styles/bright'
    expect(styleForActiveProvider('mapbox-gl', mb, ofm)).toBe(mb)
    expect(styleForActiveProvider('maplibre-gl', mb, ofm)).toBe(ofm)
    // An empty MapLibre slot falls back to the OpenFreeMap default, leaving mapbox untouched.
    expect(styleForActiveProvider('maplibre-gl', mb, '')).toBe(OPENFREEMAP_DEFAULT_STYLE)
  })

  it('basemapLanguage maps TREK UI codes to basemap label codes (#1299)', () => {
    // Pass-through for plain ISO 639-1 codes.
    expect(basemapLanguage('en')).toBe('en')
    expect(basemapLanguage('de')).toBe('de')
    expect(basemapLanguage('fr')).toBe('fr')
    // TREK-specific overrides.
    expect(basemapLanguage('br')).toBe('pt')
    expect(basemapLanguage('gr')).toBe('el')
    expect(basemapLanguage('zh')).toBe('zh-Hans')
    expect(basemapLanguage('zhTw')).toBe('zh-Hant')
    expect(basemapLanguage('zh-TW')).toBe('zh-Hant')
    // Falls back to English when unset.
    expect(basemapLanguage(undefined)).toBe('en')
    expect(basemapLanguage('')).toBe('en')
  })
})
