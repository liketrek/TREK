import {
  BedDouble, Bike, Bookmark, Camera, CheckCircle2, Circle, CircleSlash, Coffee,
  Landmark, MapPin, ShoppingBag, TrainFront, Trees, Umbrella, Utensils,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CollectionStatus } from '@trek/shared'
import { getCategoryIcon } from '../../../components/shared/categoryIcons'

/**
 * Presentation canon of the mobile collections design: the app-wide category
 * colour table and the status colour/icon triple. Category names not in the
 * table (custom admin categories) fall back to their own DB colour/icon.
 */

export interface MCategoryMeta {
  color: string
  icon: LucideIcon
}

/** Canonical category colours + icons of the mobile design. The hex values
 * are design canon (identical in light and dark), so theme-lint is waived. */
export const CATEGORY_SPEC: Record<string, MCategoryMeta> = {
  Activity: { color: '#4A7DDB', icon: Bike }, // theme-lint-disable
  Attraction: { color: '#EC4899', icon: Camera }, // theme-lint-disable
  'Bar/Cafe': { color: '#B4762E', icon: Coffee }, // theme-lint-disable
  Beach: { color: '#0EA5A0', icon: Umbrella }, // theme-lint-disable
  Hotel: { color: '#9B5DE5', icon: BedDouble }, // theme-lint-disable
  Nature: { color: '#2FA37A', icon: Trees }, // theme-lint-disable
  Other: { color: '#68686F', icon: MapPin }, // theme-lint-disable
  Restaurant: { color: '#E8843D', icon: Utensils }, // theme-lint-disable
  Shopping: { color: '#D6273B', icon: ShoppingBag }, // theme-lint-disable
  Transport: { color: '#4A7DDB', icon: TrainFront }, // theme-lint-disable
}

/** Fallback for places without a category (list rows / pills). */
export const UNCATEGORIZED_META: MCategoryMeta = { color: '#9A9AA1', icon: Landmark } // theme-lint-disable

/** The "No category" option in pickers. */
export const NO_CATEGORY_META: MCategoryMeta = { color: '#9A9AA1', icon: CircleSlash } // theme-lint-disable

interface CategoryLike {
  name?: string | null
  color?: string | null
  icon?: string | null
}

/** Colour + icon for a place's category; null when it has none. */
export function categoryMeta(category: CategoryLike | null | undefined): MCategoryMeta | null {
  if (!category || !category.name) return null
  const spec = CATEGORY_SPEC[category.name]
  if (spec) return spec
  return {
    color: category.color || UNCATEGORIZED_META.color,
    icon: getCategoryIcon(category.icon ?? undefined),
  }
}

export interface MStatusMeta {
  color: string
  icon: LucideIcon
  labelKey: string
}

/** Status canon: Idea → Want to go → Visited. */
export const STATUS_SPEC: Record<CollectionStatus, MStatusMeta> = {
  idea: { color: '#9A9AA1', icon: Circle, labelKey: 'collections.status.idea' }, // theme-lint-disable
  want: { color: '#4A7DDB', icon: Bookmark, labelKey: 'collections.status.want' }, // theme-lint-disable
  visited: { color: '#2FA37A', icon: CheckCircle2, labelKey: 'collections.status.visited' }, // theme-lint-disable
}

/** Hex + alpha-suffix tints the design uses for tiles/pills (e.g. #4A7DDB1f). */
export function tint(hex: string, alpha: string): string {
  return `${hex}${alpha}`
}

/** Swatch palette for list colours and labels. */
export const SWATCH_COLORS = ['#6366F1', '#38BDF8', '#2FA37A', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#64748B']

/** Cover fallback per list: a gradient built from the list colour. */
export function listCoverGradient(color: string | null | undefined): string {
  const c = color || '#6366F1'
  return `linear-gradient(115deg, ${c}, ${c}66)`
}
