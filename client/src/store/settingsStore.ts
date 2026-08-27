import { create } from 'zustand'
import { settingsApi } from '../api/client'
import type { Settings } from '../types'
import { DEFAULT_APPEARANCE } from '@trek/shared'
import { getApiErrorMessage } from '../types'
import { SUPPORTED_LANGUAGE_CODES } from '../i18n/supportedLanguages'
import { normalizeTileUrl, stripTileApiKey } from '../utils/tileUrl'
import { clearTileCache } from '../sync/tilePrefetcher'
import { rememberStartDestination, DEFAULT_START_PAGE, DEFAULT_START_TRIP_TAB } from '../utils/startDestination'

interface SettingsState {
  settings: Settings
  isLoaded: boolean

  loadSettings: () => Promise<void>
  updateSetting: (key: keyof Settings, value: Settings[keyof Settings]) => Promise<void>
  setLanguageLocal: (lang: string) => void
  setLanguageTransient: (lang: string) => void
  updateSettings: (settingsObj: Partial<Settings>) => Promise<void>
}

// Returns true when the user has explicitly chosen a language (persisted in localStorage).
// Use this instead of reading localStorage directly so the key stays encapsulated here.
export const hasStoredLanguage = (): boolean =>
  typeof localStorage !== 'undefined' && !!localStorage.getItem('app_language')

// The effective client-side defaults for a fresh instance. The server sends no value for
// a setting an admin hasn't defaulted (see settingsService.getAdminUserDefaults), so these
// are what a brand-new user actually sees. Keep them internally consistent — one
// measurement system, not °F alongside kilometres — and note that DisplaySettingsTab
// imports these same values for its fallbacks, so the store default and the UI fallback
// can't drift apart again.
export const DEFAULT_SETTINGS: Settings = {
  map_tile_url: '',
  dark_mode: false,
  // Empty = no personal display currency, so Costs falls back to the trip's own.
  default_currency: '',
  language: localStorage.getItem('app_language') || 'en',
  temperature_unit: 'celsius',
  distance_unit: 'metric',
  time_format: '24h',
  show_place_description: false,
  optimize_from_accommodation: true,
  map_provider: 'leaflet',
  map_base_layer: 'default',
  map_poi_pill_enabled: true,
  carto_api_key: '',
  mapbox_access_token: '',
  mapbox_style: 'mapbox://styles/mapbox/standard',
  maplibre_style: '',
  mapbox_3d_enabled: true,
  mapbox_quality_mode: false,
  dashboard_fx_from: 'EUR',
  dashboard_fx_to: 'USD',
  start_page: DEFAULT_START_PAGE,
  start_trip_tab: DEFAULT_START_TRIP_TAB,
  appearance: DEFAULT_APPEARANCE,
  // dashboard_timezones is intentionally left unset so the widget can tell "never
  // chosen" (fall back to home + defaults) from an explicitly emptied list.
}

// De-dupe concurrent loads: the reconnection triggers (online / visibility /
// periodic) can all fire a retry at once — collapse them into one in-flight GET.
let _loadInFlight: Promise<void> | null = null

// Every tile consumer (planner map, journey map, tile prefetcher, the settings
// preview) reads the template from this store, so the retired
// {s}.tile.openstreetmap.org host is rewritten here — on the way in from the
// server and on the way out to it. Rewriting only on read would let a template
// typed by hand survive in the database until the next load put it back (#1733).
function withNormalizedTileUrl<T extends Partial<Settings>>(patch: T): T {
  if (typeof patch.map_tile_url !== 'string') return patch
  return { ...patch, map_tile_url: cleanTileTemplate(patch.map_tile_url) }
}

// A CARTO key pasted along with a full tile URL is dropped here: the key lives
// in its own setting and is appended at render time, so leaving it in the
// template would freeze it into the saved value and break on the next rotation.
function cleanTileTemplate(url: string): string {
  return stripTileApiKey(normalizeTileUrl(url))
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  isLoaded: false,

  loadSettings: async () => {
    if (_loadInFlight !== null) return _loadInFlight
    _loadInFlight = (async () => {
      try {
        const data = await settingsApi.get()
        // Rewritten here so the Map settings input already shows the host that
        // still resolves, and persists it on the next save.
        const incoming = withNormalizedTileUrl({ ...data.settings } as Partial<Settings>)
        set((state) => ({
          settings: { ...state.settings, ...incoming },
          isLoaded: true,
        }))
        // The startup redirect runs before this ever resolves, so keep a mirror
        // it can read synchronously on the next launch.
        rememberStartDestination(incoming)
      } catch (err: unknown) {
        // Leave isLoaded false so a transient failure — offline at launch, or a
        // (docker) server cold-start racing the first request — is retried on
        // reconnect instead of stranding the user on built-in defaults (wrong
        // currency/units) for the whole session (#1618).
        console.error('Failed to load settings:', err)
      } finally {
        _loadInFlight = null
      }
    })()
    return _loadInFlight
  },

  updateSetting: async (key: keyof Settings, value: Settings[keyof Settings]) => {
    const next =
      key === 'map_tile_url' && typeof value === 'string' ? cleanTileTemplate(value) : value
    if (key === 'carto_api_key' && next !== get().settings.carto_api_key) void clearTileCache()
    set((state) => ({
      settings: { ...state.settings, [key]: next },
    }))
    if (key === 'language') localStorage.setItem('app_language', next as string)
    rememberStartDestination({ [key]: next } as Partial<Settings>)
    try {
      await settingsApi.set(key, next)
    } catch (err: unknown) {
      console.error('Failed to save setting:', err)
      throw new Error(getApiErrorMessage(err, 'Error saving setting'))
    }
  },

  setLanguageLocal: (lang: string) => {
    localStorage.setItem('app_language', lang)
    set((state) => ({ settings: { ...state.settings, language: lang } }))
  },

  // Applies a language for the current session without persisting to localStorage.
  // Used for automatic detection (browser/server default) — only explicit user
  // choices via the UI should be persisted.
  setLanguageTransient: (lang: string) => {
    if (!SUPPORTED_LANGUAGE_CODES.includes(lang)) return
    set((state) => ({ settings: { ...state.settings, language: lang } }))
  },

  updateSettings: async (settingsObj: Partial<Settings>) => {
    const patch = withNormalizedTileUrl(settingsObj)
    // Cached tiles are keyed by their full URL, so a new key leaves the whole
    // offline cache stranded behind the old one.
    if ('carto_api_key' in patch && patch.carto_api_key !== get().settings.carto_api_key) {
      void clearTileCache()
    }
    set((state) => ({
      settings: { ...state.settings, ...patch },
    }))
    rememberStartDestination(patch)
    try {
      await settingsApi.setBulk(patch)
    } catch (err: unknown) {
      console.error('Failed to save settings:', err)
      throw new Error(getApiErrorMessage(err, 'Error saving settings'))
    }
  },
}))
