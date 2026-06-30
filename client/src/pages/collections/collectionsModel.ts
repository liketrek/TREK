import { Circle, Bookmark, CheckCircle2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CollectionPlace, CollectionStatus } from '@trek/shared'
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
  /** CSS colour token / hex for the badge. */
  color: string
}

export const STATUS_META: Record<CollectionStatus, StatusMeta> = {
  idea: { icon: Circle, labelKey: 'collections.status.idea', color: 'var(--text-muted)' },
  want: { icon: Bookmark, labelKey: 'collections.status.want', color: 'var(--accent)' },
  visited: { icon: CheckCircle2, labelKey: 'collections.status.visited', color: '#10b981' },
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

/** Apply the active status filter + free-text search (name/address/notes). */
export function filterPlaces(
  places: CollectionPlace[],
  statusFilter: StatusFilter,
  search: string,
): CollectionPlace[] {
  const q = search.trim().toLowerCase()
  return places.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
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
  const counts: Record<StatusFilter, number> = { all: places.length, idea: 0, want: 0, visited: 0 }
  for (const p of places) counts[p.status] += 1
  return counts
}

/** Only the places that can render on a map. */
export function mappablePlaces(places: CollectionPlace[]): CollectionPlace[] {
  return places.filter(p => typeof p.lat === 'number' && typeof p.lng === 'number')
}
