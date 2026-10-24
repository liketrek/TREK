import { filesApi } from '../api/client'
import { offlineDb, replaceTripRows } from '../db/offlineDb'
import { mutationQueue, generateUUID } from '../sync/mutationQueue'
import { isEffectivelyOffline } from '../sync/networkMode'
import { onlineThenCache } from './withOfflineFallback'
import type { TripFile } from '../types'
import type { FileLink, FileLinkRequest, FileUpdateRequest } from '@trek/shared'

/**
 * What the file writes that need the server throw offline: an upload, and the
 * removal of a further link (see removeLinkTo). The messages are translation
 * keys, so a view that shows the failure through translateApiError says why.
 */
export const NEEDS_CONNECTION = {
  uploadKey: 'files.uploadNeedsConnection',
  linkKey: 'files.linkNeedsConnection',
} as const

/**
 * A file the server answered with. The single-file routes answer the stored row
 * without the ids of its further links, so the ones the local copy has stay.
 */
async function keepLinks(file: TripFile | undefined): Promise<void> {
  if (!file || typeof file.id !== 'number') return
  const local = await offlineDb.tripFiles.get(file.id)
  await offlineDb.tripFiles.put({ ...local, ...file })
}

/** Queue a write to one file, held behind any older write to it. */
async function enqueueFileWrite(
  tripId: number | string,
  id: number,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body: unknown,
): Promise<void> {
  await mutationQueue.enqueue({
    id: generateUUID(),
    tripId: Number(tripId),
    method,
    url: `/trips/${tripId}/files/${id}${path}`,
    body,
    resource: 'tripFiles',
    entityId: id,
  })
  mutationQueue.sendSoon()
}

/** The local copy of a file with some fields changed, kept in Dexie. */
async function patchLocal(tripId: number | string, id: number, change: (file: TripFile) => Partial<TripFile>): Promise<TripFile> {
  const before = await offlineDb.tripFiles.get(id)
  const file = { ...(before ?? {}), ...(before ? change(before) : {}), id, trip_id: Number(tripId) } as TripFile
  await offlineDb.tripFiles.put(file)
  return file
}

function asId(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const id = Number(value)
  return Number.isFinite(id) ? id : null
}

/**
 * Files through the offline core. Reads fall back to the Dexie copy; a change to
 * a file made offline (its note, its place or booking, the star, a link, the
 * trash) lands there and in the mutation queue and replays once the connection
 * is back. File writes carry no version token, so an online write to a file that
 * still has an older one queued joins the queue behind it (mustQueue). An upload
 * cannot wait in the queue, so offline it is refused with a hint.
 */
export const fileRepo = {
  async list(tripId: number | string): Promise<{ files: TripFile[] }> {
    return onlineThenCache(
      async () => {
        const result = await filesApi.list(tripId)
        void replaceTripRows('tripFiles', Number(tripId), result.files)
        return result
      },
      async () => ({
        files: await offlineDb.tripFiles
          .where('trip_id').equals(Number(tripId)).toArray(),
      }),
    )
  },

  /** The trip's trashed files. Only the server has them. */
  async listTrash(tripId: number | string): Promise<{ files?: TripFile[] }> {
    return filesApi.list(tripId, true)
  },

  async upload(tripId: number | string, formData: FormData): Promise<{ file: TripFile }> {
    if (isEffectivelyOffline()) throw new Error(NEEDS_CONNECTION.uploadKey)
    const result: { file: TripFile } = await filesApi.upload(tripId, formData)
    await offlineDb.tripFiles.put(result.file)
    return result
  },

  async update(tripId: number | string, id: number, data: FileUpdateRequest): Promise<{ file: TripFile }> {
    if (!(await mutationQueue.mustQueue('tripFiles', id))) {
      const result: { file: TripFile } = await filesApi.update(tripId, id, data)
      await keepLinks(result.file)
      return result
    }
    const file = await patchLocal(tripId, id, () => ({
      ...(data.description === undefined ? {} : { description: data.description || null }),
      ...(data.place_id === undefined ? {} : { place_id: asId(data.place_id) }),
      ...(data.reservation_id === undefined ? {} : { reservation_id: asId(data.reservation_id) }),
    }))
    await enqueueFileWrite(tripId, id, 'PUT', '', data)
    return { file }
  },

  async toggleStar(tripId: number | string, id: number): Promise<{ file: TripFile }> {
    if (!(await mutationQueue.mustQueue('tripFiles', id))) {
      const result: { file: TripFile } = await filesApi.toggleStar(tripId, id)
      await keepLinks(result.file)
      return result
    }
    // The server flips the star, so each queued toggle flips it once more.
    const file = await patchLocal(tripId, id, before => ({ starred: before.starred ? 0 : 1 }))
    await enqueueFileWrite(tripId, id, 'PATCH', '/star', undefined)
    return { file }
  },

  /** Moves a file to the trash. */
  async delete(tripId: number | string, id: number): Promise<void> {
    if (!(await mutationQueue.mustQueue('tripFiles', id))) {
      await filesApi.delete(tripId, id)
      await offlineDb.tripFiles.delete(id)
      return
    }
    await offlineDb.tripFiles.delete(id)
    await enqueueFileWrite(tripId, id, 'DELETE', '', undefined)
  },

  /**
   * Brings a trashed file back. Offline the trash row the view shows, when it
   * has one, is what the list gets until the server answers.
   */
  async restore(tripId: number | string, id: number, trashed?: TripFile): Promise<void> {
    if (!(await mutationQueue.mustQueue('tripFiles', id))) {
      const result: { file: TripFile } = await filesApi.restore(tripId, id)
      await keepLinks(result.file)
      return
    }
    if (trashed) await offlineDb.tripFiles.put({ ...trashed, deleted_at: null })
    await enqueueFileWrite(tripId, id, 'POST', '/restore', undefined)
  },

  async permanentDelete(tripId: number | string, id: number): Promise<void> {
    if (!(await mutationQueue.mustQueue('tripFiles', id))) {
      await filesApi.permanentDelete(tripId, id)
      return
    }
    await enqueueFileWrite(tripId, id, 'DELETE', '/permanent', undefined)
  },

  /** Empties the trash. Offline it waits in the queue behind the files moved there before. */
  async emptyTrash(tripId: number | string): Promise<void> {
    if (!isEffectivelyOffline()) {
      await filesApi.emptyTrash(tripId)
      return
    }
    await mutationQueue.enqueue({
      id: generateUUID(),
      tripId: Number(tripId),
      method: 'DELETE',
      url: `/trips/${tripId}/files/trash/empty`,
      body: undefined,
    })
  },

  /** Links a file to one more place or booking, beside the one in its own column. */
  async addLink(tripId: number | string, id: number, link: FileLinkRequest): Promise<void> {
    if (!(await mutationQueue.mustQueue('tripFiles', id))) {
      await filesApi.addLink(tripId, id, link)
      return
    }
    const placeId = asId(link.place_id)
    const reservationId = asId(link.reservation_id)
    await patchLocal(tripId, id, before => ({
      ...(placeId === null ? {} : { linked_place_ids: [...(before.linked_place_ids || []), placeId] }),
      ...(reservationId === null ? {} : { linked_reservation_ids: [...(before.linked_reservation_ids || []), reservationId] }),
    }))
    await enqueueFileWrite(tripId, id, 'POST', '/link', link)
  },

  /**
   * Removes the further link `matches` picks. The route names the link row by its
   * own id, which only the server knows, so this needs a connection; online it
   * first lets the older queued writes to the file through, a link added offline
   * among them.
   */
  async removeLinkTo(tripId: number | string, id: number, matches: (link: FileLink) => boolean): Promise<void> {
    if (isEffectivelyOffline()) throw new Error(NEEDS_CONNECTION.linkKey)
    if (await mutationQueue.mustQueue('tripFiles', id)) await mutationQueue.flush()
    const { links = [] } = (await filesApi.getLinks(tripId, id)) as { links?: FileLink[] }
    const link = links.find(matches)
    if (link) await filesApi.removeLink(tripId, id, link.id)
  },
}
