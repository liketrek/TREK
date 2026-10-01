import { useCallback, useMemo, useState } from 'react'
import { useTripStore } from '../../store/tripStore'
import { dayLabel } from '../../utils/dayLabel'
import type { Day } from '../../types'
import type { RoadtripVias } from '../../components/Roadtrip/useRoadtripVias'

type Translate = (key: string, params?: Record<string, string | number>) => string

interface DayClearOptions {
  tripId: number
  days: Day[]
  canEditDays: boolean
  t: Translate
  locale: string
  toast: { error: (message: string) => unknown }
  roadtripVias: Pick<RoadtripVias, 'byDay' | 'reanchor'>
  updateRouteForDay: (dayId: number) => void
  pushUndo: (label: string, undoFn: () => Promise<void> | void, dayIds?: number[]) => void
}

export interface DayClear {
  /** The day the question is asked about, or null while none is open. */
  clearDayId: number | null
  /** "Clear Tue, Oct 13?", the day named the way the day list names it. */
  clearDayTitle: string
  handleClearDay: (dayId: number) => void
  cancelClearDay: () => void
  confirmClearDay: () => Promise<void>
}

const byNumber = (a: Day, b: Day): number => (a.day_number ?? 0) - (b.day_number ?? 0)

/**
 * Taking every place off a day in one go (#2470), for both shells. The day, its notes
 * and its bookings stay; the places stay in the trip. Asked first, since it is one tap
 * for what used to be a row of them, and undoable afterwards: the undo plans the same
 * places back in their old order.
 */
export function useDayClear(options: DayClearOptions): DayClear {
  const { tripId, days, canEditDays, t, locale, toast, roadtripVias, updateRouteForDay, pushUndo } = options
  const [clearDayId, setClearDayId] = useState<number | null>(null)

  const ordered = useMemo(() => [...days].sort(byNumber), [days])
  const index = clearDayId == null ? -1 : ordered.findIndex(d => d.id === clearDayId)
  const target = index < 0 ? null : ordered[index]
  const clearDayTitle = target ? t('dayplan.clearDayTitle', { day: dayLabel(target, index, t, locale) }) : ''

  const handleClearDay = useCallback((dayId: number) => {
    if (!canEditDays) return
    if ((useTripStore.getState().assignments[String(dayId)] ?? []).length === 0) return
    setClearDayId(dayId)
  }, [canEditDays])

  const cancelClearDay = useCallback(() => setClearDayId(null), [])

  const confirmClearDay = useCallback(async () => {
    if (clearDayId == null) return
    const dayId = clearDayId
    setClearDayId(null)
    const cleared = [...(useTripStore.getState().assignments[String(dayId)] ?? [])].sort((a, b) => a.order_index - b.order_index)
    // With no stop left, every detour of the day has nothing to bend, so the anchors go too.
    const viaIds = (roadtripVias.byDay[dayId] ?? []).map(v => v.id)
    try {
      await useTripStore.getState().clearDayAssignments(tripId, dayId)
      if (viaIds.length > 0) await roadtripVias.reanchor(dayId, { vias: [], remove: viaIds })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
      return
    }
    updateRouteForDay(dayId)
    const placeIds = cleared.map(a => a.place?.id).filter((id): id is number => id != null)
    pushUndo(t('undo.clearDay'), async () => {
      // One after the other: each lands at the position the one before it left free.
      for (const [position, placeId] of placeIds.entries()) {
        await useTripStore.getState().assignPlaceToDay(tripId, dayId, placeId, position)
      }
    }, [dayId])
  }, [clearDayId, tripId, roadtripVias, toast, t, updateRouteForDay, pushUndo])

  return { clearDayId, clearDayTitle, handleClearDay, cancelClearDay, confirmClearDay }
}
