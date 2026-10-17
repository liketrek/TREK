import type { TourListItem, TourOrigin } from '@trek/shared'
import { tourWebsiteSchema } from '@trek/shared'
import { formatDurationShort } from '@trek/shared/roadtrip'

export type TourSource = TourOrigin

/** All / Unplanned / Planned, the same three states as the Places pool. */
export type TourFilter = 'all' | 'unplanned' | 'planned'
export interface TourWebsitePresentation {
  href: string
  domain: string
  provider: 'Komoot' | 'AllTrails' | 'Outdooractive' | 'Wanderer' | null
}

export function formatPlannedTourDuration(minutes: number): string {
  return formatDurationShort(minutes * 60)
}

export interface TourPlannedTimes {
  walkingMinutes: number | null
  breakMinutes: number | null
  plannedTotalMinutes: number | null
  manuallyOverridden: boolean
}

export function tourPlannedTimes(tour: Pick<TourListItem, 'duration' | 'planned_duration_minutes' | 'break_additional_minutes'>): TourPlannedTimes {
  const manualOverride = tour.planned_duration_minutes ?? null
  const breaks = tour.break_additional_minutes ?? 0
  const plannedTotal = manualOverride ?? (tour.duration == null ? null : tour.duration + breaks)
  return {
    walkingMinutes: tour.duration,
    breakMinutes: tour.break_additional_minutes ?? null,
    plannedTotalMinutes: plannedTotal,
    manuallyOverridden: manualOverride !== null,
  }
}

const TOUR_WEBSITE_PROVIDERS = [
  { provider: 'Komoot', domains: ['komoot.com'] },
  { provider: 'AllTrails', domains: ['alltrails.com'] },
  { provider: 'Outdooractive', domains: ['outdooractive.com', 'outdooractive.de'] },
  { provider: 'Wanderer', domains: ['wanderer.to'] },
] as const

/** Classifies only the parsed host. It never resolves or requests the URL. */
export function tourWebsitePresentation(value: string | null | undefined): TourWebsitePresentation | null {
  const parsed = tourWebsiteSchema.safeParse(value)
  if (!parsed.success) return null
  const hostname = new URL(parsed.data).hostname.toLowerCase().replace(/^www\./, '')
  const match = TOUR_WEBSITE_PROVIDERS.find(({ domains }) =>
    domains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))
  )
  return {
    href: parsed.data,
    domain: hostname,
    provider: match?.provider ?? null,
  }
}

type Translate = (key: string, params?: Record<string, unknown>) => string

/**
 * Presentation-only source abstraction until provenance receives its own column.
 * A wanderer reference is authoritative. Planner-authored TREK tours persist
 * routing controls, while GPX imports intentionally remain geometry-only.
 */
export function tourSource(tour: Pick<TourListItem, 'wanderer_ref' | 'has_waypoints' | 'origin'>): TourSource {
  // The origin the server recorded; a list cached before it existed still reads off the tour's shape.
  if (tour.origin) return tour.origin
  if (tour.wanderer_ref) return 'wanderer'
  return tour.has_waypoints === false ? 'gpx' : 'trek'
}

export function hikeSourceBadgeLabel(
  tour: Pick<TourListItem, 'wanderer_ref' | 'has_waypoints' | 'origin'>,
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

/** How each origin is named in a list, the words the source badge uses. */
export const ORIGIN_LABEL_KEY = { trek: 'tours.badge.trek', gpx: 'tours.badge.gpx', wanderer: 'tours.badge.wanderer' } as const

/** The day status a tour list is filtered by, in words. */
export function statusLabel(status: TourFilter, t: Translate): string {
  if (status === 'unplanned') return t('places.unplanned')
  if (status === 'planned') return t('places.planned')
  return t('places.all')
}
