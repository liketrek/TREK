import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { roadtripPreferencesRepo } from './roadtripPreferencesRepo'
import { offlineDb, clearAll } from '../db/offlineDb'
import { isEffectivelyOffline } from '../sync/networkMode'
import { mutationQueue } from '../sync/mutationQueue'
import { apiClient } from '../api/client'

vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: vi.fn(() => true) }))
vi.mock('../sync/authGate', () => ({ isAuthed: () => true }))
vi.mock('../api/client', () => ({ apiClient: { get: vi.fn(), put: vi.fn(), request: vi.fn() } }))

beforeEach(async () => {
  await clearAll()
  vi.clearAllMocks()
  vi.mocked(isEffectivelyOffline).mockReturnValue(true)
  await offlineDb.roadtripPreferences.put({ tripId: 9, preferences: { roadtrip_day_start: '08:00', roadtrip_day_end: '18:00', roadtrip_range_km: 120 } })
})

describe('trip driving preferences offline cache', () => {
  it('overlays queued changes and replays into the same trip', async () => {
    await roadtripPreferencesRepo.update(9, { roadtrip_range_km: 200 })
    expect((await roadtripPreferencesRepo.read(9)).roadtrip_range_km).toBe(200)
    expect((await offlineDb.roadtripPreferences.get(9))?.preferences.roadtrip_range_km).toBe(120)
    expect(await offlineDb.mutationQueue.toArray()).toEqual([expect.objectContaining({ tripId: 9, url: '/trips/9/roadtrip/preferences', method: 'PUT', body: { roadtrip_range_km: 200 } })])
    vi.mocked(isEffectivelyOffline).mockReturnValue(false)
    vi.mocked(apiClient.request).mockResolvedValue({ data: { tripId: 9, preferences: { roadtrip_range_km: 200 } } })
    await mutationQueue.flush()
    expect(await offlineDb.mutationQueue.count()).toBe(0)
    expect((await offlineDb.roadtripPreferences.get(9))?.preferences.roadtrip_range_km).toBe(200)
    expect(await offlineDb.roadtripPreferences.get(10)).toBeUndefined()
  })
  it('refuses an uncached trip and an invalid merged day window', async () => {
    await expect(roadtripPreferencesRepo.read(10)).rejects.toThrow('not available offline')
    await expect(roadtripPreferencesRepo.update(9, { roadtrip_day_end: '07:00' })).rejects.toThrow('Day end')
    expect(await offlineDb.mutationQueue.count()).toBe(0)
  })
  it('keeps cached preferences on a rejected online update', async () => {
    vi.mocked(isEffectivelyOffline).mockReturnValue(false)
    vi.mocked(apiClient.put).mockRejectedValue(new Error('Denied'))
    await expect(roadtripPreferencesRepo.update(9, { roadtrip_range_km: 999 })).rejects.toThrow('Denied')
    expect((await offlineDb.roadtripPreferences.get(9))?.preferences.roadtrip_range_km).toBe(120)
  })
})
