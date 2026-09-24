/**
 * FE-ROADTRIP-HAZARDREPO-001 to FE-ROADTRIP-HAZARDREPO-002: the one read behind
 * the hazard overlay.
 *
 * The server keeps the feed for ten minutes and rebuilds it on the first read
 * after that: the GDACS event list and then its polygons, each allowed 15 s.
 * At the shared 8 s the browser gave up on exactly that read, the overlay
 * reported the feed as unavailable, and nothing asked again for ten minutes,
 * by which time the cache had expired once more. These cases pin the wait the
 * read carries, that the caller's signal still cuts it short, and that the
 * answer is parsed rather than trusted.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../api/client'
import { roadtripHazardsRepo, ROADTRIP_HAZARDS_TIMEOUT_MS } from './roadtripHazardsRepo'

vi.mock('../api/client', () => ({ apiClient: { get: vi.fn() } }))

const FEED = {
  fetchedAt: '2026-09-14T10:00:00.000Z',
  hazards: [
    {
      id: 'dwd-1',
      source: 'DWD',
      title: 'Sturmboeen',
      description: 'Boeen bis 85 km/h',
      updatedAt: '2026-09-14T10:00:00.000Z',
      validUntil: null,
      url: 'https://www.dwd.de/warnungen',
      geometry: { type: 'Point', coordinates: [13.4, 52.5] },
    },
  ],
  sources: [
    { source: 'DWD', status: 'ok' },
    { source: 'GDACS', status: 'partial' },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(apiClient.get).mockResolvedValue({ data: FEED })
})

describe('roadtripHazardsRepo', () => {
  it('FE-ROADTRIP-HAZARDREPO-001: waits long enough for the server to rebuild the feed, on the caller signal', async () => {
    const signal = new AbortController().signal

    await roadtripHazardsRepo.read(7, signal)

    expect(apiClient.get).toHaveBeenCalledWith('/trips/7/roadtrip/hazards', { signal, timeout: ROADTRIP_HAZARDS_TIMEOUT_MS })
    // The event list and then the polygons, 15 s each, plus parsing.
    expect(ROADTRIP_HAZARDS_TIMEOUT_MS).toBeGreaterThanOrEqual(30_000)
  })

  it('FE-ROADTRIP-HAZARDREPO-002: parses the answer and refuses one that does not match the contract', async () => {
    expect(await roadtripHazardsRepo.read(7, new AbortController().signal)).toEqual(FEED)

    vi.mocked(apiClient.get).mockResolvedValue({ data: { fetchedAt: 'yesterday', hazards: [], sources: [] } })
    await expect(roadtripHazardsRepo.read(7, new AbortController().signal)).rejects.toThrow()
  })
})
