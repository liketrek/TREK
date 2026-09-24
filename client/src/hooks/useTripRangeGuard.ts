import { useCallback, useState } from 'react'
import { planDayGrid, resolveDayGridRange } from '@trek/shared'
import { useTranslation } from '../i18n'
import { dayRepo } from '../repo/dayRepo'
import { reservationRepo } from '../repo/reservationRepo'
import { accommodationRepo } from '../repo/accommodationRepo'
import { budgetRepo } from '../repo/budgetRepo'
import { dayLabel } from '../utils/dayLabel'
import { hasVisibleContent, tripRangeImpact, type TripRangeImpact } from '../utils/tripRangeImpact'
import type { AssignmentsMap, DayNotesMap, Trip } from '../types'

/** Days a save would remove, with the names the day list gives them. */
export interface RangeRemoval extends TripRangeImpact {
  dayLabels: string[]
}

/**
 * The answer before a save: the days it removes with something on them, null
 * when it removes nothing worth a question, or 'unknown' when the trip's days
 * could not be read, so the dialog can still warn in general terms.
 */
export type RangeCheck = RangeRemoval | 'unknown' | null

/** The fields of a trip save that move the day grid. */
export interface RangePayload {
  start_date?: string | null
  end_date?: string | null
  day_count?: number | null
}

/**
 * Asks, before a trip dialog saves new dates, which days the save would remove
 * and what is on them. It reads the trip's days, bookings and stays through the
 * repos and lays the days out with planDayGrid, the rule the server rebuilds
 * them by, so the warning names exactly the days the save takes. A save that
 * does not rebuild the days is answered without reading anything. The expenses
 * only tell whether a removed stay's booking has one; when they cannot be read,
 * the warning says it may.
 *
 * Used by the desktop trip dialog and the phone's trip sheet alike; both only
 * render what comes back.
 */
export function useTripRangeGuard(): { checking: boolean; check: (trip: Pick<Trip, 'id' | 'start_date' | 'end_date'>, payload: RangePayload) => Promise<RangeCheck> } {
  const { t, locale } = useTranslation()
  const [checking, setChecking] = useState(false)

  const check = useCallback(async (trip: Pick<Trip, 'id' | 'start_date' | 'end_date'>, payload: RangePayload): Promise<RangeCheck> => {
    const range = resolveDayGridRange(trip, payload)
    if (!range.regenerate) return null
    setChecking(true)
    try {
      const [{ days }, { reservations }, { accommodations }, expenses] = await Promise.all([
        dayRepo.list(trip.id),
        reservationRepo.list(trip.id),
        accommodationRepo.list(trip.id),
        budgetRepo.list(trip.id).catch((err: unknown) => {
          console.warn('Expenses not read for the warning before new dates:', err)
          return null
        }),
      ])
      const plan = planDayGrid({
        days: days.map(d => ({
          id: d.id,
          day_number: d.day_number ?? 0,
          date: d.date,
          hasPlanItems: (d.assignments?.length ?? 0) > 0 || (d.notes_items?.length ?? 0) > 0,
        })),
        stays: accommodations,
        startDate: range.newStart,
        endDate: range.newEnd,
        dayCount: range.dayCount,
      })
      if (plan.removed.length === 0) return null

      const assignments: AssignmentsMap = {}
      const dayNotes: DayNotesMap = {}
      for (const day of days) {
        assignments[String(day.id)] = day.assignments ?? []
        dayNotes[String(day.id)] = day.notes_items ?? []
      }
      const startMoved = !!trip.start_date && !!range.newStart && !!range.newEnd && range.newStart !== trip.start_date
      const budget = expenses ? { items: expenses.items } : undefined
      const impact = tripRangeImpact(plan, days, { assignments, dayNotes, reservations, accommodations, budget }, { startMoved })
      if (!hasVisibleContent(impact)) return null
      return { ...impact, dayLabels: impact.removedDays.map(({ day, index }) => dayLabel(day, index, t, locale)) }
    } catch (err: unknown) {
      console.error('Failed to read the days a new range removes:', err)
      return 'unknown'
    } finally {
      setChecking(false)
    }
  }, [t, locale])

  return { checking, check }
}
