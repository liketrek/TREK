import { formatDistance } from '../../utils/units'
import type { CorridorPoi, CorridorWindow } from './useCorridorPois'
import type { DistanceUnit } from '@trek/shared/roadtrip'
import type { TranslationFn } from '../../types'

/**
 * What a corridor search is allowed to cost, and how far along the drive it looks.
 *
 * The search is already scoped to one day. What it is NOT scoped to is a stretch of
 * that day, and that is where the money is: at roughly one request per 20km of driving,
 * a 300km day is 15 boxes, while the 50km ahead of the driver is three. A phone in a
 * cell is not a desk, so it asks for the stretch it is about to drive and offers the
 * whole stage as the second tap.
 *
 * Deliberately NOT narrowed: the categories. They all travel in one comma-separated
 * query per box, so a second category costs zero extra requests. Restricting the phone
 * to one at a time would have made three searches out of one, which is three times the
 * traffic for less choice.
 */
export interface CorridorBudget {
  /** Boxes one search may ask for. Past this it stops and says so. */
  maxTiles: number
  /** Boxes the follow-up pass may retry, or null for all of them (the desktop's way). */
  maxRetries: number | null
  /** No new box is started after this, or null for no limit. */
  deadlineMs: number | null
}

/** Unchanged behaviour: this is what the panel has always done. */
export const DESKTOP_CORRIDOR_BUDGET: CorridorBudget = {
  maxTiles: 16,
  maxRetries: null,
  deadlineMs: null,
}

/**
 * The phone's ceiling.
 *
 * `deadlineMs` exists only here, and it answers a conflict the desktop lives with: the
 * client gives a box 20 seconds, the server's Overpass fallback allows itself 25. A slow
 * box therefore always times out on the client first and gets retried while the first
 * attempt is still running. On a phone that is the difference between a search that
 * ends and one that keeps the radio warm.
 */
export const PHONE_CORRIDOR_BUDGET: CorridorBudget = {
  maxTiles: 10,
  maxRetries: 2,
  deadlineMs: 25_000,
}

/** Passed by identity, so the search callback below it is not rebuilt every render. */
export const PHONE_CORRIDOR_OPTIONS = { budget: PHONE_CORRIDOR_BUDGET }

/** How far ahead "ahead" means, in kilometres of driving. */
export const PHONE_REACH_KM = 50

export type CorridorReach = 'ahead' | 'stage'

/**
 * The stretch of the drive a search covers, in kilometres along the day's line.
 *
 * Null means the whole stage, which is what the caller passes straight through to the
 * existing behaviour. The window is applied to the tile line only: the spine keeps its
 * full length, so `alongKm`, `offRouteKm` and the insert position of a hit stay measured
 * against the day rather than against the window.
 */
export function corridorWindow(
  anchorKm: number,
  reach: CorridorReach,
  reachKm: number = PHONE_REACH_KM,
): CorridorWindow | null {
  if (reach === 'stage') return null
  const from = Math.max(0, anchorKm)
  return { fromKm: from, toKm: from + reachKm }
}

/**
 * Where "ahead" starts.
 *
 * The stop the traveller is heading for, measured in kilometres along the day. Without
 * one (a stage that is not today, or a day already driven) it is the start of the stage,
 * which is the honest answer: there is no position source, and a guess dressed up as a
 * location is worse than the beginning of the day.
 */
export function anchorKmFor(stopsAlongKm: readonly number[], upNextIndex: number | null): number {
  if (upNextIndex == null || upNextIndex <= 0) return 0
  const previous = stopsAlongKm[upNextIndex - 1]
  return Number.isFinite(previous) ? Math.max(0, previous as number) : 0
}

/**
 * How far into the drive a hit sits.
 *
 * Shared with the desktop panel rather than written twice. The two shells already mirror
 * each other closely and the duplication budget is three percent of new code, so the
 * phrases that describe a hit are written once and read in both: the desktop puts them
 * in two chips, the phone joins them into one line, and neither owns the wording.
 */
export function alongLabel(alongKm: number, unit: DistanceUnit, t: TranslationFn): string {
  return alongKm < 0.5
    ? t('roadtrip.poi.atStart')
    : t('roadtrip.poi.alongRoute', { distance: formatDistance(alongKm, unit) })
}

/** How far off the road it sits. */
export function offRouteLabel(offRouteKm: number, unit: DistanceUnit, t: TranslationFn): string {
  return t('roadtrip.poi.offRoute', { distance: formatDistance(offRouteKm, unit) })
}

/** Both of them, as the one line a phone row has room for. */
export function corridorHitLabel(
  poi: Pick<CorridorPoi, 'alongKm' | 'offRouteKm'>,
  unit: DistanceUnit,
  t: TranslationFn,
): string {
  return `${alongLabel(poi.alongKm, unit, t)} · ${offRouteLabel(poi.offRouteKm, unit, t)}`
}
