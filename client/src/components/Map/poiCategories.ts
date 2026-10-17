import { Utensils, Coffee, Wine, BedDouble, Camera, Landmark, Trees, Ticket, Fuel, Zap, ParkingSquare, Tent, type LucideIcon } from 'lucide-react'
import { parsePluginPoiCategoryKey, type PluginPoiDetail } from '@trek/shared'
// The road-trip kinds take their colour from the one place that defines it, so the
// search result, the map pin and the road-trip rail cannot drift apart.
import { SERVICE_COLORS } from '../Roadtrip/roadtripModel'
import { CORRIDOR_CATEGORIES, HOTEL_COLOR } from '../Roadtrip/stopKinds'
import { POI_DEFAULT_COLOR, pluginPoiColor, resolvePluginPoiIcon } from './pluginPoiIcons'

// The POI categories shown in the map "explore" pill. The `key` is the contract
// with the server (CATEGORY_OSM_FILTERS in mapsService.ts) — the OSM tag mapping
// lives there; label/icon/colour live here. `color` doubles as the active-pill
// fill AND the marker colour, so the pill and the map agree visually.
export interface PoiCategory {
  key: string
  labelKey: string
  Icon: LucideIcon
  color: string
}

export const POI_CATEGORIES: PoiCategory[] = [
  { key: 'restaurant', labelKey: 'poi.cat.restaurants', Icon: Utensils, color: '#EF4444' },
  { key: 'cafe', labelKey: 'poi.cat.cafes', Icon: Coffee, color: '#B45309' },
  { key: 'bar', labelKey: 'poi.cat.bars', Icon: Wine, color: '#A855F7' },
  // The colour lives with the road-trip categories, because the corridor search offers
  // the same one and two definitions of a blue is how they drift apart.
  { key: 'hotel', labelKey: 'poi.cat.hotels', Icon: BedDouble, color: HOTEL_COLOR },
  { key: 'sights', labelKey: 'poi.cat.sights', Icon: Camera, color: '#EC4899' },
  { key: 'museum', labelKey: 'poi.cat.museums', Icon: Landmark, color: '#6366F1' },
  { key: 'nature', labelKey: 'poi.cat.nature', Icon: Trees, color: '#16A34A' },
  { key: 'activity', labelKey: 'poi.cat.activities', Icon: Ticket, color: '#F59E0B' },
]

/**
 * What a drive needs. Kept out of POI_CATEGORIES on purpose: these are not offered by
 * the explore pill, they are what the road trip corridor searches for. They are in the
 * lookup below all the same, so a hit drawn on the map gets its own icon and colour
 * instead of the nameless grey dot an unknown category falls back to.
 */
export const ROADTRIP_POI_CATEGORIES: PoiCategory[] = CORRIDOR_CATEGORIES.map(
  ({ key, labelKey, Icon, color }) => ({ key, labelKey, Icon, color }),
)

// A Map rather than an object, so a category named after an Object.prototype member
// (`constructor`, `toString`) finds nothing rather than a function.
const CATEGORY_BY_KEY = new Map([...POI_CATEGORIES, ...ROADTRIP_POI_CATEGORIES].map(c => [c.key, c] as const))

// One POI result from /api/maps/pois (mirror of the server's OverpassPoi).
export interface Poi {
  osm_id: string
  name: string
  lat: number
  lng: number
  category: string
  poi_type: string
  /** Brand name and its Wikidata id, when OSM carries them (road categories mostly do). */
  brand?: string | null
  brand_wikidata?: string | null
  address: string | null
  website: string | null
  phone: string | null
  opening_hours: string | null
  cuisine: string | null
  /**
   * What a charging station offers, when it is one and OSM says so.
   *
   * Optional twice over: only charging hits carry it at all, and OSM knows a socket type
   * for roughly a third of them, a capacity for about seven in ten. "Not stated" is its
   * own answer here and must not be read as a no.
   */
  charging?: {
    sockets: { type: string; count: number | null; kw: number | null }[]
    capacity: number | null
    fee: boolean | null
  } | null
  source: string
  pluginId?: string
  rating?: number | null
  /**
   * Only on a POI from a plugin category (GET /api/plugin-pois): what the plugin knows
   * that open data does not, and the declaring category's icon and colour. Plugin text
   * and a plugin value either way, so they are drawn through poiAppearance and
   * textContent, never straight into markup.
   */
  details?: PluginPoiDetail[]
  icon?: string
  color?: string
}

/** What a POI pin and its hover card are drawn with. */
export interface PoiAppearance {
  color: string
  /** Null for a category nobody knows, which is drawn as a plain grey disc. */
  Icon: LucideIcon | null
}

/**
 * How to draw `poi`. A core or road trip category has its own look; a plugin category
 * has the one its POI carries, checked again here (a colour that is not `#rrggbb`
 * turns grey, an icon off the allow-list turns into a pin); anything else is the grey
 * disc an unknown category has always been. Keyed by the category rather than by
 * `pluginId`, because a plugin's hit in the road trip corridor search answers a core
 * category and is drawn like one.
 */
export function poiAppearance(poi: Pick<Poi, 'category' | 'icon' | 'color'>): PoiAppearance {
  const core = CATEGORY_BY_KEY.get(poi.category)
  if (core) return { color: core.color, Icon: core.Icon }
  if (parsePluginPoiCategoryKey(poi.category)) {
    return { color: pluginPoiColor(poi.color), Icon: resolvePluginPoiIcon(poi.icon) }
  }
  return { color: POI_DEFAULT_COLOR, Icon: null }
}
