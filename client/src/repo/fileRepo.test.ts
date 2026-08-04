// FE-REPO-FILE-001 to FE-REPO-FILE-004
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { http, HttpResponse } from 'msw'
import { server } from '../../tests/helpers/msw/server'
import { fileRepo } from './fileRepo'
import { offlineDb, clearAll } from '../db/offlineDb'
import { buildTripFile } from '../../tests/helpers/factories'

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

describe('fileRepo.list', () => {
  it('FE-REPO-FILE-001: online — returns REST files and caches them', async () => {
    const file = buildTripFile({ id: 41, trip_id: 7, original_name: 'booking.pdf' })
    server.use(http.get('/api/trips/7/files', () => HttpResponse.json({ files: [file] })))

    const result = await fileRepo.list(7)
    expect(result.files.map(f => f.original_name)).toEqual(['booking.pdf'])

    await new Promise(r => setTimeout(r, 0))
    expect((await offlineDb.tripFiles.get(41))!.original_name).toBe('booking.pdf')
  })

  it('FE-REPO-FILE-002: offline — returns only this trip\'s cached files', async () => {
    await offlineDb.tripFiles.bulkPut([
      buildTripFile({ id: 42, trip_id: 7 }),
      buildTripFile({ id: 43, trip_id: 8 }),
    ])
    setOnline(false)

    const result = await fileRepo.list('7')
    expect(result.files.map(f => f.id)).toEqual([42])
  })

  it('FE-REPO-FILE-003: offline with an empty cache — returns an empty list', async () => {
    setOnline(false)
    expect((await fileRepo.list(404)).files).toEqual([])
  })

  it('FE-REPO-FILE-004: a 403 is rethrown so the caller can show the error', async () => {
    server.use(http.get('/api/trips/7/files', () => HttpResponse.json({ error: 'forbidden' }, { status: 403 })))
    await expect(fileRepo.list(7)).rejects.toThrow()
  })
})
