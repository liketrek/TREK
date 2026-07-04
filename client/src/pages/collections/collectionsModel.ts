import { Circle, Bookmark, CheckCircle2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CollectionPlace, CollectionStatus, CollectionLabel } from '@trek/shared'
import { COLLECTION_STATUSES } from '@trek/shared'
import type { StatusFilter } from '../../store/collectionStore'

/**
 * Pure data shaping + presentation metadata for the Collections page. No React
 * state/effects live here — see atlas/atlasModel.ts for the same split. The
 * page hook (useCollections) and the view components share these helpers.
 */

export interface StatusMeta {
  icon: LucideIcon
  /** i18n key for the human label. */
  labelKey: string
  /** CSS colour token / hex for the badge on a light/surface background. */
  color: string
  /** Brighter variant for a pill sitting over a photo cover / the hero scrim. */
  coverColor: string
}

export const STATUS_META: Record<CollectionStatus, StatusMeta> = {
  idea: { icon: Circle, labelKey: 'collections.status.idea', color: 'var(--text-muted)', coverColor: '#e5e7eb' },
  want: { icon: Bookmark, labelKey: 'collections.status.want', color: 'var(--accent)', coverColor: '#c7d2fe' },
  visited: { icon: CheckCircle2, labelKey: 'collections.status.visited', color: '#10b981', coverColor: '#6ee7b7' },
}

/** Stable order for the filter chips + the one-tap cycle. */
export const STATUS_ORDER: CollectionStatus[] = [...COLLECTION_STATUSES]

/** idea → want → visited → idea */
export function nextStatus(status: CollectionStatus): CollectionStatus {
  const i = STATUS_ORDER.indexOf(status)
  return STATUS_ORDER[(i + 1) % STATUS_ORDER.length]
}

/** Sort places by explicit sort_order, falling back to created_at (newest first). */
export function sortPlaces(places: CollectionPlace[]): CollectionPlace[] {
  return [...places].sort((a, b) => {
    const so = (a.sort_order ?? 0) - (b.sort_order ?? 0)
    if (so !== 0) return so
    return (b.created_at ?? '').localeCompare(a.created_at ?? '')
  })
}

/** Apply the active status filter + free-text search (name/address/notes) +
 *  category + per-collection label filter. The label filter is OR semantics: a
 *  place matches if it carries ANY of the selected labels. This one function
 *  drives BOTH the list and the map, so every filter stays in lockstep. */
export function filterPlaces(
  places: CollectionPlace[],
  statusFilter: StatusFilter,
  search: string,
  categoryFilter: number | 'all' = 'all',
  labelFilter: number[] = [],
): CollectionPlace[] {
  const q = search.trim().toLowerCase()
  return places.filter(p => {
    if (!p) return false
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (categoryFilter !== 'all' && (p.category_id ?? null) !== categoryFilter) return false
    if (labelFilter.length && !labelFilter.some(id => (p.label_ids ?? []).includes(id))) return false
    if (!q) return true
    return (
      p.name.toLowerCase().includes(q) ||
      (p.address ?? '').toLowerCase().includes(q) ||
      (p.notes ?? '').toLowerCase().includes(q)
    )
  })
}

/** Count places per status for the filter chips. */
export function statusCounts(places: CollectionPlace[]): Record<StatusFilter, number> {
  const counts: Record<StatusFilter, number> = { all: 0, idea: 0, want: 0, visited: 0 }
  for (const p of places) { if (!p) continue; counts.all += 1; counts[p.status] += 1 }
  return counts
}

export interface CategoryOption { id: number; name: string; color: string | null; icon: string | null; count: number }

/** Distinct categories actually present across the given places, with counts. */
export function presentCategories(places: CollectionPlace[]): CategoryOption[] {
  const byId = new Map<number, CategoryOption>()
  for (const p of places) {
    if (!p || p.category_id == null || !p.category) continue
    const existing = byId.get(p.category_id)
    if (existing) existing.count += 1
    else byId.set(p.category_id, { id: p.category_id, name: p.category.name, color: p.category.color ?? null, icon: p.category.icon ?? null, count: 1 })
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export interface LabelOption { id: number; name: string; color: string | null; count: number }

/** The collection's labels in definition order, each with how many of the given
 *  places carry it. Zero-count labels are kept so the manager/filter still lists
 *  a freshly-created label. */
export function presentLabels(labels: CollectionLabel[], places: CollectionPlace[]): LabelOption[] {
  const counts = new Map<number, number>()
  for (const p of places) {
    if (!p) continue
    for (const id of p.label_ids ?? []) counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return labels.map(l => ({ id: l.id, name: l.name, color: l.color ?? null, count: counts.get(l.id) ?? 0 }))
}

/** Only the places that can render on a map. */
export function mappablePlaces(places: CollectionPlace[]): CollectionPlace[] {
  return places.filter(p => p && typeof p.lat === 'number' && typeof p.lng === 'number')
}

/**
 * Normalise a user-typed link: prepend https:// when there's no scheme so the
 * href is absolute (a bare "booking.com" would otherwise resolve relative to the
 * SPA route and 404). Returns '' for blanks. The server further restricts to
 * http/https.
 */
export function normalizeLinkUrl(url: string): string {
  const u = url.trim()
  if (!u) return ''
  return /^https?:\/\//i.test(u) ? u : `https://${u.replace(/^\/+/, '')}`
}
