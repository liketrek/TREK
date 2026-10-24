import { Utensils, Coffee, Wine, BedDouble, Camera, Landmark, Trees, Ticket, Fuel, Zap, ParkingSquare, Tent, Binoculars, Mountain, Warehouse, Droplet, Toilet, Sandwich, Anchor, Sailboat, Wrench, Store, BatteryCharging, type LucideIcon } from 'lucide-react'
import type { TourPoiCategory } from '@trek/shared'
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

const CORE_COLOR = new Map(POI_CATEGORIES.map(c => [c.key, c.color] as const))
const coreColor = (key: string) => CORE_COLOR.get(key) ?? POI_DEFAULT_COLOR

/**
 * What a hike, a ride or a paddle tour stops for (PLN-02), searched along a tour in the
 * planner and drawn on its map. Each takes the colour of the explore category
 * it is closest to, so the map keeps one palette.
 */
export const TOUR_POI_LOOKS: Record<TourPoiCategory, PoiCategory> = {
  viewpoint: { key: 'viewpoint', labelKey: 'tours.poi.cat.viewpoint', Icon: Binoculars, color: coreColor('sights') },
  peak: { key: 'peak', labelKey: 'tours.poi.cat.peak', Icon: Mountain, color: coreColor('nature') },
  shelter: { key: 'shelter', labelKey: 'tours.poi.cat.shelter', Icon: Warehouse, color: HOTEL_COLOR },
  drinking_water: { key: 'drinking_water', labelKey: 'tours.poi.cat.drinking_water', Icon: Droplet, color: coreColor('museum') },
  food: { key: 'food', labelKey: 'tours.poi.cat.food', Icon: Utensils, color: coreColor('restaurant') },
  toilets: { key: 'toilets', labelKey: 'tours.poi.cat.toilets', Icon: Toilet, color: coreColor('bar') },
  picnic: { key: 'picnic', labelKey: 'tours.poi.cat.picnic', Icon: Sandwich, color: coreColor('nature') },
  campsite: { key: 'campsite', labelKey: 'tours.poi.cat.campsite', Icon: Tent, color: coreColor('activity') },
  sights: { key: 'sights', labelKey: 'tours.poi.cat.sights', Icon: Camera, color: coreColor('sights') },
  slipway: { key: 'slipway', labelKey: 'tours.poi.cat.slipway', Icon: Anchor, color: coreColor('museum') },
  boat_rental: { key: 'boat_rental', labelKey: 'tours.poi.cat.boat_rental', Icon: Sailboat, color: coreColor('cafe') },
  bike_repair: { key: 'bike_repair', labelKey: 'tours.poi.cat.bike_repair', Icon: Wrench, color: coreColor('activity') },
  // CW-05: a city walk's own, each in the colour of the explore category it comes from.
  museum: { key: 'museum', labelKey: 'tours.poi.cat.museum', Icon: Landmark, color: coreColor('museum') },
  park: { key: 'park', labelKey: 'tours.poi.cat.park', Icon: Trees, color: coreColor('nature') },
  cafe: { key: 'cafe', labelKey: 'tours.poi.cat.cafe', Icon: Coffee, color: coreColor('cafe') },
  restaurant: { key: 'restaurant', labelKey: 'tours.poi.cat.restaurant', Icon: Utensils, color: coreColor('restaurant') },
  market: { key: 'market', labelKey: 'tours.poi.cat.market', Icon: Store, color: coreColor('shopping') },
  // BIK-07: the road trip's charging colour, so a charger reads as one on every map.
  ebike_charging: { key: 'ebike_charging', labelKey: 'tours.poi.cat.ebike_charging', Icon: BatteryCharging, color: SERVICE_COLORS.charging },
}

// A Map rather than an object, so a category named after an Object.prototype member
// (`constructor`, `toString`) finds nothing rather than a function. A Tours category
// that shares a key with an explore one (`sights`, `campsite`) keeps the explore look.
const CATEGORY_BY_KEY = new Map(
  [...Object.values(TOUR_POI_LOOKS), ...POI_CATEGORIES, ...ROADTRIP_POI_CATEGORIES].map(c => [c.key, c] as const),
)

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
