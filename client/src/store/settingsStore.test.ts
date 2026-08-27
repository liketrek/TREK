import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DEFAULT_SETTINGS, useSettingsStore } from './settingsStore'
import { settingsApi } from '../api/client'
import { clearTileCache } from '../sync/tilePrefetcher'

vi.mock('../api/client', () => ({
  settingsApi: {
    get: vi.fn(),
    set: vi.fn().mockResolvedValue(undefined),
    setBulk: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('../sync/tilePrefetcher', () => ({
  clearTileCache: vi.fn().mockResolvedValue(undefined),
}))

// A fresh instance sends no value for a setting an admin hasn't defaulted, so DEFAULT_SETTINGS
// is what a brand-new user actually sees. These guard against the two regressions in the
// original bug: unit defaults that mix measurement systems (°F alongside kilometres), and a
// store default that silently disagrees with DisplaySettingsTab's fallback.
describe('settings defaults', () => {
  it('SETTINGS-DEFAULTS-001: the shipped unit defaults belong to one consistent system', () => {
    expect(DEFAULT_SETTINGS.temperature_unit).toBe('celsius')
    expect(DEFAULT_SETTINGS.distance_unit).toBe('metric')
    expect(DEFAULT_SETTINGS.time_format).toBe('24h')
  })

  it('SETTINGS-DEFAULTS-002: the store initialises from DEFAULT_SETTINGS, the same constant DisplaySettingsTab falls back to, so the two cannot drift apart', () => {
    const settings = useSettingsStore.getState().settings
    expect(settings.temperature_unit).toBe(DEFAULT_SETTINGS.temperature_unit)
    expect(settings.distance_unit).toBe(DEFAULT_SETTINGS.distance_unit)
    expect(settings.time_format).toBe(DEFAULT_SETTINGS.time_format)
  })

  it('SETTINGS-DEFAULTS-003: no CARTO key is shipped, so the field starts empty instead of undefined', () => {
    expect(DEFAULT_SETTINGS.carto_api_key).toBe('')
  })
})

// The CARTO key lives in its own setting and is appended at render time (#2054). Two things
// have to hold on the way out to the server: the key never gets frozen into the saved
// template, and a key change invalidates the tile cache, which is keyed by the full URL.
describe('settings tile template hygiene', () => {
  const initialState = useSettingsStore.getState()

  beforeEach(() => {
    vi.clearAllMocks()
    useSettingsStore.setState(initialState, true)
  })

  it('SETTINGS-TILE-001: a key pasted into the template is stripped before the template is stored', async () => {
    await useSettingsStore.getState().updateSetting(
      'map_tile_url',
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=pasted-secret',
    )
    const stored = useSettingsStore.getState().settings.map_tile_url
    expect(stored).toBe('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png')
    expect(stored).not.toContain('pasted-secret')
    expect(settingsApi.set).toHaveBeenCalledWith('map_tile_url', stored)
  })

  it('SETTINGS-TILE-002: a bulk save strips the key and normalizes the retired OSM shard host', async () => {
    await useSettingsStore.getState().updateSettings({
      map_tile_url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png?key=pasted-secret',
    })
    const stored = useSettingsStore.getState().settings.map_tile_url
    expect(stored).toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png')
    expect(settingsApi.setBulk).toHaveBeenCalledWith({ map_tile_url: stored })
  })

  it('SETTINGS-TILE-003: changing the CARTO key drops the tile cache', async () => {
    await useSettingsStore.getState().updateSetting('carto_api_key', 'fresh-key')
    expect(clearTileCache).toHaveBeenCalledTimes(1)
  })

  it('SETTINGS-TILE-004: re-saving the same key leaves the cache alone', async () => {
    await useSettingsStore.getState().updateSetting('carto_api_key', 'fresh-key')
    vi.mocked(clearTileCache).mockClear()
    await useSettingsStore.getState().updateSetting('carto_api_key', 'fresh-key')
    expect(clearTileCache).not.toHaveBeenCalled()
  })

  it('SETTINGS-TILE-005: a bulk save clears the cache only when the key actually moves', async () => {
    await useSettingsStore.getState().updateSettings({ carto_api_key: 'fresh-key' })
    expect(clearTileCache).toHaveBeenCalledTimes(1)

    vi.mocked(clearTileCache).mockClear()
    await useSettingsStore.getState().updateSettings({ map_tile_url: '' })
    expect(clearTileCache).not.toHaveBeenCalled()
  })
})
