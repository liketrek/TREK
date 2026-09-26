import { filesApi } from '../../api/client'
import { fileRepo } from '../../repo/fileRepo'
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
      const data = await filesApi.upload(tripId, formData)
      set(state => ({ files: [data.file, ...state.files] }))
      return data.file
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Error uploading file'))
    }
  },

  deleteFile: async (tripId, id) => {
    try {
      await filesApi.delete(tripId, id)
      set(state => ({ files: state.files.filter(f => f.id !== id) }))
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Error deleting file'))
    }
  },

  linkFile: async (tripId, id, link) => {
    try {
      await filesApi.addLink(tripId, id, link)
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Error linking file'))
    }
    await get().loadFiles(tripId)
  },

  unlinkFileFromReservation: async (tripId, file, reservationId) => {
    try {
      // Uploaded on the booking, the file points at it itself; linked later, a link row does.
      if (file.reservation_id === reservationId) await filesApi.update(tripId, file.id, { reservation_id: null })
      const { links = [] } = (await filesApi.getLinks(tripId, file.id)) as { links?: { id: number; reservation_id: number | null }[] }
      const link = links.find(l => l.reservation_id === reservationId)
      if (link) await filesApi.removeLink(tripId, file.id, link.id)
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Error unlinking file'))
    } finally {
      await get().loadFiles(tripId)
    }
  },
})
