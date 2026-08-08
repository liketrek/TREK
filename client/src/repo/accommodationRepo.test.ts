// FE-REPO-ACCOM-001 to FE-REPO-ACCOM-006
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { http, HttpResponse } from 'msw'
import { server } from '../../tests/helpers/msw/server'
import { accommodationRepo } from './accommodationRepo'
import { offlineDb, clearAll } from '../db/offlineDb'
import type { Accommodation } from '../types'

function buildAccommodation(overrides: Partial<Accommodation> = {}): Accommodation {
  return {
    id: 1,
    trip_id: 16,
    start_day_id: 1,
    end_day_id: 2,
    check_in: '15:00',
    check_out: '11:00',
    place_name: 'Hotel Central',
    ...overrides,
  } as Accommodation
}

function setOnline(v: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value: v, writable: true, configurable: true })
}

beforeEach(async () => {
  await clearAll()
  setOnline(true)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('accommodationRepo.list', () => {
  it('FE-REPO-ACCOM-001: online — returns REST accommodations and caches them', async () => {
    const accommodation = buildAccommodation({ id: 81, trip_id: 16 })
    server.use(http.get('/api/trips/16/accommodations', () => HttpResponse.json({ accommodations: [accommodation] })))

    const result = await accommodationRepo.list(16)
    expect(result.accommodations.map(a => a.id)).toEqual([81])

    await new Promise(r => setTimeout(r, 0))
    expect((await offlineDb.accommodations.get(81))!.place_name).toBe('Hotel Central')
  })

  it('FE-REPO-ACCOM-002: online — a payload without the array does not break the upsert', async () => {
    server.use(http.get('/api/trips/16/accommodations', () => HttpResponse.json({})))

    const result = await accommodationRepo.list(16)
    expect(result.accommodations).toBeUndefined()

    await new Promise(r => setTimeout(r, 0))
    expect(await offlineDb.accommodations.count()).toBe(0)
  })

  it('FE-REPO-ACCOM-003: offline — returns only this trip\'s cached accommodations', async () => {
    await offlineDb.accommodations.bulkPut([
      buildAccommodation({ id: 82, trip_id: 16 }),
      buildAccommodation({ id: 83, trip_id: 17 }),
    ])
    setOnline(false)

    const result = await accommodationRepo.list('16')
    expect(result.accommodations.map(a => a.id)).toEqual([82])
  })

  it('FE-REPO-ACCOM-004: offline with an empty cache — returns an empty list', async () => {
    setOnline(false)
    expect((await accommodationRepo.list(404)).accommodations).toEqual([])
  })

  it('FE-REPO-ACCOM-005: a 500 is rethrown, not masked by the cache', async () => {
    server.use(http.get('/api/trips/16/accommodations', () => HttpResponse.json({ error: 'boom' }, { status: 500 })))
    await expect(accommodationRepo.list(16)).rejects.toThrow()
  })

  it('FE-REPO-ACCOM-006: a failing cache write does not break the online read', async () => {
    vi.spyOn(offlineDb.accommodations, 'bulkPut').mockRejectedValue(new Error('quota exceeded'))
    server.use(http.get('/api/trips/16/accommodations', () =>
      HttpResponse.json({ accommodations: [buildAccommodation({ id: 84 })] })))

    const result = await accommodationRepo.list(16)
    expect(result.accommodations.map(a => a.id)).toEqual([84])
  })
})
