import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTileUrl, useCartoApiKey } from './useTileUrl'
import { useSettingsStore } from '../store/settingsStore'
import { CARTO_LIGHT, CARTO_DARK } from '../constants/mapDefaults'
import type { Settings } from '../types'

const OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const SELF_HOSTED = 'https://tiles.example.com/{z}/{x}/{y}.png'

const initialState = useSettingsStore.getState()

function setSettings(patch: Partial<Settings>) {
  useSettingsStore.setState((s) => ({ settings: { ...s.settings, ...patch } }))
}

describe('useTileUrl', () => {
  beforeEach(() => {
    useSettingsStore.setState(initialState, true)
  })

  it('FE-TILEURL-001: falls back to the caller default while nothing is configured', () => {
    const { result } = renderHook(() => useTileUrl(OSM))
    expect(result.current).toBe(OSM)
  })

  it('FE-TILEURL-002: the user template wins over the fallback', () => {
    setSettings({ map_tile_url: SELF_HOSTED })
    const { result } = renderHook(() => useTileUrl(CARTO_LIGHT))
    expect(result.current).toBe(SELF_HOSTED)
  })

  it('FE-TILEURL-003: appends the CARTO key to a CARTO fallback', () => {
    setSettings({ carto_api_key: 'abc123' })
    const { result } = renderHook(() => useTileUrl(CARTO_LIGHT))
    expect(result.current).toBe(`${CARTO_LIGHT}?key=abc123`)
  })

  it('FE-TILEURL-004: keeps the key away from a self-hosted template', () => {
    setSettings({ map_tile_url: SELF_HOSTED, carto_api_key: 'abc123' })
    const { result } = renderHook(() => useTileUrl(CARTO_LIGHT))
    expect(result.current).toBe(SELF_HOSTED)
  })

  it('FE-TILEURL-005: ignoreUserTemplate pins the fallback but still gets the key', () => {
    // Atlas and collections pin a basemap of their own; they must not lose the
    // key just because they ignore map_tile_url.
    setSettings({ map_tile_url: SELF_HOSTED, carto_api_key: 'abc123' })
    const { result } = renderHook(() => useTileUrl(CARTO_DARK, true))
    expect(result.current).toBe(`${CARTO_DARK}?key=abc123`)
  })

  it('FE-TILEURL-006: normalizes a legacy sharded OSM template', () => {
    setSettings({ map_tile_url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' })
    const { result } = renderHook(() => useTileUrl(CARTO_LIGHT))
    expect(result.current).toBe(OSM)
  })

  it('FE-TILEURL-007: follows a key change without a remount', () => {
    setSettings({ carto_api_key: 'first' })
    const { result } = renderHook(() => useTileUrl(CARTO_LIGHT))
    expect(result.current).toBe(`${CARTO_LIGHT}?key=first`)

    act(() => setSettings({ carto_api_key: 'second' }))
    expect(result.current).toBe(`${CARTO_LIGHT}?key=second`)

    act(() => setSettings({ carto_api_key: '' }))
    expect(result.current).toBe(CARTO_LIGHT)
  })

  it('FE-TILEURL-008: follows a template change without a remount', () => {
    const { result } = renderHook(() => useTileUrl(CARTO_LIGHT))
    act(() => setSettings({ map_tile_url: SELF_HOSTED }))
    expect(result.current).toBe(SELF_HOSTED)
  })
})

describe('useCartoApiKey', () => {
  beforeEach(() => {
    useSettingsStore.setState(initialState, true)
  })

  it('FE-TILEURL-009: reports an empty string while no key is stored', () => {
    setSettings({ carto_api_key: undefined })
    const { result } = renderHook(() => useCartoApiKey())
    expect(result.current).toBe('')
  })

  it('FE-TILEURL-010: reports the stored key', () => {
    setSettings({ carto_api_key: 'abc123' })
    const { result } = renderHook(() => useCartoApiKey())
    expect(result.current).toBe('abc123')
  })
})
