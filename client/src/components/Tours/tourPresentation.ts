import type { TourListItem } from '@trek/shared'

export type TourSource = 'trek' | 'gpx' | 'wanderer'

/** All / Unplanned / Planned, the same three states as the Places pool. */
export type TourFilter = 'all' | 'unplanned' | 'planned'

type Translate = (key: string, params?: Record<string, unknown>) => string

/**
 * Presentation-only source abstraction until provenance receives its own column.
 * A wanderer reference is authoritative. Planner-authored TREK tours persist
 * routing controls, while GPX imports intentionally remain geometry-only.
 */
export function tourSource(tour: Pick<TourListItem, 'wanderer_ref' | 'has_waypoints'>): TourSource {
  if (tour.wanderer_ref) return 'wanderer'
  return tour.has_waypoints === false ? 'gpx' : 'trek'
}

export function hikeSourceBadgeLabel(
  tour: Pick<TourListItem, 'wanderer_ref' | 'has_waypoints'>,
  t: Translate,
): string {
  return t(`tours.badge.${tourSource(tour)}`)
}

/** The tours a list shows under the All / Unplanned / Planned filter, in their order. */
export function filterTours<T extends Pick<TourListItem, 'planned'>>(tours: T[], filter: TourFilter): T[] {
  return tours.filter(tr => {
    if (filter === 'unplanned') return !tr.planned
    if (filter === 'planned') return tr.planned
    return true
  })
}
