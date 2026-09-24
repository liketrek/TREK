import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useJourneyStore } from '../../../src/store/journeyStore'
import { uploadStudioPhotos } from '../../../src/components/Studio/studioUpload'

/**
 * Pictures into the journey from inside Studio (#2064).
 *
 * The two things worth pinning are where a picture goes and what happens to
 * what is not a picture. The target follows the caller: an entry when the
 * content browser is filtered to one, the gallery otherwise, and both write
 * through the journey store so the journal sees the upload the moment the
 * panel does. A video is left out rather than refused, because a drop that
 * carries a clip usually carries photographs as well and failing the lot over
 * one file would be the wrong lesson.
 */

vi.mock('../../../src/utils/convertHeic', () => ({
  // The real one decodes HEIC through a worker. What matters here is that the
  // files reach the store, not how they were converted on the way.
  normalizeImageFiles: vi.fn(async (files: File[]) => files),
}))

const jpeg = (name = 'shrine.jpg') => new File(['x'], name, { type: 'image/jpeg' })
const mp4 = () => new File(['x'], 'clip.mp4', { type: 'video/mp4' })

const uploadPhotos = vi.fn()
const uploadGalleryPhotos = vi.fn()

beforeEach(() => {
  uploadPhotos.mockReset().mockResolvedValue({ succeeded: [{ photo_id: 11 }, { photo_id: 12 }], failed: [] })
  uploadGalleryPhotos.mockReset().mockResolvedValue({ succeeded: [{ photo_id: 21 }], failed: [] })
  useJourneyStore.setState({ uploadPhotos, uploadGalleryPhotos } as never)
})

describe('uploadStudioPhotos', () => {
  it('puts the pictures on the entry it was given, and answers with their ids', async () => {
    const outcome = await uploadStudioPhotos(50, [jpeg(), jpeg('two.jpg')], 7)

    expect(uploadPhotos).toHaveBeenCalledTimes(1)
    expect(uploadPhotos.mock.calls[0][0]).toBe(7)
    expect(uploadGalleryPhotos).not.toHaveBeenCalled()
    expect(outcome).toEqual({ photoIds: [11, 12], failed: 0, skippedVideos: 0 })
  })

  it('puts them in the gallery when no entry is named', async () => {
    const outcome = await uploadStudioPhotos(50, [jpeg()], null)

    expect(uploadGalleryPhotos.mock.calls[0][0]).toBe(50)
    expect(uploadPhotos).not.toHaveBeenCalled()
    expect(outcome.photoIds).toEqual([21])
  })

  it('counts what did not arrive', async () => {
    uploadGalleryPhotos.mockResolvedValue({ succeeded: [{ photo_id: 21 }], failed: [jpeg('lost.jpg')] })

    expect(await uploadStudioPhotos(50, [jpeg(), jpeg('lost.jpg')], null))
      .toEqual({ photoIds: [21], failed: 1, skippedVideos: 0 })
  })

  it('leaves a video out and sends the photographs beside it anyway', async () => {
    const outcome = await uploadStudioPhotos(50, [jpeg(), mp4()], null)

    expect(uploadGalleryPhotos.mock.calls[0][1]).toHaveLength(1)
    expect(outcome.skippedVideos).toBe(1)
    expect(outcome.photoIds).toEqual([21])
  })

  it('sends nothing at all when the drop was only videos', async () => {
    const outcome = await uploadStudioPhotos(50, [mp4(), mp4()], null)

    expect(uploadGalleryPhotos).not.toHaveBeenCalled()
    expect(outcome).toEqual({ photoIds: [], failed: 0, skippedVideos: 2 })
  })

  it('reports progress to whoever asked for it', async () => {
    const onProgress = vi.fn()
    await uploadStudioPhotos(50, [jpeg()], null, onProgress)

    expect(uploadGalleryPhotos.mock.calls[0][2]).toEqual({ onProgress })
  })
})
