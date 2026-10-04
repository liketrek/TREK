import { useCallback, useMemo, useState } from 'react'
import { useTripStore } from '../../store/tripStore'
import { useNetworkMode } from '../../hooks/useNetworkMode'
import { dayDeleteImpact, deleteDayBlockedReason } from '../../utils/dayDeleteImpact'
import { deleteDayLines as buildDeleteDayLines, type DayDeleteQuestion, type ImpactLine } from '../../utils/dayImpactLines'
import { dayDate, dayLabel } from '../../utils/dayLabel'
import type { Accommodation, Day, Place, Reservation, Trip } from '../../types'

type Translate = (key: string, params?: Record<string, string | number>) => string

interface DayDeleteOptions {
  tripId: number
  trip: Trip | null
  days: Day[]
  places: Place[]
  reservations: Reservation[]
  accommodations: Accommodation[]
  canEditDays: boolean
  t: Translate
  locale: string
  toast: { success: (message: string) => unknown; error: (message: string) => unknown }
  /**
   * After a delete went through, with the day that went: the stays, the route
   * of the selected day, an open day panel and the undo steps are the planner's.
   */
  onDeleted: (dayId: number) => void
}

export interface DayDelete {
  /** The day the question is asked about, or null while no question is open. */
  deleteDayId: number | null
  setDeleteDayId: (dayId: number | null) => void
  /** "Delete Tue, Oct 13?", the day named the way the reorder list names it. */
  deleteDayTitle: string
  /** What goes with the day, ready for DayImpactList and its phone skin. */
  deleteDayLines: ImpactLine[]
  /** Why no day can be deleted right now (the last day, offline), or null. */
  deleteDayBlocked: string | null
  handleDeleteDay: (dayId: number) => void
  confirmDeleteDay: () => Promise<void>
  /** The same question as one object, for the reorder dialog to ask in place; null while none is open. */
  deleteDayQuestion: DayDeleteQuestion | null
}

const byNumber = (a: Day, b: Day): number => (a.day_number ?? 0) - (b.day_number ?? 0)

/**
 * Deleting a day from the reorder dialog, for both shells: which day is asked
 * about, the question's title and the list of what goes with the day, and the
 * delete itself. The desktop dialog and the phone sheet only render what this
 * returns, which keeps the logic in one place for the duplication gate.
 *
 * There is no undo: the server cancels stays and moves dates in one go, and
 * nothing puts all of that back. The question says so instead.
 */
export function useDayDelete(options: DayDeleteOptions): DayDelete {
  const { tripId, trip, days, places, reservations, accommodations, canEditDays, t, locale, toast, onDeleted } = options
  const { offline } = useNetworkMode()
  const assignments = useTripStore(s => s.assignments)
  const dayNotes = useTripStore(s => s.dayNotes)
  const budgetItems = useTripStore(s => s.budgetItems)
  const [deleteDayId, setDeleteDayId] = useState<number | null>(null)

  const deleteDayBlocked = deleteDayBlockedReason(days.length, offline, t)

  const ordered = useMemo(() => [...days].sort(byNumber), [days])
  const index = deleteDayId == null ? -1 : ordered.findIndex(d => d.id === deleteDayId)
  const target = index < 0 ? null : ordered[index]

  const deleteDayTitle = useMemo(
    () => (target ? t('dayplan.deleteDayTitle', { day: dayLabel(target, index, t, locale) }) : ''),
    [target, index, t, locale],
  )

  const deleteDayLines = useMemo(() => {
    if (!target) return []
    const budget = { items: budgetItems, currency: trip?.currency, locale }
    const impact = dayDeleteImpact(target, days, { assignments, dayNotes, reservations, accommodations, places, budget }, trip)
    return buildDeleteDayLines(impact, t, iso => dayDate(iso, locale) ?? iso, (day, i) => dayLabel(day, i, t, locale))
  }, [target, days, assignments, dayNotes, reservations, accommodations, places, budgetItems, trip, t, locale])

  const handleDeleteDay = useCallback((dayId: number) => {
    if (!canEditDays || deleteDayBlocked) return
    setDeleteDayId(dayId)
  }, [canEditDays, deleteDayBlocked])

  const confirmDeleteDay = useCallback(async () => {
    if (deleteDayId == null) return
    const dayId = deleteDayId
    setDeleteDayId(null)
    try {
      await useTripStore.getState().deleteDay(tripId, dayId)
    } catch (err: unknown) {
      // The store has put the day back already; the server's own sentence is
      // English, so the toast says it in the traveller's language instead.
      console.error('Failed to delete day:', err)
      toast.error(t('dayplan.deleteDayError'))
      return
    }
    onDeleted(dayId)
    toast.success(t('dayplan.deleteDaySuccess'))
  }, [deleteDayId, tripId, toast, t, onDeleted])

  const cancelDeleteDay = useCallback(() => setDeleteDayId(null), [])
  const deleteDayQuestion = useMemo<DayDeleteQuestion | null>(
    () => (target
      ? { dayId: target.id, title: deleteDayTitle, lines: deleteDayLines, onCancel: cancelDeleteDay, onConfirm: () => { void confirmDeleteDay() } }
      : null),
    [target, deleteDayTitle, deleteDayLines, cancelDeleteDay, confirmDeleteDay],
  )

  return { deleteDayId, setDeleteDayId, deleteDayTitle, deleteDayLines, deleteDayBlocked, handleDeleteDay, confirmDeleteDay, deleteDayQuestion }
}
