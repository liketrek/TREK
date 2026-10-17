import { createElement } from 'react'
import { PLUGIN_POI_DETAILS_MAX, isPluginPoiIcon, parsePluginPoiCategoryKey, type PluginPoiDetail } from '@trek/shared'
import { renderIconMarkup } from '../../utils/iconMarkup'
import { poiAppearance, type Poi } from './poiCategories'
import { pluginPoiColor } from './pluginPoiIcons'

/**
 * What an explore POI pin is drawn with, for both map renderers (the Leaflet divIcon
 * and the GL marker element), so the two cannot draw one POI two ways.
 *
 * Each renderer keeps its own disc markup around these parts, because the two have
 * always differed by a style or two and a core pin has to come out exactly as it did.
 */

type PoiLook = Pick<Poi, 'category' | 'icon' | 'color'>

/**
 * The disc colour and the white glyph inside it. The colour has been through
 * poiAppearance, so a plugin value that is not `#rrggbb` never reaches the markup it is
 * written into; an unknown category has no glyph.
 */
export function poiPinParts(poi: PoiLook): { color: string; svg: string } {
  const { color, Icon } = poiAppearance(poi)
  const svg = Icon ? renderIconMarkup(createElement(Icon, { size: 13, color: 'white', strokeWidth: 2.5 })) : ''
  return { color, svg }
}

/**
 * What a cached pin is looked up by. A core category is drawn the same way every time,
 * so its key alone is enough. A plugin category is drawn from what its POI carries, and
 * the plugin can change that with an update, so its key adds the checked colour and
 * icon: a pin cached before the update is never handed out after it.
 */
export function poiPinCacheKey(poi: PoiLook): string {
  if (!parsePluginPoiCategoryKey(poi.category)) return poi.category
  const icon = isPluginPoiIcon(poi.icon) ? poi.icon : ''
  return `${poi.category}|${pluginPoiColor(poi.color)}|${icon}`
}

/** One detail row told apart from the others, for a React key. */
export function poiDetailRowKey(row: PluginPoiDetail): string {
  return `${row.label}\n${row.value}`
}

/**
 * The plugin's detail rows to show on the hover card, at most as many as the contract
 * allows and each one once. Plugin text, so every renderer writes it as text (React or
 * escapeHtml), never as markup. Empty for a core POI, which has none.
 */
export function poiDetailRows(poi: Pick<Poi, 'details'>): PluginPoiDetail[] {
  if (!Array.isArray(poi.details)) return []
  const seen = new Set<string>()
  return poi.details.slice(0, PLUGIN_POI_DETAILS_MAX).filter(row => {
    const key = poiDetailRowKey(row)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
