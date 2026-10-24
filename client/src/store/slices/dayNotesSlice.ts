import { dayRepo } from '../../repo/dayRepo'
import { dayNoteRepo } from '../../repo/dayNoteRepo'
import type { StoreApi } from 'zustand'
import type { TripStoreState } from '../tripStore'
import type { DayNote } from '../../types'
import { getApiErrorMessage } from '../../types'
import { nextTempId } from '../../sync/mutationQueue'

type SetState = StoreApi<TripStoreState>['setState']
type GetState = StoreApi<TripStoreState>['getState']

export interface DayNotesSlice {
  updateDayNotes: (tripId: number | string, dayId: number | string, notes: string) => Promise<void>
  updateDayTitle: (tripId: number | string, dayId: number | string, title: string) => Promise<void>
  addDayNote: (tripId: number | string, dayId: number | string, data: Partial<DayNote> & { text: string }) => Promise<DayNote>
  updateDayNote: (tripId: number | string, dayId: number | string, id: number, data: Partial<DayNote>) => Promise<DayNote>
  deleteDayNote: (tripId: number | string, dayId: number | string, id: number) => Promise<void>
  moveDayNote: (tripId: number | string, fromDayId: number | string, toDayId: number | string, noteId: number, sort_order?: number) => Promise<void>
}

export const createDayNotesSlice = (set: SetState, get: GetState): DayNotesSlice => ({
  updateDayNotes: async (tripId, dayId, notes) => {
    try {
      await dayRepo.update(tripId, Number(dayId), { notes })
      set(state => ({
        days: state.days.map(d => d.id === Number.parseInt(String(dayId)) ? { ...d, notes } : d)
      }))
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Error updating notes'))
    }
  },

  updateDayTitle: async (tripId, dayId, title) => {
    try {
      await dayRepo.update(tripId, Number(dayId), { title })
      set(state => ({
        days: state.days.map(d => d.id === Number.parseInt(String(dayId)) ? { ...d, title } : d)
      }))
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Error updating day name'))
    }
  },

  addDayNote: async (tripId, dayId, data) => {
    const tempId = nextTempId()
    const tempNote: DayNote = { id: tempId, day_id: dayId as number, ...data, created_at: new Date().toISOString() } as DayNote
    set(state => ({
      dayNotes: {
        ...state.dayNotes,
        [String(dayId)]: [...(state.dayNotes[String(dayId)] || []), tempNote],
      }
    }))
    try {
      const result = await dayNoteRepo.create(tripId, Number(dayId), data)
      set(state => ({
        dayNotes: {
          ...state.dayNotes,
          [String(dayId)]: (state.dayNotes[String(dayId)] || []).map(n => n.id === tempId ? result.note : n),
        }
      }))
      return result.note
    } catch (err: unknown) {
      set(state => ({
        dayNotes: {
          ...state.dayNotes,
          [String(dayId)]: (state.dayNotes[String(dayId)] || []).filter(n => n.id !== tempId),
        }
      }))
      throw new Error(getApiErrorMessage(err, 'Error adding note'))
    }
  },

  updateDayNote: async (tripId, dayId, id, data) => {
    try {
      const before = (get().dayNotes[String(dayId)] || []).find(n => n.id === id) ?? ({ id, day_id: Number(dayId), text: '' } as DayNote)
      const result = await dayNoteRepo.update(tripId, Number(dayId), before, data)
      set(state => ({
        dayNotes: {
          ...state.dayNotes,
          [String(dayId)]: (state.dayNotes[String(dayId)] || []).map(n => n.id === id ? result.note : n),
        }
      }))
      return result.note
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Error updating note'))
    }
  },

  deleteDayNote: async (tripId, dayId, id) => {
    const prev = get().dayNotes
    set(state => ({
      dayNotes: {
        ...state.dayNotes,
        [String(dayId)]: (state.dayNotes[String(dayId)] || []).filter(n => n.id !== id),
      }
    }))
    try {
      await dayNoteRepo.delete(tripId, Number(dayId), id)
    } catch (err: unknown) {
      set({ dayNotes: prev })
      throw new Error(getApiErrorMessage(err, 'Error deleting note'))
    }
  },

  moveDayNote: async (tripId, fromDayId, toDayId, noteId, sort_order = 9999) => {
    const state = get()
    const note = (state.dayNotes[String(fromDayId)] || []).find(n => n.id === noteId)
    if (!note) return

    set(s => ({
      dayNotes: {
        ...s.dayNotes,
        [String(fromDayId)]: (s.dayNotes[String(fromDayId)] || []).filter(n => n.id !== noteId),
      }
    }))

    try {
      // There is no atomic move on the server, so the destructive half goes last:
      // if the create were second and failed, the note would already be gone for
      // good and the rollback below would only fake it back into the store.
      // Every field the note carries, not just the ones it had when this was
      // written: a move is a delete plus a create, so anything omitted here is
      // silently dropped — which is how a coloured note lost its colour on the
      // way to another day (#1629).
      // Offline both halves wait in the queue in this order, so the replay keeps it.
      const result = await dayNoteRepo.create(tripId, Number(toDayId), {
        text: note.text, time: note.time, icon: note.icon, color: note.color ?? null, sort_order,
      })
      try {
        await dayNoteRepo.delete(tripId, Number(fromDayId), noteId)
      } catch (delErr: unknown) {
        // The source survived, so drop the copy rather than leave a duplicate behind.
        await dayNoteRepo.delete(tripId, Number(toDayId), result.note.id).catch(() => {})
        throw delErr
      }
      set(s => ({
        dayNotes: {
          ...s.dayNotes,
          [String(toDayId)]: [...(s.dayNotes[String(toDayId)] || []), result.note],
        }
      }))
    } catch (err: unknown) {
      set(s => ({
        dayNotes: {
          ...s.dayNotes,
          [String(fromDayId)]: [...(s.dayNotes[String(fromDayId)] || []), note],
        }
      }))
      throw new Error(getApiErrorMessage(err, 'Error moving note'))
    }
  },
})
