import { useJourneyStore } from '../../store/journeyStore'
import { normalizeImageFiles } from '../../utils/convertHeic'
import { isVideoFile } from '../../utils/videoPoster'
import type { UploadProgress } from '../../utils/uploadQueue'

export interface StudioUploadOutcome {
  /** trek_photos ids of what arrived, in the order it was sent. */
  photoIds: number[]
  failed: number
  /** Left out before anything was sent, see below. */
  skippedVideos: number
}

export type StudioUploader = (
  files: File[],
  entryId: number | null,
  onProgress?: (p: UploadProgress) => void,
) => Promise<StudioUploadOutcome>

/**
 * Pictures into the journey without leaving Studio.
 *
 * Into an entry when one is named, into the gallery otherwise. The journey
 * store is what changes either way, so the content browser sees the new
 * pictures the way it sees any other; there is no second list to keep in
 * step. HEIC is converted first, exactly as the journal's own upload does it.
 *
 * Videos are left out rather than refused. A drop that carries a clip usually
 * carries pictures too, and failing the lot over one file would teach the
 * wrong lesson; a book holds pictures, and the count of what was skipped goes
 * back so the panel can say so.
 */
export async function uploadStudioPhotos(
  journeyId: number,
  files: File[],
  entryId: number | null,
  onProgress?: (p: UploadProgress) => void,
): Promise<StudioUploadOutcome> {
  const images = files.filter(f => !isVideoFile(f))
  const skippedVideos = files.length - images.length
  if (!images.length) return { photoIds: [], failed: 0, skippedVideos }

  const normalized = await normalizeImageFiles(images)
  const store = useJourneyStore.getState()
  const sent = entryId != null
    ? await store.uploadPhotos(entryId, normalized, { onProgress })
    : await store.uploadGalleryPhotos(journeyId, normalized, { onProgress })

  return {
    photoIds: sent.succeeded.map(p => p.photo_id),
    failed: sent.failed.length,
    skippedVideos,
  }
}
