import { useCallback, useMemo, useRef, useState } from 'react'
import { useTripStore } from '../../store/tripStore'
import { useNetworkMode } from '../../hooks/useNetworkMode'
import { datedDayOption, type DayAddControls } from '../../utils/dayAdd'
import { dayDate } from '../../utils/dayLabel'
import type { Day, Trip } from '../../types'

type Translate = (key: string, params?: Record<string, string | number>) => string

interface DayAddOptions {
  tripId: number
  trip: Trip | null
  days: Day[]
  canEditDays: boolean
  t: Translate
  locale: string
  toast: { success: (message: string) => unknown; error: (message: string) => unknown }
}

export interface DayAdd {
  /** Add a day without a date at the end, or an empty day at a 1-based `position`. */
  handleAddDay: (position?: number) => void
  /** Everything the reorder dialog and the phone's day sheet need for their add buttons. */
  dayAdd: DayAddControls
}

/**
 * Adding a day, for both shells: the day without a date as before, and on a trip
 * with dates the next calendar day, which extends the trip by one. The desktop
 * dialog and the phone sheet only render what this returns, which keeps the logic
 * in one place for the duplication gate.
 *
 * Both run one at a time. A second click while a day is on its way does nothing,
 * or a double click on "Add with date" would grow the trip by two days. Both need
 * a connection: the server places the new day and moves the ones behind it.
 */
export function useDayAdd(options: DayAddOptions): DayAdd {
  const { tripId, trip, days, canEditDays, t, locale, toast } = options
  const { offline } = useNetworkMode()
  const [busy, setBusy] = useState(false)
  // The state redraws the buttons; the ref stops a click that lands before that redraw.
  const inFlight = useRef(false)

  const { nextDate, datedBlocked } = useMemo(() => datedDayOption(trip, days, t), [trip, days, t])
  const blocked = offline ? t('dayplan.daysOffline') : null

  const runOnce = useCallback((add: () => Promise<void>) => {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    add().finally(() => {
      inFlight.current = false
      setBusy(false)
    })
  }, [])

  const handleAddDay = useCallback((position?: number) => {
    if (!canEditDays || blocked) return
    runOnce(() => useTripStore.getState().insertDay(tripId, position).then(
      () => undefined,
      (err: unknown) => { toast.error(err instanceof Error ? err.message : t('dayplan.addDayError')) },
    ))
  }, [canEditDays, blocked, runOnce, tripId, toast, t])

  const onAddDated = useCallback(() => {
    if (!canEditDays || blocked || datedBlocked || !nextDate) return
    runOnce(() => useTripStore.getState().appendDatedDay(tripId).then(
      day => { toast.success(t('dayplan.tripExtended', { date: dayDate(day.date ?? nextDate, locale) ?? nextDate })) },
      (err: unknown) => {
        // The server's sentences are English, and the button already keeps a trip
        // without dates or at the day limit from asking, so a refusal here is a
        // failure the traveller only needs to hear about in their own language.
        console.error('Failed to add a dated day:', err)
        toast.error(t('dayplan.addDayError'))
      },
    ))
  }, [canEditDays, blocked, datedBlocked, nextDate, runOnce, tripId, toast, t, locale])

  const dayAdd = useMemo<DayAddControls>(
    () => ({ nextDate, blocked, datedBlocked, busy, onAddDated }),
    [nextDate, blocked, datedBlocked, busy, onAddDated],
  )

  return { handleAddDay, dayAdd }
}
