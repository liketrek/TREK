// FE-API-UPLOAD-001 to FE-API-UPLOAD-013
//
// The shared axios instance carries timeout: 8000, and axios' timeout is a whole-request
// deadline — not an idle one. Any upload whose body takes longer than 8s to push is
// aborted mid-stream and the server reports a multer "Request aborted" (#1495).
//
// The original fix added `timeout: 0` to the three cover uploads by hand, which left the
// same bug live on 7 other endpoints — including the two that accept 500 MB (documents
// and backup restore). Every multipart call now goes through postMultipart(), so this
// suite pins ALL of them, not just the covers.
import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  apiClient,
  authApi,
  tripsApi,
  placesApi,
  adminApi,
  journeyApi,
  filesApi,
  reservationsApi,
  collabApi,
  backupApi,
} from './client'
import { collectionsApi } from './collections'

describe('every multipart upload disables the global request timeout', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  function spyPost() {
    return vi.spyOn(apiClient, 'post').mockResolvedValue({ data: {} } as any)
  }

  const fd = () => new FormData()
  const file = () => new File(['x'], 'f.bin')

  // [id, description, invoke, expected url]
  const cases: [string, string, () => Promise<unknown>, string][] = [
    ['FE-API-UPLOAD-001', 'authApi.uploadAvatar (5 MB)', () => authApi.uploadAvatar(fd()), '/auth/avatar'],
    ['FE-API-UPLOAD-002', 'tripsApi.uploadCover (20 MB)', () => tripsApi.uploadCover(7, fd()), '/trips/7/cover'],
    ['FE-API-UPLOAD-003', 'placesApi.importGpx (10 MB)', () => placesApi.importGpx(7, file()), '/trips/7/places/import/gpx'],
    ['FE-API-UPLOAD-004', 'placesApi.importMapFile (10 MB)', () => placesApi.importMapFile(7, file()), '/trips/7/places/import/map'],
    ['FE-API-UPLOAD-005', 'adminApi.pluginUpload (50 MB)', () => adminApi.pluginUpload(file()), '/admin/plugins/upload'],
    ['FE-API-UPLOAD-006', 'journeyApi.uploadCover (20 MB)', () => journeyApi.uploadCover(7, fd()), '/journeys/7/cover'],
    ['FE-API-UPLOAD-007', 'journeyApi.uploadPhotos (20 MB)', () => journeyApi.uploadPhotos(7, fd()), '/journeys/entries/7/photos'],
    ['FE-API-UPLOAD-008', 'journeyApi.uploadGalleryVideo (500 MB)', () => journeyApi.uploadGalleryVideo(7, fd()), '/journeys/7/gallery/video'],
    ['FE-API-UPLOAD-009', 'filesApi.upload (500 MB)', () => filesApi.upload(7, fd()), '/trips/7/files'],
    ['FE-API-UPLOAD-010', 'collabApi.uploadNoteFile (50 MB)', () => collabApi.uploadNoteFile(7, 3, fd()), '/trips/7/collab/notes/3/files'],
    ['FE-API-UPLOAD-011', 'backupApi.uploadRestore (500 MB)', () => backupApi.uploadRestore(file()), '/backup/upload-restore'],
    ['FE-API-UPLOAD-012', 'collectionsApi.uploadCover (20 MB)', () => collectionsApi.uploadCover(7, fd()), '/addons/collections/7/cover'],
  ]

  for (const [id, desc, invoke, url] of cases) {
    it(`${id}: ${desc} posts with timeout 0`, async () => {
      const post = spyPost()
      await invoke()
      expect(post).toHaveBeenCalledWith(
        url,
        expect.any(FormData),
        expect.objectContaining({ timeout: 0 }),
      )
    })
  }

  it('FE-API-UPLOAD-013: reservationsApi booking import posts with timeout 0', async () => {
    const post = spyPost()
    await reservationsApi.importBookingPreview(7, [file()])
    expect(post).toHaveBeenCalledWith(
      '/trips/7/reservations/import/booking',
      expect.any(FormData),
      expect.objectContaining({ timeout: 0 }),
    )
  })
})
