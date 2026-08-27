import { useMemo } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { resolveTileUrl } from '../utils/tileUrl'

/**
 * Every logged-in map reads its tile template through here so the CARTO key
 * reaches all of them, including the ones that ignore map_tile_url and pin a
 * basemap of their own (atlas, collections).
 */
export function useTileUrl(fallback: string, ignoreUserTemplate = false): string {
  const template = useSettingsStore((s) => s.settings.map_tile_url)
  const cartoKey = useSettingsStore((s) => s.settings.carto_api_key)
  return useMemo(
    () => resolveTileUrl(ignoreUserTemplate ? '' : template, fallback, cartoKey),
    [template, fallback, cartoKey, ignoreUserTemplate]
  )
}

export function useCartoApiKey(): string {
  return useSettingsStore((s) => s.settings.carto_api_key) ?? ''
}
