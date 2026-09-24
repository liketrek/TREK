import { beforeEach, describe, expect, it, vi } from 'vitest'
import { chargingRepo } from './chargingRepo'
import { isEffectivelyOffline } from '../sync/networkMode'
import { apiClient } from '../api/client'

vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: vi.fn(() => false) }))
vi.mock('../api/client', () => ({ apiClient: { get: vi.fn(), post: vi.fn() } }))

const info = {
  checkedAt: new Date().toISOString(), status: 'ok' as const, station: 'Ladepark Nord',
  source: 'Operator', sourceUrl: 'https://example.com', license: 'CC-0',
  updatedAt: new Date().toISOString(), stale: false, available: 2, total: 4, unknown: 0,
  tariffs: [], pricesUnavailable: false,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(isEffectivelyOffline).mockReturnValue(false)
  vi.mocked(apiClient.post).mockResolvedValue({ data: info })
})

describe('charging data for a station that is not a stop yet', () => {
  it('FE-ROADTRIP-CHARGEREPO-001: asks the trip-scoped route with the coordinate and the name', async () => {
    expect(await chargingRepo.readAt(1, 48.137, 11.575, 'Ladepark Nord')).toEqual(info)
    expect(apiClient.post).toHaveBeenCalledWith('/trips/1/roadtrip/charging-lookup', { lat: 48.137, lng: 11.575, name: 'Ladepark Nord' })
    // Never the saved-stop route: that one takes a place id, which a hit found along
    // the route does not have.
    expect(apiClient.get).not.toHaveBeenCalled()
  })

  it('FE-ROADTRIP-CHARGEREPO-002: the same station twice is one request, a different one is another', async () => {
    const first = chargingRepo.readAt(2, 48.2, 11.2, 'Ladepark')
    const again = chargingRepo.readAt(2, 48.2, 11.2, 'Ladepark')
    expect(await first).toEqual(await again)
    expect(apiClient.post).toHaveBeenCalledTimes(1)
    // A charger 200 m down the road is a different charger, cache or no cache.
    await chargingRepo.readAt(2, 48.202, 11.2, 'Ladepark')
    expect(apiClient.post).toHaveBeenCalledTimes(2)
  })

  it('FE-ROADTRIP-CHARGEREPO-003: offline it refuses rather than queueing a read', async () => {
    vi.mocked(isEffectivelyOffline).mockReturnValue(true)
    await expect(chargingRepo.readAt(3, 48.3, 11.3, 'Ladepark')).rejects.toThrow('Offline')
    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('FE-ROADTRIP-CHARGEREPO-004: an answer that is not the contract is rejected, not rendered', async () => {
    // Availability is nullable on purpose and the panel branches on it; a string where
    // a count belongs must not reach it.
    vi.mocked(apiClient.post).mockResolvedValue({ data: { ...info, available: 'lots' } })
    await expect(chargingRepo.readAt(4, 48.4, 11.4, 'Ladepark')).rejects.toThrow()
  })
})
