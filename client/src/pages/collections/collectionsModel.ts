import type { CollectionPlace, CollectionLabel } from '@trek/shared'
import type { StatusFilter, CollectionSortMode } from '../../store/collectionStore'

/**
 * Pure data shaping + presentation metadata for the Collections page. No React
 * state/effects live here — see atlas/atlasModel.ts for the same split. The
 * page hook (useCollections) and the view components share these helpers.
 */

// The status presentation lives with the components (the assistant's cards
// draw it too); re-exported here for the page and its views.
export { STATUS_META, STATUS_ORDER, nextStatus } from '../../components/Collections/collectionStatus'

/** Order the places for display. 'default' keeps the saved order (sort_order,
 *  then newest first); 'name_asc' sorts alphabetically by name (locale-aware). */
export function sortPlaces(places: CollectionPlace[], mode: CollectionSortMode = 'default'): CollectionPlace[] {
  if (mode === 'name_asc') {
    return [...places].sort((a, b) => a.name.localeCompare(b.name))
  }
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
  ratingFilter: number | 'all' = 'all',
): CollectionPlace[] {
  const q = search.trim().toLowerCase()
  return places.filter(p => {
    if (!p) return false
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (categoryFilter !== 'all' && (p.category_id ?? null) !== categoryFilter) return false
    // Minimum-average-stars filter (#1435): unrated places drop out once a floor is set.
    if (ratingFilter !== 'all' && (p.rating_avg == null || p.rating_avg < ratingFilter)) return false
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
