// FE-API-COVER-001 to FE-API-COVER-003
import { describe, it, expect, vi, afterEach } from 'vitest'
import { apiClient, tripsApi, journeyApi } from './client'
import { collectionsApi } from './collections'

// Large cover images can take longer than the global 8s axios timeout to
// upload (#1495), so every cover upload has to opt out of it via timeout: 0,
// like the other multipart endpoints (journey photos, booking import).
describe('cover uploads disable the global request timeout', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  function spyPost() {
    return vi.spyOn(apiClient, 'post').mockResolvedValue({ data: {} } as any)
  }

  it('FE-API-COVER-001: tripsApi.uploadCover posts with timeout 0', async () => {
    const post = spyPost()
    await tripsApi.uploadCover(7, new FormData())
    expect(post).toHaveBeenCalledWith(
      '/trips/7/cover',
      expect.any(FormData),
      expect.objectContaining({ timeout: 0 }),
    )
  })

  it('FE-API-COVER-002: journeyApi.uploadCover posts with timeout 0', async () => {
    const post = spyPost()
    await journeyApi.uploadCover(7, new FormData())
    expect(post).toHaveBeenCalledWith(
      '/journeys/7/cover',
      expect.any(FormData),
      expect.objectContaining({ timeout: 0 }),
    )
  })

  it('FE-API-COVER-003: collectionsApi.uploadCover posts with timeout 0', async () => {
    const post = spyPost()
    await collectionsApi.uploadCover(7, new FormData())
    expect(post).toHaveBeenCalledWith(
      '/addons/collections/7/cover',
      expect.any(FormData),
      expect.objectContaining({ timeout: 0 }),
    )
  })
})
