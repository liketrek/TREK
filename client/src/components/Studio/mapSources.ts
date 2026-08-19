import type { BookFrame } from '@trek/shared'
import { useSettingsStore } from '../../store/settingsStore'
import { attributionFor, staticMapUrl } from './mapTiles'
import { normalizeTileUrl } from '../../utils/tileUrl'

/**
 * Which map sources this instance can actually offer.
 *
 * TREK already knows: an admin has configured a tile template, and possibly a
 * Mapbox token and style, for the planner and Atlas. Studio reads the same
 * settings rather than asking again — a second place to paste a token is a
 * second place for it to be wrong.
 *
 * A source with nothing behind it is not offered. Showing "Mapbox" to someone
 * with no token produces an element that renders grey, and no message anywhere
 * explains why.
 */

export interface MapSourceOption {
  id: 'vector' | 'tiles' | 'static'
  /** i18n key for the name. */
  labelKey: string
  /** The tile template or static URL to freeze into the element. */
  url: string
  attribution: string
}

/** The default tile template, when the instance has not set its own. */
const DEFAULT_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

export function useMapSources(frame: BookFrame, points: { lat: number; lng: number }[]): MapSourceOption[] {
  const settings = useSettingsStore(s => s.settings)

  // Through the same normaliser the planner's map uses: a template saved
  // before OSM dropped its shards still names a host that no longer exists.
  const tiles = normalizeTileUrl((settings.map_tile_url || '').trim()) || DEFAULT_TILES
  const out: MapSourceOption[] = [
    { id: 'vector', labelKey: 'journey.studio.mapSourceVector', url: '', attribution: '' },
    { id: 'tiles', labelKey: 'journey.studio.mapSourceTiles', url: tiles, attribution: attributionFor(tiles) },
  ]

  // Millimetres to pixels at roughly 200dpi — enough for print without asking
  // the API for more than it will give.
  const token = (settings.mapbox_access_token || '').trim()
  if (token) {
    const url = staticMapUrl({
      points,
      style: settings.mapbox_style || '',
      token,
      width: frame.w * 7.9,
      height: frame.h * 7.9,
    })
    if (url) {
      out.push({
        id: 'static',
        labelKey: 'journey.studio.mapSourceStatic',
        url,
        attribution: attributionFor(url),
      })
    }
  }

  return out
}
