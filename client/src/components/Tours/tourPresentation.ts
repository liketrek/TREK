import type { TourListItem } from '@trek/shared'
import { tourWebsiteSchema } from '@trek/shared'
import { formatDurationShort } from '@trek/shared/roadtrip'

export type TourSource = 'trek' | 'gpx' | 'wanderer'

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
