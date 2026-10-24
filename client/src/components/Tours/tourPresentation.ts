import type { TourListItem, TourOrigin } from '@trek/shared'
import { tourTimeEstimate, tourWebsiteSchema, type TourTimeEstimate } from '@trek/shared'
import { formatDurationShort } from '@trek/shared/roadtrip'
import type { RouteProfileFocus } from '../../utils/routeGeometry'
import { formatDistance, formatElevation } from '../../utils/units'
import { walkTimesOf, type WalkTimes } from './planner/stationModel'
import type { TourMetricField } from './tourParts'

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
  /** CW-02: a city walk's walking time and stays as the list knows them; null for any other type, or a list without them. */
  walk: WalkTimes | null
  /** The planned total leaves out a stay nobody entered yet: it is at least that much. */
  atLeast: boolean
  /**
   * TIME-01: what a tour without a time of its own (an import) is estimated to
   * take, worked out from its measures by the planner's own rule; null where
   * nothing estimates it. Never part of the planned total.
   */
  estimate: TourTimeEstimate | null
}

type PlannedTimesSource = Pick<TourListItem, 'duration' | 'planned_duration_minutes' | 'break_additional_minutes'>
  & Partial<Pick<TourListItem, 'tour_type' | 'station_count' | 'station_stay_minutes' | 'station_stays_unknown' | 'walk_ferry_minutes'>>
  & Partial<Pick<TourListItem, 'distance' | 'elevation_gain' | 'elevation_loss' | 'run_pace_seconds_per_km'>>

/** TIME-01: the estimate of a tour, by the rule `@trek/shared` keeps for the app and the server alike. */
function estimateOf(tour: PlannedTimesSource): TourTimeEstimate | null {
  if (!tour.tour_type) return null
  return tourTimeEstimate({
    tour_type: tour.tour_type,
    distance: tour.distance ?? null,
    elevation_gain: tour.elevation_gain ?? null,
    elevation_loss: tour.elevation_loss ?? null,
    duration: tour.duration,
    run_pace_seconds_per_km: tour.run_pace_seconds_per_km ?? null,
  })
}

/** CW-02: a city walk's times from what the list says of its stations; null where it says nothing of them. */
function walkTimesOfTour(tour: PlannedTimesSource): WalkTimes | null {
  if (tour.tour_type !== 'walk' || tour.station_stay_minutes == null) return null
  return walkTimesOf({
    walkingMinutes: tour.duration,
    stayMinutes: tour.station_stay_minutes,
    unknownStays: tour.station_stays_unknown ?? 0,
    stations: tour.station_count ?? 0,
    // CW-12: the boat is part of the day, never of the walking time.
    ...(tour.walk_ferry_minutes !== undefined ? { ferryMinutes: tour.walk_ferry_minutes } : {}),
  })
}

/**
 * The times a tour is planned with. A city walk takes no breaks: its stops are
 * its stays, so a break kept from another type never counts on top (CW-02), and
 * its total is the walking time and the stays entered.
 */
export function tourPlannedTimes(tour: PlannedTimesSource): TourPlannedTimes {
  const manualOverride = tour.planned_duration_minutes ?? null
  const walk = walkTimesOfTour(tour)
  const breaks = tour.tour_type === 'walk' ? null : (tour.break_additional_minutes ?? null)
  const automatic = walk ? walk.totalMinutes : (tour.duration == null ? null : tour.duration + (breaks ?? 0))
  return {
    walkingMinutes: tour.duration,
    breakMinutes: breaks,
    plannedTotalMinutes: manualOverride ?? automatic,
    manuallyOverridden: manualOverride !== null,
    walk,
    atLeast: manualOverride === null && !!walk?.partial,
    estimate: estimateOf(tour),
  }
}

/**
 * TIME-01: the time a tour is reckoned to take in a day: the planned total,
 * else the estimate. Null where neither is known. `estimated` says the time
 * is an estimate, `atLeast` that it leaves out a stay nobody entered yet.
 */
export function tourDayMinutes(
  times: Pick<TourPlannedTimes, 'plannedTotalMinutes' | 'atLeast' | 'estimate'>
): { minutes: number; estimated: boolean; atLeast: boolean } | null {
  if (times.plannedTotalMinutes != null) {
    return { minutes: times.plannedTotalMinutes, estimated: false, atLeast: times.atLeast }
  }
  const estimated = times.estimate?.minutes
  return estimated == null ? null : { minutes: estimated, estimated: true, atLeast: false }
}

/** TIME-01: an estimate as a badge says it, `≈ 3 h 20 min`, or null while it is unknown. */
export function estimateBadgeText(estimate: TourTimeEstimate | null): string | null {
  return estimate?.minutes == null ? null : `≈ ${formatPlannedTourDuration(estimate.minutes)}`
}

/** TIME-01: the words for what an estimate was worked out by, or why it is unknown. */
function estimateBasisText(estimate: TourTimeEstimate, t: Translate): string {
  if (estimate.minutes == null) return t('tours.estimate.noHeights')
  return t(estimate.basis === 'run_pace' ? 'tours.estimate.basisPace' : 'tours.estimate.basisDin')
}

/**
 * TIME-01: an estimate as a field of the tour detail: labelled estimated, its
 * time or unknown, and what it was worked out by behind its info dot.
 */
export function estimateField(estimate: TourTimeEstimate, t: Translate): TourMetricField {
  return {
    label: t('tours.estimate.label'),
    shortLabel: t('tours.estimate.short'),
    value: estimateBadgeText(estimate) ?? t('tours.estimate.unknown'),
    info: { label: t('tours.estimate.label'), description: estimateBasisText(estimate, t) },
  }
}

/**
 * TIME-01: an estimate in words for a tooltip or a field: its time, or that
 * it is unknown, and what it was worked out by.
 */
export function estimateLabel(estimate: TourTimeEstimate, t: Translate): string {
  const value = estimate.minutes == null ? t('tours.estimate.unknown') : formatPlannedTourDuration(estimate.minutes)
  return `${t('tours.estimate.label')}: ${value}. ${estimateBasisText(estimate, t)}`
}

/**
 * The planned total as said, or null without one: "at least" where a city
 * walk's stay is not entered yet (CW-02). A badge says it as "≥", the way a
 * sum short of the whole reads in the tour summary.
 */
export function plannedTotalText(times: Pick<TourPlannedTimes, 'plannedTotalMinutes' | 'atLeast'>, t: Translate, badge = false): string | null {
  if (times.plannedTotalMinutes == null) return null
  const time = formatPlannedTourDuration(times.plannedTotalMinutes)
  if (!times.atLeast) return time
  return badge ? `≥ ${time}` : t('tours.walk.totalAtLeast', { time })
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

/**
 * A spot of a route's height profile in words, as the planner's profile and
 * the chat's tour card both say it: how far along, and how high where the
 * heights are known.
 */
export function profileFocusLabel(focus: RouteProfileFocus, t: Translate, unit: 'metric' | 'imperial'): string {
  return t('tours.planner.inspector.profileFocus', {
    distance: formatDistance(focus.distanceMeters / 1000, unit),
    elevation: focus.elevationMeters == null ? '-' : formatElevation(focus.elevationMeters, unit),
  })
}
