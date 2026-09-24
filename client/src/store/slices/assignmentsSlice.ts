import { assignmentsApi } from '../../api/client'
import type { StoreApi } from 'zustand'
import type { TripStoreState } from '../tripStore'
import type { Assignment, AssignmentsMap } from '../../types'
import { getApiErrorMessage } from '../../types'
import { assignmentRepo, type AssignmentTimes } from '../../repo/assignmentRepo'
import { mergeAssignmentPlace } from './placesSlice'

type SetState = StoreApi<TripStoreState>['setState']
type GetState = StoreApi<TripStoreState>['getState']

export interface AssignmentsSlice {
  setAssignmentEndDay: (tripId: number | string, dayId: number, assignmentId: number, endDay: boolean) => Promise<void>
  setAssignmentTimes: (tripId: number | string, dayId: number, assignmentId: number, times: AssignmentTimes) => Promise<void>
  assignPlaceToDay: (tripId: number | string, dayId: number | string, placeId: number | string, position?: number | null) => Promise<Assignment | undefined>
  removeAssignment: (tripId: number | string, dayId: number | string, assignmentId: number) => Promise<void>
  reorderAssignments: (tripId: number | string, dayId: number | string, orderedIds: number[]) => Promise<void>
  moveAssignment: (tripId: number | string, assignmentId: number, fromDayId: number | string, toDayId: number | string, toOrderIndex?: number | null) => Promise<void>
  setAssignments: (assignments: AssignmentsMap) => void
}

export const createAssignmentsSlice = (set: SetState, get: GetState): AssignmentsSlice => ({
  setAssignmentEndDay: async (tripId, dayId, assignmentId, endDay) => {
    const assignment = get().assignments[String(dayId)]?.find(a => a.id === assignmentId)
    if (!assignment || assignmentId < 0) return
    const apply = (value: boolean) => set(state => ({
      assignments: Object.fromEntries(Object.entries(state.assignments).map(([key, items]) => [
        key, items.map(a => a.id === assignmentId ? { ...a, end_day: value } : a),
      ])),
    }))
    apply(endDay)
    try {
      const saved = await assignmentRepo.setEndDay(tripId, assignment, endDay)
      apply(saved.end_day === true)
    } catch (err: unknown) {
      apply(assignment.end_day === true)
      throw err
    }
  },
  setAssignmentTimes: async (tripId, dayId, assignmentId, times) => {
    const assignment = get().assignments[String(dayId)]?.find(a => a.id === assignmentId)
    if (!assignment || assignmentId < 0) return
    const replace = (next: Assignment) => set(state => ({
      assignments: Object.fromEntries(Object.entries(state.assignments).map(([key, items]) => [
        key, items.map(a => a.id === assignmentId ? next : a),
      ])),
    }))
    // The embedded place carries the times the visit shows, its own or else the place's,
    // so it is merged again from the pool rather than patched field by field. The merged
    // row is also what an offline save caches, or the old end time would come back from
    // the cache on the next read.
    const pool = get().places.find(p => p.id === assignment.place_id)
    const merge = (next: Assignment) => (pool ? mergeAssignmentPlace(next, pool) : next)
    const draft = merge({ ...assignment, assignment_time: times.place_time, assignment_end_time: times.end_time })
    replace(draft)
    try {
      replace(merge({ ...draft, ...await assignmentRepo.setTimes(tripId, draft, times) }))
    } catch (err: unknown) {
      replace(assignment)
      throw err
    }
  },
  assignPlaceToDay: async (tripId, dayId, placeId, position) => {
    const state = get()
    const place = state.places.find(p => p.id === Number.parseInt(String(placeId)))
    if (!place) return

    const tempId = Date.now() * -1
    // Sorted first, as moveAssignment does: the position is an index in the day as
    // it is shown, and that day is sorted by order_index. The stored list is not
    // always, a stop that arrived over the socket is appended wherever its
    // order_index says it belongs, so a splice into the raw list landed the new
    // row behind the wrong neighbour and the reorder that follows wrote that order.
    const current = (state.assignments[String(dayId)] || []).slice().sort((a, b) => a.order_index - b.order_index)
    const insertIdx = position != null ? position : current.length
    const tempAssignment: Assignment = {
      id: tempId,
      day_id: Number.parseInt(String(dayId)),
      place_id: place.id,
      order_index: insertIdx,
      notes: null,
      place,
    }

    current.splice(insertIdx, 0, tempAssignment)
    set(state => ({
      assignments: {
        ...state.assignments,
        [String(dayId)]: current,
      }
    }))

    try {
      const data = await assignmentsApi.create(tripId, dayId, { place_id: placeId })
      const newAssignment: Assignment = {
        ...data.assignment,
        place: data.assignment.place || place,
        order_index: position != null ? insertIdx : data.assignment.order_index,
      }
      set(state => ({
        assignments: {
          ...state.assignments,
          [String(dayId)]: state.assignments[String(dayId)].map(
            a => a.id === tempId ? newAssignment : a
          ),
        }
      }))
      if (position != null) {
        const updated = get().assignments[String(dayId)] || []
        const orderedIds = updated.map(a => a.id).filter(id => id > 0)
        if (orderedIds.length > 0) {
          try {
            await assignmentsApi.reorder(tripId, dayId, orderedIds)
            set(state => {
              const items = state.assignments[String(dayId)] || []
              const reordered = orderedIds.map((id, idx) => {
                const item = items.find(a => a.id === id)
                return item ? { ...item, order_index: idx } : null
              }).filter((item): item is Assignment => item !== null)
              return {
                assignments: {
                  ...state.assignments,
                  [String(dayId)]: reordered,
                }
              }
            })
          } catch {}
        }
      }
      return data.assignment
    } catch (err: unknown) {
      set(state => ({
        assignments: {
          ...state.assignments,
          [String(dayId)]: state.assignments[String(dayId)].filter(a => a.id !== tempId),
        }
      }))
      throw new Error(getApiErrorMessage(err, 'Error assigning place'))
    }
  },

  removeAssignment: async (tripId, dayId, assignmentId) => {
    const prevAssignments = get().assignments

    set(state => ({
      assignments: {
        ...state.assignments,
        [String(dayId)]: state.assignments[String(dayId)].filter(a => a.id !== assignmentId),
      }
    }))

    try {
      await assignmentsApi.delete(tripId, dayId, assignmentId)
    } catch (err: unknown) {
      set({ assignments: prevAssignments })
      throw new Error(getApiErrorMessage(err, 'Error removing assignment'))
    }
  },

  reorderAssignments: async (tripId, dayId, orderedIds) => {
    const prevAssignments = get().assignments
    const dayItems = get().assignments[String(dayId)] || []
    const reordered = orderedIds.map((id, idx) => {
      const item = dayItems.find(a => a.id === id)
      return item ? { ...item, order_index: idx } : null
    }).filter((item): item is Assignment => item !== null)

    set(state => ({
      assignments: {
        ...state.assignments,
        [String(dayId)]: reordered,
      }
    }))

    try {
      await assignmentsApi.reorder(tripId, dayId, orderedIds)
    } catch (err: unknown) {
      set({ assignments: prevAssignments })
      throw new Error(getApiErrorMessage(err, 'Error reordering'))
    }
  },

  moveAssignment: async (tripId, assignmentId, fromDayId, toDayId, toOrderIndex = null) => {
    const state = get()
    const prevAssignments = state.assignments
    const assignment = (state.assignments[String(fromDayId)] || []).find(a => a.id === assignmentId)
    if (!assignment) return

    const toItems = (state.assignments[String(toDayId)] || []).slice().sort((a, b) => a.order_index - b.order_index)
    const insertAt = toOrderIndex !== null ? toOrderIndex : toItems.length

    const withMoved = [...toItems]
    withMoved.splice(insertAt, 0, { ...assignment, day_id: Number.parseInt(String(toDayId)) })
    // Renumber into copies. Assigning `order_index` in place would mutate the very objects
    // still held in `prevAssignments`, so the rollback below would restore a list whose
    // indices had already been overwritten — a failed move left the order wrong instead of
    // putting it back.
    const newToItems = withMoved.map((a, i) => ({ ...a, order_index: i }))

    set(s => ({
      assignments: {
        ...s.assignments,
        [String(fromDayId)]: s.assignments[String(fromDayId)].filter(a => a.id !== assignmentId),
        [String(toDayId)]: newToItems,
      }
    }))

    try {
      await assignmentsApi.move(tripId, assignmentId, toDayId, insertAt)
      if (newToItems.length > 1) {
        await assignmentsApi.reorder(tripId, toDayId, newToItems.map(a => a.id))
      }
    } catch (err: unknown) {
      set({ assignments: prevAssignments })
      throw new Error(getApiErrorMessage(err, 'Error moving assignment'))
    }
  },

  setAssignments: (assignments) => {
    set({ assignments })
  },
})
