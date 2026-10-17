import { fileRepo } from '../../repo/fileRepo'
import { isEffectivelyOffline } from '../../sync/networkMode'
import type { StoreApi } from 'zustand'
import type { TripStoreState } from '../tripStore'
import type { TripFile } from '../../types'
import type { FileLinkRequest } from '@trek/shared'
import { getApiErrorMessage } from '../../types'

type SetState = StoreApi<TripStoreState>['setState']
type GetState = StoreApi<TripStoreState>['getState']

export interface FilesSlice {
  loadFiles: (tripId: number | string) => Promise<void>
  addFile: (tripId: number | string, formData: FormData) => Promise<TripFile>
  deleteFile: (tripId: number | string, id: number) => Promise<void>
  /** Links a file the trip already has to a booking, place or expense, then reloads the files. */
  linkFile: (tripId: number | string, id: number, link: FileLinkRequest) => Promise<void>
  /** Takes a file off a booking, whichever way it was attached, and keeps the file. */
  unlinkFileFromReservation: (tripId: number | string, file: TripFile, reservationId: number) => Promise<void>
}

export const createFilesSlice = (set: SetState, get: GetState): FilesSlice => ({
  loadFiles: async (tripId) => {
    try {
      const data = await fileRepo.list(tripId)
      set({ files: data.files })
    } catch (err: unknown) {
      console.error('Failed to load files:', err)
    }
  },

  addFile: async (tripId, formData) => {
    try {
      const data = await fileRepo.upload(tripId, formData)
      set(state => ({ files: [data.file, ...state.files] }))
      return data.file
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Error uploading file'))
    }
  },

  deleteFile: async (tripId, id) => {
    try {
      await fileRepo.delete(tripId, id)
      set(state => ({ files: state.files.filter(f => f.id !== id) }))
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Error deleting file'))
    }
  },

  linkFile: async (tripId, id, link) => {
    try {
      await fileRepo.addLink(tripId, id, link)
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Error linking file'))
    }
    await get().loadFiles(tripId)
  },

  unlinkFileFromReservation: async (tripId, file, reservationId) => {
    try {
      // Uploaded on the booking, the file points at it itself; linked later, a link row does.
      if (file.reservation_id === reservationId) await fileRepo.update(tripId, file.id, { reservation_id: null })
      // A link row is named by its own id, which only the server can look up. Offline
      // that is needed only when the list says the file has one for this booking.
      if ((file.linked_reservation_ids || []).includes(reservationId) || !isEffectivelyOffline()) {
        await fileRepo.removeLinkTo(tripId, file.id, l => l.reservation_id === reservationId)
      }
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Error unlinking file'))
    } finally {
      await get().loadFiles(tripId)
    }
  },
})
