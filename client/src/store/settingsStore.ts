import { create } from 'zustand'
import { settingsApi } from '../api/client'
import type { Settings } from '../types'
import { DEFAULT_APPEARANCE } from '@trek/shared'
import { getApiErrorMessage } from '../types'
import { SUPPORTED_LANGUAGE_CODES } from '../i18n/supportedLanguages'

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

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {
    map_tile_url: '',
    dark_mode: false,
    // Empty = no personal display currency, so Costs falls back to the trip's own.
    default_currency: '',
    language: localStorage.getItem('app_language') || 'en',
    temperature_unit: 'fahrenheit',
    distance_unit: 'metric',
    time_format: '12h',
    show_place_description: false,
    optimize_from_accommodation: true,
    map_provider: 'leaflet',
    map_poi_pill_enabled: true,
    mapbox_access_token: '',
    mapbox_style: 'mapbox://styles/mapbox/standard',
    maplibre_style: '',
    mapbox_3d_enabled: true,
    mapbox_quality_mode: false,
    dashboard_fx_from: 'EUR',
    dashboard_fx_to: 'USD',
    appearance: DEFAULT_APPEARANCE,
    // dashboard_timezones is intentionally left unset so the widget can tell "never
    // chosen" (fall back to home + defaults) from an explicitly emptied list.
  },
  isLoaded: false,

  loadSettings: async () => {
    try {
      const data = await settingsApi.get()
      set((state) => ({
        settings: { ...state.settings, ...data.settings },
        isLoaded: true,
      }))
    } catch (err: unknown) {
      set({ isLoaded: true })
      console.error('Failed to load settings:', err)
    }
  },

  updateSetting: async (key: keyof Settings, value: Settings[keyof Settings]) => {
    set((state) => ({
      settings: { ...state.settings, [key]: value },
    }))
    if (key === 'language') localStorage.setItem('app_language', value as string)
    try {
      await settingsApi.set(key, value)
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
    set((state) => ({
      settings: { ...state.settings, ...settingsObj },
    }))
    try {
      await settingsApi.setBulk(settingsObj)
    } catch (err: unknown) {
      console.error('Failed to save settings:', err)
      throw new Error(getApiErrorMessage(err, 'Error saving settings'))
    }
  },
}))
