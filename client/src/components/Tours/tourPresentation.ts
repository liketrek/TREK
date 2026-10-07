import type { TourListItem } from '@trek/shared'

export type TourSource = 'trek' | 'gpx' | 'wanderer'

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
