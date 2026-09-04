import { Utensils, Coffee, Wine, BedDouble, Camera, Landmark, Trees, Ticket, Fuel, Zap, ParkingSquare, Tent, type LucideIcon } from 'lucide-react'
// The road-trip kinds take their colour from the one place that defines it, so the
// search result, the map pin and the road-trip rail cannot drift apart.
import { SERVICE_COLORS } from '../Roadtrip/roadtripModel'
import { STOP_KINDS } from '../Roadtrip/stopKinds'

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
  { key: 'hotel', labelKey: 'poi.cat.hotels', Icon: BedDouble, color: '#2563EB' },
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
export const ROADTRIP_POI_CATEGORIES: PoiCategory[] = STOP_KINDS.map(
  ({ key, labelKey, Icon, color }) => ({ key, labelKey, Icon, color }),
)

export const POI_CATEGORY_BY_KEY: Record<string, PoiCategory> = Object.fromEntries(
  [...POI_CATEGORIES, ...ROADTRIP_POI_CATEGORIES].map(c => [c.key, c]),
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
  source: 'openstreetmap'
}
