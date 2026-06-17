import { Hotel, Utensils, ShoppingCart, Bus, Plane, Ticket, Camera, ShoppingBag, FileText, HeartPulse, Coins, MoreHorizontal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { COST_CATEGORIES, type CostCategory } from '@trek/shared'

/**
 * The fixed Costs categories. Users can't add their own — every expense maps to
 * one of these. Category colour is the one place an accent is allowed (it
 * visualises the category); everything else stays black/white. The label comes
 * from i18n (`costs.cat.*`).
 */
export interface CostCategoryMeta {
  key: CostCategory
  labelKey: string
  Icon: LucideIcon
  color: string
}

export const COST_CAT_META: Record<CostCategory, CostCategoryMeta> = {
  accommodation: { key: 'accommodation', labelKey: 'costs.cat.accommodation', Icon: Hotel, color: '#16a34a' },
  food:          { key: 'food',          labelKey: 'costs.cat.food',          Icon: Utensils, color: '#ea580c' },
  groceries:     { key: 'groceries',     labelKey: 'costs.cat.groceries',     Icon: ShoppingCart, color: '#65a30d' },
  transport:     { key: 'transport',     labelKey: 'costs.cat.transport',     Icon: Bus, color: '#2563eb' },
  flights:       { key: 'flights',       labelKey: 'costs.cat.flights',       Icon: Plane, color: '#0ea5e9' },
  activities:    { key: 'activities',    labelKey: 'costs.cat.activities',    Icon: Ticket, color: '#9333ea' },
  sightseeing:   { key: 'sightseeing',   labelKey: 'costs.cat.sightseeing',   Icon: Camera, color: '#db2777' },
  shopping:      { key: 'shopping',      labelKey: 'costs.cat.shopping',      Icon: ShoppingBag, color: '#e11d48' },
  fees:          { key: 'fees',          labelKey: 'costs.cat.fees',          Icon: FileText, color: '#475569' },
  health:        { key: 'health',        labelKey: 'costs.cat.health',        Icon: HeartPulse, color: '#dc2626' },
  tips:          { key: 'tips',          labelKey: 'costs.cat.tips',          Icon: Coins, color: '#d97706' },
  other:         { key: 'other',         labelKey: 'costs.cat.other',         Icon: MoreHorizontal, color: '#6b7280' },
}

export const COST_CATEGORY_LIST: CostCategoryMeta[] = COST_CATEGORIES.map(k => COST_CAT_META[k])

/**
 * Legacy / English free-text categories (and reservation type labels) mapped to
 * the fixed keys. Bookings used to store labels like "Flight"/"Train"/"Other",
 * which never matched the lowercase keys and fell through to `other`.
 */
const LEGACY_CATEGORY_MAP: Record<string, CostCategory> = {
  flight: 'flights', flights: 'flights', plane: 'flights', flug: 'flights',
  train: 'transport', bus: 'transport', car: 'transport', 'car rental': 'transport',
  ferry: 'transport', boat: 'transport', taxi: 'transport', transfer: 'transport',
  transport: 'transport', transportation: 'transport',
  hotel: 'accommodation', accommodation: 'accommodation', lodging: 'accommodation', hostel: 'accommodation',
  restaurant: 'food', food: 'food', dining: 'food', meal: 'food', meals: 'food',
  grocery: 'groceries', groceries: 'groceries',
  activity: 'activities', activities: 'activities',
  sightseeing: 'sightseeing', sights: 'sightseeing',
  shop: 'shopping', shopping: 'shopping',
  fee: 'fees', fees: 'fees',
  health: 'health', medical: 'health',
  tip: 'tips', tips: 'tips',
  other: 'other', misc: 'other',
}

/** Map any stored category (incl. legacy/localized free-text values) to a known meta. */
export function catMeta(cat: string | null | undefined): CostCategoryMeta {
  if (!cat) return COST_CAT_META.other
  if (cat in COST_CAT_META) return COST_CAT_META[cat as CostCategory]
  const mapped = LEGACY_CATEGORY_MAP[cat.trim().toLowerCase()]
  return mapped ? COST_CAT_META[mapped] : COST_CAT_META.other
}
