// FE-REPO-RESV-001 to FE-REPO-RESV-004
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { http, HttpResponse } from 'msw'
import { server } from '../../tests/helpers/msw/server'
import { reservationRepo } from './reservationRepo'
import { offlineDb, clearAll } from '../db/offlineDb'
import { buildReservation } from '../../tests/helpers/factories'

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

describe('reservationRepo.list', () => {
  it('FE-REPO-RESV-001: online — returns REST reservations and caches them', async () => {
    const reservation = buildReservation({ id: 71, trip_id: 14, title: 'Sushi Bar' })
    server.use(http.get('/api/trips/14/reservations', () => HttpResponse.json({ reservations: [reservation] })))

    const result = await reservationRepo.list(14)
    expect(result.reservations.map(r => r.title)).toEqual(['Sushi Bar'])

    await new Promise(r => setTimeout(r, 0))
    expect((await offlineDb.reservations.get(71))!.title).toBe('Sushi Bar')
  })

  it('FE-REPO-RESV-002: offline — returns only this trip\'s cached reservations', async () => {
    await offlineDb.reservations.bulkPut([
      buildReservation({ id: 72, trip_id: 14 }),
      buildReservation({ id: 73, trip_id: 15 }),
    ])
    setOnline(false)

    const result = await reservationRepo.list('14')
    expect(result.reservations.map(r => r.id)).toEqual([72])
  })

  it('FE-REPO-RESV-003: offline with an empty cache — returns an empty list', async () => {
    setOnline(false)
    expect((await reservationRepo.list(404)).reservations).toEqual([])
  })

  it('FE-REPO-RESV-004: a 500 is rethrown, not masked by the cache', async () => {
    server.use(http.get('/api/trips/14/reservations', () => HttpResponse.json({ error: 'boom' }, { status: 500 })))
    await expect(reservationRepo.list(14)).rejects.toThrow()
  })
})
