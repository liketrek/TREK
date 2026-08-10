import { Utensils, Coffee, Wine, BedDouble, Camera, Landmark, Trees, Ticket, type LucideIcon } from 'lucide-react'
import { getCategoryIcon } from '../shared/categoryIcons'

// The POI categories shown in the map "explore" pill. The `key` is the contract
// with the server (CATEGORY_OSM_FILTERS in mapsService.ts) — the OSM tag mapping
// lives there; label/icon/colour live here. `color` doubles as the active-pill
// fill AND the marker colour, so the pill and the map agree visually.
export interface PoiCategory {
  key: string
  labelKey?: string
  label?: string
  Icon?: LucideIcon
  iconName?: string | null
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

export const POI_CATEGORY_BY_KEY: Record<string, PoiCategory> = Object.fromEntries(
  POI_CATEGORIES.map(c => [c.key, c]),
)

// One POI result from /api/maps/pois (mirror of the server's OverpassPoi).
export interface Poi {
  osm_id: string
  name: string
  lat: number
  lng: number
  category: string
  poi_type: string
  address: string | null
  website: string | null
  phone: string | null
  opening_hours: string | null
  cuisine: string | null
  source: 'openstreetmap' | 'plugin'
  description?: string | null
  category_label?: string | null
  category_icon?: string | null
  category_color?: string | null
}

export function resolvePoiCategory(poi: Pick<Poi, 'category' | 'category_label' | 'category_icon' | 'category_color'> | string): Required<Pick<PoiCategory, 'key' | 'color'>> & Pick<PoiCategory, 'label' | 'labelKey' | 'iconName' | 'Icon'> {
  if (typeof poi === 'string') {
    const cat = POI_CATEGORY_BY_KEY[poi]
    return {
      key: poi,
      label: cat?.label,
      labelKey: cat?.labelKey,
      iconName: cat?.iconName ?? null,
      Icon: cat?.Icon,
      color: cat?.color ?? '#6b7280',
    }
  }
  const builtIn = POI_CATEGORY_BY_KEY[poi.category]
  return {
    key: poi.category,
    label: poi.category_label ?? builtIn?.label,
    labelKey: builtIn?.labelKey,
    iconName: poi.category_icon ?? builtIn?.iconName ?? null,
    Icon: poi.category_icon ? getCategoryIcon(poi.category_icon) : builtIn?.Icon,
    color: poi.category_color ?? builtIn?.color ?? '#6b7280',
  }
}
