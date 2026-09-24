import { daysApi } from '../../api/client'
import { dayRepo } from '../../repo/dayRepo'
import type { StoreApi } from 'zustand'
import type { TripStoreState } from '../tripStore'
import type { Day } from '../../types'
import { getApiErrorMessage } from '../../types'

type SetState = StoreApi<TripStoreState>['setState']
type GetState = StoreApi<TripStoreState>['getState']

export interface DaysSlice {
  reorderDays: (tripId: number | string, orderedIds: number[]) => Promise<void>
  insertDay: (tripId: number | string, position?: number) => Promise<Day | undefined>
  appendDatedDay: (tripId: number | string) => Promise<Day>
  deleteDay: (tripId: number | string, dayId: number) => Promise<void>
}

type DayState = Pick<TripStoreState, 'days' | 'assignments' | 'dayNotes' | 'selectedDayId'>

/**
 * The day state without one day, the way the server leaves it: the days after it
 * move up one place, and on a dated trip the dates stay on their positions, so
 * every later day takes the date one slot earlier. The day's assignments and
 * notes go with it, and a selection on it is cleared.
 *
 * Both the optimistic delete below and a collaborator's day:deleted apply this,
 * so the two ends of the same delete cannot drift apart field by field.
 */
export function withoutDay(state: DayState, dayId: number): DayState {
  const ordered = [...state.days].sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0))
  const dates = ordered.map(d => d.date).filter((d): d is string => !!d).sort((a, b) => a.localeCompare(b))
  const days = ordered
    .filter(d => d.id !== dayId)
    .map((d, i) => ({ ...d, day_number: i + 1, date: dates.length ? (dates[i] ?? null) : d.date }))
  const assignments = { ...state.assignments }
  delete assignments[String(dayId)]
  const dayNotes = { ...state.dayNotes }
  delete dayNotes[String(dayId)]
  return { days, assignments, dayNotes, selectedDayId: state.selectedDayId === dayId ? null : state.selectedDayId }
}

export const createDaysSlice = (set: SetState, get: GetState): DaysSlice => ({
  // Move whole days. Day rows stay stable (assignments/notes/bookings ride along
  // by id); only positions change and, on a dated trip, dates stay pinned to
  // their slots while the content moves across them. Optimistically reorder the
  // list, then refresh to pull the server-side re-stamped dates + booking times.
  reorderDays: async (tripId, orderedIds) => {
    const prevDays = get().days
    const byId = new Map(prevDays.map(d => [d.id, d]))
    const sortedDates = prevDays.map(d => d.date).filter((d): d is string => !!d).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    const optimistic = orderedIds
      .map((id, i) => {
        const d = byId.get(id)
        if (!d) return null
        return { ...d, day_number: i + 1, date: sortedDates.length ? (sortedDates[i] ?? null) : d.date }
      })
      .filter((d): d is NonNullable<typeof d> => d !== null)

    set({ days: optimistic })

    try {
      await daysApi.reorder(tripId, orderedIds)
      await get().refreshDays(tripId)
      await get().loadReservations(tripId)
    } catch (err: unknown) {
      set({ days: prevDays })
      throw new Error(getApiErrorMessage(err, 'Error reordering days'))
    }
  },

  // Insert a new empty day at a 1-based position (omit to append). On a dated
  // trip this extends the trip by one day and re-pins dates server-side.
  insertDay: async (tripId, position) => {
    try {
      const result = await daysApi.create(tripId, { position })
      await get().refreshDays(tripId)
      await get().loadReservations(tripId)
      return result.day
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Error adding day'))
    }
  },

  // Add the calendar day after the trip's last date. The trip grows by that day,
  // so the store takes the trip the server answered with (the socket echo skips
  // this tab) and pulls the days, where the ones without a date moved back one
  // place. No booking changes date, so reservations stay as they are.
  appendDatedDay: async (tripId) => {
    const outcome = await dayRepo.appendDated(tripId).then(
      answer => answer,
      (failure: unknown) => ({ failure }),
    )
    if ('failure' in outcome) throw new Error(getApiErrorMessage(outcome.failure, 'Error adding day'))
    if (outcome.trip) set({ trip: outcome.trip })
    await get().refreshDays(tripId)
    return outcome.day
  },

  // Delete a day. The list closes up at once; a refusal (the last day, no
  // connection, a server error) puts every field back. Afterwards the store pulls
  // the re-dated days and the bookings, which were re-stamped or let go of, and
  // takes the trip the server answered with for its day count and end date.
  deleteDay: async (tripId, dayId) => {
    const { days, assignments, dayNotes, selectedDayId } = get()
    const previous: DayState = { days, assignments, dayNotes, selectedDayId }
    set(withoutDay(previous, dayId))

    const outcome = await dayRepo.remove(tripId, dayId).then(
      answer => ({ trip: answer.trip }),
      (failure: unknown) => ({ failure }),
    )
    if ('failure' in outcome) {
      set(previous)
      throw new Error(getApiErrorMessage(outcome.failure, 'Error deleting day'))
    }
    if (outcome.trip) set({ trip: outcome.trip })
    await get().refreshDays(tripId)
    await get().loadReservations(tripId)
  },
})
